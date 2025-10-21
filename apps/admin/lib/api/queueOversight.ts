// apps/admin/src/lib/api/queueOversight.ts

import { client } from './client';

// Types
export interface MarkingJobWithDetails {
  id: string;
  propertyId: string;
  requestedBy: string;
  assignedAgentId: string | null;
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions: string | null;
  preferredTime: string | null;
  urgencyLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  markingFee: number;
  paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'HELD' | 'RELEASED';
  status: 'QUEUED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  assignedAt: string | null;
  completedAt: string | null;
  timeSlotExpiry: string | null;
  completionNotes: string | null;
  completionImages: string[];
  queuePosition: number | null;
  maxCompletionTime: string | null;
  createdAt: string;
  updatedAt: string;
  property: {
    id: string;
    title: string;
    address: string;
    city: string;
    state: string;
  };
  requestingUser: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  };
  assignedAgent: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    agentReliabilityScore: number | null;
  } | null;
}

export interface QueueAnalytics {
  totalJobs: number;
  queuedJobs: number;
  assignedJobs: number;
  inProgressJobs: number;
  completedJobs: number;
  cancelledJobs: number;
  expiredJobs: number;
  averageCompletionTime: number; // in hours
  averageQueueWaitTime: number; // in hours
  agentPerformance: {
    agentId: string;
    agentName: string;
    totalAssigned: number;
    completed: number;
    expired: number;
    averageCompletionTime: number;
    reliabilityScore: number;
  }[];
  timeSlotUtilization: {
    date: string;
    totalSlots: number;
    usedSlots: number;
    utilizationRate: number;
  }[];
  jobsByUrgency: {
    LOW: number;
    NORMAL: number;
    HIGH: number;
    URGENT: number;
  };
  jobsByStatus: {
    QUEUED: number;
    ASSIGNED: number;
    IN_PROGRESS: number;
    COMPLETED: number;
    CANCELLED: number;
    EXPIRED: number;
  };
  revenueMetrics: {
    totalRevenue: number;
    platformRevenue: number; // 75% of total
    agentPayouts: number; // 25% of total
    pendingPayouts: number;
  };
}

export interface GetAllJobsParams {
  page?: number;
  limit?: number;
  status?: string;
  urgency?: string;
  searchTerm?: string;
  sortBy?: 'createdAt' | 'assignedAt' | 'completedAt' | 'queuePosition';
  sortOrder?: 'asc' | 'desc';
  dateFrom?: string;
  dateTo?: string;
}

export interface GetAllJobsResponse {
  jobs: MarkingJobWithDetails[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface JobAction {
  jobId: string;
  action: 'CANCEL' | 'REASSIGN' | 'EXTEND_DEADLINE' | 'MARK_COMPLETED';
  reason?: string;
  newAgentId?: string;
  extensionHours?: number;
}

// API Functions
export const queueOversightApi = {
  // Get all marking jobs with filters
  getAllJobs: async (params: GetAllJobsParams = {}): Promise<GetAllJobsResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.urgency) queryParams.append('urgency', params.urgency);
    if (params.searchTerm) queryParams.append('search', params.searchTerm);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params.dateTo) queryParams.append('dateTo', params.dateTo);

    const response = await client.get<GetAllJobsResponse>(
      `/admin/marking-oversight/jobs?${queryParams.toString()}`
    );
    return response.data;
  },

  // Get single job details
  getJobById: async (jobId: string): Promise<MarkingJobWithDetails> => {
    const response = await client.get<MarkingJobWithDetails>(
      `/admin/marking-oversight/jobs/${jobId}`
    );
    return response.data;
  },

  // Get queue analytics
  getQueueAnalytics: async (dateFrom?: string, dateTo?: string): Promise<QueueAnalytics> => {
    const queryParams = new URLSearchParams();
    if (dateFrom) queryParams.append('dateFrom', dateFrom);
    if (dateTo) queryParams.append('dateTo', dateTo);

    const response = await client.get<QueueAnalytics>(
      `/admin/marking-oversight/analytics?${queryParams.toString()}`
    );
    return response.data;
  },

  // Perform action on a job
  performJobAction: async (action: JobAction): Promise<{ success: boolean; message: string }> => {
    const response = await client.post<{ success: boolean; message: string }>(
      `/admin/marking-oversight/jobs/${action.jobId}/action`,
      action
    );
    return response.data;
  },

  // Reassign job to different agent
  reassignJob: async (jobId: string, newAgentId: string, reason: string): Promise<{ success: boolean; message: string }> => {
    const response = await client.post<{ success: boolean; message: string }>(
      `/admin/marking-oversight/jobs/${jobId}/reassign`,
      { newAgentId, reason }
    );
    return response.data;
  },

  // Cancel marking job
  cancelJob: async (jobId: string, reason: string): Promise<{ success: boolean; message: string }> => {
    const response = await client.post<{ success: boolean; message: string }>(
      `/admin/marking-oversight/jobs/${jobId}/cancel`,
      { reason }
    );
    return response.data;
  },

  // Extend job deadline
  extendDeadline: async (jobId: string, extensionHours: number, reason: string): Promise<{ success: boolean; message: string }> => {
    const response = await client.post<{ success: boolean; message: string }>(
      `/admin/marking-oversight/jobs/${jobId}/extend`,
      { extensionHours, reason }
    );
    return response.data;
  },

  // Get agents available for reassignment
  getAvailableAgents: async (propertyCity: string, propertyState: string) => {
    const response = await client.get<{
      agents: {
        id: string;
        name: string;
        email: string;
        phone: string;
        agentReliabilityScore: number;
        totalMarkingJobs: number;
        completedMarkingJobs: number;
        currentActiveJobs: number;
      }[];
    }>(`/admin/marking-oversight/available-agents?city=${propertyCity}&state=${propertyState}`);
    return response.data;
  },

  // Export jobs data
  exportJobs: async (params: GetAllJobsParams = {}): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    
    if (params.status) queryParams.append('status', params.status);
    if (params.urgency) queryParams.append('urgency', params.urgency);
    if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params.dateTo) queryParams.append('dateTo', params.dateTo);

    const response = await client.get(
      `/admin/marking-oversight/jobs/export?${queryParams.toString()}`,
      { responseType: 'blob' }
    );
    return response.data;
  },
};