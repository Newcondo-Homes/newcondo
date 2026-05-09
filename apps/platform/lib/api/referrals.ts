// apps/platform/lib/api/referrals.ts

import { Referral, ReferralStats, ReferralLink, ReferralLeaderboardEntry } from '@/types/referral';
import {
  InviteViaEmailInput,
  InviteViaSMSInput,
  InviteViaWhatsAppInput,
  ReferralListQuery,
  ShareReferralInput
} from '../validations/referral';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Base fetch wrapper with auth
 */
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
 * Get user's referral link and code
 */
export async function getReferralLink(): Promise<ReferralLink> {
  return fetchWithAuth<ReferralLink>('/api/referrals/link');
}

/**
 * Get user's referral statistics
 */
export async function getReferralStats(): Promise<ReferralStats> {
  return fetchWithAuth<ReferralStats>('/api/referrals/stats');
}

/**
 * Get list of user's referrals
 */
export async function getReferrals(query?: ReferralListQuery): Promise<{
  referrals: Referral[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const params = new URLSearchParams();
  if (query?.page) params.append('page', String(query.page));
  if (query?.pageSize) params.append('pageSize', String(query.pageSize));
  if (query?.status) params.append('status', query.status);
  if (query?.sortBy) params.append('sortBy', query.sortBy);
  if (query?.sortOrder) params.append('sortOrder', query.sortOrder);

  return fetchWithAuth(`/api/referrals?${params.toString()}`);
}

/**
 * Get single referral by ID
 */
export async function getReferralById(id: string): Promise<Referral> {
  return fetchWithAuth<Referral>(`/api/referrals/${id}`);
}

/**
 * Send invitation via email
 */
export async function inviteViaEmail(data: InviteViaEmailInput): Promise<{
  success: boolean;
  message: string;
}> {
  return fetchWithAuth('/api/referrals/invite/email', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Send invitation via SMS
 */
export async function inviteViaSMS(data: InviteViaSMSInput): Promise<{
  success: boolean;
  message: string;
}> {
  return fetchWithAuth('/api/referrals/invite/sms', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Send invitation via WhatsApp
 */
export async function inviteViaWhatsApp(data: InviteViaWhatsAppInput): Promise<{
  success: boolean;
  message: string;
  whatsappUrl: string;
}> {
  return fetchWithAuth('/api/referrals/invite/whatsapp', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Send bulk invitations
 */
export async function sendBulkInvites(data: {
  emails: string[];
  message?: string;
}): Promise<{
  success: number;
  failed: number;
  details: Array<{ email: string; success: boolean; error?: string }>;
}> {
  return fetchWithAuth('/api/referrals/invite/bulk', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Track referral share
 */
export async function trackReferralShare(data: ShareReferralInput): Promise<{
  success: boolean;
}> {
  return fetchWithAuth('/api/referrals/track/share', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Track referral click
 */
export async function trackReferralClick(code: string): Promise<{
  success: boolean;
}> {
  return fetchWithAuth('/api/referrals/track/click', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

/**
 * Get referral leaderboard
 */
export async function getReferralLeaderboard(params?: {
  period?: 'week' | 'month' | 'year' | 'all';
  limit?: number;
}): Promise<{
  leaderboard: ReferralLeaderboardEntry[];
  userRank: number | null;
}> {
  const queryParams = new URLSearchParams();
  if (params?.period) queryParams.append('period', params.period);
  if (params?.limit) queryParams.append('limit', String(params.limit));

  return fetchWithAuth(`/api/referrals/leaderboard?${queryParams.toString()}`);
}

/**
 * Validate referral code
 */
export async function validateReferralCode(code: string): Promise<{
  valid: boolean;
  referrer?: {
    name: string;
    role: string;
  };
}> {
  return fetchWithAuth('/api/referrals/validate', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

/**
 * Apply referral code during signup
 */
export async function applyReferralCode(code: string): Promise<{
  success: boolean;
  message: string;
}> {
  return fetchWithAuth('/api/referrals/apply', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

/**
 * Get referral by code (public endpoint for landing page)
 */
export async function getReferralByCode(code: string): Promise<{
  valid: boolean;
  referrer?: {
    name: string;
    role: string;
  };
  reward?: {
    amount: number;
    type: string;
    description: string;
  };
}> {
  const response = await fetch(`${API_BASE_URL}/api/referrals/public/${code}`);

  if (!response.ok) {
    throw new Error('Invalid referral code');
  }

  return response.json();
}

/**
 * Get referral timeline/activity
 */
export async function getReferralTimeline(): Promise<Array<{
  id: string;
  type: 'referral_sent' | 'referral_joined' | 'referral_qualified' | 'reward_earned';
  message: string;
  createdAt: string;
  // fix line 238: replaced `any` with `unknown` — callers can narrow as needed
  metadata?: Record<string, unknown>;
}>> {
  return fetchWithAuth('/api/referrals/timeline');
}

/**
 * Regenerate referral code
 */
export async function regenerateReferralCode(): Promise<ReferralLink> {
  return fetchWithAuth('/api/referrals/regenerate', {
    method: 'POST',
  });
}