// backend/shared/src/utils/referralTracking.ts

import { customAlphabet } from 'nanoid';
import crypto from 'crypto';

/**
 * Generate a unique referral code
 * Format: 6-8 uppercase alphanumeric characters
 */
export const generateReferralCode = (length: number = 8): string => {
  const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', length);
  return nanoid();
};

/**
 * Generate a secure referral link
 */
export const generateReferralLink = (
  baseUrl: string,
  referralCode: string,
  type: 'user' | 'agent' = 'user'
): string => {
  const path = type === 'agent' ? 'property' : 'register';
  return `${baseUrl}/${path}?ref=${referralCode}`;
};

/**
 * Generate agent referral link for specific property
 */
export const generateAgentReferralLink = (
  baseUrl: string,
  propertyId: string,
  referralCode: string
): string => {
  return `${baseUrl}/properties/${propertyId}?ref=${referralCode}`;
};

/**
 * Extract referral code from various sources
 */
export const extractReferralCode = (
  query?: Record<string, string>,
  cookies?: Record<string, string>,
  headers?: Record<string, string>
): string | null => {
  // Priority: Query params > Cookies > Headers
  if (query?.ref) return query.ref;
  if (cookies?.referralCode) return cookies.referralCode;
  if (headers?.['x-referral-code']) return headers['x-referral-code'];
  return null;
};

/**
 * Validate referral code format
 */
export const isValidReferralCode = (code: string): boolean => {
  // 6-8 uppercase alphanumeric characters
  return /^[A-Z0-9]{6,8}$/.test(code);
};

/**
 * Create referral tracking fingerprint
 * Used to detect duplicate clicks from same device
 */
