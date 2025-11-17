/**
 * Detect user's preferred language
 */

import { Locale } from '../types/locale.types';

const SUPPORTED_LOCALES: Locale[] = ['en', 'pcm', 'fr'];
const DEFAULT_LOCALE: Locale = 'en';
const LOCALE_STORAGE_KEY = 'newcondo_locale';

/**
 * Detect language from browser
 */
export function detectBrowserLanguage(): Locale {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE;
  }

  const browserLang = navigator.language || (navigator as any).userLanguage;
  
  // Check for exact match
  if (SUPPORTED_LOCALES.includes(browserLang as Locale)) {
    return browserLang as Locale;
  }

  // Check for language code only (e.g., 'en' from 'en-US')
  const langCode = browserLang.split('-')[0] as Locale;
  if (SUPPORTED_LOCALES.includes(langCode)) {
    return langCode;
  }

  return DEFAULT_LOCALE;
}

/**
 * Detect language from user location (Nigeria-specific)
 */
export function detectLanguageFromLocation(country?: string, region?: string): Locale {
  if (country?.toLowerCase() === 'nigeria' || country?.toLowerCase() === 'ng') {
    // Default to English for Nigeria, but could be Pidgin based on region
    // In future, can add more sophisticated detection
    return 'en';
  }

  if (country?.toLowerCase() === 'france' || country?.toLowerCase() === 'fr') {
    return 'fr';
  }

  return DEFAULT_LOCALE;
}

/**
 * Get saved locale from storage
 */
export function getSavedLocale(): Locale | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved && SUPPORTED_LOCALES.includes(saved as Locale)) {
      return saved as Locale;
    }
  } catch (error) {
    console.error('Error reading locale from storage:', error);
  }

  return null;
}

/**
 * Save locale to storage
 */
export function saveLocale(locale: Locale): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch (error) {
    console.error('Error saving locale to storage:', error);
  }
}

/**
 * Auto-detect best locale for user
 */
export function autoDetectLocale(userCountry?: string, userRegion?: string): Locale {
  // 1. Check saved preference
  const saved = getSavedLocale();
  if (saved) {
    return saved;
  }

  // 2. Check location
  if (userCountry) {
    const locationLocale = detectLanguageFromLocation(userCountry, userRegion);
    if (locationLocale !== DEFAULT_LOCALE) {
      return locationLocale;
    }
  }

  // 3. Check browser
  const browserLocale = detectBrowserLanguage();
  return browserLocale;
}

/**
 * Check if locale is supported
 */
export function isLocaleSupported(locale: string): locale is Locale {
  return SUPPORTED_LOCALES.includes(locale as Locale);
}

/**
 * Get locale display name
 */
export function getLocaleDisplayName(locale: Locale, inLocale?: Locale): string {
  const names: Record<Locale, Record<Locale, string>> = {
    en: {
      en: 'English',
      pcm: 'English',
      fr: 'Anglais',
    },
    pcm: {
      en: 'Nigerian Pidgin',
      pcm: 'Naija Pidgin',
      fr: 'Pidgin Nigérian',
    },
    fr: {
      en: 'French',
      pcm: 'French',
      fr: 'Français',
    },
  };

  return names[locale][inLocale || locale];
}

/**
 * Get all supported locales with display names
 */
export function getSupportedLocales(displayLocale: Locale = 'en'): Array<{
  code: Locale;
  name: string;
  nativeName: string;
}> {
  return SUPPORTED_LOCALES.map((locale) => ({
    code: locale,
    name: getLocaleDisplayName(locale, displayLocale),
    nativeName: getLocaleDisplayName(locale, locale),
  }));
}