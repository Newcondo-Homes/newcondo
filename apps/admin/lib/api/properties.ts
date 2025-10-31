/**
 * Properties API Client
 * Handles property approval, listing management, and boundary validation
 */

import { apiClient } from './client';

export interface PropertyForApproval {
  id: string;
  title: string;
  description: string;
  price?: number;
  currency: string;
  address: string;
  city: string;
  state: string;
  propertyType: string;
  structure: 'SINGLE_UNIT' | 'MULTI_FAMILY';
  bedrooms?: number;
  bathrooms?: number;
  status: string;
  adminApprovalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  boundaryVerified: boolean;
  buildingFingerprint?: string;
  images: Array<{ id: string; url: string; isPrimary: boolean }>;
  units?: PropertyUnit[];
  owner: {
    id: string;
    name: string;
    email: string;
    verificationStatus: string;
  };
  agent?: {
    id: string;
    name: string;
    email: string;
  };
  documents: Array<{
    id: string;
    documentType: string;
    fileUrl?: string;
    status: string;
  }>;
  boundaryCoordinates?: any;
  boundaryImages?: string[];
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyUnit {
  id: string;
  unitNumber: string;
  floor?: number;
  bedrooms?: number;
  bathrooms?: number;
  price: number;
  status: string;
  isAvailable: boolean;
}

export interface PropertyStats {
  totalProperties: number;
  pendingApproval: number;
  approved: number;
  rejected: number;
  rented: number;
  available: number;
  boundaryIssues: number;
}

export interface ApprovePropertyPayload {
  propertyId: string;
  notes?: string;
  requireBoundaryUpdate?: boolean;
}

export interface RejectPropertyPayload {
  propertyId: string;
  reason: string;
  notes?: string;
  specificIssues?: string[];
}

export interface BoundaryValidationResult {
  isValid: boolean;
  issues: string[];
  overlaps: Array<{
    propertyId: string;
    overlapPercentage: number;
  }>;
  suggestions: string[];
}

/**
 * Get all properties pending approval
 */
export async function getPendingProperties(params?: {
  page?: number;
  limit?: number;
  propertyType?: string;
  city?: string;
  state?: string;
  structure?: string;
}) {
  const response = await apiClient.get<{
    properties: PropertyForApproval[];
    total: number;
    page: number;
    totalPages: number;
  }>('/admin/properties/pending', { params });
  return response.data;
}

/**
 * Get property statistics
 */
export async function getPropertyStats() {
  const response = await apiClient.get<PropertyStats>('/admin/properties/stats');
  return response.data;
}

/**
 * Get single property details for approval
 */
export async function getPropertyForApproval(propertyId: string) {
  const response = await apiClient.get<PropertyForApproval>(
    `/admin/properties/${propertyId}/approval`
  );
  return response.data;
}

/**
 * Approve property listing
 */
export async function approveProperty(payload: ApprovePropertyPayload) {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
    property: PropertyForApproval;
  }>('/admin/properties/approve', payload);
  return response.data;
}

/**
 * Reject property listing
 */
export async function rejectProperty(payload: RejectPropertyPayload) {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
    property: PropertyForApproval;
  }>('/admin/properties/reject', payload);
  return response.data;
}

/**
 * Validate property boundaries
 */
export async function validatePropertyBoundary(propertyId: string) {
  const response = await apiClient.post<BoundaryValidationResult>(
    `/admin/properties/${propertyId}/validate-boundary`
  );
  return response.data;
}

/**
 * Get properties with boundary issues
 */
export async function getPropertiesWithBoundaryIssues(params?: {
  page?: number;
  limit?: number;
}) {
  const response = await apiClient.get<{
    properties: PropertyForApproval[];
    total: number;
    page: number;
    totalPages: number;
  }>('/admin/properties/boundary-issues', { params });
  return response.data;
}

/**
 * Get all properties (with filters)
 */
export async function getAllProperties(params?: {
  page?: number;
  limit?: number;
  status?: string;
  adminApprovalStatus?: string;
  city?: string;
  state?: string;
  propertyType?: string;
  search?: string;
}) {
  const response = await apiClient.get<{
    properties: PropertyForApproval[];
    total: number;
    page: number;
    totalPages: number;
  }>('/admin/properties', { params });
  return response.data;
}

/**
 * Update property status
 */
export async function updatePropertyStatus(
  propertyId: string,
  status: string,
  reason?: string
) {
  const response = await apiClient.patch<{
    success: boolean;
    message: string;
    property: PropertyForApproval;
  }>(`/admin/properties/${propertyId}/status`, { status, reason });
  return response.data;
}

/**
 * Force delist property
 */
export async function delistProperty(propertyId: string, reason: string) {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
  }>(`/admin/properties/${propertyId}/delist`, { reason });
  return response.data;
}

/**
 * Bulk approve properties
 */
export async function bulkApproveProperties(propertyIds: string[]) {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
    approved: number;
    failed: number;
  }>('/admin/properties/bulk-approve', { propertyIds });
  return response.data;
}

/**
 * Request property updates
 */
export async function requestPropertyUpdates(
  propertyId: string,
  requiredUpdates: string[],
  message: string
) {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
  }>(`/admin/properties/${propertyId}/request-updates`, {
    requiredUpdates,
    message,
  });
  return response.data;
}

/**
 * Get property approval history
 */
export async function getPropertyApprovalHistory(propertyId: string) {
  const response = await apiClient.get<{
    history: Array<{
      id: string;
      action: string;
      performedBy: string;
      performedAt: string;
      details: any;
    }>;
  }>(`/admin/properties/${propertyId}/history`);
  return response.data;
}