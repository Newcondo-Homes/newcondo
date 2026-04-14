// apps/platform/lib/api/earnings.ts
import { apiClient } from './client';
import type { EarningsResponse, EarningsBreakdownResponse} from '@/types/earnings'

export interface EarningsFilters {
  startDate?: Date;
  endDate?: Date;
  period?: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'all';
  groupBy?: 'day' | 'week' | 'month' | 'property' | 'type';
}

// Get earnings
export const getEarnings = async (filters?: EarningsFilters) : Promise<EarningsResponse>  => {
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
    if (filters.groupBy) {
      params.append('groupBy', filters.groupBy);
    }
  }
  
  const response = await apiClient.get(`/earnings?${params.toString()}`);
  return response.data as EarningsResponse;
};

// Get earnings breakdown
export const getEarningsBreakdown = async (filters?: EarningsFilters): Promise<EarningsBreakdownResponse> => {
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
    if (filters.groupBy) {
      params.append('groupBy', filters.groupBy);
    }
  }
  
  const response = await apiClient.get(`/earnings/breakdown?${params.toString()}`);
  return response.data as EarningsBreakdownResponse;
};

// Initiate withdrawal
export const initiateWithdrawal = async (data: {
  amount: number;
  bankAccountId: string;
  description?: string;
}) => {
  const response = await apiClient.post('/earnings/withdraw', data);
  return response.data;
};

// Get withdrawal history
export const getWithdrawalHistory = async (filters?: {
  page?: number;
  limit?: number;
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
}) => {
  const params = new URLSearchParams();
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
  }
  
  const response = await apiClient.get(`/earnings/withdrawals?${params.toString()}`);
  return response.data;
};

// Get withdrawal limits
export const getWithdrawalLimits = async () => {
  const response = await apiClient.get('/earnings/withdrawal-limits');
  return response.data;
};

// Cancel withdrawal
export const cancelWithdrawal = async (withdrawalId: string) => {
  const response = await apiClient.post(`/earnings/withdrawals/${withdrawalId}/cancel`);
  return response.data;
};

// Setup auto-withdrawal
export const setupAutoWithdrawal = async (settings: {
  enabled: boolean;
  minimumBalance?: number;
  frequency?: 'immediate' | 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  bankAccountId?: string;
}) => {
  const response = await apiClient.post('/earnings/auto-withdrawal', settings);
  return response.data;
};

// Get auto-withdrawal settings
export const getAutoWithdrawalSettings = async () => {
  const response = await apiClient.get('/earnings/auto-withdrawal');
  return response.data;
};

// Get earnings summary
export const getEarningsSummary = async () => {
  const response = await apiClient.get('/earnings/summary');
  return response.data;
};

// Get available balance
export const getAvailableBalance = async () => {
  const response = await apiClient.get('/earnings/available-balance');
  return response.data;
};