/**
 * Analytics API Client
 * Handles system analytics, reports, and business intelligence
 */

import { apiClient } from './client';

export interface PlatformAnalytics {
  overview: {
    totalUsers: number;
    totalProperties: number;
    totalTransactions: number;
    totalRevenue: number;
    activeListings: number;
    rentedProperties: number;
    activeAgents: number;
  };
  userMetrics: {
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
    verifiedUsers: number;
    premiumUsers: number;
    usersByRole: Record<string, number>;
    userGrowth: Array<{ period: string; count: number }>;
  };
  propertyMetrics: {
    newListingsToday: number;
    newListingsThisWeek: number;
    newListingsThisMonth: number;
    avgListingPrice: number;
    propertiesByCity: Array<{ city: string; count: number }>;
    propertiesByType: Record<string, number>;
    occupancyRate: number;
  };
  financialMetrics: {
    todayRevenue: number;
    weekRevenue: number;
    monthRevenue: number;
    yearRevenue: number;
    platformFees: number;
    agentCommissions: number;
    ownerPayouts: number;
    revenueGrowth: Array<{ period: string; revenue: number }>;
  };
  engagementMetrics: {
    propertyViews: number;
    searchQueries: number;
    avgSessionDuration: number;
    bounceRate: number;
    conversionRate: number;
  };
}

export interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  verifiedUsers: number;
  pendingVerification: number;
  usersByRole: Record<string, number>;
  usersByCity: Array<{ city: string; count: number }>;
  registrationTrend: Array<{ date: string; count: number }>;
  verificationRate: number;
  avgVerificationTime: number; // hours
}

export interface PropertyAnalytics {
  totalProperties: number;
  activeListings: number;
  rentedProperties: number;
  pendingApproval: number;
  approvalRate: number;
  avgApprovalTime: number; // hours
  propertiesByCity: Array<{ city: string; count: number; avgPrice: number }>;
  propertiesByType: Record<string, number>;
  priceDistribution: Array<{ range: string; count: number }>;
  popularAmenities: Array<{ amenity: string; count: number }>;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  platformFees: number;
  agentCommissions: number;
  ownerPayouts: number;
  revenueByMonth: Array<{ month: string; revenue: number; fees: number }>;
  revenueByPaymentType: Record<string, number>;
  avgTransactionValue: number;
  topEarningProperties: Array<{
    propertyId: string;
    title: string;
    revenue: number;
  }>;
  topEarningAgents: Array<{
    agentId: string;
    name: string;
    commission: number;
  }>;
}

export interface MarkingJobAnalytics {
  totalJobs: number;
  completedJobs: number;
  cancelledJobs: number;
  avgCompletionTime: number;
  completionRate: number;
  jobsByCity: Array<{ city: string; count: number }>;
  jobsByStatus: Record<string, number>;
  agentPerformance: Array<{
    agentId: string;
    name: string;
    completedJobs: number;
    avgRating: number;
    earnings: number;
  }>;
  queueMetrics: {
    avgQueueTime: number;
    currentQueueSize: number;
    peakQueueTime: string;
  };
}

/**
 * Get platform overview analytics
 */
export async function getPlatformAnalytics(params?: {
  startDate?: string;
  endDate?: string;
}) {
  const response = await apiClient.get<PlatformAnalytics>('/admin/analytics/platform', { params });
  return response.data;
}

/**
 * Get user analytics
 */
export async function getUserAnalytics(params?: {
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month';
}) {
  const response = await apiClient.get<UserAnalytics>('/admin/analytics/users', { params });
  return response.data;
}

/**
 * Get property analytics
 */
export async function getPropertyAnalytics(params?: {
  startDate?: string;
  endDate?: string;
  city?: string;
  state?: string;
}) {
  const response = await apiClient.get<PropertyAnalytics>('/admin/analytics/properties', { params });
  return response.data;
}

/**
 * Get revenue analytics
 */
export async function getRevenueAnalytics(params?: {
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month';
}) {
  const response = await apiClient.get<RevenueAnalytics>('/admin/analytics/revenue', { params });
  return response.data;
}

/**
 * Get marking job analytics
 */
export async function getMarkingJobAnalytics(params?: {
  startDate?: string;
  endDate?: string;
  city?: string;
}) {
  const response = await apiClient.get<MarkingJobAnalytics>('/admin/analytics/marking-jobs', { params });
  return response.data;
}

/**
 * Get dashboard metrics (quick overview)
 */
export async function getDashboardMetrics() {
  const response = await apiClient.get<{
    todayMetrics: {
      newUsers: number;
      newListings: number;
      transactions: number;
      revenue: number;
    };
    pendingActions: {
      verifications: number;
      propertyApprovals: number;
      disputes: number;
      supportTickets: number;
      markingJobs: number;
    };
    alerts: Array<{
      type: 'INFO' | 'WARNING' | 'ERROR';
      message: string;
      timestamp: string;
    }>;
  }>('/admin/analytics/dashboard');
  return response.data;
}

