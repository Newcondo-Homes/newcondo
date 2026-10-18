// backend/shared/src/referrals/__tests__/engine.test.ts
// Pure tests — no database. Run:  npx tsx --test src/referrals/__tests__/*.test.ts
// Covers spec §18: 1 (validation), 2 (solvency), 4 (stacking), 5 (installments),
// 6 (windows), 7 (caps), 8 (override maths) and every §18.1 fixture.
import test from "node:test";
import assert from "node:assert/strict";
import { validateRules, ReferralConfigError } from "../validate";
import {
  REFERRAL_RULES, OWNER_BASE, OWNER_SPRINT, AGENT_BASE, RENTER_BASE, FOUNDING_AGENT_OVERRIDE,
} from "../rules";
import { planReward, resolveExclusive, candidateRules, refereeFor, type PlanContext } from "../plan";
import { computeMarginKobo } from "../margin";
import { MAX_POOL_FRACTION } from "../limits";
import type { BusinessEvent, ReferralRule } from "../rule-types";

const N = (naira: number) => BigInt(naira) * 100n;
const ctx = (marginKobo: bigint, over: Partial<PlanContext> = {}): PlanContext => ({
  marginKobo, priorEvents: 0, paidRefereeIds: [], refereeId: "r1",
  usedReferredUserKobo: { referrer: 0n, referee: 0n }, usedReferrerYearKobo: 0n, ...over,
});
const subEvent = (planCode: string, cashNaira: number, at = "2026-12-01T10:00:00+01:00"): BusinessEvent => ({
  type: "subscription_payment_cleared", sourceType: "SUBSCRIPTION_PAYMENT", sourceId: "inv1", occurredAt: at,
  subjectUserId: "owner1", cashCollectedKobo: cashNaira * 100, items: [{ propertyId: "p1", planCode, amountKobo: cashNaira * 100 }],
});

/* ---------- §18.1 — 1. the real rules.ts passes ---------- */
test("real rules.ts validates", () => assert.doesNotThrow(() => validateRules(REFERRAL_RULES)));

/* ---------- §18.1 — 1. validation rejects bad edits ---------- */
test("validation rejects broken rules", () => {
  const bad = (patch: Partial<ReferralRule>) => () => validateRules([{ ...OWNER_BASE, ...patch }]);
  assert.throws(bad({ poolPercentage: 0.9 }), ReferralConfigError);
  assert.throws(bad({ splitReferrer: 0.7, splitReferee: 0.5 }), ReferralConfigError);
  assert.throws(bad({ capPerReferrerPerYearKobo: undefined, release: { type: "immediate" } }), ReferralConfigError);
  assert.throws(bad({ activeWindow: { start: "2027-01-02", end: "2027-01-01" } }), ReferralConfigError);
  assert.throws(() => validateRules([OWNER_BASE, { ...OWNER_SPRINT, priority: 0 }]), /same priority/);
  assert.throws(() => validateRules([OWNER_BASE, OWNER_BASE]), /duplicate id/);
});

/* ---------- §18.1 fixtures ---------- */
test("owner base fixtures (Essential / Plus / Premium)", () => {
  for (const [code, price, margin, each] of [["OWNER_ESSENTIAL", 10_500, 4_667, 1_166], ["OWNER_PLUS", 12_500, 5_625, 1_406], ["OWNER_PREMIUM", 18_250, 8_250, 2_062]] as const) {
    const m = computeMarginKobo("owner_fulfillment_margin", subEvent(code, price));
    assert.equal(m, N(margin), `${code} margin`);
    const p = planReward(OWNER_BASE, ctx(m));
    assert.equal(p.referrerKobo, N(each));
    assert.equal(p.refereeKobo, N(each));
  }
});

test("sprint Essential fixture", () => {
  const p = planReward(OWNER_SPRINT, ctx(N(4_667)));
  assert.equal(p.poolKobo, N(3_266));
  assert.equal(p.referrerKobo, N(1_633));
});

test("agent base fixtures", () => {
  assert.equal(computeMarginKobo("agent_subscription_margin", { ...subEvent("AGENT_ESSENTIAL", 2_000), items: [] }), N(1_800));
  assert.equal(planReward(AGENT_BASE, ctx(N(1_800))).referrerKobo, N(450));
  assert.equal(planReward(AGENT_BASE, ctx(N(3_150))).referrerKobo, N(787));
});

test("override fixtures — with and without listing agent", () => {
  assert.equal(planReward(FOUNDING_AGENT_OVERRIDE, ctx(N(480_000))).referrerKobo, N(48_000));
  assert.equal(planReward(FOUNDING_AGENT_OVERRIDE, ctx(N(240_000))).referrerKobo, N(24_000));
  assert.equal(planReward(FOUNDING_AGENT_OVERRIDE, ctx(N(480_000))).refereeKobo, 0n);
});

test("renter base is clamped by capPerEventKobo (D3)", () => {
  const p = planReward(RENTER_BASE, ctx(N(480_000)));
  assert.equal(p.poolKobo, N(240_000));
  assert.equal(p.referrerKobo, N(10_000));
  assert.equal(p.refereeKobo, N(10_000));
});

