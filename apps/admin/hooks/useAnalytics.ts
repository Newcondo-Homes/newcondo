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