// backend/referral-service/src/types/index.ts

// Re-export all types
export * from './referral';
export * from './reward';
export * from './tracking';

// Common API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ErrorResponse {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// Service response types
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

// Common query parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

// Referral analytics types
export interface ReferralAnalytics {
  overview: {
    totalReferrals: number;
    activeReferrals: number;
    qualifiedReferrals: number;
    totalRewards: number;
    averageConversionTime: number; // in hours
  };
  trends: {
    daily: Array<{ date: string; referrals: number; conversions: number }>;
    weekly: Array<{ week: string; referrals: number; conversions: number }>;
    monthly: Array<{ month: string; referrals: number; conversions: number }>;
  };
  performance: {
    conversionRate: number;
    averageRewardValue: number;
    topPerformers: Array<{
      userId: string;
      userName: string;
      referrals: number;
      earnings: number;
    }>;
  };
  channels: Record<string, {
    clicks: number;
    conversions: number;
    rate: number;
  }>;
}