// apps/platform/lib/api/rewards.ts

import { Reward, RewardSummary, RewardHistory } from '@/types/reward';
import {
  RewardRedemptionInput,
  BulkRewardRedemptionInput,
  RewardQuery
} from '../validations/reward';

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
 * Get user's rewards summary
 */
export async function getRewardsSummary(): Promise<RewardSummary> {
  return fetchWithAuth<RewardSummary>('/api/rewards/summary');
}

/**
 * Get list of user's rewards
 */
export async function getRewards(query?: RewardQuery): Promise<RewardHistory> {
  const params = new URLSearchParams();
  if (query?.page) params.append('page', String(query.page));
  if (query?.pageSize) params.append('pageSize', String(query.pageSize));
  if (query?.status) params.append('status', query.status);
  if (query?.rewardType) params.append('rewardType', query.rewardType);
  if (query?.isRedeemed !== undefined) params.append('isRedeemed', String(query.isRedeemed));
  if (query?.sortBy) params.append('sortBy', query.sortBy);
  if (query?.sortOrder) params.append('sortOrder', query.sortOrder);

  return fetchWithAuth(`/api/rewards?${params.toString()}`);
}

/**
 * Get single reward by ID
 */
export async function getRewardById(id: string): Promise<Reward> {
  return fetchWithAuth<Reward>(`/api/rewards/${id}`);
}

/**
 * Redeem a reward
 */
export async function redeemReward(data: RewardRedemptionInput): Promise<{
  success: boolean;
  message: string;
  payoutReference?: string;
  estimatedProcessingTime?: string;
}> {
  return fetchWithAuth('/api/rewards/redeem', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Redeem multiple rewards at once
 */
export async function redeemMultipleRewards(data: BulkRewardRedemptionInput): Promise<{
  success: number;
  failed: number;
  totalAmount: number;
  payoutReference?: string;
  details: Array<{ rewardId: string; success: boolean; error?: string }>;
}> {
  return fetchWithAuth('/api/rewards/redeem/bulk', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Get available rewards for redemption
 */
export async function getAvailableRewards(): Promise<{
  rewards: Reward[];
  totalValue: number;
}> {
  return fetchWithAuth('/api/rewards/available');
}

/**
 * Get pending rewards
 */
export async function getPendingRewards(): Promise<{
  rewards: Reward[];
  totalValue: number;
}> {
  return fetchWithAuth('/api/rewards/pending');
}

/**
 * Get expired rewards
 */
export async function getExpiredRewards(): Promise<{
  rewards: Reward[];
  totalValue: number;
}> {
  return fetchWithAuth('/api/rewards/expired');
}

/**
 * Check reward redemption eligibility
 */
export async function checkRedemptionEligibility(rewardId: string): Promise<{
  eligible: boolean;
  reason?: string;
  minAmount?: number;
}> {
  return fetchWithAuth(`/api/rewards/${rewardId}/eligibility`);
}

/**
 * Get reward redemption history
 */
export async function getRedemptionHistory(): Promise<Array<{
  id: string;
  rewardIds: string[];
  method: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  payoutReference: string;
  createdAt: string;
  completedAt: string | null;
}>> {
  return fetchWithAuth('/api/rewards/redemptions');
}

/**
 * Cancel reward redemption (if still pending)
 */
export async function cancelRedemption(redemptionId: string): Promise<{
  success: boolean;
  message: string;
}> {
  return fetchWithAuth(`/api/rewards/redemptions/${redemptionId}/cancel`, {
    method: 'POST',
  });
}

/**
 * Get reward tiers and progress
 */
export async function getRewardTiers(): Promise<{
  currentTier: {
    name: string;
    minReferrals: number;
    rewardAmount: number;
  };
  nextTier: {
    name: string;
    minReferrals: number;
    rewardAmount: number;
    remaining: number;
  } | null;
  progress: number;
}> {
  return fetchWithAuth('/api/rewards/tiers');
}

/**
 * Get milestone bonuses earned
 */
export async function getMilestoneBonuses(): Promise<Array<{
  milestone: number;
  bonus: number;
  earnedAt: string;
  description: string;
}>> {
  return fetchWithAuth('/api/rewards/milestones');
}

/**
 * Get next milestone info
 */
export async function getNextMilestone(): Promise<{
  count: number;
  bonus: number;
  description: string;
  remaining: number;
  progress: number;
} | null> {
  return fetchWithAuth('/api/rewards/milestones/next');
}

/**
 * Apply service credit to account
 */
export async function applyServiceCredit(rewardId: string): Promise<{
  success: boolean;
  message: string;
  creditApplied: number;
}> {
  return fetchWithAuth('/api/rewards/apply-credit', {
    method: 'POST',
    body: JSON.stringify({ rewardId }),
  });
}

/**
 * Get reward transaction history
 */
export async function getRewardTransactions(): Promise<Array<{
  id: string;
  type: 'earned' | 'redeemed' | 'expired' | 'applied';
  amount: number;
  description: string;
  createdAt: string;
  metadata?: Record<string, any>;
}>> {
  return fetchWithAuth('/api/rewards/transactions');
}