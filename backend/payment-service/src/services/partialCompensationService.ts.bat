// backend/payment-service/src/services/partialCompensationService.ts

import { PrismaClient, PaymentStatus, PaymentType, MarkingJobStatus } from '@newcondo/db';
import { virtualAccountService } from './virtualAccountService';

const prisma = new PrismaClient();

interface CompensationResult {
  success: boolean;
  compensation?: any;
  virtualAccount?: any;
  error?: string;
}

interface PartialCompensationData {
  markingJobId: string;
  agentId: string;
  amount: number;
  reason: string;
  isFinal?: boolean;
}

class PartialCompensationService {
  // Compensation percentages
  private readonly INITIAL_COMPENSATION_PERCENTAGE = 0.05; // 5% (1000 NGN of 20000 NGN)
  private readonly AGENT_COMMISSION_PERCENTAGE = 0.25; // 25%
  private readonly NEWCONDO_FEE_PERCENTAGE = 0.75; // 75%

  /**
   * Calculate compensation amounts
   */
  private calculateCompensationAmounts(totalFee: number) {
    const initialCompensation = totalFee * this.INITIAL_COMPENSATION_PERCENTAGE; // 1000 NGN
    const agentFinalCompensation = totalFee * this.AGENT_COMMISSION_PERCENTAGE; // 5000 NGN
    const remainingAfterInitial = agentFinalCompensation - initialCompensation; // 4000 NGN
    const newcondoFee = totalFee * this.NEWCONDO_FEE_PERCENTAGE; // 15000 NGN

    return {
      initialCompensation,
      agentFinalCompensation,
      remainingAfterInitial,
      newcondoFee,
    };
  }

  /**
   * Release initial compensation to agent (5% = 1000 NGN)
   */
  async releaseInitialCompensation(data: PartialCompensationData): Promise<CompensationResult> {
    try {
      // Verify marking job exists
      const markingJob = await prisma.propertyMarkingJob.findUnique({
        where: { id: data.markingJobId },
        include: {
          assignedAgent: true,
          property: true,
        },
      });

      if (!markingJob) {
        return { success: false, error: 'Marking job not found' };
      }

      if (markingJob.assignedAgentId !== data.agentId) {
        return { success: false, error: 'Agent not assigned to this job' };
      }

      if (markingJob.status !== MarkingJobStatus.COMPLETED) {
        return { success: false, error: 'Job must be completed before compensation' };
      }

      // Check if initial compensation already released
      const existingCompensation = await prisma.payment.findFirst({
        where: {
          markingJobId: data.markingJobId,
          userId: data.agentId,
          paymentType: PaymentType.AGENT_COMMISSION,
          description: { contains: 'Initial compensation' },
        },
      });

      if (existingCompensation) {
        return { success: false, error: 'Initial compensation already released' };
      }

      // Calculate compensation amounts
      const amounts = this.calculateCompensationAmounts(markingJob.markingFee.toNumber());

      // Get or create virtual account for agent
      const virtualAccount = await virtualAccountService.getOrCreateVirtualAccount({
        userId: data.agentId,
      });

      // Create compensation payment record
      const compensation = await prisma.payment.create({
        data: {
          userId: data.agentId,
          markingJobId: data.markingJobId,
          amount: amounts.initialCompensation,
          currency: 'NGN',
          paymentType: PaymentType.AGENT_COMMISSION,
          status: PaymentStatus.HELD,
          description: `Initial compensation (5%) for marking job - ${markingJob.property.title}`,
          agentCommission: amounts.initialCompensation,
          platformFee: 0,
          ownerAmount: 0,
        },
      });

      // Update virtual account balance (but mark as held)
      await prisma.virtualAccount.update({
        where: { id: virtualAccount.id },
        data: {
          balance: {
            increment: amounts.initialCompensation,
          },
        },
      });

      return {
        success: true,
        compensation,
        virtualAccount: {
          accountNumber: virtualAccount.accountNumber,
          balance: virtualAccount.balance.toNumber() + amounts.initialCompensation,
          heldAmount: amounts.initialCompensation,
        },
      };
    } catch (error) {
      console.error('Error releasing initial compensation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to release compensation',
      };
    }
  }

