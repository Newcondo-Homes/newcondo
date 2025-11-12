/**
 * Language configuration for supported locales
 */

import { Locale, LocaleMetadata } from '../types/i18n.types';

export const SUPPORTED_LOCALES: Locale[] = ['en', 'fr', 'pcm'];

export const DEFAULT_LOCALE: Locale = 'en';

export const FALLBACK_LOCALE: Locale = 'en';

export const LOCALE_METADATA: Record<Locale, LocaleMetadata> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    currency: 'NGN',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    weekStart: 1, // Monday
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    direction: 'ltr',
    currency: 'XOF',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    weekStart: 1, // Monday
  },
  pcm: {
    code: 'pcm',
    name: 'Nigerian Pidgin',
    nativeName: 'Naija Pidgin',
    direction: 'ltr',
    currency: 'NGN',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    weekStart: 1, // Monday
  },
};

export const LOCALE_NAMES: Record<Locale, { name: string; nativeName: string }> = {
  en: { name: 'English', nativeName: 'English' },
  fr: { name: 'French', nativeName: 'Français' },
  pcm: { name: 'Nigerian Pidgin', nativeName: 'Naija Pidgin' },
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  en: '🇬🇧',
  fr: '🇫🇷',
  pcm: '🇳🇬',
};

export const RTL_LOCALES: Locale[] = [];

export const isRTL = (locale: Locale): boolean => {
  return RTL_LOCALES.includes(locale);
};

export const isValidLocale = (locale: string): locale is Locale => {
  return SUPPORTED_LOCALES.includes(locale as Locale);
};

export const getLocaleMetadata = (locale: Locale): LocaleMetadata => {
  return LOCALE_METADATA[locale] || LOCALE_METADATA[DEFAULT_LOCALE];
};

export const getLocaleDirection = (locale: Locale): 'ltr' | 'rtl' => {
  return LOCALE_METADATA[locale]?.direction || 'ltr';
};

export const getLocaleCurrency = (locale: Locale): string => {
  return LOCALE_METADATA[locale]?.currency || 'NGN';
};

// Browser language detection mapping
export const BROWSER_LANGUAGE_MAP: Record<string, Locale> = {
  'en': 'en',
  'en-US': 'en',
  'en-GB': 'en',
  'en-NG': 'en',
  'fr': 'fr',
  'fr-FR': 'fr',
  'fr-BE': 'fr',
  'fr-SN': 'fr', // Senegal
  'fr-CI': 'fr', // Côte d'Ivoire
  'fr-BJ': 'fr', // Benin
  'fr-TG': 'fr', // Togo
  'pcm': 'pcm',
  'pcm-NG': 'pcm',
};

export const mapBrowserLanguage = (browserLang: string): Locale => {
  // Try exact match first
  if (BROWSER_LANGUAGE_MAP[browserLang]) {
    return BROWSER_LANGUAGE_MAP[browserLang];
  }
  
  // Try language code only (e.g., "en" from "en-US")
  const languageCode = browserLang.split('-')[0];
  if (BROWSER_LANGUAGE_MAP[languageCode]) {
    return BROWSER_LANGUAGE_MAP[languageCode];
  }
  
  return DEFAULT_LOCALE;
};