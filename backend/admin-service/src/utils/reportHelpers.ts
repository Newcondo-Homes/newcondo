// backend/admin-service/src/utils/reportHelpers.ts

import { TimeSeriesData, TimeSeriesPoint } from '../types/analytics';

/**
 * Generate time series data points
 */
export const generateTimeSeriesData = (
  data: { timestamp: Date; value: number }[],
  period: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY'
): TimeSeriesData => {
  const groupedData = groupDataByPeriod(data, period);
  const dataPoints: TimeSeriesPoint[] = Object.entries(groupedData).map(
    ([timestamp, values]) => ({
      timestamp: new Date(timestamp),
      value: values.reduce((sum, v) => sum + v, 0),
      label: formatPeriodLabel(new Date(timestamp), period),
    })
  );
  
  return {
    period,
    dataPoints: dataPoints.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    ),
  };
};

/**
 * Group data by time period
 */
const groupDataByPeriod = (
  data: { timestamp: Date; value: number }[],
  period: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY'
): Record<string, number[]> => {
  const grouped: Record<string, number[]> = {};
  
  data.forEach(item => {
    const key = getPeriodKey(item.timestamp, period);
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(item.value);
  });
  
  return grouped;
};

/**
 * Get period key for grouping
 */
const getPeriodKey = (
  date: Date,
  period: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY'
): string => {
  switch (period) {
    case 'HOURLY':
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
    case 'DAILY':
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    case 'WEEKLY':
      const weekNum = getWeekNumber(date);
      return `${date.getFullYear()}-W${weekNum}`;
    case 'MONTHLY':
      return `${date.getFullYear()}-${date.getMonth()}`;
    default:
      return date.toISOString();
  }
};

/**
 * Get week number of year
 */
const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

/**
 * Format period label
 */
const formatPeriodLabel = (
  date: Date,
  period: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY'
): string => {
  switch (period) {
    case 'HOURLY':
      return date.toLocaleString('en-NG', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
      });
    case 'DAILY':
      return date.toLocaleString('en-NG', {
        month: 'short',
        day: 'numeric',
      });
    case 'WEEKLY':
      const weekNum = getWeekNumber(date);
      return `Week ${weekNum}, ${date.getFullYear()}`;
    case 'MONTHLY':
      return date.toLocaleString('en-NG', {
        month: 'long',
        year: 'numeric',
      });
    default:
      return date.toLocaleDateString('en-NG');
  }
};

/**
 * Calculate growth rate
 */
export const calculateGrowthRate = (
  currentValue: number,
  previousValue: number
): number => {
  if (previousValue === 0) return currentValue > 0 ? 100 : 0;
  return ((currentValue - previousValue) / previousValue) * 100;
};

/**
 * Calculate moving average
 */
export const calculateMovingAverage = (
  values: number[],
  windowSize: number
): number[] => {
  const result: number[] = [];
  
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const window = values.slice(start, i + 1);
    const avg = window.reduce((sum, val) => sum + val, 0) / window.length;
    result.push(avg);
  }
  
  return result;
};

/**
 * Generate report summary
 */
export const generateReportSummary = (data: {
  title: string;
  description: string;
  period: { from: Date; to: Date };
  metrics: { label: string; value: number | string; change?: number }[];
}): string => {
  const { title, description, period, metrics } = data;
  
  let summary = `${title}\n`;
  summary += `${'='.repeat(title.length)}\n\n`;
  summary += `${description}\n\n`;
  summary += `Period: ${period.from.toLocaleDateString()} - ${period.to.toLocaleDateString()}\n\n`;
  summary += `Key Metrics:\n`;
  summary += `${'-'.repeat(50)}\n`;
  
  metrics.forEach(metric => {
    const changeStr = metric.change
      ? ` (${metric.change > 0 ? '+' : ''}${metric.change.toFixed(2)}%)`
      : '';
    summary += `${metric.label}: ${metric.value}${changeStr}\n`;
  });
  
  return summary;
};

/**
 * Format number with suffix (K, M, B)
 */
export const formatNumberWithSuffix = (num: number): string => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * Calculate percentile
 */
export const calculatePercentile = (
  values: number[],
  percentile: number
): number => {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  
  if (lower === upper) {
    return sorted[lower];
  }
  
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
};

/**
 * Generate comparison data
 */
export const generateComparisonData = (
  current: Record<string, number>,
  previous: Record<string, number>
): Array<{
  label: string;
  current: number;
  previous: number;
  change: number;
  changePercentage: number;
}> => {
  return Object.keys(current).map(key => {
    const currentVal = current[key] || 0;
    const previousVal = previous[key] || 0;
    const change = currentVal - previousVal;
    const changePercentage =
      previousVal === 0 ? (currentVal > 0 ? 100 : 0) : (change / previousVal) * 100;
    
    return {
      label: key,
      current: currentVal,
      previous: previousVal,
      change,
      changePercentage,
    };
  });
};

/**
 * Aggregate data by category
 */
export const aggregateByCategory = <T>(
  data: T[],
  categoryKey: keyof T,
  valueKey: keyof T
): Record<string, number> => {
  return data.reduce((acc, item) => {
    const category = String(item[categoryKey]);
    const value = Number(item[valueKey]) || 0;
    
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += value;
    
    return acc;
  }, {} as Record<string, number>);
};

/**
 * Calculate standard deviation
 */
export const calculateStandardDeviation = (values: number[]): number => {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  
  return Math.sqrt(variance);
};

/**
 * Generate report filename
 */
export const generateReportFilename = (
  reportType: string,
  format: string,
  timestamp?: Date
): string => {
  const date = timestamp || new Date();
  const dateStr = date.toISOString().split('T')[0];
  const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-');
  
  return `${reportType}_${dateStr}_${timeStr}.${format.toLowerCase()}`;
};