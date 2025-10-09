// backend/marking-service/src/services/compensationService.ts

import { PrismaClient, PaymentStatus, Prisma } from '@newcondo/db';

const prisma = new PrismaClient();

interface CompensationBreakdown {
  totalFee: number;
  agentCompensation: number;
  platformFee: number;
  agentPercentage: number;
  platformPercentage: number;
}

interface PartialPaymentCalculation {
  amount: number;
  remainingFee: number;
  paymentNumber: number;
  isFullPayment: boolean;
}

interface CompensationHistory {
  totalPaid: number;
  remainingBalance: number;
  paymentCount: number;
  payments: Array<{
    amount: number;
    paidAt: Date;
    paymentNumber: number;
  }>;
}

export class CompensationService {
  // Constants based on requirements
  private static readonly MARKING_FEE_NAIRA = 20000;
  private static readonly NEWCONDO_ADMIN_FEE_NAIRA = 25000;
  private static readonly AGENT_PERCENTAGE = 0.25; // 25%
  private static readonly PLATFORM_PERCENTAGE = 0.75; // 75%
  private static readonly PARTIAL_PAYMENT_AMOUNT = 1000; // Initial payment to agent
  private static readonly CONFIRMATION_WINDOW_DAYS = 3; // 2-3 days for owner confirmation

  /**
   * Calculate compensation breakdown for agent marking
   */
  static calculateCompensation(
    markingFee: number = this.MARKING_FEE_NAIRA
  ): CompensationBreakdown {
    const agentCompensation = markingFee * this.AGENT_PERCENTAGE;
    const platformFee = markingFee * this.PLATFORM_PERCENTAGE;

    return {
      totalFee: markingFee,
      agentCompensation: parseFloat(agentCompensation.toFixed(2)),
      platformFee: parseFloat(platformFee.toFixed(2)),
      agentPercentage: this.AGENT_PERCENTAGE * 100,
      platformPercentage: this.PLATFORM_PERCENTAGE * 100,
    };
  }

  /**
   * Calculate Newcondo admin marking fee
   */
  static getAdminMarkingFee(): number {
    return this.NEWCONDO_ADMIN_FEE_NAIRA;
  }

  /**
   * Calculate partial payment for agent upon completion (before owner confirmation)
   */
  static calculatePartialPayment(
    markingFee: number = this.MARKING_FEE_NAIRA
  ): PartialPaymentCalculation {
    const totalAgentCompensation = markingFee * this.AGENT_PERCENTAGE;
    const partialAmount = this.PARTIAL_PAYMENT_AMOUNT;
    const remainingAmount = totalAgentCompensation - partialAmount;

    return {
      amount: partialAmount,
      remainingFee: parseFloat(remainingAmount.toFixed(2)),
      paymentNumber: 1,
      isFullPayment: false,
    };
  }

  /**
   * Calculate remaining payment after owner confirmation
   */
  static calculateRemainingPayment(
    markingFee: number = this.MARKING_FEE_NAIRA,
    alreadyPaid: number = this.PARTIAL_PAYMENT_AMOUNT
  ): number {
    const totalAgentCompensation = markingFee * this.AGENT_PERCENTAGE;
    const remaining = totalAgentCompensation - alreadyPaid;
    return parseFloat(Math.max(0, remaining).toFixed(2));
  }

