// apps/admin/src/lib/api/users.ts

import { get, post, put, del, downloadFile } from './client';
import { ApiResponse } from './client';

export const usersApi = {
  getUsers: async (filters?: any): Promise<ApiResponse> => {
    return get('/users', { params: filters });
  },

  getUserById: async (userId: string): Promise<ApiResponse> => {
    return get(`/users/${userId}`);
  },

  verifyUser: async (
    userId: string,
    status: string,
    rejectionReason?: string
  ): Promise<ApiResponse> => {
    return post(`/users/${userId}/verify`, { status, rejectionReason });
  },

  suspendUser: async (
    userId: string,
    reason: string,
    duration?: number
  ): Promise<ApiResponse> => {
    return post(`/users/${userId}/suspend`, { reason, duration });
  },

  deleteUser: async (userId: string): Promise<ApiResponse> => {
    return del(`/users/${userId}`);
  },

  updateUserRole: async (userId: string, role: string): Promise<ApiResponse> => {
    return put(`/users/${userId}/role`, { role });
  },

  exportUsers: async (filters?: any): Promise<Blob> => {
    return downloadFile('/users/export', { params: filters });
  }
};

// ============================================
// apps/admin/src/lib/api/verification.ts

import { get, post } from './client';
import { ApiResponse } from './client';

export const verificationApi = {
  getVerifications: async (filters?: any): Promise<ApiResponse> => {
    return get('/verifications', { params: filters });
  },

  getDocumentById: async (documentId: string): Promise<ApiResponse> => {
    return get(`/verifications/${documentId}`);
  },

  approveDocument: async (
    documentId: string,
    notes?: string
  ): Promise<ApiResponse> => {
    return post(`/verifications/${documentId}/approve`, { notes });
  },

  rejectDocument: async (
    documentId: string,
    reason: string
  ): Promise<ApiResponse> => {
    return post(`/verifications/${documentId}/reject`, { reason });
  },

  bulkApproveDocuments: async (documentIds: string[]): Promise<ApiResponse> => {
    return post('/verifications/bulk-approve', { documentIds });
  },

  requestAdditionalDocuments: async (
    userId: string,
    documentTypes: string[],
    message: string
  ): Promise<ApiResponse> => {
    return post(`/verifications/request-additional`, {
      userId,
      documentTypes,
      message
    });
  }
};

// ============================================
// apps/admin/src/lib/api/properties.ts

import { get, post, del, downloadFile } from './client';
import { ApiResponse } from './client';

export const propertiesApi = {
  getProperties: async (filters?: any): Promise<ApiResponse> => {
    return get('/properties', { params: filters });
  },

  getPropertyById: async (propertyId: string): Promise<ApiResponse> => {
    return get(`/properties/${propertyId}`);
  },

  approveProperty: async (
    propertyId: string,
    notes?: string
  ): Promise<ApiResponse> => {
    return post(`/properties/${propertyId}/approve`, { notes });
  },

  rejectProperty: async (
    propertyId: string,
    reason: string
  ): Promise<ApiResponse> => {
    return post(`/properties/${propertyId}/reject`, { reason });
  },

  deleteProperty: async (propertyId: string): Promise<ApiResponse> => {
    return del(`/properties/${propertyId}`);
  },

  verifyBoundary: async (
    propertyId: string,
    verified: boolean
  ): Promise<ApiResponse> => {
    return post(`/properties/${propertyId}/verify-boundary`, { verified });
  },

  flagAsDuplicate: async (
    propertyId: string,
    originalPropertyId: string,
    reason: string
  ): Promise<ApiResponse> => {
    return post(`/properties/${propertyId}/flag-duplicate`, {
      originalPropertyId,
      reason
    });
  },

  exportProperties: async (filters?: any): Promise<Blob> => {
    return downloadFile('/properties/export', { params: filters });
  }
};

// ============================================
// apps/admin/src/lib/api/disputes.ts

import { get, post } from './client';
import { ApiResponse } from './client';

export const disputesApi = {
  getDisputes: async (filters?: any): Promise<ApiResponse> => {
    return get('/disputes', { params: filters });
  },

  getDisputeById: async (disputeId: string): Promise<ApiResponse> => {
    return get(`/disputes/${disputeId}`);
  },

  resolveDispute: async (
    disputeId: string,
    resolution: string,
    actionTaken: string
  ): Promise<ApiResponse> => {
    return post(`/disputes/${disputeId}/resolve`, { resolution, actionTaken });
  },

  mergeProperties: async (
    propertyIds: string[],
    primaryPropertyId: string,
    mergeStrategy?: string
  ): Promise<ApiResponse> => {
    return post('/disputes/merge-properties', {
      propertyIds,
      primaryPropertyId,
      mergeStrategy
    });
  },

  escalateDispute: async (
    disputeId: string,
    reason: string
  ): Promise<ApiResponse> => {
    return post(`/disputes/${disputeId}/escalate`, { reason });
  },

  requestAdditionalEvidence: async (
    disputeId: string,
    userId: string,
    evidenceType: string[],
    instructions: string
  ): Promise<ApiResponse> => {
    return post(`/disputes/${disputeId}/request-evidence`, {
      userId,
      evidenceType,
      instructions
    });
  },

  rejectDispute: async (
    disputeId: string,
    reason: string
  ): Promise<ApiResponse> => {
    return post(`/disputes/${disputeId}/reject`, { reason });
  }
};

