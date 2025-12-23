// backend/referral-service/src/types/referral.ts

import { 
  Referral, 
  ReferralStatus, 
  ReferralType, 
  Role,
  User 
} from '@newcondo/db';

export interface CreateReferralDTO {
  referrerId: string;
  referralCode?: string;
  referralType?: ReferralType;
}

export interface ReferralWithUsers extends Referral {
  referrer: Pick<User, 'id' | 'name' | 'email' | 'role'>;
  referred: Pick<User, 'id' | 'name' | 'email' | 'role'>;
}

export interface ReferralStatistics {
  totalReferrals: number;
  pendingReferrals: number;
  qualifiedReferrals: number;
  rewardedReferrals: number;
  totalEarnings: number;
  conversionRate: number;
}

export interface ReferralDashboardData {
  referralCode: string;
  referralLink: string;
  shareLinks: {
    whatsapp: string;
    facebook: string;
    twitter: string;
    email: string;
    sms: string;
  };
  statistics: ReferralStatistics;
  recentReferrals: ReferralWithUsers[];
  availableRewards: number;
  pendingRewards: number;
}

export interface ValidateReferralCodeResult {
  isValid: boolean;
  referrer?: {
    id: string;
    name: string | null;
    role: Role;
  };
  error?: string;
}

export interface ReferralEligibilityCheck {
  isEligible: boolean;
  reasons: string[];
  requirements: {
    hasActiveSubscription?: boolean;
    hasCompletedTransaction?: boolean;
    hasCompletedPayment?: boolean;
    isVerified?: boolean;
    accountAge?: number;
  };
}

export interface TrackReferralClickDTO {
  referralCode: string;
  ipAddress?: string;
  userAgent?: string;
  referrerUrl?: string;
  sessionId?: string;
}

export interface QualifyReferralDTO {
  referralId: string;
  qualificationData: {
    paymentId?: string;
    subscriptionId?: string;
    transactionAmount?: number;
  };
}

export interface ReferralFilters {
  status?: ReferralStatus;
  referralType?: ReferralType;
  startDate?: Date;
  endDate?: Date;
  qualificationMet?: boolean;
  rewardPaid?: boolean;
}

export interface ReferralListResponse {
  referrals: ReferralWithUsers[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}