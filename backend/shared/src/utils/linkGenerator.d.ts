/**
 * Generate a unique shareable link for property
 */
export declare function generateShareableLink(propertyId: string, baseUrl: string): string;
/**
 * Generate a unique promotion link for agent
 */
export declare function generatePromotionLink(propertyId: string, agentId: string, baseUrl: string): string;
/**
 * Generate marking service shareable link
 */
export declare function generateMarkingLink(propertyId: string, markingJobId: string, baseUrl: string): string;
/**
 * Generate property viewing link
 */
export declare function generateViewingLink(propertyId: string, baseUrl: string): string;
/**
 * Parse referral information from link
 */
export declare function parseReferralLink(url: string): {
    propertyId: string | null;
    agentId: string | null;
    referralCode: string | null;
};
/**
 * Generate QR code data URL for property
 */
export declare function generateQRCodeData(propertyId: string, baseUrl: string): string;
/**
 * Generate deep link for mobile app
 */
export declare function generateDeepLink(propertyId: string, params?: {
    [key: string]: string;
}): string;
/**
 * Generate email verification link
 */
export declare function generateVerificationLink(userId: string, token: string, baseUrl: string): string;
/**
 * Generate password reset link
 */
export declare function generatePasswordResetLink(userId: string, token: string, baseUrl: string): string;
/**
 * Shorten URL (placeholder for URL shortening service integration)
 */
export declare function shortenUrl(longUrl: string): Promise<string>;
/**
 * Track link click
 */
export declare function generateTrackableLink(originalUrl: string, trackingParams: {
    source?: string;
    medium?: string;
    campaign?: string;
    agentId?: string;
}): string;
/**
 * Validate shareable link token
 */
export declare function validateShareableToken(token: string): boolean;
/**
 * Generate social media share links
 */
export declare function generateSocialShareLinks(propertyId: string, baseUrl: string): {
    facebook: string;
    twitter: string;
    whatsapp: string;
    telegram: string;
    linkedin: string;
};
//# sourceMappingURL=linkGenerator.d.ts.map