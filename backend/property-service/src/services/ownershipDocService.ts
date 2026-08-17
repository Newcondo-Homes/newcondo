// backend/property-service/src/services/ownershipDocService.ts
// ============================================================
// Proof of ownership — stored in the EXISTING `Document` model
// (documentType OWNERSHIP_DOCUMENT), so it lands in the SAME admin
// verification queue as NIN/BVN/selfie rather than a parallel system with
// no admin UI.
//
// >>> BUCKET BUG FIXED <<<
// This service used to build its own S3Client with process.env.AWS_S3_BUCKET,
// which doesn't exist here (the env var is S3_BUCKET — see
// backend/shared/src/utils/s3Upload.ts). An undefined bucket is what produced
//     "No value provided for input HTTP label: Bucket."
// It now delegates to the SHARED presignUpload / presignDownload /
// deleteObject helpers, which own the client, env, key layout, content-type
// allow-list and size cap.
//
// Namespace is "verification-docs", not "property-images": ownership papers
// are legal documents, and a separate prefix lets bucket policies and
// lifecycle rules treat them differently from marketing photos.
//
// PRIVATE BY CONSTRUCTION: only the S3 key is stored. Every read mints a
// short-lived signed GET (5 min) — an ownership document must never sit
// behind a durable url.
//
// THE GATE (assertOwnershipProof) is the important part: marking, sharing and
// tenant invites all call it, so the rule lives in ONE place instead of being
// re-checked — and forgotten — at three call sites.
// ============================================================
import { prisma } from "@newcondo/db";
import {
  badRequest, forbidden, notFound, OWNERSHIP_PROOF,
  presignUpload, presignDownload, deleteObject,
} from "@newcondo/backend-shared";

const KIND = "OWNERSHIP_DOCUMENT" as const;

export interface OwnershipDoc {
  id: string;
  name: string;
  docType: string | null;
  mime: string | null;
  status: string;
  rejectionReason: string | null;
  uploadedAt: Date;
}

async function assertCanEdit(propertyId: string, userId: string) {
  const p = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, ownerId: true, agentId: true },
  });
  if (!p) throw notFound("Property not found");
  if (p.ownerId !== userId && p.agentId !== userId) {
    throw forbidden("You can't manage documents for this property");
  }
  return p;
}

const toDTO = (d: {
  id: string; fileName: string | null; documentNumber: string | null;
  mimeType: string | null; status: unknown; verificationNotes: string | null; createdAt: Date;
}): OwnershipDoc => ({
  id: d.id,
  name: d.fileName ?? "document",
  // documentNumber doubles as the human label ("Deed of Assignment") — the
  // model has no dedicated column and adding one isn't worth a migration.
  docType: d.documentNumber,
  mime: d.mimeType,
  status: String(d.status),
  rejectionReason: d.verificationNotes,
  uploadedAt: d.createdAt,
});

/* ------------------------------------------------------------------ */
/* 1. Presign the upload                                               */
/* ------------------------------------------------------------------ */
export async function presignOwnershipDoc(
  propertyId: string,
  userId: string,
  file: { name?: string; type: string; size: number }
): Promise<{ uploadUrl: string; key: string }[]> {
  await assertCanEdit(propertyId, userId);
  if (!(OWNERSHIP_PROOF.acceptedMime as readonly string[]).includes(file.type)) {
    throw badRequest("Upload a PDF or a photo of the document");
  }
  // presignUpload enforces the shared 10MB cap and its own allow-list too;
  // this check exists so the user gets our wording, not an SDK error.
  const { key, uploadUrl } = await presignUpload({
    ns: "verification-docs",
    ownerId: propertyId,
    contentType: file.type,
    contentLength: file.size,
  });
  return [{ uploadUrl, key }];
}

