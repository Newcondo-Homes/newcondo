// backend/admin-service/src/services/approvalsService.ts
// Two review queues, oldest first:
//
//   IDENTITY  one card per USER (not per document) whose verification is
//             PENDING and who has pending ID documents. Approve = every
//             pending ID doc APPROVED + user VERIFIED, in one transaction.
//             (Approving one doc at a time used to mark users verified with a
//             selfie still unchecked.)                           verification.review
//
//   LISTING   Property status PENDING + adminApprovalStatus PENDING (submitted
//             for review — drafts never appear). Approval is BLOCKED unless:
//               • the owner is identity-VERIFIED
//               • an ownership document is on file
//               • the boundary is marked AND confirmed (boundaryVerified)
//             This is where staff verify the mark itself: the marking
//             snapshot + mask are shown, and a rejection can also release the
//             mask for re-marking.                                listings.review
//
// Marking DISPUTES (owner rejected a marker's mask) live on the Marking page —
// resolving them moves marker money, so they go through marking-service.
// Document previews are presigned for 5 minutes; numbers are masked.
import type { Request } from "express";
import { prisma } from "@newcondo/db";
import type { Prisma } from "@newcondo/db";
import { publishNotification, sendBrandedEmail, EmailTemplates, presignDownload, notFound, badRequest, conflict } from "@newcondo/backend-shared";
import { audit } from "../utils/audit";
import { page, skipTake, type ListQuery } from "../utils/paginate";
import { mask } from "./usersService";
import type { ApprovalDTO } from "../types";

const ID_TYPES = ["NIN", "BVN", "PASSPORT", "VOTERS_CARD", "DRIVERS_LICENSE", "SELFIE"] as const;
const OWNERSHIP_TYPES = ["OWNERSHIP_DOCUMENT", "CONSENT_DOCUMENT", "UNDERTAKING_DOCUMENT"] as const;
const PREVIEW_TTL = 300;

const url = async (key: string | null | undefined) => (key ? presignDownload(key, PREVIEW_TTL).catch(() => null) : null);
const docDTO = async (d: { id: string; documentType: string; documentSide: string | null; documentNumber: string | null; s3Key: string | null }) =>
  ({ id: d.id, type: d.documentType, side: d.documentSide, numberMasked: mask(d.documentNumber), url: await url(d.s3Key) });
const DOC_SEL = { id: true, documentType: true, documentSide: true, documentNumber: true, s3Key: true, createdAt: true } as const;

/* ---------------- identity ---------------- */
const idWhere = (q: ListQuery): Prisma.UserWhereInput => ({
  verificationStatus: "PENDING", deletedAt: null, role: { not: "ADMIN" },
  documents: { some: { status: "PENDING", documentType: { in: [...ID_TYPES] } } },
  ...(q.q ? { OR: [{ name: { contains: q.q, mode: "insensitive" } }, { email: { contains: q.q, mode: "insensitive" } }] } : {}),
});

export async function identityQueue(q: ListQuery) {
  const where = idWhere(q);
  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({ where, ...skipTake(q), orderBy: { updatedAt: "asc" }, select: {
      id: true, name: true, role: true, verificationStatus: true, dateOfBirth: true,
      documents: { where: { status: "PENDING", documentType: { in: [...ID_TYPES] } }, orderBy: { createdAt: "asc" }, select: DOC_SEL },
    } }),
  ]);
  const rows: ApprovalDTO[] = await Promise.all(users.map(async (u) => {
    const types = new Set(u.documents.map((d) => d.documentType));
    const blockers = [
      ...(types.has("SELFIE") ? [] : ["No selfie submitted"]),
      ...([...types].some((t) => t !== "SELFIE") ? [] : ["No government ID submitted"]),
    ];
    return {
      id: u.id, kind: "IDENTITY" as const, who: { id: u.id, name: u.name, role: u.role, verification: u.verificationStatus },
      label: [...types].map((t) => t.replace(/_/g, " ").toLowerCase()).join(" + "), propertyId: null,
      submittedAt: u.documents[0].createdAt.toISOString(), note: u.dateOfBirth ? `DOB on file: ${u.dateOfBirth.toISOString().slice(0, 10)}` : null,
      documents: await Promise.all(u.documents.map(docDTO)), blockers,
    };
  }));
  return page(rows, total, q);
}

