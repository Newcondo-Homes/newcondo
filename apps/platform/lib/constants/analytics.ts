// apps/platform/lib/constants/analytics.ts

/**
 * Analytics Constants
 * Constants for property analytics and performance tracking
 */

// Chart types
export const CHART_TYPES = {
  LINE: 'line',
  BAR: 'bar',
  PIE: 'pie',
  AREA: 'area',
  DONUT: 'donut',
} as const;

export type ChartType = typeof CHART_TYPES[keyof typeof CHART_TYPES];

// Metric types
export const METRIC_TYPES = {
  VIEWS: 'views',
  UNIQUE_VIEWERS: 'unique_viewers',
  FAVORITES: 'favorites',
  SHARES: 'shares',
  INQUIRIES: 'inquiries',
  APPLICATIONS: 'applications',
  CONVERSION_RATE: 'conversion_rate',
  EARNINGS: 'earnings',
  REFERRALS: 'referrals',
} as const;

export type MetricType = typeof METRIC_TYPES[keyof typeof METRIC_TYPES];

// Metric labels
export const METRIC_LABELS: Record<MetricType, string> = {
  [METRIC_TYPES.VIEWS]: 'Total Views',
  [METRIC_TYPES.UNIQUE_VIEWERS]: 'Unique Viewers',
  [METRIC_TYPES.FAVORITES]: 'Favorites',
  [METRIC_TYPES.SHARES]: 'Shares',
  [METRIC_TYPES.INQUIRIES]: 'Inquiries',
  [METRIC_TYPES.APPLICATIONS]: 'Applications',
  [METRIC_TYPES.CONVERSION_RATE]: 'Conversion Rate',
  [METRIC_TYPES.EARNINGS]: 'Total Earnings',
  [METRIC_TYPES.REFERRALS]: 'Referrals',
};

// Metric descriptions
export const METRIC_DESCRIPTIONS: Record<MetricType, string> = {
  [METRIC_TYPES.VIEWS]: 'Total number of times your property was viewed',
  [METRIC_TYPES.UNIQUE_VIEWERS]: 'Number of unique users who viewed your property',
  [METRIC_TYPES.FAVORITES]: 'Number of times your property was added to favorites',
  [METRIC_TYPES.SHARES]: 'Number of times your property was shared',
  [METRIC_TYPES.INQUIRIES]: 'Number of inquiries received about your property',
  [METRIC_TYPES.APPLICATIONS]: 'Number of rental applications received',
  [METRIC_TYPES.CONVERSION_RATE]: 'Percentage of viewers who applied to rent',
  [METRIC_TYPES.EARNINGS]: 'Total earnings from this property',
  [METRIC_TYPES.REFERRALS]: 'Number of successful referrals',
};

// Metric icons (lucide-react icon names)
export const METRIC_ICONS: Record<MetricType, string> = {
  [METRIC_TYPES.VIEWS]: 'Eye',
  [METRIC_TYPES.UNIQUE_VIEWERS]: 'Users',
  [METRIC_TYPES.FAVORITES]: 'Heart',
  [METRIC_TYPES.SHARES]: 'Share2',
  [METRIC_TYPES.INQUIRIES]: 'MessageSquare',
  [METRIC_TYPES.APPLICATIONS]: 'FileText',
  [METRIC_TYPES.CONVERSION_RATE]: 'TrendingUp',
  [METRIC_TYPES.EARNINGS]: 'DollarSign',
  [METRIC_TYPES.REFERRALS]: 'UserPlus',
};

// Metric colors
export const METRIC_COLORS: Record<MetricType, string> = {
  [METRIC_TYPES.VIEWS]: '#3b82f6', // blue
  [METRIC_TYPES.UNIQUE_VIEWERS]: '#8b5cf6', // purple
  [METRIC_TYPES.FAVORITES]: '#ef4444', // red
  [METRIC_TYPES.SHARES]: '#10b981', // green
  [METRIC_TYPES.INQUIRIES]: '#f59e0b', // amber
  [METRIC_TYPES.APPLICATIONS]: '#06b6d4', // cyan
  [METRIC_TYPES.CONVERSION_RATE]: '#ec4899', // pink
  [METRIC_TYPES.EARNINGS]: '#22c55e', // green
  [METRIC_TYPES.REFERRALS]: '#6366f1', // indigo
};

