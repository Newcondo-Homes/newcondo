/**
 * Reports Constants
 * Constants for report generation, scheduling, and templates
 * Location: backend/shared/src/constants/reports.ts
 */

// Report Frequencies
export const REPORT_FREQUENCIES = {
  ONCE: 'once',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly',
  CUSTOM: 'custom',
} as const;

export type ReportFrequency =
  (typeof REPORT_FREQUENCIES)[keyof typeof REPORT_FREQUENCIES];

// Report Status
export const REPORT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  SCHEDULED: 'scheduled',
} as const;

export type ReportStatus = (typeof REPORT_STATUS)[keyof typeof REPORT_STATUS];

// Report Delivery Methods
export const DELIVERY_METHODS = {
  EMAIL: 'email',
  DOWNLOAD: 'download',
  DASHBOARD: 'dashboard',
  API: 'api',
  WEBHOOK: 'webhook',
} as const;

export type DeliveryMethod = (typeof DELIVERY_METHODS)[keyof typeof DELIVERY_METHODS];

// Report Templates
export const REPORT_TEMPLATES = {
  // Platform Reports
  PLATFORM_OVERVIEW: {
    id: 'platform_overview',
    name: 'Platform Overview Report',
    description: 'Comprehensive overview of platform metrics and KPIs',
    category: 'platform',
    sections: [
      'user_metrics',
      'property_metrics',
      'revenue_metrics',
      'engagement_metrics',
    ],
  },
  
  // User Reports
  USER_ANALYTICS: {
    id: 'user_analytics',
    name: 'User Analytics Report',
    description: 'Detailed user behavior and demographics analysis',
    category: 'users',
    sections: [
      'user_growth',
      'user_demographics',
      'user_activity',
      'user_retention',
    ],
  },
  
  USER_VERIFICATION: {
    id: 'user_verification',
    name: 'User Verification Report',
    description: 'Status and metrics of user verification processes',
    category: 'users',
    sections: [
      'verification_queue',
      'verification_success_rate',
      'rejected_verifications',
      'pending_reviews',
    ],
  },
  
  // Property Reports
  PROPERTY_PERFORMANCE: {
    id: 'property_performance',
    name: 'Property Performance Report',
    description: 'Analysis of property listings and their performance',
    category: 'properties',
    sections: [
      'active_listings',
      'property_views',
      'rental_conversions',
      'average_prices',
    ],
  },
  
  PROPERTY_INVENTORY: {
    id: 'property_inventory',
    name: 'Property Inventory Report',
    description: 'Current status of all property listings',
    category: 'properties',
    sections: [
      'total_properties',
      'properties_by_status',
      'properties_by_type',
      'properties_by_location',
    ],
  },
  
  // Revenue Reports
  REVENUE_SUMMARY: {
    id: 'revenue_summary',
    name: 'Revenue Summary Report',
    description: 'Comprehensive revenue analysis and breakdown',
    category: 'revenue',
    sections: [
      'total_revenue',
      'revenue_by_source',
      'commission_breakdown',
      'payment_methods',
    ],
  },
  
  FINANCIAL_STATEMENT: {
    id: 'financial_statement',
    name: 'Financial Statement',
    description: 'Detailed financial statement with all transactions',
    category: 'revenue',
    sections: [
      'income_statement',
      'transaction_log',
      'refunds_and_chargebacks',
      'outstanding_payments',
    ],
  },
  
  // Agent Reports
  AGENT_PERFORMANCE: {
    id: 'agent_performance',
    name: 'Agent Performance Report',
    description: 'Performance metrics for all agents',
    category: 'agents',
    sections: [
      'active_agents',
      'listings_per_agent',
      'commission_earned',
      'agent_ratings',
    ],
  },
  
  TOP_AGENTS: {
    id: 'top_agents',
    name: 'Top Performing Agents Report',
    description: 'Leaderboard of best performing agents',
    category: 'agents',
    sections: [
      'top_by_listings',
      'top_by_revenue',
      'top_by_ratings',
      'top_by_conversions',
    ],
  },
  
  // Marking Service Reports
  MARKING_SERVICE_SUMMARY: {
    id: 'marking_service_summary',
    name: 'Marking Service Summary',
    description: 'Overview of property marking service operations',
    category: 'marking',
    sections: [
      'total_jobs',
      'completion_rate',
      'average_completion_time',
      'revenue_from_marking',
    ],
  },
  
  MARKING_QUEUE_STATUS: {
    id: 'marking_queue_status',
    name: 'Marking Queue Status Report',
    description: 'Current status of marking job queue',
    category: 'marking',
    sections: [
      'pending_jobs',
      'assigned_jobs',
      'queue_wait_times',
      'agent_availability',
    ],
  },
  
  // Payment Reports
  PAYMENT_TRANSACTIONS: {
    id: 'payment_transactions',
    name: 'Payment Transactions Report',
    description: 'Detailed log of all payment transactions',
    category: 'payments',
    sections: [
      'all_transactions',
      'successful_payments',
      'failed_payments',
      'refunded_payments',
    ],
  },
  
  PAYMENT_RECONCILIATION: {
    id: 'payment_reconciliation',
    name: 'Payment Reconciliation Report',
    description: 'Reconciliation of payments and settlements',
    category: 'payments',
    sections: [
      'pending_settlements',
      'settled_payments',
      'discrepancies',
      'virtual_account_balances',
    ],
  },
  
  // Conversion Reports
  CONVERSION_FUNNEL: {
    id: 'conversion_funnel',
    name: 'Conversion Funnel Report',
    description: 'Analysis of user conversion through the funnel',
    category: 'conversions',
    sections: [
      'signup_to_verification',
      'listing_to_rental',
      'view_to_inquiry',
      'inquiry_to_booking',
    ],
  },
  
  // Engagement Reports
  ENGAGEMENT_METRICS: {
    id: 'engagement_metrics',
    name: 'User Engagement Report',
    description: 'User engagement and activity metrics',
    category: 'engagement',
    sections: [
      'page_views',
      'session_duration',
      'bounce_rate',
      'feature_usage',
    ],
  },
} as const;

