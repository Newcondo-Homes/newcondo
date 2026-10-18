// backend/shared/src/referrals/attribution.ts — spec §11
// Codes, click tracking, attribution at signup, activation.
// Referral codes are their OWN namespace: /r/<code>. Share links (/share/…),
// tenant invites (/tenant-invite/…) and sub-agent promo links never create
// Referral rows.
import { randomInt } from "crypto";
import { prisma } from "@newcondo/db";
import { COMPANY } from "../constants/business";
import { attributionFraudReason, hashId } from "./fraud";
import { notifyReferral } from "./notify";
import { maskName } from "./names";
export { maskName };

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
const looksGenerated = (c: string) => !c.includes("-") && c.length >= 20; // the cuid default

/** NAME-XXXX, generated lazily. Users created before v2 carry the schema's
 *  cuid default — replaced on first use with a readable one. Existing share
 *  links store their full code, so changing this never breaks them. */
export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true, name: true } });
  if (!u) throw new Error("User not found");
  if (u.referralCode && !looksGenerated(u.referralCode)) return u.referralCode;
  const base = (u.name ?? "NC").normalize("NFKD").replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase() || "NC";
  for (let i = 0; i < 8; i++) {
    const tail = Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
    const code = `${base}-${tail}`;
    try {
      await prisma.user.update({ where: { id: userId }, data: { referralCode: code } });
      return code;
    } catch { /* unique collision — retry */ }
  }
  throw new Error("Could not allocate a referral code");
}

export const referralLinkFor = (code: string) => `${COMPANY.domain}/r/${code}`;

async function referrerByCode(code: string) {
  return prisma.user.findFirst({
    where: { referralCode: { equals: code.trim(), mode: "insensitive" }, referralCodeDisabledAt: null },
    select: { id: true, name: true },
  });
}

/** GET /r/:code — public, rate-limited at the route. */
export async function recordReferralClick(code: string, ctx: { ip?: string; device?: string }): Promise<{ valid: boolean }> {
  const ref = await referrerByCode(code);
  if (!ref) return { valid: false };
  await prisma.referralLinkClick.create({ data: { referrerId: ref.id, code, ipHash: hashId(ctx.ip), deviceHash: hashId(ctx.device) } });
  return { valid: true };
}

export interface AttributionInput {
  manualCode?: string | null;
  queryCode?: string | null;
  cookieCode?: string | null;
  source?: "LINK" | "CODE_ENTRY" | "INVITE";
  ip?: string;
  device?: string;
}

/** Create the immutable Referral row at signup. Never blocks signup: every
 *  rejection (unknown code, self, cycle, already attributed) is silent. */
export async function attributeReferral(newUserId: string, input: AttributionInput): Promise<{ referralId: string } | null> {
  const code = input.manualCode || input.queryCode || input.cookieCode;
  if (!code) return null;
  const ref = await referrerByCode(code);
  if (!ref || ref.id === newUserId) return null;

  const existing = await prisma.referral.findUnique({ where: { referredId: newUserId }, select: { id: true } });
  if (existing) return { referralId: existing.id };

  // Cycle: the referrer was themselves referred (directly or up the chain) by the new user.
  let cursor: string | null = ref.id;
  for (let depth = 0; cursor && depth < 10; depth++) {
    const up: { referrerId: string } | null = await prisma.referral.findUnique({ where: { referredId: cursor }, select: { referrerId: true } });
    if (!up) break;
    if (up.referrerId === newUserId) return null;
    cursor = up.referrerId;
  }

  const ipHash = hashId(input.ip);
  const deviceHash = hashId(input.device);
  const fraudReason = await attributionFraudReason({ referrerId: ref.id, refereeId: newUserId, ipHash, deviceHash });

  const row = await prisma.referral.create({
    data: {
      referrerId: ref.id,
      referredId: newUserId,
      referralCode: code,
      source: input.source ?? (input.manualCode ? "CODE_ENTRY" : "LINK"),
      status: "PENDING",
      signupIpHash: ipHash,
      deviceHash,
      fraudHold: !!fraudReason,
      fraudReason,
    },
    select: { id: true },
  });

  const referee = await prisma.user.findUnique({ where: { id: newUserId }, select: { name: true } });
  await notifyReferral({ kind: fraudReason ? "UNDER_REVIEW" : "SIGNED_UP", referrerId: ref.id, refereeName: referee?.name ?? null, referralId: row.id });
  return { referralId: row.id };
}

/** POST /referrals/code/apply — onboarding only. Once a user has paid for
 *  anything they can no longer be attributed retroactively. */
export async function applyReferralCode(userId: string, code: string): Promise<{ referralId: string } | null> {
  const [paidInvoices, paidPayments] = await Promise.all([
    prisma.subscriptionInvoice.count({ where: { userId, status: "PAID", amountNaira: { gt: 0 } } }),
    prisma.payment.count({ where: { userId, status: { in: ["SUCCESS", "HELD", "RELEASED"] } } }),
  ]);
  if (paidInvoices + paidPayments > 0) throw Object.assign(new Error("Referral codes can only be added before your first payment"), { statusCode: 409 });
  return attributeReferral(userId, { manualCode: code, source: "CODE_ENTRY" });
}

/** "Invited by Ada O." — first name + initial only. */
export async function invitedByLabel(userId: string): Promise<string | null> {
  const r = await prisma.referral.findUnique({ where: { referredId: userId }, select: { referrer: { select: { name: true } } } });
  return r ? maskName(r.referrer.name) : null;
}
