// backend/shared/src/types/express.d.ts
// ============================================================
// REPLACES the previous version, which used `declare global { namespace Express }`.
//
// WHY THE ERRORS PERSISTED:
// In a pnpm workspace there are usually SEVERAL copies of @types/express
// (root, shared/node_modules, auth-service/node_modules…). A global
// `namespace Express` augmentation patches ONE copy's namespace, while
// middleware/auth.ts imports `Request` from whichever copy its own resolution
// picks — so `req.user` looks missing.
//
// THE ROBUST FIX: augment the module that actually DECLARES Request —
// `express-serve-static-core`. Module augmentation resolves through the same
// module instance the importing file uses, so it holds no matter how many
// @types/express copies exist. This is the canonical Express-v4 pattern.
//
// Keep the global block too — harmless, and it helps editors that resolve
// `Express.Request` (e.g. passport typings) to the same shape.
// ============================================================
import type { Role } from "@newcondo/db";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  name?: string | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  verificationStatus?: string;
  /** set by the i18n middleware */
  preferredLocale?: string;
  iat?: number;
  exp?: number;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthenticatedUser;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
