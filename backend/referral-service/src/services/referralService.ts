// backend/referral-service/src/services/referralService.ts
// ============================================================
// Referrals — dual-sided, pay-on-success.
// A referrer's code lives on User.referralCode; a Referral row is created when
// an invitee registers with that code, and rewards are only granted after the
// invitee's FIRST successful payment (rewardOnFirstTransaction), so nobody can
// farm signups.
//
// SCHEMA ALIGNMENT — Referral in packages/db is:
//   referrerId · referredId (@unique, NOT `inviteeId`) · referralCode ·
//   referralType · status ReferralStatus = PENDING | QUALIFIED | REWARDED |
//   EXPIRED | CANCELLED  (there is no INVITED / SIGNED_UP / CONVERTED) ·
//   qualificationMet · qualifiedAt · reward / referrerReward / referredReward ·
//   rewardType RewardType · rewardPaid + per-side paid flags · clickCount ·
//   shareChannel · relations `referrer` / `referred` (NOT `invitee`)
//
// Credits are `ReferralReward` rows (there is no ReferralCredit model):
//   userId · referralId · rewardType · amount · description · status
//
// Status mapping used throughout (DB → dashboard):
//   PENDING   → "INVITED"    (code shared / invitee registered, no payment yet)
//   QUALIFIED → "SIGNED_UP"  (invitee registered and linked)
//   REWARDED  → "CONVERTED"  (first payment cleared, credits granted)
// ============================================================
import { randomBytes } from "crypto";
import { prisma } from "@newcondo/db";
import type { ReferralStatus, Role } from "@newcondo/db";
import {
  badGateway, notFound,
  publishNotification, sendBrandedEmail, EmailTemplates, REFERRALS, redis,
} from "@newcondo/backend-shared";

const REWARD_BY_ROLE: Record<string, number> = REFERRALS.rewardByInviteeRole;

/** DB status → the label the dashboard/leaderboard shows. */
const UI_STATUS: Record<string, "INVITED" | "SIGNED_UP" | "CONVERTED"> = {
  PENDING: "INVITED",
  QUALIFIED: "SIGNED_UP",
  REWARDED: "CONVERTED",
  EXPIRED: "INVITED",
  CANCELLED: "INVITED",
};

/* ---------- code ---------- */
export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true, name: true } });
  if (!user) throw notFound("User not found");
  if (user.referralCode) return user.referralCode;

  const base = (user.name ?? "NC").replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "NC";
  for (let i = 0; i < 5; i++) {
    const code = `${base}-${randomBytes(2).toString("hex").toUpperCase()}`;
    try {
      await prisma.user.update({ where: { id: userId }, data: { referralCode: code } });
      return code;
    } catch { /* unique collision — retry */ }
  }
  throw badGateway("Could not allocate a referral code");
}

/* ---------- stats (referral page) ---------- */
export interface ReferralHistoryRow {
  id: string;
  name: string;
  status: "INVITED" | "SIGNED_UP" | "CONVERTED";
  reward: number;
  date: Date;
  note?: string;
}
export interface ReferralStats {
  link: string;
  invited: number;
  signedUp: number;
  converted: number;
  credits: number;
  history: ReferralHistoryRow[];
}

export async function getReferralStats(userId: string): Promise<ReferralStats> {
  const code = await getOrCreateReferralCode(userId);
  const [referrals, creditAgg] = await Promise.all([
    prisma.referral.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, status: true, referrerReward: true, reward: true, createdAt: true,
        referred: { select: { name: true, role: true } },
      },
    }),
    // Credits are ReferralReward rows, not a ReferralCredit table.
    prisma.referralReward.aggregate({ where: { userId }, _sum: { amount: true } }),
  ]);

  return {
    link: `newcondo.homes/r/${code}`,
    invited: referrals.length,
    signedUp: referrals.filter((r) => r.status !== "PENDING").length,
    converted: referrals.filter((r) => r.status === "REWARDED").length,
    credits: Number(creditAgg._sum?.amount ?? 0),
    history: referrals.map((r): ReferralHistoryRow => ({
      id: r.id,
      name: `${r.referred?.name ?? "Invitee"}${r.referred?.role ? ` (${titleCase(String(r.referred.role))})` : ""}`,
      status: UI_STATUS[String(r.status)] ?? "INVITED",
      reward: Number(r.referrerReward ?? r.reward ?? 0),
      date: r.createdAt,
      note: r.status === "QUALIFIED" ? "Reward pending first transaction" : undefined,
    })),
  };
}
const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

