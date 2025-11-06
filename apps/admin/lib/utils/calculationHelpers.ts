// apps/admin/src/lib/utils/calculationHelpers.ts

/**
 * Calculate platform commission (20% of rent)
 */
export const calculatePlatformCommission = (
  rentAmount: number,
  commissionRate: number = 20
): number => {
  return (rentAmount * commissionRate) / 100;
};

/**
 * Calculate agent commission split (50% of platform commission)
 */
export const calculateAgentCommission = (
  platformCommission: number,
  agentSplit: number = 50
): number => {
  return (platformCommission * agentSplit) / 100;
};

/**
 * Calculate marking job compensation
 */
export const calculateMarkingCompensation = (
  markingFee: number = 20000,
  agentPercentage: number = 25
): {
  totalFee: number;
  agentAmount: number;
  platformAmount: number;
} => {
  const agentAmount = (markingFee * agentPercentage) / 100;
  const platformAmount = markingFee - agentAmount;
  
  return {
    totalFee: markingFee,
    agentAmount,
    platformAmount,
  };
};

/**
 * Calculate transaction fee (Flutterwave)
 */
export const calculateTransactionFee = (
  amount: number,
  feePercentage: number = 1.4,
  cappedAt?: number
): number => {
  const fee = (amount * feePercentage) / 100;
  return cappedAt ? Math.min(fee, cappedAt) : fee;
};

/**
 * Calculate total payment including fees
 */
export const calculateTotalPayment = (
  baseAmount: number,
  includeTransactionFee: boolean = true
): {
  baseAmount: number;
  transactionFee: number;
  total: number;
} => {
  const transactionFee = includeTransactionFee 
    ? calculateTransactionFee(baseAmount) 
    : 0;
  
  return {
    baseAmount,
    transactionFee,
    total: baseAmount + transactionFee,
  };
};

/**
 * Calculate refund amount (deducting transaction fees)
 */
export const calculateRefundAmount = (
  originalAmount: number,
  deductTransactionFee: boolean = true
): {
  originalAmount: number;
  transactionFee: number;
  refundAmount: number;
} => {
  const transactionFee = deductTransactionFee 
    ? calculateTransactionFee(originalAmount) * 2 // Double fee for refund
    : 0;
  
  return {
    originalAmount,
    transactionFee,
    refundAmount: originalAmount - transactionFee,
  };
};

/**
 * Calculate commission distribution for property rental
 */
export const calculateRentalCommissionDistribution = (
  rentAmount: number,
  hasListingAgent: boolean,
  hasSubAgent: boolean
): {
  rentAmount: number;
  platformCommission: number;
  listingAgentAmount: number;
  subAgentAmount: number;
  ownerAmount: number;
  newcondoAmount: number;
} => {
  const platformCommission = calculatePlatformCommission(rentAmount);
  
  let listingAgentAmount = 0;
  let subAgentAmount = 0;
  let newcondoAmount = platformCommission;
  
  if (hasListingAgent) {
    const agentCommission = calculateAgentCommission(platformCommission);
    
    if (hasSubAgent) {
      // Split 50-50 between listing agent and sub-agent
      listingAgentAmount = agentCommission / 2;
      subAgentAmount = agentCommission / 2;
    } else {
      // Full commission to listing agent
      listingAgentAmount = agentCommission;
    }
    
    newcondoAmount = platformCommission - listingAgentAmount - subAgentAmount;
  }
  
  const ownerAmount = rentAmount - platformCommission;
  
  return {
    rentAmount,
    platformCommission,
    listingAgentAmount,
    subAgentAmount,
    ownerAmount,
    newcondoAmount,
  };
};

/**
 * Calculate revenue metrics
 */
export const calculateRevenueMetrics = (
  transactions: Array<{ amount: number; type: string }>
): {
  totalRevenue: number;
  rentRevenue: number;
  markingRevenue: number;
  averageTransactionValue: number;
  transactionCount: number;
} => {
  const rentRevenue = transactions
    .filter(t => t.type === 'RENT')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const markingRevenue = transactions
    .filter(t => t.type === 'PROPERTY_MARKING')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalRevenue = rentRevenue + markingRevenue;
  const transactionCount = transactions.length;
  const averageTransactionValue = transactionCount > 0 
    ? totalRevenue / transactionCount 
    : 0;
  
  return {
    totalRevenue,
    rentRevenue,
    markingRevenue,
    averageTransactionValue,
    transactionCount,
  };
};

