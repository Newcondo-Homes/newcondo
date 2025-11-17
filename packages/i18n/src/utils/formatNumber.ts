/**
 * Format numbers based on locale
 */

import { Currency, Locale } from '../types/locale.types';

interface FormatNumberOptions {
  locale?: Locale;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  useGrouping?: boolean;
}

/**
 * Format currency amount
 */
export function formatCurrency(
  amount: number,
  currency: Currency = 'NGN',
  locale: Locale = 'en',
  options?: Partial<FormatNumberOptions>
): string {
  const currencySymbols: Record<Currency, string> = {
    NGN: '₦',
    USD: '$',
    GBP: '£',
    EUR: '€',
  };

  const symbol = currencySymbols[currency];

  // Format number with grouping
  const formatted = new Intl.NumberFormat(locale === 'pcm' ? 'en-NG' : locale, {
    minimumFractionDigits: options?.minimumFractionDigits ?? 0,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
    useGrouping: options?.useGrouping ?? true,
  }).format(amount);

  return `${symbol}${formatted}`;
}

/**
 * Format large numbers with suffixes (K, M, B)
 */
export function formatCompactNumber(
  value: number,
  locale: Locale = 'en'
): string {
  if (value < 1000) {
    return value.toString();
  }

  const suffixes = ['', 'K', 'M', 'B', 'T'];
  const tier = (Math.log10(Math.abs(value)) / 3) | 0;

  if (tier === 0) return value.toString();

  const suffix = suffixes[tier];
  const scale = Math.pow(10, tier * 3);
  const scaled = value / scale;

  return scaled.toFixed(1) + suffix;
}

/**
 * Format percentage
 */
export function formatPercentage(
  value: number,
  locale: Locale = 'en',
  decimals: number = 1
): string {
  return new Intl.NumberFormat(locale === 'pcm' ? 'en-NG' : locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

/**
 * Format decimal number
 */
export function formatDecimal(
  value: number,
  locale: Locale = 'en',
  decimals: number = 2
): string {
  return new Intl.NumberFormat(locale === 'pcm' ? 'en-NG' : locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Parse localized number string to number
 */
export function parseLocalizedNumber(value: string, locale: Locale = 'en'): number {
  // Remove currency symbols
  let cleaned = value.replace(/[₦$£€]/g, '');
  
  // Handle different thousand separators
  if (locale === 'en' || locale === 'pcm') {
    // English uses comma for thousands, period for decimal
    cleaned = cleaned.replace(/,/g, '');
  } else if (locale === 'fr') {
    // French uses space for thousands, comma for decimal
    cleaned = cleaned.replace(/\s/g, '').replace(',', '.');
  }

  return parseFloat(cleaned) || 0;
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number, locale: Locale = 'en'): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return (
    parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  );
}

/**
 * Format phone number for Nigerian numbers
 */
export function formatPhoneNumber(phone: string, locale: Locale = 'en'): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Nigerian phone format: 0803 123 4567
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }

  // International format: +234 803 123 4567
  if (cleaned.length === 13 && cleaned.startsWith('234')) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  }

  return phone;
}

/**
 * Format distance
 */
export function formatDistance(
  meters: number,
  locale: Locale = 'en'
): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }

  const km = meters / 1000;
  return `${km.toFixed(1)}km`;
}

/**
 * Format duration in minutes
 */
export function formatDuration(
  minutes: number,
  locale: Locale = 'en'
): string {
  if (minutes < 60) {
    return locale === 'pcm' 
      ? `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`
      : `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return locale === 'pcm'
      ? `${hours} ${hours === 1 ? 'hour' : 'hours'}`
      : `${hours}h`;
  }

  return locale === 'pcm'
    ? `${hours} ${hours === 1 ? 'hour' : 'hours'} ${remainingMinutes} minutes`
    : `${hours}h ${remainingMinutes}m`;
}