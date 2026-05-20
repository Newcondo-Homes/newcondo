/**
 * Percentage Calculator Utility
 * Handles percentage calculations for analytics and reporting
 * Location: backend/shared/src/utils/percentageCalculator.ts
 */

/**
 * Calculate percentage change between two values
 * @param oldValue - Previous value
 * @param newValue - Current value
 * @returns Percentage change (can be negative)
 */
export const calculatePercentageChange = (
  oldValue: number,
  newValue: number
): number => {
  if (oldValue === 0) {
    return newValue === 0 ? 0 : 100;
  }
  return ((newValue - oldValue) / oldValue) * 100;
};

/**
 * Calculate percentage of a value relative to total
 * @param value - Part value
 * @param total - Total value
 * @returns Percentage (0-100)
 */
const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return (value / total) * 100;
};

/**
 * Calculate value from percentage
 * @param percentage - Percentage (0-100)
 * @param total - Total value
 * @returns Calculated value
 */
export const calculateValueFromPercentage = (
  percentage: number,
  total: number
): number => {
  return (percentage / 100) * total;
};

/**
 * Calculate commission or fee percentage
 * @param amount - Original amount
 * @param percentage - Commission/fee percentage
 * @returns Calculated commission/fee amount
 */
export const calculateCommission = (
  amount: number,
  percentage: number
): number => {
  return (amount * percentage) / 100;
};

/**
 * Calculate amount after deducting percentage
 * @param amount - Original amount
 * @param percentage - Percentage to deduct
 * @returns Amount after deduction
 */
export const deductPercentage = (amount: number, percentage: number): number => {
  return amount - calculateCommission(amount, percentage);
};

/**
 * Calculate amount after adding percentage
 * @param amount - Original amount
 * @param percentage - Percentage to add
 * @returns Amount after addition
 */
export const addPercentage = (amount: number, percentage: number): number => {
  return amount + calculateCommission(amount, percentage);
};

/**
 * Calculate weighted percentage
 * @param values - Array of values with their weights
 * @returns Weighted percentage
 */
export const calculateWeightedPercentage = (
  values: Array<{ value: number; weight: number }>
): number => {
  const totalWeight = values.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight === 0) return 0;

  const weightedSum = values.reduce(
    (sum, item) => sum + item.value * item.weight,
    0
  );
  return weightedSum / totalWeight;
};

/**
 * Calculate conversion rate
 * @param conversions - Number of conversions
 * @param total - Total number of attempts
 * @returns Conversion rate percentage
 */
export const calculateConversionRate = (
  conversions: number,
  total: number
): number => {
  return calculatePercentage(conversions, total);
};

/**
 * Calculate average percentage from array of percentages
 * @param percentages - Array of percentage values
 * @returns Average percentage
 */
export const calculateAveragePercentage = (percentages: number[]): number => {
  if (percentages.length === 0) return 0;
  const sum = percentages.reduce((acc, val) => acc + val, 0);
  return sum / percentages.length;
};

/**
 * Calculate compound percentage (for successive percentage changes)
 * @param percentages - Array of percentage changes
 * @returns Compound percentage change
 */
export const calculateCompoundPercentage = (percentages: number[]): number => {
  const multiplier = percentages.reduce(
    (acc, percentage) => acc * (1 + percentage / 100),
    1
  );
  return (multiplier - 1) * 100;
};

/**
 * Calculate percentage distribution across categories
 * @param values - Object with category names and values
 * @returns Object with category names and percentage distributions
 */
export const calculateDistribution = (
  values: Record<string, number>
): Record<string, number> => {
  const total = Object.values(values).reduce((sum, val) => sum + val, 0);
  const distribution: Record<string, number> = {};

  for (const [key, value] of Object.entries(values)) {
    distribution[key] = calculatePercentage(value, total);
  }

  return distribution;
};

/**
 * Calculate percentage increase needed to reach target
 * @param current - Current value
 * @param target - Target value
 * @returns Percentage increase needed
 */
export const calculatePercentageToTarget = (
  current: number,
  target: number
): number => {
  if (current === 0) return target === 0 ? 0 : Infinity;
  return ((target - current) / current) * 100;
};

/**
 * Format percentage for display
 * @param value - Percentage value
 * @param decimals - Number of decimal places (default: 2)
 * @param showSign - Whether to show + sign for positive values
 * @returns Formatted percentage string
 */
