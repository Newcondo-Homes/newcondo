'use client';

import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getI18n } from '@newcondo/i18n/client'
import LanguageDetector from 'i18next-browser-languagedetector';
import resourcesToBackend from 'i18next-resources-to-backend';
import { getOptions, languages, fallbackLng } from './translations';

const runsOnServerSide = typeof window === 'undefined';


if (!i18next.isInitialized) {
  i18next
    .use(initReactI18next)
    .use(LanguageDetector)
    .use(
      resourcesToBackend(
        (language: string, namespace: string) =>
          import(`@newcondo/i18n/src/locales/${language}/${namespace}.json`)
      )
    )
    .init({
      ...getOptions(),
      lng: undefined,
      detection: {
        order: ['cookie', 'localStorage', 'navigator', 'htmlTag'],
        caches: ['cookie', 'localStorage'],
        lookupCookie: 'i18next',
        lookupLocalStorage: 'i18nextLng',
      },
      preload: runsOnServerSide ? [...languages] : [],
    });
}


/**
 * Change language on client side
 */
export async function changeLanguage(lng: string) {
  const { initI18n } = await import('@newcondo/i18n/client');
  const i18n = await initI18n();

  if (!languages.includes(lng as (typeof languages)[number])) {
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
  // useLocale hook is preferred in components, this is for non-hook contexts
  if (typeof window !== 'undefined') {
    return localStorage.getItem('i18nextLng') || fallbackLng;
  }
  return fallbackLng;
}

export function isLanguageSupported(lng: string): boolean {
  return (languages as readonly string[]).includes(lng);
}

export function getSupportedLanguages() {
  return languages;
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
    return getI18n().t('common:time.justNow');
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

  return getI18n().t('common:time.justNow');
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