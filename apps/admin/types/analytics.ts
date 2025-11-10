/**
 * Admin Dashboard - Analytics Types
 * Location: apps/admin/src/types/analytics.ts
 */

export interface PlatformAnalytics {
  period: AnalyticsPeriod;
  startDate: Date;
  endDate: Date;
  
  // User metrics
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  verifiedUsers: number;
  premiumUsers: number;
  
  // Property metrics
  totalProperties: number;
  newProperties: number;
  publishedProperties: number;
  rentedProperties: number;
  
  // Financial metrics
  totalRevenue: number;
  platformFees: number;
  agentCommissions: number;
  averageTransactionValue: number;
  
  // Engagement metrics
  propertyViews: number;
  searchQueries: number;
  averageSessionDuration: number;
  bounceRate: number;
}

export interface UserAnalytics {
  period: AnalyticsPeriod;
  startDate: Date;
  endDate: Date;
  
  // Registration
  totalRegistrations: number;
  registrationsByRole: {
    role: string;
    count: number;
  }[];
  registrationTrend: TimeSeriesData[];
  
  // Verification
  verificationRate: number;
  averageVerificationTime: number; // hours
  verificationsByStatus: {
    status: string;
    count: number;
  }[];
  
  // Activity
  activeUsers: number;
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  
  // Retention
  retentionRate: number;
  churnRate: number;
  
  // Geography
  usersByState: {
    state: string;
    count: number;
  }[];
  usersByCity: {
    city: string;
    count: number;
  }[];
}

export interface PropertyAnalytics {
  period: AnalyticsPeriod;
  startDate: Date;
  endDate: Date;
  
  // Listings
  totalListings: number;
  newListings: number;
  publishedListings: number;
  rentedListings: number;
  
  // By type
  listingsByType: {
    type: string;
    count: number;
  }[];
  
  // By structure
  listingsByStructure: {
    structure: string;
    count: number;
  }[];
  
  // Pricing
  averagePrice: number;
  medianPrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  
  // Location
  listingsByState: {
    state: string;
    count: number;
  }[];
  listingsByCity: {
    city: string;
    count: number;
  }[];
  
  // Boundary
  boundaryVerificationRate: number;
  duplicateDetectionRate: number;
  
  // Performance
  averageViewsPerProperty: number;
  averageTimeToRent: number; // days
  listingTrend: TimeSeriesData[];
}

export interface PaymentAnalytics {
  period: AnalyticsPeriod;
  startDate: Date;
  endDate: Date;
  
  // Revenue
  totalRevenue: number;
  platformFees: number;
  agentCommissions: number;
  ownerPayouts: number;
  
  // Transactions
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  successRate: number;
  
  // By type
  revenueByPaymentType: {
    type: string;
    revenue: number;
    count: number;
  }[];
  
  // Trends
  revenueTrend: TimeSeriesData[];
  transactionTrend: TimeSeriesData[];
  
  // Averages
  averageTransactionValue: number;
  averageMarkingFee: number;
  averageRentPayment: number;
  
  // Virtual accounts
  totalVirtualAccounts: number;
  totalVirtualAccountBalance: number;
  
  // Refunds
  totalRefunds: number;
  refundRate: number;
}

export interface MarkingJobAnalytics {
  period: AnalyticsPeriod;
  startDate: Date;
  endDate: Date;
  
  // Jobs
  totalJobs: number;
  completedJobs: number;
  cancelledJobs: number;
  expiredJobs: number;
  completionRate: number;
  
  // Timing
  averageCompletionTime: number; // hours
  averageQueueTime: number; // hours
  averageAssignmentTime: number; // hours
  
  // By method
  jobsByMethod: {
    method: string;
    count: number;
  }[];
  
  // Agent performance
  totalAgents: number;
  activeAgents: number;
  averageJobsPerAgent: number;
  topPerformingAgents: {
    agentId: string;
    agentName: string | null;
    completedJobs: number;
    reliabilityScore: number | null;
  }[];
  
  // Geography
  jobsByState: {
    state: string;
    count: number;
  }[];
  
  // Trends
  jobTrend: TimeSeriesData[];
}

export interface DisputeAnalytics {
  period: AnalyticsPeriod;
  startDate: Date;
  endDate: Date;
  
  // Disputes
  totalDisputes: number;
  resolvedDisputes: number;
  pendingDisputes: number;
  resolutionRate: number;
  
  // By type
  disputesByType: {
    type: string;
    count: number;
  }[];
  
  // Timing
  averageResolutionTime: number; // hours
  
