// backend/shared/src/types/reward.ts

export enum RewardTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
  DIAMOND = 'DIAMOND',
}

export enum RewardCategory {
  REFERRAL = 'REFERRAL',
  LOYALTY = 'LOYALTY',
  MILESTONE = 'MILESTONE',
  PROMOTIONAL = 'PROMOTIONAL',
  BONUS = 'BONUS',
}

export interface RewardConfig {
  type: string;
  amount: number;
  currency: string;
  expiryDays?: number;
  isStackable: boolean;
  maxRedemptions?: number;
  minimumBalance?: number;
}

export interface RewardMilestone {
  id: string;
  name: string;
  description: string;
  requiredReferrals: number;
  rewardAmount: number;
  rewardType: string;
  tier: RewardTier;
}

export interface RewardBalance {
  userId: string;
  totalEarned: number;
  totalRedeemed: number;
  availableBalance: number;
  pendingBalance: number;
  expiringSoon: number;
  currency: string;
}

export interface RewardTransaction {
  id: string;
  userId: string;
  type: 'EARN' | 'REDEEM' | 'EXPIRE' | 'REFUND';
  amount: number;
  balance: number;
  description: string;
  reference?: string;
  createdAt: Date;
}

export interface RewardRedemptionOption {
  id: string;
  name: string;
  description: string;
  minimumAmount: number;
  maximumAmount?: number;
  processingTime: string;
  fees: number;
  isAvailable: boolean;
}

export interface RewardPayout {
  id: string;
  userId: string;
  amount: number;
  method: 'BANK_TRANSFER' | 'WALLET' | 'CREDIT';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  reference?: string;
  bankDetails?: {
    accountNumber: string;
    bankCode: string;
    accountName: string;
  };
  initiatedAt: Date;
  completedAt?: Date;
  failureReason?: string;
}

export interface RewardStats {
  totalUsers: number;
  totalRewardsIssued: number;
  totalRewardsRedeemed: number;
  totalValueIssued: number;
  totalValueRedeemed: number;
  averageRewardPerUser: number;
  redemptionRate: number;
  expiryRate: number;
}

export interface UserRewardProfile {
  userId: string;
  tier: RewardTier;
  totalReferrals: number;
  qualifiedReferrals: number;
  lifetimeEarnings: number;
  currentBalance: number;
  nextMilestone?: RewardMilestone;
  badges: string[];
  joinedAt: Date;
  lastActivityAt: Date;
}

export interface RewardNotification {
  id: string;
  userId: string;
  type: 'EARNED' | 'REDEEMED' | 'EXPIRED' | 'MILESTONE';
  title: string;
  message: string;
  amount?: number;
  isRead: boolean;
  createdAt: Date;
}

export interface RewardAnalytics {
  period: string;
  totalEarned: number;
  totalRedeemed: number;
  netBalance: number;
  topEarners: Array<{
    userId: string;
    userName: string;
    amount: number;
  }>;
  earningsByType: Record<string, number>;
  redemptionsByMethod: Record<string, number>;
}

// DTOs
export interface IssueRewardDTO {
  userId: string;
  rewardType: string;
  amount: number;
  description: string;
  reference?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface RedeemRewardDTO {
  userId: string;
  rewardIds: string[];
  amount: number;
  method: 'BANK_TRANSFER' | 'WALLET' | 'CREDIT';
  bankDetails?: {
    accountNumber: string;
    bankCode: string;
    accountName: string;
  };
}

export interface UpdateRewardBalanceDTO {
  userId: string;
  amount: number;
  type: 'EARN' | 'REDEEM' | 'ADJUST';
  description: string;
  reference?: string;
}

export interface RewardFilterOptions {
  userId?: string;
  status?: string[];
  rewardType?: string[];
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  isRedeemed?: boolean;
  isExpired?: boolean;
}

export interface RewardSortOptions {
  field: 'amount' | 'createdAt' | 'expiresAt' | 'status';
  order: 'asc' | 'desc';
}

export interface RewardPaginationOptions {
  page: number;
  limit: number;
  sortBy?: RewardSortOptions;
}

export interface PaginatedRewards<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface RewardValidationRules {
  minAmount: number;
  maxAmount: number;
  expiryDays: number;
  maxActiveRewards: number;
  minRedemptionAmount: number;
  dailyRedemptionLimit: number;
}

export interface RewardAuditLog {
  id: string;
  userId: string;
  action: string;
  details: Record<string, any>;
  performedBy: string;
  ipAddress?: string;
  timestamp: Date;
}