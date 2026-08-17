// backend/property-service/src/services/tenantService.ts
// ============================================================
// Tenants & tenant-invite links.
// Renters can't self-register — the owner/listing agent shares a link that is
// specific to (inviter, property[, unit]). Onboarding through it creates the
// renter account AND the Rental row, which is what surfaces the tenant in the
// lister's dashboard.
// Tokens: sha256-hashed at rest (a DB leak can't mint working links),
// single-use, 14-day expiry. Lister ownership re-checked on every call.
//
// >>> OWNERSHIP GATE <<<
// assertOwnershipProof(propertyId, "INVITE_TENANT") runs in
// createTenantInvite, before a token is minted. Inviting a tenant is the
// highest-stakes exposure of all three gated actions — it moves a real person
// and their rent money into a property — so an undocumented property must not
// be able to produce an invite link at all.
//
// NOT gated: validateTenantInvite / acceptTenantInvite. Once a renter holds a
// link, the document check has already happened at creation; blocking the
// renter mid-onboarding would punish the wrong person for the lister's
// paperwork. If a document is removed later, revoke the invite.
//
// BUILD NOTES:
//  • Every exported function has an EXPLICIT return type — Prisma 7's inferred
//    payload types can't be named across package boundaries (TS2742).
//  • AppError is an interface in shared/types; throw the ServiceError helpers.
//  • Property.agentId is the listing agent (there is no listingAgentId).
// ============================================================
import { createHash, randomBytes } from "crypto";
import { prisma } from "@newcondo/db";
import { forbidden, gone, notFound } from "@newcondo/backend-shared";
import { assertOwnershipProof } from "./ownershipDocService";

const hashToken = (raw: string) => createHash("sha256").update(raw).digest("hex");
const INVITE_TTL_MS = 14 * 24 * 3600_000;

/** Caller must be the property's owner or its listing agent. */
async function assertListerAccess(propertyId: string, userId: string) {
  const p = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, title: true, ownerId: true, agentId: true },
  });
  if (!p) throw notFound("Property not found");
  if (p.ownerId !== userId && p.agentId !== userId) throw forbidden("You do not list this property");
  return p;
}

export interface TenantRow {
  id: string;
  status: string;
  startDate: Date;
  endDate: Date | null;
  monthlyRent: number;
  unit: { id: string; unitNumber: string } | null;
  renter: { id: string; name: string | null; email: string; phone: string | null; verificationStatus: string };
}

