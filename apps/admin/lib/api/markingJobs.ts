/**
 * Marking Jobs API Client
 * Handles property marking job oversight, agent queue management, and job monitoring
 */

import { apiClient } from './client';

export interface MarkingJob {
  id: string;
  propertyId: string;
  requestedBy: string;
  assignedAgentId?: string;
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions?: string;
  preferredTime?: string;
  urgencyLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  markingFee: number;
  paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | 'HELD' | 'RELEASED';
  status: 'QUEUED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  assignedAt?: string;
  completedAt?: string;
  timeSlotExpiry?: string;
  completionNotes?: string;
  completionImages?: string[];
  boundaryData?: any;
  queuePosition?: number;
  maxCompletionTime?: string;
  property: {
    id: string;
    title: string;
    address: string;
    city: string;
    state: string;
    coordinates?: any;
  };
  requestingUser: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
  };
  assignedAgent?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    reliabilityScore?: number;
    totalMarkingJobs: number;
    completedMarkingJobs: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MarkingJobStats {
  totalJobs: number;
  queued: number;
  assigned: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  expired: number;
  avgCompletionTime: number; // in hours
  avgQueueTime: number; // in hours
  activeAgents: number;
}

export interface AgentQueueInfo {
  agentId: string;
  agent: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    isAvailableForMarking: boolean;
    agentServiceAreas: string[];
    agentReliabilityScore?: number;
    totalMarkingJobs: number;
    completedMarkingJobs: number;
  };
  currentJob?: {
    id: string;
    propertyAddress: string;
    timeSlotExpiry: string;
  };
  queuePosition?: number;
  lastCompletedJob?: string;
  performance: {
    completionRate: number;
    averageRating: number;
    timeoutCount: number;
  };
}

export interface ReassignJobPayload {
  jobId: string;
  newAgentId?: string;
  reason: string;
  notifyOldAgent?: boolean;
  notifyNewAgent?: boolean;
}

export interface JobQualityReview {
  jobId: string;
  rating: number;
  qualityScore: number;
  issues: string[];
  approved: boolean;
  feedback: string;
}

/**
 * Get all marking jobs
 */
export async function getMarkingJobs(params?: {
  page?: number;
  limit?: number;
  status?: string;
  urgencyLevel?: string;
  city?: string;
  state?: string;
  agentId?: string;
  requestedBy?: string;
}) {
  const response = await apiClient.get<{
    jobs: MarkingJob[];
    total: number;
    page: number;
    totalPages: number;
  }>('/admin/marking-jobs', { params });
  return response.data;
}

/**
 * Get marking job statistics
 */
export async function getMarkingJobStats() {
  const response = await apiClient.get<MarkingJobStats>('/admin/marking-jobs/stats');
  return response.data;
}

/**
 * Get single marking job details
 */
export async function getMarkingJobDetails(jobId: string) {
  const response = await apiClient.get<MarkingJob>(`/admin/marking-jobs/${jobId}`);
  return response.data;
}

/**
 * Get agent queue overview
 */
export async function getAgentQueue(params?: {
  page?: number;
  limit?: number;
  city?: string;
  state?: string;
  availableOnly?: boolean;
}) {
  const response = await apiClient.get<{
    agents: AgentQueueInfo[];
    total: number;
    page: number;
    totalPages: number;
  }>('/admin/marking-jobs/agent-queue', { params });
  return response.data;
}

/**
 * Get jobs by status
 */
export async function getJobsByStatus(status: string, params?: {
  page?: number;
  limit?: number;
}) {
  const response = await apiClient.get<{
    jobs: MarkingJob[];
    total: number;
    page: number;
    totalPages: number;
  }>(`/admin/marking-jobs/status/${status}`, { params });
  return response.data;
}

/**
 * Reassign marking job
 */
export async function reassignJob(payload: ReassignJobPayload) {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
    job: MarkingJob;
  }>('/admin/marking-jobs/reassign', payload);
  return response.data;
}

/**
 * Cancel marking job
 */
export async function cancelMarkingJob(jobId: string, reason: string, refund: boolean) {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
  }>(`/admin/marking-jobs/${jobId}/cancel`, { reason, refund });
  return response.data;
}

/**
 * Extend time slot for agent
 */
export async function extendTimeSlot(jobId: string, additionalHours: number, reason: string) {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
    newExpiry: string;
  }>(`/admin/marking-jobs/${jobId}/extend-time`, { additionalHours, reason });
  return response.data;
}

/**
 * Review job quality
 */
export async function reviewJobQuality(review: JobQualityReview) {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
  }>('/admin/marking-jobs/review-quality', review);
  return response.data;
}

/**
 * Get expired/timeout jobs
 */
export async function getExpiredJobs(params?: {
  page?: number;
  limit?: number;
}) {
  const response = await apiClient.get<{
    jobs: MarkingJob[];
    total: number;
    page: number;
    totalPages: number;
  }>('/admin/marking-jobs/expired', { params });
  return response.data;
}

/**
 * Manually complete job (emergency override)
 */
export async function manuallyCompleteJob(
  jobId: string,
  completionNotes: string,
  boundaryData?: any
) {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
  }>(`/admin/marking-jobs/${jobId}/manual-complete`, {
    completionNotes,
    boundaryData,
  });
  return response.data;
}

/**
 * Get agent performance metrics
 */
export async function getAgentPerformance(agentId: string, params?: {
  startDate?: string;
  endDate?: string;
}) {
  const response = await apiClient.get<{
    agent: AgentQueueInfo['agent'];
    metrics: {
      totalJobs: number;
      completedJobs: number;
      cancelledJobs: number;
      expiredJobs: number;
      completionRate: number;
      averageCompletionTime: number; // hours
      averageRating: number;
      totalEarnings: number;
      recentJobs: MarkingJob[];
    };
  }>(`/admin/marking-jobs/agents/${agentId}/performance`, { params });
  return response.data;
}

/**
 * Suspend agent from marking jobs
 */
export async function suspendAgent(agentId: string, reason: string, duration?: number) {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
  }>(`/admin/marking-jobs/agents/${agentId}/suspend`, {
    reason,
    duration, // days
  });
  return response.data;
}

/**
 * Reactivate suspended agent
 */
export async function reactivateAgent(agentId: string, notes?: string) {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
  }>(`/admin/marking-jobs/agents/${agentId}/reactivate`, { notes });
  return response.data;
}

/**
 * Get job history/timeline
 */
export async function getJobHistory(jobId: string) {
  const response = await apiClient.get<{
    history: Array<{
      id: string;
      action: string;
      performedBy?: string;
      performedAt: string;
      details: any;
    }>;
  }>(`/admin/marking-jobs/${jobId}/history`);
  return response.data;
}

/**
 * Broadcast urgent job to all available agents
 */
export async function broadcastUrgentJob(jobId: string, message?: string) {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
    notifiedAgents: number;
  }>(`/admin/marking-jobs/${jobId}/broadcast`, { message });
  return response.data;
}