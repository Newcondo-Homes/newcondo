// apps/admin/src/types/revenue.ts

import { Decimal } from '@prisma/client/runtime/library';

// --- Simple Summary Types (for quick reference) ---

/**
 * Revenue summary
 */
export interface RevenueSummaryOld {
  grossRevenue: number;
  netRevenue: number;
  rentRevenue: number;
  markingRevenue: number;
  commissionRevenue: number;
  platformFees: number;
  transactionFees: number;
  refunds: number;
  growthRate: number;
  projectedRevenue?: number;
}

/**
 * Revenue breakdown by type
 */
export interface RevenueByType {
  type: 'RENT' | 'PROPERTY_MARKING' | 'PREMIUM_UPGRADE' | 'AGENT_COMMISSION';
  amount: number;
  count: number;
  percentage: number;
  averageValue: number;
  growth: number;
}

/**
 * Revenue breakdown by period
 */
export interface RevenueByPeriod {
  period: string;
  date: string;
  grossRevenue: number;
  netRevenue: number;
  transactions: number;
  averageTransactionValue: number;
}

/**
 * Commission distribution
 */
export interface CommissionDistribution {
  totalCommission: number;
  platformShare: number;
  platformPercentage: number;
  agentsShare: number;
  agentsPercentage: number;
  breakdown: {
    listingAgents: number;
    subAgents: number;
    markingAgents: number;
  };
}

/**
 * Agent commission details
 */
export interface AgentCommissionDetails {
  agentId: string;
  agentName: string;
  email: string;
  listingCommission: number;
  subAgentCommission: number;
  markingCommission: number;
  totalCommission: number;
  transactionCount: number;
  averageCommission: number;
  paid: number;
  unpaid: number;
  pendingRelease: number;
}

/**
 * Revenue by location
 */
export interface RevenueByLocation {
  state: string;
  city?: string;
  totalRevenue: number;
  rentRevenue: number;
  markingRevenue: number;
  transactionCount: number;
  averageValue: number;
  percentage: number;
  growth: number;
}

/**
 * Revenue by property
 */
export interface RevenueByProperty {
  propertyId: string;
  propertyTitle: string;
  propertyType: string;
  location: {
    city: string;
    state: string;
  };
  totalRevenue: number;
  commissionEarned: number;
  transactionCount: number;
  lastTransaction?: string;
}

/**
 * Transaction fee breakdown
 */
export interface TransactionFeeBreakdown {
  totalTransactionFees: number;
  flutterwaveFees: number;
  platformProcessingFees: number;
  refundFees: number;
  averageFeePerTransaction: number;
  feePercentageOfRevenue: number;
}

/**
 * Revenue projection
 */
export interface RevenueProjection {
  period: string;
  projectedRevenue: number;
  confidenceLevel: 'low' | 'medium' | 'high';
  lowerBound: number;
  upperBound: number;
  factors: string[];
}

/**
 * Revenue trend analysis
 */
export interface RevenueTrendAnalysis {
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  averageGrowthRate: number;
  bestPeriod: {
    period: string;
    revenue: number;
  };
  worstPeriod: {
    period: string;
    revenue: number;
  };
  seasonalPatterns?: Array<{
    season: string;
    averageRevenue: number;
    variance: number;
  }>;
}

/**
 * Revenue metrics
 */
export interface RevenueMetrics {
  totalRevenue: number;
  averageRevenuePerTransaction: number;
  averageRevenuePerUser: number;
  revenuePerProperty: number;
  revenueGrowthRate: number;
  revenueRetentionRate: number;
  customerLifetimeValue: number;
  customerAcquisitionCost: number;
}

/**
 * Payment method revenue (number version)
 */
export interface PaymentMethodRevenueOld {
  method: string;
  count: number;
  amount: number;
  percentage: number;
  successRate: number;
  averageValue: number;
}

/**
 * Revenue forecast
 */
export interface RevenueForecast {
  forecastPeriods: Array<{
    period: string;
    forecastedRevenue: number;
    lowerBound: number;
    upperBound: number;
  }>;
  assumptions: string[];
  accuracy: number;
  lastUpdated: string;
}

/**
 * Refund analytics
 */
export interface RefundAnalytics {
  totalRefunds: number;
  totalAmount: number;
  refundRate: number;
  averageRefundAmount: number;
  refundsByReason: Array<{
    reason: string;
    count: number;
    amount: number;
    percentage: number;
  }>;
  refundTimeline: Array<{
    period: string;
    count: number;
    amount: number;
  }>;
}

/**
 * Virtual account balance
 */
