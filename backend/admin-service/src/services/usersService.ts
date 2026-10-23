// backend/admin-service/src/services/usersService.ts
// Owners, agents and renters: list, detail (usage, devices, money, rentals), edit,
// suspend/restore, sign out everywhere, revoke verification, field-marker flag.
// Compliance: full BVN/NIN/document numbers, password hashes and bank numbers
// are NEVER selected — every query uses an explicit `select`.
import type { Request } from "express";
import { prisma } from "@newcondo/db";
import type { Prisma } from "@newcondo/db";
import { ACC, sendBrandedEmail, AdminEmailTemplates, EmailTemplates, publishNotification, notFound, forbidden, badRequest } from "@newcondo/backend-shared";
import { audit } from "../utils/audit";
import { page, skipTake, type ListQuery } from "../utils/paginate";
import { bustAccountState } from "../middleware/accountGuard";
import type { UserRowDTO, UserDetailDTO } from "../types";

const DAY = 86_400_000;
const CUSTOMER_ROLES = ["OWNER", "AGENT", "RENTER"] as const;
const ID_TYPES = ["NIN", "BVN", "PASSPORT", "VOTERS_CARD", "DRIVERS_LICENSE", "SELFIE"] as const;
export const mask = (n: string | null | undefined) => (n ? `•••• ${n.slice(-4)}` : null);

function whereFor(q: ListQuery): Prisma.UserWhereInput {
  const w: Prisma.UserWhereInput = { role: { in: [...CUSTOMER_ROLES] }, deletedAt: null };
  if (q.filter === "OWNER" || q.filter === "AGENT" || q.filter === "RENTER") w.role = q.filter;
  if (q.filter === "unverified") w.verificationStatus = { not: "VERIFIED" };
  if (q.filter === "suspended") w.suspendedAt = { not: null };
  if (q.filter === "fieldMarkers") w.isFieldMarker = true;
  if (q.q) w.OR = [{ name: { contains: q.q, mode: "insensitive" } }, { email: { contains: q.q, mode: "insensitive" } }, { phone: { contains: q.q } }, { city: { contains: q.q, mode: "insensitive" } }];
  return w;
}

export async function list(q: ListQuery) {
  const where = whereFor(q);
  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({ where, ...skipTake(q), orderBy: { createdAt: "desc" }, select: {
      id: true, name: true, email: true, phone: true, role: true, verificationStatus: true, suspendedAt: true, createdAt: true,
      subscription: { select: { planType: true, status: true } },
      devices: { orderBy: { lastSeenAt: "desc" }, take: 1, select: { lastSeenAt: true, deviceLabel: true, city: true } },
    } }),
  ]);
  const rows: UserRowDTO[] = users.map((u) => ({
    id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role, plan: u.subscription?.planType ?? null, planStatus: u.subscription?.status ?? null,
    verification: u.verificationStatus, status: u.suspendedAt ? "SUSPENDED" : "ACTIVE", joinedAt: u.createdAt.toISOString(),
    lastSeenAt: u.devices[0]?.lastSeenAt.toISOString() ?? null, lastDevice: u.devices[0]?.deviceLabel ?? null, lastCity: u.devices[0]?.city ?? null,
  }));
  return page(rows, total, q);
}

const isPublic = (p: { status: string; adminApprovalStatus: string; boundaryVerified: boolean; adminHiddenAt: Date | null }) =>
  p.status === "PUBLISHED" && p.adminApprovalStatus === "APPROVED" && p.boundaryVerified && !p.adminHiddenAt;
const P_SEL = { id: true, title: true, status: true, adminApprovalStatus: true, boundaryVerified: true, adminHiddenAt: true } as const;

