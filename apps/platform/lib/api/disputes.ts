import { apiClient } from './client';
import type {
  DisputeRequest,
  DisputeResponse,
  DisputeStatusResponse,
  DisputeResolutionResponse,
  DisputeListResponse,
} from '@/types/dispute';

export const disputesApi = {
  /**
   * Initiate a dispute for a rental payment
   */
  createDispute: async (data: DisputeRequest): Promise<DisputeResponse> => {
    const response = await apiClient.post('/api/disputes', data);
    return response.data as DisputeResponse;
  },

  /**
   * Get dispute details
   */
  getDispute: async (disputeId: string): Promise<DisputeStatusResponse> => {
    const response = await apiClient.get(`/api/disputes/${disputeId}`);
    return response.data as DisputeStatusResponse;
  },

  /**
   * Get all disputes for a user
   */
  getMyDisputes: async (params?: {
    page?: number;
    limit?: number;
    status?: 'PENDING' | 'UNDER_REVIEW' | 'INVESTIGATING' | 'RESOLVED' | 'REJECTED' | 'CANCELLED';
  }): Promise<DisputeListResponse> => {
    const response = await apiClient.get('/api/disputes/my-disputes', { params });
    return response.data as DisputeListResponse;
  },

  /**
   * Upload evidence for a dispute
   */
  uploadEvidence: async (disputeId: string, files: File[]): Promise<{
    uploadedUrls: string[];
  }> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('evidence', file));

    const response = await apiClient.uploadFiles<{ uploadedUrls: string[] }>(
      `/api/disputes/${disputeId}/evidence`,
      files  // ← use uploadFiles instead of manually building FormData
    );
    return response.data!;
  },

  /**
   * Add comment to dispute
   */
  addComment: async (disputeId: string, comment: string): Promise<DisputeStatusResponse> => {
    const response = await apiClient.post<DisputeStatusResponse>(
      `/api/disputes/${disputeId}/comments`,
      { comment }
    );
    return response.data!;
  },

  /**
   * Cancel a dispute (only if pending)
   */
  cancelDispute: async (disputeId: string): Promise<DisputeResponse> => {
    const response = await apiClient.post<DisputeResponse>(
      `/api/disputes/${disputeId}/cancel`
    );
    return response.data!;
  },

  /**
   * Accept dispute resolution
   */
  acceptResolution: async (disputeId: string): Promise<DisputeResolutionResponse> => {
    const response = await apiClient.post<DisputeResolutionResponse>(
      `/api/disputes/${disputeId}/accept-resolution`
    );
    return response.data!;
  }
};