// Report Sections Configuration
export const REPORT_SECTIONS = {
  // User Sections
  user_metrics: {
    title: 'User Metrics',
    metrics: [
      'total_users',
      'new_users',
      'active_users',
      'verified_users',
      'user_growth_rate',
    ],
  },
  
  user_growth: {
    title: 'User Growth',
    metrics: ['new_signups', 'activation_rate', 'growth_rate'],
  },
  
  user_demographics: {
    title: 'User Demographics',
    metrics: ['users_by_role', 'users_by_location', 'users_by_type'],
  },
  
  user_activity: {
    title: 'User Activity',
    metrics: ['active_users', 'session_count', 'average_session_duration'],
  },
  
  user_retention: {
    title: 'User Retention',
    metrics: ['retention_rate', 'churn_rate', 'returning_users'],
  },
  
  // Property Sections
  property_metrics: {
    title: 'Property Metrics',
    metrics: [
      'total_properties',
      'active_listings',
      'rented_properties',
      'average_property_price',
    ],
  },
  
  active_listings: {
    title: 'Active Listings',
    metrics: ['total_active', 'new_listings', 'expired_listings'],
  },
  
  property_views: {
    title: 'Property Views',
    metrics: ['total_views', 'unique_viewers', 'average_views_per_property'],
  },
  
  rental_conversions: {
    title: 'Rental Conversions',
    metrics: ['conversion_rate', 'average_time_to_rent', 'total_rentals'],
  },
  
  // Revenue Sections
  revenue_metrics: {
    title: 'Revenue Metrics',
    metrics: [
      'total_revenue',
      'commission_earned',
      'platform_fees',
      'revenue_growth_rate',
    ],
  },
  
  total_revenue: {
    title: 'Total Revenue',
    metrics: ['gross_revenue', 'net_revenue', 'revenue_by_period'],
  },
  
  revenue_by_source: {
    title: 'Revenue by Source',
    metrics: [
      'rent_payments',
      'marking_fees',
      'premium_subscriptions',
      'other_revenue',
    ],
  },
  
  commission_breakdown: {
    title: 'Commission Breakdown',
    metrics: [
      'platform_commission',
      'agent_commission',
      'sub_agent_commission',
    ],
  },
  
  // Engagement Sections
  engagement_metrics: {
    title: 'Engagement Metrics',
    metrics: ['page_views', 'session_count', 'bounce_rate', 'time_on_site'],
  },
} as const;

