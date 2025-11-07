// apps/admin/src/lib/constants/analyticsMetrics.ts

/**
 * Platform-wide metrics
 */
export const PLATFORM_METRICS = {
  TOTAL_USERS: 'total_users',
  ACTIVE_USERS: 'active_users',
  NEW_USERS: 'new_users',
  VERIFIED_USERS: 'verified_users',
  TOTAL_PROPERTIES: 'total_properties',
  ACTIVE_LISTINGS: 'active_listings',
  RENTED_PROPERTIES: 'rented_properties',
  TOTAL_REVENUE: 'total_revenue',
  TOTAL_TRANSACTIONS: 'total_transactions',
  SUCCESSFUL_PAYMENTS: 'successful_payments',
  FAILED_PAYMENTS: 'failed_payments',
  TOTAL_AGENTS: 'total_agents',
  ACTIVE_AGENTS: 'active_agents',
} as const;

/**
 * Revenue metrics
 */
export const REVENUE_METRICS = {
  GROSS_REVENUE: 'gross_revenue',
  NET_REVENUE: 'net_revenue',
  RENT_REVENUE: 'rent_revenue',
  MARKING_REVENUE: 'marking_revenue',
  COMMISSION_REVENUE: 'commission_revenue',
  PLATFORM_FEES: 'platform_fees',
  TRANSACTION_FEES: 'transaction_fees',
  REFUNDS: 'refunds',
  REVENUE_GROWTH: 'revenue_growth',
  AVERAGE_TRANSACTION_VALUE: 'average_transaction_value',
  MONTHLY_RECURRING_REVENUE: 'monthly_recurring_revenue',
} as const;

/**
 * User metrics
 */
export const USER_METRICS = {
  TOTAL_USERS: 'total_users',
  NEW_USERS: 'new_users',
  ACTIVE_USERS: 'active_users',
  VERIFIED_USERS: 'verified_users',
  PENDING_VERIFICATIONS: 'pending_verifications',
  REJECTED_VERIFICATIONS: 'rejected_verifications',
  PREMIUM_USERS: 'premium_users',
  USER_RETENTION_RATE: 'user_retention_rate',
  USER_CHURN_RATE: 'user_churn_rate',
  AVERAGE_SESSION_DURATION: 'average_session_duration',
  USER_ENGAGEMENT_RATE: 'user_engagement_rate',
} as const;

/**
 * Property metrics
 */
export const PROPERTY_METRICS = {
  TOTAL_PROPERTIES: 'total_properties',
  NEW_LISTINGS: 'new_listings',
  ACTIVE_LISTINGS: 'active_listings',
  RENTED_PROPERTIES: 'rented_properties',
  UNAVAILABLE_PROPERTIES: 'unavailable_properties',
  PENDING_APPROVAL: 'pending_approval',
  REJECTED_LISTINGS: 'rejected_listings',
  OCCUPANCY_RATE: 'occupancy_rate',
  AVERAGE_TIME_TO_RENT: 'average_time_to_rent',
  AVERAGE_PROPERTY_PRICE: 'average_property_price',
  PROPERTY_VIEWS: 'property_views',
  BOUNDARY_VERIFIED_PROPERTIES: 'boundary_verified_properties',
} as const;

/**
 * Agent metrics
 */
export const AGENT_METRICS = {
  TOTAL_AGENTS: 'total_agents',
  ACTIVE_AGENTS: 'active_agents',
  NEW_AGENTS: 'new_agents',
  AGENTS_WITH_LISTINGS: 'agents_with_listings',
  AGENTS_AVAILABLE_FOR_MARKING: 'agents_available_for_marking',
  AVERAGE_AGENT_PERFORMANCE_SCORE: 'average_agent_performance_score',
  TOTAL_AGENT_COMMISSIONS: 'total_agent_commissions',
  AVERAGE_AGENT_EARNINGS: 'average_agent_earnings',
  AGENT_RETENTION_RATE: 'agent_retention_rate',
} as const;

/**
 * Transaction metrics
 */
