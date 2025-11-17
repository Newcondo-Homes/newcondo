import { SupportedLocale, DEFAULT_LOCALE } from '../i18n/middleware/i18nMiddleware';

/**
 * Supported currencies
 */
export enum Currency {
  NGN = 'NGN', // Nigerian Naira
  USD = 'USD', // US Dollar
  EUR = 'EUR', // Euro
  GBP = 'GBP', // British Pound
  XOF = 'XOF', // West African CFA franc
}

/**
 * Currency symbols
 */
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  [Currency.NGN]: '₦',
  [Currency.USD]: '$',
  [Currency.EUR]: '€',
  [Currency.GBP]: '£',
  [Currency.XOF]: 'CFA',
};

/**
 * Default currency per locale
 */
export const LOCALE_CURRENCY_MAP: Record<SupportedLocale, Currency> = {
  en: Currency.NGN,
  fr: Currency.XOF,
  pcm: Currency.NGN,
};

/**
 * Format currency amount based on locale
 */
export function formatCurrency(
  amount: number,
  currency: Currency = Currency.NGN,
  locale: SupportedLocale = DEFAULT_LOCALE
): string {
  const formatter = new Intl.NumberFormat(getLocaleForCurrency(locale), {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(amount);
}

/**
 * Format currency amount with custom options
 */
export function formatCurrencyCustom(
  amount: number,
  currency: Currency,
  locale: SupportedLocale,
  options: Partial<Intl.NumberFormatOptions> = {}
): string {
  const formatter = new Intl.NumberFormat(getLocaleForCurrency(locale), {
    style: 'currency',
    currency,
    ...options,
  });

  return formatter.format(amount);
}

/**
 * Format amount without currency symbol
 */
export function formatAmount(
  amount: number,
  locale: SupportedLocale = DEFAULT_LOCALE,
  decimals: number = 2
): string {
  const formatter = new Intl.NumberFormat(getLocaleForCurrency(locale), {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return formatter.format(amount);
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: Currency): string {
  return CURRENCY_SYMBOLS[currency] || currency;
}

/**
 * Get default currency for locale
 */
export function getLocaleCurrency(locale: SupportedLocale): Currency {
  return LOCALE_CURRENCY_MAP[locale] || Currency.NGN;
}

/**
 * Convert locale to Intl locale format
 */
function getLocaleForCurrency(locale: SupportedLocale): string {
  const localeMap: Record<SupportedLocale, string> = {
    en: 'en-NG', // English (Nigeria)
    fr: 'fr-FR', // French (France)
    pcm: 'en-NG', // Pidgin (use Nigerian English format)
  };

  return localeMap[locale] || 'en-NG';
}

/**
 * Parse currency string to number
 */
export function parseCurrencyString(currencyString: string): number {
  // Remove currency symbols and non-numeric characters except decimal point
  const cleaned = currencyString.replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
}

/**
 * Format large numbers with abbreviations (K, M, B)
 */
export function formatCompactCurrency(
  amount: number,
  currency: Currency = Currency.NGN,
  locale: SupportedLocale = DEFAULT_LOCALE
): string {
  const formatter = new Intl.NumberFormat(getLocaleForCurrency(locale), {
    style: 'currency',
    currency,
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  });

  return formatter.format(amount);
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number, decimals: number = 2): number {
  if (total === 0) return 0;
  return Number(((value / total) * 100).toFixed(decimals));
}

/**
 * Format percentage
 */
export function formatPercentage(
  value: number,
  locale: SupportedLocale = DEFAULT_LOCALE,
  decimals: number = 2
): string {
  const formatter = new Intl.NumberFormat(getLocaleForCurrency(locale), {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return formatter.format(value / 100);
}

/**
 * Convert currency (simplified - in production, use real exchange rates)
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): Promise<number> {
  // TODO: Implement actual currency conversion using a service like exchangerate-api.com
  // This is a placeholder implementation
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // Placeholder exchange rates (update with real rates)
  const exchangeRates: Record<string, number> = {
    'NGN_USD': 0.0012,
    'USD_NGN': 833.33,
    'NGN_EUR': 0.0011,
    'EUR_NGN': 909.09,
    'NGN_GBP': 0.00095,
    'GBP_NGN': 1052.63,
    'XOF_NGN': 1.35,
    'NGN_XOF': 0.74,
  };

  const rateKey = `${fromCurrency}_${toCurrency}`;
  const rate = exchangeRates[rateKey] || 1;

  return amount * rate;
}

/**
 * Round to nearest currency unit
 */
export function roundToNearestUnit(amount: number, unit: number = 1): number {
  return Math.round(amount / unit) * unit;
}

/**
 * Format currency range
 */
export function formatCurrencyRange(
  min: number,
  max: number,
  currency: Currency = Currency.NGN,
  locale: SupportedLocale = DEFAULT_LOCALE
): string {
  const minFormatted = formatCurrency(min, currency, locale);
  const maxFormatted = formatCurrency(max, currency, locale);
  return `${minFormatted} - ${maxFormatted}`;
}