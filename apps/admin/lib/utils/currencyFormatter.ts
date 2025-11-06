// apps/admin/src/lib/utils/currencyFormatter.ts

/**
 * Currency configuration
 */
export const CURRENCY_CONFIG = {
  NGN: {
    symbol: '₦',
    name: 'Nigerian Naira',
    code: 'NGN',
    locale: 'en-NG',
  },
  USD: {
    symbol: '$',
    name: 'US Dollar',
    code: 'USD',
    locale: 'en-US',
  },
} as const;

export type CurrencyCode = keyof typeof CURRENCY_CONFIG;

/**
 * Format currency with symbol
 */
export const formatCurrency = (
  amount: number | string,
  currency: CurrencyCode = 'NGN',
  decimals: number = 2
): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const config = CURRENCY_CONFIG[currency];
  
  const formatted = new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numAmount);
  
  return formatted;
};

/**
 * Format currency without symbol (just the number)
 */
export const formatCurrencyNumber = (
  amount: number | string,
  currency: CurrencyCode = 'NGN',
  decimals: number = 2
): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const config = CURRENCY_CONFIG[currency];
  
  return new Intl.NumberFormat(config.locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numAmount);
};

/**
 * Format currency with compact notation (K, M, B)
 */
export const formatCompactCurrency = (
  amount: number | string,
  currency: CurrencyCode = 'NGN'
): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const config = CURRENCY_CONFIG[currency];
  
  if (numAmount >= 1_000_000_000) {
    return `${config.symbol}${(numAmount / 1_000_000_000).toFixed(1)}B`;
  }
  if (numAmount >= 1_000_000) {
    return `${config.symbol}${(numAmount / 1_000_000).toFixed(1)}M`;
  }
  if (numAmount >= 1_000) {
    return `${config.symbol}${(numAmount / 1_000).toFixed(1)}K`;
  }
  return formatCurrency(numAmount, currency, 0);
};

/**
 * Format currency range
 */
export const formatCurrencyRange = (
  min: number,
  max: number,
  currency: CurrencyCode = 'NGN'
): string => {
  return `${formatCurrency(min, currency)} - ${formatCurrency(max, currency)}`;
};

/**
 * Parse currency string to number
 */
export const parseCurrency = (currencyString: string): number => {
  const cleaned = currencyString.replace(/[^0-9.-]+/g, '');
  return parseFloat(cleaned) || 0;
};

/**
 * Calculate currency total
 */
export const calculateTotal = (amounts: number[]): number => {
  return amounts.reduce((sum, amount) => sum + amount, 0);
};

/**
 * Format currency with change indicator
 */
export const formatCurrencyWithChange = (
  current: number,
  previous: number,
  currency: CurrencyCode = 'NGN'
): { value: string; change: string; isPositive: boolean } => {
  const change = current - previous;
  const isPositive = change >= 0;
  
  return {
    value: formatCurrency(current, currency),
    change: formatCurrency(Math.abs(change), currency),
    isPositive,
  };
};

/**
 * Calculate percentage of currency amount
 */
export const calculatePercentageAmount = (
  total: number,
  percentage: number
): number => {
  return (total * percentage) / 100;
};

/**
 * Format commission split
 */
export const formatCommissionSplit = (
  total: number,
  commissionPercentage: number,
  currency: CurrencyCode = 'NGN'
): { total: string; commission: string; remaining: string } => {
  const commission = calculatePercentageAmount(total, commissionPercentage);
  const remaining = total - commission;
  
  return {
    total: formatCurrency(total, currency),
    commission: formatCurrency(commission, currency),
    remaining: formatCurrency(remaining, currency),
  };
};

/**
 * Format revenue breakdown
 */
export const formatRevenueBreakdown = (
  amount: number,
  splits: Record<string, number>,
  currency: CurrencyCode = 'NGN'
): Record<string, string> => {
  const breakdown: Record<string, string> = {};
  
  Object.entries(splits).forEach(([key, percentage]) => {
    const splitAmount = calculatePercentageAmount(amount, percentage);
    breakdown[key] = formatCurrency(splitAmount, currency);
  });
  
  return breakdown;
};

/**
 * Format payment summary
 */
export const formatPaymentSummary = (
  subtotal: number,
  fees: number,
  total: number,
  currency: CurrencyCode = 'NGN'
): { subtotal: string; fees: string; total: string } => {
  return {
    subtotal: formatCurrency(subtotal, currency),
    fees: formatCurrency(fees, currency),
    total: formatCurrency(total, currency),
  };
};

/**
 * Calculate and format platform fee
 */
export const calculatePlatformFee = (
  amount: number,
  feePercentage: number,
  currency: CurrencyCode = 'NGN'
): string => {
  const fee = calculatePercentageAmount(amount, feePercentage);
  return formatCurrency(fee, currency);
};

/**
 * Format currency array
 */
export const formatCurrencyArray = (
  amounts: number[],
  currency: CurrencyCode = 'NGN'
): string[] => {
  return amounts.map(amount => formatCurrency(amount, currency));
};

/**
 * Calculate average currency amount
 */
export const calculateAverageCurrency = (
  amounts: number[],
  currency: CurrencyCode = 'NGN'
): string => {
  if (amounts.length === 0) return formatCurrency(0, currency);
  const average = calculateTotal(amounts) / amounts.length;
  return formatCurrency(average, currency);
};

/**
 * Format refund amount with transaction fee
 */
export const formatRefundAmount = (
  originalAmount: number,
  transactionFeePercentage: number,
  currency: CurrencyCode = 'NGN'
): { original: string; fee: string; refund: string } => {
  const fee = calculatePercentageAmount(originalAmount, transactionFeePercentage);
  const refund = originalAmount - fee;
  
  return {
    original: formatCurrency(originalAmount, currency),
    fee: formatCurrency(fee, currency),
    refund: formatCurrency(refund, currency),
  };
};