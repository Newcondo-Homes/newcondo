// backend/payment-service/src/services/partialPaymentService.ts

import { PrismaClient, PaymentStatus, PaymentType, MarkingJobStatus } from '@newcondo/db';
import { Decimal } from '@prisma/client/runtime/library';
import { commissionSplitService } from './commissionSplitService';
import { virtualAccountService } from './virtualAccountService';
import { notificationService } from '../../../shared/src/utils/notification';

const prisma = new PrismaClient();

interface ProcessPartialPaymentInput {
  markingJobId: string;
  triggeredBy: string;
}

interface ReleaseRemainingPaymentInput {
  markingJobId: string;
  confirmedBy: string;
}

interface TimeoutCompensationInput {
  markingJobId: string;
  triggeredBy: string;
}

export class PartialPaymentService {
  /**
   * Process partial payment (1000 naira) to agent upon marking completion
   */
  async processPartialPayment(input: ProcessPartialPaymentInput) {
    const { markingJobId, triggeredBy } = input;

    // Get marking job with all related data
    const markingJob = await prisma.propertyMarkingJob.findUnique({
      where: { id: markingJobId },
      include: {
        assignedAgent: true,
        requestingUser: true,
        property: true,
      },
    });

    if (!markingJob) {
      throw new Error('Marking job not found');
    }

    if (markingJob.status !== MarkingJobStatus.COMPLETED) {
      throw new Error('Marking job must be completed before processing partial payment');
    }

    if (!markingJob.assignedAgentId) {
      throw new Error('No agent assigned to this marking job');
    }

    // Check if partial payment already processed
    const existingPartialPayment = await prisma.payment.findFirst({
      where: {
        markingJobId,
        description: { contains: 'Partial payment' },
        status: PaymentStatus.SUCCESS,
      },
    });

    if (existingPartialPayment) {
      throw new Error('Partial payment already processed for this marking job');
    }

    // Calculate partial payment split
    const paymentSplit = await commissionSplitService.calculatePartialPaymentSplit(
      Number(markingJob.markingFee)
    );

    // Get agent's virtual account
    const agentVirtualAccount = await prisma.virtualAccount.findFirst({
      where: { userId: markingJob.assignedAgentId },
    });

    if (!agentVirtualAccount) {
      throw new Error('Agent virtual account not found');
    }

    // Create partial payment record
    const partialPayment = await prisma.payment.create({
      data: {
        userId: markingJob.assignedAgentId,
        markingJobId,
        amount: paymentSplit.partialAmount,
        currency: 'NGN',
        paymentType: PaymentType.AGENT_COMMISSION,
        status: PaymentStatus.HELD, // Held until property owner confirms
        description: `Partial payment for marking job #${markingJobId.substring(0, 8)} (awaiting confirmation)`,
        agentCommission: paymentSplit.partialAmount,
        platformFee: new Decimal(0),
      },
    });

    // Credit agent's virtual account with held funds
    await virtualAccountService.creditAccount({
      accountId: agentVirtualAccount.id,
      amount: Number(paymentSplit.partialAmount),
      description: `Partial payment for marking job (held)`,
      isHeld: true,
    });

    // Set confirmation deadline (2-3 days from now)
    const confirmationDeadline = new Date();
    confirmationDeadline.setDate(confirmationDeadline.getDate() + 3);

    await prisma.propertyMarkingJob.update({
      where: { id: markingJobId },
      data: {
        maxCompletionTime: confirmationDeadline,
      },
    });

    // Send notifications
    await Promise.all([
      notificationService.sendPartialPaymentNotification({
        agentId: markingJob.assignedAgentId,
        amount: Number(paymentSplit.partialAmount),
        markingJobId,
      }),
      notificationService.sendConfirmationReminderNotification({
        ownerId: markingJob.requestedBy,
        markingJobId,
        deadline: confirmationDeadline,
      }),
    ]);

    return {
      success: true,
      partialPayment: {
        id: partialPayment.id,
        amount: partialPayment.amount,
        status: partialPayment.status,
        remainingAmount: paymentSplit.remainingAmount,
      },
      confirmationDeadline,
    };
  }

