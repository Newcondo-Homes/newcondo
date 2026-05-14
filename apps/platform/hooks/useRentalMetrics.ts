// apps/platform/hooks/useRentalMetrics.ts
'use client'

import { useQuery } from '@tanstack/react-query';
import { getRentalMetrics, RentalMetrics } from '@/lib/api/rentalHistory';
// import type { RentalMetricsFilters as ApiRentalMetricsFilters } from '@/lib/api/rentalHistory';

export interface RentalMetricsFilters {
  propertyId?: string;
  startDate?: Date;
  endDate?: Date;
  period?: 'month' | 'quarter' | 'year' | 'all';
}

export const useRentalMetrics = (
  propertyId?: string,
  filters?: Omit<RentalMetricsFilters, 'propertyId'>
) => {
  const query = useQuery<RentalMetrics>({
    queryKey: ['rental-metrics', propertyId, filters],
    queryFn: () => getRentalMetrics(propertyId, filters),
    enabled: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    // Financial metrics
    totalRevenue: query.data?.totalRevenue || 0,
    expectedRevenue: query.data?.expectedRevenue || 0,
    averageRent: query.data?.averageRent || 0,
    occupancyRate: query.data?.occupancyRate || 0,
    
    // Rental statistics
    totalRentals: query.data?.totalRentals || 0,
    activeRentals: query.data?.activeRentals || 0,
    completedRentals: query.data?.completedRentals || 0,
    cancelledRentals: query.data?.cancelledRentals || 0,
    
    // Performance metrics
    avgRentalDuration: query.data?.avgRentalDuration || 0,
    renewalRate: query.data?.renewalRate || 0,
    vacancyRate: query.data?.vacancyRate || 0,
    avgDaysToRent: query.data?.avgDaysToRent || 0,
    
    // Trends
    revenueByMonth: query.data?.revenueByMonth || [],
    rentalsByMonth: query.data?.rentalsByMonth || [],
    occupancyTrend: query.data?.occupancyTrend || 'stable',
    
    // Forecasting
    projectedRevenue: query.data?.projectedRevenue || 0,
    projectedOccupancy: query.data?.projectedOccupancy || 0,
    
    // States
    isLoading: query.isLoading,
    error: query.error,
    
    // Actions
    refetch: query.refetch,
  };
};

// Hook for portfolio-wide rental metrics
export const usePortfolioRentalMetrics = (filters?: Omit<RentalMetricsFilters, 'propertyId'>) => {
  return useRentalMetrics(undefined, filters);
};

// Hook for comparing property performance
export const usePropertyComparison = (propertyIds: string[], filters?: RentalMetricsFilters) => {
  const query = useQuery<RentalMetrics[]>({
    queryKey: ['property-comparison', propertyIds, filters],
    queryFn: async () => {
      // Fetch metrics for each property and compare
      const metricsPromises = propertyIds.map(id =>
        getRentalMetrics(id, filters)
      );
      return Promise.all(metricsPromises);
    },
    enabled: propertyIds.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  return {
    comparisons: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};