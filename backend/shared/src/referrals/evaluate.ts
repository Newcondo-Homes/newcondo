// backend/shared/src/referrals/evaluate.ts — spec §8 (DB side of the evaluator)
// ============================================================
// onBusinessEvent(event) is the ONE entry point. Emitters call it after the
// money that funds a reward has settled:
//   • subscription charge cleared  (activateSubscription / renewal / property plan)
//   • rent commission distributed  (commissionSplit, after the 24h window)
// The pure maths lives in plan.ts; this file gathers context, writes rows
// idempotently and fires notifications after commit.
// ============================================================
import { prisma } from "@newcondo/db";
import type { Prisma } from "@newcondo/db";
import { VENDOR_COSTS } from "../constants/subscriptionPlans";
import { ACC } from "../money/accounts";
import { postLedger } from "../money/ledger";
import type { BusinessEvent, ReferralRule, Role, CohortId, ServiceCreditType } from "./rule-types";
import { REFERRAL_RULES, isReferralProgramEnabled } from "./rules";
import { COHORTS } from "./cohorts";
import { RENT_REWARD_HOLD_HOURS, SUBSCRIPTION_REWARD_HOLD_HOURS, EMERGENCY_DISPATCH_CAP_NAIRA } from "./limits";
import { computeMarginKobo } from "./margin";
import { candidateRules, refereeFor, resolveExclusive, planReward, type PlanContext } from "./plan";
import { rewardTimeFraudReason } from "./fraud";
import { notifyReferral } from "./notify";

const DAY = 24 * 3600_000;
const toRole = (r: string): Role | null => (r === "OWNER" ? "owner" : r === "AGENT" ? "agent" : r === "RENTER" ? "renter" : null);
const KIND = { subscription_credit: "SUBSCRIPTION_CREDIT", service_credit: "SERVICE_CREDIT", commission_override: "COMMISSION_OVERRIDE" } as const;

type ReferralRow = { id: string; referrerId: string; referredId: string; status: string; fraudHold: boolean; activatedAt: Date | null; referrer: { role: string; createdAt: Date; name: string | null }; referred: { role: string; name: string | null } };

async function loadReferral(refereeId: string): Promise<ReferralRow | null> {
  return prisma.referral.findUnique({
    where: { referredId: refereeId },
    select: {
      id: true, referrerId: true, referredId: true, status: true, fraudHold: true, activatedAt: true,
      referrer: { select: { role: true, createdAt: true, name: true } },
      referred: { select: { role: true, name: true } },
    },
  }) as Promise<ReferralRow | null>;
}

/* ---------------- eligibility (step 5) ---------------- */

async function isCohortMember(cohort: CohortId, userId: string): Promise<boolean> {
  const row = await prisma.referralCohortMember.findUnique({ where: { cohort_userId: { cohort, userId } }, select: { id: true } });
  if (row) return true;
  if (cohort === "founding_100_agents") {
    // Reuse the existing founding-agent flag (Subscription.isFoundingAgent) —
    // and record membership so admin counts are one query.
    const sub = await prisma.subscription.findUnique({ where: { userId }, select: { isFoundingAgent: true } });
    if (sub?.isFoundingAgent) {
      await prisma.referralCohortMember.upsert({ where: { cohort_userId: { cohort, userId } }, create: { cohort, userId }, update: {} });
      return true;
    }
  }
  return false;
}

/** Atomic, capacity-bounded cohort insert. An advisory lock serialises the
 *  count-then-insert so the cohort can never exceed its size. */
