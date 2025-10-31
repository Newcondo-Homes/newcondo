import { apiClient } from './client';

export interface DisputeStats {
  totalDisputes: number;
  openDisputes: number;
  resolvedDisputes: number;
  averageResolutionTime: number;
  refundRate: number;
}

export interface Dispute {
  id: string;
  paymentId: string;
  rentalId: string;
  renterId: string;
  renterName: string;
  renterEmail: string;
  renterPhone: string;
  propertyId: string;
  propertyTitle: string;
  unitNumber?: string;
  amount: number;
  reason: string;
  description: string;
  evidence: string[];
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'REJECTED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: string;
}

export interface DisputeDetails extends Dispute {
  propertyDetails: {
    address: string;
    city: string;
    state: string;
    ownerName: string;
    ownerEmail: string;
    agentName?: string;
    agentEmail?: string;
  };
  paymentDetails: {
    paidAt: string;
    confirmationDeadline: string;
    platformFee: number;
    serviceFee: number;
    totalCharged: number;
  };
  timeline: {
    action: string;
    description: string;
    performedBy: string;
    timestamp: string;
  }[];
}

export interface DisputeResolutionRequest {
  paymentId: string;
  resolution: 'APPROVE_REFUND' | 'REJECT_DISPUTE';
  reason: string;
  adminNotes?: string;
  refundAmount?: number;
  refundBreakdown?: {
    refundRent: boolean;
    refundPlatformFee: boolean;
    refundServiceFee: boolean;
  };
}

export const disputesApi = {
  // Get dispute statistics
  getStats: async (): Promise<DisputeStats> => {
    const response = await apiClient.get('/admin/disputes/stats');
    return response.data;
  },

  // Get all disputes
  getDisputes: async (params?: {
    status?: string;
    priority?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    disputes: Dispute[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    const response = await apiClient.get('/admin/disputes', { params });
    return response.data;
  },

  // Get dispute details
  getDisputeDetails: async (paymentId: string): Promise<DisputeDetails> => {
    const response = await apiClient.get(`/admin/disputes/${paymentId}`);
    return response.data;
  },

  // Resolve dispute
  resolveDispute: async (data: DisputeResolutionRequest): Promise<{
    success: boolean;
    message: string;
    paymentId: string;
    refundTransactionId?: string;
  }> => {
    const response = await apiClient.post('/admin/disputes/resolve', data);
    return response.data;
  },

  // Update dispute status
  updateDisputeStatus: async (
    paymentId: string,
    status: string,
    notes?: string
  ): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await apiClient.patch(`/admin/disputes/${paymentId}/status`, {
      status,
      notes
    });
    return response.data;
  },

  // Update dispute priority
  updateDisputePriority: async (
    paymentId: string,
    priority: string
  ): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await apiClient.patch(`/admin/disputes/${paymentId}/priority`, {
      priority
    });
    return response.data;
  },

  // Add note to dispute
  addNote: async (
    paymentId: string,
    note: string
  ): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await apiClient.post(`/admin/disputes/${paymentId}/notes`, {
      note
    });
    return response.data;
  },

  // Contact parties
  contactParty: async (
    paymentId: string,
    party: 'RENTER' | 'OWNER' | 'AGENT',
    message: string
  ): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await apiClient.post(`/admin/disputes/${paymentId}/contact`, {
      party,
      message
    });
    return response.data;
  },
};










// /**
//  * Disputes API Client
//  * Handles boundary disputes and property conflict resolution
//  */

// import { apiClient } from './client';

// export interface BoundaryDispute {
//   id: string;
//   originalPropertyId: string;
//   duplicatePropertyId: string;
//   reportedBy?: string;
//   status: 'PENDING' | 'CONFIRMED_DUPLICATE' | 'NOT_DUPLICATE' | 'RESOLVED';
//   resolution?: string;
//   resolvedBy?: string;
//   resolvedAt?: string;
//   originalProperty: {
//     id: string;
//     title: string;
//     address: string;
//     owner: {
//       id: string;
//       name: string;
//       email: string;
//       phone?: string;
//     };
//     boundaryCoordinates?: any;
//     boundaryImages?: string[];
//     createdAt: string;
//   };
//   duplicateProperty: {
//     id: string;
//     title: string;
//     address: string;
//     owner: {
//       id: string;
//       name: string;
//       email: string;
//       phone?: string;
//     };
//     boundaryCoordinates?: any;
//     boundaryImages?: string[];
//     createdAt: string;
//   };
//   reporter?: {
//     id: string;
//     name: string;
//     email: string;
//   };
//   evidence: Array<{
//     type: string;
//     description: string;
//     fileUrl?: string;
//     uploadedAt: string;
//   }>;
//   createdAt: string;
// }

// export interface DisputeStats {
//   totalDisputes: number;
//   pending: number;
//   confirmedDuplicates: number;
//   notDuplicates: number;
//   resolved: number;
//   avgResolutionTime: number; // in hours
// }

// export interface ResolveDisputePayload {
//   disputeId: string;
//   decision: 'CONFIRMED_DUPLICATE' | 'NOT_DUPLICATE';
//   resolution: string;
//   actionsTaken?: string[];
//   notifyParties?: boolean;
// }

