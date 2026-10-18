// backend/shared/src/referrals/me.ts — the user-facing reads (spec §13)
// Never returns a referee's contact details or what a referee paid.
import { prisma } from "@newcondo/db";
import { REFERRAL_RULES } from "./rules";
import { getOrCreateReferralCode, referralLinkFor } from "./attribution";
import { maskName } from "./names";

const DAY = 24 * 3600_000;
const n = (k: bigint | null | undefined) => Number(k ?? 0n) / 100;

export async function referralOverview(userId: string) {
  const code = await getOrCreateReferralCode(userId);
  const now = new Date();
  const soon = new Date(now.getTime() + 30 * DAY);
  const yearAgo = new Date(now.getTime() - 365 * DAY);
  const [clicks, refs, entries, ownerActive] = await Promise.all([
    prisma.referralLinkClick.count({ where: { referrerId: userId } }),
    prisma.referral.findMany({ where: { referrerId: userId }, select: { status: true, activatedAt: true, fraudHold: true } }),
    prisma.referralLedgerEntry.findMany({ where: { userId }, select: { kind: true, status: true, amountKobo: true, redeemedKobo: true, availableAt: true, expiresAt: true, ruleId: true, createdAt: true, serviceType: true, id: true } }),
    prisma.referral.count({ where: { referrerId: userId, status: "ACTIVE", referred: { role: "OWNER" } } }),
  ]);

  const credit = entries.filter((e) => e.kind === "SUBSCRIPTION_CREDIT");
  const free = (e: (typeof entries)[number]) => e.amountKobo - e.redeemedKobo;
  const available = credit.filter((e) => e.status === "AVAILABLE" || e.status === "PARTIALLY_REDEEMED").reduce((s, e) => s + free(e), 0n);
  const scheduled = credit.filter((e) => e.status === "SCHEDULED");
  const expiring = credit.filter((e) => (e.status === "AVAILABLE" || e.status === "PARTIALLY_REDEEMED") && e.expiresAt && e.expiresAt <= soon);
  const lifetime = entries.filter((e) => e.status !== "VOIDED" && e.kind !== "CLAWBACK" && e.kind !== "SERVICE_CREDIT").reduce((s, e) => s + e.amountKobo, 0n);

  const capUsage = REFERRAL_RULES.filter((r) => r.capPerReferrerPerYearKobo).map((r) => ({
    ruleId: r.id,
    title: r.marketing?.title ?? r.id,
    used: n(entries.filter((e) => e.ruleId === r.id && e.status !== "VOIDED" && e.createdAt >= yearAgo).reduce((s, e) => s + e.amountKobo, 0n)),
    cap: r.capPerReferrerPerYearKobo! / 100,
  })).filter((c) => c.used > 0);

  const milestones = REFERRAL_RULES.filter((r) => r.active && r.milestone).map((r) => {
    const grant = entries.find((e) => e.ruleId === r.id);
    return {
      ruleId: r.id, title: r.marketing?.title ?? r.id, target: r.milestone!.referredActiveCount, current: ownerActive,
      state: grant ? (grant.status === "PENDING_FUNDING" ? "pending" : grant.status === "AVAILABLE" ? "unlocked" : grant.status === "REDEEMED" ? "used" : "closed") : ownerActive >= r.milestone!.referredActiveCount ? "pending" : "locked",
      ledgerId: grant?.status === "AVAILABLE" ? grant.id : undefined,
      expiresAt: grant?.expiresAt ?? undefined,
    };
  });

  const overrides = entries.filter((e) => e.kind === "COMMISSION_OVERRIDE" && e.status === "PAID_OUT");
  return {
    code,
    link: referralLinkFor(code),
    stats: {
      clicks,
      signups: refs.length,
      activated: refs.filter((r) => r.status === "ACTIVE").length,
      pending: refs.filter((r) => r.status === "PENDING" || r.status === "QUALIFIED").length,
      underReview: refs.filter((r) => r.fraudHold).length,
    },
    credit: {
      available: n(available),
      scheduled: scheduled.map((e) => ({ amount: n(e.amountKobo), availableAt: e.availableAt })),
      expiringSoon: expiring.map((e) => ({ amount: n(free(e)), expiresAt: e.expiresAt })),
      lifetimeEarned: n(lifetime),
    },
    capUsage,
    milestones,
    overrides: overrides.length ? { count: overrides.length, total: n(overrides.reduce((s, e) => s + e.amountKobo, 0n)) } : undefined,
  };
}

const UI_STATUS: Record<string, "INVITED" | "SIGNED_UP" | "ACTIVE" | "UNDER_REVIEW"> = {
  PENDING: "SIGNED_UP", QUALIFIED: "SIGNED_UP", ACTIVE: "ACTIVE", REWARDED: "ACTIVE", VOID: "UNDER_REVIEW",
};

export async function referralList(userId: string, opts: { page?: number; pageSize?: number; status?: string }) {
  const pageSize = Math.min(50, opts.pageSize ?? 10);
  const page = Math.max(1, opts.page ?? 1);
  const where = { referrerId: userId, ...(opts.status ? { status: opts.status as never } : {}) };
  const [total, rows] = await Promise.all([
    prisma.referral.count({ where }),
    prisma.referral.findMany({
      where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize,
      select: {
        id: true, status: true, fraudHold: true, createdAt: true, activatedAt: true,
        referred: { select: { name: true, role: true, subscription: { select: { planType: true } } } },
      },
    }),
  ]);
  return {
    total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)),
    rows: rows.map((r) => ({
      id: r.id,
      name: maskName(r.referred.name),
      role: r.referred.role,
      status: r.fraudHold ? "UNDER_REVIEW" : UI_STATUS[r.status] ?? "SIGNED_UP",
      tier: r.referred.role === "OWNER" ? r.referred.subscription?.planType ?? null : null,
      date: r.createdAt,
      activatedAt: r.activatedAt,
    })),
  };
}

export async function referralLedgerList(userId: string, opts: { page?: number; pageSize?: number; status?: string }) {
  const pageSize = Math.min(50, opts.pageSize ?? 10);
  const page = Math.max(1, opts.page ?? 1);
  const where = { userId, ...(opts.status ? { status: opts.status as never } : {}) };
  const [total, rows] = await Promise.all([
    prisma.referralLedgerEntry.count({ where }),
    prisma.referralLedgerEntry.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
  ]);
  return {
    total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)),
    rows: rows.map((e) => ({
      id: e.id, kind: e.kind, status: e.status, amount: n(e.amountKobo), redeemed: n(e.redeemedKobo),
      ruleTitle: REFERRAL_RULES.find((r) => r.id === e.ruleId)?.marketing?.title ?? e.ruleId,
      serviceType: e.serviceType, availableAt: e.availableAt, expiresAt: e.expiresAt, createdAt: e.createdAt,
    })),
  };
}
