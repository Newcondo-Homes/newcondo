import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSystemHealthStore } from '@/store/systemHealthStore';
import {
  getSystemHealth,
  getServiceStatus,
  getDatabaseMetrics,
  getAPIMetrics,
  getErrorLogs,
  getPerformanceMetrics,
  clearCache,
  restartService,
  runHealthCheck,
} from '@/lib/api/systemHealth';
import type { DateRange } from '@/types/system';
import { toast } from 'sonner';

export function useSystemHealth() {
  const { setHealthStatus, setLoading, setError } = useSystemHealthStore();

  const healthQuery = useQuery({
    queryKey: ['system', 'health'],
    queryFn: getSystemHealth,
    refetchInterval: 30000, // Refresh every 30 seconds
    onSuccess: (data) => {
      setHealthStatus(data);
      setLoading(false);
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Failed to fetch system health');
      setLoading(false);
    },
  });

  const servicesQuery = useQuery({
    queryKey: ['system', 'services'],
    queryFn: getServiceStatus,
    refetchInterval: 30000,
  });

  const databaseQuery = useQuery({
    queryKey: ['system', 'database'],
    queryFn: getDatabaseMetrics,
    refetchInterval: 60000, // Refresh every minute
  });

  const apiQuery = useQuery({
    queryKey: ['system', 'api'],
    queryFn: getAPIMetrics,
    refetchInterval: 30000,
  });

  return {
    health: healthQuery.data,
    services: servicesQuery.data,
    database: databaseQuery.data,
    api: apiQuery.data,
    isLoading: healthQuery.isLoading,
    isError: healthQuery.isError,
    refetch: () => {
      healthQuery.refetch();
      servicesQuery.refetch();
      databaseQuery.refetch();
      apiQuery.refetch();
    },
  };
}

export function useServiceStatus(serviceName?: string) {
  return useQuery({
    queryKey: ['system', 'service', serviceName],
    queryFn: () => getServiceStatus(serviceName),
    enabled: !!serviceName,
    refetchInterval: 30000,
  });
}

export function useErrorLogs(dateRange?: DateRange, severity?: string) {
  return useQuery({
    queryKey: ['system', 'errors', dateRange, severity],
    queryFn: () => getErrorLogs(dateRange, severity),
  });
}

export function usePerformanceMetrics(dateRange?: DateRange) {
  return useQuery({
    queryKey: ['system', 'performance', dateRange],
    queryFn: () => getPerformanceMetrics(dateRange),
  });
}

export function useClearCache() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cacheKey?: string) => clearCache(cacheKey),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['system']);
      toast.success(data.message || 'Cache cleared successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to clear cache');
    },
  });
}

export function useRestartService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (serviceName: string) => restartService(serviceName),
    onSuccess: (data, serviceName) => {
      queryClient.invalidateQueries(['system', 'service', serviceName]);
      queryClient.invalidateQueries(['system', 'services']);
      toast.success(`Service ${serviceName} restarted successfully`);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to restart service');
    },
  });
}

export function useRunHealthCheck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: runHealthCheck,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['system']);
      toast.success('Health check completed');
      return data;
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Health check failed');
    },
  });
}

// Real-time system monitoring
export function useSystemMonitoring() {
  const healthQuery = useQuery({
    queryKey: ['system', 'monitoring'],
    queryFn: async () => {
      const [health, services, database, api] = await Promise.all([
        getSystemHealth(),
        getServiceStatus(),
        getDatabaseMetrics(),
        getAPIMetrics(),
      ]);

      return {
        health,
        services,
        database,
        api,
        timestamp: new Date(),
      };
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  return {
    data: healthQuery.data,
    isLoading: healthQuery.isLoading,
    isError: healthQuery.isError,
  };
}

// Service uptime tracking
export function useServiceUptime(serviceName: string, dateRange?: DateRange) {
  return useQuery({
    queryKey: ['system', 'uptime', serviceName, dateRange],
    queryFn: async () => {
      const metrics = await getPerformanceMetrics(dateRange);
      
      return metrics.services?.find((s: any) => s.name === serviceName)?.uptime || 0;
    },
    enabled: !!serviceName,
  });
}

// Critical alerts
export function useCriticalAlerts() {
  return useQuery({
    queryKey: ['system', 'critical-alerts'],
    queryFn: async () => {
      const errors = await getErrorLogs(undefined, 'CRITICAL');
      
      return errors.filter((error: any) => !error.resolved);
    },
    refetchInterval: 15000, // Refresh every 15 seconds
  });
}