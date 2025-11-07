// apps/admin/src/lib/validations/reportSchema.ts

import { z } from 'zod';
import { dateRangeSchema } from './analyticsSchema';

/**
 * Report type enum
 */
export const reportTypeEnum = z.enum([
  'revenue',
  'transactions',
  'users',
  'properties',
  'agents',
  'commissions',
  'marking_jobs',
  'verification',
  'platform_overview',
  'custom',
]);

/**
 * Report format enum
 */
export const reportFormatEnum = z.enum(['pdf', 'csv', 'excel', 'json']);

/**
 * Base report schema
 */
export const baseReportSchema = z.object({
  title: z.string().min(1, 'Report title is required').max(200),
  description: z.string().max(500).optional(),
  reportType: reportTypeEnum,
  format: reportFormatEnum,
  period: z.enum(['today', 'week', 'month', 'quarter', 'year', 'custom']),
  dateRange: dateRangeSchema.optional(),
  includeCharts: z.boolean().default(true),
  includeSummary: z.boolean().default(true),
  includeDetails: z.boolean().default(true),
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
 * Revenue report schema
 */
export const revenueReportSchema = baseReportSchema.extend({
  reportType: z.literal('revenue'),
  breakdown: z.object({
    byPaymentType: z.boolean().default(true),
    byAgent: z.boolean().default(true),
    byProperty: z.boolean().default(false),
    byLocation: z.boolean().default(true),
  }).optional(),
  includeCommissionSplit: z.boolean().default(true),
  includeTransactionFees: z.boolean().default(true),
  includeProjections: z.boolean().default(false),
});

/**
 * Transaction report schema
 */
export const transactionReportSchema = baseReportSchema.extend({
  reportType: z.literal('transactions'),
  transactionTypes: z.array(
    z.enum(['RENT', 'DEPOSIT', 'AGENT_COMMISSION', 'PREMIUM_UPGRADE', 'PROPERTY_MARKING'])
  ).default(['RENT', 'PROPERTY_MARKING']),
  paymentStatuses: z.array(
    z.enum(['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED', 'HELD', 'RELEASED'])
  ).optional(),
  includeFailureAnalysis: z.boolean().default(true),
  includeRefundSummary: z.boolean().default(true),
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().min(0).optional(),
});

/**
 * User report schema
 */
export const userReportSchema = baseReportSchema.extend({
  reportType: z.literal('users'),
  userTypes: z.array(z.enum(['OWNER', 'AGENT', 'RENTER', 'ADMIN'])).optional(),
  verificationStatus: z.enum(['all', 'PENDING', 'VERIFIED', 'REJECTED']).default('all'),
  includeActivityMetrics: z.boolean().default(true),
  includeRegistrationTrends: z.boolean().default(true),
  includeGeographicDistribution: z.boolean().default(true),
  includeEngagementMetrics: z.boolean().default(true),
});

/**
 * Property report schema
 */
export const propertyReportSchema = baseReportSchema.extend({
  reportType: z.literal('properties'),
  propertyTypes: z.array(
    z.enum(['APARTMENT', 'HOUSE', 'DUPLEX', 'ROOM', 'SHARED_APARTMENT', 'OFFICE', 'SHOP', 'WAREHOUSE'])
  ).optional(),
  propertyStatuses: z.array(
    z.enum(['DRAFT', 'PENDING', 'PUBLISHED', 'RENTED', 'UNAVAILABLE'])
  ).optional(),
  locations: z.array(z.string()).optional(),
  includeOccupancyRate: z.boolean().default(true),
  includeListingPerformance: z.boolean().default(true),
  includePricingAnalysis: z.boolean().default(true),
  includeTimeToRent: z.boolean().default(true),
});

/**
 * Agent performance report schema
 */
export const agentPerformanceReportSchema = baseReportSchema.extend({
  reportType: z.literal('agents'),
  agentIds: z.array(z.string()).optional(),
  minPerformanceScore: z.number().min(0).max(100).optional(),
  includeListingMetrics: z.boolean().default(true),
  includeMarkingJobMetrics: z.boolean().default(true),
  includeCommissionEarnings: z.boolean().default(true),
  includeRatings: z.boolean().default(true),
  includeResponseTimes: z.boolean().default(true),
  rankBy: z.enum(['total_earnings', 'performance_score', 'completed_jobs', 'listings']).default('total_earnings'),
});

/**
 * Commission report schema
 */
export const commissionReportSchema = baseReportSchema.extend({
  reportType: z.literal('commissions'),
  recipientType: z.enum(['all', 'platform', 'agents', 'listing_agents', 'sub_agents']).default('all'),
  includeUnpaidCommissions: z.boolean().default(true),
  includePaidCommissions: z.boolean().default(true),
  groupBy: z.enum(['agent', 'property', 'month', 'payment_type']).default('agent'),
});

/**
 * Marking job report schema
 */
export const markingJobReportSchema = baseReportSchema.extend({
  reportType: z.literal('marking_jobs'),
  jobStatuses: z.array(
    z.enum(['QUEUED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED'])
  ).optional(),
  includeQueueMetrics: z.boolean().default(true),
  includeCompletionTimes: z.boolean().default(true),
  includeAgentPerformance: z.boolean().default(true),
  includeRevenue: z.boolean().default(true),
});

/**
 * Verification report schema
 */
export const verificationReportSchema = baseReportSchema.extend({
  reportType: z.literal('verification'),
  documentTypes: z.array(
    z.enum(['NIN', 'BVN', 'PASSPORT', 'VOTERS_CARD', 'DRIVERS_LICENSE', 'SELFIE', 'OWNERSHIP_DOCUMENT', 'CONSENT_DOCUMENT'])
  ).optional(),
  verificationStatuses: z.array(
    z.enum(['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'])
  ).optional(),
  includeProcessingTimes: z.boolean().default(true),
  includeRejectionReasons: z.boolean().default(true),
  includeBacklog: z.boolean().default(true),
});

/**
 * Platform overview report schema
 */
export const platformOverviewReportSchema = baseReportSchema.extend({
  reportType: z.literal('platform_overview'),
  sections: z.object({
    userMetrics: z.boolean().default(true),
    propertyMetrics: z.boolean().default(true),
    revenueMetrics: z.boolean().default(true),
    transactionMetrics: z.boolean().default(true),
    agentMetrics: z.boolean().default(true),
    growthMetrics: z.boolean().default(true),
    systemHealth: z.boolean().default(true),
  }),
  compareWithPreviousPeriod: z.boolean().default(true),
  includeProjections: z.boolean().default(true),
  includeKeyInsights: z.boolean().default(true),
});

/**
 * Custom report schema
 */
export const customReportSchema = baseReportSchema.extend({
  reportType: z.literal('custom'),
  dataSource: z.enum(['users', 'properties', 'payments', 'rentals', 'marking_jobs', 'virtual_accounts']),
  fields: z.array(z.string()).min(1, 'At least one field is required'),
  filters: z.record(z.any()).optional(),
  groupBy: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  aggregations: z.array(z.object({
    field: z.string(),
    operation: z.enum(['count', 'sum', 'average', 'min', 'max']),
    alias: z.string().optional(),
  })).optional(),
});

/**
 * Scheduled report schema
 */
export const scheduledReportSchema = z.object({
  reportConfig: z.union([
    revenueReportSchema,
    transactionReportSchema,
    userReportSchema,
    propertyReportSchema,
    agentPerformanceReportSchema,
    commissionReportSchema,
    markingJobReportSchema,
    verificationReportSchema,
    platformOverviewReportSchema,
    customReportSchema,
  ]),
  schedule: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly']),
    dayOfWeek: z.number().min(0).max(6).optional(), // For weekly reports
    dayOfMonth: z.number().min(1).max(31).optional(), // For monthly reports
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    timezone: z.string().default('Africa/Lagos'),
  }),
  recipients: z.array(z.object({
    email: z.string().email('Invalid email address'),
    name: z.string().optional(),
  })).min(1, 'At least one recipient is required'),
  isActive: z.boolean().default(true),
});

