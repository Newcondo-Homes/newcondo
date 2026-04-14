/**
 * @newcondo/i18n
 * 
 * Shared internationalization package for Newcondo monorepo
 * Provides multi-language support, currency formatting, and locale management
 */

// Configuration exports
export { i18nConfig, initI18n } from './config/i18n.config';
export { NAMESPACES, type Namespace } from './config/namespaces';
export { 
  SUPPORTED_LOCALES,
  SUPPORTED_LOCALES as locales,
  LOCALE_NAMES as localeNames, 
  DEFAULT_LOCALE, 
  LOCALE_CONFIG,
  type LocaleCode,
  type LocaleCode as Locale,
  type LocaleConfig,
} from './config/locales';

export { 
  languageMetadata,
  languages,
  fallbackLng,
  // getOptions,
  pluralRules,
  // numberFormats,
  type Language,
} from './config/translations';

export {
  type CurrencyCode,
  DEFAULT_CURRENCY
} from './utils/currency'

// Hook exports
export { useTranslation } from './hooks/useTranslation';
export { useLocale } from './hooks/useLocale';
export { useCurrency } from './hooks/useCurrency';

// Middleware exports
export { 
  detectLanguage, 
  getPreferredLocale,
  parseAcceptLanguage 
} from './middleware/languageDetection';

// Type exports for external use
export type {
  TranslationFunction,
  TranslationKey,
  InterpolationOptions
} from './hooks/useTranslation';

export type {
  CurrencyFormatOptions,
  NumberFormatOptions
} from './hooks/useCurrency';

export type {
  LocaleChangeCallback,
  LocaleContext
} from './hooks/useLocale';

// Re-export i18next types for convenience
export type { TFunction, i18n } from 'i18next';