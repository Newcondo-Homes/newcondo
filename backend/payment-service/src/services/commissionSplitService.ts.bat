// backend/payment-service/src/services/commissionSplitService.ts

import { Decimal } from '@prisma/client/runtime/library';

// Constants for commission calculations
const MARKING_FEE = 20000; // Property owner pays 20,000 naira
const NEWCONDO_MARKING_FEE = 25000; // Newcondo admin marking fee
const AGENT_COMMISSION_PERCENTAGE = 0.25; // 25% goes to agent/renter
const PLATFORM_PERCENTAGE = 0.75; // 75% goes to Newcondo
const PARTIAL_PAYMENT_AMOUNT = 1000; // Initial payment to agent (1000 naira)

interface CommissionSplit {
  totalAmount: number;
  agentCommission: Decimal;
  platformAmount: Decimal;
  agentPercentage: number;
  platformPercentage: number;
}

interface PartialPaymentSplit {
  partialAmount: Decimal;
  remainingAmount: Decimal;
  totalAgentCommission: Decimal;
  platformAmount: Decimal;
}

interface TimeoutCompensationCalculation {
  compensationAmount: Decimal;
  remainingFee: Decimal;
  compensationCount: number;
  canCompensate: boolean;
}

export class CommissionSplitService {
  /**
   * Calculate commission split for marking job (25% agent, 75% platform)
   */
  async calculateMarkingCommission(totalAmount: number): Promise<CommissionSplit> {
    const agentCommission = new Decimal(totalAmount).mul(AGENT_COMMISSION_PERCENTAGE);
    const platformAmount = new Decimal(totalAmount).mul(PLATFORM_PERCENTAGE);

    return {
      totalAmount,
      agentCommission,
      platformAmount,
      agentPercentage: AGENT_COMMISSION_PERCENTAGE * 100,
      platformPercentage: PLATFORM_PERCENTAGE * 100,
    };
  }

  /**
   * Calculate partial payment split (1000 naira upfront, rest after confirmation)
   */
  async calculatePartialPaymentSplit(totalAmount: number): Promise<PartialPaymentSplit> {
    const totalAgentCommission = new Decimal(totalAmount).mul(AGENT_COMMISSION_PERCENTAGE);
    const partialAmount = new Decimal(PARTIAL_PAYMENT_AMOUNT);
    const remainingAmount = totalAgentCommission.minus(partialAmount);
    const platformAmount = new Decimal(totalAmount).mul(PLATFORM_PERCENTAGE);

    return {
      partialAmount,
      remainingAmount,
      totalAgentCommission,
      platformAmount,
    };
  }

  /**
   * Calculate timeout compensation for agents
   * Property owner has 2-3 days to confirm. If they don't, agent gets small compensation
   */
  async calculateTimeoutCompensation(
    totalFee: number,
    currentCompensationCount: number
  ): Promise<TimeoutCompensationCalculation> {
    const totalAgentCommission = new Decimal(totalFee).mul(AGENT_COMMISSION_PERCENTAGE);
    const compensationAmount = new Decimal(PARTIAL_PAYMENT_AMOUNT);
    const totalPossibleCompensations = totalAgentCommission.div(compensationAmount).floor();
    
    const canCompensate = currentCompensationCount < totalPossibleCompensations.toNumber();
    const remainingFee = totalAgentCommission.minus(
      compensationAmount.mul(currentCompensationCount + 1)
    );

    return {
      compensationAmount,
      remainingFee: remainingFee.greaterThan(0) ? remainingFee : new Decimal(0),
      compensationCount: currentCompensationCount + 1,
      canCompensate,
    };
  }

  /**
   * Get standard marking fees
   */
  getMarkingFees() {
    return {
      standardFee: MARKING_FEE,
      newcondoAdminFee: NEWCONDO_MARKING_FEE,
      partialPaymentAmount: PARTIAL_PAYMENT_AMOUNT,
      agentCommissionPercentage: AGENT_COMMISSION_PERCENTAGE * 100,
      platformPercentage: PLATFORM_PERCENTAGE * 100,
    };
  }