export async function decideIdentity(req: Request, userId: string, approve: boolean, reason?: string) {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, verificationStatus: true, documents: { where: { status: "PENDING", documentType: { in: [...ID_TYPES] } }, select: { id: true, documentType: true } } } });
  if (!u) throw notFound("User not found");
  if (u.verificationStatus !== "PENDING" || !u.documents.length) throw conflict("This check was already decided");
  if (approve) {
    const t = new Set(u.documents.map((d) => d.documentType));
    if (!t.has("SELFIE") || ![...t].some((x) => x !== "SELFIE")) throw badRequest("A government ID and a selfie are both required before approving");
  }
  await prisma.$transaction(async (tx) => {
    await tx.document.updateMany({ where: { id: { in: u.documents.map((d) => d.id) } }, data: { status: approve ? "APPROVED" : "REJECTED", verificationNotes: approve ? null : reason } });
    await tx.user.update({ where: { id: userId }, data: approve
      ? { verificationStatus: "VERIFIED", verifiedAt: new Date(), verifiedBy: req.staff!.userId, verificationRejectionReason: null }
      : { verificationStatus: "REJECTED", verificationRejectionReason: reason } });
    await audit(tx, req, { action: approve ? "USER_VERIFIED" : "USER_REJECTED", targetType: "User", targetId: userId, description: approve ? "Identity approved" : `Identity rejected: ${reason}`, metadata: { documents: u.documents.map((d) => d.documentType) } });
  });
  void sendBrandedEmail(u.email, approve ? EmailTemplates.verificationApproved({ name: u.name ?? "there" }) : EmailTemplates.verificationRejected({ name: u.name ?? "there", reason: reason! }));
  await publishNotification({ userId, kind: "verify", title: approve ? "You’re verified" : "Verification needs another look", body: approve ? "You can now list, rent and get paid on Newcondo." : reason!, to: "/profile", entityType: "User", entityId: userId });
}

/* ---------------- listings ---------------- */
const listingWhere = (q: ListQuery): Prisma.PropertyWhereInput => ({
  status: "PENDING", adminApprovalStatus: "PENDING",
  ...(q.q ? { OR: [{ title: { contains: q.q, mode: "insensitive" } }, { address: { contains: q.q, mode: "insensitive" } }, { owner: { name: { contains: q.q, mode: "insensitive" } } }] } : {}),
});

export async function listingQueue(q: ListQuery) {
  const where = listingWhere(q);
  const [total, props] = await Promise.all([
    prisma.property.count({ where }),
    prisma.property.findMany({ where, ...skipTake(q), orderBy: { updatedAt: "asc" }, select: {
      id: true, title: true, city: true, state: true, price: true, updatedAt: true, boundaryVerified: true, boundaryMarkedBy: true, agentId: true,
      owner: { select: { id: true, name: true, role: true, verificationStatus: true } },
      documents: { where: { documentType: { in: [...OWNERSHIP_TYPES] }, status: { in: ["PENDING", "APPROVED"] } }, select: DOC_SEL },
      markingJobs: { where: { status: { in: ["AWAITING_CONFIRMATION", "COMPLETED", "DISPUTED"] } }, orderBy: { updatedAt: "desc" }, take: 1, select: { method: true, status: true, snapshotImageKey: true, maskImageKey: true, assignedAgent: { select: { name: true } } } },
    } }),
  ]);
  const rows: ApprovalDTO[] = await Promise.all(props.map(async (p) => {
    const job = p.markingJobs[0];
    const blockers = [
      ...(p.owner.verificationStatus === "VERIFIED" ? [] : ["Owner’s identity isn’t verified yet"]),
      ...(p.documents.some((d) => d.documentType === "OWNERSHIP_DOCUMENT") ? [] : ["No proof of ownership uploaded"]),
      ...(p.agentId && !p.documents.some((d) => d.documentType === "CONSENT_DOCUMENT") ? ["Listing agent has no owner consent document"] : []),
      ...(p.boundaryVerified ? [] : [job?.status === "DISPUTED" ? "Marking is disputed — resolve it on the Marking page" : job?.status === "AWAITING_CONFIRMATION" ? "Owner hasn’t confirmed the marking yet" : "Property isn’t marked yet"]),
    ];
    return {
      id: p.id, kind: "LISTING" as const, who: { id: p.owner.id, name: p.owner.name, role: p.owner.role, verification: p.owner.verificationStatus },
      label: p.title, propertyId: p.id, submittedAt: p.updatedAt.toISOString(), note: `${p.city}, ${p.state} · ₦${Number(p.price ?? 0).toLocaleString("en-NG")}/yr`,
      documents: await Promise.all(p.documents.map(docDTO)),
      marking: { method: job?.method ?? null, markedBy: job?.assignedAgent?.name ?? null, snapshotUrl: await url(job?.snapshotImageKey), maskUrl: await url(job?.maskImageKey), boundaryVerified: p.boundaryVerified },
      blockers,
    };
  }));
  return page(rows, total, q);
}

