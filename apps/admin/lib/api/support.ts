/**
 * Support API Client
 * Handles support tickets and customer service operations
 */

import { apiClient } from './client';

export interface SupportTicket {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: 'TECHNICAL' | 'BILLING' | 'PROPERTY' | 'VERIFICATION' | 'GENERAL';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  adminResponse?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
  };
  resolver?: {
    id: string;
    name: string;
    email: string;
  };
  attachments?: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    uploadedAt: string;
  }>;
  replies: Array<{
    id: string;
    message: string;
    isAdminReply: boolean;
    createdBy: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface SupportStats {
  totalTickets: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  avgResponseTime: number; // in hours
  avgResolutionTime: number; // in hours
  ticketsByCategory: Record<string, number>;
  ticketsByPriority: Record<string, number>;
  satisfactionRate: number; // percentage
}

export interface RespondToTicketPayload {
  ticketId: string;
  response: string;
  updateStatus?: 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  internal?: boolean; // internal note vs user-visible response
}

export interface AssignTicketPayload {
  ticketId: string;
  assignedTo: string; // admin user ID
  notes?: string;
}

/**
 * Get all support tickets
 */
export async function getSupportTickets(params?: {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  priority?: string;
  userId?: string;
  assignedTo?: string;
  search?: string;
}) {
  const response = await apiClient.get<{
    tickets: SupportTicket[];
    total: number;
    page: number;
    totalPages: number;
  }>('/admin/support', { params });
  return response.data;
}

/**
 * Get support statistics
 */
export async function getSupportStats(params?: {
  startDate?: string;
  endDate?: string;
}) {
  const response = await apiClient.get<SupportStats>('/admin/support/stats', { params });
  return response.data;
}

/**
 * Get single ticket details
 */
export async function getTicketDetails(ticketId: string) {
  const response = await apiClient.get<SupportTicket>(`/admin/support/${ticketId}`);
  return response.data;
}

/**
 * Get open tickets
 */
export async function getOpenTickets(params?: {
  page?: number;
  limit?: number;
  priority?: string;
}) {
  const response = await apiClient.get<{
    tickets: SupportTicket[];
    total: number;
    page: number;
    totalPages: number;
  }>('/admin/support/open', { params });
  return response.data;
}

/**
 * Get high priority tickets
 */
export async function getHighPriorityTickets(params?: {
  page?: number;
  limit?: number;
}) {
  const response = await apiClient.get<{
    tickets: SupportTicket[];
    total: number;
  }>('/admin/support/high-priority', { params });
  return response.data;
}

/**
 * Respond to ticket
 */
export async function respondToTicket(payload: RespondToTicketPayload) {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
    ticket: SupportTicket;
  }>('/admin/support/respond', payload);
  return response.data;
}

/**
 * Update ticket status
 */
export async function updateTicketStatus(
  ticketId: string,
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED',
  notes?: string
) {
  const response = await apiClient.patch<{
    success: boolean;
    message: string;
    ticket: SupportTicket;
  }>(`/admin/support/${ticketId}/status`, { status, notes });
  return response.data;
}

/**
 * Update ticket priority
 */
export async function updateTicketPriority(
  ticketId: string,
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
  reason?: string
) {
  const response = await apiClient.patch<{
    success: boolean;
    message: string;
  }>(`/admin/support/${ticketId}/priority`, { priority, reason });
  return response.data;
}

/**
 * Assign ticket to admin
 */
export async function assignTicket(payload: AssignTicketPayload) {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
  }>('/admin/support/assign', payload);
  return response.data;
}

/**
 * Add internal note to ticket
 */
export async function addInternalNote(ticketId: string, note: string) {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
  }>(`/admin/support/${ticketId}/internal-note`, { note });
  return response.data;
}

/**
 * Escalate ticket
 */
export async function escalateTicket(ticketId: string, reason: string, escalateTo?: string) {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
  }>(`/admin/support/${ticketId}/escalate`, { reason, escalateTo });
  return response.data;
}

/**
 * Merge duplicate tickets
 */
export async function mergeTickets(primaryTicketId: string, duplicateTicketIds: string[]) {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
    mergedTicketId: string;
  }>('/admin/support/merge', { primaryTicketId, duplicateTicketIds });
  return response.data;
}

/**
 * Get ticket by user
 */
export async function getUserTickets(userId: string, params?: {
  page?: number;
  limit?: number;
}) {
  const response = await apiClient.get<{
    tickets: SupportTicket[];
    total: number;
  }>(`/admin/support/users/${userId}`, { params });
  return response.data;
}

/**
 * Bulk update ticket status
 */
export async function bulkUpdateStatus(
  ticketIds: string[],
  status: string,
  notes?: string
) {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
    updated: number;
  }>('/admin/support/bulk-update', { ticketIds, status, notes });
  return response.data;
}

/**
 * Get ticket history
 */
export async function getTicketHistory(ticketId: string) {
  const response = await apiClient.get<{
    history: Array<{
      id: string;
      action: string;
      performedBy: string;
      performedAt: string;
      details: any;
    }>;
  }>(`/admin/support/${ticketId}/history`);
  return response.data;
}

/**
 * Send ticket feedback request
 */
export async function sendFeedbackRequest(ticketId: string, message?: string) {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
  }>(`/admin/support/${ticketId}/feedback-request`, { message });
  return response.data;
}

/**
 * Get unassigned tickets
 */
export async function getUnassignedTickets(params?: {
  page?: number;
  limit?: number;
}) {
  const response = await apiClient.get<{
    tickets: SupportTicket[];
    total: number;
  }>('/admin/support/unassigned', { params });
  return response.data;
}

/**
 * Export tickets
 */
export async function exportTickets(params: {
  startDate?: string;
  endDate?: string;
  status?: string;
  category?: string;
  format?: 'csv' | 'xlsx' | 'pdf';
}) {
  const response = await apiClient.get<Blob>('/admin/support/export', {
    params,
    responseType: 'blob',
  });
  return response.data;
}