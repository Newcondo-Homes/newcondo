"use strict";
/**
 * Growth Rate Calculator Utility
 * Handles growth rate calculations for analytics and forecasting
 * Location: backend/shared/src/utils/growthRateCalculator.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateGrowthConsistency = exports.detectTrend = exports.calculateBreakevenGrowth = exports.calculateSustainableGrowthRate = exports.formatGrowthRate = exports.calculateHalvingTime = exports.calculateDoublingTime = exports.calculateAcceleration = exports.calculateVelocity = exports.calculateMovingAverageGrowth = exports.calculateRunRate = exports.forecastValue = exports.calculateExponentialGrowth = exports.calculateGrowthMetrics = exports.calculateQoQGrowth = exports.calculateYoYGrowth = exports.calculateMoMGrowth = exports.calculateAverageGrowthRate = exports.calculateCAGR = exports.calculateGrowthRate = void 0;
/**
 * Calculate simple growth rate
 * @param startValue - Starting value
 * @param endValue - Ending value
 * @returns Growth rate as decimal (0.25 = 25% growth)
 */
const calculateGrowthRate = (startValue, endValue) => {
    if (startValue === 0) {
        return endValue === 0 ? 0 : 1;
    }
    return (endValue - startValue) / startValue;
};
exports.calculateGrowthRate = calculateGrowthRate;
/**
 * Calculate compound annual growth rate (CAGR)
 * @param startValue - Starting value
 * @param endValue - Ending value
 * @param years - Number of years
 * @returns CAGR as decimal
 */
const calculateCAGR = (startValue, endValue, years) => {
    if (startValue === 0 || years === 0)
        return 0;
    return Math.pow(endValue / startValue, 1 / years) - 1;
};
exports.calculateCAGR = calculateCAGR;
/**
 * Calculate average growth rate across multiple periods
 * @param values - Array of values in chronological order
 * @returns Average growth rate as decimal
 */
const calculateAverageGrowthRate = (values) => {
    if (values.length < 2)
        return 0;
    const growthRates = [];
    for (let i = 1; i < values.length; i++) {
        const rate = (0, exports.calculateGrowthRate)(values[i - 1], values[i]);
        if (isFinite(rate)) {
            growthRates.push(rate);
        }
    }
    if (growthRates.length === 0)
        return 0;
    return growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
};
exports.calculateAverageGrowthRate = calculateAverageGrowthRate;
/**
 * Calculate month-over-month growth rate
 * @param currentMonth - Current month value
 * @param previousMonth - Previous month value
 * @returns MoM growth rate as decimal
 */
const calculateMoMGrowth = (currentMonth, previousMonth) => {
    return (0, exports.calculateGrowthRate)(previousMonth, currentMonth);
};
exports.calculateMoMGrowth = calculateMoMGrowth;
/**
 * Calculate year-over-year growth rate
 * @param currentYear - Current year value
 * @param previousYear - Previous year value
 * @returns YoY growth rate as decimal
 */
const calculateYoYGrowth = (currentYear, previousYear) => {
    return (0, exports.calculateGrowthRate)(previousYear, currentYear);
};
exports.calculateYoYGrowth = calculateYoYGrowth;
/**
 * Calculate quarter-over-quarter growth rate
 * @param currentQuarter - Current quarter value
 * @param previousQuarter - Previous quarter value
 * @returns QoQ growth rate as decimal
 */
const calculateQoQGrowth = (currentQuarter, previousQuarter) => {
    return (0, exports.calculateGrowthRate)(previousQuarter, currentQuarter);
};
exports.calculateQoQGrowth = calculateQoQGrowth;
/**
 * Calculate growth metrics for a given period
 * @param startValue - Starting value
 * @param endValue - Ending value
 * @returns Comprehensive growth metrics
 */
const calculateGrowthMetrics = (startValue, endValue) => {
    const growthRate = (0, exports.calculateGrowthRate)(startValue, endValue);
    const absoluteGrowth = endValue - startValue;
    const percentageGrowth = growthRate * 100;
    let trend;
    if (Math.abs(percentageGrowth) < 0.01) {
        trend = 'stable';
    }
    else if (percentageGrowth > 0) {
        trend = 'increasing';
    }
    else {
        trend = 'decreasing';
    }
    return {
        growthRate,
        absoluteGrowth,
        percentageGrowth,
        trend,
    };
};
exports.calculateGrowthMetrics = calculateGrowthMetrics;
/**
 * Calculate exponential growth rate
 * @param timeSeries - Array of time series data points
 * @returns Exponential growth rate coefficient
 */