  // Duplicates
  totalDuplicates: number;
  confirmedDuplicates: number;
  duplicateRate: number;
  
  // Trends
  disputeTrend: TimeSeriesData[];
}

export interface SupportAnalytics {
  period: AnalyticsPeriod;
  startDate: Date;
  endDate: Date;
  
  // Tickets
  totalTickets: number;
  resolvedTickets: number;
  openTickets: number;
  resolutionRate: number;
  
  // By category
  ticketsByCategory: {
    category: string;
    count: number;
  }[];
  
  // By priority
  ticketsByPriority: {
    priority: string;
    count: number;
  }[];
  
  // Timing
  averageResponseTime: number; // hours
  averageResolutionTime: number; // hours
  
  // Trends
  ticketTrend: TimeSeriesData[];
}

export interface TimeSeriesData {
  date: Date;
  value: number;
  label?: string;
}

export enum AnalyticsPeriod {
  TODAY = "TODAY",
  YESTERDAY = "YESTERDAY",
  LAST_7_DAYS = "LAST_7_DAYS",
  LAST_30_DAYS = "LAST_30_DAYS",
  THIS_MONTH = "THIS_MONTH",
  LAST_MONTH = "LAST_MONTH",
  THIS_YEAR = "THIS_YEAR",
  CUSTOM = "CUSTOM",
}

export interface AnalyticsFilters {
  period: AnalyticsPeriod;
  startDate?: Date;
  endDate?: Date;
  compareWithPrevious?: boolean;
  groupBy?: "hour" | "day" | "week" | "month";
}

export interface ComparisonData {
  current: PlatformAnalytics;
  previous: PlatformAnalytics;
  changes: {
    metric: string;
    currentValue: number;
    previousValue: number;
    change: number;
    changePercentage: number;
  }[];
}

export interface DashboardMetrics {
  // Quick stats
  totalUsers: number;
  totalProperties: number;
  totalRevenue: number;
  activeRentals: number;
  
  // Changes from previous period
  usersChange: number;
  propertiesChange: number;
  revenueChange: number;
  rentalsChange: number;
  
  // Pending actions
  pendingVerifications: number;
  pendingProperties: number;
  openTickets: number;
  pendingMarkingJobs: number;
  boundaryDisputes: number;
  
  // Recent activity
  recentUsers: number; // Last 24h
  recentProperties: number; // Last 24h
  recentPayments: number; // Last 24h
  recentTickets: number; // Last 24h
}

export interface ReportConfig {
  type: "user" | "property" | "payment" | "marking" | "support" | "platform";
  period: AnalyticsPeriod;
  startDate?: Date;
  endDate?: Date;
  format: "pdf" | "excel" | "csv";
  includeCharts: boolean;
  includeComparison: boolean;
  recipients?: string[]; // Email addresses
}

export interface GeneratedReport {
  id: string;
  config: ReportConfig;
  fileUrl: string;
  generatedBy: string;
  generatedAt: Date;
  expiresAt: Date;
}












// // apps/admin/src/types/analytics.ts

// /**
//  * Base analytics response
//  */
// export interface AnalyticsResponse<T = any> {
//   success: boolean;
//   data: T;
//   metadata?: {
//     period: string;
//     startDate: string;
//     endDate: string;
//     generatedAt: string;
//     dataPoints: number;
//   };
//   error?: string;
// }

// /**
//  * Time series data point
//  */
// export interface TimeSeriesDataPoint {
//   timestamp: string;
//   date: string;
//   value: number;
//   label?: string;
//   metadata?: Record<string, any>;
// }

// /**
//  * Metric value with comparison
//  */
// export interface MetricValue {
//   current: number;
//   previous?: number;
//   change?: number;
//   changePercentage?: number;
//   trend?: 'up' | 'down' | 'neutral';
//   status?: 'excellent' | 'good' | 'fair' | 'poor';
// }

// /**
//  * Analytics metric
//  */
// export interface AnalyticsMetric {
//   id: string;
//   name: string;
//   value: MetricValue;
//   format: 'number' | 'currency' | 'percentage' | 'duration';
//   icon?: string;
//   color?: string;
//   description?: string;
// }

