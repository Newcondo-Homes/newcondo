// apps/admin/src/lib/validations/analyticsSchema.ts

import { z } from 'zod';

/**
 * Date range validation schema
 */
export const dateRangeSchema = z.object({
  startDate: z.coerce.date({
    required_error: 'Start date is required',
    invalid_type_error: 'Invalid start date',
  }),
  endDate: z.coerce.date({
    required_error: 'End date is required',
    invalid_type_error: 'Invalid end date',
  }),
}).refine(
  (data) => data.endDate >= data.startDate,
  {
    message: 'End date must be after or equal to start date',
    path: ['endDate'],
  }
);

/**
 * Analytics query schema
 */
export const analyticsQuerySchema = z.object({
  period: z.enum(['today', 'week', 'month', 'year', 'custom'], {
    required_error: 'Period is required',
  }),
  dateRange: dateRangeSchema.optional(),
  metrics: z.array(z.string()).min(1, 'At least one metric is required'),
  granularity: z.enum(['hour', 'day', 'week', 'month', 'year']).optional(),
  groupBy: z.string().optional(),
  filters: z.record(z.any()).optional(),
}).refine(
  (data) => {
    if (data.period === 'custom') {
      return !!data.dateRange;
    }
    return true;
  },
  {
    message: 'Date range is required for custom period',
    path: ['dateRange'],
  }
);

/**
 * Revenue analytics schema
 */
export const revenueAnalyticsSchema = z.object({
  period: z.enum(['today', 'week', 'month', 'year', 'custom']),
  dateRange: dateRangeSchema.optional(),
  includeCommissions: z.boolean().default(true),
  includeMarkingFees: z.boolean().default(true),
  includeTransactionFees: z.boolean().default(true),
  groupBy: z.enum(['day', 'week', 'month', 'property', 'agent']).optional(),
});

/**
 * User analytics schema
 */
export const userAnalyticsSchema = z.object({
  period: z.enum(['today', 'week', 'month', 'year', 'custom']),
  dateRange: dateRangeSchema.optional(),
  userType: z.enum(['all', 'OWNER', 'AGENT', 'RENTER']).default('all'),
  includeVerificationStatus: z.boolean().default(true),
  includeActivityMetrics: z.boolean().default(true),
});

/**
 * Property analytics schema
 */
export const propertyAnalyticsSchema = z.object({
  period: z.enum(['today', 'week', 'month', 'year', 'custom']),
  dateRange: dateRangeSchema.optional(),
  propertyStatus: z.enum(['all', 'DRAFT', 'PENDING', 'PUBLISHED', 'RENTED', 'UNAVAILABLE']).default('all'),
  propertyType: z.enum(['all', 'APARTMENT', 'HOUSE', 'DUPLEX', 'ROOM', 'SHARED_APARTMENT', 'OFFICE', 'SHOP', 'WAREHOUSE']).default('all'),
  location: z.string().optional(),
  includeOccupancyRate: z.boolean().default(true),
});

/**
 * Agent performance schema
 */
export const agentPerformanceSchema = z.object({
  period: z.enum(['today', 'week', 'month', 'year', 'custom']),
  dateRange: dateRangeSchema.optional(),
  agentId: z.string().optional(),
  minPerformanceScore: z.number().min(0).max(100).optional(),
  includeMarkingJobs: z.boolean().default(true),
  includeListings: z.boolean().default(true),
  includeCommissions: z.boolean().default(true),
});

/**
 * Transaction analytics schema
 */
export const transactionAnalyticsSchema = z.object({
  period: z.enum(['today', 'week', 'month', 'year', 'custom']),
  dateRange: dateRangeSchema.optional(),
  transactionType: z.enum(['all', 'RENT', 'DEPOSIT', 'AGENT_COMMISSION', 'PREMIUM_UPGRADE', 'PROPERTY_MARKING']).default('all'),
  paymentStatus: z.enum(['all', 'PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED', 'HELD', 'RELEASED']).default('all'),
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().min(0).optional(),
}).refine(
  (data) => {
    if (data.minAmount !== undefined && data.maxAmount !== undefined) {
      return data.maxAmount >= data.minAmount;
    }
    return true;
  },
  {
    message: 'Maximum amount must be greater than or equal to minimum amount',
    path: ['maxAmount'],
  }
);

