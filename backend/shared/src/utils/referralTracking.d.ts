/**
 * Generate a unique referral code
 * Format: 6-8 uppercase alphanumeric characters
 */
export declare const generateReferralCode: (length?: number) => string;
/**
 * Generate a secure referral link
 */
export declare const generateReferralLink: (baseUrl: string, referralCode: string, type?: "user" | "agent") => string;
/**
 * Generate agent referral link for specific property
 */
export declare const generateAgentReferralLink: (baseUrl: string, propertyId: string, referralCode: string) => string;
/**
 * Extract referral code from various sources
 */
export declare const extractReferralCode: (query?: Record<string, string>, cookies?: Record<string, string>, headers?: Record<string, string>) => string | null;
/**
 * Validate referral code format
 */
export declare const isValidReferralCode: (code: string) => boolean;
/**
 * Create referral tracking fingerprint
 * Used to detect duplicate clicks from same device
 */
export declare const createDeviceFingerprint: (ipAddress: string, userAgent: string) => string;
/**
 * Calculate referral reward based on type
 */
export declare const calculateReferralReward: (referralType: string, transactionAmount?: number) => {
    referrerReward: number;
    referredReward: number;
};
/**
 * Determine referral type based on roles
 */
export declare const determineReferralType: (referrerRole: string, referredRole: string) => string;
/**
 * Check if referral qualifies for reward
 * Based on business rules (e.g., first payment made, subscription active)
 */
export declare const checkReferralQualification: (referredUser: {
    role: string;
    isPremium?: boolean;
    hasCompletedPayment?: boolean;
    verificationStatus?: string;
}) => {
    qualified: boolean;
    reason?: string;
};
/**
 * Calculate commission split for agent referrals
 */
export declare const referralCalculateAgentCommission: (rentAmount: number, hasSubAgent: boolean) => {
    platformFee: number;
    listingAgentCommission: number;
    subAgentCommission: number;
    ownerAmount: number;
};
/**
 * Track referral click with deduplication
 */
export declare const shouldTrackClick: (fingerprint: string, existingFingerprints: string[], timeWindow?: number) => boolean;
/**
 * Generate shareable referral message templates
 */
export declare const generateReferralMessage: (referrerName: string, referralLink: string, type?: "whatsapp" | "email" | "sms") => string;
/**
 * Calculate referral conversion rate
 */
export declare const referralCalculateConversionRate: (clicks: number, conversions: number) => number;
/**
 * Validate reward redemption eligibility
 */
export declare const canRedeemReward: (reward: {
    status: string;
    isRedeemed: boolean;
    expiresAt?: Date;
    isPaidOut: boolean;
}) => {
    canRedeem: boolean;
    reason?: string;
};
/**
 * Format currency for Nigerian Naira
 */
export declare const formatNaira: (amount: number) => string;
/**
 * Generate referral analytics summary
 */
export declare const generateReferralSummary: (data: {
    totalReferrals: number;
    qualifiedReferrals: number;
    totalClicks: number;
    totalRewards: number;
    pendingRewards: number;
}) => {
    conversionRate: number;
    qualificationRate: number;
    averageReward: number;
    summary: string;
};
//# sourceMappingURL=referralTracking.d.ts.map