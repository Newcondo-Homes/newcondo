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
  fromCurrency: string,
  toCurrency: string
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