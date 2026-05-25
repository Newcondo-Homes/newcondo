"use strict";
/**
 * Percentage Calculator Utility
 * Handles percentage calculations for analytics and reporting
 * Location: backend/shared/src/utils/percentageCalculator.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePercentileRank = exports.clampPercentage = exports.roundPercentage = exports.calculatePercentageDifference = exports.calculateChurnRate = exports.calculateRetentionRate = exports.calculatePercentageSplit = exports.calculateMoMChange = exports.calculateYoYChange = exports.formatPercentageUtil = exports.calculatePercentageToTarget = exports.calculateDistribution = exports.calculateCompoundPercentage = exports.calculateAveragePercentage = exports.calculateConversionRate = exports.calculateWeightedPercentage = exports.addPercentage = exports.deductPercentage = exports.calculateCommission = exports.calculateValueFromPercentage = exports.calculatePercentageChange = void 0;
/**
 * Calculate percentage change between two values
 * @param oldValue - Previous value
 * @param newValue - Current value
 * @returns Percentage change (can be negative)
 */
const calculatePercentageChange = (oldValue, newValue) => {
    if (oldValue === 0) {
        return newValue === 0 ? 0 : 100;
    }
    return ((newValue - oldValue) / oldValue) * 100;
};
exports.calculatePercentageChange = calculatePercentageChange;
/**
 * Calculate percentage of a value relative to total
 * @param value - Part value
 * @param total - Total value
 * @returns Percentage (0-100)
 */
const calculatePercentage = (value, total) => {
    if (total === 0)
        return 0;
    return (value / total) * 100;
};
/**
 * Calculate value from percentage
 * @param percentage - Percentage (0-100)
 * @param total - Total value
 * @returns Calculated value
 */
const calculateValueFromPercentage = (percentage, total) => {
    return (percentage / 100) * total;
};
exports.calculateValueFromPercentage = calculateValueFromPercentage;
/**
 * Calculate commission or fee percentage
 * @param amount - Original amount
 * @param percentage - Commission/fee percentage
 * @returns Calculated commission/fee amount
 */
const calculateCommission = (amount, percentage) => {
    return (amount * percentage) / 100;
};
exports.calculateCommission = calculateCommission;
/**
 * Calculate amount after deducting percentage
 * @param amount - Original amount
 * @param percentage - Percentage to deduct
 * @returns Amount after deduction
 */
const deductPercentage = (amount, percentage) => {
    return amount - (0, exports.calculateCommission)(amount, percentage);
};
exports.deductPercentage = deductPercentage;
/**
 * Calculate amount after adding percentage
 * @param amount - Original amount
 * @param percentage - Percentage to add
 * @returns Amount after addition
 */
const addPercentage = (amount, percentage) => {
    return amount + (0, exports.calculateCommission)(amount, percentage);
};
exports.addPercentage = addPercentage;
/**
 * Calculate weighted percentage
 * @param values - Array of values with their weights
 * @returns Weighted percentage
 */
const calculateWeightedPercentage = (values) => {
    const totalWeight = values.reduce((sum, item) => sum + item.weight, 0);
    if (totalWeight === 0)
        return 0;
    const weightedSum = values.reduce((sum, item) => sum + item.value * item.weight, 0);
    return weightedSum / totalWeight;
};
exports.calculateWeightedPercentage = calculateWeightedPercentage;
/**
 * Calculate conversion rate
 * @param conversions - Number of conversions
 * @param total - Total number of attempts
 * @returns Conversion rate percentage
 */
const calculateConversionRate = (conversions, total) => {
    return calculatePercentage(conversions, total);
};
exports.calculateConversionRate = calculateConversionRate;
/**
 * Calculate average percentage from array of percentages
 * @param percentages - Array of percentage values
 * @returns Average percentage
 */
const calculateAveragePercentage = (percentages) => {
    if (percentages.length === 0)
        return 0;
    const sum = percentages.reduce((acc, val) => acc + val, 0);
    return sum / percentages.length;
};
exports.calculateAveragePercentage = calculateAveragePercentage;
/**
 * Calculate compound percentage (for successive percentage changes)
 * @param percentages - Array of percentage changes
 * @returns Compound percentage change
 */
const calculateCompoundPercentage = (percentages) => {
    const multiplier = percentages.reduce((acc, percentage) => acc * (1 + percentage / 100), 1);
    return (multiplier - 1) * 100;
};
exports.calculateCompoundPercentage = calculateCompoundPercentage;
/**
 * Calculate percentage distribution across categories
 * @param values - Object with category names and values
 * @returns Object with category names and percentage distributions
 */
const calculateDistribution = (values) => {
    const total = Object.values(values).reduce((sum, val) => sum + val, 0);
    const distribution = {};
    for (const [key, value] of Object.entries(values)) {
        distribution[key] = calculatePercentage(value, total);
    }
    return distribution;
};
exports.calculateDistribution = calculateDistribution;
/**
 * Calculate percentage increase needed to reach target
 * @param current - Current value
 * @param target - Target value
 * @returns Percentage increase needed
 */
const calculatePercentageToTarget = (current, target) => {
    if (current === 0)
        return target === 0 ? 0 : Infinity;
    return ((target - current) / current) * 100;
};
exports.calculatePercentageToTarget = calculatePercentageToTarget;
/**
 * Format percentage for display
 * @param value - Percentage value
 * @param decimals - Number of decimal places (default: 2)
 * @param showSign - Whether to show + sign for positive values
 * @returns Formatted percentage string
 */
