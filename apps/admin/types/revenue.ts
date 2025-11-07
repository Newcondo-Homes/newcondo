// apps/admin/src/types/revenue.ts

/**
 * Revenue summary
 */
export interface RevenueSummary {
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
 * Payment method revenue
 */
export interface PaymentMethodRevenue {
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
  currentPeriod: RevenueSummary;
  previousPeriod: RevenueSummary;
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