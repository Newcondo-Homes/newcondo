// apps/platform/lib/api/commissions.ts
import { apiClient } from './client';

export interface CommissionFilters {
  status?: 'PENDING' | 'RELEASED' | 'WITHDRAWN' | 'ALL';
  startDate?: Date;
  endDate?: Date;
  propertyId?: string;
  type?: 'LISTING_AGENT' | 'SUB_AGENT' | 'MARKING_SERVICE';
  page?: number;
  limit?: number;
}

// Get commissions
export const getCommissions = async (filters?: CommissionFilters) => {
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
  return response.data;
};

// Get commission summary
export const getCommissionSummary = async () => {
  const response = await apiClient.get('/commissions/summary');
  return response.data;
};

// Get single commission details
export const getCommissionDetails = async (commissionId: string) => {
  const response = await apiClient.get(`/commissions/${commissionId}`);
  return response.data;
};

// Get commission breakdown
export const getCommissionBreakdown = async (filters?: {
  startDate?: Date;
  endDate?: Date;
  groupBy?: 'type' | 'property' | 'month';
}) => {
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
  return response.data;
};

// Get property commissions
export const getPropertyCommissions = async (propertyId: string) => {
  const response = await apiClient.get(`/commissions/property/${propertyId}`);
  return response.data;
};

// Get commission history
export const getCommissionHistory = async (filters?: {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'amount' | 'status';
  sortOrder?: 'asc' | 'desc';
}) => {
  const params = new URLSearchParams();
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
  }
  
  const response = await apiClient.get(`/commissions/history?${params.toString()}`);
  return response.data;
};