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
  DEFAULT_LOCALE, 
  LOCALE_CONFIG,
  type LocaleCode,
  type LocaleConfig,
  type CurrencyCode
} from './config/locales';

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