// /**
//  * Dashboard overview data
//  */
// export interface DashboardOverview {
//   summary: {
//     totalUsers: MetricValue;
//     activeUsers: MetricValue;
//     totalRevenue: MetricValue;
//     totalProperties: MetricValue;
//     activeListings: MetricValue;
//     totalTransactions: MetricValue;
//     successRate: MetricValue;
//     averageTransactionValue: MetricValue;
//   };
//   charts: {
//     revenueTimeSeries: TimeSeriesDataPoint[];
//     userGrowth: TimeSeriesDataPoint[];
//     transactionVolume: TimeSeriesDataPoint[];
//     propertyStats: TimeSeriesDataPoint[];
//   };
//   topPerformers: {
//     agents: AgentPerformanceSummary[];
//     properties: PropertyPerformanceSummary[];
//     locations: LocationPerformanceSummary[];
//   };
//   recentActivity: ActivityLog[];
//   alerts: PlatformAlert[];
// }

// /**
//  * Revenue analytics data
//  */
// export interface RevenueAnalytics {
//   summary: {
//     grossRevenue: MetricValue;
//     netRevenue: MetricValue;
//     rentRevenue: MetricValue;
//     markingRevenue: MetricValue;
//     commissionRevenue: MetricValue;
//     platformFees: MetricValue;
//     transactionFees: MetricValue;
//     refunds: MetricValue;
//   };
//   breakdown: {
//     byPaymentType: Array<{
//       type: string;
//       amount: number;
//       percentage: number;
//       count: number;
//     }>;
//     byAgent: Array<{
//       agentId: string;
//       agentName: string;
//       amount: number;
//       percentage: number;
//       transactions: number;
//     }>;
//     byLocation: Array<{
//       state: string;
//       city?: string;
//       amount: number;
//       percentage: number;
//       transactions: number;
//     }>;
//   };
//   timeSeries: TimeSeriesDataPoint[];
//   projections?: TimeSeriesDataPoint[];
// }

// /**
//  * User analytics data
//  */
// export interface UserAnalytics {
//   summary: {
//     totalUsers: MetricValue;
//     newUsers: MetricValue;
//     activeUsers: MetricValue;
//     verifiedUsers: MetricValue;
//     premiumUsers: MetricValue;
//     retentionRate: MetricValue;
//     churnRate: MetricValue;
//     averageSessionDuration: MetricValue;
//   };
//   usersByType: Array<{
//     type: 'OWNER' | 'AGENT' | 'RENTER' | 'ADMIN';
//     count: number;
//     percentage: number;
//     growth: number;
//   }>;
//   verificationStatus: Array<{
//     status: 'PENDING' | 'VERIFIED' | 'REJECTED';
//     count: number;
//     percentage: number;
//   }>;
//   registrationTrend: TimeSeriesDataPoint[];
//   geographicDistribution: Array<{
//     state: string;
//     count: number;
//     percentage: number;
//   }>;
//   engagementMetrics: {
//     dailyActiveUsers: number;
//     weeklyActiveUsers: number;
//     monthlyActiveUsers: number;
//     averageSessionsPerUser: number;
//   };
// }

// /**
//  * Property analytics data
//  */
// export interface PropertyAnalytics {
//   summary: {
//     totalProperties: MetricValue;
//     activeListings: MetricValue;
//     rentedProperties: MetricValue;
//     occupancyRate: MetricValue;
//     averageTimeToRent: MetricValue;
//     averagePrice: MetricValue;
//     boundaryVerified: MetricValue;
//   };
//   propertyTypes: Array<{
//     type: string;
//     count: number;
//     percentage: number;
//     averagePrice: number;
//   }>;
//   propertyStatus: Array<{
//     status: string;
//     count: number;
//     percentage: number;
//   }>;
//   locationDistribution: Array<{
//     state: string;
//     city?: string;
//     count: number;
//     percentage: number;
//     averagePrice: number;
//   }>;
//   listingPerformance: {
//     totalViews: number;
//     averageViewsPerListing: number;
//     conversionRate: number;
//   };
//   pricingAnalysis: {
//     priceRanges: Array<{
//       range: string;
//       count: number;
//       percentage: number;
//     }>;
//     averageByType: Record<string, number>;
//   };
// }

// /**
//  * Agent performance summary
//  */
// export interface AgentPerformanceSummary {
//   agentId: string;
//   agentName: string;
//   email: string;
//   phone?: string;
//   performanceScore: number;
//   reliabilityScore?: number;
//   totalListings: number;
//   activeListings: number;
//   rentedProperties: number;
//   totalCommissions: number;
//   markingJobs: {
//     total: number;
//     completed: number;
//     inProgress: number;
//     completionRate: number;
//   };
//   averageResponseTime: number;
//   rating?: number;
//   joinedDate: string;
// }