  /**
   * Process payment to agent's virtual account
   */
  static async processAgentPayment(
    agentId: string,
    markingJobId: string,
    amount: number,
    description: string,
    isPartial: boolean = false
  ): Promise<any> {
    try {
      // Get agent's virtual account
      const virtualAccount = await prisma.virtualAccount.findFirst({
        where: { userId: agentId, isActive: true },
      });

      if (!virtualAccount) {
        throw new Error('Agent does not have an active virtual account');
      }

      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          userId: agentId,
          markingJobId,
          amount: new Prisma.Decimal(amount),
          currency: 'NGN',
          paymentType: 'PROPERTY_MARKING',
          status: isPartial ? PaymentStatus.HELD : PaymentStatus.SUCCESS,
          description,
          paidAt: new Date(),
          isReleased: !isPartial,
          releasedAt: isPartial ? null : new Date(),
        },
      });

      // Update virtual account balance
      await prisma.virtualAccount.update({
        where: { id: virtualAccount.id },
        data: {
          balance: {
            increment: new Prisma.Decimal(amount),
          },
        },
      });

      return {
        success: true,
        payment,
        virtualAccount,
        message: isPartial
          ? 'Partial payment held pending owner confirmation'
          : 'Full payment released to agent',
      };
    } catch (error) {
      console.error('Error processing agent payment:', error);
      throw error;
    }
  }

  /**
   * Release held payment after owner confirmation
   */
  static async releaseHeldPayment(
    paymentId: string,
    remainingAmount: number
  ): Promise<any> {
    try {
      // Get payment details
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { user: true },
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== PaymentStatus.HELD) {
        throw new Error('Payment is not in HELD status');
      }

      // Update payment status
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.RELEASED,
          isReleased: true,
          releasedAt: new Date(),
        },
      });

      // Process remaining payment
      if (remainingAmount > 0) {
        await this.processAgentPayment(
          payment.userId,
          payment.markingJobId!,
          remainingAmount,
          'Remaining payment after owner confirmation',
          false
        );
      }

      return {
        success: true,
        message: 'Payment released successfully',
        totalReleased: payment.amount.toNumber() + remainingAmount,
      };
    } catch (error) {
      console.error('Error releasing held payment:', error);
      throw error;
    }
  }

  /**
   * Process compensation for expired confirmation period
   */
  static async processExpiredConfirmationCompensation(
    markingJobId: string,
    agentId: string,
    markingFee: number = this.MARKING_FEE_NAIRA
  ): Promise<any> {
    try {
      const compensation = this.calculateCompensation(markingFee);
      const partialPayment = this.calculatePartialPayment(markingFee);

      // Get existing payments
      const existingPayments = await prisma.payment.findMany({
        where: {
          markingJobId,
          userId: agentId,
        },
      });

      const totalPaid = existingPayments.reduce(
        (sum, p) => sum + p.amount.toNumber(),
        0
      );

      const remainingAmount = compensation.agentCompensation - totalPaid;

      if (remainingAmount > 0) {
        // Pay another partial amount
        const nextPartialAmount = Math.min(partialPayment.amount, remainingAmount);

        await this.processAgentPayment(
          agentId,
          markingJobId,
          nextPartialAmount,
          'Partial compensation for expired confirmation',
          true
        );

        return {
          success: true,
          compensated: nextPartialAmount,
          remainingBalance: remainingAmount - nextPartialAmount,
          fullyPaid: remainingAmount - nextPartialAmount <= 0,
        };
      }

      return {
        success: true,
        message: 'Agent already fully compensated',
        fullyPaid: true,
      };
    } catch (error) {
      console.error('Error processing expired compensation:', error);
      throw error;
    }
  }

  /**
   * Calculate platform revenue from marking job
   */
  static calculatePlatformRevenue(markingFee: number = this.MARKING_FEE_NAIRA): number {
    return parseFloat((markingFee * this.PLATFORM_PERCENTAGE).toFixed(2));
  }

  /**
   * Get compensation history for a marking job
   */
  static async getCompensationHistory(
    markingJobId: string,
    agentId: string
  ): Promise<CompensationHistory> {
    const payments = await prisma.payment.findMany({
      where: {
        markingJobId,
        userId: agentId,
        paymentType: 'PROPERTY_MARKING',
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const totalPaid = payments.reduce((sum, p) => sum + p.amount.toNumber(), 0);

    // Get marking job to determine total fee
    const markingJob = await prisma.propertyMarkingJob.findUnique({
      where: { id: markingJobId },
    });

    const totalAgentCompensation = markingJob
      ? markingJob.markingFee.toNumber() * this.AGENT_PERCENTAGE
      : this.MARKING_FEE_NAIRA * this.AGENT_PERCENTAGE;

    return {
      totalPaid: parseFloat(totalPaid.toFixed(2)),
      remainingBalance: parseFloat((totalAgentCompensation - totalPaid).toFixed(2)),
      paymentCount: payments.length,
      payments: payments.map((p, index) => ({
        amount: p.amount.toNumber(),
        paidAt: p.createdAt,
        paymentNumber: index + 1,
      })),
    };
  }

  /**
   * Validate if agent can receive more compensation
   */
  static async canReceiveMoreCompensation(
    markingJobId: string,
    agentId: string
  ): Promise<boolean> {
    const history = await this.getCompensationHistory(markingJobId, agentId);
    return history.remainingBalance > 0;
  }

  /**
   * Get confirmation deadline for marking job
   */
  static getConfirmationDeadline(completedAt: Date): Date {
    const deadline = new Date(completedAt);
    deadline.setDate(deadline.getDate() + this.CONFIRMATION_WINDOW_DAYS);
    return deadline;
  }

  /**
   * Check if confirmation period has expired
   */
  static isConfirmationExpired(completedAt: Date): boolean {
    const deadline = this.getConfirmationDeadline(completedAt);
    return new Date() > deadline;
  }

  /**
   * Calculate refund amount for cancelled marking job
   */
  static calculateRefundAmount(
    markingFee: number,
    jobStatus: string
  ): number {
    // If job was not assigned or started, full refund
    if (jobStatus === 'QUEUED') {
      return markingFee;
    }

    // If job was assigned but not completed, partial refund (50%)
    if (jobStatus === 'ASSIGNED' || jobStatus === 'IN_PROGRESS') {
      return parseFloat((markingFee * 0.5).toFixed(2));
    }

    // If job was completed, no refund
    return 0;
  }

  /**
   * Get compensation statistics for an agent
   */
  static async getAgentCompensationStats(agentId: string): Promise<{
    totalEarnings: number;
    pendingEarnings: number;
    releasedEarnings: number;
    jobsCompleted: number;
    averageEarningsPerJob: number;
  }> {
    const payments = await prisma.payment.findMany({
      where: {
        userId: agentId,
        paymentType: 'PROPERTY_MARKING',
      },
    });

    const totalEarnings = payments.reduce((sum, p) => sum + p.amount.toNumber(), 0);
    const pendingEarnings = payments
      .filter((p) => p.status === PaymentStatus.HELD)
      .reduce((sum, p) => sum + p.amount.toNumber(), 0);
    const releasedEarnings = payments
      .filter((p) => p.isReleased)
      .reduce((sum, p) => sum + p.amount.toNumber(), 0);

    const uniqueJobs = new Set(payments.map((p) => p.markingJobId).filter(Boolean));
    const jobsCompleted = uniqueJobs.size;

    return {
      totalEarnings: parseFloat(totalEarnings.toFixed(2)),
      pendingEarnings: parseFloat(pendingEarnings.toFixed(2)),
      releasedEarnings: parseFloat(releasedEarnings.toFixed(2)),
      jobsCompleted,
      averageEarningsPerJob:
        jobsCompleted > 0
          ? parseFloat((totalEarnings / jobsCompleted).toFixed(2))
          : 0,
    };
  }
}