// backend/shared/src/referrals/validate.ts — spec §4.3
// Runs on import (index.ts) and in tests. A bad edit to rules.ts fails the
// boot with a readable message instead of paying out wrongly in production.
import type { ReferralRule } from "./rule-types";
import { COHORTS } from "./cohorts";
import { MAX_POOL_FRACTION, REWARD_ROUNDING_UNIT_KOBO, SUBSCRIPTION_REWARD_HOLD_HOURS } from "./limits";

export class ReferralConfigError extends Error {}

const in01 = (n: number) => typeof n === "number" && n >= 0 && n <= 1;

export function validateRules(rules: ReferralRule[]): void {
  const errors: string[] = [];
  const ids = new Set<string>();
  const groupPriorities = new Map<string, Map<number, string>>();

  if (!(MAX_POOL_FRACTION > 0 && MAX_POOL_FRACTION <= 1)) errors.push("MAX_POOL_FRACTION must be in (0, 1]");
  if (REWARD_ROUNDING_UNIT_KOBO < 1) errors.push("REWARD_ROUNDING_UNIT_KOBO must be ≥ 1");
  if (SUBSCRIPTION_REWARD_HOLD_HOURS < 0) errors.push("SUBSCRIPTION_REWARD_HOLD_HOURS must be ≥ 0");

  for (const r of rules) {
    const e = (msg: string) => errors.push(`[${r.id}] ${msg}`);
    if (ids.has(r.id)) e("duplicate id");
    ids.add(r.id);

    if (!in01(r.splitReferrer) || !in01(r.splitReferee)) e("splits must be within 0–1");
    if (r.splitReferrer + r.splitReferee > 1 + 1e-9) e("splitReferrer + splitReferee > 1");

    const isService = r.rewardForm === "service_credit";
    if (!in01(r.poolPercentage)) e("poolPercentage must be within 0–1");
    if (r.poolPercentage > MAX_POOL_FRACTION) e(`poolPercentage ${r.poolPercentage} > MAX_POOL_FRACTION ${MAX_POOL_FRACTION}`);
    if (!isService && r.poolPercentage <= 0) e("poolPercentage must be > 0 (only service-credit rules may use 0)");

    const hasCap =
      !!r.capPerEventKobo || !!r.capPerReferredUserKobo || !!r.capPerReferrerPerYearKobo ||
      !!r.release.capReferredCount || !!r.release.capRentPaymentCycles || !!r.release.installments ||
      !!(r.eligibility.cohortOnly || r.eligibility.cohortCapturesOnFirstUse);
    if (!hasCap) e("no hard cap (I4) — add capPerEvent/ReferredUser/ReferrerPerYear, installments or a cohort");

    if (r.release.type === "recurring_capped" && !(r.release.capRentPaymentCycles && r.release.capReferredCount)) {
      e("recurring_capped needs both capRentPaymentCycles and capReferredCount");
    }
    if (r.release.type === "installments" && !(r.release.installments && r.release.installments > 0)) {
      e("installments release needs installments > 0");
    }
    if (isService && !r.serviceCreditType) e("service_credit needs serviceCreditType");
    if (r.rewardForm === "commission_override" && r.trigger !== "rent_commission_distributed") {
      e("commission_override must trigger on rent_commission_distributed");
    }
    if (r.trigger === "referral_milestone_reached" && !r.milestone) e("milestone trigger needs `milestone`");
    if (r.activeWindow) {
      const s = Date.parse(r.activeWindow.start), en = Date.parse(r.activeWindow.end);
      if (!Number.isFinite(s) || !Number.isFinite(en)) e("activeWindow has an unparseable date");
      else if (en <= s) e("activeWindow.end must be after start");
    }
    for (const c of [r.eligibility.cohortOnly, r.eligibility.cohortCapturesOnFirstUse]) {
      if (c && !(c in COHORTS)) e(`unknown cohort ${c}`);
    }
    if (r.exclusiveGroup) {
      const p = r.priority ?? 0;
      const g = groupPriorities.get(r.exclusiveGroup) ?? new Map<number, string>();
      if (g.has(p)) e(`same priority ${p} as ${g.get(p)} in exclusiveGroup ${r.exclusiveGroup}`);
      g.set(p, r.id);
      groupPriorities.set(r.exclusiveGroup, g);
    }
    if (r.creditExpiryDays < 0) e("creditExpiryDays must be ≥ 0");
  }
  for (const [id, c] of Object.entries(COHORTS)) if (!(c.size > 0)) errors.push(`cohort ${id} size must be > 0`);

  if (errors.length) throw new ReferralConfigError(`Referral config invalid:\n  - ${errors.join("\n  - ")}`);
}
