// apps/platform/lib/utils/rewardFormatters.ts

import { RewardType, RewardStatus } from '@/types/reward';
import { REWARD_TYPE_CONFIG } from '../constants/referralConfig';

/**
 * Format reward amount with currency
 */
export function formatRewardAmount(amount: number, currency = 'NGN'): string {
  if (currency === 'NGN') {
    return `₦${amount.toLocaleString('en-NG')}`;
  }
  return `${currency} ${amount.toLocaleString()}`;
}

/**
 * Get reward type display information
 */
export function getRewardTypeDisplay(type: RewardType): {
  name: string;
  description: string;
  icon: string;
  color: string;
} {
  return REWARD_TYPE_CONFIG[type];
}

/**
 * Get reward status display
 */
export function getRewardStatusDisplay(status: RewardStatus): {
  label: string;
  color: string;
  icon: string;
  variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive';
} {
  const statusMap: Record<RewardStatus, {
    label: string;
    color: string;
    icon: string;
    variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive';
  }> = {
    PENDING: {
      label: 'Pending Approval',
      color: 'yellow',
      icon: '⏳',
      variant: 'warning'
    },
    APPROVED: {
      label: 'Approved',
      color: 'green',
      icon: '✅',
      variant: 'success'
    },
    REJECTED: {
      label: 'Rejected',
      color: 'red',
      icon: '❌',
      variant: 'destructive'
    },
    EXPIRED: {
      label: 'Expired',
      color: 'gray',
      icon: '⏰',
      variant: 'secondary'
    }
  };

  return statusMap[status];
}

/**
 * Format reward description
 */
export function formatRewardDescription(
  type: RewardType,
  amount: number,
  referralType?: string
): string {
  const typeInfo = getRewardTypeDisplay(type);
  const formattedAmount = formatRewardAmount(amount);
  
  switch (type) {
    case 'SERVICE_CREDIT':
      return `${formattedAmount} credit towards NewCondo services`;
    case 'SUBSCRIPTION_DISCOUNT':
      return `${formattedAmount} discount on subscription fees`;
    case 'RENT_CREDIT':
      return `${formattedAmount} credit towards rent payment`;
    case 'COMMISSION_CREDIT':
      return `${formattedAmount} commission credit`;
    case 'MAINTENANCE_VOUCHER':
      return `${formattedAmount} maintenance service voucher`;
    case 'CASH_REWARD':
      return `${formattedAmount} cash reward`;
    default:
      return `${formattedAmount} ${typeInfo.name}`;
  }
}

/**
 * Calculate days until reward expiry
 */
export function getDaysUntilRewardExpiry(expiresAt: string | Date | null): number | null {
  if (!expiresAt) return null;
  
  const expiry = new Date(expiresAt);
  const now = new Date();
  const daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  return Math.max(0, daysRemaining);
}

/**
 * Check if reward is expiring soon
 */
export function isRewardExpiringSoon(expiresAt: string | Date | null, daysThreshold = 7): boolean {
  const daysRemaining = getDaysUntilRewardExpiry(expiresAt);
  return daysRemaining !== null && daysRemaining <= daysThreshold && daysRemaining > 0;
}

/**
 * Check if reward is expired
 */
export function isRewardExpired(expiresAt: string | Date | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

/**
 * Format expiry date display
 */
export function formatExpiryDisplay(expiresAt: string | Date | null): string {
  if (!expiresAt) return 'No expiry';
  
  const daysRemaining = getDaysUntilRewardExpiry(expiresAt);
  
  if (daysRemaining === null) return 'No expiry';
  if (daysRemaining === 0) return 'Expires today';
  if (daysRemaining === 1) return 'Expires tomorrow';
  if (daysRemaining < 0) return 'Expired';
  if (daysRemaining <= 7) return `Expires in ${daysRemaining} days`;
  
  const expiry = new Date(expiresAt);
  return `Expires on ${expiry.toLocaleDateString('en-NG', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  })}`;
}

/**
 * Format reward date
 */
export function formatRewardDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format reward date and time
 */
export function formatRewardDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calculate total reward value from array
 */
export function calculateTotalRewardValue(
  rewards: Array<{ amount: number; status: RewardStatus }>
): {
  total: number;
  approved: number;
  pending: number;
  available: number;
} {
  return rewards.reduce(
    (acc, reward) => {
      acc.total += reward.amount;
      
      if (reward.status === 'APPROVED') {
        acc.approved += reward.amount;
        acc.available += reward.amount;
      } else if (reward.status === 'PENDING') {
        acc.pending += reward.amount;
      }
      
      return acc;
    },
    { total: 0, approved: 0, pending: 0, available: 0 }
  );
}

/**
 * Group rewards by type
 */
export function groupRewardsByType(
  rewards: Array<{ rewardType: RewardType; amount: number }>
): Record<RewardType, { count: number; totalValue: number }> {
  const grouped = {} as Record<RewardType, { count: number; totalValue: number }>;
  
  rewards.forEach(reward => {
    if (!grouped[reward.rewardType]) {
      grouped[reward.rewardType] = { count: 0, totalValue: 0 };
    }
    grouped[reward.rewardType].count++;
    grouped[reward.rewardType].totalValue += reward.amount;
  });
  
  return grouped;
}

/**
 * Format redemption method display
 */
export function formatRedemptionMethod(method: 'bank_transfer' | 'wallet_credit' | 'service_credit'): string {
  const methodMap = {
    bank_transfer: 'Bank Transfer',
    wallet_credit: 'Wallet Credit',
    service_credit: 'Service Credit'
  };
  return methodMap[method];
}

/**
 * Get reward tier color
 */
export function getRewardTierColor(tierName: string): string {
  const colorMap: Record<string, string> = {
    Bronze: 'amber',
    Silver: 'gray',
    Gold: 'yellow',
    Platinum: 'blue',
    Diamond: 'purple'
  };
  return colorMap[tierName] || 'gray';
}

/**
 * Format reward percentage
 */
export function formatRewardPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Get relative time string
 */
export function getRelativeTimeString(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return formatRewardDate(date);
}