/* ------------------------------------------------------------------ */
/* 2. Attach (replaces any existing document on this property)         */
/* ------------------------------------------------------------------ */
export async function attachOwnershipDoc(
  propertyId: string,
  userId: string,
  input: { key: string; docType: string; name?: string; mime?: string; size?: number }
): Promise<OwnershipDoc> {
  await assertCanEdit(propertyId, userId);
  if (!input.key?.startsWith(`verification-docs/${propertyId}/`)) {
    throw badRequest("Invalid document reference");
  }

  // One ownership document per property: a replacement supersedes the old
  // object so stale legal papers never accumulate in the bucket.
  const existing = await prisma.document.findFirst({
    where: { propertyId, documentType: KIND },
    select: { id: true, s3Key: true },
  });
  if (existing) {
    if (existing.s3Key) await deleteObject(existing.s3Key).catch(() => {});
    await prisma.document.delete({ where: { id: existing.id } });
  }

  const created = await prisma.document.create({
    data: {
      userId,
      propertyId,
      documentType: KIND,
      documentNumber: input.docType,      // human label, e.g. "Deed of Assignment"
      fileName: input.name ?? input.key.split("/").pop() ?? "document",
      s3Key: input.key,
      // Deliberately null: reads go through a signed GET, never a stored url.
      fileUrl: null,
      mimeType: input.mime ?? null,
      fileSizeBytes: input.size ?? null,
      // Re-uploading always re-enters review — an owner must not be able to
      // swap a verified document for a different one silently.
      status: "PENDING",
      isRequired: true,
    },
    select: {
      id: true, fileName: true, documentNumber: true, mimeType: true,
      status: true, verificationNotes: true, createdAt: true,
    },
  });
  return toDTO(created);
}

/* ------------------------------------------------------------------ */
/* 3. Read + signed download                                           */
/* ------------------------------------------------------------------ */
export async function getOwnershipDoc(propertyId: string): Promise<OwnershipDoc | null> {
  const d = await prisma.document.findFirst({
    where: { propertyId, documentType: KIND },
    select: {
      id: true, fileName: true, documentNumber: true, mimeType: true,
      status: true, verificationNotes: true, createdAt: true,
    },
  });
  return d ? toDTO(d) : null;
}

export async function getOwnershipDocUrl(propertyId: string, userId: string): Promise<{ url: string }> {
  await assertCanEdit(propertyId, userId);
  const d = await prisma.document.findFirst({
    where: { propertyId, documentType: KIND },
    select: { s3Key: true },
  });
  if (!d?.s3Key) throw notFound("No ownership document on file");
  // 5 minutes: long enough to open, short enough that a copied link is
  // worthless soon after.
  return { url: await presignDownload(d.s3Key, 300) };
}

/* ------------------------------------------------------------------ */
/* 4. Delete                                                           */
/* ------------------------------------------------------------------ */
export async function deleteOwnershipDoc(propertyId: string, userId: string): Promise<{ ok: true }> {
  await assertCanEdit(propertyId, userId);
  const d = await prisma.document.findFirst({
    where: { propertyId, documentType: KIND },
    select: { id: true, s3Key: true },
  });
  if (!d) return { ok: true };
  await prisma.document.delete({ where: { id: d.id } });
  if (d.s3Key) await deleteObject(d.s3Key).catch(() => {});
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* 5. THE GATE — call this from marking, sharing and tenant invites    */
/* ------------------------------------------------------------------ */
export async function assertOwnershipProof(
  propertyId: string,
  action: "MARK" | "SHARE" | "INVITE_TENANT" | "PUBLISH"
): Promise<void> {
  const d = await prisma.document.findFirst({
    where: { propertyId, documentType: KIND },
    select: { status: true },
  });
  // PENDING is allowed: admin review takes up to 24h and blocking a compliant
  // owner for a day would be punitive. APPROVED obviously passes. REJECTED,
  // EXPIRED and missing are all blocked — none of them proves anything.
  const ok = d?.status === "APPROVED" || d?.status === "PENDING";
  if (ok) return;

  const verb = {
    MARK: "marked", SHARE: "shared", INVITE_TENANT: "used to invite a tenant", PUBLISH: "published",
  }[action];
  throw forbidden(
    `This property can't be ${verb} until proof of ownership is uploaded. Add the document from the property page.`
  );
}

/* ============================================================
   ⚠ TWO PREREQUISITES

   1. Document's unique key is currently
        @@unique([userId, documentType, documentSide, pageNumber])
      which is right for identity documents (one NIN per PERSON) but wrong
      here: ownership proof is per-PROPERTY, so an owner's SECOND upload
      collides on userId + OWNERSHIP_DOCUMENT + null + null. Add propertyId
      (nullable, so identity docs are unaffected):

        @@unique([userId, documentType, documentSide, pageNumber, propertyId], name: "unique_document_variant")

      then: pnpm prisma migrate dev --name document_unique_per_property

   2. OWNERSHIP_PROOF.acceptedMime / maxSizeMb in backend-shared must stay
      within what s3Upload allows — it permits image/jpeg, image/png,
      image/webp and application/pdf at up to 10MB. image/heic is NOT in that
      list, and maxSizeMb above 10 will be rejected by presignUpload. Either
      trim the constant to match, or widen ALLOWED_CONTENT_TYPES /
      MAX_UPLOAD_BYTES in s3Upload.ts — but change it in ONE place.
   ============================================================ */
