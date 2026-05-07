// apps/platform/lib/utils/referralHelpers.ts

import { REFERRAL_CONFIG, REFERRAL_TYPE_CONFIG } from '../constants/referralConfig';
import { ReferralType, ReferralStatus } from '@/types/referral';

/**
 * Generate a unique referral code
 */
export function generateReferralCode(): string {
  const prefix = REFERRAL_CONFIG.CODE_PREFIX;
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${timestamp}${random}`.substring(0, REFERRAL_CONFIG.CODE_LENGTH + 2);
}

/**
 * Generate referral link from code
 */
export function generateReferralLink(code: string): string {
  return `${REFERRAL_CONFIG.BASE_URL}/r/${code}`;
}

/**
 * Get short referral link (for SMS and social media)
 */
export function getShortReferralLink(code: string): string {
  // In production, integrate with URL shortener service (bit.ly, TinyURL, etc.)
  return generateReferralLink(code);
}

/**
 * Calculate reward amounts based on referral type
 */
export function calculateRewardAmounts(referralType: ReferralType): {
  referrerReward: number;
  referredReward: number;
  rewardType: string;
} {
  const config = REFERRAL_CONFIG.REWARDS[referralType];
  return {
    referrerReward: config.referrer,
    referredReward: config.referred,
    rewardType: config.type,
  };
}

/**
 * Check if user is eligible for referral program
 */
export function isEligibleForReferrals(userRole: string, hasCompletedTransaction: boolean): boolean {
  if (userRole === 'OWNER' || userRole === 'AGENT') {
    return hasCompletedTransaction;
  }
  if (userRole === 'RENTER') {
    return hasCompletedTransaction;
  }
  return false;
}

/**
 * Determine referral type based on referrer and referee roles
 */
export function determineReferralType(
  referrerRole: string,
  referredRole: string
): ReferralType | null {
  const typeMap: Record<string, ReferralType> = {
    'OWNER_OWNER': 'OWNER_TO_OWNER',
    'OWNER_AGENT': 'OWNER_TO_AGENT',
    'OWNER_RENTER': 'OWNER_TO_RENTER',
    'AGENT_OWNER': 'AGENT_TO_OWNER',
    'AGENT_AGENT': 'AGENT_TO_AGENT',
    'AGENT_RENTER': 'AGENT_TO_RENTER',
    'RENTER_RENTER': 'RENTER_TO_RENTER',
  };

  const key = `${referrerRole}_${referredRole}`;
  return typeMap[key] || null;
}

/**
 * Format referral status for display
 */
export function formatReferralStatus(status: ReferralStatus): {
  label: string;
  color: string;
  icon: string;
} {
  const statusMap: Record<ReferralStatus, { label: string; color: string; icon: string }> = {
    PENDING: { label: 'Pending', color: 'yellow', icon: '⏳' },
    QUALIFIED: { label: 'Qualified', color: 'green', icon: '✓' },
    REWARDED: { label: 'Rewarded', color: 'blue', icon: '🎁' },
    EXPIRED: { label: 'Expired', color: 'gray', icon: '⏰' },
    CANCELLED: { label: 'Cancelled', color: 'red', icon: '✕' },
  };

  return statusMap[status];
}

/**
 * Check if referral has expired
 */
export function isReferralExpired(createdAt: string | Date): boolean {
  const created = new Date(createdAt);
  const now = new Date();
  const daysDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  return daysDiff > REFERRAL_CONFIG.REWARD_EXPIRY_DAYS;
}

/**
 * Calculate conversion rate
 */
export function calculateConversionRate(totalReferrals: number, qualifiedReferrals: number): number {
  if (totalReferrals === 0) return 0;
  return Math.round((qualifiedReferrals / totalReferrals) * 100);
}

/**
 * Get milestone bonus for referral count
 */
export function getMilestoneBonus(referralCount: number): {
  bonus: number;
  description: string;
  nextMilestone: { count: number; bonus: number } | null;
} | null {
  const milestones = REFERRAL_CONFIG.MILESTONES;
  
  // Find current milestone
  const currentMilestone = [...milestones]
    .reverse()
    .find(m => referralCount >= m.count);
  
  if (!currentMilestone) return null;
  
  // Find next milestone
  const nextMilestone = milestones.find(m => m.count > referralCount);
  
  return {
    bonus: currentMilestone.bonus,
    description: currentMilestone.description,
    nextMilestone: nextMilestone || null,
  };
}

/**
 * Calculate progress to next milestone
 */
export function calculateMilestoneProgress(referralCount: number): {
  current: number;
  target: number;
  percentage: number;
  remaining: number;
} {
  const nextMilestone = REFERRAL_CONFIG.MILESTONES.find(m => m.count > referralCount);
  
  if (!nextMilestone) {
    const lastMilestone = REFERRAL_CONFIG.MILESTONES[REFERRAL_CONFIG.MILESTONES.length - 1];
    return {
      current: referralCount,
      target: lastMilestone.count,
      percentage: 100,
      remaining: 0,
    };
  }
  
  const previousMilestone = [...REFERRAL_CONFIG.MILESTONES]
    .reverse()
    .find(m => m.count <= referralCount);
  
  const start = previousMilestone?.count || 0;
  const target = nextMilestone.count;
  const progress = referralCount - start;
  const total = target - start;
  
  return {
    current: referralCount,
    target,
    percentage: Math.round((progress / total) * 100),
    remaining: target - referralCount,
  };
}

/**
 * Validate referral code format
 */
export function isValidReferralCode(code: string): boolean {
  const pattern = new RegExp(`^${REFERRAL_CONFIG.CODE_PREFIX}[A-Z0-9]+$`);
  return pattern.test(code) && code.length >= 6 && code.length <= 20;
}

/**
 * Get referral type display info
 */
export function getReferralTypeInfo(type: ReferralType) {
  return REFERRAL_TYPE_CONFIG[type];
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency = 'NGN'): string {
  if (currency === 'NGN') {
    return `₦${amount.toLocaleString('en-NG')}`;
  }
  return `${currency} ${amount.toLocaleString()}`;
}

/**
 * Calculate days until expiry
 */
export function getDaysUntilExpiry(createdAt: string | Date): number {
  const created = new Date(createdAt);
  const expiry = new Date(created);
  expiry.setDate(expiry.getDate() + REFERRAL_CONFIG.REWARD_EXPIRY_DAYS);
  
  const now = new Date();
  const daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  return Math.max(0, daysRemaining);
}