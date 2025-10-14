// apps/platform/lib/constants/markingFees.ts

/**
 * Fee structure for property marking service
 * All amounts in Nigerian Naira (NGN)
 */

export const MARKING_FEES = {
  // Base marking fee paid by property owner
  BASE_MARKING_FEE: 20000, // ₦20,000

  // Newcondo admin marking fee
  ADMIN_MARKING_FEE: 25000, // ₦25,000

  // Agent/Renter compensation structure
  AGENT_COMMISSION_PERCENTAGE: 0.25, // 25% of base fee
  AGENT_COMMISSION_AMOUNT: 5000, // ₦5,000 (25% of 20,000)

  // Platform fee (remainder after agent commission)
  PLATFORM_FEE_PERCENTAGE: 0.75, // 75% of base fee
  PLATFORM_FEE_AMOUNT: 15000, // ₦15,000 (75% of 20,000)

  // Initial partial payment for marking completion
  INITIAL_PARTIAL_PAYMENT: 1000, // ₦1,000 sent immediately after marking
  INITIAL_PAYMENT_PERCENTAGE: 0.2, // 20% of total agent commission

  // Remaining payment after owner confirmation
  REMAINING_PAYMENT: 4000, // ₦4,000 released after owner confirms
  REMAINING_PAYMENT_PERCENTAGE: 0.8, // 80% of total agent commission

  // Compensation for timeout/expired confirmation
  TIMEOUT_COMPENSATION: 1000, // ₦1,000 per timeout occurrence
  MAX_TIMEOUT_COMPENSATIONS: 5, // Maximum number of timeout compensations

  // Currency
  CURRENCY: 'NGN',
  CURRENCY_SYMBOL: '₦',
} as const;

/**
 * Calculate agent commission from marking fee
 */
export function calculateAgentCommission(markingFee: number): number {
  return markingFee * MARKING_FEES.AGENT_COMMISSION_PERCENTAGE;
}

/**
 * Calculate platform fee from marking fee
 */
export function calculatePlatformFee(markingFee: number): number {
  return markingFee * MARKING_FEES.PLATFORM_FEE_PERCENTAGE;
}

/**
 * Calculate initial partial payment to agent
 */
export function calculateInitialPayment(totalCommission: number): number {
  return totalCommission * MARKING_FEES.INITIAL_PAYMENT_PERCENTAGE;
}

/**
 * Calculate remaining payment after confirmation
 */
export function calculateRemainingPayment(totalCommission: number): number {
  return totalCommission * MARKING_FEES.REMAINING_PAYMENT_PERCENTAGE;
}

/**
 * Calculate total timeout compensation
 */
export function calculateTimeoutCompensation(timeoutCount: number): number {
  const validTimeouts = Math.min(timeoutCount, MARKING_FEES.MAX_TIMEOUT_COMPENSATIONS);
  return validTimeouts * MARKING_FEES.TIMEOUT_COMPENSATION;
}

/**
 * Get marking fee breakdown
 */
export interface MarkingFeeBreakdown {
  totalFee: number;
  agentCommission: number;
  platformFee: number;
  initialPayment: number;
  remainingPayment: number;
  currency: string;
  currencySymbol: string;
}

export function getMarkingFeeBreakdown(markingFee: number = MARKING_FEES.BASE_MARKING_FEE): MarkingFeeBreakdown {
  const agentCommission = calculateAgentCommission(markingFee);
  const platformFee = calculatePlatformFee(markingFee);
  const initialPayment = calculateInitialPayment(agentCommission);
  const remainingPayment = calculateRemainingPayment(agentCommission);

  return {
    totalFee: markingFee,
    agentCommission,
    platformFee,
    initialPayment,
    remainingPayment,
    currency: MARKING_FEES.CURRENCY,
    currencySymbol: MARKING_FEES.CURRENCY_SYMBOL,
  };
}

/**
 * Format amount as currency
 */
export function formatMarkingFee(amount: number): string {
  return `${MARKING_FEES.CURRENCY_SYMBOL}${amount.toLocaleString('en-NG')}`;
}