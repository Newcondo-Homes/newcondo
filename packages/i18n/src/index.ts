/**
 * @newcondo/i18n
 * 
 * Shared internationalization package for Newcondo monorepo
 * Provides multi-language support, currency formatting, and locale management
 */

import { LocaleCode } from './config/locales';

// Configuration exports
// export { i18nConfig, initI18n, getI18n } from './config/i18n.config';
export { NAMESPACES, type Namespace } from './config/namespaces';
export { 
  SUPPORTED_LOCALES,
  SUPPORTED_LOCALES as locales,
  LOCALE_NAMES as localeNames, 
  DEFAULT_LOCALE, 
  LOCALE_CONFIG,
  RTL_LOCALES as rtlLocales,
  type LocaleCode,
  type LocaleCode as Locale,
  type LocaleConfig,
  isLocaleSupported, 
} from './config/locales';

export type SupportedLocale = LocaleCode

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


// Middleware exports
export { 
  detectLanguage, 
  getPreferredLocale,
  parseAcceptLanguage 
} from './middleware/languageDetection';


// Re-export i18next types for convenience
export type { TFunction, i18n } from 'i18next';