export async function detail(id: string): Promise<UserDetailDTO> {
  const since = new Date(Date.now() - 30 * DAY);
  const u = await prisma.user.findUnique({ where: { id }, select: {
    id: true, name: true, email: true, phone: true, role: true, verificationStatus: true, suspendedAt: true, suspendedReason: true, createdAt: true,
    city: true, state: true, isFieldMarker: true, deletedAt: true,
    subscription: { select: { planType: true, status: true } },
    referredBy: { select: { referrer: { select: { name: true } } } },
    devices: { orderBy: { lastSeenAt: "desc" }, take: 10 },
    documents: { where: { documentType: { in: [...ID_TYPES] } }, orderBy: { createdAt: "desc" }, select: { documentType: true, status: true, documentNumber: true } },
    properties: { select: P_SEL },
    agentListings: { select: P_SEL },
    rentals: { orderBy: { startDate: "desc" }, take: 10, select: { id: true, status: true, startDate: true, property: { select: { title: true } }, unit: { select: { unitNumber: true } } } },
  } });
  if (!u || u.role === "ADMIN" || u.deletedAt) throw notFound("User not found");
  const [actions30, wallets] = await Promise.all([
    prisma.eventLog.count({ where: { userId: id, timestamp: { gte: since } } }),
    prisma.ledgerAccount.findMany({ where: { code: { in: [ACC.userAvailable(id), ACC.userPending(id)] } }, select: { code: true, balanceKobo: true } }),
  ]);
  const bal = (code: string) => String(wallets.find((w) => w.code === code)?.balanceKobo ?? 0n);
  const recent = u.devices.filter((d) => d.lastSeenAt >= since);
  const d0 = u.devices[0];
  return {
    id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role, plan: u.subscription?.planType ?? null, planStatus: u.subscription?.status ?? null,
    verification: u.verificationStatus, status: u.suspendedAt ? "SUSPENDED" : "ACTIVE", joinedAt: u.createdAt.toISOString(),
    lastSeenAt: d0?.lastSeenAt.toISOString() ?? null, lastDevice: d0?.deviceLabel ?? null, lastCity: d0?.city ?? null,
    area: [u.city, u.state].filter(Boolean).join(", ") || null, referredBy: u.referredBy?.referrer.name ?? null,
    activeDevices30: recent.length, activeDays30: Math.min(30, recent.reduce((a, d) => a + d.activeDays, 0)), actions30,
    walletAvailableKobo: bal(ACC.userAvailable(id)), walletPendingKobo: bal(ACC.userPending(id)),
    suspendedReason: u.suspendedReason, isFieldMarker: u.isFieldMarker,
    idDocuments: u.documents.map((d) => ({ type: d.documentType, status: d.status, numberMasked: mask(d.documentNumber) })),
    devices: u.devices.map((d) => ({ id: d.id, label: d.deviceLabel, city: d.city, firstSeenAt: d.firstSeenAt.toISOString(), lastSeenAt: d.lastSeenAt.toISOString(), activeDays: d.activeDays, signedOut: !!d.revokedAt })),
    properties: [...u.properties.map((p) => ({ id: p.id, title: p.title, relation: "OWNER" as const, status: p.status, public: isPublic(p) })), ...u.agentListings.map((p) => ({ id: p.id, title: p.title, relation: "AGENT" as const, status: p.status, public: isPublic(p) }))],
    rentals: u.rentals.map((r) => ({ id: r.id, property: r.property.title, unit: r.unit?.unitNumber ?? null, status: r.status, since: r.startDate.toISOString() })),
  };
}

async function customer(id: string) {
  const u = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true, email: true, role: true, verificationStatus: true, suspendedAt: true, deletedAt: true } });
  if (!u || u.deletedAt) throw notFound("User not found");
  if (u.role === "ADMIN") throw forbidden("Staff accounts are managed in Staff & access");
  return u;
}

/** Name must match the verified ID — a verified name can only change through re-verification by the user. */
export async function edit(req: Request, id: string, b: { name?: string; phone?: string; city?: string; isFieldMarker?: boolean }) {
  const u = await customer(id);
  if (b.name && u.verificationStatus === "VERIFIED" && b.name !== u.name) throw badRequest("This name is verified against an ID. The user must re-verify to change it.");
  if (b.isFieldMarker && (u.role !== "AGENT" || u.verificationStatus !== "VERIFIED")) throw badRequest("Only verified agent accounts can be NewCondo field markers");
  if (b.phone) {
    const taken = await prisma.user.findFirst({ where: { phone: b.phone, id: { not: id } }, select: { id: true } });
    if (taken) throw badRequest("Another account already uses this phone number");
  }
  await prisma.$transaction(async (tx) => {
    const before = await tx.user.findUniqueOrThrow({ where: { id }, select: { name: true, phone: true, city: true, isFieldMarker: true } });
    await tx.user.update({ where: { id }, data: { ...b, ...(b.phone && b.phone !== before.phone ? { phoneVerified: null } : {}) } });
    await audit(tx, req, { action: "USER_UPDATED", targetType: "User", targetId: id, description: "Edited profile", metadata: { before, after: b } });
  });
}