export async function decideListing(req: Request, id: string, approve: boolean, reason?: string, allowRemark?: boolean) {
  const p = await prisma.property.findUnique({ where: { id }, select: {
    id: true, title: true, ownerId: true, agentId: true, status: true, adminApprovalStatus: true, boundaryVerified: true,
    owner: { select: { verificationStatus: true, email: true, name: true } },
    documents: { where: { documentType: { in: [...OWNERSHIP_TYPES] }, status: { in: ["PENDING", "APPROVED"] } }, select: { id: true, documentType: true } },
  } });
  if (!p) throw notFound("Property not found");
  if (p.status !== "PENDING" || p.adminApprovalStatus !== "PENDING") throw conflict("This listing was already decided");
  if (approve) {
    if (p.owner.verificationStatus !== "VERIFIED") throw badRequest("Verify the owner’s identity first");
    if (!p.documents.some((d) => d.documentType === "OWNERSHIP_DOCUMENT")) throw badRequest("No proof of ownership on file");
    if (p.agentId && !p.documents.some((d) => d.documentType === "CONSENT_DOCUMENT")) throw badRequest("Agent listings need the owner’s consent document");
    if (!p.boundaryVerified) throw badRequest("The boundary must be marked and confirmed before approval");
  }
  await prisma.$transaction(async (tx) => {
    await tx.property.update({ where: { id }, data: approve
      ? { adminApprovalStatus: "APPROVED", status: "PUBLISHED", approvedAt: new Date(), approvedBy: req.staff!.userId, rejectionReason: null }
      // Back to DRAFT so the owner can fix and re-submit.
      : { adminApprovalStatus: "REJECTED", status: "DRAFT", rejectionReason: reason,
          ...(allowRemark ? { boundaryVerified: false, boundaryMarkedBy: null, boundaryMarkedAt: null, boundaryMaskImageKey: null, buildingFingerprint: null } : {}) } });
    // Json? column: `Prisma` is type-only from @newcondo/db (no Prisma.DbNull value), so clear it raw —
    // same approach as auth-service accountAnonymization.service.ts.
    if (!approve && allowRemark) await tx.$executeRaw`UPDATE "Property" SET "boundaryCoordinates" = NULL WHERE "id" = ${id}`;
    await tx.document.updateMany({ where: { id: { in: p.documents.map((d) => d.id) } }, data: { status: approve ? "APPROVED" : "REJECTED", ...(approve ? {} : { verificationNotes: reason }) } });
    await audit(tx, req, { action: approve ? "PROPERTY_APPROVED" : "PROPERTY_REJECTED", targetType: "Property", targetId: id, description: approve ? p.title : `${p.title}: ${reason}`, metadata: { allowRemark: !!allowRemark } });
  });
  const [t, b] = approve ? ["Your property is live", `${p.title} is now on Browse.`] : ["Listing needs changes", `${reason}${allowRemark ? " — the marking was also cleared, please mark it again." : ""}`];
  for (const uid of [p.ownerId, p.agentId].filter(Boolean) as string[]) await publishNotification({ userId: uid, kind: "marking", title: t, body: b, to: `/properties/my-listings/${p.id}`, entityType: "Property", entityId: p.id });
}

