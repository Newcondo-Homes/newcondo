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
export declare const calculatePercentageChange: (oldValue: number, newValue: number) => number;
/**
 * Calculate value from percentage
 * @param percentage - Percentage (0-100)
 * @param total - Total value
 * @returns Calculated value
 */
export declare const calculateValueFromPercentage: (percentage: number, total: number) => number;
/**
 * Calculate commission or fee percentage
 * @param amount - Original amount
 * @param percentage - Commission/fee percentage
 * @returns Calculated commission/fee amount
 */
export declare const calculateCommission: (amount: number, percentage: number) => number;
/**
 * Calculate amount after deducting percentage
 * @param amount - Original amount
 * @param percentage - Percentage to deduct
 * @returns Amount after deduction
 */
export declare const deductPercentage: (amount: number, percentage: number) => number;
/**
 * Calculate amount after adding percentage
 * @param amount - Original amount
 * @param percentage - Percentage to add
 * @returns Amount after addition
 */
export declare const addPercentage: (amount: number, percentage: number) => number;
/**
 * Calculate weighted percentage
 * @param values - Array of values with their weights
 * @returns Weighted percentage
 */
export declare const calculateWeightedPercentage: (values: Array<{
    value: number;
    weight: number;
}>) => number;
/**
 * Calculate conversion rate
 * @param conversions - Number of conversions
 * @param total - Total number of attempts
 * @returns Conversion rate percentage
 */
export declare const calculateConversionRate: (conversions: number, total: number) => number;
/**
 * Calculate average percentage from array of percentages
 * @param percentages - Array of percentage values
 * @returns Average percentage
 */
export declare const calculateAveragePercentage: (percentages: number[]) => number;
/**
 * Calculate compound percentage (for successive percentage changes)
 * @param percentages - Array of percentage changes
 * @returns Compound percentage change
 */
export declare const calculateCompoundPercentage: (percentages: number[]) => number;
/**
 * Calculate percentage distribution across categories
 * @param values - Object with category names and values
 * @returns Object with category names and percentage distributions
 */
export declare const calculateDistribution: (values: Record<string, number>) => Record<string, number>;
/**
 * Calculate percentage increase needed to reach target
 * @param current - Current value
 * @param target - Target value
 * @returns Percentage increase needed
 */
export declare const calculatePercentageToTarget: (current: number, target: number) => number;
/**
 * Format percentage for display
 * @param value - Percentage value
 * @param decimals - Number of decimal places (default: 2)
 * @param showSign - Whether to show + sign for positive values
 * @returns Formatted percentage string
 */
export declare const formatPercentageUtil: (value: number, decimals?: number, showSign?: boolean) => string;
/**
 * Calculate year-over-year percentage change
 * @param currentPeriod - Current period value
 * @param previousPeriod - Previous period value
 * @returns YoY percentage change
 */
export declare const calculateYoYChange: (currentPeriod: number, previousPeriod: number) => number;
/**
 * Calculate month-over-month percentage change
 * @param currentMonth - Current month value
 * @param previousMonth - Previous month value
 * @returns MoM percentage change
 */
export declare const calculateMoMChange: (currentMonth: number, previousMonth: number) => number;
/**
 * Calculate percentage split for commission distribution
 * @param amount - Total amount to split
 * @param percentages - Array of percentage splits (must sum to 100)
 * @returns Array of calculated amounts
 */
export declare const calculatePercentageSplit: (amount: number, percentages: number[]) => number[];
/**
 * Calculate retention rate
 * @param retained - Number of users/items retained
 * @param initial - Initial number of users/items
 * @returns Retention rate percentage
 */
export declare const calculateRetentionRate: (retained: number, initial: number) => number;
/**
 * Calculate churn rate
 * @param churned - Number of users/items that churned
 * @param initial - Initial number of users/items
 * @returns Churn rate percentage
 */
export declare const calculateChurnRate: (churned: number, initial: number) => number;
/**
 * Calculate percentage difference (absolute)
 * @param value1 - First value
 * @param value2 - Second value
 * @returns Absolute percentage difference
 */
export declare const calculatePercentageDifference: (value1: number, value2: number) => number;
/**
 * Round percentage to specified decimal places
 * @param percentage - Percentage value
 * @param decimals - Number of decimal places
 * @returns Rounded percentage
 */
export declare const roundPercentage: (percentage: number, decimals?: number) => number;
/**
 * Clamp percentage between 0 and 100
 * @param percentage - Percentage value
 * @returns Clamped percentage
 */
export declare const clampPercentage: (percentage: number) => number;
/**
 * Calculate percentage rank (percentile)
 * @param value - Value to rank
 * @param sortedValues - Sorted array of all values
 * @returns Percentile rank (0-100)
 */
export declare const calculatePercentileRank: (value: number, sortedValues: number[]) => number;
declare const _default: {
    calculatePercentageChange: (oldValue: number, newValue: number) => number;
    calculatePercentage: (value: number, total: number) => number;
    calculateValueFromPercentage: (percentage: number, total: number) => number;
    calculateCommission: (amount: number, percentage: number) => number;
    deductPercentage: (amount: number, percentage: number) => number;
    addPercentage: (amount: number, percentage: number) => number;
    calculateWeightedPercentage: (values: Array<{
        value: number;
        weight: number;
    }>) => number;
    calculateConversionRate: (conversions: number, total: number) => number;
    calculateAveragePercentage: (percentages: number[]) => number;
    calculateCompoundPercentage: (percentages: number[]) => number;
    calculateDistribution: (values: Record<string, number>) => Record<string, number>;
    calculatePercentageToTarget: (current: number, target: number) => number;
    formatPercentageUtil: (value: number, decimals?: number, showSign?: boolean) => string;
    calculateYoYChange: (currentPeriod: number, previousPeriod: number) => number;
    calculateMoMChange: (currentMonth: number, previousMonth: number) => number;
    calculatePercentageSplit: (amount: number, percentages: number[]) => number[];
    calculateRetentionRate: (retained: number, initial: number) => number;
    calculateChurnRate: (churned: number, initial: number) => number;
    calculatePercentageDifference: (value1: number, value2: number) => number;
    roundPercentage: (percentage: number, decimals?: number) => number;
    clampPercentage: (percentage: number) => number;
    calculatePercentileRank: (value: number, sortedValues: number[]) => number;
};
export default _default;
//# sourceMappingURL=percentageCalculator.d.ts.map