const calculateExponentialGrowth = (timeSeries) => {
    if (timeSeries.length < 2)
        return 0;
    // Simple exponential regression
    const n = timeSeries.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;
    timeSeries.forEach((point, index) => {
        const x = index;
        const y = Math.log(Math.max(point.value, 1)); // Avoid log(0)
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
    });
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return Math.exp(slope) - 1;
};
exports.calculateExponentialGrowth = calculateExponentialGrowth;
/**
 * Forecast future value based on growth rate
 * @param currentValue - Current value
 * @param growthRate - Growth rate as decimal
 * @param periods - Number of periods to forecast
 * @returns Forecasted value
 */
const forecastValue = (currentValue, growthRate, periods) => {
    return currentValue * Math.pow(1 + growthRate, periods);
};
exports.forecastValue = forecastValue;
/**
 * Calculate run rate (annualized value based on current period)
 * @param periodValue - Value for the period
 * @param periodDays - Number of days in the period
 * @returns Annualized run rate
 */
const calculateRunRate = (periodValue, periodDays) => {
    return (periodValue / periodDays) * 365;
};
exports.calculateRunRate = calculateRunRate;
/**
 * Calculate moving average growth rate
 * @param values - Array of values
 * @param windowSize - Size of moving window
 * @returns Array of moving average growth rates
 */
const calculateMovingAverageGrowth = (values, windowSize = 3) => {
    if (values.length < windowSize + 1)
        return [];
    const growthRates = [];
    for (let i = windowSize; i < values.length; i++) {
        const windowStart = i - windowSize;
        const windowEnd = i;
        const startAvg = values.slice(windowStart, windowStart + windowSize).reduce((a, b) => a + b, 0) /
            windowSize;
        const endAvg = values.slice(windowEnd - windowSize, windowEnd).reduce((a, b) => a + b, 0) /
            windowSize;
        growthRates.push((0, exports.calculateGrowthRate)(startAvg, endAvg));
    }
    return growthRates;
};
exports.calculateMovingAverageGrowth = calculateMovingAverageGrowth;
/**
 * Calculate velocity (rate of change)
 * @param values - Array of values with timestamps
 * @returns Average velocity per unit time
 */
const calculateVelocity = (timeSeries) => {
    if (timeSeries.length < 2)
        return 0;
    let totalChange = 0;
    let totalTime = 0;
    for (let i = 1; i < timeSeries.length; i++) {
        const change = timeSeries[i].value - timeSeries[i - 1].value;
        const timeDiff = (timeSeries[i].date.getTime() - timeSeries[i - 1].date.getTime()) /
            (1000 * 60 * 60 * 24); // Convert to days
        totalChange += change;
        totalTime += timeDiff;
    }
    return totalTime > 0 ? totalChange / totalTime : 0;
};
exports.calculateVelocity = calculateVelocity;
/**
 * Calculate acceleration (rate of velocity change)
 * @param timeSeries - Array of time series data points
 * @returns Acceleration value
 */
const calculateAcceleration = (timeSeries) => {
    if (timeSeries.length < 3)
        return 0;
    const velocities = [];
    for (let i = 1; i < timeSeries.length; i++) {
        const change = timeSeries[i].value - timeSeries[i - 1].value;
        const timeDiff = (timeSeries[i].date.getTime() - timeSeries[i - 1].date.getTime()) /
            (1000 * 60 * 60 * 24);
        velocities.push(change / timeDiff);
    }
    // Calculate rate of change in velocity
    let totalAcceleration = 0;
    for (let i = 1; i < velocities.length; i++) {
        totalAcceleration += velocities[i] - velocities[i - 1];
    }
    return totalAcceleration / (velocities.length - 1);
};
exports.calculateAcceleration = calculateAcceleration;
/**
 * Calculate doubling time based on growth rate
 * @param growthRate - Growth rate as decimal
 * @returns Number of periods to double
 */
const calculateDoublingTime = (growthRate) => {
    if (growthRate <= 0)
        return Infinity;
    return Math.log(2) / Math.log(1 + growthRate);
};
exports.calculateDoublingTime = calculateDoublingTime;
/**
 * Calculate halving time based on decline rate
 * @param declineRate - Decline rate as decimal (positive number)
 * @returns Number of periods to halve
 */
const calculateHalvingTime = (declineRate) => {
    if (declineRate <= 0)
        return Infinity;
    return Math.log(0.5) / Math.log(1 - declineRate);
};
exports.calculateHalvingTime = calculateHalvingTime;
/**
 * Format growth rate for display
 * @param growthRate - Growth rate as decimal
 * @param decimals - Number of decimal places
 * @returns Formatted growth rate string
 */
