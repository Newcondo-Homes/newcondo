/**
 * Analytics Constants
 * Constants for analytics tracking, metrics, and reporting
 * Location: backend/shared/src/constants/analytics.ts
 */

// Time Periods
export const TIME_PERIODS = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  LAST_7_DAYS: 'last_7_days',
  LAST_30_DAYS: 'last_30_days',
  LAST_90_DAYS: 'last_90_days',
  THIS_MONTH: 'this_month',
  LAST_MONTH: 'last_month',
  THIS_QUARTER: 'this_quarter',
  LAST_QUARTER: 'last_quarter',
  THIS_YEAR: 'this_year',
  LAST_YEAR: 'last_year',
  ALL_TIME: 'all_time',
  CUSTOM: 'custom',
} as const;

export type TimePeriod = (typeof TIME_PERIODS)[keyof typeof TIME_PERIODS];

// Metric Categories
export const METRIC_CATEGORIES = {
  USER: 'user',
  PROPERTY: 'property',
  PAYMENT: 'payment',
  BOOKING: 'booking',
  AGENT: 'agent',
  MARKING: 'marking',
  REVENUE: 'revenue',
  ENGAGEMENT: 'engagement',
  CONVERSION: 'conversion',
  REFERRAL: 'referral',
} as const;

export type MetricCategory = (typeof METRIC_CATEGORIES)[keyof typeof METRIC_CATEGORIES];

// Aggregation Types
export const AGGREGATION_TYPES = {
  SUM: 'sum',
  AVERAGE: 'average',
  COUNT: 'count',
  MIN: 'min',
  MAX: 'max',
  MEDIAN: 'median',
  PERCENTILE: 'percentile',
} as const;

export type AggregationType =
  (typeof AGGREGATION_TYPES)[keyof typeof AGGREGATION_TYPES];

// Chart Types
export const CHART_TYPES = {
  LINE: 'line',
  BAR: 'bar',
  PIE: 'pie',
  DONUT: 'donut',
  AREA: 'area',
  SCATTER: 'scatter',
  HEATMAP: 'heatmap',
  FUNNEL: 'funnel',
  GAUGE: 'gauge',
} as const;

export type ChartType = (typeof CHART_TYPES)[keyof typeof CHART_TYPES];

// User Metrics
export const USER_METRICS = {
  TOTAL_USERS: 'total_users',
  NEW_USERS: 'new_users',
  ACTIVE_USERS: 'active_users',
  VERIFIED_USERS: 'verified_users',
  PREMIUM_USERS: 'premium_users',
  USER_GROWTH_RATE: 'user_growth_rate',
  USER_RETENTION_RATE: 'user_retention_rate',
  USER_CHURN_RATE: 'user_churn_rate',
  USERS_BY_ROLE: 'users_by_role',
  USERS_BY_TYPE: 'users_by_type',
  USERS_BY_LOCATION: 'users_by_location',
  AVERAGE_SESSION_DURATION: 'average_session_duration',
} as const;

// Property Metrics
export const PROPERTY_METRICS = {
  TOTAL_PROPERTIES: 'total_properties',
  NEW_LISTINGS: 'new_listings',
  ACTIVE_LISTINGS: 'active_listings',
  RENTED_PROPERTIES: 'rented_properties',
  AVAILABLE_PROPERTIES: 'available_properties',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED_PROPERTIES: 'approved_properties',
  REJECTED_PROPERTIES: 'rejected_properties',
  PROPERTIES_BY_TYPE: 'properties_by_type',
  PROPERTIES_BY_LOCATION: 'properties_by_location',
  PROPERTIES_BY_PRICE_RANGE: 'properties_by_price_range',
  AVERAGE_PROPERTY_PRICE: 'average_property_price',
  PROPERTY_VIEW_COUNT: 'property_view_count',
  PROPERTY_FAVORITE_COUNT: 'property_favorite_count',
  LISTING_CONVERSION_RATE: 'listing_conversion_rate',
  TIME_TO_RENT: 'time_to_rent',
} as const;

// Payment Metrics
export const PAYMENT_METRICS = {
  TOTAL_REVENUE: 'total_revenue',
  GROSS_REVENUE: 'gross_revenue',
  NET_REVENUE: 'net_revenue',
  TOTAL_TRANSACTIONS: 'total_transactions',
  SUCCESSFUL_PAYMENTS: 'successful_payments',
  FAILED_PAYMENTS: 'failed_payments',
  PENDING_PAYMENTS: 'pending_payments',
  REFUNDED_PAYMENTS: 'refunded_payments',
  AVERAGE_TRANSACTION_VALUE: 'average_transaction_value',
  PAYMENT_SUCCESS_RATE: 'payment_success_rate',
  REVENUE_BY_PAYMENT_TYPE: 'revenue_by_payment_type',
  COMMISSION_EARNED: 'commission_earned',
  AGENT_COMMISSION: 'agent_commission',
  PLATFORM_FEES: 'platform_fees',
  REVENUE_GROWTH_RATE: 'revenue_growth_rate',
} as const;

