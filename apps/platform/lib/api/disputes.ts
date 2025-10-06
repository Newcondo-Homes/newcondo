import { apiClient } from './client';
import type { 
  DisputeRequest, 
  DisputeResponse, 
  DisputeStatusResponse,
  DisputeResolutionResponse 
} from '@/types/api';

export const disputesApi = {
  /**
   * Initiate a dispute for a rental payment
   */
  createDispute: async (data: DisputeRequest): Promise<DisputeResponse> => {
    const response = await apiClient.post('/api/disputes', data);
    return response.data;
  },

  /**
   * Get dispute details
   */
  getDispute: async (disputeId: string): Promise<DisputeStatusResponse> => {
    const response = await apiClient.get(`/api/disputes/${disputeId}`);
    return response.data;
  },

  /**
   * Get all disputes for a user
   */
  getMyDisputes: async (params?: {
    page?: number;
    limit?: number;
    status?: 'pending' | 'investigating' | 'resolved' | 'rejected';
  }): Promise<{
    disputes: DisputeStatusResponse[];
    total: number;
    page: number;
    limit: number;
  }> => {
    const response = await apiClient.get('/api/disputes/my-disputes', { params });
    return response.data;
  },

  /**
   * Upload evidence for a dispute
   */
  uploadEvidence: async (disputeId: string, files: File[]): Promise<{
    uploadedUrls: string[];
  }> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('evidence', file));

    const response = await apiClient.post(
      `/api/disputes/${disputeId}/evidence`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    );
    return response.data;
  },

  /**
   * Add comment to dispute
   */
  addComment: async (disputeId: string, comment: string): Promise<DisputeStatusResponse> => {
    const response = await apiClient.post(`/api/disputes/${disputeId}/comments`, {
      comment
    });
    return response.data;
  },

  /**
   * Cancel a dispute (only if pending)
   */
  cancelDispute: async (disputeId: string): Promise<DisputeResponse> => {
    const response = await apiClient.post(`/api/disputes/${disputeId}/cancel`);
    return response.data;
  },

  /**
   * Accept dispute resolution
   */
  acceptResolution: async (disputeId: string): Promise<DisputeResolutionResponse> => {
    const response = await apiClient.post(`/api/disputes/${disputeId}/accept-resolution`);
    return response.data;
  }
};