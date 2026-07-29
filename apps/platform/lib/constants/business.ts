// apps/platform/lib/constants/business.ts
// ============================================================
// FRONTEND SHIM — the frontend's ONLY entry point for business constants.
// Re-exports the backend-shared single source of truth, so a price/area/
// window changed in backend/shared/src/constants/business.ts reflects in
// both backend and frontend at the next build.
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
} from "@newcondo/backend-shared/constants";

export type { ActiveArea } from "@newcondo/backend-shared/constants";