/**
 * Report template schema
 */
export const reportTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(100),
  description: z.string().max(500).optional(),
  reportConfig: z.union([
    revenueReportSchema,
    transactionReportSchema,
    userReportSchema,
    propertyReportSchema,
    agentPerformanceReportSchema,
    commissionReportSchema,
    markingJobReportSchema,
    verificationReportSchema,
    platformOverviewReportSchema,
    customReportSchema,
  ]),
  isPublic: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
});

/**
 * Report generation request schema
 */
export const reportGenerationRequestSchema = z.object({
  reportId: z.string().optional(), // For template-based reports
  reportConfig: z.union([
    revenueReportSchema,
    transactionReportSchema,
    userReportSchema,
    propertyReportSchema,
    agentPerformanceReportSchema,
    commissionReportSchema,
    markingJobReportSchema,
    verificationReportSchema,
    platformOverviewReportSchema,
    customReportSchema,
  ]).optional(),
  generateAsync: z.boolean().default(false), // For large reports
  notifyOnCompletion: z.boolean().default(true),
}).refine(
  (data) => data.reportId || data.reportConfig,
  {
    message: 'Either reportId or reportConfig must be provided',
  }
);

/**
 * Type exports
 */
export type ReportType = z.infer<typeof reportTypeEnum>;
export type ReportFormat = z.infer<typeof reportFormatEnum>;
export type BaseReportInput = z.infer<typeof baseReportSchema>;
export type RevenueReportInput = z.infer<typeof revenueReportSchema>;
export type TransactionReportInput = z.infer<typeof transactionReportSchema>;
export type UserReportInput = z.infer<typeof userReportSchema>;
export type PropertyReportInput = z.infer<typeof propertyReportSchema>;
export type AgentPerformanceReportInput = z.infer<typeof agentPerformanceReportSchema>;
export type CommissionReportInput = z.infer<typeof commissionReportSchema>;
export type MarkingJobReportInput = z.infer<typeof markingJobReportSchema>;
export type VerificationReportInput = z.infer<typeof verificationReportSchema>;
export type PlatformOverviewReportInput = z.infer<typeof platformOverviewReportSchema>;
export type CustomReportInput = z.infer<typeof customReportSchema>;
export type ScheduledReportInput = z.infer<typeof scheduledReportSchema>;
export type ReportTemplateInput = z.infer<typeof reportTemplateSchema>;
export type ReportGenerationRequestInput = z.infer<typeof reportGenerationRequestSchema>;