export const TRANSACTION_METRICS = {
  TOTAL_TRANSACTIONS: 'total_transactions',
  SUCCESSFUL_TRANSACTIONS: 'successful_transactions',
  FAILED_TRANSACTIONS: 'failed_transactions',
  PENDING_TRANSACTIONS: 'pending_transactions',
  REFUNDED_TRANSACTIONS: 'refunded_transactions',
  TRANSACTION_SUCCESS_RATE: 'transaction_success_rate',
  TRANSACTION_FAILURE_RATE: 'transaction_failure_rate',
  AVERAGE_TRANSACTION_VALUE: 'average_transaction_value',
  TRANSACTION_VOLUME: 'transaction_volume',
} as const;

/**
 * Marking job metrics
 */
export const MARKING_JOB_METRICS = {
  TOTAL_MARKING_JOBS: 'total_marking_jobs',
  QUEUED_JOBS: 'queued_jobs',
  IN_PROGRESS_JOBS: 'in_progress_jobs',
  COMPLETED_JOBS: 'completed_jobs',
  CANCELLED_JOBS: 'cancelled_jobs',
  EXPIRED_JOBS: 'expired_jobs',
  AVERAGE_COMPLETION_TIME: 'average_completion_time',
  JOB_SUCCESS_RATE: 'job_success_rate',
  MARKING_REVENUE: 'marking_revenue',
} as const;

/**
 * Verification metrics
 */
export const VERIFICATION_METRICS = {
  PENDING_VERIFICATIONS: 'pending_verifications',
  APPROVED_VERIFICATIONS: 'approved_verifications',
  REJECTED_VERIFICATIONS: 'rejected_verifications',
  VERIFICATION_APPROVAL_RATE: 'verification_approval_rate',
  AVERAGE_VERIFICATION_TIME: 'average_verification_time',
  VERIFICATION_BACKLOG: 'verification_backlog',
} as const;

/**
 * Conversion metrics
 */
export const CONVERSION_METRICS = {
  SIGNUP_TO_VERIFICATION_RATE: 'signup_to_verification_rate',
  VERIFICATION_TO_LISTING_RATE: 'verification_to_listing_rate',
  LISTING_TO_RENT_RATE: 'listing_to_rent_rate',
  VISITOR_TO_SIGNUP_RATE: 'visitor_to_signup_rate',
  OVERALL_CONVERSION_RATE: 'overall_conversion_rate',
} as const;

/**
 * Engagement metrics
 */
export const ENGAGEMENT_METRICS = {
  DAILY_ACTIVE_USERS: 'daily_active_users',
  WEEKLY_ACTIVE_USERS: 'weekly_active_users',
  MONTHLY_ACTIVE_USERS: 'monthly_active_users',
  AVERAGE_SESSION_DURATION: 'average_session_duration',
  PROPERTY_VIEWS_PER_USER: 'property_views_per_user',
  SEARCH_QUERIES: 'search_queries',
  CONTACT_REQUESTS: 'contact_requests',
} as const;

/**
 * System health metrics
 */
export const SYSTEM_HEALTH_METRICS = {
  API_RESPONSE_TIME: 'api_response_time',
  ERROR_RATE: 'error_rate',
  UPTIME_PERCENTAGE: 'uptime_percentage',
  DATABASE_CONNECTIONS: 'database_connections',
  CACHE_HIT_RATE: 'cache_hit_rate',
  ACTIVE_SESSIONS: 'active_sessions',
} as const;

/**
 * Financial metrics
 */
export const FINANCIAL_METRICS = {
  GROSS_PROFIT: 'gross_profit',
  NET_PROFIT: 'net_profit',
  PROFIT_MARGIN: 'profit_margin',
  CUSTOMER_ACQUISITION_COST: 'customer_acquisition_cost',
  CUSTOMER_LIFETIME_VALUE: 'customer_lifetime_value',
  RETURN_ON_INVESTMENT: 'return_on_investment',
  BURN_RATE: 'burn_rate',
} as const;

/**
 * Geographic metrics
 */
export const GEOGRAPHIC_METRICS = {
  USERS_BY_STATE: 'users_by_state',
  USERS_BY_CITY: 'users_by_city',
  PROPERTIES_BY_STATE: 'properties_by_state',
  PROPERTIES_BY_CITY: 'properties_by_city',
  REVENUE_BY_LOCATION: 'revenue_by_location',
} as const;

