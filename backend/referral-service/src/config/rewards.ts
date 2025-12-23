// backend/referral-service/src/config/rewards.ts

import { ReferralType, RewardType } from '@newcondo/db';

export interface RewardConfig {
  referrerAmount: number;
  referredAmount: number;
  rewardType: RewardType;
  description: string;
  expiryDays?: number;
}

export const REWARD_CONFIGURATIONS: Record<ReferralType, RewardConfig> = {
  // Owner to Owner: Both get free month (₦10,000 credit)
  OWNER_TO_OWNER: {
    referrerAmount: 10000,
    referredAmount: 10000,
    rewardType: RewardType.SERVICE_CREDIT,
    description: 'Free month of NewCondo service',
    expiryDays: 90,
  },

  // Owner to Agent: ₦5,000 commission credit each
  OWNER_TO_AGENT: {
    referrerAmount: 5000,
    referredAmount: 5000,
    rewardType: RewardType.COMMISSION_CREDIT,
    description: 'Commission credit for platform services',
    expiryDays: 90,
  },

  // Owner to Renter: ₦2,000 upkeep credit and ₦2,000 rent credit
  OWNER_TO_RENTER: {
    referrerAmount: 2000,
    referredAmount: 2000,
    rewardType: RewardType.SERVICE_CREDIT,
    description: 'Property service credits',
    expiryDays: 60,
  },

  // Agent to Owner: Agent gets ₦7,000 fee credit, Owner gets ₦3,000 off
  AGENT_TO_OWNER: {
    referrerAmount: 7000,
    referredAmount: 3000,
    rewardType: RewardType.SUBSCRIPTION_DISCOUNT,
    description: 'Platform subscription discount',
    expiryDays: 90,
  },

  // Agent to Agent: ₦3,000 credit each
  AGENT_TO_AGENT: {
    referrerAmount: 3000,
    referredAmount: 3000,
    rewardType: RewardType.COMMISSION_CREDIT,
    description: 'Agent fee credit',
    expiryDays: 90,
  },

  // Agent to Renter: Agent gets ₦5,000, Renter gets ₦5,000 off rent
  AGENT_TO_RENTER: {
    referrerAmount: 5000,
    referredAmount: 5000,
    rewardType: RewardType.RENT_CREDIT,
    description: 'Rent payment credit',
    expiryDays: 60,
  },

  // Renter to Renter: ₦1,000-2,000 off next rent
  RENTER_TO_RENTER: {
    referrerAmount: 2000,
    referredAmount: 2000,
    rewardType: RewardType.RENT_CREDIT,
    description: 'Rent discount credit',
    expiryDays: 60,
  },
};

// Qualification thresholds
export const QUALIFICATION_REQUIREMENTS = {
  OWNER_TO_OWNER: {
    referredMustPaySubscription: true,
    minimumSubscriptionMonths: 1,
  },
  OWNER_TO_AGENT: {
    referredMustCompleteTransaction: true,
    minimumTransactionAmount: 0,
  },
  OWNER_TO_RENTER: {
    referredMustPayRent: true,
    minimumRentAmount: 0,
  },
  AGENT_TO_OWNER: {
    referredMustPaySubscription: true,
    minimumSubscriptionMonths: 1,
  },
  AGENT_TO_AGENT: {
    referredMustCompleteTransaction: true,
    minimumTransactionAmount: 0,
  },
  AGENT_TO_RENTER: {
    referredMustPayRent: true,
    minimumRentAmount: 0,
  },
  RENTER_TO_RENTER: {
    referredMustPayRent: true,
    minimumRentAmount: 0,
  },
};

// Reward payout settings
export const PAYOUT_SETTINGS = {
  // Auto-payout after qualification
  AUTO_PAYOUT_ENABLED: true,
  
  // Minimum balance for manual withdrawal
  MINIMUM_WITHDRAWAL_AMOUNT: 1000,
  
  // Maximum rewards per user
  MAX_REFERRAL_REWARDS_PER_USER: 50,
  
  // Cooldown between referrals (in hours)
  REFERRAL_COOLDOWN_HOURS: 24,
};

// Referral link settings
export const REFERRAL_LINK_CONFIG = {
  BASE_URL: process.env.PLATFORM_URL || 'https://newcondo.ng',
  CODE_LENGTH: 8,
  CODE_PREFIX: 'NC',
};

// Commission rates for different user types
export const COMMISSION_RATES = {
  LISTING_AGENT: 0.5, // 50% of 20% commission
  SUB_AGENT: 0.5, // 50% of 20% commission (shared with listing agent)
  PLATFORM: 0.2, // 20% of rent amount
};