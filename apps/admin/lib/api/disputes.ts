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