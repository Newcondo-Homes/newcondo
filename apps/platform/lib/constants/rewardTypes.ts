// apps/platform/lib/constants/referralConfig.ts

import { RewardType, ReferralType } from '@/types/referral';
import { RewardRedemptionOption, RewardTier } from '@/types/reward';

export const REFERRAL_CONFIG = {
  // Base URL for referral links
  BASE_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://newcondo.com',

  // Referral code configuration
  CODE_LENGTH: 8,
  CODE_PREFIX: 'NC',

  // Reward amounts (in Naira)
  REWARDS: {
    OWNER_TO_OWNER: {
      referrer: 10000, // ₦10,000 credit
      referred: 5000,  // ₦5,000 credit
      type: 'SERVICE_CREDIT' as RewardType,
      description: 'Free month of NewCondo service'
    },
    OWNER_TO_AGENT: {
      referrer: 5000,
      referred: 5000,
      type: 'COMMISSION_CREDIT' as RewardType,
      description: 'Commission discount or credit'
    },
    OWNER_TO_RENTER: {
      referrer: 2000,
      referred: 2000,
      type: 'SERVICE_CREDIT' as RewardType,
      description: 'Complimentary services'
    },
    AGENT_TO_OWNER: {
      referrer: 7000,
      referred: 3000,
      type: 'SERVICE_CREDIT' as RewardType,
      description: 'Fee credit'
    },
    AGENT_TO_AGENT: {
      referrer: 3000,
      referred: 3000,
      type: 'COMMISSION_CREDIT' as RewardType,
      description: 'Agent fee credit'
    },
    AGENT_TO_RENTER: {
      referrer: 5000,
      referred: 5000,
      type: 'RENT_CREDIT' as RewardType,
      description: 'Rent discount credit'
    },
    RENTER_TO_RENTER: {
      referrer: 1000,
      referred: 1000,
      type: 'SERVICE_CREDIT' as RewardType,
      description: 'Free amenities'
    }
  },

  // Qualification criteria
  QUALIFICATION: {
    OWNER: 'paid_subscription', // Owner must be on paid subscription
    AGENT: 'completed_transaction', // Agent must have completed a transaction
    RENTER: 'first_payment', // Renter must complete first rent payment
  },

  // Reward expiry
  REWARD_EXPIRY_DAYS: 90, // 3 months

  // Limits
  MAX_REFERRALS_PER_USER: 100,
  MAX_PENDING_REWARDS: 10,

  // Milestone bonuses
  MILESTONES: [
    { count: 5, bonus: 5000, description: 'First 5 referrals bonus' },
    { count: 10, bonus: 10000, description: '10 referrals milestone' },
    { count: 25, bonus: 25000, description: '25 referrals champion' },
    { count: 50, bonus: 50000, description: '50 referrals legend' },
  ],

  // Social sharing
  SHARE_MESSAGE: {
    default: 'Join NewCondo and enjoy seamless property management! Use my referral code to get special rewards.',
    whatsapp: 'Hey! 👋 I\'m using NewCondo for property management and it\'s amazing! Join using my link and we both get rewards: {link}',
    email: {
      subject: 'Join me on NewCondo - Get rewards!',
      body: 'Hi!\n\nI\'ve been using NewCondo for property management and thought you\'d love it too.\n\nJoin using my referral link and we\'ll both get rewards:\n{link}\n\nCheers!'
    },
    sms: 'Join NewCondo using my referral code {code} and get ₦{amount} credit! Sign up: {link}'
  }
} as const;

export const REFERRAL_TYPE_CONFIG: Record<ReferralType, {
  name: string;
  description: string;
  icon: string;
  color: string;
  eligibility: string[];
}> = {
  OWNER_TO_OWNER: {
    name: 'Owner → Owner',
    description: 'Refer property owners',
    icon: '🏠',
    color: 'blue',
    eligibility: ['Must be on paid subscription']
  },
  OWNER_TO_AGENT: {
    name: 'Owner → Agent',
    description: 'Refer real estate agents',
    icon: '🤝',
    color: 'green',
    eligibility: ['Must be on paid subscription']
  },
  OWNER_TO_RENTER: {
    name: 'Owner → Renter',
    description: 'Refer tenants',
    icon: '👥',
    color: 'purple',
    eligibility: ['Must be on paid subscription']
  },
  AGENT_TO_OWNER: {
    name: 'Agent → Owner',
    description: 'Bring new property owners',
    icon: '🏢',
    color: 'orange',
    eligibility: ['Must have completed at least one transaction']
  },
  AGENT_TO_AGENT: {
    name: 'Agent → Agent',
    description: 'Refer fellow agents',
    icon: '👔',
    color: 'teal',
    eligibility: ['Must have completed at least one transaction']
  },
  AGENT_TO_RENTER: {
    name: 'Agent → Renter',
    description: 'Bring new tenants',
    icon: '🔑',
    color: 'indigo',
    eligibility: ['Must have completed at least one transaction']
  },
  RENTER_TO_RENTER: {
    name: 'Renter → Renter',
    description: 'Refer other renters',
    icon: '🏘️',
    color: 'pink',
    eligibility: ['Must have completed at least one rent payment']
  }
};


