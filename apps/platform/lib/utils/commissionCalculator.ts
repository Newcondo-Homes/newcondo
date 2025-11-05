/**
 * Commission Calculator Utility
 * Handles all commission calculations for property rentals
 */

export interface CommissionBreakdown {
  rentAmount: number;
  platformCommission: number;
  listingAgentCommission: number;
  subAgentCommission: number;
  propertyOwnerAmount: number;
  newcondoAmount: number;
  transactionFee: number;
  totalDeductions: number;
}

export interface CommissionParties {
  hasListingAgent: boolean;
  hasSubAgent: boolean;
}

export interface FlutterwaveCharges {
  transactionFee: number;
  isRefund: boolean;
}

// Constants
const PLATFORM_COMMISSION_RATE = 0.20; // 20% of rent
const AGENT_SPLIT_RATE = 0.50; // 50% of platform commission goes to agents
const FLUTTERWAVE_FEE_RATE = 0.014; // 1.4% transaction fee
const FLUTTERWAVE_FEE_CAP = 2000; // NGN 2,000 cap
const REFUND_FEE_MULTIPLIER = 2; // Charge double for refunds

/**
 * Calculate Flutterwave transaction fees
 */
export function calculateFlutterwaveFee(
  amount: number,
  isRefund: boolean = false
): number {
  const baseFee = Math.min(amount * FLUTTERWAVE_FEE_RATE, FLUTTERWAVE_FEE_CAP);
  return isRefund ? baseFee * REFUND_FEE_MULTIPLIER : baseFee;
}

/**
 * Calculate total amount to charge including service fees
 */
export function calculateTotalChargeAmount(rentAmount: number): number {
  const transactionFee = calculateFlutterwaveFee(rentAmount);
  const refundReserveFee = calculateFlutterwaveFee(rentAmount, true);
  
  return rentAmount + transactionFee + refundReserveFee;
}

/**
 * Calculate commission breakdown for a rental payment
 */
export function calculateCommissionBreakdown(
  rentAmount: number,
  parties: CommissionParties
): CommissionBreakdown {
  // Calculate platform commission (20% of rent)
  const platformCommission = rentAmount * PLATFORM_COMMISSION_RATE;
  
  // Calculate agent commissions
  let listingAgentCommission = 0;
  let subAgentCommission = 0;
  let newcondoAmount = platformCommission; // Default: Newcondo gets all commission
  
  if (parties.hasListingAgent) {
    // Agents get 50% of platform commission
    const totalAgentCommission = platformCommission * AGENT_SPLIT_RATE;
    
    if (parties.hasSubAgent) {
      // Split equally between listing agent and sub-agent
      listingAgentCommission = totalAgentCommission * 0.5;
      subAgentCommission = totalAgentCommission * 0.5;
    } else {
      // Listing agent gets full agent commission
      listingAgentCommission = totalAgentCommission;
    }
    
    // Newcondo gets remaining 50% of platform commission
    newcondoAmount = platformCommission * AGENT_SPLIT_RATE;
  }
  
  // Property owner gets rent minus platform commission
  const propertyOwnerAmount = rentAmount - platformCommission;
  
  // Transaction fees
  const transactionFee = calculateFlutterwaveFee(rentAmount);
  const refundReserveFee = calculateFlutterwaveFee(rentAmount, true);
  const totalTransactionFees = transactionFee + refundReserveFee;
  
  return {
    rentAmount,
    platformCommission,
    listingAgentCommission,
    subAgentCommission,
    propertyOwnerAmount,
    newcondoAmount,
    transactionFee: totalTransactionFees,
    totalDeductions: platformCommission + totalTransactionFees,
  };
}

/**
 * Calculate agent earnings for a specific commission amount
 */
export function calculateAgentEarnings(
  totalPlatformCommission: number,
  isSubAgent: boolean = false
): number {
  const totalAgentCommission = totalPlatformCommission * AGENT_SPLIT_RATE;
  return isSubAgent ? totalAgentCommission * 0.5 : totalAgentCommission;
}

/**
 * Calculate marking job compensation
 */
export interface MarkingJobCompensation {
  totalFee: number; // Amount property owner pays
  agentCompensation: number; // 25% to agent/renter
  newcondoCompensation: number; // 75% to Newcondo
  initialRelease: number; // Small amount released on marking (1000 NGN)
  finalRelease: number; // Remaining amount after confirmation
}

const MARKING_JOB_FEE = 20000; // NGN 20,000
const MARKING_AGENT_RATE = 0.25; // 25% to agent
const MARKING_INITIAL_RELEASE = 1000; // NGN 1,000 released on marking

export function calculateMarkingJobCompensation(): MarkingJobCompensation {
  const agentCompensation = MARKING_JOB_FEE * MARKING_AGENT_RATE;
  const newcondoCompensation = MARKING_JOB_FEE - agentCompensation;
  const finalRelease = agentCompensation - MARKING_INITIAL_RELEASE;
  
  return {
    totalFee: MARKING_JOB_FEE,
    agentCompensation,
    newcondoCompensation,
    initialRelease: MARKING_INITIAL_RELEASE,
    finalRelease,
  };
}

/**
 * Calculate available withdrawal amount from virtual account
 */
export function calculateAvailableWithdrawal(
  totalBalance: number,
  pendingReleases: number,
  minimumBalance: number = 0
): number {
  const available = totalBalance - pendingReleases - minimumBalance;
  return Math.max(0, available);
}

/**
 * Format currency for display
 */
export function formatCurrency(
  amount: number,
  currency: string = 'NGN',
  locale: string = 'en-NG'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calculate commission rate percentage
 */
export function calculateCommissionRate(
  commission: number,
  rentAmount: number
): number {
  if (rentAmount === 0) return 0;
  return (commission / rentAmount) * 100;
}

/**
 * Calculate projected earnings based on property price
 */
export function calculateProjectedEarnings(
  monthlyRent: number,
  parties: CommissionParties,
  months: number = 12
): {
  annualRent: number;
  projectedCommission: number;
  projectedEarnings: number;
} {
  const annualRent = monthlyRent * months;
  const breakdown = calculateCommissionBreakdown(monthlyRent, parties);
  
  const projectedCommission = breakdown.platformCommission * months;
  const projectedEarnings = parties.hasListingAgent
    ? breakdown.listingAgentCommission * months
    : 0;
  
  return {
    annualRent,
    projectedCommission,
    projectedEarnings,
  };
}