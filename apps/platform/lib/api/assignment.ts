/**
 * Assignment API Client
 * Handles marking job assignment and queue management operations
 * Location: apps/platform/lib/api/assignment.ts
 */

import { client } from './client';

// Types for assignment operations
export interface AssignmentResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

export interface QueuePosition {
  jobId: string;
  position: number;
  totalInQueue: number;
  estimatedWaitTime: number; // in minutes
  timeSlotStart: Date;
  timeSlotEnd: Date;
}

export interface AssignmentDetails {
  jobId: string;
  assignedAgentId: string;
  agentName: string;
  agentPhone: string;
  timeSlotExpiry: Date;
  timeSlotDuration: number; // 3 hours in minutes
  propertyDetails: {
    address: string;
    city: string;
    state: string;
    contactPerson: string;
    contactPhone: string;
    accessInstructions?: string;
  };
  markingFee: number;
  initialCompensation: number; // ~1000 NGN initial payment
}

export interface QueueStatusResponse {
  jobId: string;
  status: string;
  queuePosition?: number;
  totalInQueue: number;
  timeSlotStart: Date;
  timeSlotEnd: Date;
  isFirstInQueue: boolean;
  estimatedNotificationTime?: Date;
}

export interface ReassignmentData {
  jobId: string;
  reason: string;
  previousAgentId: string;
  compensationPaid: number;
}

/**
 * Get current queue position for a marking job
 * @param jobId - Property marking job ID
 * @returns Queue position details
 */
export async function getQueuePosition(jobId: string): Promise<QueuePosition> {
  try {
    const response = await client.get(`/marking-service/queue/${jobId}/position`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch queue position: ${error}`);
  }
}

/**
 * Get all queue positions for an agent
 * Used in agent dashboard to show their queue status
 * @param agentId - Agent user ID
 * @returns Array of queue positions
 */
export async function getAgentQueuePositions(agentId: string): Promise<QueuePosition[]> {
  try {
    const response = await client.get(`/marking-service/queue/agent/${agentId}/positions`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch agent queue positions: ${error}`);
  }
}

/**
 * Accept a marking job assignment
 * Called when an agent accepts a job from the queue
 * @param jobId - Property marking job ID
 * @param agentId - Agent user ID
 * @returns Assignment confirmation
 */