/* ---------- signup: link the invitee to the referrer ---------- */
export async function attachReferral(code: string, inviteeId: string): Promise<{ id: string } | null> {
  const referrer = await prisma.user.findFirst({ where: { referralCode: code }, select: { id: true } });
  if (!referrer || referrer.id === inviteeId) return null;

  // referredId is @unique — a user can only ever be referred once.
  const existing = await prisma.referral.findUnique({ where: { referredId: inviteeId }, select: { id: true } });
  if (existing) return existing;

  return prisma.referral.create({
    data: {
      referrerId: referrer.id,
      referredId: inviteeId,
      referralCode: code,
      status: "QUALIFIED", // registered + linked; reward waits on first payment
      qualificationMet: true,
      qualifiedAt: new Date(),
    },
    select: { id: true },
  });
}

/* ---------- "Invite by email" — no Referral row yet (referredId is required),
   so the pending invite is tracked in Redis until they register. ---------- */
export async function recordInvite(referrerId: string, inviteeEmail: string): Promise<{ email: string; code: string }> {
  const code = await getOrCreateReferralCode(referrerId);
  const email = inviteeEmail.trim().toLowerCase();
  await redis.setex(`referral:invite:${email}`, 60 * 60 * 24 * 30, code).catch(() => {});
  // TODO(email): send the branded invitation once an inviteReferral template exists.
  return { email, code };
}

/** Resolve a pending email invite at registration time (auth-service hook). */
export async function resolvePendingInvite(email: string): Promise<string | null> {
  return redis.get(`referral:invite:${email.trim().toLowerCase()}`).catch(() => null);
}

/* ---------- pay-on-success: called from the Flutterwave webhook ---------- */
export async function rewardOnFirstTransaction(payerId: string): Promise<{ amount: number } | null> {
  const referral = await prisma.referral.findUnique({
    where: { referredId: payerId },
    select: {
      id: true, status: true, referrerId: true,
      referred: { select: { role: true, name: true } },
      referrer: { select: { email: true, name: true } },
    },
  });
  // Idempotent: only a linked, not-yet-rewarded referral converts.
  if (!referral || referral.status !== "QUALIFIED") return null;

  const role = String(referral.referred?.role ?? "RENTER") as Role;
  const amount = REWARD_BY_ROLE[role] ?? 2000;
  const inviteeShare = Math.round(amount * REFERRALS.inviteeWelcomeShare);

  await prisma.$transaction(async (tx) => {
    await tx.referral.update({
      where: { id: referral.id },
      data: {
        status: "REWARDED",
        reward: amount,
        referrerReward: amount,
        referredReward: inviteeShare,
        rewardType: "SERVICE_CREDIT",
        rewardPaid: true,
        referrerRewardPaid: true,
        referredRewardPaid: true,
        referrerRewardPaidAt: new Date(),
        referredRewardPaidAt: new Date(),
      },
    });
    await tx.referralReward.create({
      data: {
        userId: referral.referrerId, referralId: referral.id, rewardType: "SERVICE_CREDIT",
        amount, description: "Referral converted — invitee completed their first transaction",
      },
    });
    await tx.referralReward.create({
      data: {
        userId: payerId, referralId: referral.id, rewardType: "SERVICE_CREDIT",
        amount: inviteeShare, description: "Welcome credit — thanks for joining through a referral",
      },
    });
  });

  await publishNotification({
    userId: referral.referrerId,
    kind: "referral",
    title: "Referral converted",
    body: `${referral.referred?.name ?? "Your invitee"} completed their first transaction — ₦${amount.toLocaleString("en-NG")} in credits added.`,
    to: "/referrals",
    entityType: "referral",
    entityId: referral.id,
  });
  if (referral.referrer?.email) {
    await sendBrandedEmail(referral.referrer.email, EmailTemplates.commissionReceived({
      agentName: referral.referrer.name ?? "there",
      amount,
      property: "your referral",
      kind: "SUB_AGENT",
    }));
  }
  return { amount };
}