// ============================================
// apps/admin/src/lib/api/markingJobs.ts

import { get, post } from './client';
import { ApiResponse } from './client';

export const markingJobsApi = {
  getMarkingJobs: async (filters?: any): Promise<ApiResponse> => {
    return get('/marking-jobs', { params: filters });
  },

  getJobById: async (jobId: string): Promise<ApiResponse> => {
    return get(`/marking-jobs/${jobId}`);
  },

  assignJob: async (
    jobId: string,
    agentId: string,
    prioritize?: boolean
  ): Promise<ApiResponse> => {
    return post(`/marking-jobs/${jobId}/assign`, { agentId, prioritize });
  },

  reviewJob: async (
    jobId: string,
    approved: boolean,
    qualityScore?: number,
    feedback?: string,
    requiresRework?: boolean,
    reworkInstructions?: string
  ): Promise<ApiResponse> => {
    return post(`/marking-jobs/${jobId}/review`, {
      approved,
      qualityScore,
      feedback,
      requiresRework,
      reworkInstructions
    });
  },

  qualityAudit: async (jobId: string, review: any): Promise<ApiResponse> => {
    return post(`/marking-jobs/${jobId}/quality-audit`, review);
  },

  reassignJob: async (
    jobId: string,
    newAgentId: string,
    reason: string
  ): Promise<ApiResponse> => {
    return post(`/marking-jobs/${jobId}/reassign`, { newAgentId, reason });
  },

  cancelJob: async (jobId: string, reason: string): Promise<ApiResponse> => {
    return post(`/marking-jobs/${jobId}/cancel`, { reason });
  },

  extendDeadline: async (
    jobId: string,
    hours: number,
    reason: string
  ): Promise<ApiResponse> => {
    return post(`/marking-jobs/${jobId}/extend-deadline`, { hours, reason });
  },

  suspendAgent: async (
    agentId: string,
    days: number,
    reason: string,
    permanentBan?: boolean
  ): Promise<ApiResponse> => {
    return post(`/agents/${agentId}/suspend`, { days, reason, permanentBan });
  },

  getAgentPerformance: async (agentId: string): Promise<ApiResponse> => {
    return get(`/agents/${agentId}/performance`);
  }
};

// ============================================
// apps/admin/src/lib/api/payments.ts

import { get, post, downloadFile } from './client';
import { ApiResponse } from './client';

export const paymentsApi = {
  getPayments: async (filters?: any): Promise<ApiResponse> => {
    return get('/payments', { params: filters });
  },

  getPaymentById: async (paymentId: string): Promise<ApiResponse> => {
    return get(`/payments/${paymentId}`);
  },

  processRefund: async (
    paymentId: string,
    amount?: number,
    reason?: string
  ): Promise<ApiResponse> => {
    return post(`/payments/${paymentId}/refund`, { amount, reason });
  },

  releasePayment: async (paymentId: string): Promise<ApiResponse> => {
    return post(`/payments/${paymentId}/release`);
  },

  reconcilePayment: async (
    paymentId: string,
    notes?: string
  ): Promise<ApiResponse> => {
    return post(`/payments/${paymentId}/reconcile`, { notes });
  },

  getVirtualAccounts: async (filters?: any): Promise<ApiResponse> => {
    return get('/virtual-accounts', { params: filters });
  },

  manageVirtualAccount: async (
    accountId: string,
    action: string,
    data?: any
  ): Promise<ApiResponse> => {
    return post(`/virtual-accounts/${accountId}/${action.toLowerCase()}`, data);
  },

  flagSuspicious: async (
    paymentId: string,
    reason: string
  ): Promise<ApiResponse> => {
    return post(`/payments/${paymentId}/flag-suspicious`, { reason });
  },

  exportFinancialReport: async (
    startDate: string,
    endDate: string,
    format: string
  ): Promise<Blob> => {
    return downloadFile('/payments/export-report', {
      params: { startDate, endDate, format }
    });
  }
};

// ============================================
// apps/admin/src/lib/api/support.ts

import { get, post, downloadFile } from './client';
import { ApiResponse } from './client';

