// backend/admin-service/src/services/staffService.ts
// Staff lifecycle: invite → accept (set password) → active ⇄ frozen; scopes editing.
// Escalation guards:
//   • SUPER_ADMIN can't be invited, edited or frozen through the API
//   • nobody edits or freezes themselves
//   • a non-super staff.manage holder can only grant scopes they hold, can
//     never grant staff.manage, and can't edit another staff.manage holder
//   • optional ADMIN_EMAIL_DOMAINS (comma list) restricts who can be invited
import bcrypt from "bcryptjs";
import { prisma } from "@newcondo/db";
import type { Request } from "express";
import { ADMIN_LIMITS, ADMIN_ROLES, resolveAdminScopes, sendBrandedEmail, AdminEmailTemplates, badRequest, conflict, forbidden, gone, notFound, type AdminRole } from "@newcondo/backend-shared";
import { audit } from "../utils/audit";
import { newToken, sha256 } from "../utils/tokens";
import { page, skipTake, type ListQuery } from "../utils/paginate";
import { bustAccountState } from "../middleware/accountGuard";
import type { StaffMeDTO, StaffRowDTO } from "../types";
import { activeImpersonation } from "./impersonationService";

const DOMAINS = (process.env.ADMIN_EMAIL_DOMAINS ?? "").split(",").map((d) => d.trim().toLowerCase()).filter(Boolean);

function assertCanGrant(req: Request, role: AdminRole, granted: string[], revoked: string[] = []) {
  const me = req.staff!;
  if (me.role === "SUPER_ADMIN") return;
  const eff = resolveAdminScopes(role, granted, revoked);
  if (eff.includes("staff.manage")) throw forbidden("Only a super admin can grant Manage staff");
  const extra = eff.filter((s) => !me.scopes.includes(s));
  if (extra.length) throw forbidden(`You can’t grant permissions you don’t have: ${extra.join(", ")}`);
}

export async function me(req: Request): Promise<StaffMeDTO> {
  const s = req.staff!;
  return { id: s.id, name: s.name, email: s.email, role: s.role, scopes: s.scopes, impersonating: await activeImpersonation(s.id) };
}

