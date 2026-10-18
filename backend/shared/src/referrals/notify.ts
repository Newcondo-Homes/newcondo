// backend/shared/src/referrals/notify.ts — spec §15
// Maps referral events → dashboard notification + branded email.
// Rule: each party only ever hears about THEIR side. Referrer-side amounts go
// to the referrer, referee-side to the referee, overrides only to the agent.
// Dashboard notifications are idempotent per (entityId, title) via the
// ledger-entry id passed as entityId.
// SMS: the backend has no SMS sender yet; when one lands, add it in `send()`
// for kinds marked `sms: true`.
import { prisma } from "@newcondo/db";
import { publishNotification } from "../utils/notificationBus";
import { sendBrandedEmail } from "../utils/emailService";
import { ReferralEmailTemplates as T } from "../utils/emailTemplates.referrals";
import { maskName } from "./names";

type Kind =
  | { kind: "SIGNED_UP"; referrerId: string; refereeName: string | null; referralId: string }
  | { kind: "UNDER_REVIEW"; referrerId: string; refereeName: string | null; referralId: string }
  | { kind: "ACTIVATED"; referrerId: string; refereeName: string | null; referralId: string }
  | { kind: "SCHEDULED"; userId: string; amountKobo: bigint; availableAt: Date; ledgerId: string }
  | { kind: "AVAILABLE"; userId: string; amountKobo: bigint; expiresAt: Date | null; ledgerId: string }
  | { kind: "EXPIRING"; userId: string; amountKobo: bigint; expiresAt: Date; ledgerId: string }
  | { kind: "MILESTONE"; userId: string; title: string; expiresAt: Date | null; ledgerId: string; pendingFunding: boolean }
  | { kind: "OVERRIDE_PAID"; userId: string; amountKobo: bigint; landlordName: string | null; ledgerId: string }
  | { kind: "VOIDED"; userId: string; amountKobo: bigint; ledgerId: string }
  | { kind: "CREDIT_APPLIED"; userId: string; amountKobo: bigint; invoiceId: string };

const naira = (k: bigint) => Number(k) / 100;
const fmt = (k: bigint) => `₦${naira(k).toLocaleString("en-NG")}`;
const day = (d: Date | null) => (d ? d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—");

async function contact(userId: string) {
  return prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
}
const first = (n?: string | null) => (n ?? "there").split(" ")[0];

async function safe(p: Promise<unknown>) {
  try { await p; } catch (e) { console.error("[referrals.notify]", (e as Error).message); }
}

export async function notifyReferral(k: Kind): Promise<void> {
  switch (k.kind) {
    case "SIGNED_UP":
    case "UNDER_REVIEW":
    case "ACTIVATED": {
      const u = await contact(k.referrerId);
      const who = maskName(k.refereeName);
      const copy = {
        SIGNED_UP: ["Your invite signed up", `${who} joined with your link. You earn when their first payment clears.`],
        UNDER_REVIEW: ["Referral under review", `We're doing a routine check on a recent referral (${who}). Nothing for you to do.`],
        ACTIVATED: ["Referral activated", `${who}'s first payment cleared.`],
      }[k.kind];
      await safe(publishNotification({ userId: k.referrerId, kind: "referral", title: copy[0], body: copy[1], to: "/referrals", entityType: "referral", entityId: k.referralId }));
      if (u?.email && k.kind !== "UNDER_REVIEW") {
        await safe(sendBrandedEmail(u.email, k.kind === "SIGNED_UP" ? T.signedUp({ name: first(u.name), refereeName: who }) : T.activated({ name: first(u.name), refereeName: who })));
      }
      return;
    }
    case "SCHEDULED":
      await safe(publishNotification({ userId: k.userId, kind: "referral", title: "Referral reward scheduled", body: `${fmt(k.amountKobo)} credit becomes available on ${day(k.availableAt)}.`, to: "/referrals", entityType: "referralLedger", entityId: k.ledgerId }));
      return;
    case "AVAILABLE": {
      const u = await contact(k.userId);
      await safe(publishNotification({ userId: k.userId, kind: "referral", title: `${fmt(k.amountKobo)} credit added`, body: "It applies automatically to your next subscription charge.", to: "/referrals", entityType: "referralLedger", entityId: k.ledgerId }));
      if (u?.email) await safe(sendBrandedEmail(u.email, T.creditAvailable({ name: first(u.name), amountNaira: naira(k.amountKobo), expiresOn: day(k.expiresAt) })));
      return;
    }
    case "EXPIRING": {
      const u = await contact(k.userId);
      await safe(publishNotification({ userId: k.userId, kind: "referral", title: "Credit expiring soon", body: `${fmt(k.amountKobo)} expires on ${day(k.expiresAt)}.`, to: "/referrals", entityType: "referralLedger", entityId: k.ledgerId }));
      if (u?.email) await safe(sendBrandedEmail(u.email, T.creditExpiring({ name: first(u.name), amountNaira: naira(k.amountKobo), expiresOn: day(k.expiresAt) })));
      return;
    }
    case "MILESTONE": {
      if (k.pendingFunding) return; // internal state — the admin dashboard surfaces it
      const u = await contact(k.userId);
      await safe(publishNotification({ userId: k.userId, kind: "referral", title: `Unlocked: ${k.title}`, body: "Book it from your referral page.", to: "/referrals", entityType: "referralLedger", entityId: k.ledgerId }));
      if (u?.email) await safe(sendBrandedEmail(u.email, T.milestoneUnlocked({ name: first(u.name), title: k.title, expiresOn: day(k.expiresAt) })));
      return;
    }
    case "OVERRIDE_PAID": {
      const u = await contact(k.userId);
      const landlord = first(k.landlordName);
      await safe(publishNotification({ userId: k.userId, kind: "wallet", title: "Founding Agent Override paid", body: `${fmt(k.amountKobo)} from rent on ${landlord}'s property is in your wallet.`, to: "/wallet", entityType: "referralLedger", entityId: k.ledgerId }));
      if (u?.email) await safe(sendBrandedEmail(u.email, T.overridePaid({ name: first(u.name), amountNaira: naira(k.amountKobo), landlordFirstName: landlord })));
      return;
    }
    case "VOIDED": {
      const u = await contact(k.userId);
      await safe(publishNotification({ userId: k.userId, kind: "referral", title: "A referral reward was reversed", body: `${fmt(k.amountKobo)} of unused credit was removed because the payment behind it was refunded.`, to: "/referrals", entityType: "referralLedger", entityId: k.ledgerId }));
      if (u?.email) await safe(sendBrandedEmail(u.email, T.rewardVoided({ name: first(u.name), amountNaira: naira(k.amountKobo) })));
      return;
    }
    case "CREDIT_APPLIED":
      await safe(publishNotification({ userId: k.userId, kind: "payment", title: "Referral credit applied", body: `${fmt(k.amountKobo)} came off your subscription charge.`, to: "/referrals", entityType: "subscriptionInvoice", entityId: k.invoiceId }));
      return;
  }
}
