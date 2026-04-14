// apps/platform/lib/utils/currency.ts
// Currency formatting utilities for payment display

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  decimals: number;
  thousandsSeparator: string;
  decimalSeparator: string;
}

// Supported currencies configuration
export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  NGN: {
    code: 'NGN',
    symbol: '₦',
    name: 'Nigerian Naira',
    decimals: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    decimals: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    decimals: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    decimals: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
};

/**
 * Format a currency amount with proper localization
 * @param amount - The amount to format
 * @param currencyCode - The currency code (e.g., 'NGN', 'USD')
 * @param options - Additional formatting options
 */


export type CurrencyCode = keyof typeof SUPPORTED_CURRENCIES; // 'NGN' | 'USD' | 'GBP' | 'EUR'

export const DEFAULT_CURRENCY: CurrencyCode = 'NGN';

export function formatCurrency(
  amount: number | string,
  currencyCode: string = 'NGN',
  options: {
    showSymbol?: boolean;
    showCode?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    locale?: string;
  } = {}
): string {
  const {
    showSymbol = true,
    showCode = false,
    minimumFractionDigits,
    maximumFractionDigits,
    locale = 'en-NG',
  } = options;

  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) {
    return '0.00';
  }

  const currency = SUPPORTED_CURRENCIES[currencyCode.toUpperCase()];
  
  if (!currency) {
    console.warn(`Unsupported currency: ${currencyCode}. Falling back to NGN.`);
    return formatCurrency(amount, 'NGN', options);
  }

  // Use Intl.NumberFormat for proper localization
  const formatter = new Intl.NumberFormat(locale, {
    style: 'decimal',
    minimumFractionDigits: minimumFractionDigits ?? currency.decimals,
    maximumFractionDigits: maximumFractionDigits ?? currency.decimals,
  });

  const formattedAmount = formatter.format(numericAmount);

  // Build the final string
  let result = '';
  
  if (showSymbol) {
    result += currency.symbol;
  }
  
  result += formattedAmount;
  
  if (showCode) {
    result += ` ${currency.code}`;
  }

  return result;
}

/**
 * Format currency for compact display (e.g., 1.2K, 1.5M)
 * @param amount - The amount to format
 * @param currencyCode - The currency code
 */
export function formatCompactCurrency(
  amount: number | string,
  currencyCode: string = 'NGN'
): string {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) {
    return formatCurrency(0, currencyCode);
  }

  const currency = SUPPORTED_CURRENCIES[currencyCode.toUpperCase()] || SUPPORTED_CURRENCIES.NGN;
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    notation: 'compact',
    maximumFractionDigits: 1,
  });

  return `${currency.symbol}${formatter.format(numericAmount)}`;
}

/**
 * Parse a currency string to a numeric value
 * @param currencyString - The formatted currency string
 * @param currencyCode - The expected currency code
 */
