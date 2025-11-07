import { apiClient } from './client';
import type { DateRange } from '@/types/analytics';

export interface RevenueFilters {
  source?: string;
  paymentType?: string;
  minAmount?: number;
  maxAmount?: number;
  limit?: number;
}

export interface RevenueOverview {
  total: number;
  rentRevenue: number;
  commissionRevenue: number;
  markingRevenue: number;
  premiumRevenue: number;
  growth: number;
  previousPeriodTotal: number;
  projectedRevenue: number;
  averageTransactionValue: number;
  totalTransactions: number;
}

export interface RevenueBreakdown {
  byCategory: Array<{ category: string; amount: number; percentage: number }>;
  byPaymentType: Array<{ type: string; amount: number; count: number }>;
  byStatus: Array<{ status: string; amount: number }>;
  topProperties: Array<{ id: string; title: string; revenue: number }>;
  topAgents: Array<{ id: string; name: string; commission: number }>;
}

export interface RevenueSource {
  properties: Array<{
    id: string;
    title: string;
    totalRevenue: number;
    rentPayments: number;
    commissions: number;
    transactionCount: number;
  }>;
  agents: Array<{
    id: string;
    name: string;
    totalCommission: number;
    listingCount: number;
    averageCommission: number;
  }>;
  markingJobs: Array<{
    id: string;
    propertyId: string;
    fee: number;
    agentCommission: number;
    platformFee: number;
  }>;
}

export interface RevenueForecasts {
  nextMonth: number;
  nextQuarter: number;
  nextYear: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  forecastData: Array<{ period: string; projected: number; confidence: number }>;
}

export interface CommissionBreakdown {
  totalCommission: number;
  platformCommission: number;
  agentCommission: number;
  listingAgentCommission: number;
  subAgentCommission: number;
  byAgent: Array<{
    agentId: string;
    agentName: string;
    totalCommission: number;
    propertiesCount: number;
    averageCommission: number;
  }>;
  byProperty: Array<{
    propertyId: string;
    propertyTitle: string;
    totalCommission: number;
    listingAgentCommission: number;
    subAgentCommission: number;
  }>;
}

export interface PaymentDistribution {
  byMethod: Array<{ method: string; amount: number; count: number; percentage: number }>;
  byStatus: Array<{ status: string; amount: number; count: number }>;
  byTimeOfDay: Array<{ hour: number; amount: number; count: number }>;
  byDayOfWeek: Array<{ day: string; amount: number; count: number }>;
  successRate: number;
  failureRate: number;
  averageProcessingTime: number;
}

// Get revenue overview
export async function getRevenueOverview(
  dateRange: DateRange,
  filters?: RevenueFilters
): Promise<RevenueOverview> {
  const response = await apiClient.get('/admin/revenue/overview', {
    params: {
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate.toISOString(),
      ...filters,
    },
  });
  return response.data;
}

// Get revenue breakdown
export async function getRevenueBreakdown(
  dateRange: DateRange,
  filters?: RevenueFilters
): Promise<RevenueBreakdown> {
  const response = await apiClient.get('/admin/revenue/breakdown', {
    params: {
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate.toISOString(),
      ...filters,
    },
  });
  return response.data;
}

// Get revenue by source
export async function getRevenueBySource(
  dateRange: DateRange,
  filters?: RevenueFilters
): Promise<RevenueSource> {
  const response = await apiClient.get('/admin/revenue/by-source', {
    params: {
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate.toISOString(),
      ...filters,
    },
  });
  return response.data;
}

// Get revenue forecasts
export async function getRevenueForecasts(dateRange: DateRange): Promise<RevenueForecasts> {
  const response = await apiClient.get('/admin/revenue/forecasts', {
    params: {
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate.toISOString(),
    },
  });
  return response.data;
}

// Get commission breakdown
export async function getCommissionBreakdown(
  dateRange: DateRange,
  filters?: RevenueFilters
): Promise<CommissionBreakdown> {
  const response = await apiClient.get('/admin/revenue/commission', {
    params: {
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate.toISOString(),
      ...filters,
    },
  });
  return response.data;
}

// Get payment distribution
export async function getPaymentDistribution(
  dateRange: DateRange,
  filters?: RevenueFilters
): Promise<PaymentDistribution> {
  const response = await apiClient.get('/admin/revenue/distribution', {
    params: {
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate.toISOString(),
      ...filters,
    },
  });
  return response.data;
}

// Export revenue report
export async function exportRevenueReport(
  dateRange: DateRange,
  format: 'csv' | 'pdf' | 'excel'
): Promise<Blob> {
  const response = await apiClient.get('/admin/revenue/export', {
    params: {
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate.toISOString(),
      format,
    },
    responseType: 'blob',
  });
  return response.data;
}

// Get revenue trends
export async function getRevenueTrends(
  dateRange: DateRange,
  granularity: 'daily' | 'weekly' | 'monthly' = 'daily'
): Promise<Array<{ date: string; revenue: number; transactions: number }>> {
  const response = await apiClient.get('/admin/revenue/trends', {
    params: {
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate.toISOString(),
      granularity,
    },
  });
  return response.data;
}

// Get revenue comparison
export async function getRevenueComparison(
  currentRange: DateRange,
  previousRange: DateRange
): Promise<{
  current: RevenueOverview;
  previous: RevenueOverview;
  change: number;
  changePercentage: number;
}> {
  const response = await apiClient.get('/admin/revenue/comparison', {
    params: {
      currentStartDate: currentRange.startDate.toISOString(),
      currentEndDate: currentRange.endDate.toISOString(),
      previousStartDate: previousRange.startDate.toISOString(),
      previousEndDate: previousRange.endDate.toISOString(),
    },
  });
  return response.data;
}