export async function tryJoinCohort(cohort: CohortId, userId: string): Promise<boolean> {
  if (await isCohortMember(cohort, userId)) return true;
  const size = COHORTS[cohort].size;
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${"cohort:" + cohort}))`;
    const n = await tx.referralCohortMember.count({ where: { cohort } });
    if (n >= size) return false;
    await tx.referralCohortMember.create({ data: { cohort, userId } });
    return true;
  });
}

async function qualificationFailure(rule: ReferralRule, referrerId: string, referrerCreatedAt: Date, at: Date): Promise<string | null> {
  const e = rule.eligibility;
  if (e.minReferrerTenureDays && at.getTime() - referrerCreatedAt.getTime() < e.minReferrerTenureDays * DAY) return "tenure";
  if (e.cohortOnly && !(await isCohortMember(e.cohortOnly, referrerId))) return "not_in_cohort";
  switch (e.qualification) {
    case "paying_subscriber": {
      const sub = await prisma.subscription.findUnique({ where: { userId: referrerId }, select: { id: true, status: true } });
      if (!sub || sub.status !== "ACTIVE") return "referrer_not_active_subscriber";
      const paid = await prisma.subscriptionInvoice.count({ where: { subscriptionId: sub.id, status: "PAID", amountNaira: { gt: 0 } } });
      return paid > 0 ? null : "referrer_never_paid";
    }
    case "settled_transaction": {
      const [pays, invs] = await Promise.all([
        prisma.payment.count({ where: { userId: referrerId, paymentType: { in: ["RENT", "PROPERTY_MARKING"] }, status: { in: ["RELEASED", "SUCCESS"] } } }),
        prisma.subscriptionInvoice.count({ where: { userId: referrerId, status: "PAID", amountNaira: { gt: 0 } } }),
      ]);
      return pays + invs > 0 ? null : "referrer_no_settled_transaction";
    }
    case "cohort_member":
      return e.cohortOnly ? null : "cohort_rule_without_cohort";
  }
}

/* ---------------- context for plan.ts ---------------- */

async function contextFor(rule: ReferralRule, ref: ReferralRow, marginKobo: bigint): Promise<PlanContext> {
  const yearAgo = new Date(Date.now() - 365 * DAY);
  const live = { not: "VOIDED" as const };
  const [priorSources, usedReferrer, usedReferee, usedYear, paid] = await Promise.all([
    prisma.referralLedgerEntry.groupBy({ by: ["sourceId"], where: { ruleId: rule.id, referralId: ref.id, status: live, kind: { not: "CLAWBACK" } } }),
    prisma.referralLedgerEntry.aggregate({ where: { ruleId: rule.id, referralId: ref.id, userId: ref.referrerId, status: live }, _sum: { amountKobo: true } }),
    prisma.referralLedgerEntry.aggregate({ where: { ruleId: rule.id, referralId: ref.id, userId: ref.referredId, status: live }, _sum: { amountKobo: true } }),
    prisma.referralLedgerEntry.aggregate({ where: { ruleId: rule.id, userId: ref.referrerId, status: live, createdAt: { gte: yearAgo } }, _sum: { amountKobo: true } }),
    rule.release.type === "recurring_capped"
      ? prisma.referral.findMany({
          where: { referrerId: ref.referrerId, id: { in: (await prisma.referralLedgerEntry.findMany({ where: { ruleId: rule.id, userId: ref.referrerId, status: live }, select: { referralId: true }, distinct: ["referralId"] })).map((x) => x.referralId) } },
          orderBy: { activatedAt: "asc" },
          select: { referredId: true },
        })
      : Promise.resolve([] as { referredId: string }[]),
  ]);
  return {
    marginKobo,
    priorEvents: priorSources.length,
    paidRefereeIds: paid.map((p) => p.referredId),
    refereeId: ref.referredId,
    usedReferredUserKobo: { referrer: usedReferrer._sum.amountKobo ?? 0n, referee: usedReferee._sum.amountKobo ?? 0n },
    usedReferrerYearKobo: usedYear._sum.amountKobo ?? 0n,
  };
}

/* ---------------- writes ---------------- */

async function recordSkip(ev: BusinessEvent, rule: ReferralRule, ref: ReferralRow, reason: string, marginKobo: bigint | null) {
  try {
    await prisma.referralEvent.create({
      data: { sourceType: ev.sourceType, sourceId: ev.sourceId, ruleId: rule.id, referralId: ref.id, outcome: "SKIPPED", skipReason: reason, marginKobo, payload: ev as unknown as Prisma.InputJsonValue },
    });
  } catch { /* already evaluated — idempotent */ }
}

type Created = { id: string; userId: string; amountKobo: bigint; status: string; availableAt: Date; expiresAt: Date | null };

async function writeReward(ev: BusinessEvent, rule: ReferralRule, ref: ReferralRow, marginKobo: bigint, referrerKobo: bigint, refereeKobo: bigint): Promise<Created[] | null> {
  const occurred = new Date(ev.occurredAt);
  const holdH = ev.type === "rent_commission_distributed" ? RENT_REWARD_HOLD_HOURS : SUBSCRIPTION_REWARD_HOLD_HOURS;
  const availableAt = new Date(occurred.getTime() + holdH * 3600_000);
  const immediate = availableAt.getTime() <= Date.now();
  const expiresAt = rule.creditExpiryDays > 0 ? new Date(availableAt.getTime() + rule.creditExpiryDays * DAY) : null;
  const isOverride = rule.rewardForm === "commission_override";
  const payToWallet = isOverride && (rule.payout ?? "credit") === "virtual_account";

  try {
    return await prisma.$transaction(async (tx) => {
      await tx.referralEvent.create({
        data: { sourceType: ev.sourceType, sourceId: ev.sourceId, ruleId: rule.id, referralId: ref.id, beneficiaryId: ref.referrerId, outcome: "REWARDED", marginKobo, payload: ev as unknown as Prisma.InputJsonValue },
      });
      const out: Created[] = [];
      for (const [userId, amount] of [[ref.referrerId, referrerKobo], [ref.referredId, refereeKobo]] as const) {
        if (amount <= 0n) continue;
        const status = payToWallet ? "PAID_OUT" : immediate ? "AVAILABLE" : "SCHEDULED";
        const row = await tx.referralLedgerEntry.create({
          data: {
            userId, referralId: ref.id, ruleId: rule.id, sourceType: ev.sourceType, sourceId: ev.sourceId,
            kind: isOverride && !payToWallet ? "SUBSCRIPTION_CREDIT" : KIND[rule.rewardForm],
            status, amountKobo: amount, availableAt, expiresAt: payToWallet ? null : expiresAt,
          },
          select: { id: true, userId: true, amountKobo: true, status: true, availableAt: true, expiresAt: true },
        });
        if (payToWallet) {
          // D2 — paid like commission, from the same commission that funds it.
          await postLedger(tx, {
            idempotencyKey: `ref-override:${row.id}`,
            type: "REFERRAL_OVERRIDE",
            sourceType: "REFERRAL",
            sourceId: row.id,
            memo: `Founding Agent Override — ${rule.id}`,
            legs: [{ account: ACC.revenue, amountKobo: -amount }, { account: ACC.userAvailable(userId), amountKobo: amount }],
          });
          await tx.payment.create({
            data: {
              userId, amount: Number(amount) / 100, ownerAmount: Number(amount) / 100, paymentType: "REFERRAL_OVERRIDE", status: "RELEASED",
              isReleased: true, releasedAt: new Date(), flutterwaveRef: `NC-OVR-${row.id}`,
              description: "Founding Agent Override", meta: { referralLedgerId: row.id, sourceId: ev.sourceId } as never,
            },
          });
        }
        out.push(row);
      }
      return out;
    });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") return null; // duplicate event — already processed
    throw e;
  }
}

/* ---------------- activation + milestones (§8.2 step 13) ---------------- */

async function activateIfFirst(refereeId: string, at: Date): Promise<ReferralRow | null> {
  const ref = await loadReferral(refereeId);
  if (!ref || ref.activatedAt || ref.status === "VOID") return null;
  const { count } = await prisma.referral.updateMany({ where: { id: ref.id, activatedAt: null }, data: { status: "ACTIVE", activatedAt: at, qualificationMet: true, qualifiedAt: at } });
  if (count === 0) return null;
  await notifyReferral({ kind: "ACTIVATED", referrerId: ref.referrerId, refereeName: ref.referred.name, referralId: ref.id });
  return { ...ref, activatedAt: at, status: "ACTIVE" };
}

const vendorCostKobo = (t: ServiceCreditType): bigint =>
  BigInt(
    t === "fumigation" ? VENDOR_COSTS.fumigationPerVisit
      : t === "inspection" ? VENDOR_COSTS.inspectionPerVisit
      : t === "waste_management" ? VENDOR_COSTS.wastePerMonth
      : EMERGENCY_DISPATCH_CAP_NAIRA
  ) * 100n;

/** §7.4 — realized margin from every settled event of the referrer's
 *  referees, minus the face value of every reward already issued to them. */
export async function cumulativeNetMarginKobo(referrerId: string): Promise<bigint> {
  const referralIds = (await prisma.referral.findMany({ where: { referrerId }, select: { id: true } })).map((r) => r.id);
  if (!referralIds.length) return 0n;
  const events = await prisma.referralEvent.findMany({ where: { referralId: { in: referralIds }, sourceType: { not: "MILESTONE" } }, select: { sourceType: true, sourceId: true, marginKobo: true } });
  const perSource = new Map<string, bigint>();
  for (const e of events) {
    const k = `${e.sourceType}:${e.sourceId}`;
    const m = e.marginKobo ?? 0n;
    if (m > (perSource.get(k) ?? 0n)) perSource.set(k, m);
  }
  const margin = [...perSource.values()].reduce((s, x) => s + x, 0n);
  const issued = await prisma.referralLedgerEntry.aggregate({
    where: { userId: referrerId, status: { notIn: ["VOIDED", "PENDING_FUNDING"] }, kind: { not: "CLAWBACK" } },
    _sum: { amountKobo: true },
  });
  return margin - (issued._sum.amountKobo ?? 0n);
}

async function checkMilestones(ref: ReferralRow): Promise<void> {
  const active = await prisma.referral.count({ where: { referrerId: ref.referrerId, status: "ACTIVE", referred: { role: "OWNER" } } });
  const rules = REFERRAL_RULES.filter((r) => r.active && r.trigger === "referral_milestone_reached" && r.milestone && r.milestone.referredActiveCount <= active);
  for (const rule of rules) {
    const sourceId = `${ref.referrerId}:${rule.id}`;
    const exists = await prisma.referralLedgerEntry.findFirst({ where: { ruleId: rule.id, userId: ref.referrerId, sourceType: "MILESTONE" }, select: { id: true } });
    if (exists) continue;
    if (await qualificationFailure(rule, ref.referrerId, ref.referrer.createdAt, new Date())) continue;
    const face = vendorCostKobo(rule.serviceCreditType!);
    const funded = (await cumulativeNetMarginKobo(ref.referrerId)) >= face;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + rule.creditExpiryDays * DAY);
    try {
      const row = await prisma.$transaction(async (tx) => {
        await tx.referralEvent.create({ data: { sourceType: "MILESTONE", sourceId, ruleId: rule.id, referralId: ref.id, beneficiaryId: ref.referrerId, outcome: "REWARDED", marginKobo: 0n } });
        return tx.referralLedgerEntry.create({
          data: {
            userId: ref.referrerId, referralId: ref.id, ruleId: rule.id, sourceType: "MILESTONE", sourceId,
            kind: "SERVICE_CREDIT", status: funded ? "AVAILABLE" : "PENDING_FUNDING", amountKobo: face,
            serviceType: rule.serviceCreditType, availableAt: now, expiresAt,
          },
          select: { id: true },
        });
      });
      await notifyReferral({ kind: "MILESTONE", userId: ref.referrerId, title: rule.marketing?.title ?? rule.id, expiresAt, ledgerId: row.id, pendingFunding: !funded });
    } catch (e) {
      if ((e as { code?: string }).code !== "P2002") throw e;
    }
  }
}

/** Re-run the funding gate on a referrer's PENDING_FUNDING grants. */
export async function recheckPendingFunding(referrerId: string): Promise<number> {
  const pending = await prisma.referralLedgerEntry.findMany({ where: { userId: referrerId, status: "PENDING_FUNDING" }, orderBy: { createdAt: "asc" } });
  let released = 0;
  for (const p of pending) {
    if ((await cumulativeNetMarginKobo(referrerId)) < p.amountKobo) break;
    await prisma.referralLedgerEntry.update({ where: { id: p.id }, data: { status: "AVAILABLE", availableAt: new Date() } });
    const rule = REFERRAL_RULES.find((r) => r.id === p.ruleId);
    await notifyReferral({ kind: "MILESTONE", userId: referrerId, title: rule?.marketing?.title ?? p.ruleId, expiresAt: p.expiresAt, ledgerId: p.id, pendingFunding: false });
    released++;
  }
  return released;
}

/* ---------------- the entry point ---------------- */

export async function onBusinessEvent(ev: BusinessEvent): Promise<{ rewarded: number; skipped: number }> {
  const at = new Date(ev.occurredAt);
  const result = { rewarded: 0, skipped: 0 };

  // Activation is attribution state, not a reward — it runs even with the
  // programme switched off, so turning it back on doesn't lose history.
  const activationSubject = ev.type === "subscription_payment_cleared" || ev.type === "rent_commission_distributed" ? ev.subjectUserId : null;
  const activated = activationSubject ? await activateIfFirst(activationSubject, at) : null;

  if (!isReferralProgramEnabled()) return result;

  const candidates = candidateRules(REFERRAL_RULES, ev);
  const touchedReferrers = new Set<string>();
  // Rules grouped by the referral they resolve to (owner rules on rent events
  // resolve to the LANDLORD, renter rules to the renter).
  const byReferral = new Map<string, { ref: ReferralRow; rules: ReferralRule[] }>();
  for (const rule of candidates) {
    const refereeId = refereeFor(rule.refereeRole, ev);
    if (!refereeId) continue;
    const ref = await loadReferral(refereeId);
    if (!ref || ref.status === "VOID" || ref.status === "CANCELLED" || ref.status === "EXPIRED") continue;
    if (toRole(ref.referred.role) !== rule.refereeRole) continue;
    if (rule.referrerRole !== "any" && toRole(ref.referrer.role) !== rule.referrerRole) continue;
    const bucket = byReferral.get(ref.id) ?? { ref, rules: [] };
    bucket.rules.push(rule);
    byReferral.set(ref.id, bucket);
  }

  for (const { ref, rules } of byReferral.values()) {
    touchedReferrers.add(ref.referrerId);
    const fraud = ref.fraudHold ? "fraud_hold" : await rewardTimeFraudReason(ref.referrerId, ref.referredId);
    if (fraud) {
      if (!ref.fraudHold) await prisma.referral.update({ where: { id: ref.id }, data: { fraudHold: true, fraudReason: fraud } });
      for (const r of rules) { await recordSkip(ev, r, ref, "fraud_hold", computeMarginKobo(r.marginSource, ev)); result.skipped++; }
      continue;
    }

    const survivors: ReferralRule[] = [];
    for (const rule of rules) {
      const fail = await qualificationFailure(rule, ref.referrerId, ref.referrer.createdAt, at);
      if (fail) { await recordSkip(ev, rule, ref, fail, computeMarginKobo(rule.marginSource, ev)); result.skipped++; continue; }
      const capture = rule.eligibility.cohortCapturesOnFirstUse;
      if (capture && !(await tryJoinCohort(capture, ref.referrerId))) continue; // cohort full → the base rule wins
      survivors.push(rule);
    }

    for (const rule of resolveExclusive(survivors)) {
      const margin = computeMarginKobo(rule.marginSource, ev);
      const plan = planReward(rule, await contextFor(rule, ref, margin));
      if (!plan.proceed) {
        if (plan.skipReason?.startsWith("CRITICAL")) console.error(`[referrals] ${plan.skipReason} rule=${rule.id} source=${ev.sourceId}`);
        await recordSkip(ev, rule, ref, plan.skipReason ?? "skipped", margin);
        result.skipped++;
        continue;
      }
      const rows = await writeReward(ev, rule, ref, margin, plan.referrerKobo, plan.refereeKobo);
      if (!rows) continue;
      result.rewarded++;
      for (const row of rows) {
        if (row.status === "PAID_OUT") {
          const landlord = await prisma.user.findUnique({ where: { id: ref.referredId }, select: { name: true } });
          await notifyReferral({ kind: "OVERRIDE_PAID", userId: row.userId, amountKobo: row.amountKobo, landlordName: landlord?.name ?? null, ledgerId: row.id });
        } else if (row.status === "AVAILABLE") {
          await notifyReferral({ kind: "AVAILABLE", userId: row.userId, amountKobo: row.amountKobo, expiresAt: row.expiresAt, ledgerId: row.id });
        } else {
          await notifyReferral({ kind: "SCHEDULED", userId: row.userId, amountKobo: row.amountKobo, availableAt: row.availableAt, ledgerId: row.id });
        }
      }
    }
  }

  if (activated && activated.referred.role === "OWNER") await checkMilestones(activated);
  for (const referrerId of touchedReferrers) await recheckPendingFunding(referrerId);
  return result;
}

/** Fire-and-forget wrapper for emitters: a referral failure must never fail
 *  the payment path that triggered it. Retries are safe (idempotent). */
export function emitReferralEvent(ev: BusinessEvent): void {
  onBusinessEvent(ev).catch((e) => console.error(`[referrals] event ${ev.sourceType}:${ev.sourceId} failed:`, e));
}
