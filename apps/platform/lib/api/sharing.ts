import { client } from './client';

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
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to create shareable link'
    );
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
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw new Error(
      error.response?.data?.message || 'Failed to get shareable link'
    );
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
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to resolve share link'
    );
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
    return response.data;
  } catch (error: any) {
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
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to deactivate share link'
    );
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
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to regenerate share link'
    );
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
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to get share link stats'
    );
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
    return response.data.links;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to fetch user share links'
    );
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
    return response.data.links;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to bulk create share links'
    );
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
  } catch (error: any) {
    console.error('Failed to copy share link:', error);
    return { success: false };
  }
}