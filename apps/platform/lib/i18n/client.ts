'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import resourcesToBackend from 'i18next-resources-to-backend';
import { getOptions, languages, fallbackLng, defaultNS } from './translations';

const runsOnServerSide = typeof window === 'undefined';

// Initialize i18next for client-side usage
i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(
    resourcesToBackend(
      (language: string, namespace: string) =>
        import(`./locales/${language}/${namespace}.json`)
    )
  )
  .init({
    ...getOptions(),
    lng: undefined, // Let detect the language on client side
    detection: {
      // Detection order and caches
      order: ['cookie', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['cookie', 'localStorage'],
      cookieName: 'i18next',
      lookupCookie: 'i18next',
      lookupLocalStorage: 'i18nextLng',
    },
    preload: runsOnServerSide ? languages : [],
  });

export default i18n;

// Export types
export type TranslationFunction = typeof i18n.t;

/**
 * Client-side translation hook wrapper
 * Usage: const { t, i18n } = useClientTranslation('common');
 */
export function useClientTranslation(ns: string = defaultNS) {
  if (!i18n.isInitialized) {
    i18n.init(getOptions());
  }
  
  return {
    t: i18n.t,
    i18n,
    ready: i18n.isInitialized,
  };
}

/**
 * Change language on client side
 */
export async function changeLanguage(lng: string) {
  if (!languages.includes(lng)) {
    console.warn(`Language ${lng} is not supported. Falling back to ${fallbackLng}`);
    lng = fallbackLng;
  }
  
  await i18n.changeLanguage(lng);
  
  // Update cookie and localStorage
  if (typeof document !== 'undefined') {
    document.cookie = `i18next=${lng};path=/;max-age=31536000`; // 1 year
  }
  
  if (typeof window !== 'undefined') {
    localStorage.setItem('i18nextLng', lng);
  }
  
  return lng;
}

/**
 * Get current language
 */
export function getCurrentLanguage(): string {
  return i18n.language || fallbackLng;
}

/**
 * Get current language direction (LTR or RTL)
 */
export function getLanguageDirection(): 'ltr' | 'rtl' {
  const lng = getCurrentLanguage();
  // Add RTL languages here (e.g., Arabic, Hebrew)
  const rtlLanguages = ['ar', 'he'];
  return rtlLanguages.includes(lng) ? 'rtl' : 'ltr';
}

/**
 * Check if a language is supported
 */
export function isLanguageSupported(lng: string): boolean {
  return languages.includes(lng);
}

/**
 * Get all supported languages
 */
export function getSupportedLanguages() {
  return languages;
}

/**
 * Format number according to current locale
 */
export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions
): string {
  const lng = getCurrentLanguage();
  return new Intl.NumberFormat(lng, options).format(value);
}

/**
 * Format date according to current locale
 */
export function formatDate(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  const lng = getCurrentLanguage();
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  return new Intl.DateTimeFormat(lng, options).format(dateObj);
}

/**
 * Format relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(
  date: Date | string | number,
  baseDate: Date = new Date()
): string {
  const lng = getCurrentLanguage();
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  const diffInSeconds = Math.floor((baseDate.getTime() - dateObj.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return i18n.t('common:time.justNow');
  }
  
  const rtf = new Intl.RelativeTimeFormat(lng, { numeric: 'auto' });
  
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ] as const;
  
  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count !== 0) {
      return rtf.format(-count, interval.label);
    }
  }
  
  return i18n.t('common:time.justNow');
}

/**
 * Pluralization helper
 */
export function pluralize(
  count: number,
  singular: string,
  plural?: string
): string {
  if (count === 1) {
    return singular;
  }
  return plural || `${singular}s`;
}