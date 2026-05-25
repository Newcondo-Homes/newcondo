/**
 * Growth Rate Calculator Utility
 * Handles growth rate calculations for analytics and forecasting
 * Location: backend/shared/src/utils/growthRateCalculator.ts
 */
interface TimeSeriesData {
    date: Date;
    value: number;
}
interface GrowthMetrics {
    growthRate: number;
    absoluteGrowth: number;
    percentageGrowth: number;
    trend: 'increasing' | 'decreasing' | 'stable';
}
/**
 * Calculate simple growth rate
 * @param startValue - Starting value
 * @param endValue - Ending value
 * @returns Growth rate as decimal (0.25 = 25% growth)
 */
export declare const calculateGrowthRate: (startValue: number, endValue: number) => number;
/**
 * Calculate compound annual growth rate (CAGR)
 * @param startValue - Starting value
 * @param endValue - Ending value
 * @param years - Number of years
 * @returns CAGR as decimal
 */
export declare const calculateCAGR: (startValue: number, endValue: number, years: number) => number;
/**
 * Calculate average growth rate across multiple periods
 * @param values - Array of values in chronological order
 * @returns Average growth rate as decimal
 */
export declare const calculateAverageGrowthRate: (values: number[]) => number;
/**
 * Calculate month-over-month growth rate
 * @param currentMonth - Current month value
 * @param previousMonth - Previous month value
 * @returns MoM growth rate as decimal
 */
export declare const calculateMoMGrowth: (currentMonth: number, previousMonth: number) => number;
/**
 * Calculate year-over-year growth rate
 * @param currentYear - Current year value
 * @param previousYear - Previous year value
 * @returns YoY growth rate as decimal
 */
export declare const calculateYoYGrowth: (currentYear: number, previousYear: number) => number;
/**
 * Calculate quarter-over-quarter growth rate
 * @param currentQuarter - Current quarter value
 * @param previousQuarter - Previous quarter value
 * @returns QoQ growth rate as decimal
 */
export declare const calculateQoQGrowth: (currentQuarter: number, previousQuarter: number) => number;
/**
 * Calculate growth metrics for a given period
 * @param startValue - Starting value
 * @param endValue - Ending value
 * @returns Comprehensive growth metrics
 */
export declare const calculateGrowthMetrics: (startValue: number, endValue: number) => GrowthMetrics;
/**
 * Calculate exponential growth rate
 * @param timeSeries - Array of time series data points
 * @returns Exponential growth rate coefficient
 */
export declare const calculateExponentialGrowth: (timeSeries: TimeSeriesData[]) => number;
/**
 * Forecast future value based on growth rate
 * @param currentValue - Current value
 * @param growthRate - Growth rate as decimal
 * @param periods - Number of periods to forecast
 * @returns Forecasted value
 */
export declare const forecastValue: (currentValue: number, growthRate: number, periods: number) => number;
/**
 * Calculate run rate (annualized value based on current period)
 * @param periodValue - Value for the period
 * @param periodDays - Number of days in the period
 * @returns Annualized run rate
 */
export declare const calculateRunRate: (periodValue: number, periodDays: number) => number;
/**
 * Calculate moving average growth rate
 * @param values - Array of values
 * @param windowSize - Size of moving window
 * @returns Array of moving average growth rates
 */
export declare const calculateMovingAverageGrowth: (values: number[], windowSize?: number) => number[];
/**
 * Calculate velocity (rate of change)
 * @param values - Array of values with timestamps
 * @returns Average velocity per unit time
 */
export declare const calculateVelocity: (timeSeries: TimeSeriesData[]) => number;
/**
 * Calculate acceleration (rate of velocity change)
 * @param timeSeries - Array of time series data points
 * @returns Acceleration value
 */
export declare const calculateAcceleration: (timeSeries: TimeSeriesData[]) => number;
/**
 * Calculate doubling time based on growth rate
 * @param growthRate - Growth rate as decimal
 * @returns Number of periods to double
 */
export declare const calculateDoublingTime: (growthRate: number) => number;
/**
 * Calculate halving time based on decline rate
 * @param declineRate - Decline rate as decimal (positive number)
 * @returns Number of periods to halve
 */
export declare const calculateHalvingTime: (declineRate: number) => number;
/**
 * Format growth rate for display
 * @param growthRate - Growth rate as decimal
 * @param decimals - Number of decimal places
 * @returns Formatted growth rate string
 */
export declare const formatGrowthRate: (growthRate: number, decimals?: number) => string;
/**
 * Calculate sustainable growth rate
 * @param retentionRatio - Proportion of earnings retained (0-1)
 * @param returnOnEquity - Return on equity (ROE) as decimal
 * @returns Sustainable growth rate
 */
export declare const calculateSustainableGrowthRate: (retentionRatio: number, returnOnEquity: number) => number;
/**
 * Calculate breakeven growth rate
 * @param fixedCosts - Fixed costs
 * @param variableCostPerUnit - Variable cost per unit
 * @param pricePerUnit - Price per unit
 * @param currentUnits - Current number of units
 * @returns Growth rate needed to break even
 */
export declare const calculateBreakevenGrowth: (fixedCosts: number, variableCostPerUnit: number, pricePerUnit: number, currentUnits: number) => number;
/**
 * Detect trend direction from time series
 * @param timeSeries - Array of time series data
 * @returns Trend direction and strength
 */
export declare const detectTrend: (timeSeries: TimeSeriesData[]) => {
    direction: "up" | "down" | "flat";
    strength: number;
};
/**
 * Calculate growth consistency score (0-1, where 1 is most consistent)
 * @param timeSeries - Array of time series data
 * @returns Consistency score
 */
export declare const calculateGrowthConsistency: (timeSeries: TimeSeriesData[]) => number;
declare const _default: {
    calculateGrowthRate: (startValue: number, endValue: number) => number;
    calculateCAGR: (startValue: number, endValue: number, years: number) => number;
    calculateAverageGrowthRate: (values: number[]) => number;
    calculateMoMGrowth: (currentMonth: number, previousMonth: number) => number;
    calculateYoYGrowth: (currentYear: number, previousYear: number) => number;
    calculateQoQGrowth: (currentQuarter: number, previousQuarter: number) => number;
    calculateGrowthMetrics: (startValue: number, endValue: number) => GrowthMetrics;
    calculateExponentialGrowth: (timeSeries: TimeSeriesData[]) => number;
    forecastValue: (currentValue: number, growthRate: number, periods: number) => number;
    calculateRunRate: (periodValue: number, periodDays: number) => number;
    calculateMovingAverageGrowth: (values: number[], windowSize?: number) => number[];
    calculateVelocity: (timeSeries: TimeSeriesData[]) => number;
    calculateAcceleration: (timeSeries: TimeSeriesData[]) => number;
    calculateDoublingTime: (growthRate: number) => number;
    calculateHalvingTime: (declineRate: number) => number;
    formatGrowthRate: (growthRate: number, decimals?: number) => string;
    calculateSustainableGrowthRate: (retentionRatio: number, returnOnEquity: number) => number;
    calculateBreakevenGrowth: (fixedCosts: number, variableCostPerUnit: number, pricePerUnit: number, currentUnits: number) => number;
    detectTrend: (timeSeries: TimeSeriesData[]) => {
        direction: "up" | "down" | "flat";
        strength: number;
    };
    calculateGrowthConsistency: (timeSeries: TimeSeriesData[]) => number;
};
export default _default;
//# sourceMappingURL=growthRateCalculator.d.ts.map