  /**
   * Release remaining payment to agent after property owner confirmation
   */
  async releaseRemainingPayment(input: ReleaseRemainingPaymentInput) {
    const { markingJobId, confirmedBy } = input;

    // Get marking job
    const markingJob = await prisma.propertyMarkingJob.findUnique({
      where: { id: markingJobId },
      include: {
        assignedAgent: true,
        requestingUser: true,
      },
    });

    if (!markingJob) {
      throw new Error('Marking job not found');
    }

    // Verify confirmer is the property owner
    if (markingJob.requestedBy !== confirmedBy) {
      throw new Error('Only the property owner can confirm marking completion');
    }

    if (markingJob.status !== MarkingJobStatus.COMPLETED) {
      throw new Error('Marking job must be completed');
    }

    if (!markingJob.assignedAgentId) {
      throw new Error('No agent assigned to this marking job');
    }

    // Get partial payment
    const partialPayment = await prisma.payment.findFirst({
      where: {
        markingJobId,
        description: { contains: 'Partial payment' },
        status: PaymentStatus.HELD,
      },
    });

    if (!partialPayment) {
      throw new Error('Partial payment not found or already released');
    }

    // Calculate remaining payment
    const paymentSplit = await commissionSplitService.calculatePartialPaymentSplit(
      Number(markingJob.markingFee)
    );

    // Get agent's virtual account
    const agentVirtualAccount = await prisma.virtualAccount.findFirst({
      where: { userId: markingJob.assignedAgentId },
    });

    if (!agentVirtualAccount) {
      throw new Error('Agent virtual account not found');
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Release partial payment
      await tx.payment.update({
        where: { id: partialPayment.id },
        data: {
          status: PaymentStatus.RELEASED,
          isReleased: true,
          releasedAt: new Date(),
        },
      });

      // Create remaining payment record
      const remainingPayment = await tx.payment.create({
        data: {
          userId: markingJob.assignedAgentId,
          markingJobId,
          amount: paymentSplit.remainingAmount,
          currency: 'NGN',
          paymentType: PaymentType.AGENT_COMMISSION,
          status: PaymentStatus.SUCCESS,
          description: `Final payment for marking job #${markingJobId.substring(0, 8)}`,
          agentCommission: paymentSplit.remainingAmount,
          platformFee: new Decimal(0),
          paidAt: new Date(),
        },
      });

      // Credit remaining amount to agent's virtual account
      await virtualAccountService.creditAccount({
        accountId: agentVirtualAccount.id,
        amount: Number(paymentSplit.remainingAmount),
        description: `Final payment for marking job`,
        isHeld: false,
      });

      // Release held funds from partial payment
      await virtualAccountService.releaseHeldFunds({
        accountId: agentVirtualAccount.id,
        amount: Number(paymentSplit.partialAmount),
      });

      return { partialPayment, remainingPayment };
    });

    // Send notification to agent
    await notificationService.sendFullPaymentReleasedNotification({
      agentId: markingJob.assignedAgentId,
      totalAmount: Number(paymentSplit.totalAgentCommission),
      markingJobId,
    });

