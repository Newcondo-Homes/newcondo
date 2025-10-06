import { apiClient } from './client';
import type { 
  PaymentReleaseResponse, 
  ReleaseScheduleResponse,
  CommissionBreakdownResponse 
} from '@/types/api';

export const releasesApi = {
  /**
   * Get payment release status
   */
  getReleaseStatus: async (paymentId: string): Promise<PaymentReleaseResponse> => {
    const response = await apiClient.get(`/api/releases/${paymentId}/status`);
    return response.data;
  },

  /**
   * Get scheduled releases for a user
   */
  getScheduledReleases: async (params?: {
    page?: number;
    limit?: number;
    status?: 'pending' | 'processing' | 'completed' | 'failed';
  }): Promise<{
    releases: ReleaseScheduleResponse[];
    total: number;
    page: number;
    limit: number;
  }> => {
    const response = await apiClient.get('/api/releases/scheduled', { params });
    return response.data;
  },

  /**
   * Get commission breakdown for a payment
   */
  getCommissionBreakdown: async (paymentId: string): Promise<CommissionBreakdownResponse> => {
    const response = await apiClient.get(`/api/releases/${paymentId}/commission-breakdown`);
    return response.data;
  },

  /**
   * Get release history
   */
  getReleaseHistory: async (params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    releases: PaymentReleaseResponse[];
    total: number;
    totalAmount: number;
    page: number;
    limit: number;
  }> => {
    const response = await apiClient.get('/api/releases/history', { params });
    return response.data;
  },

  /**
   * Manually trigger release (admin only - for testing)
   */
  triggerManualRelease: async (paymentId: string): Promise<PaymentReleaseResponse> => {
    const response = await apiClient.post(`/api/releases/${paymentId}/manual-trigger`);
    return response.data;
  },

  /**
   * Get estimated release date for a payment
   */
  getEstimatedReleaseDate: async (paymentId: string): Promise<{
    estimatedDate: string;
    confirmationDeadline: string;
    daysRemaining: number;
  }> => {
    const response = await apiClient.get(`/api/releases/${paymentId}/estimated-date`);
    return response.data;
  }
};