const formatPercentageUtil = (value, decimals = 2, showSign = false) => {
    const formatted = value.toFixed(decimals);
    if (showSign && value > 0) {
        return `+${formatted}%`;
    }
    return `${formatted}%`;
};
exports.formatPercentageUtil = formatPercentageUtil;
/**
 * Calculate year-over-year percentage change
 * @param currentPeriod - Current period value
 * @param previousPeriod - Previous period value
 * @returns YoY percentage change
 */
const calculateYoYChange = (currentPeriod, previousPeriod) => {
    return (0, exports.calculatePercentageChange)(previousPeriod, currentPeriod);
};
exports.calculateYoYChange = calculateYoYChange;
/**
 * Calculate month-over-month percentage change
 * @param currentMonth - Current month value
 * @param previousMonth - Previous month value
 * @returns MoM percentage change
 */
const calculateMoMChange = (currentMonth, previousMonth) => {
    return (0, exports.calculatePercentageChange)(previousMonth, currentMonth);
};
exports.calculateMoMChange = calculateMoMChange;
/**
 * Calculate percentage split for commission distribution
 * @param amount - Total amount to split
 * @param percentages - Array of percentage splits (must sum to 100)
 * @returns Array of calculated amounts
 */
const calculatePercentageSplit = (amount, percentages) => {
    // Validate that percentages sum to approximately 100
    const sum = percentages.reduce((acc, val) => acc + val, 0);
    if (Math.abs(sum - 100) > 0.01) {
        throw new Error('Percentages must sum to 100');
    }
    return percentages.map((percentage) => (0, exports.calculateCommission)(amount, percentage));
};
exports.calculatePercentageSplit = calculatePercentageSplit;
/**
 * Calculate retention rate
 * @param retained - Number of users/items retained
 * @param initial - Initial number of users/items
 * @returns Retention rate percentage
 */
const calculateRetentionRate = (retained, initial) => {
    return calculatePercentage(retained, initial);
};
exports.calculateRetentionRate = calculateRetentionRate;
/**
 * Calculate churn rate
 * @param churned - Number of users/items that churned
 * @param initial - Initial number of users/items
 * @returns Churn rate percentage
 */
const calculateChurnRate = (churned, initial) => {
    return calculatePercentage(churned, initial);
};
exports.calculateChurnRate = calculateChurnRate;
/**
 * Calculate percentage difference (absolute)
 * @param value1 - First value
 * @param value2 - Second value
 * @returns Absolute percentage difference
 */
const calculatePercentageDifference = (value1, value2) => {
    const average = (value1 + value2) / 2;
    if (average === 0)
        return 0;
    return (Math.abs(value1 - value2) / average) * 100;
};
exports.calculatePercentageDifference = calculatePercentageDifference;
/**
 * Round percentage to specified decimal places
 * @param percentage - Percentage value
 * @param decimals - Number of decimal places
 * @returns Rounded percentage
 */
const roundPercentage = (percentage, decimals = 2) => {
    const multiplier = Math.pow(10, decimals);
    return Math.round(percentage * multiplier) / multiplier;
};
exports.roundPercentage = roundPercentage;
/**
 * Clamp percentage between 0 and 100
 * @param percentage - Percentage value
 * @returns Clamped percentage
 */
const clampPercentage = (percentage) => {
    return Math.max(0, Math.min(100, percentage));
};
exports.clampPercentage = clampPercentage;
/**
 * Calculate percentage rank (percentile)
 * @param value - Value to rank
 * @param sortedValues - Sorted array of all values
 * @returns Percentile rank (0-100)
 */
const calculatePercentileRank = (value, sortedValues) => {
    if (sortedValues.length === 0)
        return 0;
    let count = 0;
    for (const val of sortedValues) {
        if (val <= value)
            count++;
        else
            break;
    }
    return (count / sortedValues.length) * 100;
};
exports.calculatePercentileRank = calculatePercentileRank;
exports.default = {
    calculatePercentageChange: exports.calculatePercentageChange,
    calculatePercentage,
    calculateValueFromPercentage: exports.calculateValueFromPercentage,
    calculateCommission: exports.calculateCommission,
    deductPercentage: exports.deductPercentage,
    addPercentage: exports.addPercentage,
    calculateWeightedPercentage: exports.calculateWeightedPercentage,
    calculateConversionRate: exports.calculateConversionRate,
    calculateAveragePercentage: exports.calculateAveragePercentage,
    calculateCompoundPercentage: exports.calculateCompoundPercentage,
    calculateDistribution: exports.calculateDistribution,
    calculatePercentageToTarget: exports.calculatePercentageToTarget,
    formatPercentageUtil: exports.formatPercentageUtil,
    calculateYoYChange: exports.calculateYoYChange,
    calculateMoMChange: exports.calculateMoMChange,
    calculatePercentageSplit: exports.calculatePercentageSplit,
    calculateRetentionRate: exports.calculateRetentionRate,
    calculateChurnRate: exports.calculateChurnRate,
    calculatePercentageDifference: exports.calculatePercentageDifference,
    roundPercentage: exports.roundPercentage,
    clampPercentage: exports.clampPercentage,
    calculatePercentileRank: exports.calculatePercentileRank,
};
//# sourceMappingURL=percentageCalculator.js.map