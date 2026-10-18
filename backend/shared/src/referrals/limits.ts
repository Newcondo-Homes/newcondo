// backend/shared/src/referrals/limits.ts — spec §6. Global safety rails.
export const MAX_POOL_FRACTION = 0.8; // I1 — validated at boot
export const REFERRAL_ATTRIBUTION_WINDOW_DAYS = 30; // D9 — cookie lifetime
export const SUBSCRIPTION_REWARD_HOLD_HOURS = 72; // D8 — refund/dispute buffer
export const RENT_REWARD_HOLD_HOURS = 0; // rent commission is already post-escrow
export const CREDIT_EXPIRY_WARNING_DAYS = 30;
export const AGENT_SUBSCRIPTION_COST_RATE = 0.1;
/** Every share is floored to whole naira, so rounding favours Newcondo and
 *  the §18.1 fixtures (₦1,166, ₦2,333 …) hold exactly. */
export const REWARD_ROUNDING_UNIT_KOBO = 100;
/** Emergency-dispatch service credit face value (placeholder — confirm with
 *  real contractor quotes). Other service costs come from VENDOR_COSTS. */
export const EMERGENCY_DISPATCH_CAP_NAIRA = 20_000;
/** Fraud: more than this many attributions to one referrer from one signup
 *  IP hash inside 24h puts the next one on hold. */
export const FRAUD_SAME_IP_PER_DAY = 3;