// Agent Metrics
export const AGENT_METRICS = {
  TOTAL_AGENTS: 'total_agents',
  ACTIVE_AGENTS: 'active_agents',
  LISTING_AGENTS: 'listing_agents',
  SUB_AGENTS: 'sub_agents',
  TOP_PERFORMING_AGENTS: 'top_performing_agents',
  AGENT_LISTINGS_COUNT: 'agent_listings_count',
  AGENT_RENTAL_COUNT: 'agent_rental_count',
  AGENT_COMMISSION_EARNED: 'agent_commission_earned',
  AGENT_CONVERSION_RATE: 'agent_conversion_rate',
  AGENT_RELIABILITY_SCORE: 'agent_reliability_score',
} as const;

// Marking Service Metrics
export const MARKING_METRICS = {
  TOTAL_MARKING_JOBS: 'total_marking_jobs',
  PENDING_MARKING_JOBS: 'pending_marking_jobs',
  ASSIGNED_MARKING_JOBS: 'assigned_marking_jobs',
  COMPLETED_MARKING_JOBS: 'completed_marking_jobs',
  CANCELLED_MARKING_JOBS: 'cancelled_marking_jobs',
  MARKING_COMPLETION_RATE: 'marking_completion_rate',
  AVERAGE_COMPLETION_TIME: 'average_completion_time',
  MARKING_REVENUE: 'marking_revenue',
  AGENTS_AVAILABLE_FOR_MARKING: 'agents_available_for_marking',
} as const;

// Engagement Metrics
export const ENGAGEMENT_METRICS = {
  TOTAL_PAGE_VIEWS: 'total_page_views',
  UNIQUE_VISITORS: 'unique_visitors',
  BOUNCE_RATE: 'bounce_rate',
  AVERAGE_TIME_ON_SITE: 'average_time_on_site',
  PROPERTY_SEARCHES: 'property_searches',
  PROPERTY_VIEWS: 'property_views',
  PROPERTY_SHARES: 'property_shares',
  PROPERTY_FAVORITES: 'property_favorites',
  CLICK_THROUGH_RATE: 'click_through_rate',
} as const;

// Conversion Metrics
export const CONVERSION_METRICS = {
  SIGNUP_CONVERSION_RATE: 'signup_conversion_rate',
  VERIFICATION_COMPLETION_RATE: 'verification_completion_rate',
  LISTING_TO_RENTAL_RATE: 'listing_to_rental_rate',
  VIEW_TO_INQUIRY_RATE: 'view_to_inquiry_rate',
  INQUIRY_TO_BOOKING_RATE: 'inquiry_to_booking_rate',
  PAYMENT_COMPLETION_RATE: 'payment_completion_rate',
} as const;

// Referral Metrics
export const REFERRAL_METRICS = {
  TOTAL_REFERRALS: 'total_referrals',
  SUCCESSFUL_REFERRALS: 'successful_referrals',
  REFERRAL_CONVERSION_RATE: 'referral_conversion_rate',
  REFERRAL_REVENUE: 'referral_revenue',
  TOP_REFERRERS: 'top_referrers',
} as const;

// Data Granularity
export const DATA_GRANULARITY = {
  HOURLY: 'hourly',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly',
} as const;

export type DataGranularity =
  (typeof DATA_GRANULARITY)[keyof typeof DATA_GRANULARITY];

// Trend Indicators
export const TREND_INDICATORS = {
  INCREASING: 'increasing',
  DECREASING: 'decreasing',
  STABLE: 'stable',
  VOLATILE: 'volatile',
} as const;

export type TrendIndicator = (typeof TREND_INDICATORS)[keyof typeof TREND_INDICATORS];

// Export Formats
export const EXPORT_FORMATS = {
  CSV: 'csv',
  PDF: 'pdf',
  EXCEL: 'excel',
  JSON: 'json',
} as const;

export type ExportFormat = (typeof EXPORT_FORMATS)[keyof typeof EXPORT_FORMATS];

