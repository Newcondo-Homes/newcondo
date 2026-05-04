// apps/platform/hooks/useEarnings.ts
'use client'

import { useQuery } from '@tanstack/react-query';
import { getEarnings, getEarningsBreakdown } from '@/lib/api/earnings';

export interface EarningsFilters {
  startDate?: Date;
  endDate?: Date;
  period?: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'all';
  groupBy?: 'day' | 'week' | 'month' | 'property' | 'type';
}

export const useEarnings = (filters?: EarningsFilters) => {
  const query = useQuery({
    queryKey: ['earnings', filters],
    queryFn: () => getEarnings(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    // Total earnings
    totalEarnings: query.data?.totalEarnings || 0,
    totalCommissions: query.data?.totalCommissions || 0,
    totalMarkingFees: query.data?.totalMarkingFees || 0,
    totalReferralRewards: query.data?.totalReferralRewards || 0,
    
    // Available vs pending
    availableAmount: query.data?.availableAmount || 0,
    pendingAmount: query.data?.pendingAmount || 0,
    lockedAmount: query.data?.lockedAmount || 0,
    
    // Time-series data
    earningsByPeriod: query.data?.earningsByPeriod || [],
    
    // Top earners
    topEarningProperties: query.data?.topEarningProperties || [],
    topEarningPeriods: query.data?.topEarningPeriods || [],
    
    // Growth metrics
    growthRate: query.data?.growthRate || 0,
    monthOverMonth: query.data?.monthOverMonth || 0,
    yearOverYear: query.data?.yearOverYear || 0,
    
    // States
    isLoading: query.isLoading,
    error: query.error,
    
    // Actions
    refetch: query.refetch,
  };
};

// Hook for detailed earnings breakdown
export const useEarningsBreakdown = (filters?: EarningsFilters) => {
  const query = useQuery({
    queryKey: ['earnings-breakdown', filters],
    queryFn: () => getEarningsBreakdown(filters),
    staleTime: 1000 * 60 * 5,
  });

  return {
    // Breakdown by source
    bySource: query.data?.bySource || {
      listingCommissions: 0,
      subAgentCommissions: 0,
      markingFees: 0,
      referralRewards: 0,
    },
    
    // Breakdown by property
    byProperty: query.data?.byProperty || [],
    
    // Breakdown by month
    byMonth: query.data?.byMonth || [],
    
    // Breakdown by status
    byStatus: query.data?.byStatus || {
      pending: 0,
      released: 0,
      withdrawn: 0,
    },
    
    // Percentage distributions
    sourceDistribution: query.data?.sourceDistribution || [],
    
    // States
    isLoading: query.isLoading,
    error: query.error,
    
    // Actions
    refetch: query.refetch,
  };
};

// Hook for earnings forecast
export const useEarningsForecast = () => {
  const query = useQuery({
    queryKey: ['earnings-forecast'],
    queryFn: () => getEarnings({ period: 'all' }),
    staleTime: 1000 * 60 * 10,
    select: (data) => {
      // Calculate forecast based on historical data
      const monthlyAvg = data.totalEarnings / 12;
      const trend = data.growthRate || 0;
      
      return {
        nextMonthForecast: monthlyAvg * (1 + trend / 100),
        nextQuarterForecast: monthlyAvg * 3 * (1 + trend / 100),
        nextYearForecast: monthlyAvg * 12 * (1 + trend / 100),
        confidence: data.totalEarnings > 0 ? 'high' : 'low',
      };
    },
  });

  return {
    forecast: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
};