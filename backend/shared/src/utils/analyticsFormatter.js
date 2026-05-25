"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsFormatCurrency = analyticsFormatCurrency;
exports.formatCompactNumber = formatCompactNumber;
exports.formatAnalyticsDate = formatAnalyticsDate;
exports.formatDuration = formatDuration;
exports.formatOccupancyRate = formatOccupancyRate;
exports.analyticsFormatGrowthRate = analyticsFormatGrowthRate;
exports.formatChange = formatChange;
exports.formatPeriodLabel = formatPeriodLabel;
exports.formatTimeSeriesData = formatTimeSeriesData;
exports.formatPerformanceRating = formatPerformanceRating;
exports.formatComparisonToAverage = formatComparisonToAverage;
exports.formatConversionRate = formatConversionRate;
exports.formatAnalyticsSummary = formatAnalyticsSummary;
exports.formatCSV = formatCSV;
const percentageCalculator_1 = require("./percentageCalculator");
/**
 * Format currency values for display
 */
function analyticsFormatCurrency(amount, currency = 'NGN') {
    const currencySymbols = {
        NGN: '₦',
        USD: '$',
        EUR: '€',
        GBP: '£',
    };
    const symbol = currencySymbols[currency] || currency;
    return `${symbol}${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
/**
 * Format large numbers with abbreviations (K, M, B)
 */
function formatCompactNumber(value) {
    if (value >= 1000000000) {
        return `${(value / 1000000000).toFixed(1)}B`;
    }
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
}
/**
 * Format date for analytics display
 */
function formatAnalyticsDate(date, format = 'short') {
    switch (format) {
        case 'short':
            return date.toLocaleDateString('en-NG', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        case 'long':
            return date.toLocaleDateString('en-NG', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        case 'iso':
            return date.toISOString().split('T')[0];
        default:
            return date.toLocaleDateString('en-NG');
    }
}
/**
 * Format duration in hours/minutes
 */
function formatDuration(hours) {
    if (hours < 1) {
        return `${Math.round(hours * 60)} minutes`;
    }
    if (hours < 24) {
        return `${hours.toFixed(1)} hours`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return `${days} day${days > 1 ? 's' : ''}${remainingHours > 0 ? ` ${remainingHours}h` : ''}`;
}
/**
 * Format occupancy rate with status
 */
function formatOccupancyRate(rate) {
    let status;
    let color;
    if (rate >= 90) {
        status = 'excellent';
        color = '#10b981'; // green
    }
    else if (rate >= 75) {
        status = 'good';
        color = '#3b82f6'; // blue
    }
    else if (rate >= 50) {
        status = 'fair';
        color = '#f59e0b'; // yellow
    }
    else {
        status = 'poor';
        color = '#ef4444'; // red
    }
    return {
        formatted: (0, percentageCalculator_1.formatPercentageUtil)(rate),
        status,
        color,
    };
}
/**
 * Format growth rate with indicator
 */
function analyticsFormatGrowthRate(rate) {
    const indicator = rate > 0 ? 'up' : rate < 0 ? 'down' : 'neutral';
    const color = rate > 0 ? '#10b981' : rate < 0 ? '#ef4444' : '#6b7280';
    return {
        formatted: `${rate > 0 ? '+' : ''}${(0, percentageCalculator_1.formatPercentageUtil)(rate)}`,
        indicator,
        color,
    };
}
/**
 * Calculate and format change between two values
 */
function formatChange(current, previous) {
    const absolute = current - previous;
    const percentage = previous !== 0 ? (absolute / previous) * 100 : 0;
    return {
        absolute: absolute > 0 ? `+${absolute}` : absolute.toString(),
        percentage: analyticsFormatGrowthRate(percentage).formatted,
        indicator: analyticsFormatGrowthRate(percentage).indicator,
    };
}
/**
 * Format analytics period label
 */
function formatPeriodLabel(period) {
    const labels = {
        day: 'Daily',
        week: 'Weekly',
        month: 'Monthly',
        year: 'Yearly',
        'last-7-days': 'Last 7 Days',
        'last-30-days': 'Last 30 Days',
        'last-90-days': 'Last 90 Days',
        'last-12-months': 'Last 12 Months',
        'this-month': 'This Month',
        'this-year': 'This Year',
    };
    return labels[period] || period;
}
function formatTimeSeriesData(data, dateFormat = 'short') {
    return data.map((item) => ({
        date: item.date instanceof Date
            ? formatAnalyticsDate(item.date, dateFormat)
            : item.date,
        value: Math.round(item.value * 100) / 100,
    }));
}
/**
 * Format property performance rating
 */
function formatPerformanceRating(rating) {
    const ratings = {
        excellent: { label: 'Excellent', color: '#10b981', icon: '⭐⭐⭐⭐⭐' },
        good: { label: 'Good', color: '#3b82f6', icon: '⭐⭐⭐⭐' },
        average: { label: 'Average', color: '#f59e0b', icon: '⭐⭐⭐' },
        poor: { label: 'Poor', color: '#ef4444', icon: '⭐⭐' },
    };
    return ratings[rating] || ratings.average;
}
/**
 * Calculate and format comparison to average
 */
function formatComparisonToAverage(value, average) {
    const difference = value - average;
    const percentage = average !== 0 ? (difference / average) * 100 : 0;
    const status = difference > 0 ? 'above' : difference < 0 ? 'below' : 'equal';
    const statusLabels = {
        above: 'above average',
        below: 'below average',
        equal: 'at average',
    };
    return {
        difference: analyticsFormatCurrency(Math.abs(difference)),
        percentage: (0, percentageCalculator_1.formatPercentageUtil)(Math.abs(percentage)),
        status,
        formatted: `${(0, percentageCalculator_1.formatPercentageUtil)(Math.abs(percentage))} ${statusLabels[status]}`,
    };
}
/**
 * Format conversion rate with benchmark
 */
function formatConversionRate(rate, benchmark = 2.5) {
    let status;
    if (rate >= benchmark * 1.5) {
        status = 'excellent';
    }
    else if (rate >= benchmark) {
        status = 'good';
    }
    else if (rate >= benchmark * 0.5) {
        status = 'fair';
    }
    else {
        status = 'poor';
    }
    const comparison = ((rate - benchmark) / benchmark) * 100;
    const comparisonText = comparison > 0
        ? `${(0, percentageCalculator_1.formatPercentageUtil)(comparison)} above benchmark`
        : comparison < 0
            ? `${(0, percentageCalculator_1.formatPercentageUtil)(Math.abs(comparison))} below benchmark`
            : 'at benchmark';
    return {
        formatted: (0, percentageCalculator_1.formatPercentageUtil)(rate),
        status,
        comparisonToBenchmark: comparisonText,
    };
}
/**
 * Format analytics summary for export
 */
function formatAnalyticsSummary(data) {
    return JSON.stringify(data, null, 2);
}
/**
 * Format CSV data for export
 */
function formatCSV(data) {
    if (data.length === 0)
        return '';
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    data.forEach((row) => {
        const values = headers.map((header) => {
            const value = row[header];
            // Escape commas and quotes in values
            const escaped = String(value).replace(/"/g, '""');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    });
    return csvRows.join('\n');
}
//# sourceMappingURL=analyticsFormatter.js.map