/**
 * Calculate conversion rate
 */
export const calculateConversionRate = (
  conversions: number,
  totalVisitors: number
): number => {
  if (totalVisitors === 0) return 0;
  return (conversions / totalVisitors) * 100;
};

/**
 * Calculate retention rate
 */
export const calculateRetentionRate = (
  returningUsers: number,
  totalUsers: number
): number => {
  if (totalUsers === 0) return 0;
  return (returningUsers / totalUsers) * 100;
};

/**
 * Calculate churn rate
 */
export const calculateChurnRate = (
  churnedUsers: number,
  totalUsers: number
): number => {
  if (totalUsers === 0) return 0;
  return (churnedUsers / totalUsers) * 100;
};

/**
 * Calculate average time to completion
 */
export const calculateAverageTimeToCompletion = (
  completionTimes: number[]
): {
  average: number;
  median: number;
  min: number;
  max: number;
} => {
  if (completionTimes.length === 0) {
    return { average: 0, median: 0, min: 0, max: 0 };
  }
  
  const sorted = [...completionTimes].sort((a, b) => a - b);
  const average = completionTimes.reduce((sum, t) => sum + t, 0) / completionTimes.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  
  return { average, median, min, max };
};

/**
 * Calculate property occupancy rate
 */
export const calculateOccupancyRate = (
  occupiedUnits: number,
  totalUnits: number
): number => {
  if (totalUnits === 0) return 0;
  return (occupiedUnits / totalUnits) * 100;
};

/**
 * Calculate listing success rate
 */
export const calculateListingSuccessRate = (
  rentedProperties: number,
  totalListings: number
): number => {
  if (totalListings === 0) return 0;
  return (rentedProperties / totalListings) * 100;
};

/**
 * Calculate agent performance score
 */
export const calculateAgentPerformanceScore = (
  metrics: {
    completedJobs: number;
    totalJobs: number;
    averageRating: number;
    responseTime: number; // in hours
  }
): number => {
  const completionRate = metrics.totalJobs > 0 
    ? (metrics.completedJobs / metrics.totalJobs) * 100 
    : 0;
  
  const ratingScore = (metrics.averageRating / 5) * 100;
  
  const responseScore = metrics.responseTime < 1 
    ? 100 
    : Math.max(0, 100 - (metrics.responseTime * 10));
  
  return (completionRate * 0.4) + (ratingScore * 0.4) + (responseScore * 0.2);
};

/**
 * Calculate ROI (Return on Investment)
 */
export const calculateROI = (
  revenue: number,
  cost: number
): {
  roi: number;
  profit: number;
  profitMargin: number;
} => {
  const profit = revenue - cost;
  const roi = cost > 0 ? (profit / cost) * 100 : 0;
  const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
  
  return { roi, profit, profitMargin };
};

/**
 * Calculate compound annual growth rate (CAGR)
 */
export const calculateCAGR = (
  beginningValue: number,
  endingValue: number,
  years: number
): number => {
  if (beginningValue <= 0 || years <= 0) return 0;
  return (Math.pow(endingValue / beginningValue, 1 / years) - 1) * 100;
};

/**
 * Calculate customer lifetime value (CLV)
 */
export const calculateCLV = (
  averageOrderValue: number,
  purchaseFrequency: number,
  customerLifespan: number
): number => {
  return averageOrderValue * purchaseFrequency * customerLifespan;
};

/**
 * Calculate break-even point
 */
export const calculateBreakEvenPoint = (
  fixedCosts: number,
  pricePerUnit: number,
  variableCostPerUnit: number
): number => {
  const contributionMargin = pricePerUnit - variableCostPerUnit;
  return contributionMargin > 0 ? fixedCosts / contributionMargin : 0;
};