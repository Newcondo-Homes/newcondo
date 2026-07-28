// backend/shared/src/utils/s3Upload.ts
// ============================================================
// AWS S3 image upload/retrieval — REPLACES UploadThing everywhere.
// Shared so property-service (listing photos), marking-service
// (verification photos), auth-service (ID documents) and
// payment-service (receipts) all use ONE implementation.
//
// Pattern: the browser NEVER talks to S3 with our credentials.
//   1. Frontend asks the backend for a presigned PUT URL (auth required).
//   2. Frontend PUTs the file straight to S3 (no file bytes through Render).
//   3. Frontend posts the returned `key` back to the owning endpoint
//      (e.g. POST /properties/:id/images { key }) which persists it.
//   4. Reads go through presigned GET URLs (private bucket — nothing public).
//
// Deps (add to backend/shared/package.json):
//   "@aws-sdk/client-s3": "^3.600.0",
//   "@aws-sdk/s3-request-presigner": "^3.600.0"
// Env: AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET
// Export from shared/src/utils/index.ts:  export * from "./s3Upload";
// ============================================================
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomBytes } from "crypto";
import { z } from "zod";

const s3Env = z.object({
  AWS_REGION: z.string().default("eu-west-1"),
  S3_BUCKET: z.string().default("newcondo-media"),
}).parse(process.env);

// Credentials come from AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY env vars
// (the SDK default provider chain) — never hardcoded.
const s3 = new S3Client({ region: s3Env.AWS_REGION });

/** Namespaced folders so bucket policies/lifecycle rules can differ per kind. */
export type S3Namespace = "property-images" | "marking-photos" | "verification-docs" | "service-reports" | "receipts";

const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB — matches the express body limit

/** Deterministic, collision-free object key: ns/ownerId/rand.ext */
export function buildObjectKey(ns: S3Namespace, ownerId: string, contentType: string): string {
  const ext = contentType === "application/pdf" ? "pdf" : contentType.split("/")[1] ?? "bin";
  return `${ns}/${ownerId}/${Date.now()}-${randomBytes(8).toString("hex")}.${ext}`;
}

/**
 * Presigned PUT — 5 min validity, content-type + length pinned so the
 * signature can't be reused for a different/larger file.
 */
export async function presignUpload(opts: {
  ns: S3Namespace; ownerId: string; contentType: string; contentLength: number;
}): Promise<{ key: string; uploadUrl: string; expiresIn: number }> {
  if (!ALLOWED_CONTENT_TYPES.has(opts.contentType)) throw new Error(`Unsupported content type: ${opts.contentType}`);
  if (opts.contentLength > MAX_UPLOAD_BYTES) throw new Error("File exceeds the 10MB upload limit");
  const key = buildObjectKey(opts.ns, opts.ownerId, opts.contentType);
  const cmd = new PutObjectCommand({
    Bucket: s3Env.S3_BUCKET, Key: key,
    ContentType: opts.contentType, ContentLength: opts.contentLength,
    ServerSideEncryption: "AES256",
  });
  const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 300 });
  return { key, uploadUrl, expiresIn: 300 };
}

/** Presigned GET — default 1h; pass a shorter TTL for sensitive docs. */
export async function presignDownload(key: string, expiresIn = 3600): Promise<string> {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: s3Env.S3_BUCKET, Key: key }), { expiresIn });
}

/** Batch resolve keys → URLs (property galleries, marking photo sets). */
export async function presignDownloadMany(keys: string[], expiresIn = 3600): Promise<Record<string, string>> {
  const entries = await Promise.all(keys.map(async (k) => [k, await presignDownload(k, expiresIn)] as const));
  return Object.fromEntries(entries);
}

export async function deleteObject(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: s3Env.S3_BUCKET, Key: key }));
}
