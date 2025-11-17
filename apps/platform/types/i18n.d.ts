import 'i18next';
import { type Language, type Namespace } from '@/lib/i18n/translations';

/**
 * Type definitions for i18n
 */

declare module 'i18next' {
  interface CustomTypeOptions {
    returnNull: false;
    defaultNS: 'common';
    resources: {
      common: typeof import('../lib/i18n/locales/en/common.json');
      auth: typeof import('../lib/i18n/locales/en/auth.json');
      properties: typeof import('../lib/i18n/locales/en/properties.json');
      payments: typeof import('../lib/i18n/locales/en/payments.json');
      profile: typeof import('../lib/i18n/locales/en/profile.json');
      referrals: typeof import('../lib/i18n/locales/en/referrals.json');
      admin: typeof import('../lib/i18n/locales/en/admin.json');
      errors: typeof import('../lib/i18n/locales/en/errors.json');
      validation: typeof import('../lib/i18n/locales/en/validation.json');
      marking: typeof import('../lib/i18n/locales/en/marking.json');
      notifications: typeof import('../lib/i18n/locales/en/notifications.json');
      legal: typeof import('../lib/i18n/locales/en/legal.json');
    };
  }
}

/**
 * Translation function type
 */
export type TFunction = (
  key: string,
  options?: Record<string, any>
) => string;

/**
 * Translation options
 */
export interface TranslationOptions {
  defaultValue?: string;
  count?: number;
  context?: string;
  replace?: Record<string, string | number>;
  [key: string]: any;
}

/**
 * Language change event
 */
export interface LanguageChangeEvent {
  language: Language;
  previousLanguage: Language;
}

/**
 * Translation namespace resources
 */
export interface NamespaceResources {
  [key: string]: any;
}

/**
 * Locale configuration
 */
export interface LocaleConfig {
  language: Language;
  namespace: Namespace | Namespace[];
  fallback?: Language;
}

/**
 * Translation key path helper
 */
export type TranslationKeyPath<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}` | `${K}.${TranslationKeyPath<T[K]>}`
          : `${K}`
        : never;
    }[keyof T]
  : never;

/**
 * Formatted message
 */
export interface FormattedMessage {
  id: string;
  defaultMessage?: string;
  values?: Record<string, any>;
}

/**
 * Translation metadata
 */
export interface TranslationMetadata {
  language: Language;
  namespace: Namespace;
  key: string;
  value: string;
  lastModified?: Date;
}

/**
 * Locale preferences
 */
export interface LocalePreferences {
  language: Language;
  currency: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  timezone?: string;
}

/**
 * Translation loading state
 */
export interface TranslationLoadingState {
  isLoading: boolean;
  isReady: boolean;
  error?: Error;
}

/**
 * Pluralization rule
 */
export type PluralizationRule = (count: number) => number;

/**
 * Interpolation options
 */
export interface InterpolationOptions {
  escape?: boolean;
  format?: (value: any, format: string, lng: string) => string;
  prefix?: string;
  suffix?: string;
}

/**
 * Translation validator
 */
export interface TranslationValidator {
  validate: (key: string, value: any) => boolean;
  errors: string[];
}

/**
 * Locale data
 */
export interface LocaleData {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
  direction: 'ltr' | 'rtl';
  currency: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
}

/**
 * Translation cache entry
 */
export interface TranslationCacheEntry {
  key: string;
  value: string;
  language: Language;
  namespace: Namespace;
  timestamp: number;
}

/**
 * Global i18n types
 */
declare global {
  namespace I18n {
    type Language = Language;
    type Namespace = Namespace;
    type TFunction = TFunction;
  }
}

export {};