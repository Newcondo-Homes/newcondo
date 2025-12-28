// apps/platform/types/reward.ts

export type RewardType = 
  | 'SERVICE_CREDIT'
  | 'SUBSCRIPTION_DISCOUNT'
  | 'RENT_CREDIT'
  | 'COMMISSION_CREDIT'
  | 'MAINTENANCE_VOUCHER'
  | 'CASH_REWARD';

export type RewardStatus = 
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED';

export interface Reward {
  id: string;
  userId: string;
  referralId: string | null;
  rewardType: RewardType;
  amount: number;
  description: string;
  status: RewardStatus;
  isRedeemed: boolean;
  redeemedAt: string | null;
  expiresAt: string | null;
  isPaidOut: boolean;
  paidOutAt: string | null;
  payoutReference: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  referral?: {
    id: string;
    referralCode: string;
    referralType: string;
  };
}

export interface RewardTier {
  id: string;
  name: string;
  minReferrals: number;
  maxReferrals: number | null;
  rewardAmount: number;
  rewardType: RewardType;
  description: string;
  icon: string;
  color: string;
}

export interface RewardSummary {
  totalRewards: number;
  pendingRewards: number;
  approvedRewards: number;
  redeemedRewards: number;
  expiredRewards: number;
  totalValue: number;
  availableBalance: number;
  lockedBalance: number;
  byType: Record<RewardType, {
    count: number;
    totalValue: number;
  }>;
}

export interface RewardRedemptionOption {
  id: string;
  type: 'bank_transfer' | 'wallet_credit' | 'service_credit';
  name: string;
  description: string;
  minAmount: number;
  maxAmount: number | null;
  processingTime: string;
  icon: string;
  isAvailable: boolean;
}

export interface RewardHistory {
  rewards: Reward[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}