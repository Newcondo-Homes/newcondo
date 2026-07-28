/** Namespaced folders so bucket policies/lifecycle rules can differ per kind. */
export type S3Namespace = "property-images" | "marking-photos" | "verification-docs" | "service-reports" | "receipts";
/** Deterministic, collision-free object key: ns/ownerId/rand.ext */
export declare function buildObjectKey(ns: S3Namespace, ownerId: string, contentType: string): string;
/**
 * Presigned PUT — 5 min validity, content-type + length pinned so the
 * signature can't be reused for a different/larger file.
 */
export declare function presignUpload(opts: {
    ns: S3Namespace;
    ownerId: string;
    contentType: string;
    contentLength: number;
}): Promise<{
    key: string;
    uploadUrl: string;
    expiresIn: number;
}>;
/** Presigned GET — default 1h; pass a shorter TTL for sensitive docs. */
export declare function presignDownload(key: string, expiresIn?: number): Promise<string>;
/** Batch resolve keys → URLs (property galleries, marking photo sets). */
export declare function presignDownloadMany(keys: string[], expiresIn?: number): Promise<Record<string, string>>;
export declare function deleteObject(key: string): Promise<void>;
//# sourceMappingURL=s3Upload.d.ts.map