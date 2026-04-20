import { cookies } from 'next/headers';
import {
  languages,
  fallbackLng,
  languageMetadata,
  type Language,
} from '../i18n/translations';

/**
 * Locale utility functions
 */

/**
 * Get user's preferred locale
 */
export async function getUserLocale(): Promise<Language> {
  try {
    const cookieStore = await cookies();
    const localeCookie =  cookieStore.get('i18next');
    
    if (localeCookie?.value && languages.includes(localeCookie.value as Language)) {
      return localeCookie.value as Language;
    }
  } catch (error) {
    console.error('Error reading locale cookie:', error);
  }
  
  return fallbackLng;
}

/**
 * Set user's preferred locale
 */
export async function setUserLocale(locale: Language): Promise<void> {
  if (!languages.includes(locale)) {
    console.warn(`Invalid locale: ${locale}. Using fallback: ${fallbackLng}`);
    locale = fallbackLng;
  }
  
  try {
    const cookieStore = await cookies();
    cookieStore.set('i18next', locale, {
      path: '/',
      maxAge: 365 * 24 * 60 * 60, // 1 year
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  } catch (error) {
    console.error('Error setting locale cookie:', error);
  }
}

/**
 * Get locale display name
 */
export function getLocaleDisplayName(locale: Language, inLocale?: Language): string {
  const targetLocale = inLocale || locale;
  
  try {
    const displayNames = new Intl.DisplayNames([targetLocale], { type: 'language' });
    return displayNames.of(locale) || languageMetadata[locale].name;
  } catch {
    return languageMetadata[locale].name;
  }
}

/**
 * Get native locale name
 */
export function getNativeLocaleName(locale: Language): string {
  return languageMetadata[locale].nativeName;
}

/**
 * Detect locale from Accept-Language header
 */
export function detectLocaleFromHeader(acceptLanguage: string): Language {
  if (!acceptLanguage) return fallbackLng;
  
  const preferredLanguages = acceptLanguage
    .split(',')
    .map((lang) => {
      const [code, qValue] = lang.trim().split(';');
      const quality = qValue ? parseFloat(qValue.split('=')[1]) : 1.0;
      const langCode = code.split('-')[0].toLowerCase();
      return { code: langCode, quality };
    })
    .sort((a, b) => b.quality - a.quality);
  
  for (const { code } of preferredLanguages) {
    if (languages.includes(code as Language)) {
      return code as Language;
    }
  }
  
  return fallbackLng;
}

/**
 * Format locale-specific text direction
 */
export function getTextDirection(locale: Language): 'ltr' | 'rtl' {
  return languageMetadata[locale].direction;
}

/**
 * Check if locale uses RTL
 */
export function isRTLLocale(locale: Language): boolean {
  return getTextDirection(locale) === 'rtl';
}

/**
 * Get locale-specific time format preference
 */
export function getTimeFormat(locale: Language): '12h' | '24h' {
  return languageMetadata[locale].timeFormat;
}

/**
 * Get locale-specific date format
 */
export function getLocaleDateFormat(locale: Language): string {
  return languageMetadata[locale].dateFormat;
}

/**
 * Format date according to locale
 */
export function formatLocaleDate(
  date: Date | string | number,
  locale: Language,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };
  
  return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
}

/**
 * Format time according to locale
 */
export function formatLocaleTime(
  date: Date | string | number,
  locale: Language,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  const timeFormat = getTimeFormat(locale);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: 'numeric',
    hour12: timeFormat === '12h',
    ...options,
  };
  
  return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
}

/**
 * Format date and time according to locale
 */
export function formatLocaleDateTime(
  date: Date | string | number,
  locale: Language,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  const timeFormat = getTimeFormat(locale);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: timeFormat === '12h',
    ...options,
  };
  
  return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
}

/**
 * Get relative time format for locale
 */
export function formatRelativeLocaleTime(
  date: Date | string | number,
  locale: Language,
  baseDate: Date = new Date()
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  const diffInSeconds = Math.floor((baseDate.getTime() - dateObj.getTime()) / 1000);
  
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  
  const intervals: Array<{ label: Intl.RelativeTimeFormatUnit; seconds: number }> = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 },
  ];
  
  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (Math.abs(count) > 0) {
      return rtf.format(-count, interval.label);
    }
  }
  
  return rtf.format(0, 'second');
}

/**
 * Get locale flag emoji
 */
export function getLocaleFlag(locale: Language): string {
  return languageMetadata[locale].flag;
}

/**
 * Validate locale code
 */
export function isValidLocale(locale: string): locale is Language {
  return languages.includes(locale as Language);
}

/**
 * Normalize locale code
 */
export function normalizeLocale(locale: string): Language {
  const normalized = locale.toLowerCase().split('-')[0];
  return isValidLocale(normalized) ? normalized : fallbackLng;
}

/**
 * Get all available locales with metadata
 */
export function getAvailableLocales() {
  return languages.map((locale) => ({
    code: locale,
    name: languageMetadata[locale].name,
    nativeName: languageMetadata[locale].nativeName,
    flag: languageMetadata[locale].flag,
    direction: languageMetadata[locale].direction,
  }));
}

/**
 * Get locale-specific list formatter
 */
export function formatLocaleList(
  items: string[],
  locale: Language,
  type: 'conjunction' | 'disjunction' = 'conjunction'
): string {
  const formatter = new Intl.ListFormat(locale, {
    style: 'long',
    type,
  });
  
  return formatter.format(items);
}

/**
 * Compare locales for sorting
 */
export function compareLocales(a: Language, b: Language): number {
  return languageMetadata[a].name.localeCompare(languageMetadata[b].name);
}

/**
 * Get locale by region/country
 */
export function getLocaleByRegion(region: string): Language {
  const regionLocaleMap: Record<string, Language> = {
    NG: 'en', // Nigeria
    FR: 'fr', // France
    // Add more mappings as needed
  };
  
  return regionLocaleMap[region.toUpperCase()] || fallbackLng;
}