/* ============================================================
   LEADERBOARD — shows affiliates their actions are tracked.
   Ranked by converted referrals, then credits, then signups; agents are the
   main affiliates so role rides along. Names lightly masked ("Emeka O.").
   Redis-cached 5 min — ranking over all referrers is the only heavy read.
   ============================================================ */
export interface LeaderRow {
  rank: number; name: string; role: string;
  converted: number; signedUp: number; credits: number; isYou: boolean;
}
export interface Leaderboard {
  total: number; page: number; pageSize: number; totalPages: number;
  yourRank: number | null; entries: LeaderRow[];
}
interface RankedRow { userId: string; name: string; role: string; converted: number; signedUp: number; credits: number }

const QUALIFIED_OR_REWARDED: ReferralStatus[] = ["QUALIFIED", "REWARDED"];

export async function getLeaderboard(opts: {
  page?: number; pageSize?: number; requesterId?: string;
} = {}): Promise<Leaderboard> {
  const pageSize = Math.min(50, opts.pageSize ?? REFERRALS.leaderboardPageSize);
  const page = Math.max(1, opts.page ?? 1);
  const cacheKey = "referrals:leaderboard:v1";

  let rows: RankedRow[] | null = null;
  const cached = await redis.get(cacheKey).catch(() => null);
  if (cached) rows = JSON.parse(cached) as RankedRow[];

  if (!rows) {
    const grouped = await prisma.referral.groupBy({
      by: ["referrerId"],
      _count: { _all: true },
      where: { status: { in: QUALIFIED_OR_REWARDED } },
    });
    const ids = grouped.map((g) => g.referrerId);
    const signedUpMap = new Map<string, number>(grouped.map((g) => [g.referrerId, g._count?._all ?? 0]));

    const [users, converted, credits] = await Promise.all([
      prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, role: true } }),
      prisma.referral.groupBy({
        by: ["referrerId"], _count: { _all: true },
        where: { referrerId: { in: ids }, status: "REWARDED" },
      }),
      prisma.referralReward.groupBy({
        by: ["userId"], _sum: { amount: true },
        where: { userId: { in: ids } },
      }),
    ]);

    const convMap = new Map<string, number>(converted.map((c) => [c.referrerId, c._count?._all ?? 0]));
    const credMap = new Map<string, number>(credits.map((c) => [c.userId, Number(c._sum?.amount ?? 0)]));

    rows = users
      .map((u): RankedRow => ({
        userId: u.id,
        name: maskName(u.name ?? "Affiliate"),
        role: String(u.role),
        converted: convMap.get(u.id) ?? 0,
        signedUp: signedUpMap.get(u.id) ?? 0,
        credits: credMap.get(u.id) ?? 0,
      }))
      .sort((a, b) => b.converted - a.converted || b.credits - a.credits || b.signedUp - a.signedUp);

    await redis.setex(cacheKey, 300, JSON.stringify(rows)).catch(() => {});
  }

  const ranked: RankedRow[] = rows;
  const total = ranked.length;
  const start = (page - 1) * pageSize;
  const youIndex = opts.requesterId ? ranked.findIndex((r) => r.userId === opts.requesterId) : -1;

  return {
    total, page, pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    yourRank: youIndex >= 0 ? youIndex + 1 : null,
    entries: ranked.slice(start, start + pageSize).map((r, i): LeaderRow => ({
      rank: start + i + 1,
      name: r.name,
      role: r.role,
      converted: r.converted,
      signedUp: r.signedUp,
      credits: r.credits,
      isYou: r.userId === opts.requesterId,
    })),
  };
}

const maskName = (full: string): string => {
  const parts = full.trim().split(/\s+/);
  const first = parts[0] ?? "Affiliate";
  const last = parts.length > 1 ? parts[parts.length - 1] : "";
  return last ? `${first} ${last.charAt(0).toUpperCase()}.` : first;
};
