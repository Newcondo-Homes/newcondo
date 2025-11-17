export type CurrencyCode = 'NGN' | 'USD' | 'EUR' | 'GBP' | 'XOF' | 'XAF';

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
  namePlural: string;
  decimalDigits: number;
  rounding: number;
}

/**
 * Supported currencies with their metadata
 * Primary focus on Nigerian Naira (NGN)
 */
export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  NGN: {
    code: 'NGN',
    symbol: '₦',
    name: 'Nigerian Naira',
    namePlural: 'Nigerian naira',
    decimalDigits: 2,
    rounding: 0,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    namePlural: 'US dollars',
    decimalDigits: 2,
    rounding: 0,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    namePlural: 'euros',
    decimalDigits: 2,
    rounding: 0,
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    namePlural: 'British pounds',
    decimalDigits: 2,
    rounding: 0,
  },
  XOF: {
    code: 'XOF',
    symbol: 'CFA',
    name: 'West African CFA Franc',
    namePlural: 'West African CFA francs',
    decimalDigits: 0,
    rounding: 0,
  },
  XAF: {
    code: 'XAF',
    symbol: 'FCFA',
    name: 'Central African CFA Franc',
    namePlural: 'Central African CFA francs',
    decimalDigits: 0,
    rounding: 0,
  },
};

/**
 * Default currency for the platform
 */
export const DEFAULT_CURRENCY: CurrencyCode = 'NGN';

/**
 * Currency conversion rates (against NGN as base)
 * Note: These should be fetched from an API in production
 */
export const EXCHANGE_RATES: Record<CurrencyCode, number> = {
  NGN: 1,
  USD: 0.0012, // Example rate: 1 NGN = 0.0012 USD
  EUR: 0.0011, // Example rate
  GBP: 0.00095, // Example rate
  XOF: 0.72, // Example rate
  XAF: 0.72, // Example rate
};

/**
 * Get currency info by code
 * @param code - Currency code
 * @returns Currency info
 */
export function getCurrencyInfo(code: CurrencyCode): CurrencyInfo {
  return CURRENCIES[code] || CURRENCIES.NGN;
}

/**
 * Convert amount from one currency to another
 * @param amount - Amount to convert
 * @param from - Source currency
 * @param to - Target currency
 * @returns Converted amount
 */
export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode
): number {
  if (from === to) return amount;

  // Convert to NGN first (base currency)
  const amountInNGN = amount / EXCHANGE_RATES[from];
  
  // Convert from NGN to target currency
  return amountInNGN * EXCHANGE_RATES[to];
}

/**
 * Get list of supported currency codes
 * @returns Array of currency codes
 */
export function getSupportedCurrencies(): CurrencyCode[] {
  return Object.keys(CURRENCIES) as CurrencyCode[];
}