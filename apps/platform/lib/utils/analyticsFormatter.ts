/**
 * Analytics Formatter Utility
 * Formats analytics data for display and reporting
 */

export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

export interface PropertyAnalytics {
  views: number;
  uniqueViews: number;
  favorites: number;
  inquiries: number;
  applications: number;
  conversions: number;
  conversionRate: number;
  averageTimeOnPage: number;
  bounceRate: number;
}

export interface AgentPerformanceMetrics {
  totalReferrals: number;
  successfulConversions: number;
  conversionRate: number;
  totalEarnings: number;
  pendingEarnings: number;
  averageCommissionPerDeal: number;
  topPerformingProperties: Array<{
    propertyId: string;
    title: string;
    conversions: number;
    earnings: number;
  }>;
}

export interface ComparisonMetrics {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'neutral';
}

/**
 * Format time series data for charts
 */
export function formatTimeSeriesData(
  data: Array<{ date: Date; value: number }>,
  groupBy: 'day' | 'week' | 'month' = 'day'
): TimeSeriesData[] {
  const grouped = new Map<string, number>();
  
  data.forEach(({ date, value }) => {
    const key = formatDateKey(date, groupBy);
    grouped.set(key, (grouped.get(key) || 0) + value);
  });
  
  return Array.from(grouped.entries())
    .map(([date, value]) => ({
      date,
      value,
      label: formatDateLabel(date, groupBy),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Format date key for grouping
 */
function formatDateKey(date: Date, groupBy: 'day' | 'week' | 'month'): string {
  const d = new Date(date);
  
  switch (groupBy) {
    case 'day':
      return d.toISOString().split('T')[0];
    case 'week':
      const week = getWeekNumber(d);
      return `${d.getFullYear()}-W${week.toString().padStart(2, '0')}`;
    case 'month':
      return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    default:
      return d.toISOString().split('T')[0];
  }
}

/**
 * Format date label for display
 */
function formatDateLabel(dateKey: string, groupBy: 'day' | 'week' | 'month'): string {
  switch (groupBy) {
    case 'day':
      return new Date(dateKey).toLocaleDateString('en-NG', {
        month: 'short',
        day: 'numeric',
      });
    case 'week':
      const [year, week] = dateKey.split('-W');
      return `Week ${week}, ${year}`;
    case 'month':
      const [y, m] = dateKey.split('-');
      return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('en-NG', {
        month: 'short',
        year: 'numeric',
      });
    default:
      return dateKey;
  }
}

/**
 * Get ISO week number
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Calculate comparison metrics
 */
export function calculateComparison(
  current: number,
  previous: number
): ComparisonMetrics {
  const change = current - previous;
  const changePercent = previous === 0 
    ? (current > 0 ? 100 : 0) 
    : (change / previous) * 100;
  
  const trend: 'up' | 'down' | 'neutral' = 
    change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
  
  return {
    current,
    previous,
    change,
    changePercent,
    trend,
  };
}

/**
 * Calculate conversion rate
 */
export function calculateConversionRate(
  conversions: number,
  totalViews: number
): number {
  if (totalViews === 0) return 0;
  return (conversions / totalViews) * 100;
}

/**
 * Format analytics summary
 */
export function formatAnalyticsSummary(data: PropertyAnalytics): {
  metrics: Array<{
    label: string;
    value: string | number;
    change?: ComparisonMetrics;
  }>;
  insights: string[];
} {
  const metrics = [
    {
      label: 'Total Views',
      value: formatNumber(data.views),
    },
    {
      label: 'Unique Visitors',
      value: formatNumber(data.uniqueViews),
    },
    {
      label: 'Favorites',
      value: formatNumber(data.favorites),
    },
    {
      label: 'Conversion Rate',
      value: `${data.conversionRate.toFixed(2)}%`,
    },
    {
      label: 'Avg. Time on Page',
      value: formatDuration(data.averageTimeOnPage),
    },
  ];
  
  const insights = generateInsights(data);
  
  return { metrics, insights };
}

/**
 * Generate insights from analytics data
 */
function generateInsights(data: PropertyAnalytics): string[] {
  const insights: string[] = [];
  
  // Conversion rate insights
  if (data.conversionRate > 5) {
    insights.push('🎉 Excellent conversion rate! Your property is performing very well.');
  } else if (data.conversionRate < 1 && data.views > 50) {
    insights.push('💡 Low conversion rate. Consider updating photos or description.');
  }
  
  // Engagement insights
  if (data.averageTimeOnPage < 30 && data.views > 20) {
    insights.push('⚠️ Visitors are leaving quickly. Try adding more detailed information.');
  } else if (data.averageTimeOnPage > 120) {
    insights.push('✨ Great engagement! Visitors are spending time reviewing your property.');
  }
  
  // Favorites insights
  const favoriteRate = data.views > 0 ? (data.favorites / data.views) * 100 : 0;
  if (favoriteRate > 10) {
    insights.push('❤️ High favorite rate indicates strong interest in your property.');
  }
  
  // Bounce rate insights
  if (data.bounceRate > 70) {
    insights.push('📉 High bounce rate. Consider improving your property listing quality.');
  }
  
  return insights;
}

/**
 * Format large numbers with abbreviations
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * Format duration in seconds to readable string
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Calculate growth rate
 */
export function calculateGrowthRate(
  current: number,
  previous: number,
  periods: number = 1
): number {
  if (previous === 0) return 0;
  const rate = Math.pow(current / previous, 1 / periods) - 1;
  return rate * 100;
}

/**
 * Format agent performance data
 */
export function formatAgentPerformance(
  data: AgentPerformanceMetrics
): {
  summary: Array<{ label: string; value: string }>;
  performanceScore: number;
  ranking: 'excellent' | 'good' | 'average' | 'needs_improvement';
} {
  const summary = [
    {
      label: 'Total Referrals',
      value: formatNumber(data.totalReferrals),
    },
    {
      label: 'Conversions',
      value: `${data.successfulConversions} (${data.conversionRate.toFixed(1)}%)`,
    },
    {
      label: 'Total Earnings',
      value: new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
      }).format(data.totalEarnings),
    },
    {
      label: 'Avg. Commission',
      value: new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
      }).format(data.averageCommissionPerDeal),
    },
  ];
  
  // Calculate performance score (0-100)
  const performanceScore = calculatePerformanceScore(data);
  
  // Determine ranking
  let ranking: 'excellent' | 'good' | 'average' | 'needs_improvement';
  if (performanceScore >= 80) ranking = 'excellent';
  else if (performanceScore >= 60) ranking = 'good';
  else if (performanceScore >= 40) ranking = 'average';
  else ranking = 'needs_improvement';
  
  return { summary, performanceScore, ranking };
}

