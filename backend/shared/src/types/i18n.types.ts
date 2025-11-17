/**
 * File: backend/shared/src/types/i18n.types.ts
 * Type definitions for internationalization (i18n) system
 */

/**
 * Supported locales/languages in the platform
 */
export type SupportedLocale = 'en' | 'fr' | 'pcm';

/**
 * Supported currencies
 */
export type SupportedCurrency = 'NGN' | 'USD' | 'EUR' | 'GBP';

/**
 * Currency configuration
 */
export interface CurrencyConfig {
  code: SupportedCurrency;
  symbol: string;
  name: string;
  decimals: number;
  locale: string;
}

/**
 * Locale configuration
 */
export interface LocaleConfig {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  dateFormat: string;
  timeFormat: string;
  isDefault: boolean;
  isEnabled: boolean;
}

/**
 * Translation namespace types
 */
export type TranslationNamespace =
  | 'common'
  | 'auth'
  | 'properties'
  | 'payments'
  | 'marking'
  | 'admin'
  | 'notifications'
  | 'errors'
  | 'validation';

/**
 * Translation key structure
 */
export interface TranslationKey {
  namespace: TranslationNamespace;
  key: string;
  defaultValue?: string;
}

/**
 * Translation resource structure
 */
export interface TranslationResource {
  [key: string]: string | TranslationResource;
}

/**
 * Translation function type
 */
export type TranslationFunction = (
  key: string,
  options?: TranslationOptions
) => string;

/**
 * Translation options
 */
export interface TranslationOptions {
  defaultValue?: string;
  count?: number;
  context?: string;
  replace?: Record<string, string | number>;
  locale?: SupportedLocale;
}

/**
 * Localized content structure
 */
export interface LocalizedContent {
  locale: SupportedLocale;
  content: string;
}

/**
 * Multi-language field
 */
export interface MultiLanguageField {
  en: string;
  fr?: string;
  pcm?: string;
}

/**
 * Localized error message
 */
export interface LocalizedError {
  code: string;
  message: MultiLanguageField;
  details?: Record<string, any>;
}

/**
 * Date format options
 */
export interface DateFormatOptions {
  format: 'short' | 'medium' | 'long' | 'full';
  includeTime?: boolean;
  relative?: boolean;
}

/**
 * Number format options
 */
export interface NumberFormatOptions {
  style?: 'decimal' | 'currency' | 'percent';
  currency?: SupportedCurrency;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

/**
 * User locale preferences
 */
export interface UserLocalePreferences {
  userId: string;
  locale: SupportedLocale;
  currency: SupportedCurrency;
  timezone?: string;
  dateFormat?: string;
  timeFormat?: '12h' | '24h';
  updatedAt: Date;
}

/**
 * Content translation status
 */
export type TranslationStatus = 'pending' | 'translated' | 'reviewed' | 'published';

/**
 * Translatable content
 */
export interface TranslatableContent {
  id: string;
  contentType: string;
  sourceLocale: SupportedLocale;
  translations: {
    [K in SupportedLocale]?: {
      content: string;
      status: TranslationStatus;
      translatedBy?: string;
      translatedAt?: Date;
      reviewedBy?: string;
      reviewedAt?: Date;
    };
  };
}

/**
 * Language detection result
 */
export interface LanguageDetectionResult {
  locale: SupportedLocale;
  confidence: number;
  source: 'header' | 'query' | 'cookie' | 'default';
}

/**
 * i18n middleware options
 */
export interface I18nMiddlewareOptions {
  supportedLocales: SupportedLocale[];
  defaultLocale: SupportedLocale;
  fallbackLocale: SupportedLocale;
  detectFromHeaders?: boolean;
  detectFromQuery?: boolean;
  detectFromCookie?: boolean;
  cookieName?: string;
  queryParamName?: string;
}

/**
 * Regional settings
 */
export interface RegionalSettings {
  locale: SupportedLocale;
  currency: SupportedCurrency;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  numberFormat: string;
  firstDayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
}

/**
 * Payment method localization
 */
export interface LocalizedPaymentMethod {
  id: string;
  name: MultiLanguageField;
  description: MultiLanguageField;
  supportedCurrencies: SupportedCurrency[];
  supportedRegions: string[];
  isEnabled: boolean;
}

/**
 * Notification template localization
 */
export interface LocalizedNotificationTemplate {
  id: string;
  type: string;
  subject: MultiLanguageField;
  body: MultiLanguageField;
  smsBody?: MultiLanguageField;
  variables: string[];
}

/**
 * Error message localization
 */
export interface LocalizedErrorMessage {
  code: string;
  httpStatus: number;
  message: MultiLanguageField;
  userMessage: MultiLanguageField;
  developerMessage?: string;
}

/**
 * Form field localization
 */
export interface LocalizedFormField {
  name: string;
  label: MultiLanguageField;
  placeholder?: MultiLanguageField;
  helpText?: MultiLanguageField;
  validation?: {
    required?: MultiLanguageField;
    min?: MultiLanguageField;
    max?: MultiLanguageField;
    pattern?: MultiLanguageField;
    custom?: MultiLanguageField;
  };
}

/**
 * Legal document localization
 */
export interface LocalizedLegalDocument {
  type: 'terms' | 'privacy' | 'consent' | 'undertaking';
  version: string;
  content: MultiLanguageField;
  effectiveDate: Date;
  requiresAcceptance: boolean;
}

/**
 * Property amenity localization
 */
export interface LocalizedAmenity {
  id: string;
  name: MultiLanguageField;
  description?: MultiLanguageField;
  icon?: string;
  category: string;
}

/**
 * Status label localization
 */
export interface LocalizedStatusLabel {
  status: string;
  label: MultiLanguageField;
  description?: MultiLanguageField;
  color?: string;
}

/**
 * Navigation item localization
 */
export interface LocalizedNavigationItem {
  id: string;
  label: MultiLanguageField;
  path: string;
  icon?: string;
  children?: LocalizedNavigationItem[];
}

/**
 * Locale detection context
 */
export interface LocaleDetectionContext {
  acceptLanguageHeader?: string;
  queryParam?: string;
  cookie?: string;
  userPreference?: SupportedLocale;
  ipCountry?: string;
}

/**
 * Translation cache entry
 */
export interface TranslationCacheEntry {
  namespace: TranslationNamespace;
  locale: SupportedLocale;
  data: TranslationResource;
  loadedAt: Date;
  expiresAt?: Date;
}

/**
 * i18n configuration
 */
export interface I18nConfig {
  supportedLocales: LocaleConfig[];
  defaultLocale: SupportedLocale;
  fallbackLocale: SupportedLocale;
  supportedCurrencies: CurrencyConfig[];
  defaultCurrency: SupportedCurrency;
  namespaces: TranslationNamespace[];
  cacheEnabled: boolean;
  cacheTTL?: number;
  loadPath?: string;
  savePath?: string;
}

/**
 * RTL (Right-to-Left) configuration
 */
export interface RTLConfig {
  enabled: boolean;
  locales: SupportedLocale[];
  mirrorPositions: boolean;
  flipIcons: boolean;
}

/**
 * Localization metadata
 */
export interface LocalizationMetadata {
  locale: SupportedLocale;
  translatedFields: string[];
  lastTranslatedAt?: Date;
  translatedBy?: string;
  reviewStatus?: TranslationStatus;
  notes?: string;
}