"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aggregateNumbers = aggregateNumbers;
exports.groupBy = groupBy;
exports.calculatePercentile = calculatePercentile;
exports.calculateMedian = calculateMedian;
exports.calculateMode = calculateMode;
exports.calculateVariance = calculateVariance;
exports.calculateStdDev = calculateStdDev;
exports.calculateCorrelation = calculateCorrelation;
exports.calculateMovingAverage = calculateMovingAverage;
exports.calculateEMA = calculateEMA;
exports.sum = sum;
exports.average = average;
exports.aggregateTimeSeries = aggregateTimeSeries;
/**
 * Aggregate array of numbers
 */
function aggregateNumbers(numbers) {
    if (numbers.length === 0) {
        return { sum: 0, average: 0, min: 0, max: 0, count: 0 };
    }
    const sum = numbers.reduce((acc, num) => acc + num, 0);
    const average = sum / numbers.length;
    const min = Math.min(...numbers);
    const max = Math.max(...numbers);
    return { sum, average, min, max, count: numbers.length };
}
/**
 * Group data by key
 */
function groupBy(data, keyExtractor) {
    return data.reduce((groups, item) => {
        const key = keyExtractor(item);
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(item);
        return groups;
    }, {});
}
/**
 * Calculate percentile
 */
function calculatePercentile(values, percentile) {
    if (values.length === 0)
        return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
}
/**
 * Calculate median
 */
function calculateMedian(values) {
    if (values.length === 0)
        return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
        return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
}
/**
 * Calculate mode
 */
function calculateMode(values) {
    if (values.length === 0)
        return 0;
    const frequency = {};
    let maxFreq = 0;
    let mode = values[0];
    values.forEach(value => {
        frequency[value] = (frequency[value] || 0) + 1;
        if (frequency[value] > maxFreq) {
            maxFreq = frequency[value];
            mode = value;
        }
    });
    return mode;
}
/**
 * Calculate variance
 */
function calculateVariance(values) {
    if (values.length === 0)
        return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
}
/**
 * Calculate standard deviation
 */
function calculateStdDev(values) {
    return Math.sqrt(calculateVariance(values));
}
/**
 * Calculate correlation coefficient
 */
function calculateCorrelation(x, y) {
    if (x.length !== y.length || x.length === 0)
        return 0;
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    return denominator === 0 ? 0 : numerator / denominator;
}
/**
 * Moving average calculation
 */
function calculateMovingAverage(values, window) {
    if (values.length < window)
        return [];
    const result = [];
    for (let i = 0; i <= values.length - window; i++) {
        const windowValues = values.slice(i, i + window);
        const average = windowValues.reduce((sum, val) => sum + val, 0) / window;
        result.push(average);
    }
    return result;
}
/**
 * Exponential moving average
 */
function calculateEMA(values, period) {
    if (values.length === 0)
        return [];
    const multiplier = 2 / (period + 1);
    const ema = [values[0]];
    for (let i = 1; i < values.length; i++) {
        ema.push((values[i] - ema[i - 1]) * multiplier + ema[i - 1]);
    }
    return ema;
}
/**
 * Sum array values
 */
function sum(values) {
    return values.reduce((acc, val) => acc + val, 0);
}
/**
 * Average array values
 */
function average(values) {
    if (values.length === 0)
        return 0;
    return sum(values) / values.length;
}
/**
 * Aggregate time series data
 */
function aggregateTimeSeries(data, interval) {
    const grouped = new Map();
    data.forEach(item => {
        const key = formatDateByInterval(item.date, interval);
        if (!grouped.has(key)) {
            grouped.set(key, []);
        }
        grouped.get(key).push(item.value);
    });
    return Array.from(grouped.entries())
        .map(([date, values]) => ({
        date,
        value: average(values)
    }))
        .sort((a, b) => a.date.localeCompare(b.date));
}
/**
 * Format date by interval
 */
function formatDateByInterval(date, interval) {
    const d = new Date(date);
    switch (interval) {
        case 'hour':
            return d.toISOString().substring(0, 13) + ':00:00';
        case 'day':
            return d.toISOString().split('T')[0];
        case 'week':
            const weekStart = new Date(d);
            weekStart.setDate(d.getDate() - d.getDay());
            return weekStart.toISOString().split('T')[0];
        case 'month':
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        default:
            return d.toISOString().split('T')[0];
    }
}
//# sourceMappingURL=dataAggregation.js.map