// Time aggregation options
export const TIME_AGGREGATION = {
  HOURLY: 'hourly',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
} as const;

export type TimeAggregation = typeof TIME_AGGREGATION[keyof typeof TIME_AGGREGATION];

// Time aggregation labels
export const TIME_AGGREGATION_LABELS: Record<TimeAggregation, string> = {
  [TIME_AGGREGATION.HOURLY]: 'Hourly',
  [TIME_AGGREGATION.DAILY]: 'Daily',
  [TIME_AGGREGATION.WEEKLY]: 'Weekly',
  [TIME_AGGREGATION.MONTHLY]: 'Monthly',
};

// Comparison periods
export const COMPARISON_PERIODS = {
  PREVIOUS_PERIOD: 'previous_period',
  PREVIOUS_YEAR: 'previous_year',
  NO_COMPARISON: 'no_comparison',
} as const;

export type ComparisonPeriod = typeof COMPARISON_PERIODS[keyof typeof COMPARISON_PERIODS];

// Comparison labels
export const COMPARISON_LABELS: Record<ComparisonPeriod, string> = {
  [COMPARISON_PERIODS.PREVIOUS_PERIOD]: 'vs Previous Period',
  [COMPARISON_PERIODS.PREVIOUS_YEAR]: 'vs Previous Year',
  [COMPARISON_PERIODS.NO_COMPARISON]: 'No Comparison',
};

// Performance indicators
export const PERFORMANCE_INDICATOR = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  AVERAGE: 'average',
  POOR: 'poor',
} as const;

export type PerformanceIndicator = typeof PERFORMANCE_INDICATOR[keyof typeof PERFORMANCE_INDICATOR];

// Performance indicator colors
export const PERFORMANCE_INDICATOR_COLORS: Record<PerformanceIndicator, string> = {
  [PERFORMANCE_INDICATOR.EXCELLENT]: 'text-green-600 bg-green-50',
  [PERFORMANCE_INDICATOR.GOOD]: 'text-blue-600 bg-blue-50',
  [PERFORMANCE_INDICATOR.AVERAGE]: 'text-yellow-600 bg-yellow-50',
  [PERFORMANCE_INDICATOR.POOR]: 'text-red-600 bg-red-50',
};

// Performance indicator labels
export const PERFORMANCE_INDICATOR_LABELS: Record<PerformanceIndicator, string> = {
  [PERFORMANCE_INDICATOR.EXCELLENT]: 'Excellent',
  [PERFORMANCE_INDICATOR.GOOD]: 'Good',
  [PERFORMANCE_INDICATOR.AVERAGE]: 'Average',
  [PERFORMANCE_INDICATOR.POOR]: 'Needs Improvement',
};

// Analytics export formats
export const EXPORT_FORMATS = {
  CSV: 'csv',
  PDF: 'pdf',
  EXCEL: 'excel',
  JSON: 'json',
} as const;

export type ExportFormat = typeof EXPORT_FORMATS[keyof typeof EXPORT_FORMATS];

// Export format labels
export const EXPORT_FORMAT_LABELS: Record<ExportFormat, string> = {
  [EXPORT_FORMATS.CSV]: 'CSV',
  [EXPORT_FORMATS.PDF]: 'PDF',
  [EXPORT_FORMATS.EXCEL]: 'Excel',
  [EXPORT_FORMATS.JSON]: 'JSON',
};

// Dashboard widgets
export const DASHBOARD_WIDGETS = {
  OVERVIEW_STATS: 'overview_stats',
  VIEWS_CHART: 'views_chart',
  EARNINGS_CHART: 'earnings_chart',
  CONVERSION_FUNNEL: 'conversion_funnel',
  TOP_PROPERTIES: 'top_properties',
  RECENT_ACTIVITY: 'recent_activity',
  REFERRAL_STATS: 'referral_stats',
  GEOGRAPHIC_DISTRIBUTION: 'geographic_distribution',
} as const;

export type DashboardWidget = typeof DASHBOARD_WIDGETS[keyof typeof DASHBOARD_WIDGETS];

