// apps/platform/lib/api/commissions.ts
import { apiClient } from './client';

import type {
  CommissionFilters,
  GetCommissionsResponse,
  GetCommissionSummaryResponse,
  Commission,
} from '@/types/commission';

// TODO: Commission endpoint is in payment-service backend

export interface CommissionBreakdownItem {
  key: string;        // property ID, month string, or type label
  label: string;
  amount: number;
  currency: string;
  count: number;
}
 
export interface GetCommissionBreakdownResponse {
  items: CommissionBreakdownItem[];
  total: number;
  groupBy: 'type' | 'property' | 'month';
}

export interface GetCommissionHistoryResponse {
  commissions: Commission[];
  total: number;
  hasMore: boolean;
}


// Get commissions
export const getCommissions = async (filters?: CommissionFilters): Promise<GetCommissionsResponse> => {
  const params = new URLSearchParams();
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof Date) {
          params.append(key, value.toISOString());
        } else {
          params.append(key, String(value));
        }
      }
    });
  }
  
  const response = await apiClient.get(`/commissions?${params.toString()}`);
  return response.data as GetCommissionsResponse ;
};

// Get commission summary
export const getCommissionSummary = async (): Promise<GetCommissionSummaryResponse> => {
  const response = await apiClient.get('/commissions/summary');
  return response.data as GetCommissionSummaryResponse;
};

// Get single commission details
export const getCommissionDetails = async (commissionId: string): Promise<Commission> => {
  const response = await apiClient.get(`/commissions/${commissionId}`);
  return response.data as Commission;
};

// Get commission breakdown
export const getCommissionBreakdown = async (filters?: {
  startDate?: Date;
  endDate?: Date;
  groupBy?: 'type' | 'property' | 'month';
}): Promise<GetCommissionBreakdownResponse> => {
  const params = new URLSearchParams();
  
  if (filters) {
    if (filters.startDate) {
      params.append('startDate', filters.startDate.toISOString());
    }
    if (filters.endDate) {
      params.append('endDate', filters.endDate.toISOString());
    }
    if (filters.groupBy) {
      params.append('groupBy', filters.groupBy);
    }
  }
  
  const response = await apiClient.get(`/commissions/breakdown?${params.toString()}`);
  return response.data as GetCommissionBreakdownResponse;
};


// Get property commissions
export const getPropertyCommissions = async (propertyId: string): Promise<GetCommissionsResponse> => {
  const response = await apiClient.get(`/commissions/property/${propertyId}`);
  return response.data as GetCommissionsResponse;
};

// Get commission history
export const getCommissionHistory = async (filters?: {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'amount' | 'status';
  sortOrder?: 'asc' | 'desc';
}): Promise<GetCommissionHistoryResponse> => {
  const params = new URLSearchParams();
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
  }
  
  const response = await apiClient.get(`/commissions/history?${params.toString()}`);
  return response.data as GetCommissionHistoryResponse;
};