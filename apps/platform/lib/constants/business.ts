// apps/platform/lib/constants/business.ts
// ============================================================
// FRONTEND SHIM — the frontend's ONLY entry point for business constants.
// (Existing header comment kept — the two rules still apply: import the
// ./constants SUBPATH, and use explicit named re-exports, never `export *`.)
// ============================================================
export {
  COMPANY,
  ACTIVE_AREAS,
  isAreaActive,
  MARKING,
  PAYMENTS,
  PLANS,
  REFERRALS,
  TENANTS,
  SERVICES,
  VERIFICATION,
  NG_BANKS,
  AMENITIES,
  // geography + gating (business.geo-addition.ts)
  GEO,
  GEO_STATES,
  lgasIn,
  areasIn,
  isGeoSupported,
  OWNERSHIP_PROOF,
  AGENT_INVITES,
  ACCOUNT_DELETION

} from "@newcondo/backend-shared/constants";

export {
  // ++ subscription plans — single source of truth (subscriptionPlans.ts)
  SUBSCRIPTION_PLANS,
  OWNER_TIER_ORDER,
  ALL_PLAN_CODES,
  planByCode,
  plansFor,
  sellablePlans,
  planRoleFrom,
  resolvePlanCode,
  withCycle,
  formatNairaa as formatNaira,
  formatRate,
  commissionRateFor,
  monthlyEquivalent,
  annualSaving,
  RENTER_LAUNCH_PRICING,
  marginFor,
  costBasisFor,
  // per-property billing + property size
  MAX_PLOTS_SELF_SERVE,
  requiresCustomQuote,
  amountForProperty,
  totalForProperties,
} from "@newcondo/backend-shared/subscriptions"

export type {
  // ++ plan types
  SubscriptionPlanCode,
  SubscriptionPlanSpec,
  PlanRole,
  PlanCycle,
  PricingUnit,
  PropertyLineItem,
} from "@newcondo/backend-shared/subscriptions"


export type {
  ActiveArea,
  Geo,
} from "@newcondo/backend-shared/constants";