export async function list(req: Request, q: ListQuery) {
  const [members, invites] = await Promise.all([
    prisma.staffMember.findMany({ include: { user: { select: { name: true, email: true, devices: { orderBy: { lastSeenAt: "desc" }, take: 1, select: { deviceLabel: true } } } } }, orderBy: { createdAt: "asc" } }),
    prisma.staffInvite.findMany({ where: { acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" } }),
  ]);
  let rows: StaffRowDTO[] = [
    ...members.map((m) => ({ id: m.id, name: m.user.name, email: m.user.email, role: m.adminRole, granted: m.grantedScopes, revoked: m.revokedScopes, status: m.status, lastActiveAt: m.lastActiveAt?.toISOString() ?? null, inviteExpiresAt: null, device: m.user.devices[0]?.deviceLabel ?? null, isSelf: m.id === req.staff!.id })),
    ...invites.map((i) => ({ id: "inv_" + i.id, name: null, email: i.email, role: i.adminRole, granted: i.grantedScopes, revoked: i.revokedScopes, status: "INVITED" as const, lastActiveAt: null, inviteExpiresAt: i.expiresAt.toISOString(), device: null, isSelf: false })),
  ];
  if (q.filter && q.filter !== "all") rows = rows.filter((r) => r.status === q.filter);
  if (q.q) { const t = q.q.toLowerCase(); rows = rows.filter((r) => `${r.name ?? ""} ${r.email} ${r.role}`.toLowerCase().includes(t)); }
  const { skip, take } = skipTake(q);
  return page(rows.slice(skip, skip + take), rows.length, q);
}

export async function invite(req: Request, b: { emails: string[]; role: AdminRole; granted: string[]; revoked: string[] }) {
  if (b.role === "SUPER_ADMIN" && req.staff!.role !== "SUPER_ADMIN") throw forbidden("Only a super admin can do this");
  assertCanGrant(req, b.role, b.granted, b.revoked);
  const emails = [...new Set(b.emails.map((e) => e.trim().toLowerCase()))];
  const off = DOMAINS.length ? emails.find((e) => !DOMAINS.includes(e.split("@")[1])) : undefined;
  if (off) throw badRequest(`${off} isn’t a company address (${DOMAINS.join(", ")})`);
  const existing = await prisma.user.findMany({ where: { email: { in: emails } }, select: { email: true, role: true } });
  const clash = existing.find((u) => u.role !== "ADMIN");
  if (clash) throw conflict(`${clash.email} already has a customer account — staff need a separate work address`);
  const staffClash = existing.find((u) => u.role === "ADMIN");
  if (staffClash) throw conflict(`${staffClash.email} is already on the team`);
  const expiresAt = new Date(Date.now() + ADMIN_LIMITS.INVITE_TTL_HOURS * 3600_000);
  const scopeCount = resolveAdminScopes(b.role, b.granted, b.revoked).length;
  const sent: string[] = [];
  for (const email of emails) {
    const t = newToken();
    await prisma.$transaction(async (tx) => {
      // A new invite to the same address replaces any open one (old link stops working).
      await tx.staffInvite.updateMany({ where: { email, acceptedAt: null, revokedAt: null }, data: { revokedAt: new Date() } });
      const inv = await tx.staffInvite.create({ data: { email, tokenHash: t.hash, adminRole: b.role, grantedScopes: b.granted, revokedScopes: b.revoked, invitedById: req.staff!.id, expiresAt } });
      await audit(tx, req, { action: "STAFF_INVITED", targetType: "StaffInvite", targetId: inv.id, description: `Invited ${email} as ${ADMIN_ROLES[b.role].label}`, metadata: { granted: b.granted, revoked: b.revoked } });
    });
    await sendBrandedEmail(email, AdminEmailTemplates.staffInvite({ invitedBy: req.staff!.name, role: b.role, token: t.raw, scopeCount }));
    sent.push(email);
  }
  return { sent, expiresAt: expiresAt.toISOString() };
}

export async function resendInvite(req: Request, inviteId: string) {
  const inv = await prisma.staffInvite.findUnique({ where: { id: inviteId } });
  if (!inv || inv.acceptedAt || inv.revokedAt) throw notFound("Invite not found");
  return invite(req, { emails: [inv.email], role: inv.adminRole, granted: inv.grantedScopes, revoked: inv.revokedScopes });
}

export async function revokeInvite(req: Request, inviteId: string) {
  const inv = await prisma.staffInvite.findUnique({ where: { id: inviteId } });
  if (!inv || inv.acceptedAt) throw notFound("Invite not found");
  if (inv.adminRole === "SUPER_ADMIN" && req.staff!.role !== "SUPER_ADMIN") throw forbidden("Only a super admin can do this");
  await prisma.$transaction(async (tx) => {
    await tx.staffInvite.update({ where: { id: inviteId }, data: { revokedAt: new Date() } });
    await audit(tx, req, { action: "STAFF_INVITE_REVOKED", targetType: "StaffInvite", targetId: inviteId, description: `Revoked invite for ${inv.email}` });
  });
}

/** Public (no auth): the invitee sets a password. One use; expires; creates User(ADMIN) + StaffMember. */
export async function acceptInvite(b: { token: string; name: string; password: string }) {
  const inv = await prisma.staffInvite.findUnique({ where: { tokenHash: sha256(b.token) } });
  if (!inv || inv.revokedAt) throw notFound("This invite link isn’t valid");
  if (inv.acceptedAt) throw gone("This invite has already been used");
  if (inv.expiresAt < new Date()) throw gone("This invite has expired — ask for a new one");
  const passwordHash = await bcrypt.hash(b.password, 12);
  let member;
  try {
    member = await prisma.$transaction(async (tx) => {
      const claimed = await tx.staffInvite.updateMany({ where: { id: inv.id, acceptedAt: null, revokedAt: null }, data: { acceptedAt: new Date() } });
      if (claimed.count === 0) throw gone("This invite has already been used"); // race-safe single use
      const user = await tx.user.create({ data: { email: inv.email, name: b.name, role: "ADMIN", userType: "ADMIN", passwordHash, emailVerified: new Date(), verificationStatus: "VERIFIED", verifiedAt: new Date() } });
      const m = await tx.staffMember.create({ data: { userId: user.id, adminRole: inv.adminRole, grantedScopes: inv.grantedScopes, revokedScopes: inv.revokedScopes, invitedById: inv.invitedById === "bootstrap" ? null : inv.invitedById } });
      await tx.adminAction.create({ data: { adminId: user.id, action: "STAFF_ACTIVATED", targetType: "StaffMember", targetId: m.id, description: `${b.name} accepted the invite` } });
      return m;
    });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") throw conflict("An account with this email already exists — ask your super admin");
    throw e;
  }
  const inviter = inv.invitedById === "bootstrap" ? null : await prisma.staffMember.findUnique({ where: { id: inv.invitedById }, include: { user: { select: { email: true } } } });
  if (inviter) void sendBrandedEmail(inviter.user.email, AdminEmailTemplates.staffActivated({ name: b.name, email: inv.email }));
  return { email: inv.email, staffId: member.id };
}

async function editable(req: Request, staffId: string) {
  const m = await prisma.staffMember.findUnique({ where: { id: staffId }, include: { user: { select: { name: true, email: true } } } });
  if (!m) throw notFound("Staff member not found");
  if (m.id === req.staff!.id) throw forbidden("You can’t change your own access");
  if (m.adminRole === "SUPER_ADMIN") throw forbidden("Super admin access can’t be changed here");
  if (req.staff!.role !== "SUPER_ADMIN" && resolveAdminScopes(m.adminRole, m.grantedScopes, m.revokedScopes).includes("staff.manage")) throw forbidden("Only a super admin can change another staff manager");
  return m;
}

export async function updateScopes(req: Request, staffId: string, b: { role: AdminRole; granted: string[]; revoked: string[] }) {
  const m = await editable(req, staffId);
  if (b.role === "SUPER_ADMIN") throw badRequest("Super admin can’t be assigned");
  // Store only real deltas against the preset — keeps the record honest when presets change later.
  const preset: readonly string[] = ADMIN_ROLES[b.role].scopes;
  const granted = [...new Set(b.granted)].filter((s) => !preset.includes(s));
  const revoked = [...new Set(b.revoked)].filter((s) => preset.includes(s));
  assertCanGrant(req, b.role, granted, revoked);
  await prisma.$transaction(async (tx) => {
    await tx.staffMember.update({ where: { id: m.id }, data: { adminRole: b.role, grantedScopes: granted, revokedScopes: revoked } });
    await audit(tx, req, { action: "STAFF_SCOPES_CHANGED", targetType: "StaffMember", targetId: m.id, description: `${m.user.name ?? m.user.email} → ${ADMIN_ROLES[b.role].label}`, metadata: { before: { role: m.adminRole, granted: m.grantedScopes, revoked: m.revokedScopes }, after: { role: b.role, granted, revoked } } });
  });
  return { scopes: resolveAdminScopes(b.role, granted, revoked) };
}

export async function setFrozen(req: Request, staffId: string, frozen: boolean) {
  const m = await editable(req, staffId);
  if ((m.status === "FROZEN") === frozen) return;
  await prisma.$transaction(async (tx) => {
    await tx.staffMember.update({ where: { id: m.id }, data: { status: frozen ? "FROZEN" : "ACTIVE", frozenAt: frozen ? new Date() : null } });
    if (frozen) {
      await tx.user.update({ where: { id: m.userId }, data: { sessionsRevokedAt: new Date() } });
      await tx.userDevice.updateMany({ where: { userId: m.userId, revokedAt: null }, data: { revokedAt: new Date() } });
      await tx.impersonationSession.updateMany({ where: { staffId: m.id, endedAt: null }, data: { endedAt: new Date() } });
    }
    await audit(tx, req, { action: frozen ? "STAFF_FROZEN" : "STAFF_UNFROZEN", targetType: "StaffMember", targetId: m.id, description: m.user.name ?? m.user.email });
  });
  await bustAccountState(m.userId);
  void sendBrandedEmail(m.user.email, AdminEmailTemplates.staffFrozen({ name: m.user.name ?? "there", frozen }));
}