  /**
   * Calculate total agent earnings from a marking job
   */
  async calculateTotalAgentEarnings(markingFee: number): Promise<Decimal> {
    return new Decimal(markingFee).mul(AGENT_COMMISSION_PERCENTAGE);
  }

  /**
   * Calculate platform earnings from a marking job
   */
  async calculatePlatformEarnings(markingFee: number): Promise<Decimal> {
    return new Decimal(markingFee).mul(PLATFORM_PERCENTAGE);
  }

  /**
   * Validate if partial payment amount is correct
   */
  validatePartialPaymentAmount(amount: number): boolean {
    return amount === PARTIAL_PAYMENT_AMOUNT;
  }

  /**
   * Calculate remaining balance after partial payments
   */
  async calculateRemainingBalance(
    totalFee: number,
    partialPaymentsMade: number
  ): Promise<Decimal> {
    const totalAgentCommission = new Decimal(totalFee).mul(AGENT_COMMISSION_PERCENTAGE);
    const totalPaidSoFar = new Decimal(PARTIAL_PAYMENT_AMOUNT).mul(partialPaymentsMade);
    const remaining = totalAgentCommission.minus(totalPaidSoFar);

    return remaining.greaterThan(0) ? remaining : new Decimal(0);
  }

  /**
   * Check if all agent commission has been paid out
   */
  async isFullyPaidOut(totalFee: number, amountPaidToAgent: number): Promise<boolean> {
    const totalAgentCommission = new Decimal(totalFee).mul(AGENT_COMMISSION_PERCENTAGE);
    const paidAmount = new Decimal(amountPaidToAgent);

    return paidAmount.greaterThanOrEqualTo(totalAgentCommission);
  }

  /**
   * Calculate payment breakdown for display
   */
  async getPaymentBreakdown(markingFee: number) {
    const agentTotal = new Decimal(markingFee).mul(AGENT_COMMISSION_PERCENTAGE);
    const platformTotal = new Decimal(markingFee).mul(PLATFORM_PERCENTAGE);
    const partialPayment = new Decimal(PARTIAL_PAYMENT_AMOUNT);
    const remainingAgentPayment = agentTotal.minus(partialPayment);

    return {
      totalFee: new Decimal(markingFee),
      agentEarnings: {
        total: agentTotal,
        partial: partialPayment,
        remaining: remainingAgentPayment,
        percentage: AGENT_COMMISSION_PERCENTAGE * 100,
      },
      platformEarnings: {
        total: platformTotal,
        percentage: PLATFORM_PERCENTAGE * 100,
      },
      breakdown: [
        {
          description: 'Agent Initial Payment (Upon Completion)',
          amount: partialPayment,
          percentage: (partialPayment.div(markingFee).toNumber() * 100).toFixed(2),
        },
        {
          description: 'Agent Final Payment (After Confirmation)',
          amount: remainingAgentPayment,
          percentage: (remainingAgentPayment.div(markingFee).toNumber() * 100).toFixed(2),
        },
        {
          description: 'Platform Fee',
          amount: platformTotal,
          percentage: PLATFORM_PERCENTAGE * 100,
        },
      ],
    };
  }

  /**
   * Calculate maximum compensation cycles before fee is exhausted
   */
  async calculateMaxCompensationCycles(markingFee: number): Promise<number> {
    const totalAgentCommission = new Decimal(markingFee).mul(AGENT_COMMISSION_PERCENTAGE);
    const compensationAmount = new Decimal(PARTIAL_PAYMENT_AMOUNT);
    
    return totalAgentCommission.div(compensationAmount).floor().toNumber();
  }

  /**
   * Estimate completion timeline based on compensation cycles
   */
  async estimateCompletionTimeline(currentCycle: number, maxCycles: number) {
    const daysPerCycle = 3; // 2-3 days per confirmation window
    const remainingCycles = maxCycles - currentCycle;
    const estimatedDaysRemaining = remainingCycles * daysPerCycle;

    return {
      currentCycle,
      maxCycles,
      remainingCycles,
      estimatedDaysRemaining,
      needsNewJob: currentCycle >= maxCycles,
    };
  }
}

export const commissionSplitService = new CommissionSplitService();