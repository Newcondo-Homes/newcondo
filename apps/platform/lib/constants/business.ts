// apps/platform/lib/constants/business.ts
// ============================================================
// FRONTEND SHIM — the frontend's ONLY entry point for business constants.
// It re-exports the backend-shared single source of truth so a price/area/
// window changed in backend/shared/src/constants/business.ts reflects in
// both backend and frontend at the next build.
// Monorepo wiring: backend/shared/package.json needs
//   "exports": { ".": "./dist/index.js", "./constants": "./dist/constants/business.js" }
// and apps/platform adds "@newcondo/backend-shared": "workspace:*".
// (Constants are plain data — safe to bundle client-side; never re-export
// server-only utils like s3Upload through this shim.)
// ============================================================
export * from "@newcondo/backend-shared/constants";
