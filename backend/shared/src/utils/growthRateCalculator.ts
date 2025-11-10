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
export const calculateGrowthRate = (
  startValue: number,
  endValue: number
): number => {
  if (startValue === 0) {
    return endValue === 0 ? 0 : 1;
  }
  return (endValue - startValue) / startValue;
};

/**
 * Calculate compound annual growth rate (CAGR)
 * @param startValue - Starting value
 * @param endValue - Ending value
 * @param years - Number of years
 * @returns CAGR as decimal
 */
export const calculateCAGR = (
  startValue: number,
  endValue: number,
  years: number
): number => {
  if (startValue === 0 || years === 0) return 0;
  return Math.pow(endValue / startValue, 1 / years) - 1;
};

/**
 * Calculate average growth rate across multiple periods
 * @param values - Array of values in chronological order
 * @returns Average growth rate as decimal
 */
export const calculateAverageGrowthRate = (values: number[]): number => {
  if (values.length < 2) return 0;

  const growthRates: number[] = [];
  for (let i = 1; i < values.length; i++) {
    const rate = calculateGrowthRate(values[i - 1], values[i]);
    if (isFinite(rate)) {
      growthRates.push(rate);
    }
  }

  if (growthRates.length === 0) return 0;
  return growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
};

/**
 * Calculate month-over-month growth rate
 * @param currentMonth - Current month value
 * @param previousMonth - Previous month value
 * @returns MoM growth rate as decimal
 */
export const calculateMoMGrowth = (
  currentMonth: number,
  previousMonth: number
): number => {
  return calculateGrowthRate(previousMonth, currentMonth);
};

/**
 * Calculate year-over-year growth rate
 * @param currentYear - Current year value
 * @param previousYear - Previous year value
 * @returns YoY growth rate as decimal
 */
export const calculateYoYGrowth = (
  currentYear: number,
  previousYear: number
): number => {
  return calculateGrowthRate(previousYear, currentYear);
};

/**
 * Calculate quarter-over-quarter growth rate
 * @param currentQuarter - Current quarter value
 * @param previousQuarter - Previous quarter value
 * @returns QoQ growth rate as decimal
 */
export const calculateQoQGrowth = (
  currentQuarter: number,
  previousQuarter: number
): number => {
  return calculateGrowthRate(previousQuarter, currentQuarter);
};

/**
 * Calculate growth metrics for a given period
 * @param startValue - Starting value
 * @param endValue - Ending value
 * @returns Comprehensive growth metrics
 */
export const calculateGrowthMetrics = (
  startValue: number,
  endValue: number
): GrowthMetrics => {
  const growthRate = calculateGrowthRate(startValue, endValue);
  const absoluteGrowth = endValue - startValue;
  const percentageGrowth = growthRate * 100;

  let trend: 'increasing' | 'decreasing' | 'stable';
  if (Math.abs(percentageGrowth) < 0.01) {
    trend = 'stable';
  } else if (percentageGrowth > 0) {
    trend = 'increasing';
  } else {
    trend = 'decreasing';
  }

  return {
    growthRate,
    absoluteGrowth,
    percentageGrowth,
    trend,
  };
};

/**
 * Calculate exponential growth rate
 * @param timeSeries - Array of time series data points
 * @returns Exponential growth rate coefficient
 */
