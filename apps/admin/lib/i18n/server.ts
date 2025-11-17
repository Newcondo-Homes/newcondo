import { getTranslations as getNextIntlTranslations, getLocale } from 'next-intl/server';
import { type Locale, localeCurrencies, localeDateFormats, localeNumberFormats } from '../../../i18n';

/**
 * Server-side i18n utilities
 */

// Re-export getTranslations for convenience
export { getTranslations } from 'next-intl/server';

/**
 * Get current locale on server
 */
export async function getCurrentLocale(): Promise<Locale> {
  return (await getLocale()) as Locale;
}

/**
 * Format currency on server
 */
export async function formatCurrency(amount: number, locale?: Locale): Promise<string> {
  const currentLocale = locale || (await getCurrentLocale());
  const currency = localeCurrencies[currentLocale];

  return new Intl.NumberFormat(currentLocale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format number on server
 */
export async function formatNumber(
  value: number,
  locale?: Locale,
  customOptions?: Intl.NumberFormatOptions
): Promise<string> {
  const currentLocale = locale || (await getCurrentLocale());
  const options = localeNumberFormats[currentLocale];

  return new Intl.NumberFormat(currentLocale, {
    ...options,
    ...customOptions,
  }).format(value);
}

/**
 * Format date on server
 */
export async function formatDate(
  date: Date | string,
  locale?: Locale,
  customOptions?: Intl.DateTimeFormatOptions
): Promise<string> {
  const currentLocale = locale || (await getCurrentLocale());
  const options = localeDateFormats[currentLocale];
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return new Intl.DateTimeFormat(currentLocale, {
    ...options,
    ...customOptions,
  }).format(dateObj);
}

/**
 * Format relative time on server
 */
export async function formatRelativeTime(date: Date | string, locale?: Locale): Promise<string> {
  const currentLocale = locale || (await getCurrentLocale());
  const t = await getNextIntlTranslations({ locale: currentLocale, namespace: 'common.time' });
  
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
}

/**
 * Format percentage on server
 */
export async function formatPercentage(
  value: number,
  locale?: Locale,
  decimals: number = 1
): Promise<string> {
  const currentLocale = locale || (await getCurrentLocale());

  return new Intl.NumberFormat(currentLocale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

/**
 * Get text direction on server
 */
export async function getTextDirection(locale?: Locale): Promise<'ltr' | 'rtl'> {
  const currentLocale = locale || (await getCurrentLocale());
  
  // Add RTL locales here when supported (e.g., Arabic)
  const rtlLocales: Locale[] = [];
  
  return rtlLocales.includes(currentLocale) ? 'rtl' : 'ltr';
}

/**
 * Format file size on server
 */
export async function formatFileSize(bytes: number, locale?: Locale): Promise<string> {
  const currentLocale = locale || (await getCurrentLocale());
  const t = await getNextIntlTranslations({ locale: currentLocale, namespace: 'common.fileSize' });

  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${t(sizes[i])}`;
}

/**
 * Format phone number on server
 */
export function formatPhoneNumber(phone: string): string {
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
}

/**
 * Get localized route on server
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
 * Pluralize text on server
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) return singular;
  return plural || `${singular}s`;
}

/**
 * Get localized error message
 */
export async function getLocalizedErrorMessage(
  errorCode: string,
  locale?: Locale
): Promise<string> {
  const currentLocale = locale || (await getCurrentLocale());
  const t = await getNextIntlTranslations({ locale: currentLocale, namespace: 'errors' });

  return t(errorCode, { defaultValue: t('generic') });
}

/**
 * Get localized success message
 */
export async function getLocalizedSuccessMessage(
  messageCode: string,
  locale?: Locale
): Promise<string> {
  const currentLocale = locale || (await getCurrentLocale());
  const t = await getNextIntlTranslations({ locale: currentLocale, namespace: 'success' });

  return t(messageCode, { defaultValue: t('generic') });
}