export async function acceptAssignment(jobId: string, agentId: string): Promise<AssignmentDetails> {
  try {
    const response = await client.post(`/marking-service/assignments/${jobId}/accept`, {
      agentId,
      acceptedAt: new Date().toISOString(),
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to accept assignment: ${error}`);
  }
}

/**
 * Decline a marking job assignment
 * Called when an agent declines a job and wants to skip it
 * @param jobId - Property marking job ID
 * @param agentId - Agent user ID
 * @param reason - Optional reason for declining
 * @returns Confirmation response
 */
export async function declineAssignment(
  jobId: string,
  agentId: string,
  reason?: string
): Promise<AssignmentResponse> {
  try {
    const response = await client.post(`/marking-service/assignments/${jobId}/decline`, {
      agentId,
      reason,
      declinedAt: new Date().toISOString(),
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to decline assignment: ${error}`);
  }
}

/**
 * Get assignment details for current job
 * Retrieves all necessary information for completing marking
 * @param jobId - Property marking job ID
 * @returns Full assignment details
 */
export async function getAssignmentDetails(jobId: string): Promise<AssignmentDetails> {
  try {
    const response = await client.get(`/marking-service/assignments/${jobId}/details`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch assignment details: ${error}`);
  }
}

/**
 * Check queue status for a specific job
 * @param jobId - Property marking job ID
 * @returns Current queue status
 */
export async function checkQueueStatus(jobId: string): Promise<QueueStatusResponse> {
  try {
    const response = await client.get(`/marking-service/queue/${jobId}/status`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to check queue status: ${error}`);
  }
}

/**
 * Get estimated completion time based on queue position
 * @param jobId - Property marking job ID
 * @returns Estimated time in minutes
 */
export async function getEstimatedCompletionTime(jobId: string): Promise<number> {
  try {
    const response = await client.get(`/marking-service/queue/${jobId}/estimated-time`);
    return response.data.estimatedMinutes;
  } catch (error) {
    throw new Error(`Failed to fetch estimated completion time: ${error}`);
  }
}

/**
 * Notify backend that agent is en route to property
 * Used for real-time tracking and notification purposes
 * @param jobId - Property marking job ID
 * @param agentId - Agent user ID
 * @param currentLocation - Optional GPS coordinates {lat, lng}
 * @returns Confirmation response
 */
export async function notifyAgentEnRoute(
  jobId: string,
  agentId: string,
  currentLocation?: { lat: number; lng: number }
): Promise<AssignmentResponse> {
  try {
    const response = await client.post(`/marking-service/assignments/${jobId}/en-route`, {
      agentId,
      currentLocation,
      enRouteAt: new Date().toISOString(),
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to notify en route status: ${error}`);
  }
}

/**
 * Notify backend that agent has arrived at property
 * @param jobId - Property marking job ID
 * @param agentId - Agent user ID
 * @param arrivalLocation - GPS coordinates {lat, lng}
 * @returns Confirmation response
 */
export async function notifyAgentArrived(
  jobId: string,
  agentId: string,
  arrivalLocation: { lat: number; lng: number }
): Promise<AssignmentResponse> {
  try {
    const response = await client.post(`/marking-service/assignments/${jobId}/arrived`, {
      agentId,
      arrivalLocation,
      arrivedAt: new Date().toISOString(),
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to notify arrival status: ${error}`);
  }
}

/**
 * Get list of available jobs in queue for an agent
 * Used to populate job opportunities for agents
 * @param agentId - Agent user ID
 * @param filters - Optional filters (area, priority, etc.)
 * @returns Array of available jobs
 */
export async function getAvailableJobs(
  agentId: string,
  filters?: {
    area?: string;
    urgency?: string;
    maxDistance?: number;
  }
): Promise<QueueStatusResponse[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.area) params.append('area', filters.area);
    if (filters?.urgency) params.append('urgency', filters.urgency);
    if (filters?.maxDistance) params.append('maxDistance', filters.maxDistance.toString());

    const response = await client.get(
      `/marking-service/queue/agent/${agentId}/available-jobs?${params.toString()}`
    );
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch available jobs: ${error}`);
  }
}

/**
 * Handle automatic reassignment when time slot expires
 * Called by backend but accessible for admin/debugging purposes
 * @param jobId - Property marking job ID
 * @param reason - Reason for reassignment
 * @returns Reassignment confirmation
 */
export async function triggerReassignment(
  jobId: string,
  reason: string
): Promise<ReassignmentData> {
  try {
    const response = await client.post(`/marking-service/assignments/${jobId}/reassign`, {
      reason,
      reassignedAt: new Date().toISOString(),
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to trigger reassignment: ${error}`);
  }
}

/**
 * Extend time slot for an assignment (admin only, for edge cases)
 * @param jobId - Property marking job ID
 * @param extensionMinutes - Number of minutes to extend
 * @param reason - Reason for extension
 * @returns Updated assignment details
 */
export async function extendTimeSlot(
  jobId: string,
  extensionMinutes: number,
  reason: string
): Promise<AssignmentDetails> {
  try {
    const response = await client.post(
      `/marking-service/assignments/${jobId}/extend-time-slot`,
      {
        extensionMinutes,
        reason,
        extendedAt: new Date().toISOString(),
      }
    );
    return response.data;
  } catch (error) {
    throw new Error(`Failed to extend time slot: ${error}`);
  }
}

/**
 * Get assignment history for an agent
 * Shows past assignments and completion status
 * @param agentId - Agent user ID
 * @param limit - Number of records to fetch
 * @param offset - Pagination offset
 * @returns Array of past assignments
 */
export async function getAssignmentHistory(
  agentId: string,
  limit: number = 10,
  offset: number = 0
): Promise<{
  total: number;
  assignments: AssignmentDetails[];
}> {
  try {
    const response = await client.get(
      `/marking-service/assignments/history/${agentId}?limit=${limit}&offset=${offset}`
    );
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch assignment history: ${error}`);
  }
}