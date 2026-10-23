// backend/admin-service/src/middleware/requireStaff.ts
// Runs AFTER accountGuard (global) and shared authMiddleware. A staff request needs:
//   1. a backend JWT whose user is role ADMIN in the DATABASE (the JWT role can be stale)
//   2. an ACTIVE StaffMember row
// Scopes are resolved on EVERY request from the DB row + adminScopes.ts, so a
// permission change or freeze takes effect immediately — no stale scopes in a token.
// Impersonation tokens never reach here: their subject is never an ADMIN, and
// accountGuard blocks /admin for them regardless.
import type { Request, Response, NextFunction } from "express";
import { prisma } from "@newcondo/db";
import { resolveAdminScopes, hasAdminScope, type AdminScope } from "@newcondo/backend-shared";
import "../types/request";

const deny = (res: Response, code: number, message: string) => { res.status(code).json({ success: false, message }); };

export async function requireStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return deny(res, 401, "Authentication required");
    const m = await prisma.staffMember.findUnique({ where: { userId: req.user.id }, include: { user: { select: { name: true, email: true, role: true, deletedAt: true } } } });
    if (!m || m.user.role !== "ADMIN" || m.user.deletedAt) return deny(res, 403, "Not a staff member");
    if (m.status !== "ACTIVE") return deny(res, 403, "This staff account is frozen");
    req.staff = { id: m.id, userId: m.userId, name: m.user.name ?? m.user.email, email: m.user.email, role: m.adminRole, scopes: resolveAdminScopes(m.adminRole, m.grantedScopes, m.revokedScopes) };
    if (!m.lastActiveAt || Date.now() - m.lastActiveAt.getTime() > 5 * 60_000) prisma.staffMember.update({ where: { id: m.id }, data: { lastActiveAt: new Date() } }).catch(() => {});
    next();
  } catch (e) { next(e); }
}

/** Guard a route by one or more scopes (ALL required). `any` → at least one. */
export const requireScope = (need: AdminScope | AdminScope[], mode: "all" | "any" = "all") =>
  (req: Request, res: Response, next: NextFunction): void => {
    const s = req.staff?.scopes ?? [];
    const list = Array.isArray(need) ? need : [need];
    const ok = mode === "all" ? hasAdminScope(s, list) : list.some((n) => s.includes(n));
    if (!ok) return deny(res, 403, `Missing permission: ${list.join(mode === "all" ? " + " : " or ")}`);
    next();
  };

/** In-handler check for options that need an extra scope (e.g. a refund outcome inside a dispute). */
export const hasScope = (req: Request, s: AdminScope) => !!req.staff?.scopes.includes(s);
