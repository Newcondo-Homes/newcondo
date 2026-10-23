// backend/admin-service/src/types/request.ts
// Express augmentation (kept apart from DTOs so apps/admin can import types without Express).
import type { AdminRole, AdminScope } from "@newcondo/backend-shared";
export {};

declare global {
  namespace Express {
    interface Request {
      /** Set by requireStaff — the caller's StaffMember row + resolved scopes. */
      staff?: { id: string; userId: string; name: string; email: string; role: AdminRole; scopes: AdminScope[] };
      validQuery?: unknown;
    }
  }
}
