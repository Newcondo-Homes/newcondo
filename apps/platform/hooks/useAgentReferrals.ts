// apps/platform/hooks/useAgentReferrals.ts
'use client'

import { useQuery } from '@tanstack/react-query';
import { 
  getAgentReferrals,
  getAgentReferralStats,
  getReferralActivity,
} from '@/lib/api/agentReferrals';

import type {
  ReferralPerformanceResponse,
  ReferralDashboard,
  ReferralAnalytics,
} from '@/types/referral'

export interface ReferralFilters {
  propertyId?: string;
  status?: 'ACTIVE' | 'CONVERTED' | 'EXPIRED';
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export const useAgentReferrals = (filters?: ReferralFilters) => {
  const query = useQuery<ReferralPerformanceResponse>({
    queryKey: ['agent-referrals', filters],
    queryFn: () => getAgentReferrals(filters),
    staleTime: 1000 * 60 * 3, // 3 minutes
  });

  return {
    // Data
    referrals: query.data?.properties || [],
    totalCount: query.data?.pagination.totalItems || 0,
    totalPages: query.data?.pagination.totalPages || 0,
    currentPage: query.data?.pagination.currentPage || 1,
    
    // Summary
    // totalViews: query.data?.totalViews || 0,
    // totalConversions: query.data?.totalConversions || 0,
    // totalEarnings: query.data?.totalEarnings || 0,
    // conversionRate: query.data?.conversionRate || 0,
    
    // States
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    
    // Actions
    refetch: query.refetch,
  };
};

// Hook for agent referral statistics
export const useAgentReferralStats = () => {
  const query = useQuery<ReferralDashboard>({
    queryKey: ['agent-referral-stats'],
    queryFn: () => getAgentReferralStats(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    totalReferrals: query.data?.summary.totalReferrals || 0,
    activeReferrals: query.data?.summary.activeReferrals || 0,
    totalClicks: query.data?.summary.totalClicks || 0,
    uniqueClicks: query.data?.summary.uniqueClicks || 0,
    totalConversions: query.data?.summary.totalConversions || 0,
    totalEarnings: query.data?.summary.totalEarnings || '0',
    conversionRate: query.data?.summary.conversionRate || '0',
    recentClicks: query.data?.recentActivity.clicks || [],
    recentConversions: query.data?.recentActivity.conversions || [],
    // Overview stats
    // totalReferralLinks: query.data?.totalReferralLinks || 0,
    // activeReferralLinks: query.data?.activeReferralLinks || 0,
    // totalClicks: query.data?.totalClicks || 0,
    // totalViews: query.data?.totalViews || 0,
    // totalConversions: query.data?.totalConversions || 0,
    
    // Performance metrics
    // overallConversionRate: query.data?.overallConversionRate || 0,
    // avgViewsPerLink: query.data?.avgViewsPerLink || 0,
    // avgEarningsPerConversion: query.data?.avgEarningsPerConversion || 0,
    
    // Earnings
    // totalReferralEarnings: query.data?.totalReferralEarnings || 0,
    // pendingEarnings: query.data?.pendingEarnings || 0,
    // paidEarnings: query.data?.paidEarnings || 0,
    
    // Top performers
    // topProperties: query.data?.topProperties || [],
    // bestConvertingLinks: query.data?.bestConvertingLinks || [],
    
    // Time-based data
    // viewsByDay: query.data?.viewsByDay || [],
    // conversionsByDay: query.data?.conversionsByDay || [],
    // earningsByMonth: query.data?.earningsByMonth || [],
    
    // Trends
    // viewTrend: query.data?.viewTrend || 'stable',
    // conversionTrend: query.data?.conversionTrend || 'stable',
    
    // States
    isLoading: query.isLoading,
    error: query.error,
    
    // Actions
    refetch: query.refetch,
  };
};

// Hook for property-specific referral tracking
export const usePropertyReferrals = (propertyId: string) => {
  return useAgentReferrals({ propertyId, limit: 100 });
};

// Hook for referral activity timeline
export const useReferralActivity = (filters?: {
  limit?: number;
  type?: 'VIEW' | 'CLICK' | 'CONVERSION' | 'ALL';
}) => {
  const query = useQuery<ReferralAnalytics>({
    queryKey: ['referral-activity', filters],
    queryFn: () => getReferralActivity(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 5, // Auto-refresh every 5 minutes
  });

  return {
    // Activity data
    // activities: query.data?.activities || [],
    // hasMore: query.data?.hasMore || false,
    
    // Recent highlights
    // recentViews: query.data?.recentViews || [],
    // recentConversions: query.data?.recentConversions || [],

    clicksOverTime: query.data?.clicksOverTime || [],
    conversionsOverTime: query.data?.conversionsOverTime || [],
    totalClicks: query.data?.summary.totalClicks || 0,
    totalConversions: query.data?.summary.totalConversions || 0,
    totalEarnings: query.data?.summary.totalEarnings || '0',
    conversionRate: query.data?.summary.conversionRate || '0',
    
    // States
    isLoading: query.isLoading,
    error: query.error,
    
    // Actions
    refetch: query.refetch,
  };
};