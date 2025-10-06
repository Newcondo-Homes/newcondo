import { apiClient } from './client';
import type { 
  ConfirmationResponse, 
  ConfirmationStatusResponse,
  DisputeInitiationResponse 
} from '@/types/api';

export const confirmationsApi = {
  /**
   * Get confirmation status for a rental payment
   */
  getConfirmationStatus: async (rentalId: string): Promise<ConfirmationStatusResponse> => {
    const response = await apiClient.get(`/api/confirmations/${rentalId}/status`);
    return response.data;
  },

  /**
   * Confirm property and release payment
   */
  confirmProperty: async (rentalId: string): Promise<ConfirmationResponse> => {
    const response = await apiClient.post(`/api/confirmations/${rentalId}/confirm`);
    return response.data;
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
    return response.data;
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
    return response.data;
  },

  /**
   * Check if property is ready for confirmation
   */
  checkPropertyReadiness: async (propertyId: string): Promise<{
    isReady: boolean;
    issues?: string[];
  }> => {
    const response = await apiClient.get(`/api/confirmations/property/${propertyId}/readiness`);
    return response.data;
  }
};