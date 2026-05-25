export interface SharingLinkOptions {
    propertyId: string;
    unitId?: string;
    expiresIn?: number;
    trackClicks?: boolean;
}
export interface SharingLinkResult {
    shareableLink: string;
    fullUrl: string;
    expiresAt?: Date;
}
/**
 * Generate shareable link for property/unit
 */
export declare const generateSharingLink: (options: SharingLinkOptions) => Promise<SharingLinkResult>;
/**
 * Validate sharing link
 */
export declare const validateSharingLink: (linkId: string) => Promise<{
    valid: boolean;
    propertyId?: string;
    unitId?: string;
}>;
/**
 * Track sharing link click
 */
export declare const trackSharingLinkClick: (linkId: string, metadata?: {
    ipAddress?: string;
    userAgent?: string;
    referrer?: string;
}) => Promise<void>;
/**
 * Revoke sharing link
 */
export declare const revokeSharingLink: (propertyId: string) => Promise<boolean>;
/**
 * Get sharing link analytics
 */
export declare const getSharingLinkAnalytics: (linkId: string) => Promise<{
    propertyId: string;
    totalViews: number;
    sharedLinkClicks: number;
    createdAt: Date;
} | null>;
//# sourceMappingURL=sharingLink.d.ts.map