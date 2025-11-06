// apps/admin/src/lib/utils/aggregationHelpers.ts

/**
 * Group data by a specific key
 */
export const groupBy = <T>(
  data: T[],
  key: keyof T
): Record<string, T[]> => {
  return data.reduce((acc, item) => {
    const groupKey = String(item[key]);
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(item);
    return acc;
  }, {} as Record<string, T[]>);
};

/**
 * Count occurrences by key
 */
export const countBy = <T>(
  data: T[],
  key: keyof T
): Record<string, number> => {
  return data.reduce((acc, item) => {
    const groupKey = String(item[key]);
    acc[groupKey] = (acc[groupKey] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
};

/**
 * Sum values by key
 */
export const sumBy = <T>(
  data: T[],
  key: keyof T
): number => {
  return data.reduce((sum, item) => {
    const value = item[key];
    return sum + (typeof value === 'number' ? value : 0);
  }, 0);
};

/**
 * Average values by key
 */
export const averageBy = <T>(
  data: T[],
  key: keyof T
): number => {
  if (data.length === 0) return 0;
  return sumBy(data, key) / data.length;
};

/**
 * Find minimum value by key
 */
export const minBy = <T>(
  data: T[],
  key: keyof T
): T | undefined => {
  if (data.length === 0) return undefined;
  
  return data.reduce((min, item) => {
    const value = item[key];
    const minValue = min[key];
    
    if (typeof value === 'number' && typeof minValue === 'number') {
      return value < minValue ? item : min;
    }
    
    return min;
  });
};

/**
 * Find maximum value by key
 */
export const maxBy = <T>(
  data: T[],
  key: keyof T
): T | undefined => {
  if (data.length === 0) return undefined;
  
  return data.reduce((max, item) => {
    const value = item[key];
    const maxValue = max[key];
    
    if (typeof value === 'number' && typeof maxValue === 'number') {
      return value > maxValue ? item : max;
    }
    
    return max;
  });
};

/**
 * Group and sum by key
 */
export const groupAndSum = <T>(
  data: T[],
  groupKey: keyof T,
  sumKey: keyof T
): Record<string, number> => {
  const grouped = groupBy(data, groupKey);
  
  return Object.entries(grouped).reduce((acc, [key, items]) => {
    acc[key] = sumBy(items, sumKey);
    return acc;
  }, {} as Record<string, number>);
};

/**
 * Group and count by key
 */
export const groupAndCount = <T>(
  data: T[],
  groupKey: keyof T
): Record<string, number> => {
  return countBy(data, groupKey);
};

/**
 * Calculate median
 */
export const median = (values: number[]): number => {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  
  return sorted[middle];
};

/**
 * Calculate percentile
 */
export const percentile = (values: number[], p: number): number => {
  if (values.length === 0) return 0;
  if (p < 0 || p > 100) throw new Error('Percentile must be between 0 and 100');
  
  const sorted = [...values].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  
  if (lower === upper) return sorted[lower];
  
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
};

/**
 * Calculate standard deviation
 */
export const standardDeviation = (values: number[]): number => {
  if (values.length === 0) return 0;
  
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - avg, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  
  return Math.sqrt(variance);
};

/**
 * Aggregate data by time period
 */
export const aggregateByTimePeriod = <T extends { createdAt: string | Date }>(
  data: T[],
  period: 'day' | 'week' | 'month' | 'year',
  valueKey: keyof T
): Record<string, number> => {
  const grouped = data.reduce((acc, item) => {
    const date = new Date(item.createdAt);
    let key: string;
    
    switch (period) {
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
      case 'week':
        const week = getWeekNumber(date);
        key = `${date.getFullYear()}-W${week}`;
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'year':
        key = String(date.getFullYear());
        break;
    }
    
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    
    return acc;
  }, {} as Record<string, T[]>);
  
  return Object.entries(grouped).reduce((acc, [key, items]) => {
    acc[key] = sumBy(items, valueKey);
    return acc;
  }, {} as Record<string, number>);
};

/**
 * Helper function to get week number
 */
const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

/**
 * Calculate running total
 */
export const runningTotal = (values: number[]): number[] => {
  let total = 0;
  return values.map(value => {
    total += value;
    return total;
  });
};

/**
 * Calculate moving average
 */
export const movingAverage = (values: number[], window: number): number[] => {
  if (values.length < window) return values;
  
  const result: number[] = [];
  
  for (let i = 0; i <= values.length - window; i++) {
    const windowValues = values.slice(i, i + window);
    const avg = windowValues.reduce((sum, val) => sum + val, 0) / window;
    result.push(avg);
  }
  
  return result;
};

/**
 * Calculate growth rate between periods
 */
export const calculateGrowthRates = (values: number[]): number[] => {
  if (values.length < 2) return [];
  
  const rates: number[] = [];
  
  for (let i = 1; i < values.length; i++) {
    const previous = values[i - 1];
    const current = values[i];
    
    if (previous === 0) {
      rates.push(current > 0 ? 100 : 0);
    } else {
      rates.push(((current - previous) / previous) * 100);
    }
  }
  
  return rates;
};

/**
 * Pivot data
 */
export const pivot = <T>(
  data: T[],
  rowKey: keyof T,
  columnKey: keyof T,
  valueKey: keyof T
): Record<string, Record<string, any>> => {
  const result: Record<string, Record<string, any>> = {};
  
  data.forEach(item => {
    const row = String(item[rowKey]);
    const col = String(item[columnKey]);
    const value = item[valueKey];
    
    if (!result[row]) {
      result[row] = {};
    }
    
    result[row][col] = value;
  });
  
  return result;
};

/**
 * Calculate distribution
 */
export const calculateDistribution = <T>(
  data: T[],
  key: keyof T
): Array<{ label: string; value: number; percentage: number }> => {
  const counts = countBy(data, key);
  const total = data.length;
  
  return Object.entries(counts).map(([label, value]) => ({
    label,
    value,
    percentage: (value / total) * 100,
  }));
};