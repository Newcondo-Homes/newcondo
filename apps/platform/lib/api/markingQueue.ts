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











// // apps/platform/lib/api/markingQueue.ts
// import { client } from './client';
// import type {
//   QueuePosition,
//   QueueStatusResponse,
//   QueueHistoryResponse,
//   JoinQueueRequest,
//   JoinQueueResponse
// } from '@/types/queue';

// /**
//  * Join the marking job queue for a specific job
//  * @param jobId - The marking job ID
//  * @param data - Additional data for joining the queue
//  */
// export async function joinMarkingQueue(
//   jobId: string,
//   data?: JoinQueueRequest
// ): Promise<JoinQueueResponse> {
//   return client.post(`/marking-queue/${jobId}/join`, data);
// }

// /**
//  * Leave the marking job queue
//  * @param jobId - The marking job ID
//  */
// export async function leaveMarkingQueue(jobId: string): Promise<{
//   success: boolean;
//   message: string;
// }> {
//   return client.post(`/marking-queue/${jobId}/leave`);
// }

// /**
//  * Get current queue position for a marking job
//  * @param jobId - The marking job ID
//  */
// export async function getQueuePosition(jobId: string): Promise<QueuePosition> {
//   return client.get(`/marking-queue/${jobId}/position`);
// }

// /**
//  * Get queue status for a marking job (total agents, current agent, etc.)
//  * @param jobId - The marking job ID
//  */
// export async function getQueueStatus(jobId: string): Promise<QueueStatusResponse> {
//   return client.get(`/marking-queue/${jobId}/status`);
// }

// /**
//  * Get all active queue positions for the current user
//  */
// export async function getMyQueuePositions(): Promise<QueuePosition[]> {
//   return client.get('/marking-queue/my-positions');
// }

// /**
//  * Get queue history for a marking job
//  * @param jobId - The marking job ID
//  */
// export async function getQueueHistory(jobId: string): Promise<QueueHistoryResponse> {
//   return client.get(`/marking-queue/${jobId}/history`);
// }

// /**
//  * Check if user is currently in queue for a job
//  * @param jobId - The marking job ID
//  */
// export async function isInQueue(jobId: string): Promise<{
//   inQueue: boolean;
//   position?: number;
//   estimatedWaitTime?: number; // in minutes
// }> {
//   return client.get(`/marking-queue/${jobId}/check`);
// }

// /**
//  * Get next agent in queue (admin/system use)
//  * @param jobId - The marking job ID
//  */
// export async function getNextInQueue(jobId: string): Promise<QueuePosition | null> {
//   return client.get(`/marking-queue/${jobId}/next`);
// }

// /**
//  * Promote agent in queue (admin use)
//  * @param jobId - The marking job ID
//  * @param agentId - The agent ID to promote
//  */
// export async function promoteInQueue(
//   jobId: string,
//   agentId: string
// ): Promise<QueueStatusResponse> {
//   return client.post(`/marking-queue/${jobId}/promote`, { agentId });
// }

// /**
//  * Remove agent from queue (admin use)
//  * @param jobId - The marking job ID
//  * @param agentId - The agent ID to remove
//  * @param reason - Reason for removal
//  */
// export async function removeFromQueue(
//   jobId: string,
//   agentId: string,
//   reason?: string
// ): Promise<{
//   success: boolean;
//   message: string;
// }> {
//   return client.post(`/marking-queue/${jobId}/remove`, { agentId, reason });
// }

// /**
//  * Get queue statistics
//  */
// export async function getQueueStats(): Promise<{
//   totalActiveQueues: number;
//   totalAgentsInQueue: number;
//   averageWaitTime: number;
//   completionRate: number;
// }> {
//   return client.get('/marking-queue/stats');
// }