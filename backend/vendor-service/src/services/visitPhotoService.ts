// backend/vendor-service/src/services/visitPhotoService.ts
// ============================================================
// Service-visit photos are PRIVATE (s3Upload.ts: "service-reports" lives in
// the private bucket). They are only ever read through short-lived presigned
// GET URLs, and only after an access check:
//   • owner, listing agent or an ACTIVE tenant of the property
//   • the vendor assigned to the job
//   • ADMIN
// URLs live 10 minutes — long enough to view, too short to be worth sharing.
// ============================================================
import { prisma } from "@newcondo/db";
import { presignDownload, PRIVATE_BUCKET, forbidden, notFound } from "@newcondo/backend-shared";
import { hasPropertyAccess } from "./serviceability";
import type { VisitPhotoDTO } from "../types";

const PHOTO_TTL_SECONDS = 600;

export async function visitPhotos(jobId: string, viewer: { id: string; role: string }, asVendorId?: string): Promise<VisitPhotoDTO[]> {
  const job = await prisma.serviceJob.findUnique({ where: { id: jobId }, select: { propertyId: true, vendorId: true, photoKeys: true } });
  if (!job) throw notFound("Visit not found");
  const allowed = viewer.role === "ADMIN"
    || (asVendorId !== undefined && job.vendorId === asVendorId)
    || (await hasPropertyAccess(job.propertyId, viewer.id));
  if (!allowed) throw forbidden("You can't view photos for this visit");
  const expiresAt = new Date(Date.now() + PHOTO_TTL_SECONDS * 1000).toISOString();
  // Only keys under this job's prefix are signed, so a tampered photoKeys row
  // can't be used to read some other object from the private bucket.
  const prefix = `service-reports/${job.propertyId}/${jobId}/`;
  const keys = job.photoKeys.filter((k) => k.startsWith(prefix));
  return Promise.all(keys.map(async (key) => ({ key, url: await presignDownload(key, PHOTO_TTL_SECONDS, PRIVATE_BUCKET), expiresAt })));
}
