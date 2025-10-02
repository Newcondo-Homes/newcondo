import { client } from './client';

export interface QueuePosition {
  position: number;
  totalInQueue: number;
  estimatedWaitTime: number; // in seconds
  queueId: string;
}

export interface QueueEntry {
  id: string;
  userId: string;
  propertyId: string;
  unitId?: string;
  position: number;
  status: 'WAITING' | 'PROCESSING' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
  joinedAt: string;
  expiresAt: string;
  processedAt?: string;
}

export interface JoinQueueRequest {
  propertyId: string;
  unitId?: string;
}

export interface JoinQueueResponse {
  success: boolean;
  queueEntry?: QueueEntry;
  queuePosition?: QueuePosition;
  message?: string;
}

/**
 * Join payment queue for a property or unit
 */
export async function joinPaymentQueue(
  data: JoinQueueRequest
): Promise<JoinQueueResponse> {
  try {
    const response = await client.post<JoinQueueResponse>(
      '/api/queue/join',
      data
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to join payment queue'
    );
  }
}

/**
 * Leave payment queue
 */
export async function leavePaymentQueue(queueId: string): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const response = await client.post(`/api/queue/${queueId}/leave`);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to leave payment queue'
    );
  }
}

/**
 * Get current queue position
 */
export async function getQueuePosition(
  queueId: string
): Promise<QueuePosition> {
  try {
    const response = await client.get<QueuePosition>(
      `/api/queue/${queueId}/position`
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to get queue position'
    );
  }
}

/**
 * Get user's active queue entries
 */
export async function getUserQueueEntries(): Promise<QueueEntry[]> {
  try {
    const response = await client.get<{ entries: QueueEntry[] }>(
      '/api/queue/user-entries'
    );
    return response.data.entries;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to fetch queue entries'
    );
  }
}

/**
 * Get queue status for a property
 */
export async function getPropertyQueueStatus(
  propertyId: string,
  unitId?: string
): Promise<{
  totalInQueue: number;
  averageWaitTime: number;
  isQueueActive: boolean;
}> {
  try {
    const params = new URLSearchParams({ propertyId });
    if (unitId) params.append('unitId', unitId);

    const response = await client.get(
      `/api/queue/property-status?${params.toString()}`
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to get queue status'
    );
  }
}

/**
 * Process next in queue (internal system operation)
 */
export async function processNextInQueue(
  propertyId: string,
  unitId?: string
): Promise<{
  success: boolean;
  nextEntry?: QueueEntry;
  message?: string;
}> {
  try {
    const response = await client.post('/api/queue/process-next', {
      propertyId,
      unitId,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to process next in queue'
    );
  }
}

/**
 * Mark queue entry as completed
 */
export async function completeQueueEntry(queueId: string): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const response = await client.post(`/api/queue/${queueId}/complete`);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to complete queue entry'
    );
  }
}

/**
 * Cleanup expired queue entries (system operation)
 */
export async function cleanupExpiredQueueEntries(): Promise<{
  success: boolean;
  cleanedCount: number;
}> {
  try {
    const response = await client.post('/api/queue/cleanup');
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to cleanup expired entries'
    );
  }
}

/**
 * Get queue statistics (admin)
 */
export async function getQueueStatistics(
  startDate?: string,
  endDate?: string
): Promise<{
  totalProcessed: number;
  averageWaitTime: number;
  peakQueueSize: number;
  completionRate: number;
}> {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await client.get(
      `/api/queue/statistics?${params.toString()}`
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to fetch queue statistics'
    );
  }
}