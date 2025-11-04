// apps/platform/lib/api/subAgents.ts
import { apiClient } from './client';

export interface SubAgentFilters {
  propertyId?: string;
  status?: 'PENDING' | 'APPROVED' | 'REVOKED';
  sortBy?: 'earnings' | 'views' | 'conversions' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Get sub-agents
export const getSubAgents = async (filters?: SubAgentFilters) => {
  const params = new URLSearchParams();
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
  }
  
  const response = await apiClient.get(`/sub-agents?${params.toString()}`);
  return response.data;
};

// Approve sub-agent
export const approveSubAgent = async (subAgentId: string, propertyId: string) => {
  const response = await apiClient.post(`/sub-agents/${subAgentId}/approve`, { propertyId });
  return response.data;
};

// Revoke sub-agent access
export const revokeSubAgent = async (subAgentId: string, propertyId: string) => {
  const response = await apiClient.post(`/sub-agents/${subAgentId}/revoke`, { propertyId });
  return response.data;
};

// Get sub-agent performance
export const getSubAgentPerformance = async (subAgentId: string, propertyId?: string) => {
  const params = propertyId ? `?propertyId=${propertyId}` : '';
  const response = await apiClient.get(`/sub-agents/${subAgentId}/performance${params}`);
  return response.data;
};

// Generate promotion link
export const generatePromotionLink = async (propertyId: string) => {
  const response = await apiClient.post(`/properties/${propertyId}/promotion-link`);
  return response.data;
};

// Request promotion access
export const requestPromotionAccess = async (propertyId: string, message?: string) => {
  const response = await apiClient.post(`/properties/${propertyId}/request-promotion`, {
    message,
  });
  return response.data;
};

// Get promotion link stats
export const getPromotionLinkStats = async (propertyId: string, linkId?: string) => {
  const params = linkId ? `?linkId=${linkId}` : '';
  const response = await apiClient.get(`/properties/${propertyId}/promotion-stats${params}`);
  return response.data;
};

// Update promotion settings
export const updatePromotionSettings = async (
  propertyId: string,
  settings: {
    allowPublicPromotion?: boolean;
    allowPermissionBasedPromotion?: boolean;
    requireApproval?: boolean;
    commissionSplitPercentage?: number;
  }
) => {
  const response = await apiClient.patch(
    `/properties/${propertyId}/promotion-settings`,
    settings
  );
  return response.data;
};

// Get promotion settings
export const getPromotionSettings = async (propertyId: string) => {
  const response = await apiClient.get(`/properties/${propertyId}/promotion-settings`);
  return response.data;
};

// Get sub-agent list for property
export const getPropertySubAgents = async (propertyId: string) => {
  const response = await apiClient.get(`/properties/${propertyId}/sub-agents`);
  return response.data;
};

// Bulk approve sub-agents
export const bulkApproveSubAgents = async (subAgentIds: string[], propertyId: string) => {
  const response = await apiClient.post('/sub-agents/bulk-approve', {
    subAgentIds,
    propertyId,
  });
  return response.data;
};

// Bulk revoke sub-agents
export const bulkRevokeSubAgents = async (subAgentIds: string[], propertyId: string) => {
  const response = await apiClient.post('/sub-agents/bulk-revoke', {
    subAgentIds,
    propertyId,
  });
  return response.data;
};