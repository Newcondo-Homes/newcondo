// apps/platform/lib/api/rentalHistory.ts
import { apiClient } from './client';

export interface RentalHistoryFilters {
  propertyId?: string;
  status?: 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'PENDING_CONFIRMATION';
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface RentalMetricsFilters {
  startDate?: Date;
  endDate?: Date;
  period?: 'month' | 'quarter' | 'year' | 'all';
}

// Get rental history
export const getRentalHistory = async (filters?: RentalHistoryFilters) => {
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
  
  const response = await apiClient.get(`/rentals/history?${params.toString()}`);
  return response.data;
};

// Get rental metrics
export const getRentalMetrics = async (
  propertyId?: string,
  filters?: RentalMetricsFilters
) => {
  const params = new URLSearchParams();
  
  if (filters) {
    if (filters.startDate) {
      params.append('startDate', filters.startDate.toISOString());
    }
    if (filters.endDate) {
      params.append('endDate', filters.endDate.toISOString());
    }
    if (filters.period) {
      params.append('period', filters.period);
    }
  }
  
  const endpoint = propertyId 
    ? `/rentals/metrics/${propertyId}` 
    : '/rentals/metrics';
  
  const response = await apiClient.get(`${endpoint}?${params.toString()}`);
  return response.data;
};

// Get single rental details
export const getRentalDetails = async (rentalId: string) => {
  const response = await apiClient.get(`/rentals/${rentalId}`);
  return response.data;
};

// Get active rentals
export const getActiveRentals = async (propertyId?: string) => {
  const params = propertyId ? `?propertyId=${propertyId}` : '';
  const response = await apiClient.get(`/rentals/active${params}`);
  return response.data;
};

// Get rental by property
export const getRentalByProperty = async (propertyId: string) => {
  const response = await apiClient.get(`/rentals/property/${propertyId}`);
  return response.data;
};

// Get rental income report
export const getRentalIncomeReport = async (filters?: {
  startDate?: Date;
  endDate?: Date;
  groupBy?: 'property' | 'month' | 'quarter';
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
  
  const response = await apiClient.get(`/rentals/income-report?${params.toString()}`);
  return response.data;
};

// Get occupancy rate
export const getOccupancyRate = async (propertyId?: string) => {
  const params = propertyId ? `?propertyId=${propertyId}` : '';
  const response = await apiClient.get(`/rentals/occupancy${params}`);
  return response.data;
};