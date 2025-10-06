import { apiClient } from './client';

export interface ConfirmationStats {
  totalPending: number;
  totalConfirmed: number;
  totalDisputed: number;
  averageConfirmationTime: number;
  expiringIn24Hours: number;
}

export interface PendingConfirmation {
  id: string;
  rentalId: string;
  paymentId: string;
  renterName: string;
  renterEmail: string;
  propertyTitle: string;
  propertyAddress: string;
  unitNumber?: string;
  amount: number;
  confirmationDeadline: string;
  hoursRemaining: number;
  status: 'PENDING' | 'CONFIRMED' | 'DISPUTED';
  createdAt: string;
}

export interface ConfirmationDetails extends PendingConfirmation {
  propertyId: string;
  ownerId: string;
  agentId?: string;
  commissionBreakdown: {
    rentAmount: number;
    platformFee: number;
    agentCommission?: number;
    ownerAmount: number;
  };
  paymentBreakdown: {
    flutterwaveCharge: number;
    serviceFee: number;
    totalCharged: number;
  };
}

export interface ManualConfirmationRequest {
  paymentId: string;
  reason: string;
  adminNotes?: string;
}

export interface ManualReleaseRequest {
  paymentId: string;
  reason: string;
  adminNotes?: string;
  skipValidation?: boolean;
}

export const confirmationsApi = {
  // Get confirmation statistics
  getStats: async (): Promise<ConfirmationStats> => {
    const response = await apiClient.get('/admin/confirmations/stats');
    return response.data;
  },

  // Get all pending confirmations
  getPendingConfirmations: async (params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    confirmations: PendingConfirmation[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    const response = await apiClient.get('/admin/confirmations/pending', { params });
    return response.data;
  },

  // Get confirmations expiring soon
  getExpiringConfirmations: async (hours: number = 24): Promise<PendingConfirmation[]> => {
    const response = await apiClient.get('/admin/confirmations/expiring', {
      params: { hours }
    });
    return response.data;
  },

  // Get confirmation details
  getConfirmationDetails: async (paymentId: string): Promise<ConfirmationDetails> => {
    const response = await apiClient.get(`/admin/confirmations/${paymentId}`);
    return response.data;
  },

  // Manually confirm a payment (admin override)
  manualConfirm: async (data: ManualConfirmationRequest): Promise<{
    success: boolean;
    message: string;
    paymentId: string;
  }> => {
    const response = await apiClient.post('/admin/confirmations/manual-confirm', data);
    return response.data;
  },

  // Manually release payment (admin override)
  manualRelease: async (data: ManualReleaseRequest): Promise<{
    success: boolean;
    message: string;
    paymentId: string;
    transactionIds: string[];
  }> => {
    const response = await apiClient.post('/admin/confirmations/manual-release', data);
    return response.data;
  },

  // Get confirmation history
  getConfirmationHistory: async (params?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    confirmations: PendingConfirmation[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    const response = await apiClient.get('/admin/confirmations/history', { params });
    return response.data;
  },

  // Send reminder to renter
  sendReminder: async (paymentId: string): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await apiClient.post(`/admin/confirmations/${paymentId}/remind`);
    return response.data;
  },
};