export const calculateExponentialGrowth = (
  timeSeries: TimeSeriesData[]
): number => {
  if (timeSeries.length < 2) return 0;

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

/**
 * Forecast future value based on growth rate
 * @param currentValue - Current value
 * @param growthRate - Growth rate as decimal
 * @param periods - Number of periods to forecast
 * @returns Forecasted value
 */
export const forecastValue = (
  currentValue: number,
  growthRate: number,
  periods: number
): number => {
  return currentValue * Math.pow(1 + growthRate, periods);
};

/**
 * Calculate run rate (annualized value based on current period)
 * @param periodValue - Value for the period
 * @param periodDays - Number of days in the period
 * @returns Annualized run rate
 */
export const calculateRunRate = (
  periodValue: number,
  periodDays: number
): number => {
  return (periodValue / periodDays) * 365;
};

/**
 * Calculate moving average growth rate
 * @param values - Array of values
 * @param windowSize - Size of moving window
 * @returns Array of moving average growth rates
 */
export const calculateMovingAverageGrowth = (
  values: number[],
  windowSize: number = 3
): number[] => {
  if (values.length < windowSize + 1) return [];

  const growthRates: number[] = [];
  for (let i = windowSize; i < values.length; i++) {
    const windowStart = i - windowSize;
    const windowEnd = i;
    const startAvg =
      values.slice(windowStart, windowStart + windowSize).reduce((a, b) => a + b, 0) /
      windowSize;
    const endAvg =
      values.slice(windowEnd - windowSize, windowEnd).reduce((a, b) => a + b, 0) /
      windowSize;
    growthRates.push(calculateGrowthRate(startAvg, endAvg));
  }

  return growthRates;
};

/**
 * Calculate velocity (rate of change)
 * @param values - Array of values with timestamps
 * @returns Average velocity per unit time
 */
export const calculateVelocity = (timeSeries: TimeSeriesData[]): number => {
  if (timeSeries.length < 2) return 0;

  let totalChange = 0;
  let totalTime = 0;

  for (let i = 1; i < timeSeries.length; i++) {
    const change = timeSeries[i].value - timeSeries[i - 1].value;
    const timeDiff =
      (timeSeries[i].date.getTime() - timeSeries[i - 1].date.getTime()) /
      (1000 * 60 * 60 * 24); // Convert to days
    totalChange += change;
    totalTime += timeDiff;
  }

  return totalTime > 0 ? totalChange / totalTime : 0;
};

/**
 * Calculate acceleration (rate of velocity change)
 * @param timeSeries - Array of time series data points
 * @returns Acceleration value
 */
export const calculateAcceleration = (timeSeries: TimeSeriesData[]): number => {
  if (timeSeries.length < 3) return 0;

  const velocities: number[] = [];
  for (let i = 1; i < timeSeries.length; i++) {
    const change = timeSeries[i].value - timeSeries[i - 1].value;
    const timeDiff =
      (timeSeries[i].date.getTime() - timeSeries[i - 1].date.getTime()) /
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

/**
 * Calculate doubling time based on growth rate
 * @param growthRate - Growth rate as decimal
 * @returns Number of periods to double
 */
export const calculateDoublingTime = (growthRate: number): number => {
  if (growthRate <= 0) return Infinity;
  return Math.log(2) / Math.log(1 + growthRate);
};

/**
 * Calculate halving time based on decline rate
 * @param declineRate - Decline rate as decimal (positive number)
 * @returns Number of periods to halve
 */
export const calculateHalvingTime = (declineRate: number): number => {
  if (declineRate <= 0) return Infinity;
  return Math.log(0.5) / Math.log(1 - declineRate);
};

/**
 * Format growth rate for display
 * @param growthRate - Growth rate as decimal
 * @param decimals - Number of decimal places
 * @returns Formatted growth rate string
 */
export const formatGrowthRate = (
  growthRate: number,
  decimals: number = 2
): string => {
  const percentage = growthRate * 100;
  const formatted = percentage.toFixed(decimals);
  return percentage >= 0 ? `+${formatted}%` : `${formatted}%`;
};

/**
 * Calculate sustainable growth rate
 * @param retentionRatio - Proportion of earnings retained (0-1)
 * @param returnOnEquity - Return on equity (ROE) as decimal
 * @returns Sustainable growth rate
 */
export const calculateSustainableGrowthRate = (
  retentionRatio: number,
  returnOnEquity: number
): number => {
  return retentionRatio * returnOnEquity;
};

/**
 * Calculate breakeven growth rate
 * @param fixedCosts - Fixed costs
 * @param variableCostPerUnit - Variable cost per unit
 * @param pricePerUnit - Price per unit
 * @param currentUnits - Current number of units
 * @returns Growth rate needed to break even
 */
export const calculateBreakevenGrowth = (
  fixedCosts: number,
  variableCostPerUnit: number,
  pricePerUnit: number,
  currentUnits: number
): number => {
  const contributionMargin = pricePerUnit - variableCostPerUnit;
  const breakevenUnits = fixedCosts / contributionMargin;
  return calculateGrowthRate(currentUnits, breakevenUnits);
};

/**
 * Detect trend direction from time series
 * @param timeSeries - Array of time series data
 * @returns Trend direction and strength
 */
export const detectTrend = (
  timeSeries: TimeSeriesData[]
): { direction: 'up' | 'down' | 'flat'; strength: number } => {
  if (timeSeries.length < 2) {
    return { direction: 'flat', strength: 0 };
  }

  const growthRates = timeSeries
    .slice(1)
    .map((point, index) =>
      calculateGrowthRate(timeSeries[index].value, point.value)
    );

  const averageGrowth =
    growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
  const variance =
    growthRates.reduce((sum, rate) => sum + Math.pow(rate - averageGrowth, 2), 0) /
    growthRates.length;
  const strength = Math.abs(averageGrowth) / Math.sqrt(variance || 1);

  const direction =
    Math.abs(averageGrowth) < 0.001
      ? 'flat'
      : averageGrowth > 0
        ? 'up'
        : 'down';

  return { direction, strength };
};

/**
 * Calculate growth consistency score (0-1, where 1 is most consistent)
 * @param timeSeries - Array of time series data
 * @returns Consistency score
 */
export const calculateGrowthConsistency = (
  timeSeries: TimeSeriesData[]
): number => {
  if (timeSeries.length < 3) return 0;

  const growthRates = timeSeries
    .slice(1)
    .map((point, index) =>
      calculateGrowthRate(timeSeries[index].value, point.value)
    );

  const mean = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
  const variance =
    growthRates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) /
    growthRates.length;
  const standardDeviation = Math.sqrt(variance);

  // Convert to consistency score (lower std dev = higher consistency)
  return Math.exp(-standardDeviation);
};

export default {
  calculateGrowthRate,
  calculateCAGR,
  calculateAverageGrowthRate,
  calculateMoMGrowth,
  calculateYoYGrowth,
  calculateQoQGrowth,
  calculateGrowthMetrics,
  calculateExponentialGrowth,
  forecastValue,
  calculateRunRate,
  calculateMovingAverageGrowth,
  calculateVelocity,
  calculateAcceleration,
  calculateDoublingTime,
  calculateHalvingTime,
  formatGrowthRate,
  calculateSustainableGrowthRate,
  calculateBreakevenGrowth,
  detectTrend,
  calculateGrowthConsistency,
};