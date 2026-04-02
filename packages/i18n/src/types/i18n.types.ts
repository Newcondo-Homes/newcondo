/**
 * i18n Type Definitions
 * Location: packages/i18n/src/types/i18n.types.ts
 */
// Add this to packages/i18n/src/types/i18n.types.ts

export interface I18nConfig {
  supportedLocales: string[];
  defaultLocale: string;
  fallbackLocale: string;
  namespaces: string[];
  detection: LanguageDetectionConfig;
  cache: CacheConfig;
}

export interface LanguageDetectionConfig {
  order: DetectionOrder[];
  lookupCookie?: string;
  lookupLocalStorage?: string;
  lookupSessionStorage?: string;
  lookupQuerystring?: string;
  lookupHeader?: string;
  caches?: string[];
}

export type DetectionOrder = 
  | 'querystring'
  | 'cookie'
  | 'localStorage'
  | 'sessionStorage'
  | 'navigator'
  | 'htmlTag'
  | 'path'
  | 'subdomain'
  | 'header';

export interface CacheConfig {
  enabled: boolean;
  expirationTime?: number; // in milliseconds
  versions?: Record<string, string>;
}

export interface TranslationResource {
  [key: string]: string | TranslationResource;
}

export interface TranslationResources {
  [locale: string]: {
    [namespace: string]: TranslationResource;
  };
}

export interface TranslationOptions {
  lng?: string;
  ns?: string | string[];
  defaultValue?: string;
  count?: number;
  context?: string;
  replace?: Record<string, string | number>;
  interpolation?: InterpolationOptions;
}

export interface InterpolationOptions {
  escapeValue?: boolean;
  prefix?: string;
  suffix?: string;
  format?: (value: any, format?: string, lng?: string) => string;
}

export interface PluralRules {
  [locale: string]: (count: number) => number;
}

export interface DateFormatOptions {
  locale?: string;
  dateStyle?: 'full' | 'long' | 'medium' | 'short';
  timeStyle?: 'full' | 'long' | 'medium' | 'short';
  year?: 'numeric' | '2-digit';
  month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
  day?: 'numeric' | '2-digit';
  hour?: 'numeric' | '2-digit';
  minute?: 'numeric' | '2-digit';
  second?: 'numeric' | '2-digit';
  timeZone?: string;
  hour12?: boolean;
}

export interface NumberFormatOptions {
  locale?: string;
  style?: 'decimal' | 'currency' | 'percent' | 'unit';
  currency?: string;
  currencyDisplay?: 'symbol' | 'narrowSymbol' | 'code' | 'name';
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  useGrouping?: boolean;
}

export interface TranslationFunction {
  (key: string, options?: TranslationOptions): string;
  (key: string, defaultValue?: string, options?: TranslationOptions): string;
}

export interface I18nInstance {
  language: string;
  languages: string[];
  t: TranslationFunction;
  changeLanguage: (lng: string) => Promise<void>;
  loadNamespaces: (namespaces: string | string[]) => Promise<void>;
  hasLoadedNamespace: (ns: string) => boolean;
  getResource: (lng: string, ns: string, key: string) => any;
  exists: (key: string, options?: TranslationOptions) => boolean;
}

export interface LanguageDetectionResult {
  locale: string;
  source: DetectionOrder;
  confidence: number; // 0-1
}

export interface LocaleMetadata {
  code: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  region: string;
  currency: string;
  dateFormat: string;
  timeFormat: string;
  firstDayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
}

export interface TranslationKey {
  namespace: string;
  key: string;
  defaultValue?: string;
}

export interface MissingTranslation {
  locale: string;
  namespace: string;
  key: string;
  timestamp: Date;
}

export interface I18nContextValue {
  locale: string;
  locales: string[];
  defaultLocale: string;
  setLocale: (locale: string) => void;
  t: TranslationFunction;
  formatDate: (date: Date, options?: DateFormatOptions) => string;
  formatNumber: (value: number, options?: NumberFormatOptions) => string;
  formatCurrency: (value: number, currency?: string) => string;
  isRTL: boolean;
}

export interface LoadNamespaceOptions {
  locale?: string;
  namespaces: string[];
  fallback?: boolean;
}

export interface TranslationLoadResult {
  locale: string;
  namespace: string;
  translations: TranslationResource;
  loadedAt: Date;
  status: 'success' | 'error' | 'cached';
}

export type TranslationNamespace = 
  | 'common'
  | 'auth'
  | 'property'
  | 'payment'
  | 'profile'
  | 'admin'
  | 'errors'
  | 'validation';

export interface NamespaceConfig {
  name: TranslationNamespace;
  preload: boolean;
  lazy: boolean;
}