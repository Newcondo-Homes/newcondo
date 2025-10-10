// backend/shared/src/constants/markingFees.ts

/**
 * Property Marking Service Fee Structure
 * All amounts in Naira (NGN)
 */

/**
 * Base marking fee charged to property owners
 */
export const MARKING_BASE_FEE = 20000; // ₦20,000

/**
 * Fee for Newcondo admin to mark a property
 */
export const NEWCONDO_ADMIN_MARKING_FEE = 25000; // ₦25,000

/**
 * Agent/Renter commission percentage for marking jobs
 */
export const AGENT_COMMISSION_PERCENTAGE = 25; // 25%

/**
 * Calculate agent commission from marking fee
 */
export const calculateAgentCommission = (markingFee: number): number => {
  return (markingFee * AGENT_COMMISSION_PERCENTAGE) / 100;
};

/**
 * Calculate platform fee (remaining after agent commission)
 */
export const calculatePlatformFee = (markingFee: number): number => {
  return markingFee - calculateAgentCommission(markingFee);
};

/**
 * Initial payment to agent upon marking (before confirmation)
 * Small advance to incentivize quick marking
 */
export const INITIAL_AGENT_PAYMENT = 1000; // ₦1,000

/**
 * Calculate remaining payment after initial advance
 */
export const calculateRemainingPayment = (markingFee: number): number => {
  return calculateAgentCommission(markingFee) - INITIAL_AGENT_PAYMENT;
};

/**
 * Time-based compensation for expired confirmations
 * If property owner doesn't confirm within deadline, agent gets paid incrementally
 */
export const COMPENSATION_PER_EXPIRY = 2000; // ₦2,000 per expiry cycle

/**
 * Maximum number of expiry cycles before full payment
 */
export const MAX_EXPIRY_CYCLES = Math.ceil(
  calculateAgentCommission(MARKING_BASE_FEE) / COMPENSATION_PER_EXPIRY
);

/**
 * Fee breakdown for property owner
 */
export interface MarkingFeeBreakdown {
  totalFee: number;
  agentCommission: number;
  platformFee: number;
  initialPayment: number;
  remainingPayment: number;
}

/**
 * Get complete fee breakdown
 */
export const getMarkingFeeBreakdown = (
  markingFee: number = MARKING_BASE_FEE
): MarkingFeeBreakdown => {
  const agentCommission = calculateAgentCommission(markingFee);
  
  return {
    totalFee: markingFee,
    agentCommission,
    platformFee: calculatePlatformFee(markingFee),
    initialPayment: INITIAL_AGENT_PAYMENT,
    remainingPayment: agentCommission - INITIAL_AGENT_PAYMENT
  };
};

/**
 * Marking service type pricing
 */
export enum MarkingServiceType {
  SELF_MARK = 'SELF_MARK', // Free - owner marks themselves
  PERSONAL_CONTACT = 'PERSONAL_CONTACT', // Free - owner sends someone they know
  NEWCONDO_AGENT = 'NEWCONDO_AGENT', // ₦20,000 - Assign to platform agent
  NEWCONDO_ADMIN = 'NEWCONDO_ADMIN' // ₦25,000 - Admin marks
}

/**
 * Get fee for marking service type
 */
export const getMarkingFeeByType = (serviceType: MarkingServiceType): number => {
  switch (serviceType) {
    case MarkingServiceType.SELF_MARK:
      return 0;
    case MarkingServiceType.PERSONAL_CONTACT:
      return 0;
    case MarkingServiceType.NEWCONDO_AGENT:
      return MARKING_BASE_FEE;
    case MarkingServiceType.NEWCONDO_ADMIN:
      return NEWCONDO_ADMIN_MARKING_FEE;
    default:
      return 0;
  }
};

/**
 * Time-based pricing modifiers (for future use)
 */
export const URGENCY_MULTIPLIERS = {
  LOW: 1.0, // No additional fee
  NORMAL: 1.0, // No additional fee
  HIGH: 1.2, // 20% increase
  URGENT: 1.5 // 50% increase
};

/**
 * Calculate total fee with urgency modifier
 */
export const calculateFeeWithUrgency = (
  baseFee: number,
  urgencyLevel: keyof typeof URGENCY_MULTIPLIERS
): number => {
  return baseFee * URGENCY_MULTIPLIERS[urgencyLevel];
};

/**
 * Refund policy constants
 */
export const REFUND_POLICY = {
  FULL_REFUND_HOURS: 24, // Full refund if cancelled within 24 hours
  PARTIAL_REFUND_PERCENTAGE: 50, // 50% refund after 24 hours
  NO_REFUND_HOURS: 48 // No refund after 48 hours
};

/**
 * Calculate refund amount based on time elapsed
 */
export const calculateRefundAmount = (
  paidAmount: number,
  hoursElapsed: number
): number => {
  if (hoursElapsed <= REFUND_POLICY.FULL_REFUND_HOURS) {
    return paidAmount;
  } else if (hoursElapsed <= REFUND_POLICY.NO_REFUND_HOURS) {
    return (paidAmount * REFUND_POLICY.PARTIAL_REFUND_PERCENTAGE) / 100;
  }
  return 0;
};

/**
 * Fee display formatting
 */
export const formatFeeDisplay = (amount: number): string => {
  return `₦${amount.toLocaleString('en-NG')}`;
};

/**
 * Fee validation
 */
export const isValidMarkingFee = (amount: number): boolean => {
  return amount >= 0 && amount <= 100000; // Max ₦100,000
};