export interface VirtualAccountBalance {
  accountId: string;
  accountNumber: string;
  accountName: string;
  balance: number;
  currency: string;
  heldFunds: number;
  availableFunds: number;
  pendingWithdrawals: number;
  totalDeposits: number;
  totalWithdrawals: number;
}

/**
 * Revenue reconciliation
 */
export interface RevenueReconciliation {
  period: string;
  expectedRevenue: number;
  actualRevenue: number;
  variance: number;
  variancePercentage: number;
  discrepancies: Array<{
    type: string;
    description: string;
    amount: number;
  }>;
  status: 'reconciled' | 'pending' | 'discrepancy';
}

/**
 * Cash flow statement
 */
export interface CashFlowStatement {
  period: string;
  openingBalance: number;
  inflows: {
    rentPayments: number;
    markingFees: number;
    premiumSubscriptions: number;
    other: number;
    total: number;
  };
  outflows: {
    agentCommissions: number;
    ownerPayments: number;
    refunds: number;
    transactionFees: number;
    operatingExpenses: number;
    other: number;
    total: number;
  };
  netCashFlow: number;
  closingBalance: number;
}

/**
 * Revenue KPIs
 */
export interface RevenueKPIs {
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  revenueChurnRate: number;
  netRevenueRetention: number;
  grossMargin: number;
  netMargin: number;
  averageRevenuePerUser: number;
  customerLifetimeValue: number;
}

/**
 * Revenue comparison
 */
export interface RevenueComparison {
  currentPeriod: RevenueSummaryOld; // Using simple summary for comparison
  previousPeriod: RevenueSummaryOld; // Using simple summary for comparison
  comparison: {
    revenueChange: number;
    revenueChangePercentage: number;
    transactionChange: number;
    transactionChangePercentage: number;
    averageValueChange: number;
    averageValueChangePercentage: number;
  };
  insights: string[];
}

/**
 * Revenue target
 */
export interface RevenueTarget {
  targetId: string;
  period: string;
  targetAmount: number;
  currentAmount: number;
  achievedPercentage: number;
  remainingAmount: number;
  projectedAchievement: number;
  onTrack: boolean;
  daysRemaining: number;
}

/**
 * Revenue attribution
 */
export interface RevenueAttribution {
  source: string;
  revenue: number;
  percentage: number;
  transactions: number;
  conversionRate: number;
  customerAcquisitionCost: number;
  returnOnInvestment: number;
}

/**
 * Revenue leak analysis
 */
export interface RevenueLeakAnalysis {
  potentialRevenue: number;
  actualRevenue: number;
  leakage: number;
  leakagePercentage: number;
  leakSources: Array<{
    source: string;
    amount: number;
    percentage: number;
    impact: 'high' | 'medium' | 'low';
  }>;
  recommendations: string[];
}

// --- Detailed Analytics Types (using Decimal) ---

/**
 * Revenue summary (Decimal version)
 */
export interface RevenueSummary {
  period: {
    startDate: Date;
    endDate: Date;
  };

  // Total revenue
  totalRevenue: Decimal;
  grossRevenue: Decimal;
  netRevenue: Decimal;

  // Revenue breakdown
  breakdown: {
    rentPayments: Decimal;
    agentCommissions: Decimal;
    platformFees: Decimal;
    premiumSubscriptions: Decimal;
    propertyMarking: Decimal;
    other: Decimal;
  };

  // Revenue by payment type
  byPaymentType: {
    type: string;
    revenue: Decimal;
    transactions: number;
    percentage: number;
  }[];

  // Comparisons
  comparison: {
    previousPeriod: Decimal;
    change: Decimal;
    changePercentage: number;
    trend: 'up' | 'down' | 'stable';
  };
}

/**
 * Revenue analytics
 */
export interface RevenueAnalytics {
  summary: RevenueSummary;

  // Time series data
  timeSeries: {
    date: Date;
    revenue: Decimal;
    transactions: number;
    averageTransactionValue: Decimal;
  }[];

  // Revenue by source
  bySource: { // Corrected "bySour" to "bySource"
    source: string;
    revenue: Decimal;
    transactions: number;
    averageValue: Decimal;
    growthRate: number;
  }[];

  // Revenue by location
  byLocation: {
    state: string;
    city: string;
    revenue: Decimal;
    transactions: number;
    percentage: number;
  }[];

  // Revenue by property type
  byPropertyType: {
    propertyType: string;
    revenue: Decimal;
    transactions: number;
    averageRent: Decimal;
  }[];

  // Top revenue generators
  topGenerators: {
    userId: string;
    userName: string;
    userRole: string;
    revenue: Decimal;
    transactions: number;
  }[];
}

/**
 * Commission breakdown
 */
export interface CommissionBreakdown {
  period: {
    startDate: Date;
    endDate: Date;
  };

  // Total commissions
  totalCommissions: Decimal;

