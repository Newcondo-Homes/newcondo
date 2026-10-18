// backend/shared/src/referrals/admin.ts — spec §13 admin + §17 ops
import { prisma } from "@newcondo/db";
import { REFERRAL_RULES, isReferralProgramEnabled } from "./rules";
import { COHORTS } from "./cohorts";
import { rewardText } from "./display";

const n = (k: bigint | null | undefined) => Number(k ?? 0n) / 100;

/** Rules as deployed + live totals per rule. Rules are read-only here —
 *  they change in rules.ts and ship with a deploy. */
export async function adminRules() {
  const [byRule, events] = await Promise.all([
    prisma.referralLedgerEntry.groupBy({ by: ["ruleId", "status"], _sum: { amountKobo: true, redeemedKobo: true }, _count: { _all: true } }),
    prisma.referralEvent.groupBy({ by: ["ruleId", "outcome"], _count: { _all: true } }),
  ]);
  return {
    enabled: isReferralProgramEnabled(),
    deployedAt: process.env.RENDER_GIT_COMMIT ?? process.env.DEPLOYED_AT ?? null,
    rules: REFERRAL_RULES.map((r) => {
      const rows = byRule.filter((x) => x.ruleId === r.id);
      const sum = (pred: (s: string) => boolean, f: "amountKobo" | "redeemedKobo") => n(rows.filter((x) => pred(x.status)).reduce((s, x) => s + (x._sum[f] ?? 0n), 0n));
      return {
        id: r.id, active: r.active, title: r.marketing?.title ?? r.id, reward: rewardText(r), window: r.activeWindow ?? null,
        events: events.filter((e) => e.ruleId === r.id).reduce((s, e) => s + e._count._all, 0),
        rewarded: events.find((e) => e.ruleId === r.id && e.outcome === "REWARDED")?._count._all ?? 0,
        issued: sum((s) => s !== "VOIDED" && s !== "PENDING_FUNDING", "amountKobo"),
        redeemed: sum(() => true, "redeemedKobo"),
        voided: sum((s) => s === "VOIDED", "amountKobo"),
      };
    }),
  };
}

export async function adminExposure() {
  const [liability, overrides, pendingFunding, clawbacks, cohorts] = await Promise.all([
    prisma.referralLedgerEntry.findMany({ where: { kind: "SUBSCRIPTION_CREDIT", status: { in: ["SCHEDULED", "AVAILABLE", "PARTIALLY_REDEEMED"] } }, select: { amountKobo: true, redeemedKobo: true } }),
    prisma.referralLedgerEntry.groupBy({ by: ["userId"], where: { kind: "COMMISSION_OVERRIDE", status: "PAID_OUT" }, _sum: { amountKobo: true } }),
    prisma.referralLedgerEntry.count({ where: { status: "PENDING_FUNDING" } }),
    prisma.referralLedgerEntry.aggregate({ where: { kind: "CLAWBACK", status: "SCHEDULED" }, _sum: { amountKobo: true }, _count: { _all: true } }),
    Promise.all(Object.entries(COHORTS).map(async ([id, c]) => ({ id, size: c.size, filled: await prisma.referralCohortMember.count({ where: { cohort: id } }) }))),
  ]);
  return {
    outstandingCreditLiability: n(liability.reduce((s, e) => s + e.amountKobo - e.redeemedKobo, 0n)),
    overridesByAgent: overrides.map((o) => ({ userId: o.userId, total: n(o._sum.amountKobo) })),
    milestoneGrantsPendingFunding: pendingFunding,
    openClawbacks: { count: clawbacks._count._all, total: n(clawbacks._sum.amountKobo) },
    cohorts,
  };
}

export async function adminFraudQueue(page = 1, pageSize = 25) {
  const where = { fraudHold: true };
  const [total, rows] = await Promise.all([
    prisma.referral.count({ where }),
    prisma.referral.findMany({
      where, orderBy: { createdAt: "asc" }, skip: (page - 1) * pageSize, take: pageSize,
      select: { id: true, fraudReason: true, createdAt: true, referrer: { select: { id: true, name: true, email: true } }, referred: { select: { id: true, name: true, email: true } } },
    }),
  ]);
  return { total, page, pageSize, rows };
}

export async function adminLedgerSearch(q: { userId?: string; ruleId?: string; status?: string; page?: number }) {
  const page = Math.max(1, q.page ?? 1);
  const where = { ...(q.userId ? { userId: q.userId } : {}), ...(q.ruleId ? { ruleId: q.ruleId } : {}), ...(q.status ? { status: q.status as never } : {}) };
  const [total, rows] = await Promise.all([
    prisma.referralLedgerEntry.count({ where }),
    prisma.referralLedgerEntry.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * 25, take: 25 }),
  ]);
  return { total, page, rows: rows.map((r) => ({ ...r, amount: n(r.amountKobo), redeemed: n(r.redeemedKobo), amountKobo: undefined, redeemedKobo: undefined })) };
}