// /**
//  * Property performance summary
//  */
// export interface PropertyPerformanceSummary {
//   propertyId: string;
//   title: string;
//   type: string;
//   location: {
//     city: string;
//     state: string;
//   };
//   price: number;
//   views: number;
//   favorites: number;
//   inquiries: number;
//   status: string;
//   daysListed: number;
//   conversionRate?: number;
// }

// /**
//  * Location performance summary
//  */
// export interface LocationPerformanceSummary {
//   state: string;
//   city?: string;
//   totalProperties: number;
//   rentedProperties: number;
//   averagePrice: number;
//   totalRevenue: number;
//   occupancyRate: number;
// }

// /**
//  * Transaction analytics data
//  */
// export interface TransactionAnalytics {
//   summary: {
//     totalTransactions: MetricValue;
//     successfulTransactions: MetricValue;
//     failedTransactions: MetricValue;
//     pendingTransactions: MetricValue;
//     successRate: MetricValue;
//     averageValue: MetricValue;
//     totalVolume: MetricValue;
//   };
//   transactionsByType: Array<{
//     type: string;
//     count: number;
//     amount: number;
//     percentage: number;
//     successRate: number;
//   }>;
//   transactionsByStatus: Array<{
//     status: string;
//     count: number;
//     percentage: number;
//   }>;
//   failureAnalysis: Array<{
//     reason: string;
//     count: number;
//     percentage: number;
//     estimatedLoss: number;
//   }>;
//   refundSummary: {
//     totalRefunds: number;
//     totalAmount: number;
//     averageAmount: number;
//     refundRate: number;
//   };
//   timeSeries: TimeSeriesDataPoint[];
// }

// /**
//  * Agent performance analytics
//  */
// export interface AgentPerformanceAnalytics {
//   summary: {
//     totalAgents: MetricValue;
//     activeAgents: MetricValue;
//     averagePerformanceScore: MetricValue;
//     totalCommissions: MetricValue;
//     averageEarnings: MetricValue;
//   };
//   topPerformers: AgentPerformanceSummary[];
//   performanceDistribution: Array<{
//     range: string;
//     count: number;
//     percentage: number;
//   }>;
//   commissionBreakdown: Array<{
//     agentId: string;
//     agentName: string;
//     listingCommission: number;
//     subAgentCommission: number;
//     markingCommission: number;
//     totalCommission: number;
//   }>;
//   markingJobMetrics: {
//     totalJobs: number;
//     completedJobs: number;
//     averageCompletionTime: number;
//     successRate: number;
//   };
// }

// /**
//  * Activity log entry
//  */
// export interface ActivityLog {
//   id: string;
//   type: string;
//   title: string;
//   description: string;
//   userId?: string;
//   userName?: string;
//   metadata?: Record<string, any>;
//   timestamp: string;
//   severity?: 'info' | 'warning' | 'error';
// }

// /**
//  * Platform alert
//  */
// export interface PlatformAlert {
//   id: string;
//   type: 'info' | 'warning' | 'critical';
//   title: string;
//   message: string;
//   metric?: string;
//   currentValue?: number;
//   threshold?: number;
//   timestamp: string;
//   isRead: boolean;
//   actionRequired?: boolean;
//   actionUrl?: string;
// }

// /**
//  * Comparison analytics
//  */
// export interface ComparisonAnalytics {
//   currentPeriod: {
//     startDate: string;
//     endDate: string;
//     metrics: Record<string, number>;
//   };
//   previousPeriod: {
//     startDate: string;
//     endDate: string;
//     metrics: Record<string, number>;
//   };
//   changes: Record<string, {
//     absolute: number;
//     percentage: number;
//     trend: 'up' | 'down' | 'neutral';
//   }>;
// }

// /**
//  * Cohort analysis data
//  */
// export interface CohortAnalysis {
//   cohortType: 'registration' | 'first_payment' | 'first_listing';
//   cohorts: Array<{
//     cohortDate: string;
//     cohortSize: number;
//     periods: Array<{
//       period: number;
//       value: number;
//       percentage: number;
//     }>;
//   }>;
//   metric: 'retention' | 'revenue' | 'activity';
// }

// /**
//  * Funnel analysis data
//  */
// export interface FunnelAnalysis {
//   funnelType: 'user_registration' | 'property_listing' | 'rental_process';
//   steps: Array<{
//     stepName: string;
//     count: number;
//     percentage: number;
//     dropoffCount?: number;
//     dropoffPercentage?: number;
//     dropoffReasons?: Array<{
//       reason: string;
//       count: number;
//     }>;
//   }>;
//   overallConversionRate: number;
// }

