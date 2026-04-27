import client  from './client';

export interface QueuePosition {
  position: number;
  totalInQueue: number;
  estimatedWaitTime: number; // in seconds
  queueId: string;
}

export interface LocationSettings {
  isAvailableForMarking: boolean;
  serviceAreas: string[];
  maxRadius: number;
  notificationsEnabled: boolean;
}

export interface AvailableJob {
  id: string;
  propertyId: string;
  markingFee: number;
  urgencyLevel: string;
  queuePosition: number;
  totalInQueue: number;
  distance?: number;
  property: {
    id: string;
    title: string;
    address: string;
    city: string;
    state: string;
    images: Array<{ url: string }>;
  };
  createdAt: Date;
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

export async function getJobDetails(jobId: string): Promise<{ data: any }> {
  try {
    const response = await client.get<{ data: any }>(`/api/marking/jobs/${jobId}`);
    return response.data!;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch job details');
  }
}

export async function completeJob(
  jobId: string,
  payload: {
    completionNotes: string;
    completionImages: string[];
    boundaryData?: any;
  }
): Promise<{ success: boolean }> {
  try {
    const response = await client.post<{ success: boolean }>(
      `/api/marking/jobs/${jobId}/complete`,
      payload
    );
    return response.data!;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to complete job');
  }
}


export async function getAvailableJobs(filters?: {
  urgency?: string;
  sortBy?: string;
}): Promise<{ data: AvailableJob[] }> {
  try {
    const params = new URLSearchParams();
    if (filters?.urgency && filters.urgency !== 'all') {
      params.append('urgency', filters.urgency);
    }
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);

    const response = await client.get<{ data: AvailableJob[] }>(
      `/api/marking/jobs/available?${params.toString()}`
    );
    return response.data!;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch available jobs');
  }
}

export async function getMyAssignedJobs(): Promise<{ data: any[] }> {
  try {
    const response = await client.get<{ data: any[] }>('/api/marking/jobs/assigned');
    return response.data!;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch assigned jobs');
  }
}

export async function startJob(jobId: string): Promise<{ success: boolean }> {
  try {
    const response = await client.post<{ success: boolean }>(
      `/api/marking/jobs/${jobId}/start`
    );
    return response.data!;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to start job');
  }
}

export async function joinQueue(jobId: string): Promise<{ success: boolean }> {
  try {
    const response = await client.post<{ success: boolean }>(
      `/api/marking/jobs/${jobId}/join-queue`
    );
    return response.data!;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to join queue');
  }
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
    return response.data as JoinQueueResponse;
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
    return response.data as {
  success: boolean;
  message?: string;
};
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to leave payment queue'
    );
  }
}


export async function getLocationSettings(): Promise<LocationSettings> {
  try {
    const response = await client.get<LocationSettings>('/api/agent/location-settings');
    return response.data! ;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch location settings');
  }
}

export async function updateLocationSettings(data: LocationSettings & {
  coordinates?: { lat: number; lng: number } | null;
}): Promise<{ success: boolean }> {
  try {
    const response = await client.post<{ success: boolean }>('/api/agent/location-settings', data);
    return response.data as { success: boolean };
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to update location settings');
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
    return response.data as QueuePosition;
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
    return response.data?.entries as QueueEntry[];
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
    return response.data as {
  totalInQueue: number;
  averageWaitTime: number;
  isQueueActive: boolean;
};
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
    return response.data as {
  success: boolean;
  nextEntry?: QueueEntry;
  message?: string;
};
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
    return response.data as {
  success: boolean;
  message?: string;
};
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
    return response.data as {
  success: boolean;
  cleanedCount: number;
};
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to cleanup expired entries'
    );
  }
}

export async function getMyQueue(): Promise<{
  data: { queueItems: any[]; activeJobs: any[] };
}> {
  try {
    const response = await client.get<{ data: { queueItems: any[]; activeJobs: any[] } }>(
      '/api/marking/jobs/my-queue'
    );
    return response.data!;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch queue');
  }
}

