export interface ShareableLinkData {
    markingJobId: string;
    propertyId: string;
    requestedBy: string;
    expiresAt: Date;
    metadata?: Record<string, any>;
}
export interface EncryptedLinkResult {
    encryptedData: string;
    shareableUrl: string;
}
export interface DecryptedLinkData extends ShareableLinkData {
    isExpired: boolean;
    isValid: boolean;
}
/**
 * Encrypt marking job data for shareable link
 */
export declare function encryptMarkingLink(data: ShareableLinkData, baseUrl?: string): EncryptedLinkResult;
/**
 * Decrypt marking link data
 */
export declare function decryptMarkingLink(encryptedData: string): DecryptedLinkData | null;
/**
 * Generate a secure token for one-time use links
 */
export declare function generateSecureToken(length?: number): string;
/**
 * Hash a token for storage (for verification without storing plain token)
 */
export declare function hashToken(token: string): string;
/**
 * Verify a token against its hash
 */
export declare function verifyToken(token: string, hash: string): boolean;
/**
 * Create a signed URL with expiration
 */
export declare function createSignedUrl(baseUrl: string, params: Record<string, string>, expiresInSeconds?: number): string;
/**
 * Verify a signed URL
 */
export declare function verifySignedUrl(url: string): {
    isValid: boolean;
    isExpired: boolean;
    params: Record<string, string>;
};
/**
 * Generate a short code for easy sharing (e.g., via SMS)
 */
export declare function generateShortCode(length?: number): string;
/**
 * Encrypt data for temporary storage (e.g., Redis cache)
 */
export declare function encryptTempData(data: any): string;
/**
 * Decrypt data from temporary storage
 */
export declare function decryptTempData<T = any>(encryptedData: string): T | null;
/**
 * Alias compatibility function mapping back to decryptMarkingLink
 */
export declare function decryptShareableLink(encryptedData: string): DecryptedLinkData | null;
/**
 * Standalone validation helper mapping directly against payload object states
 */
export declare function validateShareableLink(data: DecryptedLinkData | null): boolean;
//# sourceMappingURL=linkEncryption.d.ts.map