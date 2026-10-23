// backend/admin-service/src/services/impersonationService.ts
// "Act as user": a 30-minute, reason-bound support session.
//
//   1. staff (users.impersonate) POST /admin/users/:id/impersonate { reason }
//   2. the session id is generated FIRST, a backend JWT is signed for the
//      TARGET user with { userId, email, role, imp: { sid, staffId } } — the
//      same payload shape @newcondo/auth mints, plus `imp` — and only its
//      sha256 is stored
//   3. apps/admin opens {PLATFORM_URL | VENDORS_APP_URL}/support-session#t=<jwt>
//      (fragment → never in server logs); that page keeps it in memory only
//   4. accountGuard enforces expiry, blocks money/credential routes and logs
//      every mutating call (middleware/accountGuard.ts)
//   5. the user is emailed that support opened their account
// The raw token is returned exactly once (on start). It is never re-issued.
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import type { Request } from "express";
import { prisma } from "@newcondo/db";
import { ADMIN_LIMITS, sendBrandedEmail, AdminEmailTemplates, forbidden, notFound, conflict } from "@newcondo/backend-shared";
import { audit, ipHash } from "../utils/audit";
import { sha256 } from "../utils/tokens";
import type { ImpersonationDTO } from "../types";

const base = (role: string) => ((role === "VENDOR" ? process.env.VENDORS_APP_URL || "https://vendors.newcondo.homes" : process.env.PLATFORM_URL || "https://newcondo.homes")).replace(/\/$/, "");

export async function activeImpersonation(staffId: string): Promise<ImpersonationDTO | null> {
  const s = await prisma.impersonationSession.findFirst({ where: { staffId, endedAt: null, expiresAt: { gt: new Date() } }, include: { target: { select: { name: true, email: true, role: true } } } });
  return s ? { id: s.id, targetUserId: s.targetUserId, targetName: s.target.name ?? s.target.email, targetRole: s.target.role, reason: s.reason, expiresAt: s.expiresAt.toISOString(), platformUrl: null } : null;
}

export async function start(req: Request, targetUserId: string, reason: string): Promise<ImpersonationDTO> {
  const staff = req.staff!;
  const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true, email: true, name: true, role: true, deletedAt: true, suspendedAt: true } });
  if (!target || target.deletedAt) throw notFound("User not found");
  if (target.role === "ADMIN") throw forbidden("You can’t act as a staff member");
  if (target.suspendedAt) throw forbidden("Restore the account before acting as this user");

  const id = randomUUID();
  const expiresAt = new Date(Date.now() + ADMIN_LIMITS.IMPERSONATION_MINUTES * 60_000);
  const token = jwt.sign({ userId: target.id, email: target.email, role: target.role, imp: { sid: id, staffId: staff.id } }, process.env.JWT_SECRET!, { expiresIn: ADMIN_LIMITS.IMPERSONATION_MINUTES * 60 });

  await prisma.$transaction(async (tx) => {
    // One open session per staff member — checked inside the transaction.
    const open = await tx.impersonationSession.count({ where: { staffId: staff.id, endedAt: null, expiresAt: { gt: new Date() } } });
    if (open) throw conflict("End your current support session first");
    await tx.impersonationSession.create({ data: { id, staffId: staff.id, targetUserId, reason, tokenHash: sha256(token), expiresAt, ipHash: ipHash(req) } });
    await audit(tx, req, { action: "IMPERSONATION_STARTED", targetType: "User", targetId: targetUserId, description: `Acting as ${target.name ?? target.email}: ${reason}`, metadata: { sessionId: id } });
  });
  void sendBrandedEmail(target.email, AdminEmailTemplates.supportAccess({ name: target.name ?? "there", staffName: staff.name, reason, minutes: ADMIN_LIMITS.IMPERSONATION_MINUTES }));
  return { id, targetUserId, targetName: target.name ?? target.email, targetRole: target.role, reason, expiresAt: expiresAt.toISOString(), platformUrl: `${base(target.role)}/support-session#t=${encodeURIComponent(token)}` };
}

export async function end(req: Request) {
  const s = await prisma.impersonationSession.findFirst({ where: { staffId: req.staff!.id, endedAt: null } });
  if (!s) return;
  await prisma.$transaction(async (tx) => {
    await tx.impersonationSession.update({ where: { id: s.id }, data: { endedAt: new Date() } });
    await audit(tx, req, { action: "IMPERSONATION_ENDED", targetType: "User", targetId: s.targetUserId, description: "Support session ended" });
  });
}
