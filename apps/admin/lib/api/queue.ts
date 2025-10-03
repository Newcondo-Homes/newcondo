/**
 * Queue Management API
 * Location: apps/admin/src/lib/api/queue.ts
 * 
 * Handles payment queue operations for admin dashboard
 */

import { apiClient } from './client';

// Types
export interface QueuedPayment {
  id: string;
  userId: string;
  propertyId: string;
  unitId?: string;
  amount: number;
  currency: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  position: number;
  queuedAt: string;
  startedAt?: string;
  completedAt?: string;
  lockAcquired: boolean;
  lockDuration?: number;
  retryCount: number;
  maxRetries: number;
  failureReason?: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  };
  property: {
    id: string;
    title: string;
    address: string;
    price: number;
  };
  unit?: {
    id: string;
    unitNumber: string;
    price: number;
  };
}

export interface QueueStats {
  totalQueued: number;
  totalProcessing: number;
  totalCompleted: number;
  totalFailed: number;
  averageWaitTime: number; // in milliseconds
  averageProcessingTime: number; // in milliseconds
  successRate: number; // percentage
  peakQueueSize: number;
  currentQueueDepth: number;
}

export interface QueueFilters {
  status?: QueuedPayment['status'][];
  propertyId?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  lockStatus?: boolean;
}