    return {
      success: true,
      message: 'Payment released successfully',
      payments: {
        partial: {
          id: result.partialPayment.id,
          amount: result.partialPayment.amount,
          status: PaymentStatus.RELEASED,
        },
        remaining: {
          id: result.remainingPayment.id,
          amount: result.remainingPayment.amount,
          status: PaymentStatus.SUCCESS,
        },
        total: paymentSplit.totalAgentCommission,
      },
    };
  }

  /**
   * Process timeout compensation when property owner doesn't confirm within deadline
   */
  async processTimeoutCompensation(input: TimeoutCompensationInput) {
    const { markingJobId, triggeredBy } = input;

    // Get marking job
    const markingJob = await prisma.propertyMarkingJob.findUnique({
      where: { id: markingJobId },
      include: {
        assignedAgent: true,
      },
    });

    if (!markingJob) {
      throw new Error('Marking job not found');
    }

    if (!markingJob.assignedAgentId) {
      throw new Error('No agent assigned');
    }

    // Check if deadline has passed
    if (!markingJob.maxCompletionTime || new Date() < markingJob.maxCompletionTime) {
      throw new Error('Confirmation deadline has not passed yet');
    }

    // Get all compensation payments made so far
    const compensationPayments = await prisma.payment.findMany({
      where: {
        markingJobId,
        description: { contains: 'Timeout compensation' },
      },
    });

    // Calculate compensation
    const compensationCalc = await commissionSplitService.calculateTimeoutCompensation(
      Number(markingJob.markingFee),
      compensationPayments.length
    );

    if (!compensationCalc.canCompensate) {
      throw new Error('Maximum compensation reached. Property owner must initiate new marking job');
    }

    // Get agent's virtual account
    const agentVirtualAccount = await prisma.virtualAccount.findFirst({
      where: { userId: markingJob.assignedAgentId },
    });

    if (!agentVirtualAccount) {
      throw new Error('Agent virtual account not found');
    }

    // Create compensation payment
    const compensationPayment = await prisma.payment.create({
      data: {
        userId: markingJob.assignedAgentId,
        markingJobId,
        amount: compensationCalc.compensationAmount,
        currency: 'NGN',
        paymentType: PaymentType.AGENT_COMMISSION,
        status: PaymentStatus.SUCCESS,
        description: `Timeout compensation #${compensationCalc.compensationCount} for marking job #${markingJobId.substring(0, 8)}`,
        agentCommission: compensationCalc.compensationAmount,
        paidAt: new Date(),
      },
    });

    // Credit agent's account
    await virtualAccountService.creditAccount({
      accountId: agentVirtualAccount.id,
      amount: Number(compensationCalc.compensationAmount),
      description: `Timeout compensation payment`,
      isHeld: false,
    });

    // Update confirmation deadline (another 3 days)
    const newDeadline = new Date();
    newDeadline.setDate(newDeadline.getDate() + 3);

    await prisma.propertyMarkingJob.update({
      where: { id: markingJobId },
      data: {
        maxCompletionTime: newDeadline,
      },
    });

    // Send notifications
    await Promise.all([
      notificationService.sendTimeoutCompensationNotification({
        agentId: markingJob.assignedAgentId,
        amount: Number(compensationCalc.compensationAmount),
        cycleNumber: compensationCalc.compensationCount,
        remainingAmount: Number(compensationCalc.remainingFee),
      }),
      notificationService.sendOwnerTimeoutWarningNotification({
        ownerId: markingJob.requestedBy,
        markingJobId,
        compensationPaid: Number(compensationCalc.compensationAmount),
        newDeadline,
      }),
    ]);

    return {
      success: true,
      compensation: {
        id: compensationPayment.id,
        amount: compensationPayment.amount,
        cycleNumber: compensationCalc.compensationCount,
        remainingFee: compensationCalc.remainingFee,
        newDeadline,
      },
    };
  }

  /**
   * Get partial payment status for a marking job
   */
  async getPartialPaymentStatus(markingJobId: string, userId: string) {
    const markingJob = await prisma.propertyMarkingJob.findUnique({
      where: { id: markingJobId },
      include: {
        assignedAgent: true,
        requestingUser: true,
      },
    });

    if (!markingJob) {
      throw new Error('Marking job not found');
    }

    // Check authorization
    const isAuthorized =
      markingJob.requestedBy === userId || markingJob.assignedAgentId === userId;

    if (!isAuthorized) {
      throw new Error('Unauthorized');
    }

    // Get all payments for this marking job
    const payments = await prisma.payment.findMany({
      where: { markingJobId },
      orderBy: { createdAt: 'asc' },
    });

    const partialPayment = payments.find((p) => p.description?.includes('Partial payment'));
    const remainingPayment = payments.find((p) => p.description?.includes('Final payment'));
    const compensationPayments = payments.filter((p) =>
      p.description?.includes('Timeout compensation')
    );

    const totalPaid = payments
      .filter((p) => p.status === PaymentStatus.SUCCESS || p.status === PaymentStatus.RELEASED)
      .reduce((sum, p) => sum.add(p.amount), new Decimal(0));

    const paymentSplit = await commissionSplitService.calculatePartialPaymentSplit(
      Number(markingJob.markingFee)
    );

    return {
      markingJob: {
        id: markingJob.id,
        status: markingJob.status,
        confirmationDeadline: markingJob.maxCompletionTime,
      },
      payments: {
        partial: partialPayment
          ? {
              id: partialPayment.id,
              amount: partialPayment.amount,
              status: partialPayment.status,
              createdAt: partialPayment.createdAt,
            }
          : null,
        remaining: remainingPayment
          ? {
              id: remainingPayment.id,
              amount: remainingPayment.amount,
              status: remainingPayment.status,
              paidAt: remainingPayment.paidAt,
            }
          : null,
        compensations: compensationPayments.map((cp) => ({
          id: cp.id,
          amount: cp.amount,
          createdAt: cp.createdAt,
        })),
      },
      summary: {
        totalAgentCommission: paymentSplit.totalAgentCommission,
        totalPaid,
        remainingBalance: paymentSplit.totalAgentCommission.minus(totalPaid),
        isFullyPaid: totalPaid.greaterThanOrEqualTo(paymentSplit.totalAgentCommission),
      },
    };
  }

  /**
   * Get agent's partial payment history
   */
  async getAgentPartialPayments(
    agentId: string,
    page: number = 1,
    limit: number = 10,
    status?: string
  ) {
    const skip = (page - 1) * limit;

    const where: any = {
      userId: agentId,
      paymentType: PaymentType.AGENT_COMMISSION,
      OR: [
        { description: { contains: 'Partial payment' } },
        { description: { contains: 'Final payment' } },
        { description: { contains: 'Timeout compensation' } },
      ],
    };

    if (status) {
      where.status = status;
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    return {
      payments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Calculate pending partial payments for agent
   */
  async calculatePendingPartialPayments(agentId: string) {
    const heldPayments = await prisma.payment.findMany({
      where: {
        userId: agentId,
        status: PaymentStatus.HELD,
        paymentType: PaymentType.AGENT_COMMISSION,
      },
    });

    const totalHeld = heldPayments.reduce((sum, p) => sum.add(p.amount), new Decimal(0));

    return {
      heldPayments: heldPayments.map((p) => ({
        id: p.id,
        amount: p.amount,
        markingJobId: p.markingJobId,
        createdAt: p.createdAt,
      })),
      totalHeld,
      count: heldPayments.length,
    };
  }

  /**
   * Get payment breakdown for a marking job
   */
  async getPaymentBreakdown(markingJobId: string, userId: string) {
    const markingJob = await prisma.propertyMarkingJob.findUnique({
      where: { id: markingJobId },
    });

    if (!markingJob) {
      throw new Error('Marking job not found');
    }

    const breakdown = await commissionSplitService.getPaymentBreakdown(
      Number(markingJob.markingFee)
    );

    return breakdown;
  }
}

export const partialPaymentService = new PartialPaymentService();