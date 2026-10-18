// backend/shared/src/referrals/plan.ts
// ============================================================
// The PURE core of the evaluator (spec §8.2 steps 2, 6–10). No database —
// evaluate.ts gathers the context and calls these. That split is what makes
// the solvency, stacking, installment, window and cap tests (§18) runnable
// without Postgres.
// ============================================================
import type { BusinessEvent, ReferralRule, Role } from "./rule-types";
import { MAX_POOL_FRACTION, REWARD_ROUNDING_UNIT_KOBO } from "./limits";

const UNIT = BigInt(REWARD_ROUNDING_UNIT_KOBO);
const floorUnit = (k: bigint) => (k <= 0n ? 0n : (k / UNIT) * UNIT);
const mul = (k: bigint, rate: number) => (k * BigInt(Math.round(rate * 1_000_000))) / 1_000_000n;
const min = (...xs: bigint[]) => xs.reduce((a, b) => (b < a ? b : a));

/** Step 2 — active, same trigger, inside its window (evaluated at occurredAt). */
export function candidateRules(rules: ReferralRule[], ev: BusinessEvent): ReferralRule[] {
  const at = Date.parse(ev.occurredAt);
  return rules.filter((r) => r.active && r.trigger === ev.type && withinWindow(r, at));
}

export function withinWindow(r: ReferralRule, atMs: number): boolean {
  if (!r.activeWindow) return true;
  return atMs >= Date.parse(r.activeWindow.start) && atMs <= Date.parse(r.activeWindow.end);
}

/** Step 3 — who the event is "about" for a rule's refereeRole. On rent events
 *  an owner rule means the LANDLORD of the rented property, never the renter. */
export function refereeFor(role: Role, ev: BusinessEvent): string | undefined {
  if (role === "owner" && ev.type === "rent_commission_distributed") return ev.subjectOwnerId;
  return ev.subjectUserId;
}

/** Step 6 — within an exclusiveGroup only the highest priority survives. */
export function resolveExclusive(rules: ReferralRule[]): ReferralRule[] {
  const best = new Map<string, ReferralRule>();
  const free: ReferralRule[] = [];
  for (const r of rules) {
    if (!r.exclusiveGroup) { free.push(r); continue; }
    const cur = best.get(r.exclusiveGroup);
    if (!cur || (r.priority ?? 0) > (cur.priority ?? 0)) best.set(r.exclusiveGroup, r);
  }
  return [...free, ...best.values()];
}

export interface PlanContext {
  marginKobo: bigint;
  /** prior non-voided REWARDED events for (rule, referral) */
  priorEvents: number;
  /** recurring_capped: referees already paid under this rule for this
   *  referrer, ordered by Referral.activatedAt ascending */
  paidRefereeIds: string[];
  refereeId: string;
  /** lifetime sums under (rule, referral), per beneficiary */
  usedReferredUserKobo: { referrer: bigint; referee: bigint };
  /** rolling-365-day sum under this rule for the referrer */
  usedReferrerYearKobo: bigint;
}

export interface RewardPlan {
  proceed: boolean;
  skipReason?: string;
  poolKobo: bigint;
  referrerKobo: bigint;
  refereeKobo: bigint;
}

const skip = (reason: string): RewardPlan => ({ proceed: false, skipReason: reason, poolKobo: 0n, referrerKobo: 0n, refereeKobo: 0n });

/** Steps 7–10 for one rule firing. Caps CLAMP, never throw. */
export function planReward(rule: ReferralRule, ctx: PlanContext): RewardPlan {
  const rel = rule.release;
  if (rel.type === "installments" && ctx.priorEvents + 1 > (rel.installments ?? 0)) return skip("installments_exhausted");
  if (rel.type === "recurring_capped") {
    const already = ctx.paidRefereeIds.includes(ctx.refereeId);
    if (!already && ctx.paidRefereeIds.length >= (rel.capReferredCount ?? 0)) return skip("referred_count_cap");
    if (ctx.priorEvents >= (rel.capRentPaymentCycles ?? 0)) return skip("cycle_cap");
  }
  if (ctx.marginKobo <= 0n) return skip("no_margin");

  const pool = floorUnit(mul(ctx.marginKobo, rule.poolPercentage));
  let referrer = floorUnit(mul(pool, rule.splitReferrer));
  let referee = floorUnit(mul(pool, rule.splitReferee));

  if (rule.capPerEventKobo != null) {
    const c = BigInt(rule.capPerEventKobo);
    referrer = min(referrer, c);
    referee = min(referee, c);
  }
  if (rule.capPerReferredUserKobo != null) {
    const c = BigInt(rule.capPerReferredUserKobo);
    referrer = min(referrer, c - ctx.usedReferredUserKobo.referrer);
    referee = min(referee, c - ctx.usedReferredUserKobo.referee);
  }
  if (rule.capPerReferrerPerYearKobo != null) {
    referrer = min(referrer, BigInt(rule.capPerReferrerPerYearKobo) - ctx.usedReferrerYearKobo);
  }
  referrer = referrer > 0n ? floorUnit(referrer) : 0n;
  referee = referee > 0n ? floorUnit(referee) : 0n;

  // I1 — the solvency assertion. Should be unreachable given validate.ts.
  if (referrer + referee > mul(ctx.marginKobo, MAX_POOL_FRACTION)) return skip("CRITICAL_solvency_violation");
  if (referrer === 0n && referee === 0n) return skip("capped_to_zero");
  return { proceed: true, poolKobo: pool, referrerKobo: referrer, refereeKobo: referee };
}
