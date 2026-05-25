/**
 * Analytics Constants
 * Constants for analytics tracking, metrics, and reporting
 * Location: backend/shared/src/constants/analytics.ts
 */
export declare const TIME_PERIODS: {
    readonly TODAY: "today";
    readonly YESTERDAY: "yesterday";
    readonly LAST_7_DAYS: "last_7_days";
    readonly LAST_30_DAYS: "last_30_days";
    readonly LAST_90_DAYS: "last_90_days";
    readonly THIS_MONTH: "this_month";
    readonly LAST_MONTH: "last_month";
    readonly THIS_QUARTER: "this_quarter";
    readonly LAST_QUARTER: "last_quarter";
    readonly THIS_YEAR: "this_year";
    readonly LAST_YEAR: "last_year";
    readonly ALL_TIME: "all_time";
    readonly CUSTOM: "custom";
};
export type TimePeriod = (typeof TIME_PERIODS)[keyof typeof TIME_PERIODS];
export declare const METRIC_CATEGORIES: {
    readonly USER: "user";
    readonly PROPERTY: "property";
    readonly PAYMENT: "payment";
    readonly BOOKING: "booking";
    readonly AGENT: "agent";
    readonly MARKING: "marking";
    readonly REVENUE: "revenue";
    readonly ENGAGEMENT: "engagement";
    readonly CONVERSION: "conversion";
    readonly REFERRAL: "referral";
};
export type MetricCategory = (typeof METRIC_CATEGORIES)[keyof typeof METRIC_CATEGORIES];
export declare const AGGREGATION_TYPES: {
    readonly SUM: "sum";
    readonly AVERAGE: "average";
    readonly COUNT: "count";
    readonly MIN: "min";
    readonly MAX: "max";
    readonly MEDIAN: "median";
    readonly PERCENTILE: "percentile";
};
export type AggregationType = (typeof AGGREGATION_TYPES)[keyof typeof AGGREGATION_TYPES];
export declare const CHART_TYPES: {
    readonly LINE: "line";
    readonly BAR: "bar";
    readonly PIE: "pie";
    readonly DONUT: "donut";
    readonly AREA: "area";
    readonly SCATTER: "scatter";
    readonly HEATMAP: "heatmap";
    readonly FUNNEL: "funnel";
    readonly GAUGE: "gauge";
};
export type ChartType = (typeof CHART_TYPES)[keyof typeof CHART_TYPES];
export declare const USER_METRICS: {
    readonly TOTAL_USERS: "total_users";
    readonly NEW_USERS: "new_users";
    readonly ACTIVE_USERS: "active_users";
    readonly VERIFIED_USERS: "verified_users";
    readonly PREMIUM_USERS: "premium_users";
    readonly USER_GROWTH_RATE: "user_growth_rate";
    readonly USER_RETENTION_RATE: "user_retention_rate";
    readonly USER_CHURN_RATE: "user_churn_rate";
    readonly USERS_BY_ROLE: "users_by_role";
    readonly USERS_BY_TYPE: "users_by_type";
    readonly USERS_BY_LOCATION: "users_by_location";
    readonly AVERAGE_SESSION_DURATION: "average_session_duration";
};
export declare const ANALYTICS_PROPERTY_METRICS: {
    readonly TOTAL_PROPERTIES: "total_properties";
    readonly NEW_LISTINGS: "new_listings";
    readonly ACTIVE_LISTINGS: "active_listings";
    readonly RENTED_PROPERTIES: "rented_properties";
    readonly AVAILABLE_PROPERTIES: "available_properties";
    readonly PENDING_APPROVAL: "pending_approval";
    readonly APPROVED_PROPERTIES: "approved_properties";
    readonly REJECTED_PROPERTIES: "rejected_properties";
    readonly PROPERTIES_BY_TYPE: "properties_by_type";
    readonly PROPERTIES_BY_LOCATION: "properties_by_location";
    readonly PROPERTIES_BY_PRICE_RANGE: "properties_by_price_range";
    readonly AVERAGE_PROPERTY_PRICE: "average_property_price";
    readonly PROPERTY_VIEW_COUNT: "property_view_count";
    readonly PROPERTY_FAVORITE_COUNT: "property_favorite_count";
    readonly LISTING_CONVERSION_RATE: "listing_conversion_rate";
    readonly TIME_TO_RENT: "time_to_rent";
};
export declare const ANALYTICS_PAYMENT_METRICS: {
    readonly TOTAL_REVENUE: "total_revenue";
    readonly GROSS_REVENUE: "gross_revenue";
    readonly NET_REVENUE: "net_revenue";
    readonly TOTAL_TRANSACTIONS: "total_transactions";
    readonly SUCCESSFUL_PAYMENTS: "successful_payments";
    readonly FAILED_PAYMENTS: "failed_payments";
    readonly PENDING_PAYMENTS: "pending_payments";
    readonly REFUNDED_PAYMENTS: "refunded_payments";
    readonly AVERAGE_TRANSACTION_VALUE: "average_transaction_value";
    readonly PAYMENT_SUCCESS_RATE: "payment_success_rate";
    readonly REVENUE_BY_PAYMENT_TYPE: "revenue_by_payment_type";
    readonly COMMISSION_EARNED: "commission_earned";
    readonly AGENT_COMMISSION: "agent_commission";
    readonly PLATFORM_FEES: "platform_fees";
    readonly REVENUE_GROWTH_RATE: "revenue_growth_rate";
};
export declare const AGENT_METRICS: {
    readonly TOTAL_AGENTS: "total_agents";
    readonly ACTIVE_AGENTS: "active_agents";
    readonly LISTING_AGENTS: "listing_agents";
    readonly SUB_AGENTS: "sub_agents";
    readonly TOP_PERFORMING_AGENTS: "top_performing_agents";
    readonly AGENT_LISTINGS_COUNT: "agent_listings_count";
    readonly AGENT_RENTAL_COUNT: "agent_rental_count";
    readonly AGENT_COMMISSION_EARNED: "agent_commission_earned";
    readonly AGENT_CONVERSION_RATE: "agent_conversion_rate";
    readonly AGENT_RELIABILITY_SCORE: "agent_reliability_score";
};
export declare const MARKING_METRICS: {
    readonly TOTAL_MARKING_JOBS: "total_marking_jobs";
    readonly PENDING_MARKING_JOBS: "pending_marking_jobs";
    readonly ASSIGNED_MARKING_JOBS: "assigned_marking_jobs";
    readonly COMPLETED_MARKING_JOBS: "completed_marking_jobs";
    readonly CANCELLED_MARKING_JOBS: "cancelled_marking_jobs";
    readonly MARKING_COMPLETION_RATE: "marking_completion_rate";
    readonly AVERAGE_COMPLETION_TIME: "average_completion_time";
    readonly MARKING_REVENUE: "marking_revenue";
    readonly AGENTS_AVAILABLE_FOR_MARKING: "agents_available_for_marking";
};
export declare const ANALYTICS_ENGAGEMENT_METRICS: {
    readonly TOTAL_PAGE_VIEWS: "total_page_views";
    readonly UNIQUE_VISITORS: "unique_visitors";
    readonly BOUNCE_RATE: "bounce_rate";
    readonly AVERAGE_TIME_ON_SITE: "average_time_on_site";
    readonly PROPERTY_SEARCHES: "property_searches";
    readonly PROPERTY_VIEWS: "property_views";
    readonly PROPERTY_SHARES: "property_shares";
    readonly PROPERTY_FAVORITES: "property_favorites";
    readonly CLICK_THROUGH_RATE: "click_through_rate";
};
export declare const CONVERSION_METRICS: {
    readonly SIGNUP_CONVERSION_RATE: "signup_conversion_rate";
    readonly VERIFICATION_COMPLETION_RATE: "verification_completion_rate";
    readonly LISTING_TO_RENTAL_RATE: "listing_to_rental_rate";
    readonly VIEW_TO_INQUIRY_RATE: "view_to_inquiry_rate";
    readonly INQUIRY_TO_BOOKING_RATE: "inquiry_to_booking_rate";
    readonly PAYMENT_COMPLETION_RATE: "payment_completion_rate";
};
export declare const ANALYTICS_REFERRAL_METRICS: {
    readonly TOTAL_REFERRALS: "total_referrals";
    readonly SUCCESSFUL_REFERRALS: "successful_referrals";
    readonly REFERRAL_CONVERSION_RATE: "referral_conversion_rate";
    readonly REFERRAL_REVENUE: "referral_revenue";
    readonly TOP_REFERRERS: "top_referrers";
};
export declare const DATA_GRANULARITY: {
    readonly HOURLY: "hourly";
    readonly DAILY: "daily";
    readonly WEEKLY: "weekly";
    readonly MONTHLY: "monthly";
    readonly QUARTERLY: "quarterly";
    readonly YEARLY: "yearly";
};
export type DataGranularity = (typeof DATA_GRANULARITY)[keyof typeof DATA_GRANULARITY];
export declare const TREND_INDICATORS: {
    readonly INCREASING: "increasing";
    readonly DECREASING: "decreasing";
    readonly STABLE: "stable";
    readonly VOLATILE: "volatile";
};
export type TrendIndicator = (typeof TREND_INDICATORS)[keyof typeof TREND_INDICATORS];
export declare const EXPORT_FORMATS: {
    readonly CSV: "csv";
    readonly PDF: "pdf";
    readonly EXCEL: "excel";
    readonly JSON: "json";
};
export type ExportFormat = (typeof EXPORT_FORMATS)[keyof typeof EXPORT_FORMATS];
export declare const WIDGET_TYPES: {
    readonly METRIC_CARD: "metric_card";
    readonly CHART: "chart";
    readonly TABLE: "table";
    readonly MAP: "map";
    readonly LEADERBOARD: "leaderboard";
    readonly TIMELINE: "timeline";
    readonly PROGRESS: "progress";
};
export type WidgetType = (typeof WIDGET_TYPES)[keyof typeof WIDGET_TYPES];
export declare const ANALYTICS_EVENTS: {
    readonly USER_SIGNUP: "user_signup";
    readonly USER_LOGIN: "user_login";
    readonly USER_VERIFIED: "user_verified";
    readonly PROPERTY_CREATED: "property_created";
    readonly PROPERTY_VIEWED: "property_viewed";
    readonly PROPERTY_SHARED: "property_shared";
    readonly PROPERTY_FAVORITED: "property_favorited";
    readonly PAYMENT_INITIATED: "payment_initiated";
    readonly PAYMENT_COMPLETED: "payment_completed";
    readonly PAYMENT_FAILED: "payment_failed";
    readonly RENTAL_CONFIRMED: "rental_confirmed";
    readonly MARKING_JOB_CREATED: "marking_job_created";
    readonly MARKING_JOB_COMPLETED: "marking_job_completed";
    readonly REFERRAL_MADE: "referral_made";
};
export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];
export declare const COMPARISON_TYPES: {
    readonly PREVIOUS_PERIOD: "previous_period";
    readonly PREVIOUS_YEAR: "previous_year";
    readonly BASELINE: "baseline";
    readonly TARGET: "target";
};
export type ComparisonType = (typeof COMPARISON_TYPES)[keyof typeof COMPARISON_TYPES];
export declare const THRESHOLD_TYPES: {
    readonly ABOVE: "above";
    readonly BELOW: "below";
    readonly EQUALS: "equals";
    readonly BETWEEN: "between";
};
export type ThresholdType = (typeof THRESHOLD_TYPES)[keyof typeof THRESHOLD_TYPES];
export declare const REPORT_TYPES: {
    readonly DAILY_SUMMARY: "daily_summary";
    readonly WEEKLY_SUMMARY: "weekly_summary";
    readonly MONTHLY_SUMMARY: "monthly_summary";
    readonly QUARTERLY_SUMMARY: "quarterly_summary";
    readonly ANNUAL_SUMMARY: "annual_summary";
    readonly CUSTOM: "custom";
    readonly USER_REPORT: "user_report";
    readonly PROPERTY_REPORT: "property_report";
    readonly REVENUE_REPORT: "revenue_report";
    readonly AGENT_PERFORMANCE: "agent_performance";
    readonly MARKING_SERVICE_REPORT: "marking_service_report";
};
export type ReportType = (typeof REPORT_TYPES)[keyof typeof REPORT_TYPES];
export declare const DEFAULT_ANALYTICS_CONFIG: {
    defaultPeriod: "last_30_days";
    defaultGranularity: "daily";
    defaultChartType: "line";
    maxDataPoints: number;
    cacheTimeout: number;
    refreshInterval: number;
};
export declare const CHART_COLOR_SCHEMES: {
    primary: string[];
    success: string[];
    warning: string[];
    danger: string[];
    neutral: string[];
};
export declare const QUERY_LIMITS: {
    MAX_RECORDS: number;
    MAX_EXPORT_RECORDS: number;
    DEFAULT_PAGE_SIZE: number;
    MAX_PAGE_SIZE: number;
    MAX_AGGREGATION_GROUPS: number;
};
declare const _default: {
    TIME_PERIODS: {
        readonly TODAY: "today";
        readonly YESTERDAY: "yesterday";
        readonly LAST_7_DAYS: "last_7_days";
        readonly LAST_30_DAYS: "last_30_days";
        readonly LAST_90_DAYS: "last_90_days";
        readonly THIS_MONTH: "this_month";
        readonly LAST_MONTH: "last_month";
        readonly THIS_QUARTER: "this_quarter";
        readonly LAST_QUARTER: "last_quarter";
        readonly THIS_YEAR: "this_year";
        readonly LAST_YEAR: "last_year";
        readonly ALL_TIME: "all_time";
        readonly CUSTOM: "custom";
    };
    METRIC_CATEGORIES: {
        readonly USER: "user";
        readonly PROPERTY: "property";
        readonly PAYMENT: "payment";
        readonly BOOKING: "booking";
        readonly AGENT: "agent";
        readonly MARKING: "marking";
        readonly REVENUE: "revenue";
        readonly ENGAGEMENT: "engagement";
        readonly CONVERSION: "conversion";
        readonly REFERRAL: "referral";
    };
    AGGREGATION_TYPES: {
        readonly SUM: "sum";
        readonly AVERAGE: "average";
        readonly COUNT: "count";
        readonly MIN: "min";
        readonly MAX: "max";
        readonly MEDIAN: "median";
        readonly PERCENTILE: "percentile";
    };
    CHART_TYPES: {
        readonly LINE: "line";
        readonly BAR: "bar";
        readonly PIE: "pie";
        readonly DONUT: "donut";
        readonly AREA: "area";
        readonly SCATTER: "scatter";
        readonly HEATMAP: "heatmap";
        readonly FUNNEL: "funnel";
        readonly GAUGE: "gauge";
    };
    USER_METRICS: {
        readonly TOTAL_USERS: "total_users";
        readonly NEW_USERS: "new_users";
        readonly ACTIVE_USERS: "active_users";
        readonly VERIFIED_USERS: "verified_users";
        readonly PREMIUM_USERS: "premium_users";
        readonly USER_GROWTH_RATE: "user_growth_rate";
        readonly USER_RETENTION_RATE: "user_retention_rate";
        readonly USER_CHURN_RATE: "user_churn_rate";
        readonly USERS_BY_ROLE: "users_by_role";
        readonly USERS_BY_TYPE: "users_by_type";
        readonly USERS_BY_LOCATION: "users_by_location";
        readonly AVERAGE_SESSION_DURATION: "average_session_duration";
    };
    ANALYTICS_PROPERTY_METRICS: {
        readonly TOTAL_PROPERTIES: "total_properties";
        readonly NEW_LISTINGS: "new_listings";
        readonly ACTIVE_LISTINGS: "active_listings";
        readonly RENTED_PROPERTIES: "rented_properties";
        readonly AVAILABLE_PROPERTIES: "available_properties";
        readonly PENDING_APPROVAL: "pending_approval";
        readonly APPROVED_PROPERTIES: "approved_properties";
        readonly REJECTED_PROPERTIES: "rejected_properties";
        readonly PROPERTIES_BY_TYPE: "properties_by_type";
        readonly PROPERTIES_BY_LOCATION: "properties_by_location";
        readonly PROPERTIES_BY_PRICE_RANGE: "properties_by_price_range";
        readonly AVERAGE_PROPERTY_PRICE: "average_property_price";
        readonly PROPERTY_VIEW_COUNT: "property_view_count";
        readonly PROPERTY_FAVORITE_COUNT: "property_favorite_count";
        readonly LISTING_CONVERSION_RATE: "listing_conversion_rate";
        readonly TIME_TO_RENT: "time_to_rent";
    };
    ANALYTICS_PAYMENT_METRICS: {
        readonly TOTAL_REVENUE: "total_revenue";
        readonly GROSS_REVENUE: "gross_revenue";
        readonly NET_REVENUE: "net_revenue";
        readonly TOTAL_TRANSACTIONS: "total_transactions";
        readonly SUCCESSFUL_PAYMENTS: "successful_payments";
        readonly FAILED_PAYMENTS: "failed_payments";
        readonly PENDING_PAYMENTS: "pending_payments";
        readonly REFUNDED_PAYMENTS: "refunded_payments";
        readonly AVERAGE_TRANSACTION_VALUE: "average_transaction_value";
        readonly PAYMENT_SUCCESS_RATE: "payment_success_rate";
        readonly REVENUE_BY_PAYMENT_TYPE: "revenue_by_payment_type";
        readonly COMMISSION_EARNED: "commission_earned";
        readonly AGENT_COMMISSION: "agent_commission";
        readonly PLATFORM_FEES: "platform_fees";
        readonly REVENUE_GROWTH_RATE: "revenue_growth_rate";
    };
    AGENT_METRICS: {
        readonly TOTAL_AGENTS: "total_agents";
        readonly ACTIVE_AGENTS: "active_agents";
        readonly LISTING_AGENTS: "listing_agents";
        readonly SUB_AGENTS: "sub_agents";
        readonly TOP_PERFORMING_AGENTS: "top_performing_agents";
        readonly AGENT_LISTINGS_COUNT: "agent_listings_count";
        readonly AGENT_RENTAL_COUNT: "agent_rental_count";
        readonly AGENT_COMMISSION_EARNED: "agent_commission_earned";
        readonly AGENT_CONVERSION_RATE: "agent_conversion_rate";
        readonly AGENT_RELIABILITY_SCORE: "agent_reliability_score";
    };
    MARKING_METRICS: {
        readonly TOTAL_MARKING_JOBS: "total_marking_jobs";
        readonly PENDING_MARKING_JOBS: "pending_marking_jobs";
        readonly ASSIGNED_MARKING_JOBS: "assigned_marking_jobs";
        readonly COMPLETED_MARKING_JOBS: "completed_marking_jobs";
        readonly CANCELLED_MARKING_JOBS: "cancelled_marking_jobs";
        readonly MARKING_COMPLETION_RATE: "marking_completion_rate";
        readonly AVERAGE_COMPLETION_TIME: "average_completion_time";
        readonly MARKING_REVENUE: "marking_revenue";
        readonly AGENTS_AVAILABLE_FOR_MARKING: "agents_available_for_marking";
    };
    ANALYTICS_ENGAGEMENT_METRICS: {
        readonly TOTAL_PAGE_VIEWS: "total_page_views";
        readonly UNIQUE_VISITORS: "unique_visitors";
        readonly BOUNCE_RATE: "bounce_rate";
        readonly AVERAGE_TIME_ON_SITE: "average_time_on_site";
        readonly PROPERTY_SEARCHES: "property_searches";
        readonly PROPERTY_VIEWS: "property_views";
        readonly PROPERTY_SHARES: "property_shares";
        readonly PROPERTY_FAVORITES: "property_favorites";
        readonly CLICK_THROUGH_RATE: "click_through_rate";
    };
    CONVERSION_METRICS: {
        readonly SIGNUP_CONVERSION_RATE: "signup_conversion_rate";
        readonly VERIFICATION_COMPLETION_RATE: "verification_completion_rate";
        readonly LISTING_TO_RENTAL_RATE: "listing_to_rental_rate";
        readonly VIEW_TO_INQUIRY_RATE: "view_to_inquiry_rate";
        readonly INQUIRY_TO_BOOKING_RATE: "inquiry_to_booking_rate";
        readonly PAYMENT_COMPLETION_RATE: "payment_completion_rate";
    };
    ANALYTICS_REFERRAL_METRICS: {
        readonly TOTAL_REFERRALS: "total_referrals";
        readonly SUCCESSFUL_REFERRALS: "successful_referrals";
        readonly REFERRAL_CONVERSION_RATE: "referral_conversion_rate";
        readonly REFERRAL_REVENUE: "referral_revenue";
        readonly TOP_REFERRERS: "top_referrers";
    };
    DATA_GRANULARITY: {
        readonly HOURLY: "hourly";
        readonly DAILY: "daily";
        readonly WEEKLY: "weekly";
        readonly MONTHLY: "monthly";
        readonly QUARTERLY: "quarterly";
        readonly YEARLY: "yearly";
    };
    TREND_INDICATORS: {
        readonly INCREASING: "increasing";
        readonly DECREASING: "decreasing";
        readonly STABLE: "stable";
        readonly VOLATILE: "volatile";
    };
    EXPORT_FORMATS: {
        readonly CSV: "csv";
        readonly PDF: "pdf";
        readonly EXCEL: "excel";
        readonly JSON: "json";
    };
    WIDGET_TYPES: {
        readonly METRIC_CARD: "metric_card";
        readonly CHART: "chart";
        readonly TABLE: "table";
        readonly MAP: "map";
        readonly LEADERBOARD: "leaderboard";
        readonly TIMELINE: "timeline";
        readonly PROGRESS: "progress";
    };
    ANALYTICS_EVENTS: {
        readonly USER_SIGNUP: "user_signup";
        readonly USER_LOGIN: "user_login";
        readonly USER_VERIFIED: "user_verified";
        readonly PROPERTY_CREATED: "property_created";
        readonly PROPERTY_VIEWED: "property_viewed";
        readonly PROPERTY_SHARED: "property_shared";
        readonly PROPERTY_FAVORITED: "property_favorited";
        readonly PAYMENT_INITIATED: "payment_initiated";
        readonly PAYMENT_COMPLETED: "payment_completed";
        readonly PAYMENT_FAILED: "payment_failed";
        readonly RENTAL_CONFIRMED: "rental_confirmed";
        readonly MARKING_JOB_CREATED: "marking_job_created";
        readonly MARKING_JOB_COMPLETED: "marking_job_completed";
        readonly REFERRAL_MADE: "referral_made";
    };
    COMPARISON_TYPES: {
        readonly PREVIOUS_PERIOD: "previous_period";
        readonly PREVIOUS_YEAR: "previous_year";
        readonly BASELINE: "baseline";
        readonly TARGET: "target";
    };
    THRESHOLD_TYPES: {
        readonly ABOVE: "above";
        readonly BELOW: "below";
        readonly EQUALS: "equals";
        readonly BETWEEN: "between";
    };
    REPORT_TYPES: {
        readonly DAILY_SUMMARY: "daily_summary";
        readonly WEEKLY_SUMMARY: "weekly_summary";
        readonly MONTHLY_SUMMARY: "monthly_summary";
        readonly QUARTERLY_SUMMARY: "quarterly_summary";
        readonly ANNUAL_SUMMARY: "annual_summary";
        readonly CUSTOM: "custom";
        readonly USER_REPORT: "user_report";
        readonly PROPERTY_REPORT: "property_report";
        readonly REVENUE_REPORT: "revenue_report";
        readonly AGENT_PERFORMANCE: "agent_performance";
        readonly MARKING_SERVICE_REPORT: "marking_service_report";
    };
    DEFAULT_ANALYTICS_CONFIG: {
        defaultPeriod: "last_30_days";
        defaultGranularity: "daily";
        defaultChartType: "line";
        maxDataPoints: number;
        cacheTimeout: number;
        refreshInterval: number;
    };
    CHART_COLOR_SCHEMES: {
        primary: string[];
        success: string[];
        warning: string[];
        danger: string[];
        neutral: string[];
    };
    QUERY_LIMITS: {
        MAX_RECORDS: number;
        MAX_EXPORT_RECORDS: number;
        DEFAULT_PAGE_SIZE: number;
        MAX_PAGE_SIZE: number;
        MAX_AGGREGATION_GROUPS: number;
    };
};
export default _default;
//# sourceMappingURL=analytics.d.ts.map