// export interface DisputeEvidence {
//   type: 'IMAGE' | 'DOCUMENT' | 'NOTE' | 'COORDINATE_COMPARISON';
//   description: string;
//   fileUrl?: string;
// }

// /**
//  * Get all boundary disputes
//  */
// export async function getBoundaryDisputes(params?: {
//   page?: number;
//   limit?: number;
//   status?: string;
//   city?: string;
//   state?: string;
// }) {
//   const response = await apiClient.get<{
//     disputes: BoundaryDispute[];
//     total: number;
//     page: number;
//     totalPages: number;
//   }>('/admin/disputes/boundary', { params });
//   return response.data;
// }

// /**
//  * Get dispute statistics
//  */
// export async function getDisputeStats() {
//   const response = await apiClient.get<DisputeStats>('/admin/disputes/stats');
//   return response.data;
// }

// /**
//  * Get single dispute details
//  */
// export async function getDisputeDetails(disputeId: string) {
//   const response = await apiClient.get<BoundaryDispute>(`/admin/disputes/${disputeId}`);
//   return response.data;
// }

// /**
//  * Resolve boundary dispute
//  */
// export async function resolveDispute(payload: ResolveDisputePayload) {
//   const response = await apiClient.post<{
//     success: boolean;
//     message: string;
//     dispute: BoundaryDispute;
//   }>('/admin/disputes/resolve', payload);
//   return response.data;
// }

// /**
//  * Add evidence to dispute
//  */
// export async function addDisputeEvidence(disputeId: string, evidence: DisputeEvidence) {
//   const response = await apiClient.post<{
//     success: boolean;
//     message: string;
//   }>(`/admin/disputes/${disputeId}/evidence`, evidence);
//   return response.data;
// }

// /**
//  * Compare two properties for duplicate detection
//  */
// export async function compareProperties(property1Id: string, property2Id: string) {
//   const response = await apiClient.post<{
//     similarity: number;
//     comparisonResults: {
//       coordinateOverlap: number;
//       addressSimilarity: number;
//       imageSimilarity: number;
//       buildingFingerprintMatch: boolean;
//     };
//     recommendation: 'DUPLICATE' | 'SIMILAR' | 'DIFFERENT';
//     reasons: string[];
//   }>('/admin/disputes/compare', { property1Id, property2Id });
//   return response.data;
// }

// /**
//  * Get pending disputes
//  */
// export async function getPendingDisputes(params?: {
//   page?: number;
//   limit?: number;
//   sortBy?: 'createdAt' | 'priority';
// }) {
//   const response = await apiClient.get<{
//     disputes: BoundaryDispute[];
//     total: number;
//     page: number;
//     totalPages: number;
//   }>('/admin/disputes/pending', { params });
//   return response.data;
// }

// /**
//  * Escalate dispute
//  */
// export async function escalateDispute(disputeId: string, reason: string) {
//   const response = await apiClient.post<{
//     success: boolean;
//     message: string;
//   }>(`/admin/disputes/${disputeId}/escalate`, { reason });
//   return response.data;
// }

// /**
//  * Request additional information from parties
//  */
// export async function requestAdditionalInfo(
//   disputeId: string,
//   requestTo: 'ORIGINAL_OWNER' | 'DUPLICATE_OWNER' | 'BOTH',
//   message: string,
//   requiredDocuments?: string[]
// ) {
//   const response = await apiClient.post<{
//     success: boolean;
//     message: string;
//   }>(`/admin/disputes/${disputeId}/request-info`, {
//     requestTo,
//     message,
//     requiredDocuments,
//   });
//   return response.data;
// }

// /**
//  * Merge duplicate properties
//  */
// export async function mergeDuplicateProperties(
//   primaryPropertyId: string,
//   duplicatePropertyId: string,
//   mergeStrategy: {
//     keepPrimaryDetails: boolean;
//     keepPrimaryImages: boolean;
//     notifyOwners: boolean;
//   }
// ) {
//   const response = await apiClient.post<{
//     success: boolean;
//     message: string;
//     mergedPropertyId: string;
//   }>('/admin/disputes/merge', {
//     primaryPropertyId,
//     duplicatePropertyId,
//     mergeStrategy,
//   });
//   return response.data;
// }

// /**
//  * Get dispute resolution history
//  */
// export async function getDisputeHistory(disputeId: string) {
//   const response = await apiClient.get<{
//     history: Array<{
//       id: string;
//       action: string;
//       performedBy: string;
//       performedAt: string;
//       details: any;
//     }>;
//   }>(`/admin/disputes/${disputeId}/history`);
//   return response.data;
// }

// /**
//  * Flag property for review
//  */
// export async function flagPropertyForReview(
//   propertyId: string,
//   reason: string,
//   severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
// ) {
//   const response = await apiClient.post<{
//     success: boolean;
//     message: string;
//   }>(`/admin/disputes/flag-property`, {
//     propertyId,
//     reason,
//     severity,
//   });
//   return response.data;
// }