/**
 * Get growth metrics
 */
export async function getGrowthMetrics(params: {
  metric: 'users' | 'properties' | 'revenue' | 'transactions';
  period: 'week' | 'month' | 'quarter' | 'year';
}) {
  const response = await apiClient.get<{
    current: number;
    previous: number;
    growthRate: number;
    trend: 'up' | 'down' | 'stable';
    data: Array<{ period: string; value: number }>;
  }>('/admin/analytics/growth', { params });
  return response.data;
}

/**
 * Get conversion funnel analytics
 */
export async function getConversionFunnel(params?: {
  startDate?: string;
  endDate?: string;
}) {
  const response = await apiClient.get<{
    stages: Array<{
      stage: string;
      count: number;
      percentage: number;
      dropoffRate: number;
    }>;
    overallConversionRate: number;
  }>('/admin/analytics/conversion-funnel', { params });
  return response.data;
}

/**
 * Get geographic distribution
 */
export async function getGeographicDistribution(params?: {
  metric: 'users' | 'properties' | 'revenue';
}) {
  const response = await apiClient.get<{
    byState: Array<{ state: string; count: number; value?: number }>;
    byCity: Array<{ city: string; count: number; value?: number }>;
    topLocations: Array<{ location: string; count: number }>;
  }>('/admin/analytics/geographic', { params });
  return response.data;
}

/**
 * Get time-series data
 */
export async function getTimeSeriesData(params: {
  metric: string;
  startDate: string;
  endDate: string;
  interval: 'hour' | 'day' | 'week' | 'month';
}) {
  const response = await apiClient.get<{
    data: Array<{ timestamp: string; value: number }>;
    average: number;
    peak: { timestamp: string; value: number };
    trend: 'increasing' | 'decreasing' | 'stable';
  }>('/admin/analytics/time-series', { params });
  return response.data;
}

/**
 * Get comparison report
 */
export async function getComparisonReport(params: {
  metric: string;
  period1Start: string;
  period1End: string;
  period2Start: string;
  period2End: string;
}) {
  const response = await apiClient.get<{
    period1: { value: number; label: string };
    period2: { value: number; label: string };
    difference: number;
    percentageChange: number;
    trend: 'improvement' | 'decline' | 'stable';
  }>('/admin/analytics/compare', { params });
  return response.data;
}

/**
 * Generate custom report
 */
export async function generateReport(params: {
  reportType: 'users' | 'properties' | 'revenue' | 'markingJobs' | 'comprehensive';
  startDate: string;
  endDate: string;
  filters?: Record<string, any>;
  format?: 'json' | 'pdf' | 'xlsx';
}) {
  const response = await apiClient.post<{
    success: boolean;
    reportId: string;
    downloadUrl?: string;
  }>('/admin/analytics/generate-report', params);
  return response.data;
}

/**
 * Export analytics data
 */
export async function exportAnalytics(params: {
  dataType: string;
  startDate?: string;
  endDate?: string;
  format: 'csv' | 'xlsx' | 'json';
}) {
  const response = await apiClient.get<Blob>('/admin/analytics/export', {
    params,
    responseType: 'blob',
  });
  return response.data;
}

/**
 * Get real-time metrics
 */
export async function getRealTimeMetrics() {
  const response = await apiClient.get<{
    activeUsers: number;
    ongoingTransactions: number;
    activeMarkingJobs: number;
    serverLoad: number;
    responseTime: number;
    errorRate: number;
  }>('/admin/analytics/realtime');
  return response.data;
}


















// import { apiClient } from './client';
// import type { DateRange } from '@/types/analytics';

// export interface OverviewMetrics {
//   totalUsers: number;
//   totalProperties: number;
//   totalTransactions: number;
//   totalRevenue: number;
//   activeRentals: number;
//   pendingVerifications: number;
//   listingsGrowth: number;
//   revenueGrowth: number;
//   userGrowth: number;
//   conversionRate: number;
// }

// export interface UserAnalytics {
//   totalUsers: number;
//   activeUsers: number;
//   newUsers: number;
//   usersByRole: Array<{ role: string; count: number }>;
//   usersByVerificationStatus: Array<{ status: string; count: number }>;
//   userGrowthTrend: Array<{ date: string; count: number }>;
//   topUsersByActivity: Array<{ id: string; name: string; activityScore: number }>;
// }

// export interface PropertyAnalytics {
//   totalProperties: number;
//   publishedProperties: number;
//   rentedProperties: number;
//   propertiesByType: Array<{ type: string; count: number }>;
//   propertiesByStatus: Array<{ status: string; count: number }>;
//   propertiesByCity: Array<{ city: string; count: number }>;
//   averagePrice: number;
//   averageDaysToRent: number;
//   propertyGrowthTrend: Array<{ date: string; count: number }>;
// }