export function parseCurrency(
  currencyString: string,
  currencyCode: string = 'NGN'
): number {
  const currency = SUPPORTED_CURRENCIES[currencyCode.toUpperCase()] || SUPPORTED_CURRENCIES.NGN;
  
  // Remove currency symbol and code
  let cleanString = currencyString
    .replace(currency.symbol, '')
    .replace(currency.code, '')
    .replace(/\s+/g, ''); // Remove whitespace

  // Replace thousands separator and decimal separator
  if (currency.thousandsSeparator !== currency.decimalSeparator) {
    // Find the last occurrence of decimal separator
    const lastDecimalIndex = cleanString.lastIndexOf(currency.decimalSeparator);
    
    if (lastDecimalIndex > -1) {
      // Replace all thousands separators before the last decimal
      const beforeDecimal = cleanString.substring(0, lastDecimalIndex)
        .replace(new RegExp(`\\${currency.thousandsSeparator}`, 'g'), '');
      const afterDecimal = cleanString.substring(lastDecimalIndex + 1);
      
      cleanString = beforeDecimal + '.' + afterDecimal;
    } else {
      // No decimal separator found, just remove thousands separators
      cleanString = cleanString.replace(new RegExp(`\\${currency.thousandsSeparator}`, 'g'), '');
    }
  }

  const parsed = parseFloat(cleanString);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Convert currency amounts between different currencies
 * Note: This is a placeholder for future exchange rate integration
 * @param amount - Amount to convert
 * @param fromCurrency - Source currency code
 * @param toCurrency - Target currency code
 */
export function convertCurrency(
  amount: number,
//   fromCurrency: string,
//   toCurrency: string
): Promise<number> {
  // TODO: Integrate with exchange rate API
  // For now, return the same amount as a placeholder
  return Promise.resolve(amount);
}

/**
 * Validate if a currency code is supported
 * @param currencyCode - The currency code to validate
 */
export function isSupportedCurrency(currencyCode: string): boolean {
  return currencyCode.toUpperCase() in SUPPORTED_CURRENCIES;
}

/**
 * Get currency configuration
 * @param currencyCode - The currency code
 */
export function getCurrencyConfig(currencyCode: string): CurrencyConfig | null {
  return SUPPORTED_CURRENCIES[currencyCode.toUpperCase()] || null;
}

/**
 * Format currency for input fields (no symbol, proper decimal handling)
 * @param amount - The amount to format
 * @param currencyCode - The currency code
 */
export function formatCurrencyForInput(
  amount: number | string,
  currencyCode: string = 'NGN'
): string {
  return formatCurrency(amount, currencyCode, {
    showSymbol: false,
    showCode: false,
  });
}

/**
 * Calculate percentage of amount
 * @param amount - Base amount
 * @param percentage - Percentage to calculate
 * @param currencyCode - Currency code for formatting
 */
export function calculatePercentage(
  amount: number,
  percentage: number,
  currencyCode: string = 'NGN'
): {
  amount: number;
  formatted: string;
} {
  const calculatedAmount = (amount * percentage) / 100;
  
  return {
    amount: calculatedAmount,
    formatted: formatCurrency(calculatedAmount, currencyCode),
  };
}

/**
 * Split amount into parts (useful for commission calculations)
 * @param totalAmount - Total amount to split
 * @param splits - Array of percentage splits that should total 100
 * @param currencyCode - Currency code for formatting
 */
export function splitAmount(
  totalAmount: number,
  splits: { name: string; percentage: number }[],
  currencyCode: string = 'NGN'
): Array<{
  name: string;
  percentage: number;
  amount: number;
  formatted: string;
}> {
  const totalPercentage = splits.reduce((sum, split) => sum + split.percentage, 0);
  
  if (Math.abs(totalPercentage - 100) > 0.01) {
    console.warn(`Split percentages total ${totalPercentage}%, not 100%`);
  }

  return splits.map(split => {
    const amount = (totalAmount * split.percentage) / 100;
    
    return {
      name: split.name,
      percentage: split.percentage,
      amount,
      formatted: formatCurrency(amount, currencyCode),
    };
  });
}

/**
 * Round amount to currency precision
 * @param amount - Amount to round
 * @param currencyCode - Currency code
 */
export function roundToCurrency(amount: number, currencyCode: string = 'NGN'): number {
  const currency = SUPPORTED_CURRENCIES[currencyCode.toUpperCase()] || SUPPORTED_CURRENCIES.NGN;
  const multiplier = Math.pow(10, currency.decimals);
  
  return Math.round(amount * multiplier) / multiplier;
}











// import { type Language } from '../i18n/translations';

// /**
//  * Currency utility functions
//  */

// export const CURRENCIES = {
//   NGN: {
//     code: 'NGN',
//     symbol: '₦',
//     name: 'Nigerian Naira',
//     decimals: 2,
//     symbolPosition: 'before' as const,
//   },
//   USD: {
//     code: 'USD',
//     symbol: '$',
//     name: 'US Dollar',
//     decimals: 2,
//     symbolPosition: 'before' as const,
//   },
//   EUR: {
//     code: 'EUR',
//     symbol: '€',
//     name: 'Euro',
//     decimals: 2,
//     symbolPosition: 'before' as const,
//   },
//   GBP: {
//     code: 'GBP',
//     symbol: '£',
//     name: 'British Pound',
//     decimals: 2,
//     symbolPosition: 'before' as const,
//   },
//   XAF: {
//     code: 'XAF',
//     symbol: 'FCFA',
//     name: 'Central African CFA Franc',
//     decimals: 0,
//     symbolPosition: 'after' as const,
//   },
// } as const;

// export type CurrencyCode = keyof typeof CURRENCIES;

// /**
//  * Default currency for the platform
//  */
// export const DEFAULT_CURRENCY: CurrencyCode = 'NGN';

// /**
//  * Get currency information
//  */
// export function getCurrencyInfo(code: CurrencyCode) {
//   return CURRENCIES[code];
// }

// /**
//  * Format currency amount
//  */
// export function formatCurrency(
//   amount: number | string,
//   currency: CurrencyCode = DEFAULT_CURRENCY,
//   locale?: Language,
//   options?: {
//     showSymbol?: boolean;
//     showCode?: boolean;
//     minimumFractionDigits?: number;
//     maximumFractionDigits?: number;
//   }
// ): string {
//   const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
//   if (isNaN(numAmount)) {
//     console.warn(`Invalid amount: ${amount}`);
//     return '0';
//   }
  
//   const currencyInfo = CURRENCIES[currency];
//   const {
//     showSymbol = true,
//     showCode = false,
//     minimumFractionDigits = currencyInfo.decimals,
//     maximumFractionDigits = currencyInfo.decimals,
//   } = options || {};
  
//   // Format number with locale
//   const formatter = new Intl.NumberFormat(locale || 'en-NG', {
//     minimumFractionDigits,
//     maximumFractionDigits,
//   });
  
//   const formattedAmount = formatter.format(numAmount);
  
//   // Build final string
//   let result = formattedAmount;
  
//   if (showSymbol) {
//     if (currencyInfo.symbolPosition === 'before') {
//       result = `${currencyInfo.symbol}${formattedAmount}`;
//     } else {
//       result = `${formattedAmount} ${currencyInfo.symbol}`;
//     }
//   }
  
//   if (showCode) {
//     result = `${result} ${currencyInfo.code}`;
//   }
  
//   return result;
// }

// /**
//  * Format currency for display (with symbol and proper formatting)
//  */
// export function displayCurrency(
//   amount: number | string,
//   currency: CurrencyCode = DEFAULT_CURRENCY,
//   locale?: Language
// ): string {
//   return formatCurrency(amount, currency, locale, {
//     showSymbol: true,
//     showCode: false,
//   });
// }

// /**
//  * Format currency in compact notation (e.g., ₦1.5M, ₦200K)
//  */
// export function formatCompactCurrency(
//   amount: number | string,
//   currency: CurrencyCode = DEFAULT_CURRENCY,
//   locale?: Language
// ): string {
//   const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
//   if (isNaN(numAmount)) {
//     return formatCurrency(0, currency, locale);
//   }
  
//   const currencyInfo = CURRENCIES[currency];
  
//   const formatter = new Intl.NumberFormat(locale || 'en-NG', {
//     notation: 'compact',
//     compactDisplay: 'short',
//     maximumFractionDigits: 1,
//   });
  
//   const formattedAmount = formatter.format(numAmount);
  
//   if (currencyInfo.symbolPosition === 'before') {
//     return `${currencyInfo.symbol}${formattedAmount}`;
//   } else {
//     return `${formattedAmount} ${currencyInfo.symbol}`;
//   }
// }

// /**
//  * Parse currency string to number
//  */
// export function parseCurrency(
//   value: string,
//   currency: CurrencyCode = DEFAULT_CURRENCY
// ): number {
//   const currencyInfo = CURRENCIES[currency];
  
//   // Remove currency symbols and codes
//   let cleaned = value
//     .replace(currencyInfo.symbol, '')
//     .replace(currencyInfo.code, '')
//     .trim();
  
//   // Remove thousand separators and replace decimal separator
//   cleaned = cleaned.replace(/,/g, '').replace(/\s/g, '');
  
//   const parsed = parseFloat(cleaned);
//   return isNaN(parsed) ? 0 : parsed;
// }

// /**
//  * Convert amount between currencies
//  * Note: This uses static rates. In production, use a real-time exchange rate API
//  */
// export async function convertCurrency(
//   amount: number,
//   from: CurrencyCode,
//   to: CurrencyCode
// ): Promise<number> {
//   if (from === to) return amount;
  
//   // Static exchange rates (for demo purposes)
//   // In production, fetch from an API like exchangerate-api.com
//   const exchangeRates: Record<CurrencyCode, Record<CurrencyCode, number>> = {
//     NGN: {
//       NGN: 1,
//       USD: 0.0013, // 1 NGN = 0.0013 USD
//       EUR: 0.0012,
//       GBP: 0.0010,
//       XAF: 0.78,
//     },
//     USD: {
//       NGN: 770,
//       USD: 1,
//       EUR: 0.92,
//       GBP: 0.79,
//       XAF: 600,
//     },
//     EUR: {
//       NGN: 835,
//       USD: 1.09,
//       EUR: 1,
//       GBP: 0.86,
//       XAF: 655,
//     },
//     GBP: {
//       NGN: 970,
//       USD: 1.27,
//       EUR: 1.16,
//       GBP: 1,
//       XAF: 760,
//     },
//     XAF: {
//       NGN: 1.28,
//       USD: 0.0017,
//       EUR: 0.0015,
//       GBP: 0.0013,
//       XAF: 1,
//     },
//   };
  
//   const rate = exchangeRates[from]?.[to];
  
//   if (!rate) {
//     console.warn(`Exchange rate not found for ${from} to ${to}`);
//     return amount;
//   }
  
//   return amount * rate;
// }

// /**
//  * Format currency range
//  */
// export function formatCurrencyRange(
//   min: number,
//   max: number,
//   currency: CurrencyCode = DEFAULT_CURRENCY,
//   locale?: Language
// ): string {
//   const formattedMin = formatCurrency(min, currency, locale);
//   const formattedMax = formatCurrency(max, currency, locale);
  
//   return `${formattedMin} - ${formattedMax}`;
// }

// /**
//  * Get currency symbol
//  */
// export function getCurrencySymbol(currency: CurrencyCode): string {
//   return CURRENCIES[currency].symbol;
// }

// /**
//  * Check if currency code is valid
//  */
// export function isValidCurrency(code: string): code is CurrencyCode {
//   return code in CURRENCIES;
// }

// /**
//  * Get all available currencies
//  */
// export function getAvailableCurrencies() {
//   return Object.entries(CURRENCIES).map(([code, info]) => ({
//     code: code as CurrencyCode,
//     ...info,
//   }));
// }

// /**
//  * Format currency for input (without symbol)
//  */
// export function formatCurrencyInput(
//   amount: number | string,
//   currency: CurrencyCode = DEFAULT_CURRENCY
// ): string {
//   const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
//   if (isNaN(numAmount)) {
//     return '';
//   }
  
//   const currencyInfo = CURRENCIES[currency];
  
//   return numAmount.toFixed(currencyInfo.decimals);
// }

// /**
//  * Validate currency amount
//  */
// export function isValidCurrencyAmount(
//   amount: string | number,
//   currency: CurrencyCode = DEFAULT_CURRENCY
// ): boolean {
//   const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
//   if (isNaN(numAmount) || numAmount < 0) {
//     return false;
//   }
  
//   const currencyInfo = CURRENCIES[currency];
//   const decimalPlaces = amount.toString().split('.')[1]?.length || 0;
  
//   return decimalPlaces <= currencyInfo.decimals;
// }

// /**
//  * Round to currency decimals
//  */
// export function roundToCurrencyDecimals(
//   amount: number,
//   currency: CurrencyCode = DEFAULT_CURRENCY
// ): number {
//   const currencyInfo = CURRENCIES[currency];
//   const multiplier = Math.pow(10, currencyInfo.decimals);
  
//   return Math.round(amount * multiplier) / multiplier;
// }

// /**
//  * Calculate percentage of amount
//  */
// export function calculatePercentage(
//   amount: number,
//   percentage: number,
//   currency: CurrencyCode = DEFAULT_CURRENCY
// ): number {
//   const result = (amount * percentage) / 100;
//   return roundToCurrencyDecimals(result, currency);
// }

// /**
//  * Format currency with accounting notation (negative in parentheses)
//  */
// export function formatAccountingCurrency(
//   amount: number,
//   currency: CurrencyCode = DEFAULT_CURRENCY,
//   locale?: Language
// ): string {
//   const isNegative = amount < 0;
//   const absAmount = Math.abs(amount);
//   const formatted = formatCurrency(absAmount, currency, locale);
  
//   return isNegative ? `(${formatted})` : formatted;
// }