/* ---------- §18 — 2. solvency property test ---------- */
test("solvency: rewards ≤ 80% of margin, integer, never negative", () => {
  let seed = 42;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
  const valid = REFERRAL_RULES.filter((r) => r.rewardForm !== "service_credit");
  for (let i = 0; i < 5_000; i++) {
    const rule = valid[Math.floor(rnd() * valid.length)];
    const margin = BigInt(Math.floor(rnd() * 5_000_000_00));
    const p = planReward(rule, ctx(margin, { usedReferrerYearKobo: BigInt(Math.floor(rnd() * 200_000_00)) }));
    assert.ok(p.referrerKobo >= 0n && p.refereeKobo >= 0n);
    assert.ok(p.referrerKobo + p.refereeKobo <= (margin * BigInt(MAX_POOL_FRACTION * 1_000_000)) / 1_000_000n);
  }
});

/* ---------- §18 — 4. stacking ---------- */
test("sprint and base never both pay", () => {
  const inWindow = candidateRules(REFERRAL_RULES, subEvent("OWNER_ESSENTIAL", 10_500, "2026-12-01T10:00:00+01:00"));
  const winners = resolveExclusive(inWindow.filter((r) => r.refereeRole === "owner"));
  assert.ok(winners.some((r) => r.id === "owner-sprint"));
  assert.ok(!winners.some((r) => r.id === "owner-base"));
  // cohort full → sprint dropped before exclusivity → base wins
  const cohortFull = resolveExclusive(inWindow.filter((r) => r.refereeRole === "owner" && r.id !== "owner-sprint"));
  assert.ok(cohortFull.some((r) => r.id === "owner-base"));
});

/* ---------- §18 — 5. installments ---------- */
test("installments: payments 1–3 reward, 4th does not", () => {
  for (let prior = 0; prior < 4; prior++) {
    const p = planReward(OWNER_BASE, ctx(N(4_667), { priorEvents: prior }));
    assert.equal(p.proceed, prior < 3, `prior=${prior}`);
  }
});

/* ---------- §18 — 6. window boundaries (Africa/Lagos offset) ---------- */
test("window edges are inclusive and offset-aware", () => {
  const ids = (at: string) => candidateRules(REFERRAL_RULES, subEvent("OWNER_ESSENTIAL", 10_500, at)).map((r) => r.id);
  assert.ok(ids("2026-11-01T00:00:00+01:00").includes("owner-sprint"));
  assert.ok(!ids("2026-10-31T23:59:59.999+01:00").includes("owner-sprint"));
  assert.ok(ids("2027-01-30T23:59:59+01:00").includes("owner-sprint"));
  assert.ok(!ids("2027-01-31T00:00:00.001+01:00").includes("owner-sprint"));
});

/* ---------- §18 — 7. caps clamp, never throw ---------- */
test("rolling-year cap clamps the referrer share", () => {
  const p = planReward(OWNER_BASE, ctx(N(8_250), { usedReferrerYearKobo: N(99_500) }));
  assert.equal(p.referrerKobo, N(500));
  assert.equal(p.refereeKobo, N(2_062));
  const full = planReward(OWNER_BASE, ctx(N(8_250), { usedReferrerYearKobo: N(100_000) }));
  assert.equal(full.referrerKobo, 0n);
  assert.equal(full.proceed, true); // referee still earns
});

/* ---------- §18 — 8. override bounds ---------- */
test("override: 2 cycles, 10 landlords, ₦96k per landlord", () => {
  assert.equal(planReward(FOUNDING_AGENT_OVERRIDE, ctx(N(480_000), { priorEvents: 2 })).proceed, false);
  const ten = Array.from({ length: 10 }, (_, i) => `l${i}`);
  assert.equal(planReward(FOUNDING_AGENT_OVERRIDE, ctx(N(480_000), { paidRefereeIds: ten, refereeId: "l10" })).skipReason, "referred_count_cap");
  assert.equal(planReward(FOUNDING_AGENT_OVERRIDE, ctx(N(480_000), { paidRefereeIds: ten, refereeId: "l3", priorEvents: 1 })).proceed, true);
  const nearCap = planReward(FOUNDING_AGENT_OVERRIDE, ctx(N(480_000), { usedReferredUserKobo: { referrer: N(90_000), referee: 0n } }));
  assert.equal(nearCap.referrerKobo, N(6_000));
});

/* ---------- §18 — 14. role mapping ---------- */
test("rent events: owner rules resolve to the landlord, renter rules to the renter", () => {
  const ev: BusinessEvent = { type: "rent_commission_distributed", sourceType: "RENT_COMMISSION", sourceId: "pay1", occurredAt: new Date().toISOString(), subjectUserId: "renter1", subjectOwnerId: "owner9" };
  assert.equal(refereeFor("owner", ev), "owner9");
  assert.equal(refereeFor("renter", ev), "renter1");
});