/** Tenants (active + past Rentals) on one property, newest first. */
export async function listTenants(propertyId: string, callerId: string): Promise<TenantRow[]> {
  await assertListerAccess(propertyId, callerId);
  const rows = await prisma.rental.findMany({
    where: { propertyId },
    orderBy: { startDate: "desc" },
    select: {
      id: true, status: true, startDate: true, endDate: true, monthlyRent: true,
      unit: { select: { id: true, unitNumber: true } },
      renter: { select: { id: true, name: true, email: true, phone: true, verificationStatus: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    status: String(r.status),
    startDate: r.startDate,
    endDate: r.endDate,
    monthlyRent: Number(r.monthlyRent ?? 0),
    unit: r.unit,
    renter: { ...r.renter, verificationStatus: String(r.renter.verificationStatus) },
  }));
}

export interface TenantDetail extends TenantRow {
  property: { id: string; title: string };
  payments: { id: string; amount: number; status: string; paymentType: string; createdAt: Date }[];
}

/** Full tenant detail incl. payment trail — for the tenant detail modal. */
export async function getTenantDetail(rentalId: string, callerId: string): Promise<TenantDetail> {
  const r = await prisma.rental.findUnique({
    where: { id: rentalId },
    select: {
      id: true, status: true, startDate: true, endDate: true, monthlyRent: true,
      unit: { select: { id: true, unitNumber: true } },
      renter: { select: { id: true, name: true, email: true, phone: true, verificationStatus: true } },
      property: { select: { id: true, title: true, ownerId: true, agentId: true } },
      payments: {
        orderBy: { createdAt: "desc" }, take: 12,
        select: { id: true, amount: true, status: true, paymentType: true, createdAt: true },
      },
    },
  });
  if (!r) throw notFound("Tenant record not found");
  if (r.property.ownerId !== callerId && r.property.agentId !== callerId) throw forbidden("Not your tenant");

  return {
    id: r.id,
    status: String(r.status),
    startDate: r.startDate,
    endDate: r.endDate,
    monthlyRent: Number(r.monthlyRent ?? 0),
    unit: r.unit,
    renter: { ...r.renter, verificationStatus: String(r.renter.verificationStatus) },
    property: { id: r.property.id, title: r.property.title },
    payments: r.payments.map((p) => ({
      id: p.id, amount: Number(p.amount), status: String(p.status),
      paymentType: String(p.paymentType), createdAt: p.createdAt,
    })),
  };
}

export interface TenantInviteResult { url: string; propertyTitle: string; expiresInDays: number }

/** Create a single-use invite link for (caller, property[, unit]). */
export async function createTenantInvite(opts: {
  propertyId: string; inviterId: string; unitId?: string;
}): Promise<TenantInviteResult> {
  const property = await assertListerAccess(opts.propertyId, opts.inviterId);

  // GATE — after the lister check (so a stranger hears "you do not list this
  // property", not a hint about someone else's paperwork), before a token
  // exists. No invite link can be minted for an undocumented property.
  await assertOwnershipProof(opts.propertyId, "INVITE_TENANT");

  if (opts.unitId) {
    const unit = await prisma.propertyUnit.findFirst({
      where: { id: opts.unitId, propertyId: opts.propertyId }, select: { id: true },
    });
    if (!unit) throw notFound("Unit not found on this property");
  }

  const raw = randomBytes(32).toString("base64url");
  await prisma.tenantInvite.create({
    data: {
      tokenHash: hashToken(raw),
      propertyId: opts.propertyId,
      inviterId: opts.inviterId,
      unitId: opts.unitId ?? null,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    },
  });
  return { url: `${process.env.FRONTEND_URL}/tenant-invite/${raw}`, propertyTitle: property.title, expiresInDays: 14 };
}

export interface TenantInviteContext {
  property: { id: string; title: string; location: string; state: string | null };
  inviter: { name: string | null; role: string };
  flatLabel: string | null;
  units: { label: string; status: string }[];
}

/** PUBLIC (pre-auth): validate a link so the onboarding page can render context. */
export async function validateTenantInvite(rawToken: string): Promise<TenantInviteContext> {
  const invite = await prisma.tenantInvite.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    select: {
      usedAt: true, expiresAt: true,
      property: {
        select: {
          id: true, title: true, address: true, city: true, state: true,
          units: { select: { unitNumber: true, status: true } },
        },
      },
      inviter: { select: { name: true, role: true } },
      unit: { select: { unitNumber: true } },
    },
  });
  if (!invite) throw notFound("This invite link is not valid");
  if (invite.usedAt) throw gone("This invite link has already been used");
  if (invite.expiresAt < new Date()) throw gone("This invite link has expired — ask for a new one");

  const p = invite.property;
  return {
    property: {
      id: p.id, title: p.title,
      location: [p.address, p.city].filter(Boolean).join(", "),
      state: p.state,
    },
    inviter: { name: invite.inviter.name, role: String(invite.inviter.role) },
    flatLabel: invite.unit?.unitNumber ?? null,
    // The renter MUST pick a flat when the link didn't pin one and the
    // building has several — the onboarding page uses this list.
    units: p.units.map((u) => ({ label: u.unitNumber, status: String(u.status) })),
  };
}

export interface AcceptedInvite {
  rental: { id: string; propertyId: string };
  inviterId: string;
  propertyId: string;
  unitNumber: string | null;
}

/**
 * Consume the invite AFTER auth-service registers the renter (register accepts
 * `inviteToken` and calls this in the same flow). Atomic: marks the invite used
 * + creates the Rental in one transaction. `unitLabel` is the renter's pick
 * when the link left the unit open.
 */
export async function acceptTenantInvite(
  rawToken: string,
  renterId: string,
  unitLabel?: string
): Promise<AcceptedInvite> {
  const tokenHash = hashToken(rawToken);
  return prisma.$transaction(async (tx) => {
    const invite = await tx.tenantInvite.findUnique({
      where: { tokenHash },
      select: {
        propertyId: true, inviterId: true, unitId: true, usedAt: true, expiresAt: true,
        unit: { select: { id: true, price: true, unitNumber: true } },
        property: { select: { price: true } },
      },
    });
    if (!invite || invite.usedAt || invite.expiresAt < new Date()) throw gone("Invite link is no longer valid");

    // Renter-chosen unit when the lister left it open.
    let unit = invite.unit;
    if (!unit && unitLabel) {
      unit = await tx.propertyUnit.findFirst({
        where: { propertyId: invite.propertyId, unitNumber: unitLabel },
        select: { id: true, price: true, unitNumber: true },
      });
    }

    await tx.tenantInvite.update({ where: { tokenHash }, data: { usedAt: new Date(), renterId } });
    const rental = await tx.rental.create({
      data: {
        propertyId: invite.propertyId,
        unitId: unit?.id ?? null,
        renterId,
        startDate: new Date(),
        monthlyRent: Number(unit?.price ?? invite.property.price ?? 0),
        status: "ACTIVE",
      },
      select: { id: true, propertyId: true },
    });
    return { rental, inviterId: invite.inviterId, propertyId: invite.propertyId, unitNumber: unit?.unitNumber ?? null };
  });
}
