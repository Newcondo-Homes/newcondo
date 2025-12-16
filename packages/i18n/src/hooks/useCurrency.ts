import { useCallback, useMemo } from 'react';
import { useLocale } from './useLocale';
import {
  CurrencyCode,
  CurrencyConfig,
  getCurrencyConfig,
  getCurrencyForLocale,
  DEFAULT_CURRENCY,
} from '../config/locales';

/**
 * Currency format options
 */
export interface CurrencyFormatOptions {
  currency?: CurrencyCode;
  locale?: string;
  decimals?: number;
  showSymbol?: boolean;
  showCode?: boolean;
  compact?: boolean; // Format large numbers (e.g., 1.5M instead of 1,500,000)
}

/**
 * Number format options
 */
export interface NumberFormatOptions {
  decimals?: number;
  locale?: string;
  compact?: boolean;
  percentage?: boolean;
}

/**
 * Currency formatting utilities
 */
export interface CurrencyUtils {
  currentCurrency: CurrencyCode;
  currencyConfig: CurrencyConfig;
  formatCurrency: (amount: number, options?: CurrencyFormatOptions) => string;
  formatNumber: (value: number, options?: NumberFormatOptions) => string;
  parseCurrency: (value: string) => number;
  convertCurrency: (amount: number, from: CurrencyCode, to: CurrencyCode, rate: number) => number;
  getSymbol: (currency?: CurrencyCode) => string;
}

/**
 * Hook for currency formatting and localization
 * 
 * @returns Currency utilities and formatting functions
 * 
 * @example
 * ```tsx
 * const { formatCurrency, currentCurrency } = useCurrency();
 * 
 * <p>{formatCurrency(150000)}</p>
 * // Output: ₦150,000.00
 * 
 * <p>{formatCurrency(1500000, { compact: true })}</p>
 * // Output: ₦1.5M
 * ```
 */
export const useCurrency = (): CurrencyUtils => {
  const { locale } = useLocale();
  
  // Get currency for current locale
  const currentCurrency = getCurrencyForLocale(locale);
  const currencyConfig = getCurrencyConfig(currentCurrency);

  /**
   * Format a number as currency
   */
  const formatCurrency = useCallback((
    amount: number,
    options: CurrencyFormatOptions = {}
  ): string => {
    const {
      currency = currentCurrency,
      decimals,
      showSymbol = true,
      showCode = false,
      compact = false,
    } = options;

    const config = getCurrencyConfig(currency);
    const decimalPlaces = decimals ?? config.decimals;

    // Handle compact notation for large numbers
    if (compact && Math.abs(amount) >= 1000) {
      return formatCompactCurrency(amount, currency, config, showSymbol, showCode);
    }

    // Format the number
    const formattedNumber = formatNumberWithSeparators(
      amount,
      decimalPlaces,
      config.thousandsSeparator,
      config.decimalSeparator
    );

    // Build the currency string
    let result = formattedNumber;

    if (showSymbol) {
      result = config.symbolPosition === 'before'
        ? `${config.symbol}${result}`
        : `${result} ${config.symbol}`;
    }

    if (showCode) {
      result = `${result} ${config.code}`;
    }

    return result;
  }, [currentCurrency]);

  /**
   * Format a number without currency
   */
  const formatNumber = useCallback((
    value: number,
    options: NumberFormatOptions = {}
  ): string => {
    const {
      decimals = 2,
      compact = false,
      percentage = false,
    } = options;

    let result = value;

    if (percentage) {
      result = value * 100;
    }

    if (compact && Math.abs(value) >= 1000) {
      return formatCompactNumber(result, decimals);
    }

    const formatted = formatNumberWithSeparators(
      result,
      decimals,
      currencyConfig.thousandsSeparator,
      currencyConfig.decimalSeparator
    );

    return percentage ? `${formatted}%` : formatted;
  }, [currencyConfig]);

  /**
   * Parse a currency string to number
   */
  const parseCurrency = useCallback((value: string): number => {
    // Remove currency symbols, letters, and spaces
    const cleaned = value.replace(/[^\d.,\-]/g, '');
    
    // Replace decimal separator with standard period
    const normalized = cleaned.replace(currencyConfig.decimalSeparator, '.');
    
    // Remove thousands separators
    const withoutThousands = normalized.replace(
      new RegExp(`\\${currencyConfig.thousandsSeparator}`, 'g'),
      ''
    );
    
    return parseFloat(withoutThousands) || 0;
  }, [currencyConfig]);

  /**
   * Convert amount between currencies
   */
  const convertCurrency = useCallback((
    amount: number,
    from: CurrencyCode,
    to: CurrencyCode,
    rate: number
  ): number => {
    if (from === to) return amount;
    return amount * rate;
  }, []);

  /**
   * Get currency symbol
   */
  const getSymbol = useCallback((currency?: CurrencyCode): string => {
    return getCurrencyConfig(currency || currentCurrency).symbol;
  }, [currentCurrency]);

  return {
    currentCurrency,
    currencyConfig,
    formatCurrency,
    formatNumber,
    parseCurrency,
    convertCurrency,
    getSymbol,
  };
};