// /**
//  * Market insights
//  */
// export interface MarketInsights {
//   priceInsights: {
//     averagePrice: number;
//     medianPrice: number;
//     priceGrowth: number;
//     priceByLocation: Array<{
//       location: string;
//       averagePrice: number;
//       trend: 'up' | 'down' | 'stable';
//     }>;
//   };
//   demandSupplyRatio: number;
//   popularPropertyTypes: Array<{
//     type: string;
//     demand: number;
//     supply: number;
//     ratio: number;
//   }>;
//   seasonalTrends: TimeSeriesDataPoint[];
//   competitiveAnalysis?: {
//     marketShare: number;
//     competitors: Array<{
//       name: string;
//       estimatedShare: number;
//     }>;
//   };
// }

// /**
//  * Real-time analytics
//  */
// export interface RealTimeAnalytics {
//   activeUsers: number;
//   ongoingTransactions: number;
//   recentListings: number;
//   activeAgents: number;
//   pendingVerifications: number;
//   systemLoad: {
//     cpu: number;
//     memory: number;
//     apiResponseTime: number;
//   };
//   recentEvents: ActivityLog[];
//   lastUpdated: string;
// }

// /**
//  * Export analytics options
//  */
// export interface ExportAnalyticsOptions {
//   format: 'csv' | 'pdf' | 'excel' | 'json';
//   includeCharts: boolean;
//   includeRawData: boolean;
//   dateRange: {
//     startDate: string;
//     endDate: string;
//   };
//   metrics: string[];
// }
















// import { Decimal } from '@prisma/client/runtime/library';

// /**
//  * Base analytics interface
//  */
// export interface BaseAnalytics {
//   startDate: Date;
//   endDate: Date;
//   period: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'all';
//   generatedAt: Date;
// }

// /**
//  * Time series data point
//  */
// export interface TimeSeriesDataPoint {
//   timestamp: Date;
//   value: number;
//   label?: string;
//   metadata?: Record<string, any>;
// }

// /**
//  * Metric comparison interface
//  */
// export interface MetricComparison {
//   current: number;
//   previous: number;
//   change: number;
//   changePercentage: number;
//   trend: 'up' | 'down' | 'stable';
// }

// /**
//  * Platform overview analytics
//  */
// export interface PlatformOverviewAnalytics extends BaseAnalytics {
//   totalUsers: number;
//   activeUsers: number;
//   newUsers: number;
//   totalProperties: number;
//   activeProperties: number;
//   totalTransactions: number;
//   totalRevenue: Decimal;
//   conversionRate: number;
//   averageSessionDuration: number;
//   bounceRate: number;
  
//   // Comparisons with previous period
//   comparisons: {
//     users: MetricComparison;
//     properties: MetricComparison;
//     transactions: MetricComparison;
//     revenue: MetricComparison;
//   };
  
//   // Time series data
//   timeSeries: {
//     users: TimeSeriesDataPoint[];
//     properties: TimeSeriesDataPoint[];
//     transactions: TimeSeriesDataPoint[];
//     revenue: TimeSeriesDataPoint[];
//   };
// }

// /**
//  * User analytics breakdown
//  */
// export interface UserAnalytics extends BaseAnalytics {
//   totalUsers: number;
//   activeUsers: number;
//   newUsers: number;
  
//   // User segmentation
//   byRole: {
//     owners: number;
//     agents: number;
//     renters: number;
//     admins: number;
//   };
  
//   byVerificationStatus: {
//     pending: number;
//     verified: number;
//     rejected: number;
//   };
  
//   byPremiumStatus: {
//     premium: number;
//     free: number;
//   };
  
//   // User engagement
//   engagement: {
//     dailyActiveUsers: number;
//     weeklyActiveUsers: number;
//     monthlyActiveUsers: number;
//     averageSessionsPerUser: number;
//     averageTimeOnPlatform: number;
//   };
  
//   // User retention
//   retention: {
//     day1: number;
//     day7: number;
//     day30: number;
//     day90: number;
//   };
  
//   // Geographic distribution
//   byLocation: {
//     state: string;
//     city: string;
//     count: number;
//   }[];
  
//   // User acquisition channels
//   acquisitionChannels: {
//     channel: string;
//     count: number;
//     percentage: number;
//   }[];
// }

// /**
//  * Property analytics
//  */
// export interface PropertyAnalytics extends BaseAnalytics {
//   totalProperties: number;
//   activeListings: number;
//   rentedProperties: number;
  
