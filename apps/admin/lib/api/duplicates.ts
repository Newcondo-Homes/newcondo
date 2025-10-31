/**
 * Duplicates API Client
 * Handles duplicate property detection, management, and resolution
 */

import { apiClient } from './client';

export interface DuplicateProperty {
  id: string;
  originalPropertyId: string;
  duplicatePropertyId: string;
  reportedBy?: string;
  status: 'PENDING' | 'CONFIRMED_DUPLICATE' | 'NOT_DUPLICATE' | 'RESOLVED';
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  similarityScore: number; // 0-100
  matchingCriteria: {
    coordinateMatch: boolean;
    addressMatch: boolean;
    buildingFingerprintMatch: boolean;
    imageMatch: boolean;
  };
  originalProperty: {
    id: string;
    title: string;
    address: string;
    city: string;
    state: string;
    owner: {
      id: string;
      name: string;
      email: string;
    };
    images: string[];
    boundaryCoordinates?: any;
    createdAt: string;
  };
  duplicateProperty: {
    id: string;
    title: string;
    address: string;
    city: string;
    state: string;
    owner: {
      id: string;
      name: string;
      email: string;
    };
    images: string[];
    boundaryCoordinates?: any;
    createdAt: string;
  };
  reporter?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export interface DuplicateStats {
  totalReports: number;
  pending: number;
  confirmedDuplicates: number;
  notDuplicates: number;
  resolved: number;
  autoDetected: number;
  userReported: number;
  avgResolutionTime: number; // hours
}

export interface DetectionResult {
  propertyId: string;
  potentialDuplicates: Array<{
    propertyId: string;
    similarityScore: number;
    matchReasons: string[];
    property: {
      id: string;
      title: string;
      address: string;
      images: string[];
    };
  }>;
  isLikelyDuplicate: boolean;
}

export interface ResolveDuplicatePayload {
  duplicateId: string;
  decision: 'CONFIRMED_DUPLICATE' | 'NOT_DUPLICATE';
  resolution: string;
  action?: 'DELIST_DUPLICATE' | 'MERGE_PROPERTIES' | 'KEEP_BOTH' | 'SUSPEND_USER';
  notifyOwners?: boolean;
}

/**
 * Get all duplicate reports
 */
export async function getDuplicateReports(params?: {
  page?: number;
  limit?: number;
  status?: string;
  city?: string;
  state?: string;
  minSimilarity?: number;
}) {
  const response = await apiClient.get<{
    duplicates: DuplicateProperty[];
    total: number;
    page: number;
    totalPages: number;
  }>('/admin/duplicates', { params });
  return response.data;
}

/**
 * Get duplicate statistics
 */
export async function getDuplicateStats() {
  const response = await apiClient.get<DuplicateStats>('/admin/duplicates/stats');
  return response.data;
}

/**
 * Get single duplicate report details
 */
export async function getDuplicateDetails(duplicateId: string) {
  const response = await apiClient.get<DuplicateProperty>(`/admin/duplicates/${duplicateId}`);
  return response.data;
}

/**
 * Get pending duplicate reports
 */
export async function getPendingDuplicates(params?: {
  page?: number;
  limit?: number;
  sortBy?: 'similarity' | 'createdAt';
}) {
  const response = await apiClient.get<{
    duplicates: DuplicateProperty[];
    total: number;
    page: number;
    totalPages: number;
  }>('/admin/duplicates/pending', { params });
  return response.data;
}

/**
 * Detect duplicates for a property
 */
export async function detectDuplicates(propertyId: string) {
  const response = await apiClient.post<DetectionResult>(
    '/admin/duplicates/detect',
    { propertyId }
  );
  return response.data;
}

/**
 * Resolve duplicate report
 */
export async function resolveDuplicate(payload: ResolveDuplicatePayload) {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
    duplicate: DuplicateProperty;
  }>('/admin/duplicates/resolve', payload);
  return response.data;
}