  // Platform fees
  platformFees: {
    total: Decimal;
    fromRentPayments: Decimal;
    fromPropertyMarking: Decimal;
    percentage: number;
  };

  // Agent commissions
  agentCommissions: {
    total: Decimal;
    listingAgents: Decimal;
    subAgents: Decimal;
    markingAgents: Decimal;
    percentage: number;
  };

  // Owner payments
  ownerPayments: {
    total: Decimal;
    afterCommissions: Decimal;
    percentage: number;
  };

  // Commission by agent
  byAgent: {
    agentId: string;
    agentName: string;
    totalCommission: Decimal;
    listingCommission: Decimal;
    subAgentCommission: Decimal;
    markingCommission: Decimal;
    properties: number;
  }[];
}

/**
 * Revenue projections
 */
export interface RevenueProjections {
  // Historical data for projections
  historicalData: {
    month: Date;
    revenue: Decimal;
    transactions: number;
  }[];

  // Projections
  projections: {
    period: 'next_month' | 'next_quarter' | 'next_year';
    projectedRevenue: Decimal;
    confidenceInterval: {
      low: Decimal;
      high: Decimal;
    };
    growthRate: number;
  }[];

  // Annual recurring revenue
  arr: {
    current: Decimal;
    projected: Decimal;
    growthRate: number;
  };

  // Monthly recurring revenue
  mrr: {
    current: Decimal;
    projected: Decimal;
    growthRate: number;
  };

  // Assumptions
  assumptions: {
    averageTransactionValue: Decimal;
    expectedTransactionGrowth: number;
    churnRate: number;
    seasonalityFactor: number;
  };
}

/**
 * Revenue by segment
 */
export interface RevenueBySegment {
  period: {
    startDate: Date;
    endDate: Date;
  };

  // User segments
  byUserSegment: {
    segment: 'new' | 'returning' | 'premium' | 'standard';
    revenue: Decimal;
    users: number;
    averageRevenuePerUser: Decimal;
    percentage: number;
  }[];

  // Property segments
  byPropertySegment: {
    segment: string;
    revenue: Decimal;
    properties: number;
    averageRevenuePerProperty: Decimal;
    percentage: number;
  }[];

  // Geographic segments
  byGeographicSegment: {
    region: string;
    revenue: Decimal;
    marketShare: number;
    growthRate: number;
  }[];
}

/**
 * Revenue tracking
 */
export interface RevenueTracking {
  // Real-time revenue
  realTime: {
    today: Decimal;
    thisWeek: Decimal;
    thisMonth: Decimal;
    thisYear: Decimal;
  };

  // Targets
  targets: {
    daily: Decimal;
    weekly: Decimal;
    monthly: Decimal;
    quarterly: Decimal;
    annual: Decimal;
  };

  // Progress
  progress: {
    dailyProgress: number;
    weeklyProgress: number;
    monthlyProgress: number;
    quarterlyProgress: number;
    annualProgress: number;
  };

  // Forecast
  forecast: {
    endOfDay: Decimal;
    endOfWeek: Decimal;
    endOfMonth: Decimal;
    endOfQuarter: Decimal;
    endOfYear: Decimal;
  };
}

/**
 * Payment method revenue (Decimal version)
 */
export interface PaymentMethodRevenue {
  method: string;
  transactions: number;
  revenue: Decimal;
  averageTransactionValue: Decimal;
  successRate: number;
  processingFees: Decimal;
  netRevenue: Decimal;
  percentage: number;
}

/**
 * Revenue retention (Completed)
 */
export interface RevenueRetention {
  period: {
    startDate: Date;
    endDate: Date;
  };

  // Cohort analysis
  cohorts: {
    cohortDate: Date;
    initialRevenue: Decimal;
    currentRevenue: Decimal;
    retentionRate: number;
    churnRate: number;
  }[];

  // Net revenue retention
  netRevenueRetention: number; // Percentage

  // Expansion revenue (from upgrades, cross-sells, etc.)
  expansionRevenue: Decimal;

  // Contraction revenue (from downgrades, discounts, etc.)
  contractionRevenue: Decimal;

  // Churned revenue (lost from cancellations)
  churnedRevenue: Decimal;
}

/**
 * Consolidated top-level type for the Revenue Dashboard data fetch.
 */
export interface RevenueDashboardData {
    summary: RevenueSummary;
    analytics: RevenueAnalytics;
    commissionBreakdown: CommissionBreakdown;
    projections: RevenueProjections;
    retention: RevenueRetention;
    tracking: RevenueTracking;
    kpis: RevenueKPIs;
    paymentMethods: PaymentMethodRevenue[];
    refundAnalytics: RefundAnalytics;
}