export async function setSuspended(req: Request, id: string, suspended: boolean, reason?: string) {
  const u = await customer(id);
  if (!!u.suspendedAt === suspended) return;
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id }, data: suspended ? { suspendedAt: new Date(), suspendedReason: reason ?? null, sessionsRevokedAt: new Date() } : { suspendedAt: null, suspendedReason: null } });
    if (suspended) {
      await tx.userDevice.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
      await tx.impersonationSession.updateMany({ where: { targetUserId: id, endedAt: null }, data: { endedAt: new Date() } });
    }
    await audit(tx, req, { action: suspended ? "USER_SUSPENDED" : "USER_RESTORED", targetType: "User", targetId: id, description: `${u.name ?? u.email}${reason ? " — " + reason : ""}` });
  });
  await bustAccountState(id);
  void sendBrandedEmail(u.email, suspended ? AdminEmailTemplates.accountSuspended({ name: u.name ?? "there", reason: reason ?? null }) : AdminEmailTemplates.accountRestored({ name: u.name ?? "there" }));
}

export async function signOutEverywhere(req: Request, id: string) {
  const u = await customer(id);
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id }, data: { sessionsRevokedAt: new Date() } });
    const r = await tx.userDevice.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
    await audit(tx, req, { action: "SESSIONS_REVOKED", targetType: "User", targetId: id, description: `${u.name ?? u.email} — ${r.count} device(s)` });
  });
  await bustAccountState(id);
}

/** Removes the badge. Their public listings are hidden (a listing needs a verified owner) and they must re-submit ID. */
export async function revokeVerification(req: Request, id: string, reason: string) {
  const u = await customer(id);
  if (u.verificationStatus !== "VERIFIED") throw badRequest("This account isn’t verified");
  const hidden = await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id }, data: { verificationStatus: "REJECTED", verifiedAt: null, verifiedBy: null, verificationRejectionReason: reason } });
    await tx.document.updateMany({ where: { userId: id, documentType: { in: [...ID_TYPES] }, status: "APPROVED" }, data: { status: "REJECTED", verificationNotes: `Revoked: ${reason}` } });
    const h = await tx.property.updateMany({ where: { OR: [{ ownerId: id }, { agentId: id }], adminHiddenAt: null, status: "PUBLISHED" }, data: { adminHiddenAt: new Date(), adminHiddenReason: "Verification under review", adminHiddenBy: req.staff!.userId } });
    await audit(tx, req, { action: "VERIFICATION_REVOKED", targetType: "User", targetId: id, description: reason, metadata: { listingsHidden: h.count } });
    return h.count;
  });
  void sendBrandedEmail(u.email, EmailTemplates.verificationRejected({ name: u.name ?? "there", reason }));
  await publishNotification({ userId: id, kind: "verify", title: "Please verify your identity again", body: reason, to: "/profile", entityType: "User", entityId: id });
  return { listingsHidden: hidden };
}

/** For the marking page: field-team markers who may take NEWCONDO jobs. */
export async function fieldMarkers(q?: string) {
  return prisma.user.findMany({
    where: { isFieldMarker: true, role: "AGENT", verificationStatus: "VERIFIED", suspendedAt: null, deletedAt: null, ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { city: { contains: q, mode: "insensitive" } }] } : {}) },
    select: { id: true, name: true, city: true, state: true, _count: { select: { assignedMarkingJobs: { where: { status: { in: ["ASSIGNED", "IN_PROGRESS"] } } } } } },
    orderBy: { name: "asc" }, take: 30,
  }).then((rows) => rows.map((r) => ({ id: r.id, name: r.name, area: [r.city, r.state].filter(Boolean).join(", "), openJobs: r._count.assignedMarkingJobs })));
}