// Report Format Options
export const REPORT_FORMAT_OPTIONS = {
  CSV: {
    extension: 'csv',
    mimeType: 'text/csv',
    maxSize: 50, // MB
  },
  PDF: {
    extension: 'pdf',
    mimeType: 'application/pdf',
    maxSize: 20, // MB
  },
  EXCEL: {
    extension: 'xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    maxSize: 50, // MB
  },
  JSON: {
    extension: 'json',
    mimeType: 'application/json',
    maxSize: 100, // MB
  },
} as const;

// Report Priority Levels
export const REPORT_PRIORITIES = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export type ReportPriority = (typeof REPORT_PRIORITIES)[keyof typeof REPORT_PRIORITIES];

// Report Retention Periods (in days)
export const REPORT_RETENTION = {
  DAILY: 30,
  WEEKLY: 90,
  MONTHLY: 365,
  QUARTERLY: 730, // 2 years
  YEARLY: 2555, // 7 years
  CUSTOM: 90,
} as const;

// Report Generation Limits
export const GENERATION_LIMITS = {
  MAX_CONCURRENT_REPORTS: 5,
  MAX_REPORT_SIZE_MB: 100,
  MAX_DATA_POINTS: 100000,
  TIMEOUT_MINUTES: 30,
  MAX_SCHEDULED_REPORTS_PER_USER: 10,
} as const;

// Report Email Templates
export const EMAIL_TEMPLATES = {
  REPORT_READY: {
    subject: 'Your {{reportName}} is Ready',
    template: 'report_ready',
  },
  REPORT_FAILED: {
    subject: 'Report Generation Failed: {{reportName}}',
    template: 'report_failed',
  },
  SCHEDULED_REPORT: {
    subject: '{{frequency}} Report: {{reportName}}',
    template: 'scheduled_report',
  },
} as const;

// Report Visualization Defaults
export const VISUALIZATION_DEFAULTS = {
  chartHeight: 400,
  chartWidth: 800,
  maxDataPoints: 100,
  colorScheme: 'default',
  showLegend: true,
  showGrid: true,
  animationDuration: 300,
} as const;

// Report Access Levels
export const ACCESS_LEVELS = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  VIEWER: 'viewer',
  CUSTOM: 'custom',
} as const;

export type AccessLevel = (typeof ACCESS_LEVELS)[keyof typeof ACCESS_LEVELS];

// Report Categories
export const REPORT_CATEGORIES = {
  PLATFORM: 'platform',
  USERS: 'users',
  PROPERTIES: 'properties',
  REVENUE: 'revenue',
  AGENTS: 'agents',
  MARKING: 'marking',
  PAYMENTS: 'payments',
  CONVERSIONS: 'conversions',
  ENGAGEMENT: 'engagement',
  CUSTOM: 'custom',
} as const;

export type ReportCategory =
  (typeof REPORT_CATEGORIES)[keyof typeof REPORT_CATEGORIES];

// Default Report Configuration
export const DEFAULT_REPORT_CONFIG = {
  frequency: REPORT_FREQUENCIES.MONTHLY,
  format: 'pdf',
  deliveryMethod: DELIVERY_METHODS.EMAIL,
  includeCharts: true,
  includeRawData: false,
  autoDelete: true,
  retentionDays: 90,
  timezone: 'Africa/Lagos',
  locale: 'en-NG',
};

// Report Footer Content
export const REPORT_FOOTER = {
  disclaimer:
    'This report is confidential and intended solely for internal use by Newcondo.',
  confidentiality:
    'The information contained in this report is proprietary and confidential.',
  contact: 'For questions about this report, contact support@newcondo.com',
  copyright: `© ${new Date().getFullYear()} Newcondo. All rights reserved.`,
};

export default {
  REPORT_FREQUENCIES,
  REPORT_STATUS,
  DELIVERY_METHODS,
  REPORT_TEMPLATES,
  REPORT_SECTIONS,
  REPORT_FORMAT_OPTIONS,
  REPORT_PRIORITIES,
  REPORT_RETENTION,
  GENERATION_LIMITS,
  EMAIL_TEMPLATES,
  VISUALIZATION_DEFAULTS,
  ACCESS_LEVELS,
  REPORT_CATEGORIES,
  DEFAULT_REPORT_CONFIG,
  REPORT_FOOTER,
};