// backend/referral-service/src/services/referralService.ts
// ============================================================
// REFERRALS v2 (Oct 2026): the reward engine moved to
// backend/shared/src/referrals (config-driven, margin-funded — rules.ts is the
// one file to edit). This service keeps its public functions so auth-service
// and combined-backend keep compiling, and delegates to the engine:
//   getOrCreateReferralCode / attachReferral → Referrals attribution
//   rewardOnFirstTransaction                 → no-op (rewards now fire from
//                                              settled money events only)
//   getReferralStats                         → legacy shape, engine data
//   getLeaderboard                           → ranks by ACTIVATED referrals,
//                                              credits from the reward ledger
// The flat ₦10k/₦5k/₦2k REFERRALS.rewardByInviteeRole is no longer paid.
// ------------------------------------------------------------
// (original header follows)
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
import { REFERRALS, redis, Referrals } from "@newcondo/backend-shared";

/** DB status → the label the dashboard/leaderboard shows. */
const UI_STATUS: Record<string, "INVITED" | "SIGNED_UP" | "CONVERTED"> = {
  PENDING: "INVITED",
  QUALIFIED: "SIGNED_UP",
  REWARDED: "CONVERTED",
  EXPIRED: "INVITED",
  CANCELLED: "INVITED",
};

/* ---------- code ---------- */
export const getOrCreateReferralCode = (userId: string): Promise<string> => Referrals.getOrCreateReferralCode(userId);

/* ---------- stats (legacy shape for the existing referral page) ---------- */
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
  const [o, list, earned] = await Promise.all([
    Referrals.referralOverview(userId),
    Referrals.referralList(userId, { pageSize: 50 }),
    prisma.referralLedgerEntry.groupBy({ by: ["referralId"], where: { userId, status: { notIn: ["VOIDED", "PENDING_FUNDING"] }, kind: { not: "CLAWBACK" } }, _sum: { amountKobo: true } }),
  ]);
  const byRef = new Map(earned.map((e) => [e.referralId, Number(e._sum.amountKobo ?? 0n) / 100]));
  return {
    link: o.link,
    invited: o.stats.clicks,
    signedUp: o.stats.signups,
    converted: o.stats.activated,
    credits: o.credit.available,
    history: list.rows.map((r) => ({
      id: r.id,
      name: r.name,
      status: r.status === "ACTIVE" ? "CONVERTED" : "SIGNED_UP",
      reward: byRef.get(r.id) ?? 0,
      date: r.date,
      note: r.status === "UNDER_REVIEW" ? "Under review" : r.status !== "ACTIVE" ? "You earn when their first payment clears" : undefined,
    })),
  };
}

/* ---------- signup: link the invitee to the referrer ---------- */
export async function attachReferral(code: string, inviteeId: string, ctx: { ip?: string; device?: string; source?: "LINK" | "CODE_ENTRY" | "INVITE" } = {}): Promise<{ id: string } | null> {
  const r = await Referrals.attributeReferral(inviteeId, { queryCode: code, ip: ctx.ip, device: ctx.device, source: ctx.source ?? "LINK" });
  return r ? { id: r.referralId } : null;
}

/* ---------- "Invite by email" — tracked in Redis until they register ---------- */
export async function recordInvite(referrerId: string, inviteeEmail: string): Promise<{ email: string; code: string }> {
  const code = await getOrCreateReferralCode(referrerId);
  const email = inviteeEmail.trim().toLowerCase();
  await redis.setex(`referral:invite:${email}`, 60 * 60 * 24 * 30, code).catch(() => {});
  return { email, code };
}

/** Resolve a pending email invite at registration time (auth-service hook). */
export async function resolvePendingInvite(email: string): Promise<string | null> {
  return redis.get(`referral:invite:${email.trim().toLowerCase()}`).catch(() => null);
}

/** @deprecated v2 — rewards are created by the engine from settled money
 *  events (subscription cleared / rent commission distributed). Kept so old
 *  call sites compile; it pays nothing, which is what prevents double rewards. */
export async function rewardOnFirstTransaction(_payerId: string): Promise<{ amount: number } | null> {
  return null;
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

const QUALIFIED_OR_REWARDED: ReferralStatus[] = ["PENDING", "QUALIFIED", "ACTIVE", "REWARDED"];

export async function getLeaderboard(opts: {
  page?: number; pageSize?: number; requesterId?: string;
} = {}): Promise<Leaderboard> {
  const pageSize = Math.min(50, opts.pageSize ?? REFERRALS.leaderboardPageSize);
  const page = Math.max(1, opts.page ?? 1);
  const cacheKey = "referrals:leaderboard:v2";

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
        where: { referrerId: { in: ids }, status: { in: ["ACTIVE", "REWARDED"] } },
      }),
      prisma.referralLedgerEntry.groupBy({
        by: ["userId"], _sum: { amountKobo: true },
        where: { userId: { in: ids }, status: { notIn: ["VOIDED", "PENDING_FUNDING"] }, kind: { not: "CLAWBACK" } },
      }),
    ]);

    const convMap = new Map<string, number>(converted.map((c) => [c.referrerId, c._count?._all ?? 0]));
    const credMap = new Map<string, number>(credits.map((c) => [c.userId, Number(c._sum?.amountKobo ?? 0n) / 100]));

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
