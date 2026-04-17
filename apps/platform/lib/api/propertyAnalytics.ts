// apps/platform/lib/api/propertyAnalytics.ts
import { apiClient } from './client';
import type {
  ComparisonData,
  AnalyticsApiResponse,
  PropertyInsights,
  RealTimeAnalyticsUpdate,
  AnalyticsEvent,
} from '@/types/analytics';
import type { AnalyticsTimePeriod } from '@/lib/constants/propertyManagement';
import type
{
  AnalyticsFilters,
  PropertyAnalyticsResponse,
  PortfolioAnalyticsResponse
} from '@/types/propertyAnalytics'


export const getPropertyAnalytics = async (
  propertyId: string,
  filters?: AnalyticsFilters
): Promise<PropertyAnalyticsResponse> => {
  const params = buildQueryParams({ ...filtersToQueryParams(filters) });
  const response = await apiClient.get<AnalyticsApiResponse<PropertyAnalyticsResponse>>(
    `/analytics/properties/${propertyId}?${params}`
  );

  if (!response.data?.success || !response.data.data) {
    throw new Error(response.data?.error ?? 'Failed to fetch property analytics');
  }
  return response.data.data;
};

export const getPortfolioAnalytics = async (
  filters?: AnalyticsFilters
): Promise<PortfolioAnalyticsResponse> => {
  const params = buildQueryParams(filtersToQueryParams(filters));
  const response = await apiClient.get<AnalyticsApiResponse<PortfolioAnalyticsResponse>>(
    `/analytics/portfolio?${params}`
  );
  if (!response.data?.success || !response.data.data) {
    throw new Error(response.data?.error ?? 'Failed to fetch portfolio analytics');
  }
  return response.data.data;
};

export const trackPropertyView = async (
  propertyId: string,
  metadata?: {
    referrer?: string;
    source?: string;
    campaign?: string;
    agentReferralCode?: string;
    subAgentId?: string;
  }
): Promise<void> => {
  const event: Partial<AnalyticsEvent> = {
    propertyId,
    timestamp: new Date(),
    metadata,
  };
  await apiClient.post(`/analytics/properties/${propertyId}/view`, {
    ...event,
    timestamp: event.timestamp!.toISOString(),
  });
};

export const trackPropertyEngagement = async (
  propertyId: string,
  duration: number,
  interactions: string[]
): Promise<void> => {
  await apiClient.post(`/analytics/properties/${propertyId}/engagement`, {
    duration,
    interactions,
    timestamp: new Date().toISOString(),
  });
};

export const getAnalyticsComparison = async (
  propertyIds: string[],
  filters?: AnalyticsFilters
): Promise<ComparisonData[]> => {
  const params = buildQueryParams({
    propertyIds: propertyIds.join(','),
    ...filtersToQueryParams(filters),
  });
  const response = await apiClient.get<AnalyticsApiResponse<ComparisonData[]>>(
    `/analytics/comparison?${params}`
  );
  if (!response.data?.success || !response.data.data) {
    throw new Error(response.data?.error ?? 'Failed to fetch comparison analytics');
  }
  return response.data.data;
};

export const getRealTimeAnalytics = async (
  propertyId?: string
): Promise<RealTimeAnalyticsUpdate[]> => {
  const endpoint = propertyId
    ? `/analytics/properties/${propertyId}/realtime`
    : '/analytics/realtime';
  const response = await apiClient.get<AnalyticsApiResponse<RealTimeAnalyticsUpdate[]>>(endpoint);
  if (!response.data?.success || !response.data.data) {
    throw new Error(response.data?.error ?? 'Failed to fetch real-time analytics');
  }
  return response.data.data;
};

export const getPropertyInsights = async (
  propertyId: string,
  timePeriod?: AnalyticsTimePeriod
): Promise<PropertyInsights> => {
  const params = timePeriod ? `?timePeriod=${timePeriod}` : '';
  const response = await apiClient.get<AnalyticsApiResponse<PropertyInsights>>(
    `/analytics/properties/${propertyId}/insights${params}`
  );
  if (!response.data?.success || !response.data.data) {
    throw new Error(response.data?.error ?? 'Failed to fetch property insights');
  }
  return response.data.data;
};

export const exportAnalytics = async (
  format: 'csv' | 'pdf' | 'excel' | 'json',
  filters?: AnalyticsFilters & { propertyIds?: string[] }
): Promise<Blob> => {
  const params = buildQueryParams({ format, ...filtersToQueryParams(filters) });
  const response = await apiClient.get(`/analytics/export?${params}`, {
    responseType: 'blob',
  });
  return response.data as Blob;
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function filtersToQueryParams(filters?: AnalyticsFilters): Record<string, string> {
  if (!filters) return {};
  const out: Record<string, string> = {};
  if (filters.startDate) out.startDate = filters.startDate.toISOString();
  if (filters.endDate) out.endDate = filters.endDate.toISOString();
  if (filters.period) out.period = filters.period;
  if (filters.timePeriod) out.timePeriod = filters.timePeriod;
  if (filters.aggregation) out.aggregation = filters.aggregation;
  if (filters.comparison) out.comparison = filters.comparison;
  if (filters.metrics?.length) out.metrics = filters.metrics.join(',');
  return out;
}

function buildQueryParams(obj: Record<string, unknown>): string {
  const params = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null) params.append(k, String(v));
  });
  return params.toString();
}