// export interface RevenueAnalytics {
//   totalRevenue: number;
//   rentRevenue: number;
//   commissionRevenue: number;
//   markingRevenue: number;
//   revenueBySource: Array<{ source: string; amount: number }>;
//   revenueByMonth: Array<{ month: string; amount: number }>;
//   averageTransactionValue: number;
//   recurringRevenue: number;
// }

// export interface TrafficAnalytics {
//   totalViews: number;
//   uniqueVisitors: number;
//   pageViews: number;
//   averageSessionDuration: number;
//   bounceRate: number;
//   topPages: Array<{ page: string; views: number }>;
//   trafficSources: Array<{ source: string; visits: number }>;
//   deviceDistribution: Array<{ device: string; percentage: number }>;
// }

// export interface ConversionMetrics {
//   signupConversionRate: number;
//   listingConversionRate: number;
//   paymentConversionRate: number;
//   verificationConversionRate: number;
//   funnelData: Array<{ stage: string; count: number; conversionRate: number }>;
// }

// export interface GeographicDistribution {
//   byState: Array<{ state: string; count: number; revenue: number }>;
//   byCity: Array<{ city: string; count: number; revenue: number }>;
//   topLocations: Array<{ location: string; properties: number; users: number }>;
// }

// export interface TimeSeriesData {
//   daily: Array<{ date: string; value: number }>;
//   weekly: Array<{ week: string; value: number }>;
//   monthly: Array<{ month: string; value: number }>;
// }

// // Get overview metrics
// export async function getOverviewMetrics(dateRange: DateRange): Promise<OverviewMetrics> {
//   const response = await apiClient.get('/admin/analytics/overview', {
//     params: {
//       startDate: dateRange.startDate.toISOString(),
//       endDate: dateRange.endDate.toISOString(),
//     },
//   });
//   return response.data;
// }

// // Get user analytics
// export async function getUserAnalytics(dateRange: DateRange): Promise<UserAnalytics> {
//   const response = await apiClient.get('/admin/analytics/users', {
//     params: {
//       startDate: dateRange.startDate.toISOString(),
//       endDate: dateRange.endDate.toISOString(),
//     },
//   });
//   return response.data;
// }

// // Get property analytics
// export async function getPropertyAnalytics(dateRange: DateRange): Promise<PropertyAnalytics> {
//   const response = await apiClient.get('/admin/analytics/properties', {
//     params: {
//       startDate: dateRange.startDate.toISOString(),
//       endDate: dateRange.endDate.toISOString(),
//     },
//   });
//   return response.data;
// }

// // Get revenue analytics
// export async function getRevenueAnalytics(dateRange: DateRange): Promise<RevenueAnalytics> {
//   const response = await apiClient.get('/admin/analytics/revenue', {
//     params: {
//       startDate: dateRange.startDate.toISOString(),
//       endDate: dateRange.endDate.toISOString(),
//     },
//   });
//   return response.data;
// }

// // Get traffic analytics
// export async function getTrafficAnalytics(dateRange: DateRange): Promise<TrafficAnalytics> {
//   const response = await apiClient.get('/admin/analytics/traffic', {
//     params: {
//       startDate: dateRange.startDate.toISOString(),
//       endDate: dateRange.endDate.toISOString(),
//     },
//   });
//   return response.data;
// }

// // Get conversion metrics
// export async function getConversionMetrics(dateRange: DateRange): Promise<ConversionMetrics> {
//   const response = await apiClient.get('/admin/analytics/conversions', {
//     params: {
//       startDate: dateRange.startDate.toISOString(),
//       endDate: dateRange.endDate.toISOString(),
//     },
//   });
//   return response.data;
// }

// // Get geographic distribution
// export async function getGeographicDistribution(dateRange: DateRange): Promise<GeographicDistribution> {
//   const response = await apiClient.get('/admin/analytics/geographic', {
//     params: {
//       startDate: dateRange.startDate.toISOString(),
//       endDate: dateRange.endDate.toISOString(),
//     },
//   });
//   return response.data;
// }

// // Get time series data
// export async function getTimeSeriesData(dateRange: DateRange): Promise<TimeSeriesData> {
//   const response = await apiClient.get('/admin/analytics/timeseries', {
//     params: {
//       startDate: dateRange.startDate.toISOString(),
//       endDate: dateRange.endDate.toISOString(),
//     },
//   });
//   return response.data;
// }

// // Export analytics report
// export async function exportAnalyticsReport(
//   dateRange: DateRange,
//   format: 'csv' | 'pdf' | 'excel'
// ): Promise<Blob> {
//   const response = await apiClient.get('/admin/analytics/export', {
//     params: {
//       startDate: dateRange.startDate.toISOString(),
//       endDate: dateRange.endDate.toISOString(),
//       format,
//     },
//     responseType: 'blob',
//   });
//   return response.data;
// }