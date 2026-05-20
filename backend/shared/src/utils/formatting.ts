/**
 * File: backend/shared/src/utils/formatting.ts
 * Formatting utilities for internationalization support
 */

import { SupportedLocale, SupportedCurrency } from '../types/i18n.types';

/**
 * Format currency with locale-specific formatting
 */
export const formatCurrencyUtil = (
  amount: number,
  currency: SupportedCurrency = 'NGN',
  locale: SupportedLocale = 'en'
): string => {
  const localeMap: Record<SupportedLocale, string> = {
    en: 'en-NG',
    fr: 'fr-FR',
    pcm: 'en-NG', // Nigerian Pidgin uses same formatting as English Nigeria
  };

  try {
    return new Intl.NumberFormat(localeMap[locale], {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback to basic formatting if Intl fails
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  }
};

/**
 * Get currency symbol for a given currency code
 */
const getCurrencySymbol = (currency: SupportedCurrency): string => {
  const symbols: Record<SupportedCurrency, string> = {
    NGN: '₦',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };
  return symbols[currency] || currency;
};

/**
 * Format date with locale-specific formatting
 */
export const formatDateUtil = (
  date: Date | string,
  locale: SupportedLocale = 'en',
  options?: Intl.DateTimeFormatOptions
): string => {
  const localeMap: Record<SupportedLocale, string> = {
    en: 'en-NG',
    fr: 'fr-FR',
    pcm: 'en-NG',
  };

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  try {
    return new Intl.DateTimeFormat(localeMap[locale], defaultOptions).format(dateObj);
  } catch (error) {
    // Fallback to ISO string
    return dateObj.toISOString().split('T')[0];
  }
};

/**
 * Format date and time with locale-specific formatting
 */
export const formatDateTime = (
  date: Date | string,
  locale: SupportedLocale = 'en',
  options?: Intl.DateTimeFormatOptions
): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  };

  return formatDateUtil(date, locale, defaultOptions);
};

/**
 * Format time with locale-specific formatting
 */
const formatTime = (
  date: Date | string,
  locale: SupportedLocale = 'en',
  options?: Intl.DateTimeFormatOptions
): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: locale === 'en', // 12-hour for English, 24-hour for others
    ...options,
  };

  return formatDateUtil(date, locale, defaultOptions);
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
const formatRelativeTime = (
  date: Date | string,
  locale: SupportedLocale = 'en'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  const localeMap: Record<SupportedLocale, string> = {
    en: 'en-NG',
    fr: 'fr-FR',
    pcm: 'en-NG',
  };

  try {
    const rtf = new Intl.RelativeTimeFormat(localeMap[locale], { numeric: 'auto' });

    if (diffSeconds < 60) {
      return rtf.format(-diffSeconds, 'second');
    } else if (diffMinutes < 60) {
      return rtf.format(-diffMinutes, 'minute');
    } else if (diffHours < 24) {
      return rtf.format(-diffHours, 'hour');
    } else if (diffDays < 30) {
      return rtf.format(-diffDays, 'day');
    } else {
      return formatDateUtil(dateObj, locale);
    }
  } catch (error) {
    // Fallback for unsupported environments
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDateUtil(dateObj, locale);
  }
};

/**
 * Format number with locale-specific formatting
 */
export const formatNumber = (
  num: number,
  locale: SupportedLocale = 'en',
  options?: Intl.NumberFormatOptions
): string => {
  const localeMap: Record<SupportedLocale, string> = {
    en: 'en-NG',
    fr: 'fr-FR',
    pcm: 'en-NG',
  };

  try {
    return new Intl.NumberFormat(localeMap[locale], options).format(num);
  } catch (error) {
    return num.toString();
  }
};

/**
 * Format percentage with locale-specific formatting
 */
export const formattingFormatPercentage = (
  value: number,
  locale: SupportedLocale = 'en',
  decimals: number = 0
): string => {
  return formatNumber(value, locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Format phone number for Nigerian context
 */
export const formatPhoneNumber = (phone: string, locale: SupportedLocale = 'en'): string => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Handle Nigerian phone numbers
  if (cleaned.startsWith('234')) {
    // International format: +234 XXX XXX XXXX
    return `+234 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    // Local format: 0XXX XXX XXXX
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }

  // Return as-is if format doesn't match
  return phone;
};

/**
 * Pluralize text based on count and locale
 */
export const pluralize = (
  count: number,
  singular: string,
  plural?: string,
  locale: SupportedLocale = 'en'
): string => {
  const pluralForm = plural || `${singular}s`;
  
  try {
    const rules = new Intl.PluralRules(locale);
    const rule = rules.select(count);
    
    // Simple pluralization - can be extended for more complex rules
    if (rule === 'one') {
      return `${count} ${singular}`;
    } else {
      return `${count} ${pluralForm}`;
    }
  } catch (error) {
    // Fallback
    return count === 1 ? `${count} ${singular}` : `${count} ${pluralForm}`;
  }
};

// /**
//  * Format address based on Nigerian context
//  */
// export const formatAddress = (
//   address: {
//     street?: string;
//     city?: string;
//     state?: string;
//     country?: string;
//   },
//   locale: SupportedLocale = 'en'
// ): string => {
//   const parts: string[] = [];
  
//   if (address.street) parts.push(address.street);
//   if (address.city) parts.push(address.city);
//   if (address.state) parts.push(address.state);
//   if (address.country && address.country !== 'Nigeria') parts.push(address.country);
  
//   return parts.join(', ');
// };

/**
 * Format file size with locale-specific units
 */
export const formatFileSize = (bytes: number, locale: SupportedLocale = 'en'): string => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${formatNumber(size, locale, { maximumFractionDigits: 2 })} ${units[unitIndex]}`;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
};

/**
 * Format list of items with locale-specific conjunctions
 */
export const formatList = (
  items: string[],
  locale: SupportedLocale = 'en',
  type: 'conjunction' | 'disjunction' = 'conjunction'
): string => {
  const localeMap: Record<SupportedLocale, string> = {
    en: 'en-NG',
    fr: 'fr-FR',
    pcm: 'en-NG',
  };

  try {
    const formatter = new Intl.ListFormat(localeMap[locale], { type });
    return formatter.format(items);
  } catch (error) {
    // Fallback
    if (items.length === 0) return '';
    if (items.length === 1) return items[0];
    if (items.length === 2) return items.join(type === 'conjunction' ? ' and ' : ' or ');
    
    const last = items[items.length - 1];
    const rest = items.slice(0, -1);
    const conjunction = type === 'conjunction' ? 'and' : 'or';
    return `${rest.join(', ')}, ${conjunction} ${last}`;
  }
};