const formatGrowthRate = (growthRate, decimals = 2) => {
    const percentage = growthRate * 100;
    const formatted = percentage.toFixed(decimals);
    return percentage >= 0 ? `+${formatted}%` : `${formatted}%`;
};
exports.formatGrowthRate = formatGrowthRate;
/**
 * Calculate sustainable growth rate
 * @param retentionRatio - Proportion of earnings retained (0-1)
 * @param returnOnEquity - Return on equity (ROE) as decimal
 * @returns Sustainable growth rate
 */
const calculateSustainableGrowthRate = (retentionRatio, returnOnEquity) => {
    return retentionRatio * returnOnEquity;
};
exports.calculateSustainableGrowthRate = calculateSustainableGrowthRate;
/**
 * Calculate breakeven growth rate
 * @param fixedCosts - Fixed costs
 * @param variableCostPerUnit - Variable cost per unit
 * @param pricePerUnit - Price per unit
 * @param currentUnits - Current number of units
 * @returns Growth rate needed to break even
 */
const calculateBreakevenGrowth = (fixedCosts, variableCostPerUnit, pricePerUnit, currentUnits) => {
    const contributionMargin = pricePerUnit - variableCostPerUnit;
    const breakevenUnits = fixedCosts / contributionMargin;
    return (0, exports.calculateGrowthRate)(currentUnits, breakevenUnits);
};
exports.calculateBreakevenGrowth = calculateBreakevenGrowth;
/**
 * Detect trend direction from time series
 * @param timeSeries - Array of time series data
 * @returns Trend direction and strength
 */
const detectTrend = (timeSeries) => {
    if (timeSeries.length < 2) {
        return { direction: 'flat', strength: 0 };
    }
    const growthRates = timeSeries
        .slice(1)
        .map((point, index) => (0, exports.calculateGrowthRate)(timeSeries[index].value, point.value));
    const averageGrowth = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
    const variance = growthRates.reduce((sum, rate) => sum + Math.pow(rate - averageGrowth, 2), 0) /
        growthRates.length;
    const strength = Math.abs(averageGrowth) / Math.sqrt(variance || 1);
    const direction = Math.abs(averageGrowth) < 0.001
        ? 'flat'
        : averageGrowth > 0
            ? 'up'
            : 'down';
    return { direction, strength };
};
exports.detectTrend = detectTrend;
/**
 * Calculate growth consistency score (0-1, where 1 is most consistent)
 * @param timeSeries - Array of time series data
 * @returns Consistency score
 */
const calculateGrowthConsistency = (timeSeries) => {
    if (timeSeries.length < 3)
        return 0;
    const growthRates = timeSeries
        .slice(1)
        .map((point, index) => (0, exports.calculateGrowthRate)(timeSeries[index].value, point.value));
    const mean = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
    const variance = growthRates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) /
        growthRates.length;
    const standardDeviation = Math.sqrt(variance);
    // Convert to consistency score (lower std dev = higher consistency)
    return Math.exp(-standardDeviation);
};
exports.calculateGrowthConsistency = calculateGrowthConsistency;
exports.default = {
    calculateGrowthRate: exports.calculateGrowthRate,
    calculateCAGR: exports.calculateCAGR,
    calculateAverageGrowthRate: exports.calculateAverageGrowthRate,
    calculateMoMGrowth: exports.calculateMoMGrowth,
    calculateYoYGrowth: exports.calculateYoYGrowth,
    calculateQoQGrowth: exports.calculateQoQGrowth,
    calculateGrowthMetrics: exports.calculateGrowthMetrics,
    calculateExponentialGrowth: exports.calculateExponentialGrowth,
    forecastValue: exports.forecastValue,
    calculateRunRate: exports.calculateRunRate,
    calculateMovingAverageGrowth: exports.calculateMovingAverageGrowth,
    calculateVelocity: exports.calculateVelocity,
    calculateAcceleration: exports.calculateAcceleration,
    calculateDoublingTime: exports.calculateDoublingTime,
    calculateHalvingTime: exports.calculateHalvingTime,
    formatGrowthRate: exports.formatGrowthRate,
    calculateSustainableGrowthRate: exports.calculateSustainableGrowthRate,
    calculateBreakevenGrowth: exports.calculateBreakevenGrowth,
    detectTrend: exports.detectTrend,
    calculateGrowthConsistency: exports.calculateGrowthConsistency,
};
//# sourceMappingURL=growthRateCalculator.js.map