  /**
   * Release final compensation after property owner confirms (remaining 20% = 4000 NGN)
   */
  async releaseFinalCompensation(markingJobId: string): Promise<CompensationResult> {
    try {
      const markingJob = await prisma.propertyMarkingJob.findUnique({
        where: { id: markingJobId },
        include: {
          assignedAgent: true,
          property: true,
        },
      });

      if (!markingJob || !markingJob.assignedAgentId) {
        return { success: false, error: 'Marking job or agent not found' };
      }

      // Check if property owner has confirmed
      const property = await prisma.property.findUnique({
        where: { id: markingJob.propertyId },
      });

      if (!property?.boundaryVerified) {
        return { success: false, error: 'Property boundary not verified by owner' };
      }

      // Get initial compensation
      const initialCompensation = await prisma.payment.findFirst({
        where: {
          markingJobId,
          userId: markingJob.assignedAgentId,
          paymentType: PaymentType.AGENT_COMMISSION,
          description: { contains: 'Initial compensation' },
        },
      });

      if (!initialCompensation) {
        return { success: false, error: 'Initial compensation not found' };
      }

      // Check if final compensation already released
      const existingFinal = await prisma.payment.findFirst({
        where: {
          markingJobId,
          userId: markingJob.assignedAgentId,
          paymentType: PaymentType.AGENT_COMMISSION,
          description: { contains: 'Final compensation' },
        },
      });

      if (existingFinal) {
        return { success: false, error: 'Final compensation already released' };
      }

      // Calculate amounts
      const amounts = this.calculateCompensationAmounts(markingJob.markingFee.toNumber());

      // Release the held initial compensation
      await prisma.payment.update({
        where: { id: initialCompensation.id },
        data: {
          status: PaymentStatus.RELEASED,
          isReleased: true,
          releasedAt: new Date(),
        },
      });

      // Create final compensation payment
      const finalCompensation = await prisma.payment.create({
        data: {
          userId: markingJob.assignedAgentId,
          markingJobId,
          amount: amounts.remainingAfterInitial,
          currency: 'NGN',
          paymentType: PaymentType.AGENT_COMMISSION,
          status: PaymentStatus.RELEASED,
          isReleased: true,
          releasedAt: new Date(),
          description: `Final compensation (20%) for marking job - ${markingJob.property.title}`,
          agentCommission: amounts.remainingAfterInitial,
          platformFee: 0,
          ownerAmount: 0,
        },
      });

      // Update virtual account
      const virtualAccount = await prisma.virtualAccount.findFirst({
        where: { userId: markingJob.assignedAgentId },
      });

      if (virtualAccount) {
        await prisma.virtualAccount.update({
          where: { id: virtualAccount.id },
          data: {
            balance: {
              increment: amounts.remainingAfterInitial,
            },
          },
        });
      }

      // Create platform fee record
      await prisma.payment.create({
        data: {
          userId: markingJob.requestedBy,
          markingJobId,
          amount: amounts.newcondoFee,
          currency: 'NGN',
          paymentType: PaymentType.PROPERTY_MARKING,
          status: PaymentStatus.SUCCESS,
          description: `Platform fee (75%) for marking job - ${markingJob.property.title}`,
          platformFee: amounts.newcondoFee,
          agentCommission: 0,
          ownerAmount: 0,
        },
      });

      return {
        success: true,
        compensation: finalCompensation,
        virtualAccount: virtualAccount ? {
          accountNumber: virtualAccount.accountNumber,
          balance: virtualAccount.balance.toNumber() + amounts.remainingAfterInitial,
        } : undefined,
      };
    } catch (error) {
      console.error('Error releasing final compensation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to release final compensation',
      };
    }
  }

  /**
   * Handle expired confirmation - release small compensation to agent
   */
  async handleExpiredConfirmation(markingJobId: string): Promise<CompensationResult> {
    try {
      const markingJob = await prisma.propertyMarkingJob.findUnique({
        where: { id: markingJobId },
        include: {
          assignedAgent: true,
          property: true,
        },
      });

      if (!markingJob || !markingJob.assignedAgentId) {
        return { success: false, error: 'Marking job or agent not found' };
      }

      // Calculate compensation (initial amount only)
      const amounts = this.calculateCompensationAmounts(markingJob.markingFee.toNumber());

      // Get or update initial compensation to released
      let compensation = await prisma.payment.findFirst({
        where: {
          markingJobId,
          userId: markingJob.assignedAgentId,
          paymentType: PaymentType.AGENT_COMMISSION,
          description: { contains: 'Initial compensation' },
        },
      });

      if (compensation && compensation.status === PaymentStatus.HELD) {
        compensation = await prisma.payment.update({
          where: { id: compensation.id },
          data: {
            status: PaymentStatus.RELEASED,
            isReleased: true,
            releasedAt: new Date(),
            description: `${compensation.description} - Released due to expired confirmation`,
          },
        });
      }

      return {
        success: true,
        compensation,
      };
    } catch (error) {
      console.error('Error handling expired confirmation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to handle expired confirmation',
      };
    }
  }

  /**
   * Get compensation summary for a marking job
   */
  async getCompensationSummary(markingJobId: string) {
    try {
      const compensations = await prisma.payment.findMany({
        where: {
          markingJobId,
          paymentType: PaymentType.AGENT_COMMISSION,
        },
        orderBy: { createdAt: 'asc' },
      });

      const totalReleased = compensations
        .filter(c => c.isReleased)
        .reduce((sum, c) => sum + c.amount.toNumber(), 0);

      const totalHeld = compensations
        .filter(c => !c.isReleased && c.status === PaymentStatus.HELD)
        .reduce((sum, c) => sum + c.amount.toNumber(), 0);

      return {
        compensations,
        totalReleased,
        totalHeld,
        totalCompensation: totalReleased + totalHeld,
      };
    } catch (error) {
      console.error('Error fetching compensation summary:', error);
      throw error;
    }
  }

  /**
   * Get agent's total earnings from marking jobs
   */
  async getAgentEarnings(agentId: string) {
    try {
      const compensations = await prisma.payment.findMany({
        where: {
          userId: agentId,
          paymentType: PaymentType.AGENT_COMMISSION,
          status: PaymentStatus.RELEASED,
        },
      });

      const totalEarnings = compensations.reduce((sum, c) => sum + c.amount.toNumber(), 0);

      const pendingCompensations = await prisma.payment.findMany({
        where: {
          userId: agentId,
          paymentType: PaymentType.AGENT_COMMISSION,
          status: PaymentStatus.HELD,
        },
      });

      const pendingEarnings = pendingCompensations.reduce((sum, c) => sum + c.amount.toNumber(), 0);

      return {
        totalEarnings,
        pendingEarnings,
        completedJobs: compensations.length,
        compensations,
      };
    } catch (error) {
      console.error('Error fetching agent earnings:', error);
      throw error;
    }
  }
}

export const partialCompensationService = new PartialCompensationService();