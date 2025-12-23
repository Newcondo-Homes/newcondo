// backend/shared/src/constants/rewardTiers.ts

import { RewardType } from '../types/referral';

export interface RewardTierDefinition {
  tier: string;
  name: string;
  minReferrals: number;
  maxReferrals?: number;
  benefits: string[];
  bonusMultiplier: number;
  badgeColor: string;
  icon: string;
}

export interface RewardTypeConfig {
  type: RewardType;
  displayName: string;
  description: string;
  icon: string;
  canBeStacked: boolean;
  canBeTransferred: boolean;
  defaultExpiryDays: number;
}

export interface ReferralTypeRewardConfig {
  referralType: string;
  referrerAmount: number;
  referredAmount: number;
  rewardType: RewardType;
  description: string;
  qualificationCriteria: string[];
}

// User tier progression system
export const USER_REWARD_TIERS: RewardTierDefinition[] = [
  {
    tier: 'BRONZE',
    name: 'Bronze Member',
    minReferrals: 0,
    maxReferrals: 4,
    benefits: [
      'Basic referral rewards',
      'Access to referral dashboard',
      'Email support',
    ],
    bonusMultiplier: 1.0,
    badgeColor: '#CD7F32',
    icon: '🥉',
  },
  {
    tier: 'SILVER',
    name: 'Silver Member',
    minReferrals: 5,
    maxReferrals: 14,
    benefits: [
      'All Bronze benefits',
      '10% bonus on all rewards',
      'Priority email support',
      'Early access to new features',
    ],
    bonusMultiplier: 1.1,
    badgeColor: '#C0C0C0',
    icon: '🥈',
  },
  {
    tier: 'GOLD',
    name: 'Gold Member',
    minReferrals: 15,
    maxReferrals: 49,
    benefits: [
      'All Silver benefits',
      '25% bonus on all rewards',
      'Dedicated account manager',
      'Monthly bonus rewards',
      'Featured on leaderboard',
    ],
    bonusMultiplier: 1.25,
    badgeColor: '#FFD700',
    icon: '🥇',
  },
  {
    tier: 'PLATINUM',
    name: 'Platinum Member',
    minReferrals: 50,
    maxReferrals: 99,
    benefits: [
      'All Gold benefits',
      '50% bonus on all rewards',
      '24/7 priority support',
      'Quarterly bonus rewards',
      'VIP event invitations',
      'Custom referral link',
    ],
    bonusMultiplier: 1.5,
    badgeColor: '#E5E4E2',
    icon: '💎',
  },
  {
    tier: 'DIAMOND',
    name: 'Diamond Member',
    minReferrals: 100,
    benefits: [
      'All Platinum benefits',
      '100% bonus on all rewards (2x)',
      'Personal success coach',
      'Lifetime rewards',
      'Brand ambassador status',
      'Revenue sharing opportunities',
    ],
    bonusMultiplier: 2.0,
    badgeColor: '#B9F2FF',
    icon: '💠',
  },
];

// Reward type configurations
export const REWARD_TYPE_CONFIGS: RewardTypeConfig[] = [
  {
    type: RewardType.SERVICE_CREDIT,
    displayName: 'Service Credit',
    description: 'Credit towards NewCondo services',
    icon: '💳',
    canBeStacked: true,
    canBeTransferred: false,
    defaultExpiryDays: 365,
  },
  {
    type: RewardType.SUBSCRIPTION_DISCOUNT,
    displayName: 'Subscription Discount',
    description: 'Discount on subscription fees',
    icon: '🎟️',
    canBeStacked: false,
    canBeTransferred: false,
    defaultExpiryDays: 90,
  },
  {
    type: RewardType.RENT_CREDIT,
    displayName: 'Rent Credit',
    description: 'Credit towards rent payments',
    icon: '🏠',
    canBeStacked: true,
    canBeTransferred: false,
    defaultExpiryDays: 180,
  },
  {
    type: RewardType.COMMISSION_CREDIT,
    displayName: 'Commission Credit',
    description: 'Credit towards commission fees',
    icon: '💼',
    canBeStacked: true,
    canBeTransferred: false,
    defaultExpiryDays: 365,
  },
  {
    type: RewardType.MAINTENANCE_VOUCHER,
    displayName: 'Maintenance Voucher',
    description: 'Free property maintenance services',
    icon: '🔧',
    canBeStacked: true,
    canBeTransferred: true,
    defaultExpiryDays: 180,
  },
  {
    type: RewardType.CASH_REWARD,
    displayName: 'Cash Reward',
    description: 'Direct cash payout to bank account',
    icon: '💰',
    canBeStacked: true,
    canBeTransferred: false,
    defaultExpiryDays: 365,
  },
];

