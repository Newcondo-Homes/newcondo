// apps/platform/lib/constants/business.ts
// ============================================================
// FRONTEND SHIM — the frontend's ONLY entry point for business constants.
// Re-exports the backend-shared single source of truth, so a price/area/
// window changed in backend/shared/src/constants/ reflects in both backend
// and frontend at the next build.
//
// TWO RULES that keep Next.js 16 / Turbopack happy:
//  1. Import the "./constants" SUBPATH, never the package root — the root
//     barrel pulls in Prisma, ioredis and the AWS SDK, which must never
//     reach a client bundle.
//  2. Use EXPLICIT NAMED re-exports, never `export *`. Turbopack cannot
//     statically analyse `export *` from a CommonJS build and throws
//     "unexpected export *". Listing names also tree-shakes better.
//
// Requires (one-time monorepo wiring):
//   • backend/shared/package.json → "exports" map with an ESM build for
//     ./constants (see backend/shared/package.constants-exports.json)
//   • apps/platform/next.config.ts → transpilePackages: ["@newcondo/backend-shared"]
//   • apps/platform/package.json → "@newcondo/backend-shared": "workspace:*"
//
// ⚠️ ONE WIRING CHANGE IS REQUIRED for the plan exports below.
// The "./constants" subpath currently points at ONE FILE —
// dist/constants/business.js. The plan data lives in its own module now, so
// those named imports do not resolve there, and Node falls through to the
// package root barrel — which is exactly how ioredis/pg/sharp/pdfkit end up
// in the client graph ("Can't resolve 'net'/'tls'/'fs'").
//
// Repoint it at the client-safe barrel:
//
//   "./constants": {
//     "types":   "./dist/constants/frontend.d.ts",
//     "default": "./dist/constants/frontend.js"
//   }
//
// NOT at dist/constants/index.js — that barrel re-exports marking.ts,
// analytics.ts, virtualAccount.ts and friends, any of which may import, and
// it uses `export *` (rule 2). frontend.ts exists precisely to be the one
// import-free, explicitly-named door. Then rebuild shared:
//   pnpm --filter @newcondo/backend-shared build
//   ls backend/shared/dist/constants/frontend.js   # must exist
// The app resolves the BUILT file, so a stale dist/ reproduces the old error.
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
  // ++ account deletion — the grace window, confirm phrase, reason list and
  // retention figures quoted by the delete dialog, the emails, the cron job AND
  // the published policy pages. graceDays (21) and policyMaxDays (30) must stay
  // in sync with /privacy §13: the gap between them is the safety margin.
  ACCOUNT_DELETION,
  // ++ subscription plans — single source of truth (subscriptionPlans.ts).
  // Every price, commission rate, service level and plan name the UI shows
  // comes from here; the backend bills from the same file. Nothing in
  // apps/platform may declare a price.
  SUBSCRIPTION_PLANS,
  RENTER_LAUNCH_PRICING,
  OWNER_TIER_ORDER,
  ALL_PLAN_CODES,
  MAX_PLOTS_SELF_SERVE,
  planByCode,
  plansFor,
  planRoleFrom,
  resolvePlanCode,
  withCycle,
  formatNairaa,
  // formatRate is the ONLY rate formatter — `${Math.round(r * 100)}%`
  // renders a half-point rate (Plus was briefly 17.5%) as 18%.
  formatRate,
  commissionRateFor,
  monthlyEquivalent,
  annualSaving,
  amountForProperty,
  totalForProperties,
  requiresCustomQuote,
  // ++ Flutterwave fees passed to users (constants/fees.ts) — the checkout
  // breakdowns below use these so the UI never disagrees with the charge.
  FLW_FEES,
  withProcessingFee,
  transferFeeFor,
  payoutBreakdown,
  minWithdrawalNaira,
  refundBreakdown,
} from "@newcondo/backend-shared/constants";

export type {
  ActiveArea,
  Geo,
  SubscriptionPlanCode,
  SubscriptionPlanSpec,
  PlanRole,
  PlanCycle,
  PricingUnit,
  PropertyLineItem,
  ChargeBreakdown,
  PayoutBreakdown,
  RentRefundBreakdown,
} from "@newcondo/backend-shared/constants";