export async function getMyStats(): Promise<{ data: any }> {
  try {
    const response = await client.get<{ data: any }>('/api/marking/jobs/my-stats');
    return response.data!;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch stats');
  }
}

export async function toggleAvailability(
  isAvailable: boolean
): Promise<{ success: boolean }> {
  try {
    const response = await client.post<{ success: boolean }>(
      '/api/agent/toggle-availability',
      { isAvailable }
    );
    return response.data!;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to toggle availability');
  }
}

export async function leaveQueue(
  queueItemId: string
): Promise<{ success: boolean }> {
  try {
    const response = await client.post<{ success: boolean }>(
      `/api/marking/jobs/${queueItemId}/leave-queue`
    );
    return response.data!;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to leave queue');
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
    return response.data as {
  totalProcessed: number;
  averageWaitTime: number;
  peakQueueSize: number;
  completionRate: number;
};
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to fetch queue statistics'
    );
  }
}


export const queueApi = {
  getAvailableJobs,
  getMyAssignedJobs,
  getJobDetails,
  completeJob,
  startJob,
  joinQueue,
  joinPaymentQueue,
  leavePaymentQueue,
  getLocationSettings,
  updateLocationSettings,
  getQueuePosition,
  getUserQueueEntries,
  getPropertyQueueStatus,
  processNextInQueue,
  completeQueueEntry,
  cleanupExpiredQueueEntries,
  getQueueStatistics,
  getMyQueue,
  getMyStats,
  toggleAvailability,
  leaveQueue,
};




// // apps/platform/lib/api/queue.ts
// import { apiClient } from './client';

// export interface QueuePosition {
//   position: number;
//   jobId: string;
//   agentId: string;
//   agentName: string;
//   estimatedStartTime: string;
//   timeSlotStart: string;
//   timeSlotEnd: string;
//   status: 'WAITING' | 'ACTIVE' | 'EXPIRED' | 'COMPLETED';
//   joinedAt: string;
// }

// export interface QueueInfo {
//   jobId: string;
//   totalAgentsInQueue: number;
//   currentPosition?: number;
//   estimatedWaitTime?: number; // in minutes
//   activeAgent?: {
//     id: string;
//     name: string;
//     timeRemaining: number; // in minutes
//   };
//   queue: QueuePosition[];
// }

// export interface JoinQueueResponse {
//   success: boolean;
//   message: string;
//   position: number;
//   estimatedStartTime: string;
//   queueInfo: QueueInfo;
// }

// export interface LeaveQueueResponse {
//   success: boolean;
//   message: string;
// }

// export interface QueueStats {
//   totalQueued: number;
//   averageQueueTime: number; // in minutes
//   averageCompletionRate: number; // percentage
//   activeQueues: number;
// }

// // Join the queue for a marking job
// export const joinMarkingQueue = async (jobId: string): Promise<JoinQueueResponse> => {
//   const response = await apiClient.post(`/api/marking/queue/${jobId}/join`);
//   return response.data;
// };

// // Leave the queue for a marking job
// export const leaveMarkingQueue = async (jobId: string): Promise<LeaveQueueResponse> => {
//   const response = await apiClient.post(`/api/marking/queue/${jobId}/leave`);
//   return response.data;
// };

// // Get current queue information for a job
// export const getQueueInfo = async (jobId: string): Promise<QueueInfo> => {
//   const response = await apiClient.get(`/api/marking/queue/${jobId}`);
//   return response.data;
// };

// // Get agent's position in queue
// export const getMyQueuePosition = async (jobId: string): Promise<{
//   position: number;
//   totalInQueue: number;
//   estimatedStartTime: string;
//   status: string;
// }> => {
//   const response = await apiClient.get(`/api/marking/queue/${jobId}/my-position`);
//   return response.data;
// };

