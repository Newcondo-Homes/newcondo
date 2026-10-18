// backend/shared/src/referrals/fraud.ts — spec §12
// A hit sets Referral.fraudHold = true with a reason. Rewards stay blocked
// until an admin clears (replays) or voids. Wording to the referrer is always
// neutral ("under review") — never an accusation.
import { createHash } from "crypto";
import { prisma } from "@newcondo/db";
import { FRAUD_SAME_IP_PER_DAY } from "./limits";

/** One-way hash for IPs / device ids — we compare, never store the raw value. */
export const hashId = (raw?: string | null): string | null =>
  raw ? createHash("sha256").update(`${process.env.REFERRAL_HASH_SALT ?? "nc"}:${raw}`).digest("hex").slice(0, 40) : null;

export async function attributionFraudReason(opts: {
  referrerId: string;
  refereeId: string;
  ipHash: string | null;
  deviceHash: string | null;
}): Promise<string | null> {
  const [a, b] = await Promise.all([
    prisma.user.findUnique({ where: { id: opts.referrerId }, select: { bvn: true, phone: true, bankAccounts: { select: { accountNumber: true } } } }),
    prisma.user.findUnique({ where: { id: opts.refereeId }, select: { bvn: true, phone: true, bankAccounts: { select: { accountNumber: true } } } }),
  ]);
  if (!a || !b) return null;
  if (a.bvn && a.bvn === b.bvn) return "same_bvn";
  if (a.phone && a.phone === b.phone) return "same_phone";
  const banks = new Set(a.bankAccounts.map((x) => x.accountNumber));
  if (b.bankAccounts.some((x) => banks.has(x.accountNumber))) return "same_bank_account";

  if (opts.deviceHash) {
    const same = await prisma.referral.count({ where: { referrerId: opts.referrerId, deviceHash: opts.deviceHash } });
    if (same > 0) return "same_device";
  }
  if (opts.ipHash) {
    const since = new Date(Date.now() - 24 * 3600_000);
    const n = await prisma.referral.count({ where: { referrerId: opts.referrerId, signupIpHash: opts.ipHash, createdAt: { gte: since } } });
    if (n >= FRAUD_SAME_IP_PER_DAY) return "ip_burst";
  }
  return null;
}

/** Re-checked at reward time: a referee who was rejected or suspended since
 *  signing up must not generate rewards. Bank accounts are re-compared here
 *  because they are usually added AFTER signup. */
export async function rewardTimeFraudReason(referrerId: string, refereeId: string): Promise<string | null> {
  const [a, b] = await Promise.all([
    prisma.user.findUnique({ where: { id: referrerId }, select: { bvn: true, bankAccounts: { select: { accountNumber: true } } } }),
    prisma.user.findUnique({
      where: { id: refereeId },
      select: { verificationStatus: true, deletedAt: true, bvn: true, bankAccounts: { select: { accountNumber: true } } },
    }) as Promise<{ verificationStatus?: string | null; deletedAt?: Date | null; bvn: string | null; bankAccounts: { accountNumber: string }[] } | null>,
  ]);
  if (!b) return "referee_missing";
  if (b.verificationStatus === "REJECTED") return "referee_verification_rejected";
  if (b.deletedAt) return "referee_deactivated";
  if (a?.bvn && a.bvn === b.bvn) return "same_bvn";
  const banks = new Set((a?.bankAccounts ?? []).map((x) => x.accountNumber));
  if (b.bankAccounts.some((x) => banks.has(x.accountNumber))) return "same_bank_account";
  return null;
}
