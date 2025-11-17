import type { InitOptions } from 'i18next';

/**
 * Supported languages configuration
 */
export const languages = ['en', 'fr', 'pcm'] as const; // English, French, Nigerian Pidgin
export const fallbackLng = 'en';
export const defaultNS = 'common';
export const cookieName = 'i18next';

/**
 * Language metadata
 */
export const languageMetadata = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    direction: 'ltr' as const,
    currency: 'NGN', // Nigerian Naira (default for platform)
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    direction: 'ltr' as const,
    currency: 'NGN',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
  },
  pcm: {
    code: 'pcm',
    name: 'Nigerian Pidgin',
    nativeName: 'Naija Pidgin',
    flag: '🇳🇬',
    direction: 'ltr' as const,
    currency: 'NGN',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
  },
} as const;

export type Language = (typeof languages)[number];
export type LanguageMetadata = typeof languageMetadata;

/**
 * Available namespaces
 */
export const namespaces = [
  'common',
  'auth',
  'properties',
  'payments',
  'profile',
  'referrals',
  'admin',
  'errors',
  'validation',
  'marking',
  'notifications',
  'legal',
] as const;

export type Namespace = (typeof namespaces)[number];

/**
 * i18next configuration options
 */
export function getOptions(
  lng: string = fallbackLng,
  ns: string | string[] = defaultNS
): InitOptions {
  return {
    // debug: process.env.NODE_ENV === 'development',
    supportedLngs: languages,
    fallbackLng,
    lng,
    fallbackNS: defaultNS,
    defaultNS,
    ns,
    interpolation: {
      escapeValue: false, // React already escapes values
      formatSeparator: ',',
      format: (value, format, lng) => {
        if (format === 'uppercase') return value.toUpperCase();
        if (format === 'lowercase') return value.toLowerCase();
        if (format === 'capitalize') {
          return value.charAt(0).toUpperCase() + value.slice(1);
        }
        
        // Date formatting
        if (value instanceof Date) {
          if (format === 'short') {
            return new Intl.DateTimeFormat(lng, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            }).format(value);
          }
          if (format === 'long') {
            return new Intl.DateTimeFormat(lng, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
            }).format(value);
          }
          return new Intl.DateTimeFormat(lng).format(value);
        }
        
        // Number formatting
        if (typeof value === 'number') {
          if (format === 'currency') {
            return new Intl.NumberFormat(lng, {
              style: 'currency',
              currency: 'NGN',
            }).format(value);
          }
          if (format === 'percent') {
            return new Intl.NumberFormat(lng, {
              style: 'percent',
            }).format(value);
          }
        }
        
        return value;
      },
    },
    react: {
      useSuspense: false,
    },
    detection: {
      order: ['cookie', 'header', 'navigator'],
      caches: ['cookie'],
      cookieName,
    },
  };
}

/**
 * Get language metadata
 */
export function getLanguageMetadata(lang: Language) {
  return languageMetadata[lang];
}

/**
 * Get all language options for language selector
 */
export function getLanguageOptions() {
  return languages.map((lang) => ({
    value: lang,
    label: languageMetadata[lang].nativeName,
    flag: languageMetadata[lang].flag,
  }));
}

/**
 * Check if language is RTL
 */
export function isRTL(lang: string): boolean {
  return (
    languageMetadata[lang as Language]?.direction === 'rtl'
  );
}

/**
 * Get currency for language
 */
export function getCurrencyForLanguage(lang: Language): string {
  return languageMetadata[lang].currency;
}

/**
 * Get date format for language
 */
export function getDateFormatForLanguage(lang: Language): string {
  return languageMetadata[lang].dateFormat;
}

/**
 * Translation key type helpers
 */
export type TranslationKey = string;

/**
 * Type-safe translation namespaces
 */
export interface TranslationNamespaces {
  common: {
    welcome: string;
    loading: string;
    error: string;
    success: string;
    // ... add more keys as needed
  };
  auth: {
    login: string;
    register: string;
    logout: string;
    // ... add more keys
  };
  // ... add more namespaces
}

/**
 * Regional settings
 */
export const regionalSettings = {
  nigeria: {
    currency: 'NGN',
    locale: 'en-NG',
    phonePrefix: '+234',
    dateFormat: 'DD/MM/YYYY',
    languages: ['en', 'pcm'] as Language[],
  },
  france: {
    currency: 'EUR',
    locale: 'fr-FR',
    phonePrefix: '+33',
    dateFormat: 'DD/MM/YYYY',
    languages: ['fr'] as Language[],
  },
} as const;

export type Region = keyof typeof regionalSettings;

/**
 * Get regional settings
 */
export function getRegionalSettings(region: Region) {
  return regionalSettings[region];
}

/**
 * Pluralization rules for different languages
 */
export const pluralRules: Record<Language, (count: number) => number> = {
  en: (count: number) => (count === 1 ? 0 : 1),
  fr: (count: number) => (count <= 1 ? 0 : 1),
  pcm: (count: number) => (count === 1 ? 0 : 1),
};

/**
 * Get plural form index
 */
export function getPluralForm(count: number, lang: Language): number {
  return pluralRules[lang](count);
}

/**
 * Validation for translation keys
 */
export function isValidTranslationKey(key: string): boolean {
  // Check if key follows the pattern: namespace:path.to.key
  const pattern = /^[a-z]+:[a-zA-Z0-9_.]+$/;
  return pattern.test(key);
}

/**
 * Parse translation key
 */
export function parseTranslationKey(key: string): {
  namespace: string;
  path: string;
} | null {
  if (!isValidTranslationKey(key)) {
    return null;
  }
  
  const [namespace, ...pathParts] = key.split(':');
  return {
    namespace,
    path: pathParts.join(':'),
  };
}

/**
 * Build translation key
 */
export function buildTranslationKey(namespace: string, path: string): string {
  return `${namespace}:${path}`;
}

/**
 * Language-specific number formats
 */
export const numberFormats: Record
  Language,
  {
    decimal: string;
    thousand: string;
    precision: number;
  }
> = {
  en: {
    decimal: '.',
    thousand: ',',
    precision: 2,
  },
  fr: {
    decimal: ',',
    thousand: ' ',
    precision: 2,
  },
  pcm: {
    decimal: '.',
    thousand: ',',
    precision: 2,
  },
};

/**
 * Get number format for language
 */
export function getNumberFormat(lang: Language) {
  return numberFormats[lang];
}

/**
 * Translation loading strategies
 */
export const loadingStrategy = {
  // Namespaces to load on initial page load
  initial: ['common', 'errors'] as Namespace[],
  
  // Namespaces to lazy load
  lazy: [
    'properties',
    'payments',
    'profile',
    'referrals',
    'marking',
    'notifications',
    'legal',
  ] as Namespace[],
  
  // Admin-only namespaces
  admin: ['admin'] as Namespace[],
};

/**
 * Get namespaces to preload based on user role
 */
export function getNamespacesToPreload(userRole?: string): Namespace[] {
  const baseNamespaces = [...loadingStrategy.initial];
  
  if (userRole === 'ADMIN') {
    baseNamespaces.push(...loadingStrategy.admin);
  }
  
  return baseNamespaces;
}