export interface QueuePagination {
  page: number;
  limit: number;
  sortBy?: 'queuedAt' | 'position' | 'amount' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface QueueResponse {
  payments: QueuedPayment[];
  stats: QueueStats;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface QueueActionResult {
  success: boolean;
  message: string;
  affectedPayments?: string[];
  errors?: Array<{
    paymentId: string;
    error: string;
  }>;
}

// API Functions

/**
 * Get all queued payments with filters
 */
export async function getQueuedPayments(
  filters?: QueueFilters,
  pagination?: QueuePagination
): Promise<QueueResponse> {
  const params = new URLSearchParams();
  
  // Add filters
  if (filters) {
    if (filters.status?.length) {
      params.append('status', filters.status.join(','));
    }
    if (filters.propertyId) {
      params.append('propertyId', filters.propertyId);
    }
    if (filters.userId) {
      params.append('userId', filters.userId);
    }
    if (filters.dateFrom) {
      params.append('dateFrom', filters.dateFrom);
    }
    if (filters.dateTo) {
      params.append('dateTo', filters.dateTo);
    }
    if (filters.minAmount) {
      params.append('minAmount', filters.minAmount.toString());
    }
    if (filters.maxAmount) {
      params.append('maxAmount', filters.maxAmount.toString());
    }
    if (filters.lockStatus !== undefined) {
      params.append('lockStatus', filters.lockStatus.toString());
    }
  }
  
  // Add pagination
  if (pagination) {
    params.append('page', pagination.page.toString());
    params.append('limit', pagination.limit.toString());
    if (pagination.sortBy) {
      params.append('sortBy', pagination.sortBy);
    }
    if (pagination.sortOrder) {
      params.append('sortOrder', pagination.sortOrder);
    }
  }
  
  const response = await apiClient.get<QueueResponse>(
    `/admin/queue?${params.toString()}`
  );
  
  return response.data;
}

/**
 * Get queue statistics
 */
export async function getQueueStats(
  timeRange?: '1h' | '24h' | '7d' | '30d' | 'all'
): Promise<QueueStats> {
  const params = timeRange ? `?timeRange=${timeRange}` : '';
  const response = await apiClient.get<QueueStats>(`/admin/queue/stats${params}`);
  return response.data;
}

/**
 * Get specific queued payment details
 */
export async function getQueuedPayment(paymentId: string): Promise<QueuedPayment> {
  const response = await apiClient.get<QueuedPayment>(`/admin/queue/${paymentId}`);
  return response.data;
}

/**
 * Retry failed payment
 */
export async function retryPayment(paymentId: string): Promise<QueueActionResult> {
  const response = await apiClient.post<QueueActionResult>(
    `/admin/queue/${paymentId}/retry`
  );
  return response.data;
}

/**
 * Retry multiple failed payments
 */
export async function retryMultiplePayments(
  paymentIds: string[]
): Promise<QueueActionResult> {
  const response = await apiClient.post<QueueActionResult>('/admin/queue/retry-batch', {
    paymentIds,
  });
  return response.data;
}

/**
 * Cancel queued payment
 */
export async function cancelPayment(
  paymentId: string,
  reason: string
): Promise<QueueActionResult> {
  const response = await apiClient.post<QueueActionResult>(
    `/admin/queue/${paymentId}/cancel`,
    { reason }
  );
  return response.data;
}

/**
 * Cancel multiple queued payments
 */
export async function cancelMultiplePayments(
  paymentIds: string[],
  reason: string
): Promise<QueueActionResult> {
  const response = await apiClient.post<QueueActionResult>('/admin/queue/cancel-batch', {
    paymentIds,
    reason,
  });
  return response.data;
}

/**
 * Force process a stuck payment
 */
export async function forceProcessPayment(
  paymentId: string
): Promise<QueueActionResult> {
  const response = await apiClient.post<QueueActionResult>(
    `/admin/queue/${paymentId}/force-process`
  );
  return response.data;
}

/**
 * Clear completed/failed payments from queue (cleanup)
 */
export async function clearQueue(
  status: 'COMPLETED' | 'FAILED',
  olderThan?: string // ISO date string
): Promise<QueueActionResult> {
  const response = await apiClient.post<QueueActionResult>('/admin/queue/clear', {
    status,
    olderThan,
  });
  return response.data;
}

/**
 * Reorder queue priority (manual intervention)
 */
export async function reorderQueue(
  paymentId: string,
  newPosition: number
): Promise<QueueActionResult> {
  const response = await apiClient.post<QueueActionResult>(
    `/admin/queue/${paymentId}/reorder`,
    { newPosition }
  );
  return response.data;
}

/**
 * Get queue performance metrics
 */
export async function getQueuePerformanceMetrics(
  timeRange: '1h' | '24h' | '7d' | '30d'
): Promise<{
  throughput: number; // payments processed per hour
  averageLatency: number; // ms
  errorRate: number; // percentage
  concurrentProcessing: number;
  queueBacklog: number;
  bottlenecks: Array<{
    propertyId: string;
    propertyTitle: string;
    queuedCount: number;
    averageWaitTime: number;
  }>;
}> {
  const response = await apiClient.get(
    `/admin/queue/performance?timeRange=${timeRange}`
  );
  return response.data;
}

/**
 * Get payment queue history for a property
 */
export async function getPropertyQueueHistory(
  propertyId: string,
  limit: number = 50
): Promise<QueuedPayment[]> {
  const response = await apiClient.get<QueuedPayment[]>(
    `/admin/queue/property/${propertyId}?limit=${limit}`
  );
  return response.data;
}

/**
 * Get payment queue history for a user
 */
export async function getUserQueueHistory(
  userId: string,
  limit: number = 50
): Promise<QueuedPayment[]> {
  const response = await apiClient.get<QueuedPayment[]>(
    `/admin/queue/user/${userId}?limit=${limit}`
  );
  return response.data;
}

/**
 * Pause queue processing (emergency stop)
 */
export async function pauseQueue(reason: string): Promise<QueueActionResult> {
  const response = await apiClient.post<QueueActionResult>('/admin/queue/pause', {
    reason,
  });
  return response.data;
}

/**
 * Resume queue processing
 */
export async function resumeQueue(): Promise<QueueActionResult> {
  const response = await apiClient.post<QueueActionResult>('/admin/queue/resume');
  return response.data;
}

/**
 * Get queue health status
 */
export async function getQueueHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'critical' | 'paused';
  issues: Array<{
    severity: 'warning' | 'error' | 'critical';
    message: string;
    count?: number;
  }>;
  recommendations: string[];
  lastHealthCheck: string;
}> {
  const response = await apiClient.get('/admin/queue/health');
  return response.data;
}

/**
 * Export queue data for analysis
 */
export async function exportQueueData(
  filters?: QueueFilters,
  format: 'csv' | 'json' = 'csv'
): Promise<Blob> {
  const params = new URLSearchParams();
  params.append('format', format);
  
  if (filters) {
    if (filters.status?.length) {
      params.append('status', filters.status.join(','));
    }
    if (filters.dateFrom) {
      params.append('dateFrom', filters.dateFrom);
    }
    if (filters.dateTo) {
      params.append('dateTo', filters.dateTo);
    }
  }
  
  const response = await apiClient.get(`/admin/queue/export?${params.toString()}`, {
    responseType: 'blob',
  });
  
  return response.data;
}

/**
 * Subscribe to real-time queue updates (WebSocket/SSE)
 */
export function subscribeToQueueUpdates(
  onUpdate: (payment: QueuedPayment) => void,
  onError?: (error: Error) => void
): () => void {
  // This would typically use WebSocket or Server-Sent Events
  // Implementation depends on your real-time setup
  const eventSource = new EventSource(`${process.env.NEXT_PUBLIC_API_URL}/admin/queue/stream`);
  
  eventSource.onmessage = (event) => {
    try {
      const payment = JSON.parse(event.data) as QueuedPayment;
      onUpdate(payment);
    } catch (error) {
      onError?.(error as Error);
    }
  };
  
  eventSource.onerror = (error) => {
    onError?.(new Error('Queue update stream error'));
  };
  
  // Return cleanup function
  return () => {
    eventSource.close();
  };
}