//   // Property status breakdown
//   byStatus: {
//     draft: number;
//     pending: number;
//     published: number;
//     rented: number;
//     unavailable: number;
//   };
  
//   // Property type distribution
//   byType: {
//     type: string;
//     count: number;
//     averagePrice: Decimal;
//     averageViewCount: number;
//   }[];
  
//   // Geographic distribution
//   byLocation: {
//     state: string;
//     city: string;
//     count: number;
//     averagePrice: Decimal;
//   }[];
  
//   // Property performance
//   performance: {
//     averageTimeToRent: number; // in days
//     averageViewsBeforeRent: number;
//     listingSuccessRate: number;
//     averagePropertyValue: Decimal;
//   };
  
//   // Boundary verification stats
//   boundaryStats: {
//     totalMarked: number;
//     totalVerified: number;
//     pendingVerification: number;
//     duplicatesDetected: number;
//   };
  
//   // Multi-family vs single unit
//   structureDistribution: {
//     singleUnit: number;
//     multiFamily: number;
//     totalUnits: number;
//   };
// }

// /**
//  * Dashboard summary
//  */
// export interface DashboardSummary {
//   // Key metrics
//   totalUsers: number;
//   totalProperties: number;
//   totalTransactions: number;
//   totalRevenue: Decimal;
  
//   // Today's activity
//   todayActivity: {
//     newUsers: number;
//     newProperties: number;
//     newTransactions: number;
//     revenue: Decimal;
//   };
  
//   // Pending actions
//   pendingActions: {
//     verificationRequests: number;
//     propertyApprovals: number;
//     supportTickets: number;
//     duplicateReports: number;
//     boundaryDisputes: number;
//   };
  
//   // Quick stats
//   quickStats: {
//     activeUsers24h: number;
//     propertiesListedToday: number;
//     transactionsToday: number;
//     averageTransactionValue: Decimal;
//   };
  
//   // Recent activity
//   recentActivity: {
//     type: string;
//     description: string;
//     timestamp: Date;
//     userId?: string;
//     propertyId?: string;
//   }[];
  
//   // Alerts
//   alerts: {
//     type: 'warning' | 'error' | 'info';
//     message: string;
//     priority: 'low' | 'medium' | 'high';
//     timestamp: Date;
//   }[];
// }

// /**
//  * Analytics filters
//  */
// export interface AnalyticsFilters {
//   startDate?: Date;
//   endDate?: Date;
//   period?: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'all';
//   cities?: string[];
//   states?: string[];
//   propertyTypes?: string[];
//   userRoles?: string[];
//   paymentStatuses?: string[];
//   verificationStatuses?: string[];
// }

// /**
//  * Analytics export options
//  */
// export interface AnalyticsExportOptions {
//   format: 'json' | 'csv' | 'xlsx' | 'pdf';
//   includeCharts: boolean;
//   includeRawData: boolean;
//   filename?: string;
// }

// /**
//  * Cohort analysis
//  */
// export interface CohortAnalysis {
//   cohortDate: Date;
//   cohortSize: number;
//   retention: {
//     week0: number;
//     week1: number;
//     week2: number;
//     week3: number;
//     week4: number;
//     [key: string]: number;
//   };
//   revenue: {
//     week0: Decimal;
//     week1: Decimal;
//     week2: Decimal;
//     week3: Decimal;
//     week4: Decimal;
//     [key: string]: Decimal;
//   };
// }

// /**
//  * Funnel analysis
//  */
// export interface FunnelAnalysis {
//   stage: string;
//   users: number;
//   conversionRate: number;
//   dropOffRate: number;
//   averageTimeInStage: number;
// }

// /**
//  * A/B test results
//  */
// export interface ABTestResults {
//   testId: string;
//   testName: string;
//   startDate: Date;
//   endDate: Date;
//   variants: {
//     name: string;
//     users: number;
//     conversions: number;
//     conversionRate: number;
//     revenue: Decimal;
//     isControl: boolean;
//   }[];
//   winner?: string;
//   confidence: number;
//   status: 'running' | 'completed' | 'cancelled';
// }

// /**
//  * Real-time analytics
//  */
// export interface RealTimeAnalytics {
//   timestamp: Date;
//   activeUsers: number;
//   ongoingTransactions: number;
//   activeListings: number;
//   cpuUsage: number;
//   memoryUsage: number;
//   requestsPerSecond: number;
//   averageResponseTime: number;
//   errorRate: number;
// }