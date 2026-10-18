// backend/shared/src/referrals/rules.ts — ★ SINGLE SOURCE OF TRUTH (spec §5)
// ============================================================
// The ONLY file you edit to change the referral programme.
//   • Tune a number   → edit the value (poolPercentage, caps, windows …)
//   • Remove a program → comment its line out of REFERRAL_RULES at the bottom
//   • Stop everything → REFERRAL_PROGRAM_ENABLED = false (or env
//                        REFERRAL_PROGRAM_ENABLED=false). Existing credit stays
//                        redeemable; no NEW rewards are created.
// validate.ts runs on import and refuses to boot on an edit that would break
// an invariant (pool > 80%, no cap, overlapping priorities …).
// ============================================================
import type { ReferralRule, ServiceCreditType } from "./rule-types";

export const REFERRAL_PROGRAM_ENABLED = true;

/* ───────── Steady-state programs ───────── */

export const OWNER_BASE: ReferralRule = {
  id: "owner-base", active: true,
  description: "Referred owner's first 3 subscription cycles: 50% of fulfillment margin, split evenly, as subscription credit.",
  marketing: { title: "Refer a landlord", blurb: "Earn subscription credit when they subscribe — the better their plan, the more you both earn." },
  referrerRole: "any", refereeRole: "owner",
  trigger: "subscription_payment_cleared", marginSource: "owner_fulfillment_margin",
  poolPercentage: 0.5, splitReferrer: 0.5, splitReferee: 0.5,
  rewardForm: "subscription_credit",
  release: { type: "installments", installments: 3 },
  eligibility: { qualification: "paying_subscriber" },
  exclusiveGroup: "owner-subscription-referral", priority: 0,
  capPerReferrerPerYearKobo: 100_000_00,
  creditExpiryDays: 365,
};

export const AGENT_BASE: ReferralRule = {
  id: "agent-base", active: true,
  description: "Referred agent's first 3 subscription cycles: 50% of subscription margin, split evenly, subscription credit.",
  marketing: { title: "Refer an agent", blurb: "Earn subscription credit when they join and subscribe." },
  referrerRole: "any", refereeRole: "agent",
  trigger: "subscription_payment_cleared", marginSource: "agent_subscription_margin",
  poolPercentage: 0.5, splitReferrer: 0.5, splitReferee: 0.5,
  rewardForm: "subscription_credit",
  release: { type: "installments", installments: 3 },
  eligibility: { qualification: "paying_subscriber" },
  capPerReferrerPerYearKobo: 50_000_00,
  creditExpiryDays: 365,
};

export const RENTER_BASE: ReferralRule = {
  id: "renter-base", active: true,
  description: "Referred renter's first completed rent: 50% of NewCondo's net commission, split evenly, banked subscription credit.",
  marketing: { title: "Refer a renter", blurb: "Earn credit when your friend completes their first rent on NewCondo." },
  referrerRole: "any", refereeRole: "renter",
  trigger: "rent_commission_distributed", marginSource: "platform_commission_margin",
  poolPercentage: 0.5, splitReferrer: 0.5, splitReferee: 0.5,
  rewardForm: "subscription_credit",
  release: { type: "installments", installments: 1 }, // "first completed rent" — one event per referral
  eligibility: { qualification: "settled_transaction" },
  capPerEventKobo: 10_000_00, // D3 — without it the reward scales with ANNUAL rent
  capPerReferrerPerYearKobo: 50_000_00,
  creditExpiryDays: 365,
};

/* ───────── Viral supply campaign ───────── */

export const OWNER_SPRINT: ReferralRule = {
  ...OWNER_BASE,
  id: "owner-sprint",
  description: "Landlord Sprint: 70% pool for the first N qualifying referrers during the launch window. Replaces OWNER_BASE while it matches.",
  marketing: { title: "Founding landlord sprint", blurb: "Launch-window bonus: bigger rewards for the first landlords who bring in landlords." },
  poolPercentage: 0.7,
  eligibility: { qualification: "paying_subscriber", cohortCapturesOnFirstUse: "founding_sprint_owners" },
  priority: 10,
  activeWindow: { start: "2026-11-01T00:00:00+01:00", end: "2027-01-30T23:59:59+01:00" }, // set at launch — 90 days
};

export const FOUNDING_AGENT_OVERRIDE: ReferralRule = {
  id: "founding-agent-override", active: true,
  description: "Founding-100 agent earns 10% of NewCondo's net rent commission on rent paid by landlords they referred. Bounded by cycles, landlord count and ₦ per landlord.",
  marketing: { title: "Founding Agent Override", blurb: "Earn an ongoing cut on every landlord you bring in — for their first rent payments." },
  referrerRole: "agent", refereeRole: "owner",
  trigger: "rent_commission_distributed", marginSource: "platform_commission_margin",
  poolPercentage: 0.1, splitReferrer: 1.0, splitReferee: 0,
  rewardForm: "commission_override",
  payout: "virtual_account", // D2 — paid to the agent's wallet like commission
  release: { type: "recurring_capped", capRentPaymentCycles: 2, capReferredCount: 10 },
  eligibility: { qualification: "cohort_member", cohortOnly: "founding_100_agents" },
  capPerReferredUserKobo: 96_000_00, // D5
  creditExpiryDays: 0,
};

/* ───────── Milestone service credits ───────── */

const ORD: Record<number, string> = { 1: "st", 2: "nd", 3: "rd" };
const milestone = (n: number, type: ServiceCreditType, id: string, title: string): ReferralRule => ({
  id, active: true,
  description: `Referrer unlocks 1 free ${type} when their ${n}${ORD[n] ?? "th"} referred landlord is active — only if the referred cohort's net margin covers the vendor cost.`,
  marketing: { title, blurb: `Unlocked when your ${n}${ORD[n] ?? "th"} referred landlord is active.` },
  referrerRole: "any", refereeRole: "owner",
  trigger: "referral_milestone_reached", marginSource: "fixed_service_cost",
  poolPercentage: 0, splitReferrer: 1, splitReferee: 0,
  rewardForm: "service_credit", serviceCreditType: type,
  milestone: { referredActiveCount: n },
  release: { type: "immediate" },
  eligibility: { qualification: "paying_subscriber" },
  capPerReferredUserKobo: 1, // satisfies I4; the real cap is one grant per (referrer, rule) — unique key
  creditExpiryDays: 365,
});

export const MILESTONE_1 = milestone(1, "waste_management", "milestone-1-waste", "Free month of waste management");
export const MILESTONE_3 = milestone(3, "fumigation", "milestone-3-fumigation", "Free exterior fumigation");
export const MILESTONE_5 = milestone(5, "inspection", "milestone-5-inspection", "Free inspection visit");
export const MILESTONE_10 = milestone(10, "emergency_maintenance", "milestone-10-emergency", "Free emergency dispatch (capped)");

/* ───────── Assembly — comment a line out to remove a program ───────── */
export const REFERRAL_RULES: ReferralRule[] = [
  OWNER_BASE,
  AGENT_BASE,
  RENTER_BASE,
  OWNER_SPRINT,
  FOUNDING_AGENT_OVERRIDE,
  MILESTONE_1,
  MILESTONE_3,
  MILESTONE_5,
  MILESTONE_10,
];

/** Master switch, with an env override for emergencies. */
export const isReferralProgramEnabled = (): boolean =>
  REFERRAL_PROGRAM_ENABLED && process.env.REFERRAL_PROGRAM_ENABLED !== "false";
