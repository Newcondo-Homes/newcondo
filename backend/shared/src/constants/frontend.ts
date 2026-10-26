// backend/shared/src/constants/frontend.ts
// ============================================================
// THE FRONTEND'S DOOR into backend-shared. The `./constants` subpath in
// backend/shared/package.json points HERE, so the Next.js client bundle
// reaches these constants without touching the package barrel (dist/index.js).
//
// TWO RULES, both learned the hard way — see the same two in
// apps/platform/lib/constants/business.ts:
//
// 1. ONLY import-free modules may be re-exported from this file. Pure data and
//    pure functions, nothing else. The package barrel side-effect-requires
//    ioredis (utils/caching, utils/lockingQueue), @newcondo/db → pg
//    (utils/sharingLink), sharp (imageOptimization) and pdfkit
//    (exportHelper) — all CommonJS requires evaluated at load, so no bundler
//    can tree-shake them. One import of the package root from a client
//    component drags in every one, which is the "Can't resolve 'net' / 'tls'
//    / 'fs' / 'dns' / 'child_process'" wall.
//
//    Before adding a line here:  head -n 40 src/constants/<file>.ts
//    If it imports ANYTHING, it does not belong in this file. Put it in
//    constants/index.ts for backend use only.
//
// 2. EXPLICIT NAMED RE-EXPORTS, never `export *`. Turbopack cannot statically
//    analyse `export *` from a CommonJS build and throws "unexpected export
//    *" — the reason apps/platform/lib/constants/business.ts lists every name
//    by hand. This file is on the same path into the client, so it follows the
//    same rule. (constants/index.ts keeps its `export *` lines: it is
//    backend-only and Node resolves those fine.)
//
// ⚠️ VENDOR_COSTS and EXTRA_PLOT_COST_UPLIFT are deliberately NOT here.
// They are internal vendor economics and margin working; they have no
// business being reachable from a component that renders to a customer.
// Server-side ops code can import them from ./subscriptionPlans directly.
// ============================================================

export {
  COMPANY,
  ACTIVE_AREAS,
  isAreaActive,
  MARKING,
  PAYMENTS,
  REFERRALS,
  TENANTS,
  SERVICES,
  VERIFICATION,
  NG_BANKS,
  AMENITIES,
  GEO,
  GEO_STATES,
  lgasIn,
  areasIn,
  isGeoSupported,
  OWNERSHIP_PROOF,
  AGENT_INVITES,
  OTP,
  OTP_EXPIRY_MS,
  ACCOUNT_STUBS,
  ACCOUNT_DELETION
} from "./business";

export type { ActiveArea, Geo } from "./business";

export {
  // plan data
  SUBSCRIPTION_PLANS,
  RENTER_LAUNCH_PRICING,
  OWNER_TIER_ORDER,
  ALL_PLAN_CODES,
  MAX_PLOTS_SELF_SERVE,
  PLANS,
  // lookups
  planByCode,
  plansFor,
  sellablePlans,
  planRoleFrom,
  resolvePlanCode,
  withCycle,
  // formatting — formatRate is the ONLY rate formatter; a half-point rate
  // renders as 18% under Math.round(r * 100)
  formatNairaa,
  formatRate,
  // money
  commissionRateFor,
  monthlyEquivalent,
  annualSaving,
  amountForProperty,
  totalForProperties,
  requiresCustomQuote,
} from "./subscriptionPlans";

export type {
  SubscriptionPlanCode,
  SubscriptionPlanSpec,
  PlanRole,
  PlanCycle,
  PricingUnit,
  PropertyLineItem,
} from "./subscriptionPlans";

// ++ FLUTTERWAVE FEES — the UI shows the same processing fee the backend charges.
export {
  FLW_FEES,
  withProcessingFee,
  transferFeeFor,
  payoutBreakdown,
  minWithdrawalNaira,
  flutterwaveCollectionCost,
  refundBreakdown,
} from "./fees";

export type { ChargeBreakdown, PayoutBreakdown, RentRefundBreakdown } from "./fees";


// ++ VENDORS — client-safe vendor-network constants (apps/vendors, apps/platform)
export {
  VENDORS_PUBLIC,
  VENDOR_SERVICE_TYPES,
  providerServices,
  isServiceDay,
  normaliseWindow,
  minuteLabel,
} from "./vendorsPublic";

export type {
  VendorServiceType,
  VendorKind,
  VendorProviderType,
  VendorReleaseMode,
  ReminderContactRole,
} from "./vendorsPublic";

// ++ ADMIN — staff roles + permission scopes. adminScopes.ts imports nothing,
// so it is safe in the client bundle. apps/admin reads it ONLY through this
// door (apps/admin/lib/scopes.ts); admin-service reads it from the barrel.
export {
  ADMIN_MODULES,
  ADMIN_ROLES,
  ALL_ADMIN_SCOPES,
  INVITABLE_ADMIN_ROLES,
  ADMIN_LIMITS,
  resolveAdminScopes,
  hasAdminScope,
} from "./adminScopes";

export type { AdminScope, AdminRole } from "./adminScopes";