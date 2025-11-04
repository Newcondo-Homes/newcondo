// apps/platform/lib/api/markingHistory.ts
import { apiClient } from './client';

export interface MarkingHistoryFilters {
  propertyId?: string;
  status?: 'QUEUED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface CreateMarkingJobData {
  propertyId: string;
  assignmentType: 'SELF' | 'NEWCONDO_ADMIN' | 'SEND_LINK' | 'ASSIGN_AGENTS';
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions?: string;
  preferredTime?: Date;
  urgencyLevel?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  shareableLink?: string;
}

export interface CompleteMarkingData {
  completionNotes?: string;
  completionImages: string[];
  boundaryCoordinates: any;
  buildingFingerprint?: string;
}

// Get marking history
export const getMarkingHistory = async (filters?: MarkingHistoryFilters) => {
  const params = new URLSearchParams();
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof Date) {
          params.append(key, value.toISOString());
        } else {
          params.append(key, String(value));
        }
      }
    });
  }
  
  const response = await apiClient.get(`/marking-jobs/history?${params.toString()}`);
  return response.data;
};

// Get marking job details
export const getMarkingJobDetails = async (jobId: string) => {
  const response = await apiClient.get(`/marking-jobs/${jobId}`);
  return response.data;
};

// Create marking job
export const createMarkingJob = async (data: CreateMarkingJobData) => {
  const response = await apiClient.post('/marking-jobs', data);
  return response.data;
};

// Accept marking job (for agents)
export const acceptMarkingJob = async (jobId: string) => {
  const response = await apiClient.post(`/marking-jobs/${jobId}/accept`);
  return response.data;
};

// Complete marking job (for agents)
export const completeMarkingJob = async (jobId: string, data: CompleteMarkingData) => {
  const response = await apiClient.post(`/marking-jobs/${jobId}/complete`, data);
  return response.data;
};

// Cancel marking job
export const cancelMarkingJob = async (jobId: string, reason?: string) => {
  const response = await apiClient.post(`/marking-jobs/${jobId}/cancel`, { reason });
  return response.data;
};

// Confirm marking completion (for property owners)
export const confirmMarkingCompletion = async (
  jobId: string,
  approved: boolean,
  feedback?: string
) => {
  const response = await apiClient.post(`/marking-jobs/${jobId}/confirm`, {
    approved,
    feedback,
  });
  return response.data;
};

// Get marking job queue position
export const getQueuePosition = async (jobId: string) => {
  const response = await apiClient.get(`/marking-jobs/${jobId}/queue-position`);
  return response.data;
};

// Get available marking jobs (for agents)
export const getAvailableMarkingJobs = async (filters?: {
  maxDistance?: number;
  urgencyLevel?: string;
  limit?: number;
}) => {
  const params = new URLSearchParams();
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
  }
  
  const response = await apiClient.get(`/marking-jobs/available?${params.toString()}`);
  return response.data;
};

// Get marking job payment status
export const getMarkingJobPaymentStatus = async (jobId: string) => {
  const response = await apiClient.get(`/marking-jobs/${jobId}/payment-status`);
  return response.data;
};

// Request marking job extension
export const requestJobExtension = async (jobId: string, reason: string) => {
  const response = await apiClient.post(`/marking-jobs/${jobId}/request-extension`, {
    reason,
  });
  return response.data;
};

// Get marking stats
export const getMarkingStats = async () => {
  const response = await apiClient.get('/marking-jobs/stats');
  return response.data;
};