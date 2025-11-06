// apps/admin/src/lib/utils/percentageFormatter.ts

/**
 * Format number as percentage
 */
export const formatPercentage = (
  value: number,
  decimals: number = 1
): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Calculate percentage change between two values
 */
export const calculatePercentageChange = (
  current: number,
  previous: number
): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

/**
 * Format percentage change with + or - sign
 */
export const formatPercentageChange = (
  current: number,
  previous: number,
  decimals: number = 1
): string => {
  const change = calculatePercentageChange(current, previous);
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(decimals)}%`;
};

/**
 * Calculate percentage of total
 */
export const calculatePercentageOfTotal = (
  value: number,
  total: number
): number => {
  if (total === 0) return 0;
  return (value / total) * 100;
};

/**
 * Format percentage of total
 */
export const formatPercentageOfTotal = (
  value: number,
  total: number,
  decimals: number = 1
): string => {
  const percentage = calculatePercentageOfTotal(value, total);
  return formatPercentage(percentage, decimals);
};

/**
 * Calculate growth rate
 */
export const calculateGrowthRate = (
  values: number[]
): number => {
  if (values.length < 2) return 0;
  
  const first = values[0];
  const last = values[values.length - 1];
  
  return calculatePercentageChange(last, first);
};

/**
 * Format growth rate with trend indicator
 */
export const formatGrowthRate = (
  values: number[],
  decimals: number = 1
): string => {
  const rate = calculateGrowthRate(values);
  const trend = rate >= 0 ? '↑' : '↓';
  return `${trend} ${Math.abs(rate).toFixed(decimals)}%`;
};

/**
 * Calculate completion percentage
 */
export const calculateCompletionPercentage = (
  completed: number,
  total: number
): number => {
  if (total === 0) return 0;
  return Math.min((completed / total) * 100, 100);
};

/**
 * Format completion percentage with status
 */
export const formatCompletionStatus = (
  completed: number,
  total: number
): string => {
  const percentage = calculateCompletionPercentage(completed, total);
  return `${completed}/${total} (${percentage.toFixed(0)}%)`;
};

/**
 * Calculate average percentage
 */
export const calculateAveragePercentage = (
  percentages: number[]
): number => {
  if (percentages.length === 0) return 0;
  const sum = percentages.reduce((acc, val) => acc + val, 0);
  return sum / percentages.length;
};

/**
 * Format percentage range
 */
export const formatPercentageRange = (
  min: number,
  max: number,
  decimals: number = 1
): string => {
  return `${min.toFixed(decimals)}% - ${max.toFixed(decimals)}%`;
};

/**
 * Get percentage color based on thresholds
 */
export const getPercentageColor = (
  percentage: number,
  thresholds: { danger: number; warning: number; success: number }
): 'danger' | 'warning' | 'success' => {
  if (percentage < thresholds.danger) return 'danger';
  if (percentage < thresholds.warning) return 'warning';
  return 'success';
};

/**
 * Format percentage with trend comparison
 */
export const formatPercentageWithTrend = (
  current: number,
  previous: number,
  decimals: number = 1
): { value: string; change: string; trend: 'up' | 'down' | 'neutral' } => {
  const change = calculatePercentageChange(current, previous);
  const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
  
  return {
    value: formatPercentage(current, decimals),
    change: formatPercentage(Math.abs(change), decimals),
    trend,
  };
};

/**
 * Calculate weighted percentage
 */
export const calculateWeightedPercentage = (
  values: number[],
  weights: number[]
): number => {
  if (values.length !== weights.length || values.length === 0) return 0;
  
  const weightedSum = values.reduce((acc, val, idx) => {
    return acc + (val * weights[idx]);
  }, 0);
  
  const totalWeight = weights.reduce((acc, weight) => acc + weight, 0);
  
  return totalWeight === 0 ? 0 : weightedSum / totalWeight;
};

/**
 * Format percentage distribution
 */
export const formatPercentageDistribution = (
  values: Record<string, number>,
  decimals: number = 1
): Record<string, string> => {
  const total = Object.values(values).reduce((acc, val) => acc + val, 0);
  
  const distribution: Record<string, string> = {};
  
  Object.entries(values).forEach(([key, value]) => {
    const percentage = calculatePercentageOfTotal(value, total);
    distribution[key] = formatPercentage(percentage, decimals);
  });
  
  return distribution;
};