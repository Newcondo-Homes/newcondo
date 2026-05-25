"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateZScore = calculateZScore;
exports.calculateConfidenceInterval = calculateConfidenceInterval;
exports.linearRegression = linearRegression;
exports.calculateCAGRValue = calculateCAGRValue;
exports.calculateYoYGrowthValue = calculateYoYGrowthValue;
exports.calculateMoMGrowthValue = calculateMoMGrowthValue;
exports.calculateWeightedAverage = calculateWeightedAverage;
exports.calculateProbabilityDistribution = calculateProbabilityDistribution;
exports.calculateCDF = calculateCDF;
exports.detectOutliers = detectOutliers;
exports.normalizeData = normalizeData;
exports.standardizeData = standardizeData;
/**
 * Calculate z-score for a value
 */
function calculateZScore(value, mean, stdDev) {
    if (stdDev === 0)
        return 0;
    return (value - mean) / stdDev;
}
/**
 * Calculate confidence interval
 */
function calculateConfidenceInterval(mean, stdDev, sampleSize, confidenceLevel = 0.95) {
    // Z-scores for common confidence levels
    const zScores = {
        0.90: 1.645,
        0.95: 1.96,
        0.99: 2.576
    };
    const zScore = zScores[confidenceLevel] || 1.96;
    const standardError = stdDev / Math.sqrt(sampleSize);
    const margin = zScore * standardError;
    return {
        lower: mean - margin,
        upper: mean + margin
    };
}
/**
 * Perform linear regression
 */
function linearRegression(x, y) {
    if (x.length !== y.length || x.length === 0) {
        return { slope: 0, intercept: 0, rSquared: 0 };
    }
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    // Calculate R-squared
    const yMean = sumY / n;
    const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const ssResidual = y.reduce((sum, yi, i) => {
        const predicted = slope * x[i] + intercept;
        return sum + Math.pow(yi - predicted, 2);
    }, 0);
    const rSquared = 1 - (ssResidual / ssTotal);
    return { slope, intercept, rSquared };
}
/**
 * Calculate compound annual growth rate (CAGR)
 */
function calculateCAGRValue(beginningValue, endingValue, periods) {
    if (beginningValue === 0 || periods === 0)
        return 0;
    return (Math.pow(endingValue / beginningValue, 1 / periods) - 1) * 100;
}
/**
 * Calculate year-over-year growth
 */
function calculateYoYGrowthValue(currentValue, previousValue) {
    if (previousValue === 0)
        return 0;
    return ((currentValue - previousValue) / previousValue) * 100;
}
/**
 * Calculate month-over-month growth
 */
function calculateMoMGrowthValue(currentValue, previousValue) {
    return calculateYoYGrowthValue(currentValue, previousValue);
}
/**
 * Calculate weighted average
 */
function calculateWeightedAverage(values, weights) {
    if (values.length !== weights.length || values.length === 0)
        return 0;
    const weightedSum = values.reduce((sum, value, i) => sum + value * weights[i], 0);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    return totalWeight === 0 ? 0 : weightedSum / totalWeight;
}
/**
 * Calculate probability distribution
 */
function calculateProbabilityDistribution(values) {
    if (values.length === 0)
        return [];
    const frequency = new Map();
    values.forEach(value => {
        frequency.set(value, (frequency.get(value) || 0) + 1);
    });
    const total = values.length;
    return Array.from(frequency.entries())
        .map(([value, count]) => ({
        value,
        probability: count / total
    }))
        .sort((a, b) => b.probability - a.probability);
}
/**
 * Calculate cumulative distribution function
 */
function calculateCDF(values) {
    if (values.length === 0)
        return [];
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    return sorted.map((value, index) => ({
        value,
        cdf: (index + 1) / n
    }));
}
/**
 * Detect outliers using IQR method
 */
function detectOutliers(values) {
    if (values.length === 0) {
        return { outliers: [], lowerBound: 0, upperBound: 0 };
    }
    const sorted = [...values].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    const outliers = values.filter(v => v < lowerBound || v > upperBound);
    return { outliers, lowerBound, upperBound };
}
/**
 * Normalize data to 0-1 range
 */
function normalizeData(values) {
    if (values.length === 0)
        return [];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    if (range === 0)
        return values.map(() => 0);
    return values.map(v => (v - min) / range);
}
/**
 * Standardize data (z-score normalization)
 */
function standardizeData(values) {
    if (values.length === 0)
        return [];
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    if (stdDev === 0)
        return values.map(() => 0);
    return values.map(v => (v - mean) / stdDev);
}
//# sourceMappingURL=statisticsCalculator.js.map