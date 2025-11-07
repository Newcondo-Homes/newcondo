import { apiClient } from './client';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'down';
  uptime: number;
  responseTime: number;
  errorRate: number;
  timestamp: Date;
  services: ServiceStatus[];
  database: DatabaseMetrics;
  api: APIMetrics;
  alerts: Alert[];
}

export interface ServiceStatus {
  name: string;
  status: 'running' | 'degraded' | 'down';
  uptime: number;
  responseTime: number;
  lastCheck: Date;
  url?: string;
  version?: string;
  memory?: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu?: {
    usage: number;
    cores: number;
  };
}

export interface DatabaseMetrics {
  status: 'healthy' | 'degraded' | 'down';
  connections: {
    active: number;
    idle: number;
    total: number;
    max: number;
  };
  queryPerformance: {
    averageTime: number;
    slowQueries: number;
    failedQueries: number;
  };
  storage: {
    used: number;
    total: number;
    percentage: number;
  };
  replication: {
    status: string;
    lag: number;
  };
}

export interface APIMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  byEndpoint: Array<{
    endpoint: string;
    requests: number;
    averageTime: number;
    errors: number;
  }>;
  byStatusCode: Array<{
    code: number;
    count: number;
  }>;
}

export interface ErrorLog {
  id: string;
  timestamp: Date;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  service: string;
  message: string;
  stack?: string;
  metadata?: any;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface PerformanceMetrics {
  cpu: {
    usage: number;
    trend: Array<{ timestamp: Date; value: number }>;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
    trend: Array<{ timestamp: Date; value: number }>;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    requestsPerSecond: number;
  };
  services?: Array<{
    name: string;
    uptime: number;
    memory: number;
    cpu: number;
  }>;
}

export interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  service: string;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

// Get system health
export async function getSystemHealth(): Promise<SystemHealth> {
  const response = await apiClient.get('/admin/system/health');
  return response.data;
}

// Get service status
export async function getServiceStatus(serviceName?: string): Promise<ServiceStatus | ServiceStatus[]> {
  const response = await apiClient.get('/admin/system/services', {
    params: serviceName ? { service: serviceName } : undefined,
  });
  return response.data;
}

// Get database metrics
export async function getDatabaseMetrics(): Promise<DatabaseMetrics> {
  const response = await apiClient.get('/admin/system/database');
  return response.data;
}

// Get API metrics
export async function getAPIMetrics(): Promise<APIMetrics> {
  const response = await apiClient.get('/admin/system/api-metrics');
  return response.data;
}

// Get error logs
export async function getErrorLogs(
  dateRange?: DateRange,
  severity?: string
): Promise<ErrorLog[]> {
  const response = await apiClient.get('/admin/system/errors', {
    params: {
      startDate: dateRange?.startDate.toISOString(),
      endDate: dateRange?.endDate.toISOString(),
      severity,
    },
  });
  return response.data;
}

// Get performance metrics
export async function getPerformanceMetrics(dateRange?: DateRange): Promise<PerformanceMetrics> {
  const response = await apiClient.get('/admin/system/performance', {
    params: {
      startDate: dateRange?.startDate.toISOString(),
      endDate: dateRange?.endDate.toISOString(),
    },
  });
  return response.data;
}

// Clear cache
export async function clearCache(cacheKey?: string): Promise<{ message: string; cleared: number }> {
  const response = await apiClient.post('/admin/system/clear-cache', {
    cacheKey,
  });
  return response.data;
}

// Restart service
export async function restartService(serviceName: string): Promise<{ message: string; status: string }> {
  const response = await apiClient.post(`/admin/system/restart-service`, {
    serviceName,
  });
  return response.data;
}

// Run health check
export async function runHealthCheck(): Promise<SystemHealth> {
  const response = await apiClient.post('/admin/system/health-check');
  return response.data;
}

// Get alerts
export async function getAlerts(filters?: {
  type?: string;
  severity?: string;
  resolved?: boolean;
}): Promise<Alert[]> {
  const response = await apiClient.get('/admin/system/alerts', {
    params: filters,
  });
  return response.data;
}

// Acknowledge alert
export async function acknowledgeAlert(alertId: string): Promise<{ message: string }> {
  const response = await apiClient.patch(`/admin/system/alerts/${alertId}/acknowledge`);
  return response.data;
}

// Resolve alert
export async function resolveAlert(alertId: string): Promise<{ message: string }> {
  const response = await apiClient.patch(`/admin/system/alerts/${alertId}/resolve`);
  return response.data;
}

// Get system logs
export async function getSystemLogs(
  dateRange?: DateRange,
  service?: string,
  level?: string
): Promise<Array<{
  timestamp: Date;
  level: string;
  service: string;
  message: string;
  metadata?: any;
}>> {
  const response = await apiClient.get('/admin/system/logs', {
    params: {
      startDate: dateRange?.startDate.toISOString(),
      endDate: dateRange?.endDate.toISOString(),
      service,
      level,
    },
  });
  return response.data;
}

// Export system report
export async function exportSystemReport(
  dateRange: DateRange,
  format: 'csv' | 'pdf' = 'pdf'
): Promise<Blob> {
  const response = await apiClient.get('/admin/system/export', {
    params: {
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate.toISOString(),
      format,
    },
    responseType: 'blob',
  });
  return response.data;
}

// Get uptime history
export async function getUptimeHistory(
  serviceName: string,
  dateRange?: DateRange
): Promise<Array<{ timestamp: Date; status: string; uptime: number }>> {
  const response = await apiClient.get(`/admin/system/uptime/${serviceName}`, {
    params: {
      startDate: dateRange?.startDate.toISOString(),
      endDate: dateRange?.endDate.toISOString(),
    },
  });
  return response.data;
}

// Backup database
export async function backupDatabase(): Promise<{ message: string; backupId: string; size: number }> {
  const response = await apiClient.post('/admin/system/backup');
  return response.data;
}

// Get backup history
export async function getBackupHistory(): Promise<Array<{
  id: string;
  timestamp: Date;
  size: number;
  status: string;
  location: string;
}>> {
  const response = await apiClient.get('/admin/system/backups');
  return response.data;
}