/**
 * Merge duplicate properties
 */
export async function mergeDuplicates(
  primaryPropertyId: string,
  duplicatePropertyId: string,
  options: {
    keepPrimaryOwner: boolean;
    combineImages: boolean;
    notifyBothOwners: boolean;
    refundDuplicate?: boolean;
  }
) {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
    mergedPropertyId: string;
  }>('/admin/duplicates/merge', {
    primaryPropertyId,
    duplicatePropertyId,
    options,
  });
  return response.data;
}

/**
 * Bulk scan for duplicates
 */
export async function bulkScanDuplicates(params?: {
  city?: string;
  state?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
    scanned: number;
    duplicatesFound: number;
    duplicateIds: string[];
  }>('/admin/duplicates/bulk-scan', params);
  return response.data;
}

/**
 * Get high similarity matches
 */
export async function getHighSimilarityMatches(params?: {
  page?: number;
  limit?: number;
  minSimilarity?: number;
}) {
  const response = await apiClient.get<{
    matches: DuplicateProperty[];
    total: number;
  }>('/admin/duplicates/high-similarity', { params });
  return response.data;
}

/**
 * Mark as false positive
 */
export async function markAsFalsePositive(duplicateId: string, reason: string) {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
  }>(`/admin/duplicates/${duplicateId}/false-positive`, { reason });
  return response.data;
}

/**
 * Get duplicate patterns
 */
export async function getDuplicatePatterns() {
  const response = await apiClient.get<{
    patterns: Array<{
      type: string;
      count: number;
      description: string;
      examples: string[];
    }>;
    suspiciousUsers: Array<{
      userId: string;
      name: string;
      duplicateCount: number;
    }>;
  }>('/admin/duplicates/patterns');
  return response.data;
}

/**
 * Compare two properties in detail
 */
export async function comparePropertiesDetailed(property1Id: string, property2Id: string) {
  const response = await apiClient.post<{
    similarity: {
      overall: number;
      coordinates: number;
      address: number;
      images: number;
      fingerprint: boolean;
    };
    differences: {
      price?: number;
      bedrooms?: boolean;
      features?: string[];
    };
    recommendation: 'DEFINITELY_DUPLICATE' | 'LIKELY_DUPLICATE' | 'POSSIBLY_DUPLICATE' | 'NOT_DUPLICATE';
    evidence: Array<{
      type: string;
      description: string;
      weight: number;
    }>;
  }>('/admin/duplicates/compare-detailed', { property1Id, property2Id });
  return response.data;
}

/**
 * Get duplicates by owner
 */
export async function getDuplicatesByOwner(userId: string) {
  const response = await apiClient.get<{
    duplicates: DuplicateProperty[];
    total: number;
    pattern: 'ACCIDENTAL' | 'SUSPICIOUS' | 'SERIAL';
  }>(`/admin/duplicates/by-owner/${userId}`);
  return response.data;
}

/**
 * Whitelist property combination
 */
export async function whitelistProperties(property1Id: string, property2Id: string, reason: string) {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
  }>('/admin/duplicates/whitelist', {
    property1Id,
    property2Id,
    reason,
  });
  return response.data;
}

/**
 * Get duplicate resolution history
 */
export async function getDuplicateHistory(duplicateId: string) {
  const response = await apiClient.get<{
    history: Array<{
      id: string;
      action: string;
      performedBy: string;
      performedAt: string;
      details: any;
    }>;
  }>(`/admin/duplicates/${duplicateId}/history`);
  return response.data;
}

/**
 * Export duplicate reports
 */
export async function exportDuplicates(params: {
  status?: string;
  startDate?: string;
  endDate?: string;
  format: 'csv' | 'xlsx' | 'pdf';
}) {
  const response = await apiClient.get<Blob>('/admin/duplicates/export', {
    params,
    responseType: 'blob',
  });
  return response.data;
}