// Dashboard Widget Types
export const WIDGET_TYPES = {
  METRIC_CARD: 'metric_card',
  CHART: 'chart',
  TABLE: 'table',
  MAP: 'map',
  LEADERBOARD: 'leaderboard',
  TIMELINE: 'timeline',
  PROGRESS: 'progress',
} as const;

export type WidgetType = (typeof WIDGET_TYPES)[keyof typeof WIDGET_TYPES];

// Analytics Event Types
export const ANALYTICS_EVENTS = {
  USER_SIGNUP: 'user_signup',
  USER_LOGIN: 'user_login',
  USER_VERIFIED: 'user_verified',
  PROPERTY_CREATED: 'property_created',
  PROPERTY_VIEWED: 'property_viewed',
  PROPERTY_SHARED: 'property_shared',
  PROPERTY_FAVORITED: 'property_favorited',
  PAYMENT_INITIATED: 'payment_initiated',
  PAYMENT_COMPLETED: 'payment_completed',
  PAYMENT_FAILED: 'payment_failed',
  RENTAL_CONFIRMED: 'rental_confirmed',
  MARKING_JOB_CREATED: 'marking_job_created',
  MARKING_JOB_COMPLETED: 'marking_job_completed',
  REFERRAL_MADE: 'referral_made',
} as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

// Comparison Types
export const COMPARISON_TYPES = {
  PREVIOUS_PERIOD: 'previous_period',
  PREVIOUS_YEAR: 'previous_year',
  BASELINE: 'baseline',
  TARGET: 'target',
} as const;

export type ComparisonType = (typeof COMPARISON_TYPES)[keyof typeof COMPARISON_TYPES];

// Threshold Types for Alerts
export const THRESHOLD_TYPES = {
  ABOVE: 'above',
  BELOW: 'below',
  EQUALS: 'equals',
  BETWEEN: 'between',
} as const;

export type ThresholdType = (typeof THRESHOLD_TYPES)[keyof typeof THRESHOLD_TYPES];

// Report Types
export const REPORT_TYPES = {
  DAILY_SUMMARY: 'daily_summary',
  WEEKLY_SUMMARY: 'weekly_summary',
  MONTHLY_SUMMARY: 'monthly_summary',
  QUARTERLY_SUMMARY: 'quarterly_summary',
  ANNUAL_SUMMARY: 'annual_summary',
  CUSTOM: 'custom',
  USER_REPORT: 'user_report',
  PROPERTY_REPORT: 'property_report',
  REVENUE_REPORT: 'revenue_report',
  AGENT_PERFORMANCE: 'agent_performance',
  MARKING_SERVICE_REPORT: 'marking_service_report',
} as const;

export type ReportType = (typeof REPORT_TYPES)[keyof typeof REPORT_TYPES];

// Default Values
export const DEFAULT_ANALYTICS_CONFIG = {
  defaultPeriod: TIME_PERIODS.LAST_30_DAYS,
  defaultGranularity: DATA_GRANULARITY.DAILY,
  defaultChartType: CHART_TYPES.LINE,
  maxDataPoints: 1000,
  cacheTimeout: 300, // 5 minutes in seconds
  refreshInterval: 60000, // 1 minute in milliseconds
};

// Color Schemes for Charts
export const CHART_COLOR_SCHEMES = {
  primary: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'],
  success: ['#10b981', '#22c55e', '#84cc16', '#a3e635', '#d9f99d'],
  warning: ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7'],
  danger: ['#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2'],
  neutral: ['#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb', '#f3f4f6'],
};

// Analytics Query Limits
export const QUERY_LIMITS = {
  MAX_RECORDS: 10000,
  MAX_EXPORT_RECORDS: 100000,
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 500,
  MAX_AGGREGATION_GROUPS: 100,
};

export default {
  TIME_PERIODS,
  METRIC_CATEGORIES,
  AGGREGATION_TYPES,
  CHART_TYPES,
  USER_METRICS,
  PROPERTY_METRICS,
  PAYMENT_METRICS,
  AGENT_METRICS,
  MARKING_METRICS,
  ENGAGEMENT_METRICS,
  CONVERSION_METRICS,
  REFERRAL_METRICS,
  DATA_GRANULARITY,
  TREND_INDICATORS,
  EXPORT_FORMATS,
  WIDGET_TYPES,
  ANALYTICS_EVENTS,
  COMPARISON_TYPES,
  THRESHOLD_TYPES,
  REPORT_TYPES,
  DEFAULT_ANALYTICS_CONFIG,
  CHART_COLOR_SCHEMES,
  QUERY_LIMITS,
};