import client from './client';
import type { AxiosError } from 'axios';

// ✅ Typed axios error shape
interface ApiErrorResponse {
  message?: string;
}

// ✅ Helper to extract error message
function getErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as AxiosError<ApiErrorResponse>;
  return axiosError.response?.data?.message ?? fallback;
}

export interface ShareableLink {
  id: string;
  propertyId: string;
  unitId?: string;
  shareUrl: string;
  shortCode: string;
  createdBy: string;
  viewCount: number;
  expiresAt?: string;
  isActive: boolean;
  metadata?: {
    source?: string;
    campaign?: string;
    medium?: string;
  };
}

export interface CreateShareLinkRequest {
  propertyId: string;
  unitId?: string;
  expiresInDays?: number;
  metadata?: {
    source?: string;
    campaign?: string;
    medium?: string;
  };
}

export interface ShareLinkStats {
  totalViews: number;
  uniqueViews: number;
  clickThroughRate: number;
  topSources: Array<{
    source: string;
    count: number;
  }>;
  viewsByDate: Array<{
    date: string;
    views: number;
  }>;
}

/**
 * Generate a shareable link for a property or unit
 */
export async function createShareableLink(
  data: CreateShareLinkRequest
): Promise<ShareableLink> {
  try {
    const response = await client.post<ShareableLink>(
      '/api/sharing/create',
      data
    );
    return response.data as ShareableLink;
  } catch (error: unknown) {
    throw new Error(
      getErrorMessage(error, 'Failed to create shareable link'));
  }
}

/**
 * Get shareable link for a property
 */
export async function getShareableLink(
  propertyId: string,
  unitId?: string
): Promise<ShareableLink | null> {
  try {
    const params = new URLSearchParams({ propertyId });
    if (unitId) params.append('unitId', unitId);

    const response = await client.get<ShareableLink>(
      `/api/sharing/link?${params.toString()}`
    );
    return response.data as ShareableLink | null;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    if (axiosError.response?.status === 404) return null;
    throw new Error(getErrorMessage(error, 'Failed to get shareable link'));
  }
}

/**
 * Get property by short code
 */
export async function getPropertyByShortCode(shortCode: string): Promise<{
  propertyId: string;
  unitId?: string;
  isAvailable: boolean;
}> {
  try {
    const response = await client.get(`/api/sharing/resolve/${shortCode}`);
    return response.data as {
      propertyId: string;
      unitId?: string;
      isAvailable: boolean;
    };
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Failed to resolve share link'));
  }
}

/**
 * Track share link view
 */
export async function trackShareLinkView(
  shortCode: string,
  metadata?: {
    referrer?: string;
    userAgent?: string;
    ipAddress?: string;
  }
): Promise<{ success: boolean }> {
  try {
    const response = await client.post(`/api/sharing/${shortCode}/view`, {
      metadata,
    });
    return response.data as { success: boolean };
  } catch (error: unknown) {
    // Don't throw error for tracking failures
    console.error('Failed to track share link view:', error);
    return { success: false };
  }
}

/**
 * Deactivate shareable link
 */
export async function deactivateShareLink(linkId: string): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const response = await client.post(`/api/sharing/${linkId}/deactivate`);
    return response.data as {
      success: boolean;
      message?: string;
    };
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Failed to deactivate share link'));
  }
}

/**
 * Regenerate shareable link
 */
export async function regenerateShareLink(
  propertyId: string,
  unitId?: string
): Promise<ShareableLink> {
  try {
    const response = await client.post<ShareableLink>(
      '/api/sharing/regenerate',
      {
        propertyId,
        unitId,
      }
    );
    return response.data as ShareableLink;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Failed to deactivate share link'));
  }
}

/**
 * Get share link statistics
 */
export async function getShareLinkStats(
  linkId: string,
  startDate?: string,
  endDate?: string
): Promise<ShareLinkStats> {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await client.get<ShareLinkStats>(
      `/api/sharing/${linkId}/stats?${params.toString()}`
    );
    return response.data as ShareLinkStats;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Failed to deactivate share link'));
  }
}

/**
 * Get user's shareable links
 */
export async function getUserShareLinks(): Promise<ShareableLink[]> {
  try {
    const response = await client.get<{ links: ShareableLink[] }>(
      '/api/sharing/user-links'
    );
    return response.data?.links as ShareableLink[];
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Failed to deactivate share link'));
  }
}

/**
 * Bulk create shareable links
 */
export async function bulkCreateShareLinks(
  properties: Array<{ propertyId: string; unitId?: string }>
): Promise<ShareableLink[]> {
  try {
    const response = await client.post<{ links: ShareableLink[] }>(
      '/api/sharing/bulk-create',
      { properties }
    );
    return response.data?.links as ShareableLink[];
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, 'Failed to deactivate share link'));
  }
}

/**
 * Copy share link to clipboard and track action
 */
export async function copyShareLink(
  shareUrl: string,
  shortCode: string
): Promise<{ success: boolean }> {
  try {
    await navigator.clipboard.writeText(shareUrl);

    // Track copy action
    await client.post(`/api/sharing/${shortCode}/copy`);

    return { success: true };
  } catch (error: unknown) {
    console.error('Failed to copy share link:', error);
    return { success: false };
  }
}