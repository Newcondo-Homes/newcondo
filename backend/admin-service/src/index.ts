// backend/admin-service/src/index.ts — barrel; combined-backend imports admin-service through this file.
export { createAdminRouter, type AdminDeps } from "./routes/index";
export { requireStaff, requireScope } from "./middleware/requireStaff";
export { accountGuard, bustAccountState } from "./middleware/accountGuard";
export type * from "./types/index";
