// backend/shared/src/utils/s3Upload.ts
// ============================================================
// AWS S3 image/document upload + retrieval (replaces UploadThing).
//
// WHY THE CLIENT IS LAZY:
// Constructing `new S3Client()` at module load crashes the whole app with
// "Region is missing" the moment ANY file imports this module — even a route
// that never touches S3 — because dotenv may not have run yet and the SDK
// validates the region eagerly. The client is therefore created on FIRST USE
// and cached, and the region falls back to a sane default so a missing env var
// degrades to an upload error instead of a boot crash.
//
// Pattern: the browser NEVER talks to S3 with our credentials.
//   1. Frontend asks the backend for a presigned PUT URL (auth required).
//   2. Frontend PUTs the file straight to S3 (no bytes through Render).
//   3. Frontend posts the returned `key` back to the owning endpoint
//      (e.g. POST /properties/:id/images { key }) which persists it.
//   4. Reads go through presigned GET URLs (private bucket) or the public
//      bucket's CDN URL.
//
// Env: AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY,
//      S3_PUBLIC_BUCKET (newcondo-public-assets),
//      S3_PRIVATE_BUCKET (newcondo-private-documents)
// ============================================================
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomBytes } from "crypto";

const DEFAULT_REGION = "eu-west-1";

export const PUBLIC_BUCKET = process.env.S3_PUBLIC_BUCKET ?? "newcondo-public-assets";
export const PRIVATE_BUCKET = process.env.S3_PRIVATE_BUCKET ?? "newcondo-private-documents";

let _s3: S3Client | null = null;

/** Lazy singleton — never constructed at import time. */
function s3(): S3Client {
  if (_s3) return _s3;
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || DEFAULT_REGION;
  if (!process.env.AWS_REGION && !process.env.AWS_DEFAULT_REGION) {
    console.warn(`[s3Upload] AWS_REGION is not set — falling back to "${DEFAULT_REGION}". Set it in .env for production.`);
  }
  // Credentials come from the SDK default provider chain
  // (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY, or the instance role).
  //
  // requestChecksumCalculation: "WHEN_REQUIRED" is REQUIRED for browser
  // presigned PUTs. Newer @aws-sdk/client-s3 defaults to "WHEN_SUPPORTED",
  // which adds x-amz-sdk-checksum-algorithm + x-amz-checksum-crc32 to the
  // SIGNED headers. The browser's fetch() never sends those, so the signature
  // it computes doesn't match and S3 rejects the upload — which surfaces first
  // as an opaque CORS error, because the preflight is refused before any
  // response headers come back.
  _s3 = new S3Client({ region, requestChecksumCalculation: "WHEN_REQUIRED" });
  return _s3;
}

/** Namespaced folders so bucket policies / lifecycle rules can differ per kind. */
export type S3Namespace =
  | "property-images"
  | "marking-photos"
  | "verification-docs"
  | "service-reports"
  | "receipts";

/** Private namespaces live in the private bucket; everything else is public. */
const PRIVATE_NAMESPACES: S3Namespace[] = ["verification-docs", "receipts"];

const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB — matches the express body limit

export const bucketFor = (ns: S3Namespace): string =>
  PRIVATE_NAMESPACES.includes(ns) ? PRIVATE_BUCKET : PUBLIC_BUCKET;

/** Deterministic, collision-free object key: ns/ownerId/timestamp-rand.ext */
export function buildObjectKey(ns: S3Namespace, ownerId: string, contentType: string): string {
  const ext = contentType === "application/pdf" ? "pdf" : contentType.split("/")[1] ?? "bin";
  return `${ns}/${ownerId}/${Date.now()}-${randomBytes(8).toString("hex")}.${ext}`;
}

export interface PresignedUpload { key: string; uploadUrl: string; expiresIn: number; bucket: string }

/**
 * Presigned PUT — 5 min validity, content-type pinned so the signature can't
 * be reused for a different kind of file.
 */
export async function presignUpload(opts: {
  ns: S3Namespace;
  ownerId: string;
  contentType: string;
  contentLength: number;
  /** Optional explicit key (e.g. the s3Layout builders) — otherwise auto-generated. */
  key?: string;
}): Promise<PresignedUpload> {
  if (!ALLOWED_CONTENT_TYPES.has(opts.contentType)) throw new Error(`Unsupported content type: ${opts.contentType}`);
  if (opts.contentLength > MAX_UPLOAD_BYTES) throw new Error("File exceeds the 10MB upload limit");

  const bucket = bucketFor(opts.ns);
  const key = opts.key ?? buildObjectKey(opts.ns, opts.ownerId, opts.contentType);
  // ONLY ContentType is signed. ContentLength and ServerSideEncryption were
  // signed too, which forced the BROWSER to send `content-length` and
  // `x-amz-server-side-encryption` as exact signed headers — fetch() manages
  // content-length itself and never sends the SSE header, so every upload
  // failed the signature check. Size is still enforced above against
  // MAX_UPLOAD_BYTES, and bucket-level default encryption (SSE-S3) encrypts
  // objects without the request needing to ask for it.
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: opts.contentType,
  });
  const uploadUrl = await getSignedUrl(s3(), cmd, { expiresIn: 300 });
  return { key, uploadUrl, expiresIn: 300, bucket };
}

/** Presigned GET — default 1h; pass a shorter TTL for sensitive documents. */
export async function presignDownload(key: string, expiresIn = 3600, bucket = PRIVATE_BUCKET): Promise<string> {
  return getSignedUrl(s3(), new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn });
}

/** Batch resolve keys → URLs (property galleries, marking photo sets). */
export async function presignDownloadMany(
  keys: string[],
  expiresIn = 3600,
  bucket = PUBLIC_BUCKET
): Promise<Record<string, string>> {
  const entries = await Promise.all(keys.map(async (k) => [k, await presignDownload(k, expiresIn, bucket)] as const));
  return Object.fromEntries(entries);
}

export async function deleteObject(key: string, bucket = PUBLIC_BUCKET): Promise<void> {
  await s3().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