/**
 * Calculate performance score
 */
function calculatePerformanceScore(data: AgentPerformanceMetrics): number {
  let score = 0;
  
  // Conversion rate (0-40 points)
  score += Math.min(data.conversionRate * 4, 40);
  
  // Total referrals (0-30 points)
  score += Math.min(data.totalReferrals / 10, 30);
  
  // Earnings (0-30 points)
  score += Math.min(data.totalEarnings / 100000, 30);
  
  return Math.round(score);
}

/**
 * Aggregate data by period
 */
export function aggregateByPeriod<T extends { createdAt: Date }>(
  data: T[],
  groupBy: 'day' | 'week' | 'month',
  valueExtractor: (item: T) => number
): TimeSeriesData[] {
  const aggregated = data.map(item => ({
    date: item.createdAt,
    value: valueExtractor(item),
  }));
  
  return formatTimeSeriesData(aggregated, groupBy);
}

/**
 * Calculate percentile
 */
export function calculatePercentile(
  value: number,
  dataset: number[],
  percentile: number
): { isAbove: boolean; percentileValue: number } {
  const sorted = [...dataset].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  const percentileValue = sorted[index] || 0;
  
  return {
    isAbove: value >= percentileValue,
    percentileValue,
  };
}

/**
 * Format percentage change
 */
export function formatPercentageChange(change: number): string {
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
}

/**
 * Export analytics to CSV format
 */
export function formatAnalyticsForExport(
  data: TimeSeriesData[]
): { headers: string[]; rows: string[][] } {
  const headers = ['Date', 'Value', 'Label'];
  const rows = data.map(item => [
    item.date,
    item.value.toString(),
    item.label || '',
  ]);
  
  return { headers, rows };
}