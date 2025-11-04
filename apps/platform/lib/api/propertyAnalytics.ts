// apps/platform/lib/api/propertyAnalytics.ts
import { apiClient } from './client';

export interface AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  period?: 'day' | 'week' | 'month' | 'year' | 'all';
  metrics?: string[];
}

// Get property analytics
export const getPropertyAnalytics = async (
  propertyId?: string,
  filters?: AnalyticsFilters
) => {
  const params = new URLSearchParams();
  
  if (propertyId) {
    params.append('propertyId', propertyId);
  }
  
  if (filters) {
    if (filters.startDate) {
      params.append('startDate', filters.startDate.toISOString());
    }
    if (filters.endDate) {
      params.append('endDate', filters.endDate.toISOString());
    }
    if (filters.period) {
      params.append('period', filters.period);
    }
    if (filters.metrics) {
      params.append('metrics', filters.metrics.join(','));
    }
  }
  
  const endpoint = propertyId 
    ? `/analytics/properties/${propertyId}` 
    : '/analytics/portfolio';
  
  const response = await apiClient.get(`${endpoint}?${params.toString()}`);
  return response.data;
};

// Track property view
export const trackPropertyView = async (
  propertyId: string,
  metadata?: {
    referrer?: string;
    source?: string;
    campaign?: string;
    agentReferralCode?: string;
    subAgentId?: string;
  }
) => {
  const response = await apiClient.post(`/analytics/properties/${propertyId}/view`, {
    metadata,
    timestamp: new Date().toISOString(),
  });
  return response.data;
};

// Track property engagement
export const trackPropertyEngagement = async (
  propertyId: string,
  duration: number,
  interactions: string[]
) => {
  const response = await apiClient.post(`/analytics/properties/${propertyId}/engagement`, {
    duration,
    interactions,
    timestamp: new Date().toISOString(),
  });
  return response.data;
};

// Get portfolio analytics
export const getPortfolioAnalytics = async (filters?: AnalyticsFilters) => {
  return getPropertyAnalytics(undefined, filters);
};

// Get analytics comparison
export const getAnalyticsComparison = async (
  propertyIds: string[],
  filters?: AnalyticsFilters
) => {
  const params = new URLSearchParams();
  
  params.append('propertyIds', propertyIds.join(','));
  
  if (filters) {
    if (filters.startDate) {
      params.append('startDate', filters.startDate.toISOString());
    }
    if (filters.endDate) {
      params.append('endDate', filters.endDate.toISOString());
    }
    if (filters.period) {
      params.append('period', filters.period);
    }
  }
  
  const response = await apiClient.get(`/analytics/comparison?${params.toString()}`);
  return response.data;
};

// Get real-time analytics
export const getRealTimeAnalytics = async (propertyId?: string) => {
  const endpoint = propertyId 
    ? `/analytics/properties/${propertyId}/realtime` 
    : '/analytics/realtime';
  
  const response = await apiClient.get(endpoint);
  return response.data;
};