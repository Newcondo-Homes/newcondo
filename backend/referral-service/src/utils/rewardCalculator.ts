// backend/referral-service/src/utils/rewardCalculator.ts

import { ReferralType, Role } from '@newcondo/db';
import { REWARD_CONFIGURATIONS } from '../config/rewards';

export interface RewardCalculation {
  referrerAmount: number;
  referredAmount: number;
  totalReward: number;
  referralType: ReferralType;
  description: string;
  expiryDays?: number;
}

/**
 * Determine referral type based on referrer and referred roles
 */
export function determineReferralType(
  referrerRole: Role,
  referredRole: Role
): ReferralType | null {
  const roleMap: Record<string, ReferralType> = {
    [`${Role.OWNER}_${Role.OWNER}`]: ReferralType.OWNER_TO_OWNER,
    [`${Role.OWNER}_${Role.AGENT}`]: ReferralType.OWNER_TO_AGENT,
    [`${Role.OWNER}_${Role.RENTER}`]: ReferralType.OWNER_TO_RENTER,
    [`${Role.AGENT}_${Role.OWNER}`]: ReferralType.AGENT_TO_OWNER,
    [`${Role.AGENT}_${Role.AGENT}`]: ReferralType.AGENT_TO_AGENT,
    [`${Role.AGENT}_${Role.RENTER}`]: ReferralType.AGENT_TO_RENTER,
    [`${Role.RENTER}_${Role.RENTER}`]: ReferralType.RENTER_TO_RENTER,
  };
  
  return roleMap[`${referrerRole}_${referredRole}`] || null;
}

/**
 * Calculate reward amounts for a referral
 */
export function calculateRewardAmounts(referralType: ReferralType): RewardCalculation {
  const config = REWARD_CONFIGURATIONS[referralType];
  
  if (!config) {
    throw new Error(`No reward configuration found for referral type: ${referralType}`);
  }
  
  return {
    referrerAmount: config.referrerAmount,
    referredAmount: config.referredAmount,
    totalReward: config.referrerAmount + config.referredAmount,
    referralType,
    description: config.description,
    expiryDays: config.expiryDays,
  };
}

/**
 * Calculate commission split for agent referrals
 */
export function calculateCommissionSplit(
  rentAmount: number,
  hasListingAgent: boolean,
  hasSubAgent: boolean
): {
  platformFee: number;
  listingAgentCommission: number;
  subAgentCommission: number;
  ownerAmount: number;
} {
  // Platform takes 20% of rent
  const platformFee = rentAmount * 0.2;
  
  if (!hasListingAgent && !hasSubAgent) {
    // No agents - platform gets full 20%
    return {
      platformFee,
      listingAgentCommission: 0,
      subAgentCommission: 0,
      ownerAmount: rentAmount - platformFee,
    };
  }
  
  if (hasListingAgent && !hasSubAgent) {
    // Only listing agent - gets 50% of 20% commission
    const listingAgentCommission = platformFee * 0.5;
    return {
      platformFee: platformFee - listingAgentCommission,
      listingAgentCommission,
      subAgentCommission: 0,
      ownerAmount: rentAmount - platformFee,
    };
  }
  
  if (hasListingAgent && hasSubAgent) {
    // Both agents - split 50% of 20% commission equally
    const totalAgentCommission = platformFee * 0.5;
    const listingAgentCommission = totalAgentCommission * 0.5;
    const subAgentCommission = totalAgentCommission * 0.5;
    
    return {
      platformFee: platformFee - totalAgentCommission,
      listingAgentCommission,
      subAgentCommission,
      ownerAmount: rentAmount - platformFee,
    };
  }
  
  // Shouldn't reach here, but return safe defaults
  return {
    platformFee,
    listingAgentCommission: 0,
    subAgentCommission: 0,
    ownerAmount: rentAmount - platformFee,
  };
}

/**
 * Calculate expiry date for reward
 */
export function calculateRewardExpiryDate(days: number): Date {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);
  return expiryDate;
}

/**
 * Calculate total earned rewards for a user
 */
export function calculateTotalEarnedRewards(rewards: Array<{ amount: number; isRedeemed: boolean }>): {
  totalEarned: number;
  totalRedeemed: number;
  availableBalance: number;
} {
  let totalEarned = 0;
  let totalRedeemed = 0;
  
  for (const reward of rewards) {
    totalEarned += reward.amount;
    if (reward.isRedeemed) {
      totalRedeemed += reward.amount;
    }
  }
  
  return {
    totalEarned,
    totalRedeemed,
    availableBalance: totalEarned - totalRedeemed,
  };
}

/**
 * Apply discount or credit to an amount
 */
export function applyRewardDiscount(
  originalAmount: number,
  rewardAmount: number
): {
  discountedAmount: number;
  discountApplied: number;
  remainingReward: number;
} {
  const discountApplied = Math.min(rewardAmount, originalAmount);
  
  return {
    discountedAmount: originalAmount - discountApplied,
    discountApplied,
    remainingReward: rewardAmount - discountApplied,
  };
}