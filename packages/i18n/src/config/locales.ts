/**
 * Locale Configuration
 * 
 * Defines supported locales, currencies, and regional settings
 */

/**
 * Supported locale codes (ISO 639-1)
 */
export type LocaleCode = 'en' | 'fr' | 'pcm';

/**
 * Supported currency codes (ISO 4217)
 */
export type CurrencyCode = 'NGN' | 'USD' | 'EUR' | 'GBP' | 'XOF' | 'XAF';

/**
 * Text direction
 */
export type TextDirection = 'ltr' | 'rtl';

/**
 * Locale configuration interface
 */
export interface LocaleConfig {
  code: LocaleCode;
  name: string;
  nativeName: string;
  currency: CurrencyCode;
  direction: TextDirection;
  dateFormat: string;
  timeFormat: string;
  timezone: string;
  flag: string; // Emoji flag
  enabled: boolean;
}

/**
 * Currency configuration interface
 */
export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  decimals: number;
  symbolPosition: 'before' | 'after';
  thousandsSeparator: string;
  decimalSeparator: string;
}

/**
 * Default locale (English)
 */
export const DEFAULT_LOCALE: LocaleCode = (process.env.NEXT_PUBLIC_DEFAULT_LOCALE as LocaleCode) || 'en';

/**
 * Supported locales array
 */
export const SUPPORTED_LOCALES: LocaleCode[] = (
  process.env.NEXT_PUBLIC_SUPPORTED_LOCALES?.split(',') as LocaleCode[]
) || ['en', 'fr', 'pcm'];

/**
 * Complete locale configurations
 */
export const LOCALE_CONFIG: Record<LocaleCode, LocaleConfig> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    currency: 'NGN',
    direction: 'ltr',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: 'HH:mm',
    timezone: 'Africa/Lagos',
    flag: '🇬🇧',
    enabled: true,
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    currency: 'XOF', // West African CFA franc
    direction: 'ltr',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: 'HH:mm',
    timezone: 'Africa/Lagos',
    flag: '🇫🇷',
    enabled: true,
  },
  pcm: {
    code: 'pcm',
    name: 'Nigerian Pidgin',
    nativeName: 'Naija Pidgin',
    currency: 'NGN',
    direction: 'ltr',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: 'HH:mm',
    timezone: 'Africa/Lagos',
    flag: '🇳🇬',
    enabled: true,
  },
};

export const LOCALE_NAMES: Record<LocaleCode, string> = {
  en: 'English',
  fr: 'Français',
  pcm: 'Naija Pidgin',
};

/**
 * Currency configurations
 */
export const CURRENCY_CONFIG: Record<CurrencyCode, CurrencyConfig> = {
  NGN: {
    code: 'NGN',
    symbol: '₦',
    name: 'Nigerian Naira',
    decimals: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    decimals: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    decimals: 2,
    symbolPosition: 'after',
    thousandsSeparator: ' ',
    decimalSeparator: ',',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    decimals: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  XOF: {
    code: 'XOF',
    symbol: 'CFA',
    name: 'West African CFA Franc',
    decimals: 0,
    symbolPosition: 'after',
    thousandsSeparator: ' ',
    decimalSeparator: ',',
  },
  XAF: {
    code: 'XAF',
    symbol: 'FCFA',
    name: 'Central African CFA Franc',
    decimals: 0,
    symbolPosition: 'after',
    thousandsSeparator: ' ',
    decimalSeparator: ',',
  },
};

/**
 * Default currency
 */
export const DEFAULT_CURRENCY: CurrencyCode = (process.env.NEXT_PUBLIC_DEFAULT_CURRENCY as CurrencyCode) || 'NGN';

/**
 * Get locale configuration by code
 */
export const getLocaleConfig = (locale: LocaleCode): LocaleConfig => {
  return LOCALE_CONFIG[locale] || LOCALE_CONFIG[DEFAULT_LOCALE];
};

/**
 * Get currency configuration by code
 */
export const getCurrencyConfig = (currency: CurrencyCode): CurrencyConfig => {
  return CURRENCY_CONFIG[currency] || CURRENCY_CONFIG[DEFAULT_CURRENCY];
};

/**
 * Get available locales (only enabled ones)
 */
export const getAvailableLocales = (): LocaleConfig[] => {
  return Object.values(LOCALE_CONFIG).filter(locale => locale.enabled);
};

/**
 * Check if a locale is supported
 */
export const isLocaleSupported = (locale: string): locale is LocaleCode => {
  return SUPPORTED_LOCALES.includes(locale as LocaleCode);
};

/**
 * Check if a currency is supported
 */
export const isCurrencySupported = (currency: string): currency is CurrencyCode => {
  return Object.keys(CURRENCY_CONFIG).includes(currency);
};

/**
 * Get currency for a given locale
 */
export const getCurrencyForLocale = (locale: LocaleCode): CurrencyCode => {
  return getLocaleConfig(locale).currency;
};

/**
 * Map locale to browser language codes
 */
export const LOCALE_TO_BROWSER_LANG: Record<LocaleCode, string[]> = {
  en: ['en', 'en-US', 'en-GB', 'en-CA', 'en-AU'],
  fr: ['fr', 'fr-FR', 'fr-CA', 'fr-BE', 'fr-CH'],
  pcm: ['pcm', 'pcm-NG'],
};

/**
 * Get best matching locale from browser languages
 */
export const getBestMatchingLocale = (browserLangs: string[]): LocaleCode => {
  for (const lang of browserLangs) {
    const langCode = lang.split('-')[0].toLowerCase();
    for (const [locale, codes] of Object.entries(LOCALE_TO_BROWSER_LANG)) {
      if (codes.some(code => code.toLowerCase().startsWith(langCode))) {
        return locale as LocaleCode;
      }
    }
  }
  return DEFAULT_LOCALE;
};

/**
 * RTL locales (for future support)
 */
export const RTL_LOCALES: LocaleCode[] = [];

/**
 * Check if a locale is RTL
 */
export const isRTL = (locale: LocaleCode): boolean => {
  return RTL_LOCALES.includes(locale);
};