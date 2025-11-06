import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRevenueStore } from '@/store/revenueStore';
import {
  getRevenueOverview,
  getRevenueBreakdown,
  getRevenueBySource,
  getRevenueForecasts,
  getCommissionBreakdown,
  getPaymentDistribution,
  exportRevenueReport,
} from '@/lib/api/revenue';
import type { DateRange, RevenueFilters } from '@/types/revenue';
import { toast } from 'sonner';

export function useRevenue(dateRange: DateRange, filters?: RevenueFilters) {
  const { setRevenue, setLoading, setError } = useRevenueStore();

  // Revenue overview
  const overviewQuery = useQuery({
    queryKey: ['revenue', 'overview', dateRange, filters],
    queryFn: () => getRevenueOverview(dateRange, filters),
    onSuccess: (data) => {
      setRevenue('overview', data);
      setLoading(false);
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Failed to fetch revenue overview');
      setLoading(false);
    },
  });

  // Revenue breakdown by category
  const breakdownQuery = useQuery({
    queryKey: ['revenue', 'breakdown', dateRange, filters],
    queryFn: () => getRevenueBreakdown(dateRange, filters),
  });

  // Revenue by source
  const sourceQuery = useQuery({
    queryKey: ['revenue', 'source', dateRange, filters],
    queryFn: () => getRevenueBySource(dateRange, filters),
  });

  // Revenue forecasts
  const forecastsQuery = useQuery({
    queryKey: ['revenue', 'forecasts', dateRange],
    queryFn: () => getRevenueForecasts(dateRange),
    staleTime: 3600000, // 1 hour
  });

  // Commission breakdown
  const commissionQuery = useQuery({
    queryKey: ['revenue', 'commission', dateRange, filters],
    queryFn: () => getCommissionBreakdown(dateRange, filters),
  });

  // Payment distribution
  const distributionQuery = useQuery({
    queryKey: ['revenue', 'distribution', dateRange, filters],
    queryFn: () => getPaymentDistribution(dateRange, filters),
  });

  return {
    overview: overviewQuery.data,
    breakdown: breakdownQuery.data,
    bySource: sourceQuery.data,
    forecasts: forecastsQuery.data,
    commission: commissionQuery.data,
    distribution: distributionQuery.data,
    isLoading: overviewQuery.isLoading || breakdownQuery.isLoading,
    isError: overviewQuery.isError,
    refetch: () => {
      overviewQuery.refetch();
      breakdownQuery.refetch();
      sourceQuery.refetch();
      forecastsQuery.refetch();
      commissionQuery.refetch();
      distributionQuery.refetch();
    },
  };
}

export function useRevenueExport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dateRange, format }: { dateRange: DateRange; format: 'csv' | 'pdf' | 'excel' }) =>
      exportRevenueReport(dateRange, format),
    onSuccess: (data, variables) => {
      toast.success(`Revenue report exported as ${variables.format.toUpperCase()}`);
      
      // Trigger download
      const blob = new Blob([data], {
        type: variables.format === 'pdf' ? 'application/pdf' : 'text/csv',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `revenue-report-${Date.now()}.${variables.format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to export revenue report');
    },
  });
}

export function useRevenueComparison(dateRange: DateRange) {
  return useQuery({
    queryKey: ['revenue', 'comparison', dateRange],
    queryFn: async () => {
      const duration = dateRange.endDate.getTime() - dateRange.startDate.getTime();
      const previousDateRange = {
        startDate: new Date(dateRange.startDate.getTime() - duration),
        endDate: dateRange.startDate,
      };

      const [current, previous] = await Promise.all([
        getRevenueOverview(dateRange),
        getRevenueOverview(previousDateRange),
      ]);

      return {
        current,
        previous,
        totalChange: ((current.total - previous.total) / previous.total) * 100,
        rentChange: ((current.rentRevenue - previous.rentRevenue) / previous.rentRevenue) * 100,
        commissionChange:
          ((current.commissionRevenue - previous.commissionRevenue) / previous.commissionRevenue) * 100,
        markingChange:
          ((current.markingRevenue - previous.markingRevenue) / previous.markingRevenue) * 100,
      };
    },
  });
}

export function useTopRevenueProperties(dateRange: DateRange, limit: number = 10) {
  return useQuery({
    queryKey: ['revenue', 'top-properties', dateRange, limit],
    queryFn: () => getRevenueBySource(dateRange, { limit }),
  });
}