export const REWARD_REDEMPTION_OPTIONS: RewardRedemptionOption[] = [
  {
    id: 'wallet_credit',
    type: 'wallet_credit',
    name: 'Wallet Credit',
    description: 'Instantly added to your NewCondo wallet balance.',
    minAmount: 500,
    maxAmount: null,
    processingTime: 'Instant',
    icon: 'Wallet',
    isAvailable: true,
  },
  {
    id: 'service_credit',
    type: 'service_credit',
    name: 'Service Credit',
    description: 'Applied to your account for use on NewCondo services.',
    minAmount: 500,
    maxAmount: null,
    processingTime: 'Instant',
    icon: 'Gift',
    isAvailable: true,
  },
  {
    id: 'bank_transfer',
    type: 'bank_transfer',
    name: 'Bank Transfer',
    description: 'Transferred directly to your Nigerian bank account.',
    minAmount: 2000,
    maxAmount: null,
    processingTime: '1–3 business days',
    icon: 'CreditCard',
    isAvailable: true,
  },
];


export const REWARD_TIERS: RewardTier[] = [
  {
    id: 'bronze',
    name: 'Bronze',
    minReferrals: 0,
    maxReferrals: 4,
    rewardAmount: 1000,
    rewardType: 'SERVICE_CREDIT',
    description: 'Get started with referral rewards',
    icon: '🥉',
    color: 'orange',
  },
  {
    id: 'silver',
    name: 'Silver',
    minReferrals: 5,
    maxReferrals: 9,
    rewardAmount: 2000,
    rewardType: 'SERVICE_CREDIT',
    description: 'Growing your network',
    icon: '🥈',
    color: 'gray',
  },
  {
    id: 'gold',
    name: 'Gold',
    minReferrals: 10,
    maxReferrals: 24,
    rewardAmount: 5000,
    rewardType: 'SERVICE_CREDIT',
    description: 'A trusted referrer in the community',
    icon: '🥇',
    color: 'yellow',
  },
  {
    id: 'platinum',
    name: 'Platinum',
    minReferrals: 25,
    maxReferrals: 49,
    rewardAmount: 10000,
    rewardType: 'CASH_REWARD',
    description: 'Elite referrer with premium rewards',
    icon: '💎',
    color: 'blue',
  },
  {
    id: 'legend',
    name: 'Legend',
    minReferrals: 50,
    maxReferrals: null,
    rewardAmount: 25000,
    rewardType: 'CASH_REWARD',
    description: 'Top-tier referrer — the best of the best',
    icon: '👑',
    color: 'purple',
  },
];


export const REWARD_TYPE_CONFIG: Record<RewardType, {
  name: string;
  description: string;
  icon: string;
  color: string;
}> = {
  SERVICE_CREDIT: {
    name: 'Service Credit',
    description: 'Free NewCondo services',
    icon: '💎',
    color: 'blue'
  },
  SUBSCRIPTION_DISCOUNT: {
    name: 'Subscription Discount',
    description: 'Discount on subscription fees',
    icon: '🎟️',
    color: 'green'
  },
  RENT_CREDIT: {
    name: 'Rent Credit',
    description: 'Credit towards rent payment',
    icon: '💰',
    color: 'yellow'
  },
  COMMISSION_CREDIT: {
    name: 'Commission Credit',
    description: 'Agent commission credit',
    icon: '📊',
    color: 'purple'
  },
  MAINTENANCE_VOUCHER: {
    name: 'Maintenance Voucher',
    description: 'Free maintenance services',
    icon: '🔧',
    color: 'orange'
  },
  CASH_REWARD: {
    name: 'Cash Reward',
    description: 'Direct cash payment',
    icon: '💵',
    color: 'emerald'
  }
};