export const createDeviceFingerprint = (
  ipAddress: string,
  userAgent: string
): string => {
  const data = `${ipAddress}|${userAgent}`;
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Calculate referral reward based on type
 */
export const calculateReferralReward = (
  referralType: string,
  transactionAmount?: number
): { referrerReward: number; referredReward: number } => {
  const rewards: Record<string, { referrer: number; referred: number }> = {
    OWNER_TO_OWNER: { referrer: 10000, referred: 10000 }, // ₦10,000 each
    OWNER_TO_AGENT: { referrer: 5000, referred: 5000 }, // ₦5,000 each
    OWNER_TO_RENTER: { referrer: 2000, referred: 2000 }, // ₦2,000 each
    AGENT_TO_OWNER: { referrer: 7000, referred: 3000 }, // Agent ₦7k, Owner ₦3k
    AGENT_TO_AGENT: { referrer: 3000, referred: 3000 }, // ₦3,000 each
    AGENT_TO_RENTER: { referrer: 5000, referred: 5000 }, // ₦5,000 each
    RENTER_TO_RENTER: { referrer: 1000, referred: 2000 }, // Referrer ₦1k, New renter ₦2k
  };

  const defaultReward = { referrer: 1000, referred: 1000 };
  const reward = rewards[referralType] || defaultReward;

  return {
    referrerReward: reward.referrer,
    referredReward: reward.referred,
  };
};

/**
 * Determine referral type based on roles
 */
export const determineReferralType = (
  referrerRole: string,
  referredRole: string
): string => {
  return `${referrerRole}_TO_${referredRole}` as any;
};

/**
 * Check if referral qualifies for reward
 * Based on business rules (e.g., first payment made, subscription active)
 */
export const checkReferralQualification = (
  referredUser: {
    role: string;
    isPremium?: boolean;
    hasCompletedPayment?: boolean;
    verificationStatus?: string;
  }
): { qualified: boolean; reason?: string } => {
  // Renters must have completed at least one payment
  if (referredUser.role === 'RENTER') {
    if (!referredUser.hasCompletedPayment) {
      return {
        qualified: false,
        reason: 'Renter must complete first payment',
      };
    }
  }

  // Owners must have active subscription
  if (referredUser.role === 'OWNER') {
    if (!referredUser.isPremium) {
      return {
        qualified: false,
        reason: 'Owner must have active subscription',
      };
    }
  }

  // Agents must be verified
  if (referredUser.role === 'AGENT') {
    if (referredUser.verificationStatus !== 'VERIFIED') {
      return {
        qualified: false,
        reason: 'Agent must be verified',
      };
    }
  }

  return { qualified: true };
};

/**
 * Calculate commission split for agent referrals
 */
export const calculateAgentCommission = (
  rentAmount: number,
  hasSubAgent: boolean
): {
  platformFee: number;
  listingAgentCommission: number;
  subAgentCommission: number;
  ownerAmount: number;
} => {
  const platformCommissionRate = 0.2; // 20% platform fee
  const platformFee = rentAmount * platformCommissionRate;

  if (hasSubAgent) {
    // Split 50/50 between listing agent and sub-agent
    const listingAgentCommission = platformFee * 0.5;
    const subAgentCommission = platformFee * 0.5;
    return {
      platformFee: 0, // All commission goes to agents
      listingAgentCommission,
      subAgentCommission,
      ownerAmount: rentAmount - listingAgentCommission - subAgentCommission,
    };
  } else {
    // Listing agent gets 50% of the 20% commission
    const listingAgentCommission = platformFee * 0.5;
    const platformRetained = platformFee * 0.5;
    return {
      platformFee: platformRetained,
      listingAgentCommission,
      subAgentCommission: 0,
      ownerAmount: rentAmount - platformFee,
    };
  }
};

/**
 * Track referral click with deduplication
 */
export const shouldTrackClick = (
  fingerprint: string,
  existingFingerprints: string[],
  timeWindow: number = 24 * 60 * 60 * 1000 // 24 hours
): boolean => {
  // Simple deduplication - in production, use Redis with TTL
  return !existingFingerprints.includes(fingerprint);
};

/**
 * Generate shareable referral message templates
 */
export const generateReferralMessage = (
  referrerName: string,
  referralLink: string,
  type: 'whatsapp' | 'email' | 'sms' = 'whatsapp'
): string => {
  const messages = {
    whatsapp: `Hi! 👋 I'm using NewCondo to manage my property and it's amazing! Join using my link and we both get rewards: ${referralLink}`,
    email: `Hello,\n\nI wanted to share NewCondo with you - it's a great platform for property management in Nigeria. When you sign up using my referral link, we both get exclusive rewards!\n\nJoin here: ${referralLink}\n\nBest regards,\n${referrerName}`,
    sms: `Hi! Join NewCondo using my link and get rewards: ${referralLink} - ${referrerName}`,
  };

  return messages[type];
};

/**
 * Calculate referral conversion rate
 */
export const calculateConversionRate = (
  clicks: number,
  conversions: number
): number => {
  if (clicks === 0) return 0;
  return (conversions / clicks) * 100;
};

/**
 * Validate reward redemption eligibility
 */
export const canRedeemReward = (reward: {
  status: string;
  isRedeemed: boolean;
  expiresAt?: Date;
  isPaidOut: boolean;
}): { canRedeem: boolean; reason?: string } => {
  if (reward.isRedeemed) {
    return { canRedeem: false, reason: 'Reward already redeemed' };
  }

  if (reward.isPaidOut) {
    return { canRedeem: false, reason: 'Reward already paid out' };
  }

  if (reward.status !== 'APPROVED') {
    return { canRedeem: false, reason: 'Reward not approved yet' };
  }

  if (reward.expiresAt && new Date(reward.expiresAt) < new Date()) {
    return { canRedeem: false, reason: 'Reward has expired' };
  }

  return { canRedeem: true };
};

/**
 * Format currency for Nigerian Naira
 */
export const formatNaira = (amount: number): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * Generate referral analytics summary
 */
export const generateReferralSummary = (data: {
  totalReferrals: number;
  qualifiedReferrals: number;
  totalClicks: number;
  totalRewards: number;
  pendingRewards: number;
}): {
  conversionRate: number;
  qualificationRate: number;
  averageReward: number;
  summary: string;
} => {
  const conversionRate = calculateConversionRate(
    data.totalClicks,
    data.qualifiedReferrals
  );
  const qualificationRate =
    data.totalReferrals > 0
      ? (data.qualifiedReferrals / data.totalReferrals) * 100
      : 0;
  const averageReward =
    data.qualifiedReferrals > 0
      ? data.totalRewards / data.qualifiedReferrals
      : 0;

  return {
    conversionRate,
    qualificationRate,
    averageReward,
    summary: `${data.totalReferrals} referrals, ${data.qualifiedReferrals} qualified (${qualificationRate.toFixed(1)}%), ${formatNaira(data.totalRewards)} earned`,
  };
};