// Widget titles
export const WIDGET_TITLES: Record<DashboardWidget, string> = {
  [DASHBOARD_WIDGETS.OVERVIEW_STATS]: 'Overview Statistics',
  [DASHBOARD_WIDGETS.VIEWS_CHART]: 'Property Views Over Time',
  [DASHBOARD_WIDGETS.EARNINGS_CHART]: 'Earnings Over Time',
  [DASHBOARD_WIDGETS.CONVERSION_FUNNEL]: 'Conversion Funnel',
  [DASHBOARD_WIDGETS.TOP_PROPERTIES]: 'Top Performing Properties',
  [DASHBOARD_WIDGETS.RECENT_ACTIVITY]: 'Recent Activity',
  [DASHBOARD_WIDGETS.REFERRAL_STATS]: 'Referral Statistics',
  [DASHBOARD_WIDGETS.GEOGRAPHIC_DISTRIBUTION]: 'Geographic Distribution',
};

// Event types for analytics tracking
export const EVENT_TYPES = {
  PROPERTY_VIEW: 'PROPERTY_VIEW',
  PROPERTY_FAVORITE: 'PROPERTY_FAVORITE',
  PROPERTY_SHARE: 'PROPERTY_SHARE',
  PROPERTY_INQUIRY: 'PROPERTY_INQUIRY',
  PROPERTY_APPLICATION: 'PROPERTY_APPLICATION',
  PAYMENT_INITIATED: 'PAYMENT_INITIATED',
  PAYMENT_COMPLETED: 'PAYMENT_COMPLETED',
  REFERRAL_CLICK: 'REFERRAL_CLICK',
  REFERRAL_SIGNUP: 'REFERRAL_SIGNUP',
} as const;

export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES];

// Conversion funnel stages
export const FUNNEL_STAGES = {
  VIEW: 'view',
  FAVORITE: 'favorite',
  INQUIRY: 'inquiry',
  APPLICATION: 'application',
  PAYMENT: 'payment',
} as const;

export type FunnelStage = typeof FUNNEL_STAGES[keyof typeof FUNNEL_STAGES];

// Funnel stage labels
export const FUNNEL_STAGE_LABELS: Record<FunnelStage, string> = {
  [FUNNEL_STAGES.VIEW]: 'Viewed',
  [FUNNEL_STAGES.FAVORITE]: 'Favorited',
  [FUNNEL_STAGES.INQUIRY]: 'Inquired',
  [FUNNEL_STAGES.APPLICATION]: 'Applied',
  [FUNNEL_STAGES.PAYMENT]: 'Paid',
};

// Helper function to calculate conversion rate
export const calculateConversionRate = (conversions: number, total: number): number => {
  if (total === 0) return 0;
  return (conversions / total) * 100;
};

// Helper function to calculate percentage change
export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

// Helper function to determine performance indicator
export const determinePerformanceIndicator = (
  conversionRate: number
): PerformanceIndicator => {
  if (conversionRate >= 10) return PERFORMANCE_INDICATOR.EXCELLENT;
  if (conversionRate >= 5) return PERFORMANCE_INDICATOR.GOOD;
  if (conversionRate >= 2) return PERFORMANCE_INDICATOR.AVERAGE;
  return PERFORMANCE_INDICATOR.POOR;
};

// Default chart colors palette
export const CHART_COLOR_PALETTE = [
  '#3b82f6', '#8b5cf6', '#ef4444', '#10b981', '#f59e0b',
  '#06b6d4', '#ec4899', '#6366f1', '#14b8a6', '#f97316',
];

// Export all constants
export default {
  CHART_TYPES,
  METRIC_TYPES,
  METRIC_LABELS,
  METRIC_DESCRIPTIONS,
  METRIC_ICONS,
  METRIC_COLORS,
  TIME_AGGREGATION,
  TIME_AGGREGATION_LABELS,
  COMPARISON_PERIODS,
  COMPARISON_LABELS,
  PERFORMANCE_INDICATOR,
  PERFORMANCE_INDICATOR_COLORS,
  PERFORMANCE_INDICATOR_LABELS,
  EXPORT_FORMATS,
  EXPORT_FORMAT_LABELS,
  DASHBOARD_WIDGETS,
  WIDGET_TITLES,
  EVENT_TYPES,
  FUNNEL_STAGES,
  FUNNEL_STAGE_LABELS,
  calculateConversionRate,
  calculatePercentageChange,
  determinePerformanceIndicator,
  CHART_COLOR_PALETTE,
};