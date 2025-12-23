// backend/referral-service/src/types/reward.ts

import { 
  ReferralReward, 
  RewardStatus, 
  RewardType,
  User 
} from '@newcondo/db';

export interface CreateRewardDTO {
  userId: string;
  referralId?: string;
  rewardType: RewardType;
  amount: number;
  description: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface RewardWithUser extends ReferralReward {
  user: Pick<User, 'id' | 'name' | 'email' | 'role'>;
}

export interface RewardSummary {
  totalRewards: number;
  pendingRewards: number;
  approvedRewards: number;
  redeemedRewards: number;
  expiredRewards: number;
  totalAmount: number;
  availableAmount: number;
  redeemedAmount: number;
}

export interface RedeemRewardDTO {
  rewardId: string;
  userId: string;
  redemptionType: 'auto' | 'manual';
  targetAccount?: string;
}

export interface PayoutRewardDTO {
  rewardId: string;
  payoutMethod: 'virtual_account' | 'bank_transfer' | 'service_credit';
  payoutReference?: string;
}

export interface RewardBalanceResponse {
  userId: string;
  totalBalance: number;
  availableBalance: number;
  pendingBalance: number;
  expiringSoon: {
    amount: number;
    expiryDate: Date;
  }[];
  rewardsByType: Record<RewardType, number>;
}

export interface RewardTransactionDTO {
  userId: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  referenceId?: string;
  metadata?: Record<string, any>;
}

export interface ApplyRewardDTO {
  userId: string;
  rewardId: string;
  targetTransaction: {
    type: 'rent' | 'subscription' | 'service';
    amount: number;
    transactionId: string;
  };
}

export interface RewardFilters {
  status?: RewardStatus;
  rewardType?: RewardType;
  isRedeemed?: boolean;
  isPaidOut?: boolean;
  startDate?: Date;
  endDate?: Date;
  expiringBefore?: Date;
}

export interface RewardListResponse {
  rewards: RewardWithUser[];
  summary: RewardSummary;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}