export const supportApi = {
  getTickets: async (filters?: any): Promise<ApiResponse> => {
    return get('/support', { params: filters });
  },

  getTicketById: async (ticketId: string): Promise<ApiResponse> => {
    return get(`/support/${ticketId}`);
  },

  respondToTicket: async (
    ticketId: string,
    response: string,
    internal?: boolean
  ): Promise<ApiResponse> => {
    return post(`/support/${ticketId}/respond`, { response, internal });
  },

  resolveTicket: async (
    ticketId: string,
    resolution: string
  ): Promise<ApiResponse> => {
    return post(`/support/${ticketId}/resolve`, { resolution });
  },

  updateTicketStatus: async (
    ticketId: string,
    status: string
  ): Promise<ApiResponse> => {
    return post(`/support/${ticketId}/status`, { status });
  },

  updateTicketPriority: async (
    ticketId: string,
    priority: string,
    reason?: string
  ): Promise<ApiResponse> => {
    return post(`/support/${ticketId}/priority`, { priority, reason });
  },

  assignTicket: async (
    ticketId: string,
    adminId: string
  ): Promise<ApiResponse> => {
    return post(`/support/${ticketId}/assign`, { adminId });
  },

  escalateTicket: async (
    ticketId: string,
    priority: string,
    reason: string
  ): Promise<ApiResponse> => {
    return post(`/support/${ticketId}/escalate`, { priority, reason });
  },

  closeTicket: async (
    ticketId: string,
    reason?: string
  ): Promise<ApiResponse> => {
    return post(`/support/${ticketId}/close`, { reason });
  },

  reopenTicket: async (
    ticketId: string,
    reason: string
  ): Promise<ApiResponse> => {
    return post(`/support/${ticketId}/reopen`, { reason });
  },

  exportTickets: async (filters?: any): Promise<Blob> => {
    return downloadFile('/support/export', { params: filters });
  }
};

// ============================================
// apps/admin/src/lib/api/analytics.ts

import { get, post, downloadFile } from './client';
import { ApiResponse } from './client';

export const analyticsApi = {
  getDashboardMetrics: async (dateRange?: any): Promise<ApiResponse> => {
    return get('/analytics/dashboard', { params: dateRange });
  },

  getUserAnalytics: async (filters?: any): Promise<ApiResponse> => {
    return get('/analytics/users', { params: filters });
  },

  getRevenueAnalytics: async (filters?: any): Promise<ApiResponse> => {
    return get('/analytics/revenue', { params: filters });
  },

  getPropertyAnalytics: async (filters?: any): Promise<ApiResponse> => {
    return get('/analytics/properties', { params: filters });
  },

  getAgentPerformance: async (filters?: any): Promise<ApiResponse> => {
    return get('/analytics/agents', { params: filters });
  },

  getGeographicDistribution: async (): Promise<ApiResponse> => {
    return get('/analytics/geographic');
  },

  getConversionFunnel: async (dateRange?: any): Promise<ApiResponse> => {
    return get('/analytics/conversion', { params: dateRange });
  },

  getRetentionMetrics: async (dateRange?: any): Promise<ApiResponse> => {
    return get('/analytics/retention', { params: dateRange });
  },

  getRealTimeStats: async (): Promise<ApiResponse> => {
    return get('/analytics/realtime');
  },

  exportReport: async (
    reportType: string,
    dateRange: any,
    format: string
  ): Promise<Blob> => {
    return downloadFile('/analytics/export', {
      params: { reportType, ...dateRange, format }
    });
  },

  scheduleReport: async (reportConfig: any): Promise<ApiResponse> => {
    return post('/analytics/schedule-report', reportConfig);
  }
};

// ============================================
// apps/admin/src/lib/api/duplicates.ts

import { get, post } from './client';
import { ApiResponse } from './client';

export const duplicatesApi = {
  getDuplicates: async (filters?: any): Promise<ApiResponse> => {
    return get('/duplicates', { params: filters });
  },

  getDuplicateById: async (duplicateId: string): Promise<ApiResponse> => {
    return get(`/duplicates/${duplicateId}`);
  },

  reviewDuplicate: async (
    duplicateId: string,
    status: string,
    resolution: string
  ): Promise<ApiResponse> => {
    return post(`/duplicates/${duplicateId}/review`, { status, resolution });
  },

  mergeDuplicates: async (
    propertyIds: string[],
    primaryId: string,
    mergeData?: any
  ): Promise<ApiResponse> => {
    return post('/duplicates/merge', { propertyIds, primaryId, mergeData });
  },

  dismissDuplicate: async (
    duplicateId: string,
    reason: string
  ): Promise<ApiResponse> => {
    return post(`/duplicates/${duplicateId}/dismiss`, { reason });
  },

  scanForDuplicates: async (propertyId?: string): Promise<ApiResponse> => {
    return post('/duplicates/scan', { propertyId });
  }
};

// ============================================
// apps/admin/src/lib/api/index.ts

export { adminApi } from './admin';
export { usersApi } from './users';
export { verificationApi } from './verification';
export { propertiesApi } from './properties';
export { disputesApi } from './disputes';
export { markingJobsApi } from './markingJobs';
export { paymentsApi } from './payments';
export { supportApi } from './support';
export { analyticsApi } from './analytics';
export { duplicatesApi } from './duplicates';
export { apiClient } from './client';