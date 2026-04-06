// apps/platform/lib/api/agentReferrals.ts
import { apiClient } from './client';

import type {
  ReferralPerformanceResponse,
  ReferralDashboard,
  ReferralAnalytics,
} from '@/types/referral';


export interface ReferralFilters {
  propertyId?: string;
  status?: 'ACTIVE' | 'CONVERTED' | 'EXPIRED';
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

// Get agent referrals
export const getAgentReferrals = async (filters?: ReferralFilters): Promise<ReferralPerformanceResponse> => {
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
  
  const response = await apiClient.get(`/referrals/agent?${params.toString()}`);
  return response.data as ReferralPerformanceResponse;
};

// Get agent referral stats
export const getAgentReferralStats = async (): Promise<ReferralDashboard> => {
  const response = await apiClient.get('/referrals/agent/stats');
  return response.data as ReferralDashboard;
};

// Get referral activity
export const getReferralActivity = async (filters?: {
  limit?: number;
  type?: 'VIEW' | 'CLICK' | 'CONVERSION' | 'ALL';
}): Promise<ReferralAnalytics> => {
  const params = new URLSearchParams();
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
  }
  
  const response = await apiClient.get(`/referrals/activity?${params.toString()}`);
  return response.data as ReferralAnalytics;
};

// Get referral by property
export const getReferralByProperty = async (propertyId: string) => {
  const response = await apiClient.get(`/referrals/property/${propertyId}`);
  return response.data;
};

// Get referral earnings
export const getReferralEarnings = async (filters?: {
  startDate?: Date;
  endDate?: Date;
  status?: 'PENDING' | 'PAID';
}) => {
  const params = new URLSearchParams();
  
  if (filters) {
    if (filters.startDate) {
      params.append('startDate', filters.startDate.toISOString());
    }
    if (filters.endDate) {
      params.append('endDate', filters.endDate.toISOString());
    }
    if (filters.status) {
      params.append('status', filters.status);
    }
  }
  
  const response = await apiClient.get(`/referrals/earnings?${params.toString()}`);
  return response.data;
};

// Track referral click
export const trackReferralClick = async (referralCode: string) => {
  const response = await apiClient.post('/referrals/track-click', {
    referralCode,
    timestamp: new Date().toISOString(),
  });
  return response.data;
};