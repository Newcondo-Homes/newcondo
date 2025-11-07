// apps/admin/src/lib/constants/reportTemplates.ts

import type { 
  RevenueReportInput, 
  TransactionReportInput, 
  UserReportInput,
  PropertyReportInput,
  AgentPerformanceReportInput 
} from '../validations/reportSchema';

/**
 * Default revenue report template
 */
export const DEFAULT_REVENUE_REPORT: Partial<RevenueReportInput> = {
  title: 'Revenue Report',
  description: 'Comprehensive revenue analysis and breakdown',
  reportType: 'revenue',
  format: 'pdf',
  period: 'month',
  includeCharts: true,
  includeSummary: true,
  includeDetails: true,
  breakdown: {
    byPaymentType: true,
    byAgent: true,
    byProperty: false,
    byLocation: true,
  },
  includeCommissionSplit: true,
  includeTransactionFees: true,
  includeProjections: false,
};

/**
 * Monthly performance report template
 */
export const MONTHLY_PERFORMANCE_REPORT: Partial<RevenueReportInput> = {
  title: 'Monthly Performance Report',
  description: 'Complete platform performance for the month',
  reportType: 'revenue',
  format: 'pdf',
  period: 'month',
  includeCharts: true,
  includeSummary: true,
  includeDetails: true,
  breakdown: {
    byPaymentType: true,
    byAgent: true,
    byProperty: true,
    byLocation: true,
  },
  includeCommissionSplit: true,
  includeTransactionFees: true,
  includeProjections: true,
};

/**
 * Transaction analysis report template
 */
export const TRANSACTION_ANALYSIS_REPORT: Partial<TransactionReportInput> = {
  title: 'Transaction Analysis Report',
  description: 'Detailed analysis of all transactions',
  reportType: 'transactions',
  format: 'excel',
  period: 'month',
  transactionTypes: ['RENT', 'PROPERTY_MARKING'],
  includeFailureAnalysis: true,
  includeRefundSummary: true,
  includeCharts: true,
  includeSummary: true,
  includeDetails: true,
};

/**
 * User growth report template
 */
export const USER_GROWTH_REPORT: Partial<UserReportInput> = {
  title: 'User Growth Report',
  description: 'User acquisition and engagement metrics',
  reportType: 'users',
  format: 'pdf',
  period: 'month',
  verificationStatus: 'all',
  includeActivityMetrics: true,
  includeRegistrationTrends: true,
  includeGeographicDistribution: true,
  includeEngagementMetrics: true,
  includeCharts: true,
  includeSummary: true,
  includeDetails: false,
};

/**
 * Property listing report template
 */
export const PROPERTY_LISTING_REPORT: Partial<PropertyReportInput> = {
  title: 'Property Listing Report',
  description: 'Overview of all property listings',
  reportType: 'properties',
  format: 'excel',
  period: 'month',
  includeOccupancyRate: true,
  includeListingPerformance: true,
  includePricingAnalysis: true,
  includeTimeToRent: true,
  includeCharts: true,
  includeSummary: true,
  includeDetails: true,
};

/**
 * Agent commission report template
 */
export const AGENT_COMMISSION_REPORT: Partial<AgentPerformanceReportInput> = {
  title: 'Agent Commission Report',
  description: 'Agent earnings and commission breakdown',
  reportType: 'agents',
  format: 'excel',
  period: 'month',
  includeListingMetrics: false,
  includeMarkingJobMetrics: false,
  includeCommissionEarnings: true,
  includeRatings: false,
  includeResponseTimes: false,
  rankBy: 'total_earnings',
  includeCharts: true,
  includeSummary: true,
  includeDetails: true,
};

/**
 * Weekly summary report template
 */
export const WEEKLY_SUMMARY_REPORT = {
  title: 'Weekly Summary',
  description: 'Quick overview of platform activity',
  reportType: 'platform_overview',
  format: 'pdf',
  period: 'week',
  sections: {
    userMetrics: true,
    propertyMetrics: true,
    revenueMetrics: true,
    transactionMetrics: true,
    agentMetrics: true,
    growthMetrics: true,
    systemHealth: false,
  },
  compareWithPreviousPeriod: true,
  includeProjections: false,
  includeKeyInsights: true,
  includeCharts: true,
  includeSummary: true,
  includeDetails: false,
};

/**
 * Quarterly business review template
 */
export const QUARTERLY_BUSINESS_REVIEW = {
  title: 'Quarterly Business Review',
  description: 'Comprehensive quarterly performance analysis',
  reportType: 'platform_overview',
  format: 'pdf',
  period: 'quarter',
  sections: {
    userMetrics: true,
    propertyMetrics: true,
    revenueMetrics: true,
    transactionMetrics: true,
    agentMetrics: true,
    growthMetrics: true,
    systemHealth: true,
  },
  compareWithPreviousPeriod: true,
  includeProjections: true,
  includeKeyInsights: true,
  includeCharts: true,
  includeSummary: true,
  includeDetails: true,
};

/**
 * Daily operations report template
 */
export const DAILY_OPERATIONS_REPORT = {
  title: 'Daily Operations Report',
  description: 'Daily platform activity and alerts',
  reportType: 'platform_overview',
  format: 'pdf',
  period: 'today',
  sections: {
    userMetrics: true,
    propertyMetrics: true,
    revenueMetrics: true,
    transactionMetrics: true,
    agentMetrics: true,
    growthMetrics: false,
    systemHealth: true,
  },
  compareWithPreviousPeriod: true,
  includeProjections: false,
  includeKeyInsights: true,
  includeCharts: false,
  includeSummary: true,
  includeDetails: false,
};

