// apps/platform/hooks/useReferralAnalytics.ts
'use client'

import { useQuery } from '@tanstack/react-query';
import * as analyticsApi from '@/lib/api/referralAnalytics';
import { ReferralAnalytics } from '@/types/referral';

export function useAnalyticsOverview(params: {
  period: 'day' | 'week' | 'month' | 'year';
  startDate?: string;
  endDate?: string;
}) {
  const {
    data: analytics,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['analytics-overview', params],
    queryFn: () => analyticsApi.getAnalyticsOverview(params),
    staleTime: 5 * 60 * 1000,
  });

  return {
    analytics,
    isLoading,
    error,
    refetch,
  };
}

export function usePerformanceMetrics() {
  const {
    data: metrics,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['performance-metrics'],
    queryFn: analyticsApi.getPerformanceMetrics,
    staleTime: 5 * 60 * 1000,
  });

  return {
    metrics,
    isLoading,
    error,
  };
}

export function useReferralTypeBreakdown() {
  const {
    data: breakdown,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['referral-type-breakdown'],
    queryFn: analyticsApi.getReferralTypeBreakdown,
    staleTime: 10 * 60 * 1000,
  });

  return {
    breakdown: breakdown ?? [],
    isLoading,
    error,
  };
}

export function useRewardDistribution() {
  const {
    data: distribution,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['reward-distribution'],
    queryFn: analyticsApi.getRewardDistribution,
    staleTime: 10 * 60 * 1000,
  });

  return {
    distribution,
    isLoading,
    error,
  };
}

export function useTimeSeriesData(params: {
  metric: 'referrals' | 'conversions' | 'earnings';
  period: 'day' | 'week' | 'month';
  duration: number;
}) {
  const {
    data: timeSeries,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['time-series', params],
    queryFn: () => analyticsApi.getTimeSeriesData(params),
    staleTime: 5 * 60 * 1000,
  });

  return {
    timeSeries: timeSeries ?? [],
    isLoading,
    error,
  };
}

export function useCohortAnalysis() {
  const {
    data: cohorts,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['cohort-analysis'],
    queryFn: analyticsApi.getCohortAnalysis,
    staleTime: 15 * 60 * 1000,
  });

  return {
    cohorts: cohorts ?? [],
    isLoading,
    error,
  };
}

export function useUserRanking() {
  const {
    data: ranking,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['user-ranking'],
    queryFn: analyticsApi.getUserRanking,
    staleTime: 10 * 60 * 1000,
  });

  return {
    ranking,
    isLoading,
    error,
  };
}

export function useComparisonData(params: {
  metric: 'referrals' | 'earnings' | 'conversion_rate';
  compareWith: 'average' | 'top_10' | 'top_25';
}) {
  const {
    data: comparison,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['comparison-data', params],
    queryFn: () => analyticsApi.getComparisonData(params),
    staleTime: 10 * 60 * 1000,
  });

  return {
    comparison,
    isLoading,
    error,
  };
}

export function useTopReferrals(limit = 10) {
  const {
    data: topReferrals,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['top-referrals', limit],
    queryFn: () => analyticsApi.getTopReferrals(limit),
    staleTime: 10 * 60 * 1000,
  });

  return {
    topReferrals: topReferrals ?? [],
    isLoading,
    error,
  };
}

export function useSourcesAnalysis() {
  const {
    data: sources,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['sources-analysis'],
    queryFn: analyticsApi.getSourcesAnalysis,
    staleTime: 15 * 60 * 1000,
  });

  return {
    sources: sources ?? [],
    isLoading,
    error,
  };
}

export function usePredictiveInsights() {
  const {
    data: insights,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['predictive-insights'],
    queryFn: analyticsApi.getPredictiveInsights,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  return {
    insights,
    isLoading,
    error,
  };
}

export function useExportAnalytics() {
  const exportData = async (params: {
    format: 'csv' | 'json' | 'xlsx';
    startDate?: string;
    endDate?: string;
  }) => {
    try {
      const blob = await analyticsApi.exportAnalyticsData(params);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `referral-analytics-${Date.now()}.${params.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('Export failed:', error);
      return false;
    }
  };

  return { exportData };
}