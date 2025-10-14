// apps/platform/lib/api/markingQueue.ts
import { apiClient } from './client';

export interface QueuePosition {
  jobId: string;
  agentId: string;
  position: number;
  timeSlotStart: string;
  timeSlotEnd: string;
  status: 'WAITING' | 'ACTIVE' | 'EXPIRED' | 'COMPLETED';
  isCurrentTurn: boolean;
}

export interface AvailableMarkingJob {
  id: string;
  propertyId: string;
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions?: string;
  preferredTime?: string;
  urgencyLevel: string;
  markingFee: number;
  agentCompensation: number;
  distance: number;
  property: {
    title: string;
    address: string;
    city: string;
    state: string;
    images: string[];
  };
  queueLength: number;
  estimatedWaitTime: number;
  createdAt: string;
}

export interface JoinQueueRequest {
  jobId: string;
  estimatedArrivalTime?: string;
}

export interface JoinQueueResponse {
  success: boolean;
  message: string;
  queuePosition: QueuePosition;
  estimatedStartTime: string;
}

/**
 * Get available marking jobs for agent (based on proximity)
 */
export async function getAvailableMarkingJobs(params?: {
  radius?: number; // kilometers
  urgencyLevel?: string;
  minCompensation?: number;
  page?: number;
  limit?: number;
}): Promise<{
  jobs: AvailableMarkingJob[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const response = await apiClient.get('/api/marking-queue/available-jobs', { params });
  return response.data;
}

/**
 * Join marking job queue
 */
export async function joinMarkingQueue(
  data: JoinQueueRequest
): Promise<JoinQueueResponse> {
  const response = await apiClient.post('/api/marking-queue/join', data);
  return response.data;
}

/**
 * Leave marking job queue
 */
export async function leaveMarkingQueue(
  jobId: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.post(`/api/marking-queue/${jobId}/leave`, { reason });
  return response.data;
}

/**
 * Get agent's current queue positions
 */
export async function getMyQueuePositions(): Promise<{
  activeQueues: QueuePosition[];
  waitingQueues: QueuePosition[];
  totalQueues: number;
}> {
  const response = await apiClient.get('/api/marking-queue/my-positions');
  return response.data;
}

/**
 * Get queue status for specific job
 */
export async function getJobQueueStatus(
  jobId: string
): Promise<{
  totalAgents: number;
  currentPosition: number;
  activeAgent?: {
    id: string;
    name: string;
    timeSlotStart: string;
    timeSlotEnd: string;
  };
  queuePositions: Array<{
    position: number;
    agentId: string;
    agentName: string;
    status: string;
    timeSlotStart: string;
    timeSlotEnd: string;
  }>;
}> {
  const response = await apiClient.get(`/api/marking-queue/job/${jobId}/status`);
  return response.data;
}

/**
 * Update agent availability for marking jobs
 */
export async function updateAgentAvailability(data: {
  isAvailable: boolean;
  serviceAreas?: string[];
}): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.put('/api/marking-queue/availability', data);
  return response.data;
}

/**
 * Get agent availability status
 */
export async function getAgentAvailability(): Promise<{
  isAvailable: boolean;
  serviceAreas: string[];
  activeJobs: number;
  queuedJobs: number;
  canAcceptMore: boolean;
}> {
  const response = await apiClient.get('/api/marking-queue/availability');
  return response.data;
}

/**
 * Notify system of agent arrival at property
 */
export async function notifyArrival(
  jobId: string,
  location: {
    latitude: number;
    longitude: number;
  }
): Promise<{ success: boolean; message: string; startMarking: boolean }> {
  const response = await apiClient.post(`/api/marking-queue/${jobId}/arrival`, { location });
  return response.data;
}

/**
 * Request time slot extension
 */
export async function requestTimeExtension(
  jobId: string,
  reason: string,
  additionalMinutes: number
): Promise<{ 
  success: boolean; 
  message: string; 
  newTimeSlotEnd?: string;
  granted: boolean;
}> {
  const response = await apiClient.post(`/api/marking-queue/${jobId}/extend-time`, {
    reason,
    additionalMinutes,
  });
  return response.data;
}

/**
 * Get queue statistics for agent
 */
export async function getQueueStatistics(): Promise<{
  totalJobsJoined: number;
  jobsCompleted: number;
  jobsExpired: number;
  averageWaitTime: number;
  averageCompletionTime: number;
  successRate: number;
}> {
  const response = await apiClient.get('/api/marking-queue/statistics');
  return response.data;
}

/**
 * Get real-time queue updates (for WebSocket or polling)
 */
export async function getQueueUpdates(
  lastUpdateTime?: string
): Promise<{
  updates: Array<{
    jobId: string;
    type: 'POSITION_CHANGED' | 'TURN_STARTED' | 'JOB_COMPLETED' | 'JOB_EXPIRED';
    data: any;
    timestamp: string;
  }>;
  hasMore: boolean;
}> {
  const response = await apiClient.get('/api/marking-queue/updates', {
    params: { since: lastUpdateTime },
  });
  return response.data;
}