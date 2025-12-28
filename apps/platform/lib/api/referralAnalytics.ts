// apps/platform/lib/api/referralAnalytics.ts

import { ReferralAnalytics } from '@/types/referral';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Get referral analytics overview
 */
export async function getAnalyticsOverview(params: {
  period: 'day' | 'week' | 'month' | 'year';
  startDate?: string;
  endDate?: string;
}): Promise<ReferralAnalytics> {
  const queryParams = new URLSearchParams();
  queryParams.append('period', params.period);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);

  return fetchWithAuth(`/api/analytics/referrals?${queryParams.toString()}`);
}

/**
 * Get performance metrics
 */
export async function getPerformanceMetrics(): Promise<{
  totalReferrals: number;
  qualifiedReferrals: number;
  conversionRate: number;
  averageReward: number;
  totalEarnings: number;
  pendingEarnings: number;
  trends: {
    referrals: { value: number; change: number };
    conversions: { value: number; change: number };
    earnings: { value: number; change: number };
  };
}> {
  return fetchWithAuth('/api/analytics/referrals/metrics');
}

/**
 * Get referral type breakdown
 */
export async function getReferralTypeBreakdown(): Promise<Array<{
  type: string;
  count: number;
  qualified: number;
  earnings: number;
  percentage: number;
}>> {
  return fetchWithAuth('/api/analytics/referrals/types');
}

/**
 * Get reward distribution
 */
export async function getRewardDistribution(): Promise<{
  byType: Array<{
    type: string;
    count: number;
    totalValue: number;
  }>;
  byStatus: Array<{
    status: string;
    count: number;
    totalValue: number;
  }>;
}> {
  return fetchWithAuth('/api/analytics/rewards/distribution');
}

/**
 * Get time series data
 */
export async function getTimeSeriesData(params: {
  metric: 'referrals' | 'conversions' | 'earnings';
  period: 'day' | 'week' | 'month';
  duration: number; // number of periods
}): Promise<Array<{
  date: string;
  value: number;
}>> {
  const queryParams = new URLSearchParams({
    metric: params.metric,
    period: params.period,
    duration: String(params.duration),
  });

  return fetchWithAuth(`/api/analytics/referrals/timeseries?${queryParams.toString()}`);
}

/**
 * Get cohort analysis
 */
export async function getCohortAnalysis(): Promise<Array<{
  cohort: string;
  size: number;
  qualified: number;
  qualificationRate: number;
  averageTimeToQualify: number; // in days
  totalEarnings: number;
}>> {
  return fetchWithAuth('/api/analytics/referrals/cohorts');
}

/**
 * Get user ranking
 */
export async function getUserRanking(): Promise<{
  rank: number;
  totalUsers: number;
  percentile: number;
  referrals: number;
  earnings: number;
}> {
  return fetchWithAuth('/api/analytics/referrals/ranking');
}

/**
 * Get comparison data
 */
export async function getComparisonData(params: {
  metric: 'referrals' | 'earnings' | 'conversion_rate';
  compareWith: 'average' | 'top_10' | 'top_25';
}): Promise<{
  userValue: number;
  comparisonValue: number;
  difference: number;
  percentageDifference: number;
  isAbove: boolean;
}> {
  const queryParams = new URLSearchParams({
    metric: params.metric,
    compareWith: params.compareWith,
  });

  return fetchWithAuth(`/api/analytics/referrals/comparison?${queryParams.toString()}`);
}

/**
 * Export analytics data
 */
export async function exportAnalyticsData(params: {
  format: 'csv' | 'json' | 'xlsx';
  startDate?: string;
  endDate?: string;
}): Promise<Blob> {
  const queryParams = new URLSearchParams({ format: params.format });
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);

  const response = await fetch(
    `${API_BASE_URL}/api/analytics/referrals/export?${queryParams.toString()}`,
    { credentials: 'include' }
  );

  if (!response.ok) {
    throw new Error('Export failed');
  }

  return response.blob();
}

/**
 * Get top performing referrals
 */
export async function getTopReferrals(limit = 10): Promise<Array<{
  referralId: string;
  referredUser: {
    name: string;
    role: string;
  };
  joinedAt: string;
  qualifiedAt: string | null;
  rewardEarned: number;
  status: string;
}>> {
  return fetchWithAuth(`/api/analytics/referrals/top?limit=${limit}`);
}

/**
 * Get referral sources analysis
 */
export async function getSourcesAnalysis(): Promise<Array<{
  source: string;
  referrals: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
}>> {
  return fetchWithAuth('/api/analytics/referrals/sources');
}

/**
 * Get predictive insights
 */
export async function getPredictiveInsights(): Promise<{
  projectedReferrals: number;
  projectedEarnings: number;
  optimizationSuggestions: Array<{
    type: string;
    suggestion: string;
    potentialImpact: string;
  }>;
}> {
  return fetchWithAuth('/api/analytics/referrals/insights');
}