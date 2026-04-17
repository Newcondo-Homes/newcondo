import { apiClient } from './client';
import type {
  ConfirmationResponse,
  ConfirmationStatusResponse,
  DisputeInitiationResponse,
  DisputePaymentRequest,
  ConfirmPaymentRequest
} from '@/types/confirmation';

export const confirmationsApi = {
  /**
   * Get confirmation status for a rental payment
   */
  getConfirmationStatus: async (rentalId: string): Promise<ConfirmationStatusResponse> => {
    const response = await apiClient.get(`/api/confirmations/${rentalId}/status`);
    return response.data as ConfirmationStatusResponse;
  },

  /**
   * Confirm property and release payment
   */
  confirmProperty: async (
    rentalId: string,
    data: ConfirmPaymentRequest        // ← add request body
  ): Promise<ConfirmationResponse> => {
    const response = await apiClient.post(
      `/api/confirmations/${rentalId}/confirm`,
      data                              // ← pass it along
    );
    return response.data as ConfirmationResponse;
  },

  /**
   * Get remaining time in confirmation period
   */
  getConfirmationTimer: async (rentalId: string): Promise<{
    remainingTime: number;
    deadline: string;
    isExpired: boolean;
  }> => {
    const response = await apiClient.get(`/api/confirmations/${rentalId}/timer`);
    return response.data as {
      remainingTime: number;
      deadline: string;
      isExpired: boolean;
    };
  },

  /**
   * Get confirmation history for user
   */
  getConfirmationHistory: async (params?: {
    page?: number;
    limit?: number;
    status?: 'pending' | 'confirmed' | 'disputed';
  }): Promise<{
    confirmations: ConfirmationStatusResponse[];
    total: number;
    page: number;
    limit: number;
  }> => {
    const response = await apiClient.get('/api/confirmations/history', { params });
    return response.data as {
      confirmations: ConfirmationStatusResponse[];
      total: number;
      page: number;
      limit: number;
    };
  },

  disputeProperty: async (
    rentalId: string,
    data: DisputePaymentRequest
  ): Promise<DisputeInitiationResponse> => {
    const response = await apiClient.post(
      `/api/confirmations/${rentalId}/dispute`,
      data
    );
    return response.data as DisputeInitiationResponse;
  },

  /**
   * Check if property is ready for confirmation
   */
  checkPropertyReadiness: async (propertyId: string): Promise<{
    isReady: boolean;
    issues?: string[];
  }> => {
    const response = await apiClient.get(`/api/confirmations/property/${propertyId}/readiness`);
    return response.data as {
      isReady: boolean;
      issues?: string[];
    };
  }
};