/**
 * Helper: Format number with separators
 */
function formatNumberWithSeparators(
  value: number,
  decimals: number,
  thousandsSeparator: string,
  decimalSeparator: string
): string {
  const fixed = Math.abs(value).toFixed(decimals);
  const [integer, decimal] = fixed.split('.');
  
  // Add thousands separators
  const withSeparators = integer.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
  
  const sign = value < 0 ? '-' : '';
  const result = decimals > 0 
    ? `${withSeparators}${decimalSeparator}${decimal}`
    : withSeparators;
  
  return sign + result;
}

/**
 * Helper: Format compact currency (1.5M, 2.3K, etc.)
 */
function formatCompactCurrency(
  amount: number,
  currency: CurrencyCode,
  config: CurrencyConfig,
  showSymbol: boolean,
  showCode: boolean
): string {
  const compact = formatCompactNumber(Math.abs(amount), 1);
  const sign = amount < 0 ? '-' : '';
  
  let result = sign + compact;
  
  if (showSymbol) {
    result = config.symbolPosition === 'before'
      ? `${config.symbol}${result}`
      : `${result} ${config.symbol}`;
  }
  
  if (showCode) {
    result = `${result} ${config.code}`;
  }
  
  return result;
}

/**
 * Helper: Format compact number
 */
function formatCompactNumber(value: number, decimals: number): string {
  const absValue = Math.abs(value);
  
  if (absValue >= 1_000_000_000) {
    return (value / 1_000_000_000).toFixed(decimals) + 'B';
  }
  if (absValue >= 1_000_000) {
    return (value / 1_000_000).toFixed(decimals) + 'M';
  }
  if (absValue >= 1_000) {
    return (value / 1_000).toFixed(decimals) + 'K';
  }
  
  return value.toFixed(decimals);
}

/**
 * Hook to format multiple currencies at once
 */
export const useMultiCurrency = (currencies: CurrencyCode[]) => {
  return useMemo(() => {
    return currencies.reduce((acc, currency) => {
      const config = getCurrencyConfig(currency);
      acc[currency] = {
        config,
        format: (amount: number, options?: Omit<CurrencyFormatOptions, 'currency'>) =>
          formatCurrencyString(amount, currency, options),
      };
      return acc;
    }, {} as Record<CurrencyCode, { config: CurrencyConfig; format: (amount: number, options?: any) => string }>);
  }, [currencies]);
};

/**
 * Helper function for formatting currency strings
 */
function formatCurrencyString(
  amount: number,
  currency: CurrencyCode,
  options: Omit<CurrencyFormatOptions, 'currency'> = {}
): string {
  const config = getCurrencyConfig(currency);
  const { decimals = config.decimals, showSymbol = true } = options;
  
  const formatted = formatNumberWithSeparators(
    amount,
    decimals,
    config.thousandsSeparator,
    config.decimalSeparator
  );
  
  return showSymbol
    ? config.symbolPosition === 'before'
      ? `${config.symbol}${formatted}`
      : `${formatted} ${config.symbol}`
    : formatted;
}