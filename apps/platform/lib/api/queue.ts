import client from './client';

// ─── Shared error type ────────────────────────────────────────────────────────

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

// ─── Public interfaces ────────────────────────────────────────────────────────

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

// Typed shapes for previously-any return values

export interface JobDetails {
  id: string;
  status: string;
  markingFee: number;
  urgencyLevel: string;
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions?: string;
  preferredTime?: string;
  timeSlotStart?: string;
  timeSlotEnd?: string;
  maxCompletionTime?: string;
  assignedAt?: string;
  createdAt: string;
  property: {
    title: string;
    address: string;
    city: string;
    state: string;
    images: Array<{ url: string }>;
  };
}

export interface AssignedJob {
  id: string;
  status: string;
  markingFee: number;
  assignedAt: string;
  timeSlotExpiry?: string;
  property: {
    title: string;
    address: string;
    city: string;
    images: Array<{ url: string }>;
  };
}

export interface QueueItem {
  id: string;
  jobId: string;
  status: string;
  position: number;
  joinedAt: string;
  timeSlotStart?: Date;
  timeSlotEnd?: Date;
  property: {
    title: string;
    address: string;
    city: string;
  };
}

export interface ActiveJob {
  id: string;
  jobId: string;
  status: string;
  timeSlotStart?: string;
  timeSlotEnd?: string;
  property: {
    title: string;
    address: string;
    city: string;
  };
}

export interface AgentStats {
  totalQueued: number;
  totalActive: number;
  totalCompleted: number;
  averageWaitTime?: number;
}

export interface BoundaryCoordinate {
  lat: number;
  lng: number;
}

// ─── API functions ────────────────────────────────────────────────────────────

export async function getJobDetails(jobId: string): Promise<{ data: JobDetails }> {
  try {
    const response = await client.get<{ data: JobDetails }>(`/api/marking/jobs/${jobId}`);
    return response.data!;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw new Error(apiError.response?.data?.message || 'Failed to fetch job details');
  }
}

export async function completeJob(
  jobId: string,
  payload: {
    completionNotes: string;
    completionImages: string[];
    boundaryData?: BoundaryCoordinate[];
  }
): Promise<{ success: boolean }> {
  try {
    const response = await client.post<{ success: boolean }>(
      `/api/marking/jobs/${jobId}/complete`,
      payload
    );
    return response.data!;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw new Error(apiError.response?.data?.message || 'Failed to complete job');
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
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw new Error(apiError.response?.data?.message || 'Failed to fetch available jobs');
  }
}

export async function getMyAssignedJobs(): Promise<{ data: AssignedJob[] }> {
  try {
    const response = await client.get<{ data: AssignedJob[] }>('/api/marking/jobs/assigned');
    return response.data!;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw new Error(apiError.response?.data?.message || 'Failed to fetch assigned jobs');
  }
}

export async function startJob(jobId: string): Promise<{ success: boolean }> {
  try {
    const response = await client.post<{ success: boolean }>(
      `/api/marking/jobs/${jobId}/start`
    );
    return response.data!;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw new Error(apiError.response?.data?.message || 'Failed to start job');
  }
}

export async function joinQueue(jobId: string): Promise<{ success: boolean }> {
  try {
    const response = await client.post<{ success: boolean }>(
      `/api/marking/jobs/${jobId}/join-queue`
    );
    return response.data!;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw new Error(apiError.response?.data?.message || 'Failed to join queue');
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
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.response?.data?.message || 'Failed to join payment queue'
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
    return response.data as { success: boolean; message?: string };
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.response?.data?.message || 'Failed to leave payment queue'
    );
  }
}

export async function getLocationSettings(): Promise<LocationSettings> {
  try {
    const response = await client.get<LocationSettings>('/api/agent/location-settings');
    return response.data!;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw new Error(apiError.response?.data?.message || 'Failed to fetch location settings');
  }
}

export async function updateLocationSettings(data: LocationSettings & {
  coordinates?: { lat: number; lng: number } | null;
}): Promise<{ success: boolean }> {
  try {
    const response = await client.post<{ success: boolean }>('/api/agent/location-settings', data);
    return response.data as { success: boolean };
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw new Error(apiError.response?.data?.message || 'Failed to update location settings');
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
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.response?.data?.message || 'Failed to get queue position'
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
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.response?.data?.message || 'Failed to fetch queue entries'
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
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.response?.data?.message || 'Failed to get queue status'
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
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.response?.data?.message || 'Failed to process next in queue'
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
    return response.data as { success: boolean; message?: string };
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.response?.data?.message || 'Failed to complete queue entry'
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
    return response.data as { success: boolean; cleanedCount: number };
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.response?.data?.message || 'Failed to cleanup expired entries'
    );
  }
}

export async function getMyQueue(): Promise<{
  data: { queueItems: QueueItem[]; activeJobs: ActiveJob[] };
}> {
  try {
    const response = await client.get<{ data: { queueItems: QueueItem[]; activeJobs: ActiveJob[] } }>(
      '/api/marking/jobs/my-queue'
    );
    return response.data!;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw new Error(apiError.response?.data?.message || 'Failed to fetch queue');
  }
}

export async function getMyStats(): Promise<{ data: AgentStats }> {
  try {
    const response = await client.get<{ data: AgentStats }>('/api/marking/jobs/my-stats');
    return response.data!;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw new Error(apiError.response?.data?.message || 'Failed to fetch stats');
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
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw new Error(apiError.response?.data?.message || 'Failed to toggle availability');
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
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw new Error(apiError.response?.data?.message || 'Failed to leave queue');
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
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.response?.data?.message || 'Failed to fetch queue statistics'
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