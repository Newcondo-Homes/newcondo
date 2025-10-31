// apps/admin/src/lib/utils/format.ts

import { CURRENCY } from '../constants';

/**
 * Currency Formatting
 */
export const formatCurrency = (
  amount: number | string,
  options?: {
    showSymbol?: boolean;
    decimals?: number;
    compact?: boolean;
  }
): string => {
  const {
    showSymbol = true,
    decimals = 2,
    compact = false,
  } = options || {};

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) return '0.00';

  if (compact && numAmount >= 1_000_000) {
    const millions = numAmount / 1_000_000;
    return `${showSymbol ? CURRENCY.SYMBOL : ''}${millions.toFixed(1)}M`;
  }

  if (compact && numAmount >= 1_000) {
    const thousands = numAmount / 1_000;
    return `${showSymbol ? CURRENCY.SYMBOL : ''}${thousands.toFixed(1)}K`;
  }

  const formatted = numAmount.toLocaleString('en-NG', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return showSymbol ? `${CURRENCY.SYMBOL}${formatted}` : formatted;
};

/**
 * Number Formatting
 */
export const formatNumber = (
  value: number | string,
  options?: {
    decimals?: number;
    compact?: boolean;
  }
): string => {
  const { decimals = 0, compact = false } = options || {};
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) return '0';

  if (compact && numValue >= 1_000_000) {
    return `${(numValue / 1_000_000).toFixed(1)}M`;
  }

  if (compact && numValue >= 1_000) {
    return `${(numValue / 1_000).toFixed(1)}K`;
  }

  return numValue.toLocaleString('en-NG', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Percentage Formatting
 */
export const formatPercentage = (
  value: number,
  options?: {
    decimals?: number;
    showSign?: boolean;
  }
): string => {
  const { decimals = 1, showSign = false } = options || {};
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
};

/**
 * Date Formatting
 */
export const formatDate = (
  date: Date | string | null | undefined,
  format: 'short' | 'long' | 'time' | 'datetime' | 'relative' = 'long'
): string => {
  if (!date) return '-';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return '-';

  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

    case 'long':
      return dateObj.toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

    case 'time':
      return dateObj.toLocaleTimeString('en-NG', {
        hour: '2-digit',
        minute: '2-digit',
      });

    case 'datetime':
      return `${dateObj.toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })} ${dateObj.toLocaleTimeString('en-NG', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;

    case 'relative':
      return formatRelativeDate(dateObj);

    default:
      return dateObj.toLocaleDateString('en-NG');
  }
};

/**
 * Relative Date Formatting (e.g., "2 hours ago")
 */
export const formatRelativeDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInMs = now.getTime() - dateObj.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  } else if (diffInWeeks < 4) {
    return `${diffInWeeks} ${diffInWeeks === 1 ? 'week' : 'weeks'} ago`;
  } else if (diffInMonths < 12) {
    return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
  } else {
    return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`;
  }
};

/**
 * Phone Number Formatting
 */
export const formatPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return '-';

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Format Nigerian phone numbers
  if (cleaned.startsWith('234')) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  } else if (cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }

  return phone;
};

/**
 * Email Formatting/Masking
 */
export const maskEmail = (email: string | null | undefined): string => {
  if (!email) return '-';

  const [localPart, domain] = email.split('@');
  if (!domain) return email;

  const maskedLocal = localPart.length > 2
    ? `${localPart[0]}${'*'.repeat(localPart.length - 2)}${localPart[localPart.length - 1]}`
    : localPart;

  return `${maskedLocal}@${domain}`;
};

/**
 * Name Formatting
 */
export const formatName = (
  firstName: string | null | undefined,
  lastName?: string | null,
  options?: { initials?: boolean }
): string => {
  if (!firstName) return '-';

  if (options?.initials) {
    const firstInitial = firstName[0]?.toUpperCase() || '';
    const lastInitial = lastName?.[0]?.toUpperCase() || '';
    return `${firstInitial}${lastInitial}`;
  }

  const full = [firstName, lastName].filter(Boolean).join(' ');
  return full || '-';
};

/**
 * Address Formatting
 */
export const formatAddress = (
  address?: string | null,
  city?: string | null,
  state?: string | null,
  country?: string | null
): string => {
  const parts = [address, city, state, country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : '-';
};

/**
 * File Size Formatting
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Duration Formatting
 */
export const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

/**
 * Truncate Text
 */
export const truncateText = (
  text: string | null | undefined,
  maxLength: number = 50,
  suffix: string = '...'
): string => {
  if (!text) return '-';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
};

/**
 * Capitalize First Letter
 */
export const capitalizeFirst = (text: string | null | undefined): string => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Title Case
 */
export const toTitleCase = (text: string | null | undefined): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Slugify Text
 */
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

/**
 * Format Queue Position
 */
export const formatQueuePosition = (position: number | null | undefined): string => {
  if (!position) return '-';
  return `#${position}`;
};

/**
 * Format Reliability Score
 */
export const formatReliabilityScore = (score: number | string | null | undefined): string => {
  if (!score) return '-';
  const numScore = typeof score === 'string' ? parseFloat(score) : score;
  return `${numScore.toFixed(2)}/5.00`;
};