/**
 * Time-based metrics periods
 */
export const METRIC_PERIODS = {
  HOUR: 'hour',
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
  QUARTER: 'quarter',
  YEAR: 'year',
  ALL_TIME: 'all_time',
} as const;

/**
 * Metric aggregation types
 */
export const AGGREGATION_TYPES = {
  COUNT: 'count',
  SUM: 'sum',
  AVERAGE: 'average',
  MIN: 'min',
  MAX: 'max',
  MEDIAN: 'median',
  PERCENTILE: 'percentile',
  STANDARD_DEVIATION: 'standard_deviation',
} as const;

/**
 * Metric comparison types
 */
export const COMPARISON_TYPES = {
  PREVIOUS_PERIOD: 'previous_period',
  SAME_PERIOD_LAST_YEAR: 'same_period_last_year',
  CUSTOM_PERIOD: 'custom_period',
  BASELINE: 'baseline',
} as const;

/**
 * KPI thresholds
 */
export const KPI_THRESHOLDS = {
  USER_RETENTION_RATE: {
    EXCELLENT: 80,
    GOOD: 60,
    FAIR: 40,
    POOR: 0,
  },
  TRANSACTION_SUCCESS_RATE: {
    EXCELLENT: 95,
    GOOD: 85,
    FAIR: 70,
    POOR: 0,
  },
  OCCUPANCY_RATE: {
    EXCELLENT: 90,
    GOOD: 75,
    FAIR: 60,
    POOR: 0,
  },
  AGENT_PERFORMANCE_SCORE: {
    EXCELLENT: 85,
    GOOD: 70,
    FAIR: 55,
    POOR: 0,
  },
  VERIFICATION_APPROVAL_RATE: {
    EXCELLENT: 85,
    GOOD: 70,
    FAIR: 55,
    POOR: 0,
  },
} as const;

/**
 * Metric display formats
 */
export const METRIC_FORMATS = {
  NUMBER: 'number',
  CURRENCY: 'currency',
  PERCENTAGE: 'percentage',
  DURATION: 'duration',
  RATIO: 'ratio',
} as const;

/**
 * All metrics grouped by category
 */
export const METRICS_BY_CATEGORY = {
  platform: Object.values(PLATFORM_METRICS),
  revenue: Object.values(REVENUE_METRICS),
  users: Object.values(USER_METRICS),
  properties: Object.values(PROPERTY_METRICS),
  agents: Object.values(AGENT_METRICS),
  transactions: Object.values(TRANSACTION_METRICS),
  marking_jobs: Object.values(MARKING_JOB_METRICS),
  verification: Object.values(VERIFICATION_METRICS),
  conversion: Object.values(CONVERSION_METRICS),
  engagement: Object.values(ENGAGEMENT_METRICS),
  system_health: Object.values(SYSTEM_HEALTH_METRICS),
  financial: Object.values(FINANCIAL_METRICS),
  geographic: Object.values(GEOGRAPHIC_METRICS),
} as const;

/**
 * Metric metadata
 */
export const METRIC_METADATA = {
  [PLATFORM_METRICS.TOTAL_USERS]: {
    label: 'Total Users',
    description: 'Total number of registered users',
    format: METRIC_FORMATS.NUMBER,
  },
  [REVENUE_METRICS.TOTAL_REVENUE]: {
    label: 'Total Revenue',
    description: 'Total revenue generated',
    format: METRIC_FORMATS.CURRENCY,
  },
  [USER_METRICS.USER_RETENTION_RATE]: {
    label: 'User Retention Rate',
    description: 'Percentage of users who return',
    format: METRIC_FORMATS.PERCENTAGE,
  },
  [PROPERTY_METRICS.OCCUPANCY_RATE]: {
    label: 'Occupancy Rate',
    description: 'Percentage of properties currently rented',
    format: METRIC_FORMATS.PERCENTAGE,
  },
  [TRANSACTION_METRICS.TRANSACTION_SUCCESS_RATE]: {
    label: 'Transaction Success Rate',
    description: 'Percentage of successful transactions',
    format: METRIC_FORMATS.PERCENTAGE,
  },
} as const;