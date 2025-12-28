// apps/platform/lib/api/referralTracking.ts

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
 * Track referral link click
 */
export async function trackClick(data: {
  referralCode: string;
  ipAddress?: string;
  userAgent?: string;
  referrerUrl?: string;
}): Promise<{ success: boolean }> {
  return fetchWithAuth('/api/referral-tracking/click', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Track referral conversion (signup)
 */
export async function trackConversion(data: {
  referralCode: string;
  userId: string;
}): Promise<{ success: boolean }> {
  return fetchWithAuth('/api/referral-tracking/conversion', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Track referral share
 */
export async function trackShare(data: {
  referralCode: string;
  channel: string;
  recipient?: string;
}): Promise<{ success: boolean }> {
  return fetchWithAuth('/api/referral-tracking/share', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Get click statistics
 */
export async function getClickStats(params?: {
  period?: 'day' | 'week' | 'month' | 'year';
  startDate?: string;
  endDate?: string;
}): Promise<{
  totalClicks: number;
  uniqueClicks: number;
  clicksByChannel: Record<string, number>;
  clicksByDate: Array<{ date: string; clicks: number }>;
  topSources: Array<{ source: string; clicks: number }>;
}> {
  const queryParams = new URLSearchParams();
  if (params?.period) queryParams.append('period', params.period);
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);

  return fetchWithAuth(`/api/referral-tracking/clicks?${queryParams.toString()}`);
}

/**
 * Get conversion funnel data
 */
export async function getConversionFunnel(): Promise<{
  clicks: number;
  signups: number;
  qualified: number;
  rewarded: number;
  conversionRate: {
    clickToSignup: number;
    signupToQualified: number;
    qualifiedToRewarded: number;
    overall: number;
  };
}> {
  return fetchWithAuth('/api/referral-tracking/funnel');
}

/**
 * Get channel performance
 */
export async function getChannelPerformance(): Promise<Array<{
  channel: string;
  shares: number;
  clicks: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
}>> {
  return fetchWithAuth('/api/referral-tracking/channels');
}

/**
 * Get geographic distribution of clicks
 */
export async function getGeographicDistribution(): Promise<Array<{
  country: string;
  city?: string;
  clicks: number;
  conversions: number;
}>> {
  return fetchWithAuth('/api/referral-tracking/geographic');
}

/**
 * Get device and browser stats
 */
export async function getDeviceStats(): Promise<{
  devices: Record<'mobile' | 'desktop' | 'tablet', number>;
  browsers: Record<string, number>;
  operatingSystems: Record<string, number>;
}> {
  return fetchWithAuth('/api/referral-tracking/devices');
}

/**
 * Get time-based activity pattern
 */
export async function getActivityPattern(): Promise<{
  hourly: Array<{ hour: number; clicks: number; conversions: number }>;
  daily: Array<{ day: string; clicks: number; conversions: number }>;
}> {
  return fetchWithAuth('/api/referral-tracking/activity-pattern');
}