/**
 * Comparison analytics schema
 */
export const comparisonAnalyticsSchema = z.object({
  currentPeriod: dateRangeSchema,
  previousPeriod: dateRangeSchema,
  metrics: z.array(z.string()).min(1, 'At least one metric is required'),
  includePercentageChange: z.boolean().default(true),
});

/**
 * Dashboard overview schema
 */
export const dashboardOverviewSchema = z.object({
  period: z.enum(['today', 'week', 'month', 'year']),
  includeCharts: z.boolean().default(true),
  includeTopPerformers: z.boolean().default(true),
  includeRecentActivity: z.boolean().default(true),
  topPerformersLimit: z.number().min(1).max(50).default(10),
});

/**
 * Cohort analysis schema
 */
export const cohortAnalysisSchema = z.object({
  cohortType: z.enum(['registration', 'first_payment', 'first_listing']),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  metric: z.enum(['retention', 'revenue', 'activity']),
  periodSize: z.enum(['week', 'month']),
});

/**
 * Funnel analysis schema
 */
export const funnelAnalysisSchema = z.object({
  funnelType: z.enum(['user_registration', 'property_listing', 'rental_process']),
  period: z.enum(['today', 'week', 'month', 'year', 'custom']),
  dateRange: dateRangeSchema.optional(),
  includeDropoffReasons: z.boolean().default(true),
});

/**
 * Export analytics schema
 */
export const exportAnalyticsSchema = z.object({
  format: z.enum(['csv', 'pdf', 'excel']),
  dataType: z.enum(['summary', 'detailed', 'both']),
  includeCharts: z.boolean().default(true),
  query: analyticsQuerySchema,
});

/**
 * Real-time analytics schema
 */
export const realTimeAnalyticsSchema = z.object({
  metrics: z.array(z.enum([
    'active_users',
    'ongoing_transactions',
    'recent_listings',
    'active_agents',
    'pending_verifications',
  ])),
  refreshInterval: z.number().min(5000).max(60000).default(10000), // 5s to 60s
});

/**
 * Custom metric schema
 */
export const customMetricSchema = z.object({
  name: z.string().min(1, 'Metric name is required'),
  type: z.enum(['count', 'sum', 'average', 'percentage', 'ratio']),
  sourceTable: z.string().min(1, 'Source table is required'),
  sourceField: z.string().optional(),
  filters: z.record(z.any()).optional(),
  groupBy: z.string().optional(),
  description: z.string().optional(),
});

/**
 * Alert threshold schema
 */
export const alertThresholdSchema = z.object({
  metricName: z.string().min(1, 'Metric name is required'),
  operator: z.enum(['greater_than', 'less_than', 'equals', 'not_equals']),
  threshold: z.number(),
  severity: z.enum(['info', 'warning', 'critical']),
  notifyEmail: z.boolean().default(true),
  notifySMS: z.boolean().default(false),
});

/**
 * Pagination schema for analytics
 */
export const analyticsPaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Type exports
 */
export type DateRangeInput = z.infer<typeof dateRangeSchema>;
export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;
export type RevenueAnalyticsInput = z.infer<typeof revenueAnalyticsSchema>;
export type UserAnalyticsInput = z.infer<typeof userAnalyticsSchema>;
export type PropertyAnalyticsInput = z.infer<typeof propertyAnalyticsSchema>;
export type AgentPerformanceInput = z.infer<typeof agentPerformanceSchema>;
export type TransactionAnalyticsInput = z.infer<typeof transactionAnalyticsSchema>;
export type ComparisonAnalyticsInput = z.infer<typeof comparisonAnalyticsSchema>;
export type DashboardOverviewInput = z.infer<typeof dashboardOverviewSchema>;
export type CohortAnalysisInput = z.infer<typeof cohortAnalysisSchema>;
export type FunnelAnalysisInput = z.infer<typeof funnelAnalysisSchema>;
export type ExportAnalyticsInput = z.infer<typeof exportAnalyticsSchema>;
export type RealTimeAnalyticsInput = z.infer<typeof realTimeAnalyticsSchema>;
export type CustomMetricInput = z.infer<typeof customMetricSchema>;
export type AlertThresholdInput = z.infer<typeof alertThresholdSchema>;
export type AnalyticsPaginationInput = z.infer<typeof analyticsPaginationSchema>;