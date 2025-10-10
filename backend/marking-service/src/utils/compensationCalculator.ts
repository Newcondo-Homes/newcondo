// backend/marking-service/src/utils/compensationCalculator.ts

import { Decimal } from '@prisma/client/runtime/library';

/**
 * Compensation structure for marking jobs
 */
export interface MarkingCompensation {
  totalFee: Decimal;
  agentShare: Decimal;
  platformShare: Decimal;
  initialPayment: Decimal;
  remainingPayment: Decimal;
  agentPercentage: number;
}

/**
 * Constants for marking compensation
 */
export const MARKING_COMPENSATION_CONFIG = {
  STANDARD_FEE: new Decimal(20000), // 20,000 NGN for user-assigned marking
  NEWCONDO_FEE: new Decimal(25000), // 25,000 NGN for Newcondo marking
  AGENT_PERCENTAGE: 0.25, // 25% of total fee
  INITIAL_PAYMENT: new Decimal(1000), // Initial payment to agent
  CONFIRMATION_WINDOW_HOURS: 72, // 3 days (72 hours)
  TIME_SLOT_HOURS: 3, // 3-hour time slot for marking
} as const;

/**
 * Calculate compensation breakdown for marking job
 */
export function calculateMarkingCompensation(
  totalFee: Decimal
): MarkingCompensation {
  const agentShare = totalFee.mul(MARKING_COMPENSATION_CONFIG.AGENT_PERCENTAGE);
  const platformShare = totalFee.minus(agentShare);
  const initialPayment = MARKING_COMPENSATION_CONFIG.INITIAL_PAYMENT;
  const remainingPayment = agentShare.minus(initialPayment);

  return {
    totalFee,
    agentShare,
    platformShare,
    initialPayment,
    remainingPayment,
    agentPercentage: MARKING_COMPENSATION_CONFIG.AGENT_PERCENTAGE * 100,
  };
}

/**
 * Calculate partial compensation when confirmation expires
 */
export function calculatePartialCompensation(
  agentShare: Decimal,
  initialPayment: Decimal,
  expiredCount: number
): {
  partialPayment: Decimal;
  remainingBalance: Decimal;
  isFullyPaid: boolean;
} {
  const remainingAfterInitial = agentShare.minus(initialPayment);
  const partialPayment = MARKING_COMPENSATION_CONFIG.INITIAL_PAYMENT;
  const totalPaid = initialPayment.plus(partialPayment.mul(expiredCount));
  const remainingBalance = agentShare.minus(totalPaid);
  const isFullyPaid = remainingBalance.lte(0);

  return {
    partialPayment: isFullyPaid ? remainingBalance.plus(partialPayment) : partialPayment,
    remainingBalance: isFullyPaid ? new Decimal(0) : remainingBalance,
    isFullyPaid,
  };
}

/**
 * Calculate compensation for Newcondo-assigned marking
 */
export function calculateNewcondoMarkingCompensation(): MarkingCompensation {
  return calculateMarkingCompensation(MARKING_COMPENSATION_CONFIG.NEWCONDO_FEE);
}

/**
 * Calculate compensation for user-assigned marking
 */
export function calculateUserAssignedMarkingCompensation(): MarkingCompensation {
  return calculateMarkingCompensation(MARKING_COMPENSATION_CONFIG.STANDARD_FEE);
}

/**
 * Get confirmation deadline from marking completion time
 */
export function getConfirmationDeadline(completedAt: Date): Date {
  const deadline = new Date(completedAt);
  deadline.setHours(
    deadline.getHours() + MARKING_COMPENSATION_CONFIG.CONFIRMATION_WINDOW_HOURS
  );
  return deadline;
}

/**
 * Get time slot expiry for assigned agent
 */
export function getTimeSlotExpiry(assignedAt: Date): Date {
  const expiry = new Date(assignedAt);
  expiry.setHours(
    expiry.getHours() + MARKING_COMPENSATION_CONFIG.TIME_SLOT_HOURS
  );
  return expiry;
}

/**
 * Check if confirmation window has expired
 */
export function isConfirmationExpired(deadline: Date): boolean {
  return new Date() > deadline;
}

/**
 * Check if time slot has expired
 */
export function isTimeSlotExpired(expiry: Date): boolean {
  return new Date() > expiry;
}

/**
 * Calculate total compensation paid over multiple expirations
 */
export function calculateTotalCompensationPaid(
  initialPayment: Decimal,
  expiredCount: number
): Decimal {
  const partialPayments = MARKING_COMPENSATION_CONFIG.INITIAL_PAYMENT.mul(
    expiredCount
  );
  return initialPayment.plus(partialPayments);
}

/**
 * Determine if agent should receive full remaining payment
 */
export function shouldReceiveFullPayment(
  agentShare: Decimal,
  totalPaid: Decimal
): boolean {
  const remaining = agentShare.minus(totalPaid);
  return remaining.lte(MARKING_COMPENSATION_CONFIG.INITIAL_PAYMENT);
}

/**
 * Format compensation for display
 */
export function formatCompensation(amount: Decimal, currency = 'NGN'): string {
  return `${currency} ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

/**
 * Calculate estimated completion date (max 3 days from request)
 */
export function getMaxCompletionDate(requestDate: Date): Date {
  const maxDate = new Date(requestDate);
  maxDate.setDate(maxDate.getDate() + 3);
  return maxDate;
}

/**
 * Validate marking fee amount
 */
export function validateMarkingFee(fee: Decimal): boolean {
  const minFee = MARKING_COMPENSATION_CONFIG.STANDARD_FEE;
  const maxFee = MARKING_COMPENSATION_CONFIG.NEWCONDO_FEE;
  return fee.gte(minFee) && fee.lte(maxFee);
}

/**
 * Calculate compensation breakdown for display
 */
export interface CompensationBreakdown {
  totalFee: string;
  agentShare: string;
  platformShare: string;
  initialPayment: string;
  remainingPayment: string;
  agentPercentage: string;
  currency: string;
}

export function getCompensationBreakdown(
  totalFee: Decimal,
  currency = 'NGN'
): CompensationBreakdown {
  const compensation = calculateMarkingCompensation(totalFee);

  return {
    totalFee: formatCompensation(compensation.totalFee, currency),
    agentShare: formatCompensation(compensation.agentShare, currency),
    platformShare: formatCompensation(compensation.platformShare, currency),
    initialPayment: formatCompensation(compensation.initialPayment, currency),
    remainingPayment: formatCompensation(compensation.remainingPayment, currency),
    agentPercentage: `${compensation.agentPercentage}%`,
    currency,
  };
}