// Referral type reward configurations
export const REFERRAL_TYPE_REWARDS: ReferralTypeRewardConfig[] = [
  {
    referralType: 'OWNER_TO_OWNER',
    referrerAmount: 10000,
    referredAmount: 10000,
    rewardType: RewardType.SERVICE_CREDIT,
    description: '₦10,000 service credit for each party',
    qualificationCriteria: [
      'New owner subscribes to paid plan',
      'Subscription active for 30 days',
    ],
  },
  {
    referralType: 'OWNER_TO_AGENT',
    referrerAmount: 5000,
    referredAmount: 5000,
    rewardType: RewardType.SERVICE_CREDIT,
    description: '₦5,000 service credit for each party',
    qualificationCriteria: [
      'Agent completes verification',
      'Agent lists first property',
    ],
  },
  {
    referralType: 'OWNER_TO_RENTER',
    referrerAmount: 2000,
    referredAmount: 2000,
    rewardType: RewardType.RENT_CREDIT,
    description: '₦2,000 credit for each party',
    qualificationCriteria: [
      'Renter completes first rent payment',
      'Payment confirmed by owner',
    ],
  },
  {
    referralType: 'AGENT_TO_OWNER',
    referrerAmount: 7000,
    referredAmount: 3000,
    rewardType: RewardType.COMMISSION_CREDIT,
    description: '₦7,000 for agent, ₦3,000 for owner',
    qualificationCriteria: [
      'Owner subscribes to paid plan',
      'Owner lists first property',
    ],
  },
  {
    referralType: 'AGENT_TO_AGENT',
    referrerAmount: 3000,
    referredAmount: 3000,
    rewardType: RewardType.COMMISSION_CREDIT,
    description: '₦3,000 commission credit for each party',
    qualificationCriteria: [
      'New agent completes verification',
      'New agent closes first deal',
    ],
  },
  {
    referralType: 'AGENT_TO_RENTER',
    referrerAmount: 5000,
    referredAmount: 5000,
    rewardType: RewardType.SERVICE_CREDIT,
    description: '₦5,000 credit for each party',
    qualificationCriteria: [
      'Renter completes first payment',
      'Payment through agent referral link',
    ],
  },
  {
    referralType: 'RENTER_TO_RENTER',
    referrerAmount: 1000,
    referredAmount: 2000,
    rewardType: RewardType.RENT_CREDIT,
    description: '₦1,000 for referrer, ₦2,000 for new renter',
    qualificationCriteria: [
      'New renter completes first payment',
      'Payment confirmed successfully',
    ],
  },
];

// Milestone rewards (bonus rewards for reaching certain numbers)
export interface MilestoneReward {
  milestone: number;
  rewardAmount: number;
  rewardType: RewardType;
  name: string;
  description: string;
  badge: string;
}

export const MILESTONE_REWARDS: MilestoneReward[] = [
  {
    milestone: 5,
    rewardAmount: 5000,
    rewardType: RewardType.SERVICE_CREDIT,
    name: 'First Five',
    description: 'Bonus for your first 5 referrals',
    badge: '⭐',
  },
  {
    milestone: 10,
    rewardAmount: 10000,
    rewardType: RewardType.SERVICE_CREDIT,
    name: 'Perfect Ten',
    description: 'Congratulations on 10 referrals!',
    badge: '🌟',
  },
  {
    milestone: 25,
    rewardAmount: 25000,
    rewardType: RewardType.CASH_REWARD,
    name: 'Quarter Century',
    description: 'Amazing! 25 successful referrals',
    badge: '🏆',
  },
  {
    milestone: 50,
    rewardAmount: 50000,
    rewardType: RewardType.CASH_REWARD,
    name: 'Half Century',
    description: 'Outstanding achievement!',
    badge: '🎖️',
  },
  {
    milestone: 100,
    rewardAmount: 100000,
    rewardType: RewardType.CASH_REWARD,
    name: 'Century Club',
    description: 'Welcome to the elite Century Club!',
    badge: '👑',
  },
  {
    milestone: 250,
    rewardAmount: 250000,
    rewardType: RewardType.CASH_REWARD,
    name: 'Super Ambassador',
    description: 'You are a true NewCondo champion!',
    badge: '💫',
  },
  {
    milestone: 500,
    rewardAmount: 500000,
    rewardType: RewardType.CASH_REWARD,
    name: 'Legend Status',
    description: 'Legendary performance!',
    badge: '🔥',
  },
];

// Time-based bonus multipliers (promotional periods)
export interface BonusMultiplierPeriod {
  name: string;
  startDate: Date;
  endDate: Date;
  multiplier: number;
  description: string;
}

// Helper function to get user tier based on referral count
export const getUserTier = (referralCount: number): RewardTierDefinition => {
  for (let i = USER_REWARD_TIERS.length - 1; i >= 0; i--) {
    const tier = USER_REWARD_TIERS[i];
    if (referralCount >= tier.minReferrals) {
      return tier;
    }
  }
  return USER_REWARD_TIERS[0]; // Default to Bronze
};

// Helper function to get next tier
export const getNextTier = (currentTier: string): RewardTierDefinition | null => {
  const currentIndex = USER_REWARD_TIERS.findIndex((t) => t.tier === currentTier);
  if (currentIndex === -1 || currentIndex === USER_REWARD_TIERS.length - 1) {
    return null;
  }
  return USER_REWARD_TIERS[currentIndex + 1];
};

// Helper function to calculate reward with tier bonus
export const calculateRewardWithBonus = (
  baseAmount: number,
  tierMultiplier: number
): number => {
  return Math.round(baseAmount * tierMultiplier);
};

// Helper function to get milestone reward for count
export const getMilestoneReward = (
  referralCount: number
): MilestoneReward | null => {
  return (
    MILESTONE_REWARDS.find((m) => m.milestone === referralCount) || null
  );
};

// Helper function to get next milestone
export const getNextMilestone = (
  currentCount: number
): MilestoneReward | null => {
  return (
    MILESTONE_REWARDS.find((m) => m.milestone > currentCount) || null
  );
};

// Helper function to get reward type configuration
export const getRewardTypeConfig = (
  rewardType: RewardType
): RewardTypeConfig | undefined => {
  return REWARD_TYPE_CONFIGS.find((c) => c.type === rewardType);
};

// Helper function to get referral type reward configuration
export const getReferralTypeReward = (
  referralType: string
): ReferralTypeRewardConfig | undefined => {
  return REFERRAL_TYPE_REWARDS.find((r) => r.referralType === referralType);
};