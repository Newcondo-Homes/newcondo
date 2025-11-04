/**
 * Format currency values for display
 */
export function formatCurrency(amount: number, currency: string = 'NGN'): string {
  const currencySymbols: { [key: string]: string } = {
    NGN: '₦',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };

  const symbol = currencySymbols[currency] || currency;
  return `${symbol}${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format percentage values
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format large numbers with abbreviations (K, M, B)
 */
export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toString();
}

/**
 * Format date for analytics display
 */
export function formatAnalyticsDate(date: Date, format: 'short' | 'long' | 'iso' = 'short'): string {
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
export function formatDuration(hours: number): string {
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
export function formatOccupancyRate(rate: number): {
  formatted: string;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  color: string;
} {
  let status: 'excellent' | 'good' | 'fair' | 'poor';
  let color: string;

  if (rate >= 90) {
    status = 'excellent';
    color = '#10b981'; // green
  } else if (rate >= 75) {
    status = 'good';
    color = '#3b82f6'; // blue
  } else if (rate >= 50) {
    status = 'fair';
    color = '#f59e0b'; // yellow
  } else {
    status = 'poor';
    color = '#ef4444'; // red
  }

  return {
    formatted: formatPercentage(rate),
    status,
    color,
  };
}

/**
 * Format growth rate with indicator
 */
export function formatGrowthRate(rate: number): {
  formatted: string;
  indicator: 'up' | 'down' | 'neutral';
  color: string;
} {
  const indicator = rate > 0 ? 'up' : rate < 0 ? 'down' : 'neutral';
  const color = rate > 0 ? '#10b981' : rate < 0 ? '#ef4444' : '#6b7280';

  return {
    formatted: `${rate > 0 ? '+' : ''}${formatPercentage(rate)}`,
    indicator,
    color,
  };
}

/**
 * Calculate and format change between two values
 */
export function formatChange(current: number, previous: number): {
  absolute: string;
  percentage: string;
  indicator: 'up' | 'down' | 'neutral';
} {
  const absolute = current - previous;
  const percentage = previous !== 0 ? (absolute / previous) * 100 : 0;

  return {
    absolute: absolute > 0 ? `+${absolute}` : absolute.toString(),
    percentage: formatGrowthRate(percentage).formatted,
    indicator: formatGrowthRate(percentage).indicator,
  };
}

/**
 * Format analytics period label
 */
export function formatPeriodLabel(period: string): string {
  const labels: { [key: string]: string } = {
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

/**
 * Format time series data for charts
 */
export interface TimeSeriesData {
  date: string;
  value: number;
}

export function formatTimeSeriesData(
  data: Array<{ date: Date | string; value: number }>,
  dateFormat: 'short' | 'long' | 'iso' = 'short'
): TimeSeriesData[] {
  return data.map((item) => ({
    date:
      item.date instanceof Date
        ? formatAnalyticsDate(item.date, dateFormat)
        : item.date,
    value: Math.round(item.value * 100) / 100,
  }));
}

/**
 * Format property performance rating
 */
export function formatPerformanceRating(rating: string): {
  label: string;
  color: string;
  icon: string;
} {
  const ratings: {
    [key: string]: { label: string; color: string; icon: string };
  } = {
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
export function formatComparisonToAverage(value: number, average: number): {
  difference: string;
  percentage: string;
  status: 'above' | 'below' | 'equal';
  formatted: string;
} {
  const difference = value - average;
  const percentage = average !== 0 ? (difference / average) * 100 : 0;
  const status = difference > 0 ? 'above' : difference < 0 ? 'below' : 'equal';

  const statusLabels = {
    above: 'above average',
    below: 'below average',
    equal: 'at average',
  };

  return {
    difference: formatCurrency(Math.abs(difference)),
    percentage: formatPercentage(Math.abs(percentage)),
    status,
    formatted: `${formatPercentage(Math.abs(percentage))} ${statusLabels[status]}`,
  };
}

/**
 * Format conversion rate with benchmark
 */
export function formatConversionRate(rate: number, benchmark: number = 2.5): {
  formatted: string;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  comparisonToBenchmark: string;
} {
  let status: 'excellent' | 'good' | 'fair' | 'poor';

  if (rate >= benchmark * 1.5) {
    status = 'excellent';
  } else if (rate >= benchmark) {
    status = 'good';
  } else if (rate >= benchmark * 0.5) {
    status = 'fair';
  } else {
    status = 'poor';
  }

  const comparison = ((rate - benchmark) / benchmark) * 100;
  const comparisonText =
    comparison > 0
      ? `${formatPercentage(comparison)} above benchmark`
      : comparison < 0
      ? `${formatPercentage(Math.abs(comparison))} below benchmark`
      : 'at benchmark';

  return {
    formatted: formatPercentage(rate),
    status,
    comparisonToBenchmark: comparisonText,
  };
}

/**
 * Format analytics summary for export
 */
export function formatAnalyticsSummary(data: any): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Format CSV data for export
 */
export function formatCSV(data: Array<{ [key: string]: any }>): string {
  if (data.length === 0) return '';

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