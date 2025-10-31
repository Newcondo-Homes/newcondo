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