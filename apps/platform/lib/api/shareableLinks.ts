// apps/platform/lib/api/shareableLinks.ts
import { apiClient } from './client';

/**
 * Shareable Links API Client
 * Handles generation and validation of shareable marking links
 */

export interface ShareableLinkData {
  id: string;
  propertyId: string;
  markingJobId: string;
  token: string;
  url: string;
  expiresAt: string;
  isActive: boolean;
  usedAt?: string;
  usedBy?: string;
  createdAt: string;
}

export interface GenerateShareableLinkRequest {
  markingJobId: string;
  expiresInHours?: number; // Default 72 hours (3 days)
  contactPersonName?: string;
  contactPersonPhone?: string;
}

export interface GenerateShareableLinkResponse {
  success: boolean;
  data: ShareableLinkData;
  message: string;
}

export interface ValidateShareableLinkRequest {
  token: string;
}

export interface ValidateShareableLinkResponse {
  success: boolean;
  data: {
    isValid: boolean;
    markingJob?: {
      id: string;
      propertyId: string;
      propertyTitle: string;
      propertyAddress: string;
      contactPersonName: string;
      contactPersonPhone: string;
      accessInstructions?: string;
      gpsCoordinates?: {
        lat: number;
        lng: number;
      };
      propertyImages?: string[];
      status: string;
    };
    expiresAt?: string;
    reason?: string; // Why invalid (expired, used, cancelled, etc.)
  };
  message: string;
}

export interface RevokeShareableLinkRequest {
  linkId: string;
  reason?: string;
}

export interface RevokeShareableLinkResponse {
  success: boolean;
  message: string;
}

export interface ShareableLinkUsageRequest {
  token: string;
  boundaryData: {
    coordinates: Array<{ lat: number; lng: number }>;
    center: { lat: number; lng: number };
    area?: number;
  };
  completionImages: string[]; // URLs from UploadThing
  completionNotes?: string;
}

export interface ShareableLinkUsageResponse {
  success: boolean;
  data: {
    markingJobId: string;
    status: string;
    completedAt: string;
  };
  message: string;
}

/**
 * Generate a shareable link for property marking
 */
export async function generateShareableLink(
  data: GenerateShareableLinkRequest
): Promise<GenerateShareableLinkResponse> {
  const response = await apiClient.post<GenerateShareableLinkResponse>(
    '/api/marking/shareable-links/generate',
    data
  );
  return response.data as GenerateShareableLinkResponse;
}

/**
 * Validate a shareable link token
 */
export async function validateShareableLink(
  token: string
): Promise<ValidateShareableLinkResponse> {
  const response = await apiClient.get<ValidateShareableLinkResponse>(
    `/api/marking/shareable-links/validate/${token}`
  );
  return response.data as ValidateShareableLinkResponse;
}

/**
 * Revoke/cancel a shareable link
 */
export async function revokeShareableLink(
  data: RevokeShareableLinkRequest
): Promise<RevokeShareableLinkResponse> {
  const response = await apiClient.post<RevokeShareableLinkResponse>(
    '/api/marking/shareable-links/revoke',
    data
  );
  return response.data as RevokeShareableLinkResponse;
}

/**
 * Use a shareable link to mark a property
 */
export async function useShareableLink(
  data: ShareableLinkUsageRequest
): Promise<ShareableLinkUsageResponse> {
  const response = await apiClient.post<ShareableLinkUsageResponse>(
    '/api/marking/shareable-links/use',
    data
  );
  return response.data as ShareableLinkUsageResponse;
}

/**
 * Get all shareable links for a user's marking jobs
 */
export async function getMyShareableLinks(): Promise<{
  success: boolean;
  data: ShareableLinkData[];
}> {
  const response = await apiClient.get('/api/marking/shareable-links/my-links');
  return response.data as {
    success: boolean;
    data: ShareableLinkData[];
  };
}

/**
 * Get shareable link details by ID
 */
export async function getShareableLinkById(linkId: string): Promise<{
  success: boolean;
  data: ShareableLinkData;
}> {
  const response = await apiClient.get(
    `/api/marking/shareable-links/${linkId}`
  );
  return response.data as {
    success: boolean;
    data: ShareableLinkData;
  };
}

/**
 * Resend shareable link (generates new token)
 */
export async function resendShareableLink(linkId: string): Promise<{
  success: boolean;
  data: ShareableLinkData;
  message: string;
}> {
  const response = await apiClient.post(
    `/api/marking/shareable-links/${linkId}/resend`
  );
  return response.data as {
    success: boolean;
    data: ShareableLinkData;
    message: string;
  };
}

/**
 * Get shareable link usage history
 */
export async function getShareableLinkHistory(linkId: string): Promise<{
  success: boolean;
  data: {
    attempts: Array<{
      timestamp: string;
      ipAddress?: string;
      userAgent?: string;
      success: boolean;
      reason?: string;
    }>;
  };
}> {
  const response = await apiClient.get(
    `/api/marking/shareable-links/${linkId}/history`
  );
  return response.data as {
    success: boolean;
    data: {
      attempts: Array<{
        timestamp: string;
        ipAddress?: string;
        userAgent?: string;
        success: boolean;
        reason?: string;
      }>;
    };
  };
}

/**
 * Copy shareable link URL to clipboard
 */
export function copyShareableLinkToClipboard(url: string): Promise<boolean> {
  return navigator.clipboard
    .writeText(url)
    .then(() => true)
    .catch(() => false);
}

/**
 * Share shareable link via native share API
 */
export async function shareShareableLink(
  url: string,
  propertyTitle: string
): Promise<boolean> {
  if (!navigator.share) {
    // Fallback to clipboard
    return copyShareableLinkToClipboard(url);
  }

  try {
    await navigator.share({
      title: 'Mark Property for Newcondo',
      text: `Please help mark this property: ${propertyTitle}`,
      url: url,
    });
    return true;
  } catch (error) {
    // User cancelled or error occurred
    return false;
  }
}

/**
 * Format shareable link expiry time
 */
export function formatLinkExpiry(expiresAt: string): string {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffMs = expiry.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffMs <= 0) {
    return 'Expired';
  }

  if (diffHours >= 24) {
    const days = Math.floor(diffHours / 24);
    return `${days} day${days > 1 ? 's' : ''} remaining`;
  }

  if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m remaining`;
  }

  return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} remaining`;
}

/**
 * Check if shareable link is expired
 */
export function isLinkExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() <= Date.now();
}

/**
 * Generate QR code for shareable link (for future implementation)
 */
export function generateQRCodeUrl(url: string): string {
  // Using a QR code generation service
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
}