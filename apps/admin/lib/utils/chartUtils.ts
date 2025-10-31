// apps/admin/src/lib/utils/chartUtils.ts

import { CHART_COLORS } from '../constants';

/**
 * Chart data manipulation and formatting utilities
 */

/**
 * Generate chart colors array
 */
export const generateChartColors = (count: number): string[] => {
  const baseColors = Object.values(CHART_COLORS);
  const colors: string[] = [];

  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }

  return colors;
};

/**
 * Format data for line/bar charts
 */
export const formatTimeSeriesData = (
  data: Array<{ date: Date | string; value: number }>,
  label: string
): {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
  }>;
} => {
  const labels = data.map(item => {
    const date = typeof item.date === 'string' ? new Date(item.date) : item.date;
    return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
  });

  return {
    labels,
    datasets: [
      {
        label,
        data: data.map(item => item.value),
        borderColor: CHART_COLORS.primary,
        backgroundColor: `${CHART_COLORS.primary}20`,
      },
    ],
  };
};

/**
 * Format data for pie/doughnut charts
 */
export const formatPieChartData = (
  data: Array<{ label: string; value: number }>,
  options?: { colors?: string[] }
): {
  labels: string[];
  datasets: Array<{
    data: number[];
    backgroundColor: string[];
    borderWidth: number;
  }>;
} => {
  const colors = options?.colors || generateChartColors(data.length);

  return {
    labels: data.map(item => item.label),
    datasets: [
      {
        data: data.map(item => item.value),
        backgroundColor: colors,
        borderWidth: 2,
      },
    ],
  };
};

/**
 * Calculate percentage distribution for pie charts
 */
export const calculatePercentageDistribution = (
  data: Array<{ label: string; value: number }>
): Array<{ label: string; value: number; percentage: number }> => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return data.map(item => ({
    ...item,
    percentage: total > 0 ? (item.value / total) * 100 : 0,
  }));
};

/**
 * Format data for multi-line charts
 */
export const formatMultiLineChartData = (
  data: Array<{
    date: Date | string;
    values: Record<string, number>;
  }>,
  series: string[]
): {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
  }>;
} => {
  const colors = generateChartColors(series.length);
  const labels = data.map(item => {
    const date = typeof item.date === 'string' ? new Date(item.date) : item.date;
    return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
  });

  const datasets = series.map((seriesName, index) => ({
    label: seriesName,
    data: data.map(item => item.values[seriesName] || 0),
    borderColor: colors[index],
    backgroundColor: `${colors[index]}20`,
  }));

  return {
    labels,
    datasets,
  };
};

/**
 * Format data for stacked bar charts
 */
export const formatStackedBarChartData = (
  data: Array<{
    category: string;
    values: Record<string, number>;
  }>,
  series: string[]
): {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor: string;
  }>;
} => {
  const colors = generateChartColors(series.length);

  return {
    labels: data.map(item => item.category),
    datasets: series.map((seriesName, index) => ({
      label: seriesName,
      data: data.map(item => item.values[seriesName] || 0),
      backgroundColor: colors[index],
    })),
  };
};

/**
 * Calculate trend (increasing, decreasing, stable)
 */
export const calculateTrend = (
  data: number[]
): 'increasing' | 'decreasing' | 'stable' => {
  if (data.length < 2) return 'stable';

  const first = data[0];
  const last = data[data.length - 1];
  const diff = last - first;
  const threshold = Math.abs(first * 0.05); // 5% threshold

  if (Math.abs(diff) < threshold) return 'stable';
  return diff > 0 ? 'increasing' : 'decreasing';
};

/**
 * Calculate moving average
 */
export const calculateMovingAverage = (
  data: number[],
  window: number = 7
): number[] => {
  const result: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) {
      result.push(data[i]);
    } else {
      const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / window);
    }
  }

  return result;
};

/**
 * Fill missing dates in time series data
 */
export const fillMissingDates = (
  data: Array<{ date: Date; value: number }>,
  startDate: Date,
  endDate: Date
): Array<{ date: Date; value: number }> => {
  const filled: Array<{ date: Date; value: number }> = [];
  const dataMap = new Map(data.map(item => [item.date.toDateString(), item.value]));

  const current = new Date(startDate);
  while (current <= endDate) {
    const dateStr = current.toDateString();
    filled.push({
      date: new Date(current),
      value: dataMap.get(dateStr) || 0,
    });
    current.setDate(current.getDate() + 1);
  }

  return filled;
};

/**
 * Group data by time period (day, week, month)
 */
export const groupByTimePeriod = (
  data: Array<{ date: Date | string; value: number }>,
  period: 'day' | 'week' | 'month'
): Array<{ date: Date; value: number }> => {
  const grouped = new Map<string, number>();

  data.forEach(item => {
    const date = typeof item.date === 'string' ? new Date(item.date) : item.date;
    let key: string;

    switch (period) {
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
    }

    grouped.set(key, (grouped.get(key) || 0) + item.value);
  });

  return Array.from(grouped.entries()).map(([dateStr, value]) => ({
    date: new Date(dateStr),
    value,
  }));
};

/**
 * Calculate growth rate
 */
export const calculateGrowthRate = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

/**
 * Format chart tooltip
 */
export const formatChartTooltip = (
  value: number,
  format: 'number' | 'currency' | 'percentage' = 'number'
): string => {
  switch (format) {
    case 'currency':
      return `₦${value.toLocaleString('en-NG')}`;
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'number':
    default:
      return value.toLocaleString('en-NG');
  }
};

/**
 * Get chart options for line chart
 */
export const getLineChartOptions = (options?: {
  title?: string;
  yAxisLabel?: string;
  showLegend?: boolean;
}): any => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: options?.showLegend ?? true,
        position: 'top' as const,
      },
      title: {
        display: !!options?.title,
        text: options?.title,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: !!options?.yAxisLabel,
          text: options?.yAxisLabel,
        },
      },
    },
  };
};

/**
 * Get chart options for pie chart
 */
export const getPieChartOptions = (options?: {
  title?: string;
  showPercentage?: boolean;
}): any => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right' as const,
      },
      title: {
        display: !!options?.title,
        text: options?.title,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return options?.showPercentage
              ? `${label}: ${value} (${percentage}%)`
              : `${label}: ${value}`;
          },
        },
      },
    },
  };
};

/**
 * Get chart options for bar chart
 */
export const getBarChartOptions = (options?: {
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  stacked?: boolean;
}): any => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      title: {
        display: !!options?.title,
        text: options?.title,
      },
    },
    scales: {
      x: {
        stacked: options?.stacked ?? false,
        title: {
          display: !!options?.xAxisLabel,
          text: options?.xAxisLabel,
        },
      },
      y: {
        stacked: options?.stacked ?? false,
        beginAtZero: true,
        title: {
          display: !!options?.yAxisLabel,
          text: options?.yAxisLabel,
        },
      },
    },
  };
};

/**
 * Prepare data for comparison charts (current vs previous period)
 */
export const prepareComparisonData = (
  current: Array<{ date: Date; value: number }>,
  previous: Array<{ date: Date; value: number }>
): {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
  }>;
} => {
  const labels = current.map(item =>
    item.date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
  );

  return {
    labels,
    datasets: [
      {
        label: 'Current Period',
        data: current.map(item => item.value),
        borderColor: CHART_COLORS.primary,
        backgroundColor: `${CHART_COLORS.primary}20`,
      },
      {
        label: 'Previous Period',
        data: previous.map(item => item.value),
        borderColor: CHART_COLORS.gray,
        backgroundColor: `${CHART_COLORS.gray}20`,
      },
    ],
  };
};