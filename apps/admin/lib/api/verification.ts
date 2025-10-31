/**
 * Verification API Client
 * Handles document verification and user verification operations
 */

import { apiClient } from './client';

export interface VerificationDocument {
  id: string;
  userId: string;
  documentType: string;
  documentSide?: string;
  documentNumber?: string;
  fileName?: string;
  fileUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  verificationNotes?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

export interface UserVerificationDetail {
  id: string;
  name: string;
  email: string;
  phone?: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  role: string;
  userType?: string;
  documents: VerificationDocument[];
  verificationRejectionReason?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  createdAt: string;
}

export interface VerificationStats {
  totalPending: number;
  totalVerified: number;
  totalRejected: number;
  pendingDocuments: number;
  todaySubmissions: number;
}

export interface ApproveVerificationPayload {
  userId: string;
  documentIds?: string[];
  notes?: string;
}

export interface RejectVerificationPayload {
  userId: string;
  documentIds?: string[];
  reason: string;
  notes?: string;
}

/**
 * Get all pending verifications
 */
export async function getPendingVerifications(params?: {
  page?: number;
  limit?: number;
  role?: string;
  documentType?: string;
}) {
  const response = await apiClient.get<{
    verifications: UserVerificationDetail[];
    total: number;
    page: number;
    totalPages: number;
  }>('/admin/verifications/pending', { params });
  return response.data;
}

/**
 * Get verification statistics
 */
export async function getVerificationStats() {
  const response = await apiClient.get<VerificationStats>('/admin/verifications/stats');
  return response.data;
}

/**
 * Get single user verification details
 */
export async function getUserVerificationDetails(userId: string) {
  const response = await apiClient.get<UserVerificationDetail>(
    `/admin/verifications/users/${userId}`
  );
  return response.data;
}

/**
 * Get all documents pending verification
 */
export async function getPendingDocuments(params?: {
  page?: number;
  limit?: number;
  documentType?: string;
  userId?: string;
}) {
  const response = await apiClient.get<{
    documents: VerificationDocument[];
    total: number;
    page: number;
    totalPages: number;
  }>('/admin/verifications/documents/pending', { params });
  return response.data;
}

/**
 * Approve user verification
 */
export async function approveUserVerification(payload: ApproveVerificationPayload) {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
    user: UserVerificationDetail;
  }>('/admin/verifications/approve', payload);
  return response.data;
}

/**
 * Reject user verification
 */
export async function rejectUserVerification(payload: RejectVerificationPayload) {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
    user: UserVerificationDetail;
  }>('/admin/verifications/reject', payload);
  return response.data;
}

/**
 * Approve specific document
 */
export async function approveDocument(documentId: string, notes?: string) {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
    document: VerificationDocument;
  }>(`/admin/verifications/documents/${documentId}/approve`, { notes });
  return response.data;
}

/**
 * Reject specific document
 */
export async function rejectDocument(documentId: string, reason: string, notes?: string) {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
    document: VerificationDocument;
  }>(`/admin/verifications/documents/${documentId}/reject`, { reason, notes });
  return response.data;
}

/**
 * Get verification history for a user
 */
export async function getUserVerificationHistory(userId: string) {
  const response = await apiClient.get<{
    history: Array<{
      id: string;
      action: string;
      performedBy: string;
      performedAt: string;
      details: any;
    }>;
  }>(`/admin/verifications/users/${userId}/history`);
  return response.data;
}

/**
 * Bulk approve verifications
 */
export async function bulkApproveVerifications(userIds: string[]) {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
    approved: number;
    failed: number;
  }>('/admin/verifications/bulk-approve', { userIds });
  return response.data;
}

/**
 * Request additional documents
 */
export async function requestAdditionalDocuments(
  userId: string,
  documentTypes: string[],
  message: string
) {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
  }>(`/admin/verifications/users/${userId}/request-documents`, {
    documentTypes,
    message,
  });
  return response.data;
}