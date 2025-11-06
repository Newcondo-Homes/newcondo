// apps/admin/src/hooks/useAnalytics.ts

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api/analytics';
import { useAnalyticsStore } from '@/store/analyticsStore';

interface DateRange {
  startDate: string;
  endDate: string;
}

interface DashboardMetrics {
  users: {
    total: number;
    newThisMonth: number;
    verified: number;
    pending: number;
    growthRate: number;
  };
  properties: {
    total: number;
    published: number;
    pending: number;
    rented: number;
    listingRate: number;
  };
  payments: {
    totalRevenue: number;
    monthlyRevenue: number;
    successfulTransactions: number;
    failedTransactions: number;
    averageTransactionValue: number;
  };
  markingJobs: {
    total: number;
    completed: number;
    inProgress: number;
    queued: number;
    completionRate: number;
  };
  support: {
    totalTickets: number;
    openTickets: number;
    resolvedTickets: number;
    averageResolutionTime: number;
  };
}

export const useAnalytics = (dateRange?: DateRange) => {
  const queryClient = useQueryClient();
  const { setMetrics } = useAnalyticsStore();
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch dashboard metrics
   */
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    refetch: refetchDashboard
  } = useQuery({
    queryKey: ['analytics', 'dashboard', dateRange],
    queryFn: () => analyticsApi.getDashboardMetrics(dateRange),
    staleTime: 60000, // 1 minute
  });

  /**
   * Fetch user analytics
   */
  const useUserAnalytics = (filters?: any) => {
    return useQuery({
      queryKey: ['analytics', 'users', filters],
      queryFn: () => analyticsApi.getUserAnalytics(filters),
      staleTime: 120000, // 2 minutes
    });
  };

  /**
   * Fetch revenue analytics
   */
  const useRevenueAnalytics = (filters?: any) => {
    return useQuery({
      queryKey: ['analytics', 'revenue', filters],
      queryFn: () => analyticsApi.getRevenueAnalytics(filters),
      staleTime: 120000,
    });
  };

  /**
   * Fetch property analytics
   */
  const usePropertyAnalytics = (filters?: any) => {
    return useQuery({
      queryKey: ['analytics', 'properties', filters],
      queryFn: () => analyticsApi.getPropertyAnalytics(filters),
      staleTime: 120000,
    });
  };

  /**
   * Fetch agent performance analytics
   */
  const useAgentPerformance = (filters?: any) => {
    return useQuery({
      queryKey: ['analytics', 'agents', filters],
      queryFn: () => analyticsApi.getAgentPerformance(filters),
      staleTime: 120000,
    });
  };

  /**
   * Fetch geographic distribution
   */
  const useGeographicDistribution = () => {
    return useQuery({
      queryKey: ['analytics', 'geographic'],
      queryFn: () => analyticsApi.getGeographicDistribution(),
      staleTime: 300000, // 5 minutes
    });
  };

  /**
   * Fetch conversion funnel
   */
  const useConversionFunnel = (dateRange?: DateRange) => {
    return useQuery({
      queryKey: ['analytics', 'conversion', dateRange],
      queryFn: () => analyticsApi.getConversionFunnel(dateRange),
      staleTime: 120000,
    });
  };

  /**
   * Fetch retention metrics
   */
  const useRetentionMetrics = (dateRange?: DateRange) => {
    return useQuery({
      queryKey: ['analytics', 'retention', dateRange],
      queryFn: () => analyticsApi.getRetentionMetrics(dateRange),
      staleTime: 120000,
    });
  };

  /**
   * Get real-time statistics
   */
  const getRealTimeStats = useCallback(async () => {
    try {
      const response = await analyticsApi.getRealTimeStats();
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch real-time stats');
      return null;
    }
  }, []);

  /**
   * Export analytics report
   */
  const exportReport = useCallback(async (
    reportType: 'USERS' | 'REVENUE' | 'PROPERTIES' | 'AGENTS' | 'COMPREHENSIVE',
    dateRange: DateRange,
    format: 'CSV' | 'EXCEL' | 'PDF' = 'PDF'
  ) => {
    setError(null);
    try {
      const blob = await analyticsApi.exportReport(reportType, dateRange, format);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportType.toLowerCase()}-report-${dateRange.startDate}-${dateRange.endDate}.${format.toLowerCase()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to export report';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  /**
   * Schedule report
   */
  const scheduleReport = useCallback(async (
    reportConfig: {
      reportType: string;
      frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
      recipients: string[];
      format: 'CSV' | 'EXCEL' | 'PDF';
    }
  ) => {
    setError(null);
    try {
      const response = await analyticsApi.scheduleReport(reportConfig);
      return response;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to schedule report';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  /**
   * Get dashboard metrics with calculated insights
   */
  const getDashboardMetrics = useCallback((): DashboardMetrics | null => {
    if (!dashboardData?.data) return null;
    
    const data = dashboardData.data;
    
    return {
      users: {
        total: data.users?.total || 0,
        newThisMonth: data.users?.newThisMonth || 0,
        verified: data.users?.verified || 0,
        pending: data.users?.pending || 0,
        growthRate: data.users?.growthRate || 0
      },
      properties: {
        total: data.properties?.total || 0,
        published: data.properties?.published || 0,
        pending: data.properties?.pending || 0,
        rented: data.properties?.rented || 0,
        listingRate: data.properties?.listingRate || 0
      },
      payments: {
        totalRevenue: data.payments?.totalRevenue || 0,
        monthlyRevenue: data.payments?.monthlyRevenue || 0,
        successfulTransactions: data.payments?.successfulTransactions || 0,
        failedTransactions: data.payments?.failedTransactions || 0,
        averageTransactionValue: data.payments?.averageTransactionValue || 0
      },
      markingJobs: {
        total: data.markingJobs?.total || 0,
        completed: data.markingJobs?.completed || 0,
        inProgress: data.markingJobs?.inProgress || 0,
        queued: data.markingJobs?.queued || 0,
        completionRate: data.markingJobs?.completionRate || 0
      },
      support: {
        totalTickets: data.support?.totalTickets || 0,
        openTickets: data.support?.openTickets || 0,
        resolvedTickets: data.support?.resolvedTickets || 0,
        averageResolutionTime: data.support?.averageResolutionTime || 0
      }
    };
  }, [dashboardData]);

  /**
   * Refresh all analytics
   */
  const refreshAllAnalytics = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
  }, [queryClient]);

  return {
    // Dashboard metrics
    dashboardMetrics: getDashboardMetrics(),
    isDashboardLoading,
    
    // Additional analytics hooks
    useUserAnalytics,
    useRevenueAnalytics,
    usePropertyAnalytics,
    useAgentPerformance,
    useGeographicDistribution,
    useConversionFunnel,
    useRetentionMetrics,
    
    // Actions
    getRealTimeStats,
    exportReport,
    scheduleReport,
    refreshAllAnalytics,
    refetchDashboard,
    
    // State
    error,
    clearError: () => setError(null)
  };
};
















// import { useQuery } from '@tanstack/react-query';
// import { useAnalyticsStore } from '@/store/analyticsStore';
// import {
//   getOverviewMetrics,
//   getUserAnalytics,
//   getPropertyAnalytics,
//   getRevenueAnalytics,
//   getTrafficAnalytics,
//   getConversionMetrics,
//   getGeographicDistribution,
//   getTimeSeriesData,
// } from '@/lib/api/analytics';
// import type { DateRange } from '@/types/analytics';

// export function useAnalytics(dateRange: DateRange) {
//   const { setMetrics, setLoading, setError } = useAnalyticsStore();

//   // Overview metrics
//   const overviewQuery = useQuery({
//     queryKey: ['analytics', 'overview', dateRange],
//     queryFn: () => getOverviewMetrics(dateRange),
//     onSuccess: (data) => {
//       setMetrics('overview', data);
//       setLoading(false);
//     },
//     onError: (error) => {
//       setError(error instanceof Error ? error.message : 'Failed to fetch overview metrics');
//       setLoading(false);
//     },
//   });

//   // User analytics
//   const userAnalyticsQuery = useQuery({
//     queryKey: ['analytics', 'users', dateRange],
//     queryFn: () => getUserAnalytics(dateRange),
//     onSuccess: (data) => {
//       setMetrics('users', data);
//     },
//     onError: (error) => {
//       setError(error instanceof Error ? error.message : 'Failed to fetch user analytics');
//     },
//   });

//   // Property analytics
//   const propertyAnalyticsQuery = useQuery({
//     queryKey: ['analytics', 'properties', dateRange],
//     queryFn: () => getPropertyAnalytics(dateRange),
//     onSuccess: (data) => {
//       setMetrics('properties', data);
//     },
//   });

//   // Revenue analytics
//   const revenueAnalyticsQuery = useQuery({
//     queryKey: ['analytics', 'revenue', dateRange],
//     queryFn: () => getRevenueAnalytics(dateRange),
//     onSuccess: (data) => {
//       setMetrics('revenue', data);
//     },
//   });

//   // Traffic analytics
//   const trafficAnalyticsQuery = useQuery({
//     queryKey: ['analytics', 'traffic', dateRange],
//     queryFn: () => getTrafficAnalytics(dateRange),
//   });

//   // Conversion metrics
//   const conversionMetricsQuery = useQuery({
//     queryKey: ['analytics', 'conversions', dateRange],
//     queryFn: () => getConversionMetrics(dateRange),
//   });

//   // Geographic distribution
//   const geographicQuery = useQuery({
//     queryKey: ['analytics', 'geographic', dateRange],
//     queryFn: () => getGeographicDistribution(dateRange),
//   });

//   // Time series data
//   const timeSeriesQuery = useQuery({
//     queryKey: ['analytics', 'timeseries', dateRange],
//     queryFn: () => getTimeSeriesData(dateRange),
//   });

//   return {
//     overview: overviewQuery.data,
//     userAnalytics: userAnalyticsQuery.data,
//     propertyAnalytics: propertyAnalyticsQuery.data,
//     revenueAnalytics: revenueAnalyticsQuery.data,
//     trafficAnalytics: trafficAnalyticsQuery.data,
//     conversionMetrics: conversionMetricsQuery.data,
//     geographic: geographicQuery.data,
//     timeSeries: timeSeriesQuery.data,
//     isLoading:
//       overviewQuery.isLoading ||
//       userAnalyticsQuery.isLoading ||
//       propertyAnalyticsQuery.isLoading ||
//       revenueAnalyticsQuery.isLoading,
//     isError:
//       overviewQuery.isError ||
//       userAnalyticsQuery.isError ||
//       propertyAnalyticsQuery.isError ||
//       revenueAnalyticsQuery.isError,
//     refetch: () => {
//       overviewQuery.refetch();
//       userAnalyticsQuery.refetch();
//       propertyAnalyticsQuery.refetch();
//       revenueAnalyticsQuery.refetch();
//       trafficAnalyticsQuery.refetch();
//       conversionMetricsQuery.refetch();
//       geographicQuery.refetch();
//       timeSeriesQuery.refetch();
//     },
//   };
// }

// export function useMetricComparison(metric: string, dateRange: DateRange) {
//   return useQuery({
//     queryKey: ['analytics', 'comparison', metric, dateRange],
//     queryFn: async () => {
//       // Calculate previous period for comparison
//       const duration = dateRange.endDate.getTime() - dateRange.startDate.getTime();
//       const previousDateRange = {
//         startDate: new Date(dateRange.startDate.getTime() - duration),
//         endDate: dateRange.startDate,
//       };

//       const [current, previous] = await Promise.all([
//         getOverviewMetrics(dateRange),
//         getOverviewMetrics(previousDateRange),
//       ]);

//       return {
//         current: current[metric],
//         previous: previous[metric],
//         change: ((current[metric] - previous[metric]) / previous[metric]) * 100,
//         trend: current[metric] > previous[metric] ? 'up' : 'down',
//       };
//     },
//   });
// }

// export function useRealTimeAnalytics() {
//   return useQuery({
//     queryKey: ['analytics', 'realtime'],
//     queryFn: () => getOverviewMetrics({ 
//       startDate: new Date(Date.now() - 3600000), // Last hour
//       endDate: new Date() 
//     }),
//     refetchInterval: 30000, // Refresh every 30 seconds
//   });
// }