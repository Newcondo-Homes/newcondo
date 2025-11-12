// backend/admin-service/src/types/analytics.ts

export interface PlatformAnalytics {
  // User Metrics
  userMetrics: UserMetrics;
  
  // Property Metrics
  propertyMetrics: PropertyMetrics;
  
  // Payment Metrics
  paymentMetrics: PaymentMetrics;
  
  // Marking Service Metrics
  markingMetrics: MarkingServiceMetrics;
  
  // Engagement Metrics
  engagementMetrics: EngagementMetrics;
}

export interface UserMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  
  // By User Type
  byUserType: {
    landlords: number;
    propertyManagers: number;
    agents: number;
    renters: number;
  };
  
  // Verification Status
  verifiedUsers: number;
  pendingVerification: number;
  rejectedVerification: number;
  verificationRate: number; // percentage
  
  // Premium Users
  premiumUsers: number;
  premiumConversionRate: number;
  
  // Growth
  userGrowthRate: number; // percentage
  retentionRate: number; // percentage
  churnRate: number; // percentage
}

export interface PropertyMetrics {
  totalProperties: number;
  activeListings: number;
  rentedProperties: number;
  availableProperties: number;
  
  // By Structure
  singleUnitProperties: number;
  multiFamilyProperties: number;
  totalUnitsAvailable: number;
  
  // By Status
  draftProperties: number;
  pendingApproval: number;
  approvedProperties: number;
  rejectedProperties: number;
  
  // New Listings
  newListingsToday: number;
  newListingsThisWeek: number;
  newListingsThisMonth: number;
  
  // By Location
  topCities: CityMetrics[];
  topStates: StateMetrics[];
  
  // Property Features
  averagePrice: number;
  medianPrice: number;
  priceRange: { min: number; max: number };
  
  // Engagement
  averageViewsPerProperty: number;
  mostViewedProperties: PropertyViewMetric[];
}

export interface CityMetrics {
  city: string;
  count: number;
  averagePrice: number;
}

export interface StateMetrics {
  state: string;
  count: number;
  averagePrice: number;
}

export interface PropertyViewMetric {
  propertyId: string;
  title: string;
  views: number;
  favorites: number;
}

export interface PaymentMetrics {
  // Overall
  totalRevenue: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  successRate: number; // percentage
  
  // Today
  revenueToday: number;
  transactionsToday: number;
  
  // This Week
  revenueThisWeek: number;
  transactionsThisWeek: number;
  
  // This Month
  revenueThisMonth: number;
  transactionsThisMonth: number;
  
  // By Payment Type
  rentPayments: { count: number; amount: number };
  markingPayments: { count: number; amount: number };
  premiumUpgrades: { count: number; amount: number };
  
  // Commission Breakdown
  totalCommissions: number;
  agentCommissions: number;
  platformFees: number;
  ownerPayouts: number;
  
  // Virtual Accounts
  activeVirtualAccounts: number;
  totalVirtualAccountBalance: number;
  
  // Pending Actions
  pendingConfirmations: number;
  pendingReleases: number;
  heldPayments: number;
  heldAmount: number;
  
  // Average Transaction Value
  averageTransactionValue: number;
  medianTransactionValue: number;
}

export interface MarkingServiceMetrics {
  // Jobs
  totalJobs: number;
  queuedJobs: number;
  assignedJobs: number;
  inProgressJobs: number;
  completedJobs: number;
  cancelledJobs: number;
  expiredJobs: number;
  
  // Performance
  averageCompletionTime: number; // in hours
  onTimeCompletionRate: number; // percentage
  averageQualityScore: number;
  
  // Revenue
  totalMarkingRevenue: number;
  totalAgentEarnings: number;
  totalPlatformEarnings: number;
  
  // Agents
  activeAgents: number;
  totalAgentsParticipated: number;
  topPerformingAgents: AgentPerformanceSnapshot[];
  
  // Queue Metrics
  averageQueueSize: number;
  averageWaitTime: number; // in minutes
  timeoutRate: number; // percentage
  
  // Today
  jobsCreatedToday: number;
  jobsCompletedToday: number;
}

export interface AgentPerformanceSnapshot {
  agentId: string;
  agentName: string;
  completedJobs: number;
  averageQualityScore: number;
  totalEarnings: number;
  reliabilityScore: number;
}

export interface EngagementMetrics {
  // Daily Active Users
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  
  // Session Metrics
  averageSessionDuration: number; // in minutes
  averageSessions PerUser: number;
  
  // Property Interactions
  totalPropertyViews: number;
  totalPropertyFavorites: number;
  averagePropertiesViewedPerUser: number;
  
  // Search Activity
  totalSearches: number;
  uniqueSearchQueries: number;
  topSearchTerms: SearchTermMetric[];
  
  // Conversion Metrics
  propertyInquiries: number;
  rentApplications: number;
  successfulRentals: number;
  conversionRate: number; // percentage
}

export interface SearchTermMetric {
  term: string;
  count: number;
  resultsFound: number;
}

export interface TimeSeriesData {
  period: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  dataPoints: TimeSeriesPoint[];
}

export interface TimeSeriesPoint {
  timestamp: Date;
  value: number;
  label?: string;
}

export interface AnalyticsFilter {
  dateFrom: Date;
  dateTo: Date;
  groupBy?: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';
  category?: string;
  location?: { city?: string; state?: string };
}

export interface ReportRequest {
  reportType: ReportType;
  format: 'PDF' | 'CSV' | 'EXCEL';
  filters: AnalyticsFilter;
  includeCharts: boolean;
  recipientEmail?: string;
}

export enum ReportType {
  USER_ANALYTICS = 'USER_ANALYTICS',
  PROPERTY_ANALYTICS = 'PROPERTY_ANALYTICS',
  PAYMENT_ANALYTICS = 'PAYMENT_ANALYTICS',
  MARKING_SERVICE_ANALYTICS = 'MARKING_SERVICE_ANALYTICS',
  COMPREHENSIVE = 'COMPREHENSIVE',
}

export interface GeneratedReport {
  id: string;
  reportType: ReportType;
  format: string;
  fileUrl: string;
  fileSize: number;
  generatedBy: string;
  generatedAt: Date;
  expiresAt: Date;
}


