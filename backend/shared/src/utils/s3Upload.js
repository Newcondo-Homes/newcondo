"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildObjectKey = buildObjectKey;
exports.presignUpload = presignUpload;
exports.presignDownload = presignDownload;
exports.presignDownloadMany = presignDownloadMany;
exports.deleteObject = deleteObject;
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
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const crypto_1 = require("crypto");
const zod_1 = require("zod");
const s3Env = zod_1.z.object({
    AWS_REGION: zod_1.z.string().default("eu-west-1"),
    S3_BUCKET: zod_1.z.string().default("newcondo-media"),
}).parse(process.env);
// Credentials come from AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY env vars
// (the SDK default provider chain) — never hardcoded.
const s3 = new client_s3_1.S3Client({ region: s3Env.AWS_REGION });
const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB — matches the express body limit
/** Deterministic, collision-free object key: ns/ownerId/rand.ext */
function buildObjectKey(ns, ownerId, contentType) {
    const ext = contentType === "application/pdf" ? "pdf" : contentType.split("/")[1] ?? "bin";
    return `${ns}/${ownerId}/${Date.now()}-${(0, crypto_1.randomBytes)(8).toString("hex")}.${ext}`;
}
/**
 * Presigned PUT — 5 min validity, content-type + length pinned so the
 * signature can't be reused for a different/larger file.
 */
async function presignUpload(opts) {
    if (!ALLOWED_CONTENT_TYPES.has(opts.contentType))
        throw new Error(`Unsupported content type: ${opts.contentType}`);
    if (opts.contentLength > MAX_UPLOAD_BYTES)
        throw new Error("File exceeds the 10MB upload limit");
    const key = buildObjectKey(opts.ns, opts.ownerId, opts.contentType);
    const cmd = new client_s3_1.PutObjectCommand({
        Bucket: s3Env.S3_BUCKET, Key: key,
        ContentType: opts.contentType, ContentLength: opts.contentLength,
        ServerSideEncryption: "AES256",
    });
    const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(s3, cmd, { expiresIn: 300 });
    return { key, uploadUrl, expiresIn: 300 };
}
/** Presigned GET — default 1h; pass a shorter TTL for sensitive docs. */
async function presignDownload(key, expiresIn = 3600) {
    return (0, s3_request_presigner_1.getSignedUrl)(s3, new client_s3_1.GetObjectCommand({ Bucket: s3Env.S3_BUCKET, Key: key }), { expiresIn });
}
/** Batch resolve keys → URLs (property galleries, marking photo sets). */
async function presignDownloadMany(keys, expiresIn = 3600) {
    const entries = await Promise.all(keys.map(async (k) => [k, await presignDownload(k, expiresIn)]));
    return Object.fromEntries(entries);
}
async function deleteObject(key) {
    await s3.send(new client_s3_1.DeleteObjectCommand({ Bucket: s3Env.S3_BUCKET, Key: key }));
}
//# sourceMappingURL=s3Upload.js.map