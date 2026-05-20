// backend/shared/src/types/referral.ts

export enum ReferralType {
  OWNER_TO_OWNER = 'OWNER_TO_OWNER',
  OWNER_TO_AGENT = 'OWNER_TO_AGENT',
  OWNER_TO_RENTER = 'OWNER_TO_RENTER',
  AGENT_TO_OWNER = 'AGENT_TO_OWNER',
  AGENT_TO_AGENT = 'AGENT_TO_AGENT',
  AGENT_TO_RENTER = 'AGENT_TO_RENTER',
  RENTER_TO_RENTER = 'RENTER_TO_RENTER',
}

export enum ReferralStatus {
  PENDING = 'PENDING',
  QUALIFIED = 'QUALIFIED',
  REWARDED = 'REWARDED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum RewardType {
  SERVICE_CREDIT = 'SERVICE_CREDIT',
  SUBSCRIPTION_DISCOUNT = 'SUBSCRIPTION_DISCOUNT',
  RENT_CREDIT = 'RENT_CREDIT',
  COMMISSION_CREDIT = 'COMMISSION_CREDIT',
  MAINTENANCE_VOUCHER = 'MAINTENANCE_VOUCHER',
  CASH_REWARD = 'CASH_REWARD',
}

export enum RewardStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export interface ReferralClickData {
  referralCode: string;
  ipAddress?: string;
  userAgent?: string;
  referrerUrl?: string;
  landingPage?: string;
  country?: string;
  city?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
}

export interface ReferralConversionData {
  referralId: string;
  paymentId: string;
  amount: number;
  commission: number;
  referralType: ReferralType;
}

export interface ReferralRewardData {
  userId: string;
  referralId?: string;
  rewardType: RewardType;
  amount: number;
  description: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  qualifiedReferrals: number;
  totalRewards: number;
  pendingRewards: number;
  redeemedRewards: number;
  totalClicks: number;
  uniqueClicks: number;
  conversionRate: number;
}

export interface AgentReferralData {
  agentId: string;
  propertyId: string;
  referralCode: string;
  referralLink: string;
}

export interface PromotionRequestData {
  agentId: string;
  propertyId: string;
  ownerId: string;
  message?: string;
}

export interface ReferralQualificationCriteria {
  role: string;
  requiresPayment: boolean;
  requiresVerification: boolean;
  requiresSubscription: boolean;
  minimumDays?: number;
}

export interface ReferralRewardCalculation {
  referrerReward: number;
  referredReward: number;
  rewardType: RewardType;
  currency: string;
}

export interface ReferralTrackingMetrics {
  clicks: number;
  uniqueClicks: number;
  signups: number;
  qualifiedSignups: number;
  conversions: number;
  totalRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
  roi: number;
}

export interface ShareableReferralData {
  referralCode: string;
  referralLink: string;
  whatsappMessage: string;
  emailSubject: string;
  emailBody: string;
  smsMessage: string;
  socialMediaMessage: string;
}

export interface ReferralLeaderboardEntry {
  userId: string;
  userName: string;
  totalReferrals: number;
  qualifiedReferrals: number;
  totalEarnings: number;
  rank: number;
}

export interface ReferralAnalytics {
  period: 'day' | 'week' | 'month' | 'year';
  startDate: Date;
  endDate: Date;
  metrics: ReferralTrackingMetrics;
  topReferrers: ReferralLeaderboardEntry[];
  referralsByType: Record<ReferralType, number>;
  rewardsByType: Record<RewardType, number>;
}

export interface ReferralNotificationData {
  type: 'CLICK' | 'SIGNUP' | 'QUALIFIED' | 'REWARD_EARNED' | 'REWARD_REDEEMED';
  referrerId: string;
  referredId?: string;
  referralCode: string;
  metadata?: Record<string, any>;
}

export interface ReferralPayoutRequest {
  userId: string;
  rewardIds: string[];
  totalAmount: number;
  bankAccountNumber: string;
  bankCode: string;
  accountName: string;
}

export interface ReferralDashboardData {
  stats: ReferralStats;
  recentReferrals: Array<{
    id: string;
    referredName: string;
    status: ReferralStatus;
    referralType: ReferralType;
    createdAt: Date;
  }>;
  pendingRewards: Array<{
    id: string;
    amount: number;
    rewardType: RewardType;
    description: string;
    status: RewardStatus;
  }>;
  earnings: {
    total: number;
    pending: number;
    redeemed: number;
    available: number;
  };
}

export interface ReferralValidationResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface ReferralCodeAvailability {
  code: string;
  isAvailable: boolean;
  suggestedCodes?: string[];
}

// DTOs (Data Transfer Objects)
export interface CreateReferralDTO {
  referrerId: string;
  referredId: string;
  referralCode: string;
  referralType?: ReferralType;
  shareChannel?: string;
}

export interface UpdateReferralStatusDTO {
  referralId: string;
  status: ReferralStatus;
  qualificationMet?: boolean;
  reason?: string;
}

export interface CreateReferralRewardDTO {
  userId: string;
  referralId?: string;
  rewardType: RewardType;
  amount: number;
  description: string;
  expiresAt?: Date;
}

export interface ReferralRedeemRewardDTO {
  rewardId: string;
  userId: string;
  redemptionMethod: 'WALLET' | 'BANK_TRANSFER' | 'CREDIT_BALANCE';
  bankDetails?: {
    accountNumber: string;
    bankCode: string;
    accountName: string;
  };
}

export interface TrackReferralClickDTO {
  referralCode: string;
  ipAddress?: string;
  userAgent?: string;
  referrerUrl?: string;
  landingPage?: string;
}

export interface GenerateReferralLinkDTO {
  userId: string;
  channel: 'WHATSAPP' | 'EMAIL' | 'SMS' | 'SOCIAL' | 'COPY';
  metadata?: Record<string, any>;
}