/**
 * Failed transactions report template
 */
export const FAILED_TRANSACTIONS_REPORT: Partial<TransactionReportInput> = {
  title: 'Failed Transactions Report',
  description: 'Analysis of failed payment transactions',
  reportType: 'transactions',
  format: 'excel',
  period: 'week',
  paymentStatuses: ['FAILED'],
  includeFailureAnalysis: true,
  includeRefundSummary: false,
  includeCharts: true,
  includeSummary: true,
  includeDetails: true,
};

/**
 * Top performers report template
 */
export const TOP_PERFORMERS_REPORT: Partial<AgentPerformanceReportInput> = {
  title: 'Top Performers Report',
  description: 'Top performing agents this period',
  reportType: 'agents',
  format: 'pdf',
  period: 'month',
  minPerformanceScore: 70,
  includeListingMetrics: true,
  includeMarkingJobMetrics: true,
  includeCommissionEarnings: true,
  includeRatings: true,
  includeResponseTimes: true,
  rankBy: 'performance_score',
  includeCharts: true,
  includeSummary: true,
  includeDetails: true,
};

/**
 * Verification backlog report template
 */
export const VERIFICATION_BACKLOG_REPORT = {
  title: 'Verification Backlog Report',
  description: 'Pending verification requests analysis',
  reportType: 'verification',
  format: 'excel',
  period: 'week',
  verificationStatuses: ['PENDING'],
  includeProcessingTimes: true,
  includeRejectionReasons: false,
  includeBacklog: true,
  includeCharts: true,
  includeSummary: true,
  includeDetails: true,
};

/**
 * Geographic distribution report template
 */
export const GEOGRAPHIC_DISTRIBUTION_REPORT: Partial<PropertyReportInput> = {
  title: 'Geographic Distribution Report',
  description: 'Properties and users by location',
  reportType: 'properties',
  format: 'pdf',
  period: 'month',
  includeOccupancyRate: true,
  includeListingPerformance: false,
  includePricingAnalysis: true,
  includeTimeToRent: false,
  includeCharts: true,
  includeSummary: true,
  includeDetails: true,
};

/**
 * Report template categories
 */
export const REPORT_TEMPLATE_CATEGORIES = {
  EXECUTIVE: [
    MONTHLY_PERFORMANCE_REPORT,
    QUARTERLY_BUSINESS_REVIEW,
    WEEKLY_SUMMARY_REPORT,
  ],
  FINANCIAL: [
    DEFAULT_REVENUE_REPORT,
    AGENT_COMMISSION_REPORT,
    TRANSACTION_ANALYSIS_REPORT,
  ],
  OPERATIONAL: [
    DAILY_OPERATIONS_REPORT,
    VERIFICATION_BACKLOG_REPORT,
    FAILED_TRANSACTIONS_REPORT,
  ],
  ANALYTICS: [
    USER_GROWTH_REPORT,
    PROPERTY_LISTING_REPORT,
    GEOGRAPHIC_DISTRIBUTION_REPORT,
    TOP_PERFORMERS_REPORT,
  ],
} as const;

/**
 * Report template metadata
 */
export const REPORT_TEMPLATE_METADATA = {
  'monthly-performance': {
    name: 'Monthly Performance Report',
    description: 'Complete platform performance for the month',
    category: 'EXECUTIVE',
    template: MONTHLY_PERFORMANCE_REPORT,
    frequency: 'monthly',
    estimatedGenerationTime: '30-60 seconds',
  },
  'quarterly-business-review': {
    name: 'Quarterly Business Review',
    description: 'Comprehensive quarterly performance analysis',
    category: 'EXECUTIVE',
    template: QUARTERLY_BUSINESS_REVIEW,
    frequency: 'quarterly',
    estimatedGenerationTime: '1-2 minutes',
  },
  'revenue-report': {
    name: 'Revenue Report',
    description: 'Comprehensive revenue analysis and breakdown',
    category: 'FINANCIAL',
    template: DEFAULT_REVENUE_REPORT,
    frequency: 'monthly',
    estimatedGenerationTime: '30-60 seconds',
  },
  'user-growth': {
    name: 'User Growth Report',
    description: 'User acquisition and engagement metrics',
    category: 'ANALYTICS',
    template: USER_GROWTH_REPORT,
    frequency: 'monthly',
    estimatedGenerationTime: '30-45 seconds',
  },
  'property-listing': {
    name: 'Property Listing Report',
    description: 'Overview of all property listings',
    category: 'ANALYTICS',
    template: PROPERTY_LISTING_REPORT,
    frequency: 'monthly',
    estimatedGenerationTime: '45-60 seconds',
  },
  'agent-commission': {
    name: 'Agent Commission Report',
    description: 'Agent earnings and commission breakdown',
    category: 'FINANCIAL',
    template: AGENT_COMMISSION_REPORT,
    frequency: 'monthly',
    estimatedGenerationTime: '30-45 seconds',
  },
  'daily-operations': {
    name: 'Daily Operations Report',
    description: 'Daily platform activity and alerts',
    category: 'OPERATIONAL',
    template: DAILY_OPERATIONS_REPORT,
    frequency: 'daily',
    estimatedGenerationTime: '15-30 seconds',
  },
} as const;

/**
 * Get report template by key
 */
export const getReportTemplate = (key: keyof typeof REPORT_TEMPLATE_METADATA) => {
  return REPORT_TEMPLATE_METADATA[key];
};

/**
 * Get all templates by category
 */
export const getTemplatesByCategory = (category: keyof typeof REPORT_TEMPLATE_CATEGORIES) => {
  return REPORT_TEMPLATE_CATEGORIES[category];
};