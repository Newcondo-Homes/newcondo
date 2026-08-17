// backend/property-service/src/services/deletePropertyService.ts
// ============================================================
// Deleting a listing — the destructive operation the dashboard was missing.
//
// WHO MAY DELETE — this is the part that matters, because a property has TWO
// people attached to it:
//
//   OWNER  → may delete. It's their asset.
//   AGENT  → may NOT delete, even when they created the listing.
//            An agent listing for an owner is acting on the owner's behalf;
//            letting them permanently destroy the owner's property record
//            (and its marking, tenants and payment history) would make an
//            agent dispute catastrophic instead of merely annoying.
//            Agents get resignAsListingAgent() instead — the listing survives,
//            the agent detaches, and the owner can re-assign someone else.
//   ADMIN  → may delete (dispute resolution / fraudulent listings).
//
// WHAT BLOCKS A DELETE — records that are financial, legal, or about a third
// party are never collateral damage:
//
//   • ACTIVE rentals            → a real tenant lives there. Deleting the
//                                 property would orphan their tenancy and rent
//                                 history. End the tenancy first.
//   • Successful payments       → the money trail must survive the listing.
//   • Paid marking jobs         → the marker earned that fee; the job is an
//                                 audit record of work done on the ground.
//
// In those cases we tell them to TAKE THE LISTING DOWN instead (status
// UNAVAILABLE), which hides it from renters while keeping every record intact.
// That's almost always what "delete" actually means to them.
//
// WHAT IS CASCADED — rows that exist only to serve this listing:
//   images (+ S3 objects) · units · documents (+ S3) · share links ·
//   tenant invites · promotion requests + settings · unpaid marking jobs ·
//   duplicate reports
// ============================================================
import { prisma } from "@newcondo/db";
import { badRequest, conflict, forbidden, notFound, deleteObject, publishNotification } from "@newcondo/backend-shared";

export interface DeletePropertyResult {
  deleted: true;
  title: string;
  removedPhotos: number;
}

/** Everything that would make a hard delete destroy someone else's record. */
async function blockers(propertyId: string) {
  const [activeRentals, paidPayments, paidMarking] = await Promise.all([
    prisma.rental.count({ where: { propertyId, status: "ACTIVE" } }),
    prisma.payment.count({ where: { rental: { propertyId }, status: "SUCCESS" } }),
    prisma.propertyMarkingJob.count({ where: { propertyId, paymentStatus: "SUCCESS" } }),
  ]);
  return { activeRentals, paidPayments, paidMarking };
}

/**
 * Permanently delete a property and everything that exists only to serve it.
 * Owner (or admin) only — see the header for why agents are excluded.
 */
export async function deleteProperty(
  propertyId: string,
  userId: string,
  opts: { isAdmin?: boolean } = {}
): Promise<DeletePropertyResult> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      id: true, title: true, ownerId: true, agentId: true, isOwnerListing: true,
      owner: { select: { name: true } },
      images: { select: { id: true, url: true } },
      documents: { select: { id: true, s3Key: true } },
    },
  });
  if (!property) throw notFound("Property not found");

  const isOwner = property.ownerId === userId;
  if (!isOwner && !opts.isAdmin) {
    // Deliberately specific: an agent hitting this needs to know the right
    // action exists, not just that they're refused.
    if (property.agentId === userId) {
      throw forbidden(
        "Only the property owner can delete this listing. You can remove yourself as the listing agent instead."
      );
    }
    throw forbidden("You can't delete this property");
  }

  const b = await blockers(propertyId);
  if (b.activeRentals > 0) {
    throw conflict(
      `This property has ${b.activeRentals} active tenanc${b.activeRentals === 1 ? "y" : "ies"}. End the tenancy first, or take the listing down instead — that hides it from renters and keeps every record.`
    );
  }
  if (b.paidPayments > 0 || b.paidMarking > 0) {
    throw conflict(
      "This property has payment history that must be preserved. Take the listing down instead — it stops appearing to renters and the records stay intact."
    );
  }

  // Delete children first, then the property, in ONE transaction: a partial
  // delete would leave rows pointing at a property that no longer exists.
  // (Some of these have onDelete: Cascade in the schema; doing it explicitly
  // means the behaviour doesn't depend on which relations were configured.)
  await prisma.$transaction([
    prisma.propertyImage.deleteMany({ where: { propertyId } }),
    prisma.document.deleteMany({ where: { propertyId } }),
    prisma.shareLink.deleteMany({ where: { propertyId } }),
    prisma.tenantInvite.deleteMany({ where: { propertyId } }),
    prisma.promotionRequest.deleteMany({ where: { propertyId } }),
    prisma.propertyPromotionSettings.deleteMany({ where: { propertyId } }),
    // PropertyDuplicate's FK is originalPropertyId (duplicatePropertyId is a
    // bare column with no relation), so both sides are cleared explicitly —
    // the FK row would block the delete, the other would be left dangling.
    prisma.propertyDuplicate.deleteMany({
      where: { OR: [{ originalPropertyId: propertyId }, { duplicatePropertyId: propertyId }] },
    }),
    prisma.agentReferral.deleteMany({ where: { propertyId } }),
    prisma.serviceJob.deleteMany({ where: { propertyId } }),
    // Property has a direct paymentAttemptLogs relation — these are diagnostic
    // rows, not money, so they go with the listing. Leaving them would fail
    // the FK and abort the whole delete.
    prisma.paymentAttemptLog.deleteMany({ where: { propertyId } }),
    prisma.virtualAccount.deleteMany({ where: { propertyId } }),
    prisma.markingQueueEntry.deleteMany({ where: { job: { propertyId } } }),
    prisma.propertyMarkingJob.deleteMany({ where: { propertyId } }),
    prisma.rental.deleteMany({ where: { propertyId } }), // only ended ones survive the guard above
    prisma.propertyUnit.deleteMany({ where: { propertyId } }),
    prisma.property.delete({ where: { id: propertyId } }),
  ]);

  // S3 cleanup is best-effort and happens AFTER the transaction commits: a
  // failed object delete must not roll back a successful database delete.
  // Orphaned objects are a storage-cost problem, not a correctness one.
  const keys = [
    ...property.images.map((i) => i.url),
    ...property.documents.map((d) => d.s3Key).filter((k): k is string => !!k),
  ];
  await Promise.all(keys.map((k) => deleteObject(k).catch(() => {})));

  // The other party finds out from the app, not by noticing it vanished.
  // NotificationKind has no "property" channel; property-lifecycle events
  // already ride on "marking" (see createPropertyService's draft notice).
  if (property.agentId && property.agentId !== userId) {
    await publishNotification({
      userId: property.agentId,
      kind: "marking",
      title: "A listing you managed was deleted",
      body: `${property.owner.name ?? "The owner"} deleted “${property.title}”. It's no longer in your listings.`,
      to: "/listings",
      entityType: "property",
      entityId: propertyId,
    });
  }
  if (opts.isAdmin && !isOwner) {
    await publishNotification({
      userId: property.ownerId,
      kind: "marking",
      title: "Your listing was removed",
      body: `“${property.title}” was removed by Newcondo. Contact support if you believe this is a mistake.`,
      to: "/properties",
      entityType: "property",
      entityId: propertyId,
    });
  }

  return { deleted: true, title: property.title, removedPhotos: property.images.length };
}

