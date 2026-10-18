// backend/shared/src/referrals/ledger.ts — reward lifecycle (spec §8.3, §10.1.8, §12)
import { prisma } from "@newcondo/db";
import { CREDIT_EXPIRY_WARNING_DAYS } from "./limits";
import { notifyReferral } from "./notify";
import { onBusinessEvent } from "./evaluate";
import type { BusinessEvent } from "./rule-types";

const DAY = 24 * 3600_000;

/** Cron — SCHEDULED → AVAILABLE once the hold has passed. */
export async function releaseScheduledRewards(now = new Date()): Promise<number> {
  const due = await prisma.referralLedgerEntry.findMany({ where: { status: "SCHEDULED", availableAt: { lte: now } }, take: 500 });
  for (const e of due) {
    const { count } = await prisma.referralLedgerEntry.updateMany({ where: { id: e.id, status: "SCHEDULED" }, data: { status: "AVAILABLE" } });
    if (count) await notifyReferral({ kind: "AVAILABLE", userId: e.userId, amountKobo: e.amountKobo, expiresAt: e.expiresAt, ledgerId: e.id });
  }
  return due.length;
}

/** Cron — expire lapsed credit; warn CREDIT_EXPIRY_WARNING_DAYS before. */
export async function expireCredits(now = new Date()): Promise<{ expired: number; warned: number }> {
  const { count: expired } = await prisma.referralLedgerEntry.updateMany({
    where: { status: { in: ["AVAILABLE", "PARTIALLY_REDEEMED"] }, expiresAt: { lte: now } },
    data: { status: "EXPIRED" },
  });
  // Warn once: entries crossing the warning line within the last day.
  const from = new Date(now.getTime() + (CREDIT_EXPIRY_WARNING_DAYS - 1) * DAY);
  const to = new Date(now.getTime() + CREDIT_EXPIRY_WARNING_DAYS * DAY);
  const soon = await prisma.referralLedgerEntry.findMany({ where: { status: { in: ["AVAILABLE", "PARTIALLY_REDEEMED"] }, expiresAt: { gt: from, lte: to } } });
  for (const e of soon) {
    await notifyReferral({ kind: "EXPIRING", userId: e.userId, amountKobo: e.amountKobo - e.redeemedKobo, expiresAt: e.expiresAt!, ledgerId: e.id });
  }
  return { expired, warned: soon.length };
}

/** §8.3 — refund / chargeback / cancelled rent. Unredeemed reward → VOIDED.
 *  Redeemed portions stay (Newcondo absorbs; logged CLAWBACK_LOSS). A wallet
 *  override already paid is NEVER auto-debited: a CLAWBACK row is raised for
 *  an admin to act on (D10). */
export async function voidBySource(sourceType: string, sourceId: string, reason: string): Promise<{ voided: number; clawbacks: number }> {
  const entries = await prisma.referralLedgerEntry.findMany({ where: { sourceType, sourceId, status: { not: "VOIDED" }, kind: { not: "CLAWBACK" } } });
  let voided = 0, clawbacks = 0;
  for (const e of entries) {
    if (e.status === "PAID_OUT") {
      await prisma.referralLedgerEntry.upsert({
        where: { sourceType_sourceId_ruleId_userId: { sourceType: `CLAWBACK:${sourceType}`, sourceId, ruleId: e.ruleId, userId: e.userId } },
        create: { userId: e.userId, referralId: e.referralId, ruleId: e.ruleId, sourceType: `CLAWBACK:${sourceType}`, sourceId, kind: "CLAWBACK", status: "SCHEDULED", amountKobo: -e.amountKobo, availableAt: new Date(), voidReason: reason },
        update: {},
      });
      clawbacks++;
      continue;
    }
    const unredeemed = e.amountKobo - e.redeemedKobo;
    if (e.redeemedKobo > 0n) {
      console.warn(`[referrals] CLAWBACK_LOSS ledger=${e.id} absorbed=${e.redeemedKobo} kobo reason=${reason}`);
      await prisma.referralLedgerEntry.update({ where: { id: e.id }, data: { amountKobo: e.redeemedKobo, status: "REDEEMED", voidReason: `partial void: ${reason}` } });
    } else {
      await prisma.referralLedgerEntry.update({ where: { id: e.id }, data: { status: "VOIDED", voidedAt: new Date(), voidReason: reason } });
    }
    voided++;
    if (unredeemed > 0n) await notifyReferral({ kind: "VOIDED", userId: e.userId, amountKobo: unredeemed, ledgerId: e.id });
  }
  return { voided, clawbacks };
}

/* ---------------- admin actions (§12) ---------------- */

/** Clear a fraud hold and REPLAY every event that was skipped because of it. */
export async function clearFraudHold(referralId: string): Promise<{ replayed: number }> {
  await prisma.referral.update({ where: { id: referralId }, data: { fraudHold: false, fraudReason: null } });
  const held = await prisma.referralEvent.findMany({ where: { referralId, outcome: "SKIPPED", skipReason: "fraud_hold" }, orderBy: { createdAt: "asc" } });
  const payloads = new Map<string, BusinessEvent>();
  for (const h of held) if (h.payload) payloads.set(`${h.sourceType}:${h.sourceId}`, h.payload as unknown as BusinessEvent);
  await prisma.referralEvent.deleteMany({ where: { id: { in: held.map((h) => h.id) } } });
  for (const ev of payloads.values()) await onBusinessEvent(ev);
  return { replayed: payloads.size };
}

export async function voidReferral(referralId: string, reason: string): Promise<void> {
  await prisma.referral.update({ where: { id: referralId }, data: { status: "VOID", fraudReason: reason } });
  const open = await prisma.referralLedgerEntry.findMany({ where: { referralId, status: { in: ["SCHEDULED", "AVAILABLE", "PENDING_FUNDING"] }, redeemedKobo: 0n } });
  for (const e of open) {
    await prisma.referralLedgerEntry.update({ where: { id: e.id }, data: { status: "VOIDED", voidedAt: new Date(), voidReason: reason } });
  }
}
