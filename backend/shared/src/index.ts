// backend/shared/src/index.ts

// Middleware exports
//TODO: see what you need from middleware that can be shared all accross and import from here
export {
  errorHandler,
  AppError,
  authMiddleware,
  requestLogger,
  corsMiddleware,
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  logger,
  requireRole,
  validateRequest,
  authenticateToken,
  auth
} from './middleware/index';

// Config exports
export {
  //   connectRedis, 
  //   disconnectRedis, 
  //   getRedisClient,
  //   initializeMapsAPI,
  //   geocodeAddress,
  //   reverseGeocode,
  redis,
  flutterwaveConfig
} from './config/index';

// Type exports
export type * from './types/index';

// Constants exports
export * from './constants/index';

// Utils exports
export * from './utils/index';

// i18n exports
export * from './i18n/index';

// Version info
export const SHARED_VERSION = '1.0.0';
export const BUILD_TIME = new Date().toISOString();

// backend/shared/package.json — SUBPATH EXPORTS PATCH
// ============================================================
// GOAL: keep every business constant in backend-shared (one source of truth,
// enforced server-side) while letting Next.js client components import them
// WITHOUT dragging ioredis / pg / sharp / pdfkit into the browser bundle.
//
// WHY THIS WORKS: the constants files themselves are pure data — no imports
// at all. The ONLY reason they poisoned the client bundle is that everyone
// reached them through the package barrel (dist/index.js), which also
// re-exports utils/caching.js (ioredis), utils/sharingLink.js (→ packages/db
// → pg), utils/imageOptimization.js (sharp) and utils/exportHelper.js
// (pdfkit). Those are side-effectful CommonJS requires evaluated at module
// load, so bundlers cannot tree-shake them away.
//
// A subpath export gives the frontend a door that opens straight onto the
// data file and never touches the barrel.
// ============================================================

/* ---- Replace the "main"/"types" block in backend/shared/package.json ---- */

/*
{
  "name": "@newcondo/backend-shared",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",

  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },

    "./constants": {
      "types": "./dist/constants/business.d.ts",
      "default": "./dist/constants/business.js"
    },

    "./constants/marking": {
      "types": "./dist/constants/marking.d.ts",
      "default": "./dist/constants/marking.js"
    },

    "./constants/markingFees": {
      "types": "./dist/constants/markingFees.d.ts",
      "default": "./dist/constants/markingFees.js"
    },

    "./types": {
      "types": "./dist/types/index.d.ts",
      "default": "./dist/types/index.js"
    },

    "./package.json": "./package.json"
  },

  "files": ["dist"]
}
*/

