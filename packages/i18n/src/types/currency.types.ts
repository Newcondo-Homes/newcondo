/**
 * Currency Type Definitions
 * Location: packages/i18n/src/types/currency.types.ts
 */

export type SupportedCurrency = 'NGN' | 'USD' | 'EUR' | 'GBP' | 'XAF'; // Nigerian Naira, US Dollar, Euro, British Pound, Central African Franc

export interface CurrencyInfo {
  code: SupportedCurrency;
  name: string;
  symbol: string;
  symbolNative: string;
  decimalDigits: number;
  rounding: number;
  nameTranslations: Record<string, string>; // Locale -> translated name
}

export interface CurrencyFormatOptions {
  currency: SupportedCurrency;
  locale?: string;
  style?: 'symbol' | 'code' | 'name';
  display?: 'standard' | 'narrow' | 'short';
  decimals?: number;
  useGrouping?: boolean;
  showSymbol?: boolean;
  symbolPosition?: 'before' | 'after';
  spaceBetween?: boolean;
}

export interface ExchangeRate {
  from: SupportedCurrency;
  to: SupportedCurrency;
  rate: number;
  timestamp: Date;
  source: string; // API source
  inverseRate: number;
}

export interface ExchangeRateCache {
  rates: Map<string, ExchangeRate>; // key: 'FROM_TO'
  lastUpdated: Date;
  expiresAt: Date;
  isStale: boolean;
}

export interface CurrencyConversion {
  amount: number;
  fromCurrency: SupportedCurrency;
  toCurrency: SupportedCurrency;
  convertedAmount: number;
  rate: ExchangeRate;
  fee?: number;
  total?: number;
  timestamp: Date;
}

export interface CurrencySettings {
  primary: SupportedCurrency;
  display: SupportedCurrency[];
  enableConversion: boolean;
  autoUpdate: boolean;
  updateInterval: number; // in minutes
}

export interface PaymentCurrency {
  currency: SupportedCurrency;
  supported: boolean;
  gatewayFees: GatewayFees;
  minimumAmount: number;
  maximumAmount: number;
  processingTime: string; // e.g., 'instant', '1-3 days'
}

export interface GatewayFees {
  percentage: number;
  fixed: number;
  cap?: number; // Maximum fee
  currency: SupportedCurrency;
}

export interface CurrencyFormatter {
  format: (amount: number, options?: CurrencyFormatOptions) => string;
  parse: (formatted: string, currency: SupportedCurrency) => number;
  validate: (amount: number, currency: SupportedCurrency) => boolean;
}

export interface MoneyAmount {
  amount: number;
  currency: SupportedCurrency;
  formatted?: string;
}

export interface CurrencyPair {
  base: SupportedCurrency;
  quote: SupportedCurrency;
  rate: number;
  spread?: number; // Bid-ask spread
}

export interface LocalCurrencyPreference {
  userId?: string;
  displayCurrency: SupportedCurrency;
  paymentCurrency: SupportedCurrency;
  showConversions: boolean;
  autoConvert: boolean;
  savedAt: Date;
}

// Nigeria-specific currency types
export interface NairaFormatting {
  useKobo: boolean; // Show kobo (decimal places)
  useCommas: boolean;
  symbolPosition: 'before' | 'after';
  spaceAfterSymbol: boolean;
  negativeFormat: 'parentheses' | 'minus'; // (₦100) vs -₦100
}

export interface CurrencyValidation {
  isValid: boolean;
  currency?: SupportedCurrency;
  amount?: number;
  errors: string[];
  warnings: string[];
}

export interface CurrencyRange {
  min: MoneyAmount;
  max: MoneyAmount;
  currency: SupportedCurrency;
}

// For displaying prices in multiple currencies
export interface MultiCurrencyPrice {
  primary: MoneyAmount;
  conversions: MoneyAmount[];
  lastUpdated: Date;
  disclaimer?: string;
}

export interface CurrencySymbolStyle {
  standard: string; // e.g., '₦'
  narrow: string; // e.g., '₦'
  short: string; // e.g., 'NGN'
  long: string; // e.g., 'Nigerian Naira'
}

export interface CurrencyContext {
  current: SupportedCurrency;
  available: CurrencyInfo[];
  rates: ExchangeRateCache;
  settings: CurrencySettings;
  format: CurrencyFormatter;
}

// Payment gateway specific
export interface FlutterwaveCurrency {
  currency: SupportedCurrency;
  charge: GatewayFees;
  supportedMethods: PaymentMethod[];
  restrictions?: CurrencyRestrictions;
}

export type PaymentMethod = 
  | 'card'
  | 'bank_transfer'
  | 'ussd'
  | 'mobile_money'
  | 'qr'
  | 'bank_account';

export interface CurrencyRestrictions {
  minTransaction: number;
  maxTransaction: number;
  dailyLimit?: number;
  monthlyLimit?: number;
  requiresVerification: boolean;
}

export interface CurrencyRounding {
  currency: SupportedCurrency;
  rule: 'up' | 'down' | 'nearest';
  precision: number; // Decimal places
  unit?: number; // Round to nearest unit (e.g., 5, 10, 50)
}