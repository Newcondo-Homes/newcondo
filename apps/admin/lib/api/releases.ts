import { apiClient } from './client';

export interface ReleaseStats {
  totalReleases: number;
  totalAmountReleased: number;
  pendingReleases: number;
  failedReleases: number;
  averageReleaseTime: number;
}

export interface PendingRelease {
  id: string;
  paymentId: string;
  rentalId: string;
  propertyTitle: string;
  unitNumber?: string;
  amount: number;
  confirmationPeriodEnd: string;
  hoursUntilRelease: number;
  status: 'PENDING' | 'READY' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  recipients: {
    owner: { name: string; amount: number };
    agent?: { name: string; amount: number };
    platform: { amount: number };
  };
  createdAt: string;
}

export interface ReleaseDetails extends PendingRelease {
  propertyId: string;
  ownerId: string;
  agentId?: string;
  renterName: string;
  renterEmail: string;
  commissionBreakdown: {
    rentAmount: number;
    platformCommission: number;
    agentCommission?: number;
    subAgentCommission?: number;
    ownerAmount: number;
  };
  distributionPlan: {
    recipient: string;
    accountNumber: string;
    bankCode: string;
    amount: number;
    status: 'PENDING' | 'SUCCESS' | 'FAILED';
    transactionId?: string;
    failureReason?: string;
  }[];
  releaseScheduledAt?: string;
  releasedAt?: string;
  failureReason?: string;
}

export interface ScheduleReleaseRequest {
  paymentId: string;
  scheduledAt?: string;
  adminNotes?: string;
}

export interface RetryReleaseRequest {
  paymentId: string;
  retryFailedOnly?: boolean;
  adminNotes?: string;
}

export const releasesApi = {
  // Get release statistics
  getStats: async (): Promise<ReleaseStats> => {
    const response = await apiClient.get('/admin/releases/stats');
    return response.data;
  },

  // Get pending releases
  getPendingReleases: async (params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    releases: PendingRelease[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    const response = await apiClient.get('/admin/releases/pending', { params });
    return response.data;
  },

  // Get releases ready for processing
  getReadyReleases: async (): Promise<PendingRelease[]> => {
    const response = await apiClient.get('/admin/releases/ready');
    return response.data;
  },

  // Get release details
  getReleaseDetails: async (paymentId: string): Promise<ReleaseDetails> => {
    const response = await apiClient.get(`/admin/releases/${paymentId}`);
    return response.data;
  },

  // Schedule release
  scheduleRelease: async (data: ScheduleReleaseRequest): Promise<{
    success: boolean;
    message: string;
    paymentId: string;
    scheduledAt: string;
  }> => {
    const response = await apiClient.post('/admin/releases/schedule', data);
    return response.data;
  },

  // Trigger immediate release
  triggerRelease: async (paymentId: string, adminNotes?: string): Promise<{
    success: boolean;
    message: string;
    paymentId: string;
    transactionIds: string[];
  }> => {
    const response = await apiClient.post(`/admin/releases/${paymentId}/trigger`, {
      adminNotes
    });
    return response.data;
  },

  // Retry failed release
  retryRelease: async (data: RetryReleaseRequest): Promise<{
    success: boolean;
    message: string;
    paymentId: string;
    transactionIds: string[];
  }> => {
    const response = await apiClient.post('/admin/releases/retry', data);
    return response.data;
  },

  // Get release history
  getReleaseHistory: async (params?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    releases: PendingRelease[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    const response = await apiClient.get('/admin/releases/history', { params });
    return response.data;
  },

  // Get failed releases
  getFailedReleases: async (): Promise<PendingRelease[]> => {
    const response = await apiClient.get('/admin/releases/failed');
    return response.data;
  },
};