/**
 * The AGENT's version of "delete": detach from the listing. The property, its
 * marking, photos and tenants all survive and revert to the owner, who can
 * then re-assign another agent.
 */
export async function resignAsListingAgent(
  propertyId: string,
  agentId: string
): Promise<{ ok: true; title: string }> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, title: true, ownerId: true, agentId: true },
  });
  if (!property) throw notFound("Property not found");
  if (property.agentId !== agentId) throw forbidden("You are not the listing agent for this property");

  const active = await prisma.rental.count({ where: { propertyId, status: "ACTIVE" } });
  if (active > 0) {
    throw conflict(
      "This property has an active tenancy you're managing. Hand it over with the owner before stepping down."
    );
  }

  await prisma.$transaction([
    prisma.property.update({
      where: { id: propertyId },
      // isOwnerListing flips back: the property is the owner's direct listing
      // again, which is what drives the "Listed by" line and commission split.
      data: { agentId: null, isOwnerListing: true },
    }),
    // Their promo/share links stop resolving to a listing they no longer hold.
    prisma.shareLink.deleteMany({ where: { propertyId, creatorId: agentId } }),
  ]);

  await publishNotification({
    userId: property.ownerId,
    kind: "marking",
    title: "Your listing agent stepped down",
    body: `“${property.title}” is now listed directly by you. You can invite another agent from My Properties.`,
    to: `/properties/${propertyId}`,
    entityType: "property",
    entityId: propertyId,
  });

  return { ok: true, title: property.title };
}

/**
 * Soft alternative offered whenever a delete is blocked: hide the listing from
 * renters, pause promo links, keep every record.
 */
export async function takeDownProperty(
  propertyId: string,
  userId: string
): Promise<{ ok: true; status: string }> {
  const p = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { ownerId: true, agentId: true },
  });
  if (!p) throw notFound("Property not found");
  if (p.ownerId !== userId && p.agentId !== userId) throw forbidden("You don't list this property");

  const updated = await prisma.property.update({
    where: { id: propertyId },
    data: { status: "UNAVAILABLE", isAvailable: false },
    select: { status: true },
  });
  return { ok: true, status: String(updated.status) };
}

/** Guard preview for the UI, so the delete dialog can explain itself up front. */
export async function getDeletePreview(propertyId: string, userId: string) {
  const p = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { ownerId: true, agentId: true, title: true, _count: { select: { images: true, units: true } } },
  });
  if (!p) throw notFound("Property not found");
  if (p.ownerId !== userId && p.agentId !== userId) throw forbidden("You don't list this property");

  const b = await blockers(propertyId);
  const isOwner = p.ownerId === userId;
  return {
    canDelete: isOwner && b.activeRentals === 0 && b.paidPayments === 0 && b.paidMarking === 0,
    isOwner,
    reason:
      !isOwner
        ? "Only the property owner can delete this listing."
        : b.activeRentals > 0
          ? `${b.activeRentals} active tenanc${b.activeRentals === 1 ? "y" : "ies"} on this property.`
          : b.paidPayments > 0 || b.paidMarking > 0
            ? "This property has payment history that must be preserved."
            : null,
    photos: p._count.images,
    units: p._count.units,
  };
}
