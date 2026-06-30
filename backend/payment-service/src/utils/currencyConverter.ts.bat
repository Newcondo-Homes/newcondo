// backend/payment-service/src/utils/currencyConverter.ts

/**
 * Currency formatting and conversion utilities
 */

interface CurrencySymbols {
  [key: string]: string;
}

const currencySymbols: CurrencySymbols = {
  NGN: '₦',
  USD: '$',
  EUR: '€',
  GBP: '£',
  XAF: 'FCFA',
  XOF: 'CFA'
};

const currencyNames: Record<string, Record<string, string>> = {
  en: {
    NGN: 'Nigerian Naira',
    USD: 'US Dollar',
    EUR: 'Euro',
    GBP: 'British Pound',
    XAF: 'Central African CFA Franc',
    XOF: 'West African CFA Franc'
  },
  fr: {
    NGN: 'Naira nigérian',
    USD: 'Dollar américain',
    EUR: 'Euro',
    GBP: 'Livre sterling',
    XAF: 'Franc CFA (BEAC)',
    XOF: 'Franc CFA (BCEAO)'
  },
  pcm: {
    NGN: 'Naija money',
    USD: 'US dollar',
    EUR: 'Euro',
    GBP: 'British pound',
    XAF: 'Central African money',
    XOF: 'West African money'
  }
};

/**
 * Format currency amount with proper locale formatting
 */
export function formatCurrency(
  amount: number | string,
  currency: string = 'NGN',
  locale: string = 'en'
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  // Map locales
  const localeMap: Record<string, string> = {
    en: 'en-NG',
    fr: 'fr-FR',
    pcm: 'en-NG' // Use Nigerian English for Pidgin
  };

  const browserLocale = localeMap[locale] || 'en-NG';

  try {
    return new Intl.NumberFormat(browserLocale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numAmount);
  } catch (error) {
    // Fallback formatting if Intl fails
    const symbol = currencySymbols[currency] || currency;
    return `${symbol}${numAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  }
}

/**
 * Format currency without symbol (just the number)
 */
export function formatAmount(
  amount: number | string,
  locale: string = 'en',
  decimals: number = 2
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  const localeMap: Record<string, string> = {
    en: 'en-NG',
    fr: 'fr-FR',
    pcm: 'en-NG'
  };

  const browserLocale = localeMap[locale] || 'en-NG';

  return new Intl.NumberFormat(browserLocale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(numAmount);
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: string): string {
  return currencySymbols[currency] || currency;
}

/**
 * Get currency name in specified locale
 */
export function getCurrencyName(currency: string, locale: string = 'en'): string {
  return currencyNames[locale]?.[currency] || currency;
}

/**
 * Convert amount from one currency to another
 * In production, this would call a real exchange rate API
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // Mock exchange rates (in production, fetch from API like exchangerate-api.com)
  const exchangeRates: Record<string, Record<string, number>> = {
    NGN: {
      USD: 0.0013,
      EUR: 0.0012,
      GBP: 0.0010,
      XAF: 0.77,
      XOF: 0.77
    },
    USD: {
      NGN: 750,
      EUR: 0.92,
      GBP: 0.79,
      XAF: 600,
      XOF: 600
    },
    EUR: {
      NGN: 820,
      USD: 1.09,
      GBP: 0.86,
      XAF: 656,
      XOF: 656
    },
    GBP: {
      NGN: 950,
      USD: 1.27,
      EUR: 1.16,
      XAF: 760,
      XOF: 760
    },
    XAF: {
      NGN: 1.30,
      USD: 0.0017,
      EUR: 0.0015,
      GBP: 0.0013,
      XOF: 1
    },
    XOF: {
      NGN: 1.30,
      USD: 0.0017,
      EUR: 0.0015,
      GBP: 0.0013,
      XAF: 1
    }
  };

  const rate = exchangeRates[fromCurrency]?.[toCurrency];

  if (!rate) {
    throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
  }

  return amount * rate;
}

/**
 * Get current exchange rate between two currencies
 */
export async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return 1;
  }

  // In production, fetch from a real API
  const mockRates: Record<string, Record<string, number>> = {
    NGN: { USD: 0.0013, EUR: 0.0012, GBP: 0.0010 },
    USD: { NGN: 750, EUR: 0.92, GBP: 0.79 },
    EUR: { NGN: 820, USD: 1.09, GBP: 0.86 },
    GBP: { NGN: 950, USD: 1.27, EUR: 1.16 }
  };

  return mockRates[fromCurrency]?.[toCurrency] || 1;
}

/**
 * Parse formatted currency string to number
 */
export function parseCurrency(formattedAmount: string): number {
  // Remove currency symbols and separators
  const cleaned = formattedAmount
    .replace(/[₦$€£FCFA,\s]/g, '')
    .replace(/,/g, '');
  
  return parseFloat(cleaned) || 0;
}

/**
 * Check if currency is supported
 */
export function isSupportedCurrency(currency: string): boolean {
  return Object.keys(currencySymbols).includes(currency);
}

/**
 * Get all supported currencies
 */
export function getSupportedCurrencies(): string[] {
  return Object.keys(currencySymbols);
}

/**
 * Format currency for display in different contexts
 */
export function formatCurrencyCompact(
  amount: number,
  currency: string = 'NGN',
  locale: string = 'en'
): string {
  const symbol = getCurrencySymbol(currency);
  
  if (amount >= 1000000) {
    return `${symbol}${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `${symbol}${(amount / 1000).toFixed(1)}K`;
  }
  
  return formatCurrency(amount, currency, locale);
}

/**
 * Calculate percentage of amount
 */
export function calculatePercentage(amount: number, percentage: number): number {
  return (amount * percentage) / 100;
}

/**
 * Split amount into parts
 */
export function splitAmount(
  amount: number,
  splits: { percentage: number; recipient: string }[]
): { recipient: string; amount: number }[] {
  return splits.map(split => ({
    recipient: split.recipient,
    amount: calculatePercentage(amount, split.percentage)
  }));
}

/**
 * Calculate total with fees
 */
export function calculateTotalWithFees(
  baseAmount: number,
  fees: { name: string; amount: number }[]
): { total: number; breakdown: { name: string; amount: number }[] } {
  const totalFees = fees.reduce((sum, fee) => sum + fee.amount, 0);
  
  return {
    total: baseAmount + totalFees,
    breakdown: [
      { name: 'Base Amount', amount: baseAmount },
      ...fees,
      { name: 'Total', amount: baseAmount + totalFees }
    ]
  };
}