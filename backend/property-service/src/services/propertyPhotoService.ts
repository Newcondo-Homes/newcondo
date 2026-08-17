// backend/property-service/src/services/propertyPhotoService.ts
// ============================================================
// Property photos on S3.
//
// >>> BUCKET BUG FIXED <<<
// This service used to build its OWN S3Client with process.env.AWS_S3_BUCKET,
// which doesn't exist in this repo — the env var is S3_BUCKET (see
// backend/shared/src/utils/s3Upload.ts). An undefined bucket is what produced:
//     "No value provided for input HTTP label: Bucket."
// Rather than fix the variable name in two places, this now delegates to the
// SHARED helpers (presignUpload / presignDownload / deleteObject). They own
// the client, the env, the key layout, the content-type allow-list and the
// size cap, so property photos, marking photos and identity documents can
// never drift apart again.
//
// FLOW (bytes never touch Express):
//   1. presignPropertyPhotos() → presigned PUT urls
//   2. browser PUTs straight to S3
//   3. attachPropertyPhotos(keys) → rows in PropertyImage
//   4. listPropertyPhotos() → presigned GET urls (bucket stays private)
// ============================================================
import { prisma } from "@newcondo/db";
import {
  badRequest, forbidden, notFound,
  presignUpload, presignDownload, deleteObject,
  PUBLIC_BUCKET,
} from "@newcondo/backend-shared";

const MAX_PHOTOS = 20;

export interface PropertyPhoto {
  id: string;
  key: string;
  url: string;
  isCover: boolean;
}

async function assertCanEdit(propertyId: string, userId: string) {
  const p = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, ownerId: true, agentId: true },
  });
  if (!p) throw notFound("Property not found");
  if (p.ownerId !== userId && p.agentId !== userId) {
    throw forbidden("You can't manage photos for this property");
  }
  return p;
}

/* ------------------------------------------------------------------ */
/* 1. Presign uploads                                                  */
/* ------------------------------------------------------------------ */
export async function presignPropertyPhotos(
  propertyId: string,
  userId: string,
  files: { name?: string; type: string; size: number }[]
): Promise<{ uploadUrl: string; key: string }[]> {
  await assertCanEdit(propertyId, userId);
  if (!Array.isArray(files) || files.length === 0) throw badRequest("No files provided");

  const existing = await prisma.propertyImage.count({ where: { propertyId } });
  if (existing + files.length > MAX_PHOTOS) {
    throw badRequest(`A property can have at most ${MAX_PHOTOS} photos (${existing} already uploaded)`);
  }

  // presignUpload validates content-type + size and builds the key, so a
  // rejected file fails here rather than silently 403-ing at the S3 PUT.
  return Promise.all(
    files.map(async (f) => {
      const { key, uploadUrl } = await presignUpload({
        ns: "property-images",
        ownerId: propertyId,
        contentType: f.type,
        contentLength: f.size,
      });
      return { uploadUrl, key };
    })
  );
}

/* ------------------------------------------------------------------ */
/* 2. Attach uploaded keys                                             */
/* ------------------------------------------------------------------ */
export async function attachPropertyPhotos(
  propertyId: string,
  userId: string,
  keys: string[]
): Promise<PropertyPhoto[]> {
  await assertCanEdit(propertyId, userId);
  if (!Array.isArray(keys) || keys.length === 0) throw badRequest("No photo keys provided");
  // Keys are minted by presignUpload under this namespace + property id, so
  // anything else is a forged reference.
  const prefix = `property-images/${propertyId}/`;
  if (keys.some((k) => !k?.startsWith(prefix))) throw badRequest("Invalid photo reference");

  const existing = await prisma.propertyImage.count({ where: { propertyId } });
  if (existing + keys.length > MAX_PHOTOS) {
    throw badRequest(`A property can have at most ${MAX_PHOTOS} photos`);
  }

  await prisma.propertyImage.createMany({
    data: keys.map((key, i) => ({
      propertyId,
      url: key,                       // the S3 KEY — reads are signed per request
      // First photo ever uploaded becomes the cover.
      isPrimary: existing === 0 && i === 0,
      order: existing + i,
    })),
  });

  return listPropertyPhotos(propertyId);
}

/* ------------------------------------------------------------------ */
/* 3. List (signed GET urls)                                           */
/* ------------------------------------------------------------------ */
export async function listPropertyPhotos(propertyId: string): Promise<PropertyPhoto[]> {
  const rows = await prisma.propertyImage.findMany({
    where: { propertyId },
    orderBy: [{ isPrimary: "desc" }, { order: "asc" }],
    select: { id: true, url: true, isPrimary: true },
  });
  return Promise.all(
    rows.map(async (r) => ({
      id: r.id,
      key: r.url,
      // PUBLIC_BUCKET must be passed explicitly: presignDownload defaults to
      // PRIVATE_BUCKET, so signing without it produced a valid url pointing at
      // newcondo-private-documents — where property photos don't exist. The
      // <img> then 404'd and the card rendered blank.
      url: await presignDownload(r.url, 3600, PUBLIC_BUCKET),
      isCover: r.isPrimary,
    }))
  );
}

/* ------------------------------------------------------------------ */
/* 4. Delete (row + S3 object)                                         */
/* ------------------------------------------------------------------ */
export async function deletePropertyPhoto(
  propertyId: string,
  userId: string,
  photoId: string
): Promise<PropertyPhoto[]> {
  await assertCanEdit(propertyId, userId);
  const photo = await prisma.propertyImage.findFirst({
    where: { id: photoId, propertyId },
    select: { id: true, url: true, isPrimary: true },
  });
  if (!photo) throw notFound("Photo not found");

  await prisma.propertyImage.delete({ where: { id: photo.id } });
  // Best-effort: a failed S3 delete must not leave a row pointing at an object
  // the user believes is gone. The row is already removed; log and move on.
  await deleteObject(photo.url).catch(() => {});

  // Deleting the cover promotes the next photo, so a gallery is never
  // cover-less while still holding images.
  if (photo.isPrimary) {
    const next = await prisma.propertyImage.findFirst({
      where: { propertyId },
      orderBy: { order: "asc" },
      select: { id: true },
    });
    if (next) await prisma.propertyImage.update({ where: { id: next.id }, data: { isPrimary: true } });
  }

  return listPropertyPhotos(propertyId);
}
