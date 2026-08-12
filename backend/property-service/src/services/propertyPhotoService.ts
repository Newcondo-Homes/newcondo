// backend/property-service/src/services/propertyPhotoService.ts
// ============================================================
// Property photos on AWS S3.
//
// DESIGN: the browser uploads DIRECTLY to S3 with a presigned PUT — the
// image bytes never pass through Express. That keeps the API cheap and
// avoids the body-size limits that make multipart uploads painful on a
// Nigerian mobile connection. Reads are presigned GETs, so the bucket
// itself stays PRIVATE (no public-read ACL, no CloudFront needed yet).
//
// FLOW
//   1. presignPropertyPhotos() → [{ uploadUrl, key }]  (client PUTs each file)
//   2. attachPropertyPhotos(keys)  → rows in PropertyImage, first = cover
//   3. listPropertyPhotos()  → signed GET urls (1h)
//
// ENV
//   AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET
//
// BUCKET CORS (required, or the browser PUT fails with an opaque error):
//   [{ "AllowedOrigins": ["https://newcondo.homes","http://localhost:3000"],
//      "AllowedMethods": ["PUT","GET"],
//      "AllowedHeaders": ["*"], "ExposeHeaders": ["ETag"] }]
// ============================================================
import { randomUUID } from "crypto";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "@newcondo/db";
import { badRequest, forbidden, notFound } from "@newcondo/backend-shared";

const BUCKET = process.env.AWS_S3_BUCKET!;
const REGION = process.env.AWS_REGION ?? "eu-west-1";

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const MAX_BYTES = 8 * 1024 * 1024; // 8MB — phone photos are big; resize client-side first
const MAX_PER_PROPERTY = 20;

/** Only the owner or the listing agent may touch a property's photos. */
async function assertCanEdit(propertyId: string, userId: string) {
  const p = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, ownerId: true, agentId: true },
  });
  if (!p) throw notFound("Property not found");
  if (p.ownerId !== userId && p.agentId !== userId) {
    throw forbidden("You can't edit photos for this property");
  }
  return p;
}

/* ------------------------------------------------------------------ */
/* 1. Presign uploads                                                  */
/* ------------------------------------------------------------------ */
export interface PresignInput { name: string; type: string; size: number }

export async function presignPropertyPhotos(
  propertyId: string,
  userId: string,
  files: PresignInput[]
): Promise<{ uploadUrl: string; key: string }[]> {
  await assertCanEdit(propertyId, userId);
  if (!files?.length) throw badRequest("No files to upload");
  if (files.length > 10) throw badRequest("Upload at most 10 photos at a time");

  const existing = await prisma.propertyImage.count({ where: { propertyId } });
  if (existing + files.length > MAX_PER_PROPERTY) {
    throw badRequest(`A property can have up to ${MAX_PER_PROPERTY} photos`);
  }

  return Promise.all(
    files.map(async (f) => {
      if (!ALLOWED.includes(f.type)) throw badRequest(`${f.name}: only JPEG, PNG, WebP or HEIC images`);
      if (f.size > MAX_BYTES) throw badRequest(`${f.name} is larger than 8MB`);

      // Key includes the property so objects are easy to audit/lifecycle.
      const ext = (f.name.split(".").pop() ?? "jpg").toLowerCase().slice(0, 5);
      const key = `properties/${propertyId}/${randomUUID()}.${ext}`;

      const uploadUrl = await getSignedUrl(
        s3,
        new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: f.type }),
        { expiresIn: 300 } // 5 min is plenty; short-lived keys limit replay
      );
      return { uploadUrl, key };
    })
  );
}

/* ------------------------------------------------------------------ */
/* 2. Attach uploaded keys                                             */
/* ------------------------------------------------------------------ */
export async function attachPropertyPhotos(propertyId: string, userId: string, keys: string[]) {
  await assertCanEdit(propertyId, userId);
  if (!keys?.length) throw badRequest("No photos to attach");
  // Reject keys that don't belong to this property — a client could otherwise
  // attach someone else's object by guessing a key.
  const bad = keys.find((k) => !k.startsWith(`properties/${propertyId}/`));
  if (bad) throw badRequest("Invalid photo reference");

  const existing = await prisma.propertyImage.count({ where: { propertyId } });
  await prisma.propertyImage.createMany({
    data: keys.map((key, i) => ({
      propertyId,
      url: key,                       // we store the KEY; urls are signed on read
      isCover: existing === 0 && i === 0,
      order: existing + i,
    })),
    skipDuplicates: true,
  });
  return listPropertyPhotos(propertyId);
}

/* ------------------------------------------------------------------ */
/* 3. List (signed GET urls)                                           */
/* ------------------------------------------------------------------ */
export interface PropertyPhotoDTO { id: string; key: string; url: string; isCover: boolean }

export async function listPropertyPhotos(propertyId: string): Promise<PropertyPhotoDTO[]> {
  const rows = await prisma.propertyImage.findMany({
    where: { propertyId },
    orderBy: [{ isPrimary: "desc" }, { order: "asc" }],
    select: { id: true, url: true, isPrimary: true },
  });
  return Promise.all(
    rows.map(async (r) => ({
      id: r.id,
      key: r.url,
      // Already-absolute urls (legacy/seed rows) are passed through untouched.
      url: /^https?:\/\//.test(r.url)
        ? r.url
        : await getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: r.url }), { expiresIn: 3600 }),
      // DB column is `isPrimary`; the UI calls it "cover".
      isCover: r.isPrimary,
    }))
  );
}

/* ------------------------------------------------------------------ */
/* 4. Delete                                                           */
/* ------------------------------------------------------------------ */
export async function deletePropertyPhoto(propertyId: string, userId: string, photoId: string) {
  await assertCanEdit(propertyId, userId);
  const img = await prisma.propertyImage.findUnique({ where: { id: photoId }, select: { id: true, url: true, propertyId: true, isPrimary: true } });
  if (!img || img.propertyId !== propertyId) throw notFound("Photo not found");

  await prisma.propertyImage.delete({ where: { id: photoId } });
  if (!/^https?:\/\//.test(img.url)) {
    // Best-effort: a failed object delete must not fail the request, or the
    // row is gone while the UI reports an error.
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: img.url })).catch(() => {});
  }
  // Promote the next photo to cover so a property is never coverless.
  if (img.isPrimary) {
    const next = await prisma.propertyImage.findFirst({ where: { propertyId }, orderBy: { order: "asc" }, select: { id: true } });
    if (next) await prisma.propertyImage.update({ where: { id: next.id }, data: { isPrimary: true } });
  }
  return listPropertyPhotos(propertyId);
}
