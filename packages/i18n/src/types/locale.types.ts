/**
 * Locale Type Definitions
 * Location: packages/i18n/src/types/locale.types.ts
 */

export type SupportedLocale = 'en' | 'fr' | 'pcm'; // English, French, Nigerian Pidgin

export type LocaleDirection = 'ltr' | 'rtl';

export interface LocaleInfo {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  direction: LocaleDirection;
  flag: string; // Flag emoji or icon
  enabled: boolean;
}

export interface LocaleSettings {
  locale: SupportedLocale;
  dateFormat: DateFormatPattern;
  timeFormat: TimeFormatPattern;
  numberFormat: NumberFormatPattern;
  currency: string;
  timezone: string;
  firstDayOfWeek: DayOfWeek;
}

export type DateFormatPattern = 
  | 'DD/MM/YYYY'
  | 'MM/DD/YYYY'
  | 'YYYY-MM-DD'
  | 'DD.MM.YYYY'
  | 'YYYY/MM/DD';

export type TimeFormatPattern = '12h' | '24h';

export type NumberFormatPattern = 
  | '1,234.56' // English style
  | '1 234,56' // French style
  | '1.234,56'; // Some European countries

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday, etc.

export interface RegionalSettings {
  region: string; // e.g., 'Africa', 'Europe', 'Americas'
  country: string; // e.g., 'Nigeria', 'France'
  countryCode: string; // ISO 3166-1 alpha-2 code
  phonePrefix: string; // e.g., '+234', '+33'
  locale: SupportedLocale;
  currency: string;
  supportedPaymentMethods: string[];
}

export interface LocaleDetection {
  browser: SupportedLocale | null;
  system: SupportedLocale | null;
  stored: SupportedLocale | null;
  ip: SupportedLocale | null;
  selected: SupportedLocale;
  confidence: number; // 0-100
  method: LocaleDetectionMethod;
}

export type LocaleDetectionMethod = 
  | 'user_preference'
  | 'browser'
  | 'system'
  | 'storage'
  | 'ip_geolocation'
  | 'default';

export interface LocaleContext {
  current: SupportedLocale;
  available: LocaleInfo[];
  fallback: SupportedLocale;
  isRTL: boolean;
  settings: LocaleSettings;
  regional: RegionalSettings;
}

export interface LocaleChangeEvent {
  from: SupportedLocale;
  to: SupportedLocale;
  timestamp: Date;
  trigger: LocaleChangeTrigger;
}

export type LocaleChangeTrigger = 
  | 'user_action'
  | 'auto_detection'
  | 'system_change'
  | 'app_initialization';

export interface TranslationProgress {
  locale: SupportedLocale;
  namespace: string;
  total: number;
  translated: number;
  percentage: number;
  missing: string[];
  lastUpdated: Date;
}

export interface LocalePreference {
  userId?: string;
  locale: SupportedLocale;
  autoDetect: boolean;
  dateFormat: DateFormatPattern;
  timeFormat: TimeFormatPattern;
  timezone: string;
  savedAt: Date;
}

// Nigerian-specific locale types
export interface NigerianLocaleData {
  states: NigerianState[];
  lgas: Record<string, string[]>; // State code -> LGAs
  cities: string[];
  regions: NigerianRegion[];
}

export interface NigerianState {
  code: string;
  name: string;
  capital: string;
  region: NigerianRegion;
  lgas: string[];
}

export type NigerianRegion = 
  | 'North Central'
  | 'North East'
  | 'North West'
  | 'South East'
  | 'South South'
  | 'South West';

// Language-specific formatting
export interface LanguageFormatting {
  locale: SupportedLocale;
  decimalSeparator: string;
  thousandsSeparator: string;
  currencyPosition: 'before' | 'after';
  currencySpacing: boolean;
  negativePattern: string; // e.g., '-n', '(n)', 'n-'
  percentPattern: string; // e.g., 'n%', '%n'
}

export interface PluralForm {
  locale: SupportedLocale;
  rule: PluralRule;
  forms: number; // Number of plural forms (1-6)
}

export type PluralRule = (count: number) => number;

export interface LocaleValidation {
  isValid: boolean;
  locale?: SupportedLocale;
  errors: string[];
  suggestions: SupportedLocale[];
}