export const formatPercentageUtil = (
  value: number,
  decimals: number = 2,
  showSign: boolean = false
): string => {
  const formatted = value.toFixed(decimals);
  if (showSign && value > 0) {
    return `+${formatted}%`;
  }
  return `${formatted}%`;
};

/**
 * Calculate year-over-year percentage change
 * @param currentPeriod - Current period value
 * @param previousPeriod - Previous period value
 * @returns YoY percentage change
 */
export const calculateYoYChange = (
  currentPeriod: number,
  previousPeriod: number
): number => {
  return calculatePercentageChange(previousPeriod, currentPeriod);
};

/**
 * Calculate month-over-month percentage change
 * @param currentMonth - Current month value
 * @param previousMonth - Previous month value
 * @returns MoM percentage change
 */
export const calculateMoMChange = (
  currentMonth: number,
  previousMonth: number
): number => {
  return calculatePercentageChange(previousMonth, currentMonth);
};

/**
 * Calculate percentage split for commission distribution
 * @param amount - Total amount to split
 * @param percentages - Array of percentage splits (must sum to 100)
 * @returns Array of calculated amounts
 */
export const calculatePercentageSplit = (
  amount: number,
  percentages: number[]
): number[] => {
  // Validate that percentages sum to approximately 100
  const sum = percentages.reduce((acc, val) => acc + val, 0);
  if (Math.abs(sum - 100) > 0.01) {
    throw new Error('Percentages must sum to 100');
  }

  return percentages.map((percentage) => calculateCommission(amount, percentage));
};

/**
 * Calculate retention rate
 * @param retained - Number of users/items retained
 * @param initial - Initial number of users/items
 * @returns Retention rate percentage
 */
export const calculateRetentionRate = (
  retained: number,
  initial: number
): number => {
  return calculatePercentage(retained, initial);
};

/**
 * Calculate churn rate
 * @param churned - Number of users/items that churned
 * @param initial - Initial number of users/items
 * @returns Churn rate percentage
 */
export const calculateChurnRate = (
  churned: number,
  initial: number
): number => {
  return calculatePercentage(churned, initial);
};

/**
 * Calculate percentage difference (absolute)
 * @param value1 - First value
 * @param value2 - Second value
 * @returns Absolute percentage difference
 */
export const calculatePercentageDifference = (
  value1: number,
  value2: number
): number => {
  const average = (value1 + value2) / 2;
  if (average === 0) return 0;
  return (Math.abs(value1 - value2) / average) * 100;
};

/**
 * Round percentage to specified decimal places
 * @param percentage - Percentage value
 * @param decimals - Number of decimal places
 * @returns Rounded percentage
 */
export const roundPercentage = (
  percentage: number,
  decimals: number = 2
): number => {
  const multiplier = Math.pow(10, decimals);
  return Math.round(percentage * multiplier) / multiplier;
};

/**
 * Clamp percentage between 0 and 100
 * @param percentage - Percentage value
 * @returns Clamped percentage
 */
export const clampPercentage = (percentage: number): number => {
  return Math.max(0, Math.min(100, percentage));
};

/**
 * Calculate percentage rank (percentile)
 * @param value - Value to rank
 * @param sortedValues - Sorted array of all values
 * @returns Percentile rank (0-100)
 */
export const calculatePercentileRank = (
  value: number,
  sortedValues: number[]
): number => {
  if (sortedValues.length === 0) return 0;

  let count = 0;
  for (const val of sortedValues) {
    if (val <= value) count++;
    else break;
  }

  return (count / sortedValues.length) * 100;
};

export default {
  calculatePercentageChange,
  calculatePercentage,
  calculateValueFromPercentage,
  calculateCommission,
  deductPercentage,
  addPercentage,
  calculateWeightedPercentage,
  calculateConversionRate,
  calculateAveragePercentage,
  calculateCompoundPercentage,
  calculateDistribution,
  calculatePercentageToTarget,
  formatPercentageUtil,
  calculateYoYChange,
  calculateMoMChange,
  calculatePercentageSplit,
  calculateRetentionRate,
  calculateChurnRate,
  calculatePercentageDifference,
  roundPercentage,
  clampPercentage,
  calculatePercentileRank,
};