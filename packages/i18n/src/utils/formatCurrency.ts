import { CURRENCIES, type CurrencyCode } from '../constants/currencies';

export interface FormatCurrencyOptions {
  locale?: string;
  currency?: CurrencyCode;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  notation?: 'standard' | 'compact' | 'scientific' | 'engineering';
  useSymbol?: boolean;
}

/**
 * Format a number as currency based on locale and currency code
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  options: FormatCurrencyOptions = {}
): string {
  const {
    locale = 'en-NG', // Default to Nigerian English
    currency = 'NGN',
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    notation = 'standard',
    useSymbol = true,
  } = options;

  try {
    // Use Intl.NumberFormat for locale-aware formatting
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits,
      maximumFractionDigits,
      notation,
    });

    let formatted = formatter.format(amount);

    // If useSymbol is false, replace currency code with empty string
    if (!useSymbol) {
      const currencyInfo = CURRENCIES[currency];
      if (currencyInfo) {
        formatted = formatted.replace(currency, '').replace(currencyInfo.symbol, '').trim();
      }
    }

    return formatted;
  } catch (error) {
    console.error('Currency formatting error:', error);
    // Fallback formatting
    return `${CURRENCIES[currency]?.symbol || '₦'}${amount.toLocaleString(locale, {
      minimumFractionDigits,
      maximumFractionDigits,
    })}`;
  }
}

/**
 * Format currency with compact notation (e.g., 1.2M, 500K)
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Compact formatted currency string
 */
export function formatCompactCurrency(
  amount: number,
  options: Omit<FormatCurrencyOptions, 'notation'> = {}
): string {
  return formatCurrency(amount, {
    ...options,
    notation: 'compact',
    maximumFractionDigits: 1,
  });
}

/**
 * Parse currency string to number
 * @param currencyString - The currency string to parse
 * @param currency - Currency code
 * @returns Parsed number
 */
export function parseCurrency(
  currencyString: string,
  currency: CurrencyCode = 'NGN'
): number {
  const currencyInfo = CURRENCIES[currency];
  
  // Remove currency symbol and spaces
  let cleaned = currencyString
    .replace(currencyInfo?.symbol || '', '')
    .replace(currency, '')
    .replace(/\s/g, '');

  // Remove thousands separators
  cleaned = cleaned.replace(/,/g, '');

  // Parse as float
  const parsed = parseFloat(cleaned);

  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format currency range
 * @param min - Minimum amount
 * @param max - Maximum amount
 * @param options - Formatting options
 * @returns Formatted currency range string
 */
export function formatCurrencyRange(
  min: number,
  max: number,
  options: FormatCurrencyOptions = {}
): string {
  const formattedMin = formatCurrency(min, options);
  const formattedMax = formatCurrency(max, options);
  
  return `${formattedMin} - ${formattedMax}`;
}

/**
 * Get currency symbol for a given currency code
 * @param currency - Currency code
 * @returns Currency symbol
 */
export function getCurrencySymbol(currency: CurrencyCode = 'NGN'): string {
  return CURRENCIES[currency]?.symbol || '₦';
}

/**
 * Check if amount is within budget
 * @param amount - Amount to check
 * @param budget - Budget limit
 * @returns Boolean indicating if within budget
 */
export function isWithinBudget(amount: number, budget: number): boolean {
  return amount <= budget;
}

/**
 * Calculate percentage of amount
 * @param amount - Base amount
 * @param percentage - Percentage to calculate
 * @returns Calculated amount
 */
export function calculatePercentage(amount: number, percentage: number): number {
  return (amount * percentage) / 100;
}

/**
 * Format amount with currency symbol and locale
 * Optimized for Nigerian context
 * @param amount - Amount to format
 * @param locale - Locale code
 * @returns Formatted string
 */
export function formatNairaCurrency(
  amount: number,
  locale: string = 'en-NG'
): string {
  return formatCurrency(amount, {
    locale,
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}