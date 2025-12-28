// apps/platform/hooks/useReferralTracking.ts

import { useQuery } from '@tanstack/react-query';
import * as trackingApi from '@/lib/api/referralTracking';

export function useClickStats(params?: {
  period?: 'day' | 'week' | 'month' | 'year';
  startDate?: string;
  endDate?: string;
}) {
  const {
    data: stats,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['click-stats', params],
    queryFn: () => trackingApi.getClickStats(params),
    staleTime: 5 * 60 * 1000,
  });

  return {
    stats,
    isLoading,
    error,
    refetch,
  };
}

export function useConversionFunnel() {
  const {
    data: funnel,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['conversion-funnel'],
    queryFn: trackingApi.getConversionFunnel,
    staleTime: 10 * 60 * 1000,
  });

  return {
    funnel,
    isLoading,
    error,
  };
}

export function useChannelPerformance() {
  const {
    data: channels,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['channel-performance'],
    queryFn: trackingApi.getChannelPerformance,
    staleTime: 10 * 60 * 1000,
  });

  return {
    channels: channels ?? [],
    isLoading,
    error,
  };
}

export function useGeographicDistribution() {
  const {
    data: distribution,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['geographic-distribution'],
    queryFn: trackingApi.getGeographicDistribution,
    staleTime: 15 * 60 * 1000,
  });

  return {
    distribution: distribution ?? [],
    isLoading,
    error,
  };
}

export function useDeviceStats() {
  const {
    data: stats,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['device-stats'],
    queryFn: trackingApi.getDeviceStats,
    staleTime: 15 * 60 * 1000,
  });

  return {
    stats,
    isLoading,
    error,
  };
}

export function useActivityPattern() {
  const {
    data: pattern,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['activity-pattern'],
    queryFn: trackingApi.getActivityPattern,
    staleTime: 15 * 60 * 1000,
  });

  return {
    pattern,
    isLoading,
    error,
  };
}