// // Get all queues the agent is currently in
// export const getMyActiveQueues = async (): Promise<{
//   queues: Array<{
//     jobId: string;
//     propertyId: string;
//     position: number;
//     status: string;
//     joinedAt: string;
//     estimatedStartTime: string;
//     property: {
//       title: string;
//       address: string;
//       city: string;
//       state: string;
//     };
//   }>;
// }> => {
//   const response = await apiClient.get('/api/marking/queue/my-queues');
//   return response.data;
// };

// // Check if agent is eligible to join queue
// export const checkQueueEligibility = async (jobId: string): Promise<{
//   eligible: boolean;
//   reason?: string;
//   requirements?: string[];
// }> => {
//   const response = await apiClient.get(`/api/marking/queue/${jobId}/check-eligibility`);
//   return response.data;
// };

// // Get queue statistics
// export const getQueueStats = async (): Promise<QueueStats> => {
//   const response = await apiClient.get('/api/marking/queue/stats');
//   return response.data;
// };

// // Get queue history for an agent
// export const getQueueHistory = async (filters?: {
//   fromDate?: string;
//   toDate?: string;
//   status?: string;
//   page?: number;
//   limit?: number;
// }): Promise<{
//   history: Array<{
//     jobId: string;
//     propertyId: string;
//     position: number;
//     status: string;
//     joinedAt: string;
//     leftAt?: string;
//     completedAt?: string;
//     duration?: number; // in minutes
//     outcome: 'COMPLETED' | 'EXPIRED' | 'LEFT' | 'CANCELLED';
//   }>;
//   pagination: {
//     total: number;
//     page: number;
//     limit: number;
//     totalPages: number;
//   };
// }> => {
//   const params = new URLSearchParams();
  
//   if (filters?.fromDate) params.append('fromDate', filters.fromDate);
//   if (filters?.toDate) params.append('toDate', filters.toDate);
//   if (filters?.status) params.append('status', filters.status);
//   if (filters?.page) params.append('page', filters.page.toString());
//   if (filters?.limit) params.append('limit', filters.limit.toString());

//   const response = await apiClient.get(`/api/marking/queue/history?${params.toString()}`);
//   return response.data;
// };

// // Update agent's availability for queue
// export const updateQueueAvailability = async (isAvailable: boolean): Promise<{
//   success: boolean;
//   message: string;
// }> => {
//   const response = await apiClient.post('/api/marking/queue/availability', { isAvailable });
//   return response.data;
// };

// // Get real-time queue updates (polling endpoint)
// export const pollQueueUpdates = async (jobIds: string[]): Promise<{
//   updates: Record<string, QueueInfo>;
// }> => {
//   const response = await apiClient.post('/api/marking/queue/poll', { jobIds });
//   return response.data;
// };

// // Accept turn when it's agent's time slot
// export const acceptQueueTurn = async (jobId: string): Promise<{
//   success: boolean;
//   message: string;
//   timeSlotExpiry: string;
// }> => {
//   const response = await apiClient.post(`/api/marking/queue/${jobId}/accept-turn`);
//   return response.data;
// };

// // Decline turn and move to end of queue
// export const declineQueueTurn = async (jobId: string, reason?: string): Promise<{
//   success: boolean;
//   message: string;
//   newPosition?: number;
// }> => {
//   const response = await apiClient.post(`/api/marking/queue/${jobId}/decline-turn`, { reason });
//   return response.data;
// };

// // Get queue position updates via webhook (for real-time notifications)
// export const subscribeToQueueUpdates = async (jobId: string, webhookUrl: string): Promise<{
//   success: boolean;
//   subscriptionId: string;
// }> => {
//   const response = await apiClient.post(`/api/marking/queue/${jobId}/subscribe`, { webhookUrl });
//   return response.data;
// };

// // Unsubscribe from queue updates
// export const unsubscribeFromQueueUpdates = async (subscriptionId: string): Promise<{
//   success: boolean;
// }> => {
//   const response = await apiClient.delete(`/api/marking/queue/subscriptions/${subscriptionId}`);
//   return response.data;
// };