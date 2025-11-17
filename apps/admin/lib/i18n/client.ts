'use client';

import { useLocale, useTranslations as useNextIntlTranslations } from 'next-intl';
import { type Locale, localeCurrencies, localeDateFormats, localeNumberFormats } from '../../../i18n';

/**
 * Client-side i18n utilities
 */

// Re-export useTranslations for convenience
export { useTranslations } from 'next-intl';

/**
 * Hook to get current locale
 */
export function useCurrentLocale(): Locale {
  return useLocale() as Locale;
}

/**
 * Hook to format currency based on current locale
 */
export function useCurrencyFormatter() {
  const locale = useCurrentLocale();
  const currency = localeCurrencies[locale];

  return (amount: number): string => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
}

/**
 * Hook to format numbers based on current locale
 */
export function useNumberFormatter() {
  const locale = useCurrentLocale();
  const options = localeNumberFormats[locale];

  return (value: number, customOptions?: Intl.NumberFormatOptions): string => {
    return new Intl.NumberFormat(locale, {
      ...options,
      ...customOptions,
    }).format(value);
  };
}

/**
 * Hook to format dates based on current locale
 */
export function useDateFormatter() {
  const locale = useCurrentLocale();
  const options = localeDateFormats[locale];

  return (date: Date | string, customOptions?: Intl.DateTimeFormatOptions): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, {
      ...options,
      ...customOptions,
    }).format(dateObj);
  };
}

/**
 * Hook to format relative time (e.g., "2 hours ago")
 */
export function useRelativeTimeFormatter() {
  const locale = useCurrentLocale();
  const t = useNextIntlTranslations('common.time');

  return (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return t('justNow');
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return t('minutesAgo', { count: diffInMinutes });
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return t('hoursAgo', { count: diffInHours });
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return t('daysAgo', { count: diffInDays });
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return t('weeksAgo', { count: diffInWeeks });
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return t('monthsAgo', { count: diffInMonths });
    }

    const diffInYears = Math.floor(diffInDays / 365);
    return t('yearsAgo', { count: diffInYears });
  };
}

/**
 * Hook to format percentage
 */
export function usePercentageFormatter() {
  const locale = useCurrentLocale();

  return (value: number, decimals: number = 1): string => {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value / 100);
  };
}

/**
 * Hook to get text direction (LTR/RTL) based on locale
 */
export function useTextDirection() {
  const locale = useCurrentLocale();
  
  // Add RTL locales here when supported (e.g., Arabic)
  const rtlLocales: Locale[] = [];
  
  return rtlLocales.includes(locale) ? 'rtl' : 'ltr';
}

/**
 * Hook to pluralize text based on count
 */
export function usePluralize() {
  const locale = useCurrentLocale();

  return (count: number, singular: string, plural?: string): string => {
    if (count === 1) return singular;
    return plural || `${singular}s`;
  };
}

/**
 * Client-side utility to get localized route
 */
export function getLocalizedRoute(path: string, locale: Locale): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // If path already starts with a locale, replace it
  const localeRegex = /^(en|fr|pcm)\//;
  if (localeRegex.test(cleanPath)) {
    return `/${cleanPath.replace(localeRegex, `${locale}/`)}`;
  }
  
  // Otherwise, prepend the locale
  return `/${locale}/${cleanPath}`;
}

/**
 * Hook to format file size
 */
export function useFileSizeFormatter() {
  const t = useNextIntlTranslations('common.fileSize');

  return (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${t(sizes[i])}`;
  };
}

/**
 * Hook to format phone numbers
 */
export function usePhoneFormatter() {
  const locale = useCurrentLocale();

  return (phone: string): string => {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');

    // Nigerian phone number format
    if (cleaned.startsWith('234')) {
      return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
    }

    if (cleaned.startsWith('0')) {
      return `+234 ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    }

    return phone;
  };
}