// apps/platform/hooks/usePropertyAnalytics.ts
'use client'

import { useQuery } from '@tanstack/react-query';
import { getPropertyAnalytics, getPortfolioAnalytics  } from '@/lib/api/propertyAnalytics';
import type { AnalyticsFilters } from '@/types/propertyAnalytics';

export const usePropertyAnalytics = (
  propertyId: string | undefined,
  filters?: Omit<AnalyticsFilters, 'propertyId'>
) => {
  const query = useQuery({
    queryKey: ['property-analytics', propertyId, filters],
    queryFn: () => getPropertyAnalytics(propertyId!, filters),
    enabled: !!propertyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 10, // Refetch every 10 minutes
  });

  return {
    // Data
    analytics: query.data?.analytics,
    viewsData: query.data?.views,
    favoritesData: query.data?.favorites,
    sharesData: query.data?.shares,
    conversionRate: query.data?.conversionRate,
    
    // Summary metrics
    totalViews: query.data?.analytics?.totalViews || 0,
    totalFavorites: query.data?.analytics?.totalFavorites || 0,
    totalShares: query.data?.analytics?.totalShares || 0,
    totalInquiries: query.data?.analytics?.totalInquiries || 0,
    avgViewDuration: query.data?.analytics?.avgViewDuration || 0,
    
    // Trends
    viewTrend: query.data?.trends?.views || 'stable',
    favoriteTrend: query.data?.trends?.favorites || 'stable',
    
    // Comparison data
    comparisonData: query.data?.comparison,
    
    // States
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    
    // Actions
    refetch: query.refetch,
  };
};

// Hook for portfolio-wide analytics
export const usePortfolioAnalytics = (filters?: AnalyticsFilters) => {
  const query = useQuery({
    queryKey: ['portfolio-analytics', filters],
    queryFn: () => getPortfolioAnalytics(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    // Data
    portfolioStats: query.data?.portfolioStats,
    topPerformingProperties: query.data?.topPerformers || [],
    underPerformingProperties: query.data?.underPerformers || [],
    totalViews: query.data?.totalViews || 0,
    totalProperties: query.data?.totalProperties || 0,
    avgViewsPerProperty: query.data?.avgViewsPerProperty || 0,
    
    // States
    isLoading: query.isLoading,
    error: query.error,
    
    // Actions
    refetch: query.refetch,
  };
};