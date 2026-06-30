// backend/payment-service/src/services/escrowService.ts

import prisma from '@newcondo/db';
import { Decimal } from '@prisma/client/runtime/library';
import { ResponseHandler } from '../../../shared/src/utils/response';
import { EscrowError, InsufficientFundsError } from '../../../shared/src/constants/errors';

interface CreateEscrowParams {
  agentId: string;
  markingJobId: string;
  amount: Decimal | number;
  reason: 'MARKING_JOB_INITIAL' | 'MARKING_JOB_COMPLETION' | 'RENTAL_DEPOSIT';
  description: string;
}

interface ReleaseEscrowParams {
  escrowId: string;
  releaseReason: 'JOB_COMPLETED' | 'JOB_CANCELLED' | 'REFUND';
  notes?: string;
}

interface EscrowTransaction {
  id: string;
  agentId: string;
  markingJobId?: string;
  amount: Decimal;
  status: 'HELD' | 'RELEASED' | 'REFUNDED' | 'EXPIRED';
  reason: string;
  description: string;
  heldAt: Date;
  releasedAt?: Date;
  expiresAt: Date;
  releaseNotes?: string;
}

export class EscrowService {
  /**
   * Create an escrow hold for a marking job initial fee (1000 NGN)
   * This puts the money on temporary hold until the marking is completed/verified
   */
  async createMarkingJobEscrow(params: CreateEscrowParams): Promise<{
    success: boolean;
    escrowId?: string;
    error?: string;
  }> {
    try {
      const { agentId, markingJobId, amount, reason, description } = params;

      // Validate agent exists and has virtual account
      const agent = await prisma.user.findUnique({
        where: { id: agentId },
        include: { virtualAccounts: true },
      });

      if (!agent) {
        return {
          success: false,
          error: 'Agent not found',
        };
      }

      if (!agent.virtualAccounts || agent.virtualAccounts.length === 0) {
        return {
          success: false,
          error: 'Agent does not have a virtual account',
        };
      }

      const virtualAccount = agent.virtualAccounts[0];

      // Check if sufficient balance exists for holding
      // Note: In escrow system, we validate but don't deduct yet
      // The funds will be held at payment gateway level
      const amountToHold = new Decimal(amount);

      // Create escrow record in database
      const escrow = await prisma.$executeRaw`
        INSERT INTO "Escrow" (
          id,
          "agentId",
          "markingJobId",
          amount,
          status,
          reason,
          description,
          "heldAt",
          "expiresAt",
          "createdAt",
          "updatedAt"
        ) VALUES (
          ${this.generateId()},
          ${agentId},
          ${markingJobId},
          ${amountToHold},
          'HELD',
          ${reason},
          ${description},
          NOW(),
          NOW() + INTERVAL '3 days',
          NOW(),
          NOW()
        )
      `;

      // Update virtual account balance to reflect hold
      await prisma.virtualAccount.update({
        where: { id: virtualAccount.id },
        data: {
          balance: virtualAccount.balance.minus(amountToHold),
        },
      });

      // Create payment record with HELD status
      const payment = await prisma.payment.create({
        data: {
          userId: agentId,
          markingJobId,
          amount: amountToHold,
          currency: 'NGN',
          paymentType: 'PROPERTY_MARKING',
          status: 'HELD',
          description: `Escrow: ${description}`,
        },
      });

      return {
        success: true,
        escrowId: payment.id,
      };
    } catch (error) {
      console.error('Error creating escrow:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to create escrow',
      };
    }
  }

  /**
   * Release escrow funds after marking job completion
   * Transfer funds from escrow to agent's available balance
   */
  async releaseMarkingJobEscrow(params: ReleaseEscrowParams): Promise<{
    success: boolean;
    releasedAmount?: Decimal;
    error?: string;
  }> {
    try {
      const { escrowId, releaseReason, notes } = params;

      // Get escrow/payment record
      const payment = await prisma.payment.findUnique({
        where: { id: escrowId },
      });

      if (!payment) {
        return {
          success: false,
          error: 'Escrow record not found',
        };
      }

      if (payment.status !== 'HELD') {
        return {
          success: false,
          error: `Escrow cannot be released. Current status: ${payment.status}`,
        };
      }

      // Update payment status to RELEASED
      const updatedPayment = await prisma.payment.update({
        where: { id: escrowId },
        data: {
          status: 'RELEASED',
          releasedAt: new Date(),
          description: `${payment.description} - Released: ${releaseReason} ${notes ? `(${notes})` : ''}`,
        },
      });

      // Update agent's virtual account - add released amount back
      const agent = await prisma.user.findUnique({
        where: { id: payment.userId },
        include: { virtualAccounts: true },
      });

      if (agent?.virtualAccounts?.[0]) {
        await prisma.virtualAccount.update({
          where: { id: agent.virtualAccounts[0].id },
          data: {
            balance: agent.virtualAccounts[0].balance.plus(
              updatedPayment.amount
            ),
          },
        });
      }

      return {
        success: true,
        releasedAmount: updatedPayment.amount,
      };
    } catch (error) {
      console.error('Error releasing escrow:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to release escrow',
      };
    }
  }

  /**
   * Refund escrow funds if marking job is cancelled
   */
  async refundMarkingJobEscrow(escrowId: string): Promise<{
    success: boolean;
    refundedAmount?: Decimal;
    error?: string;
  }> {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: escrowId },
      });

      if (!payment) {
        return {
          success: false,
          error: 'Escrow record not found',
        };
      }

      if (payment.status !== 'HELD') {
        return {
          success: false,
          error: `Cannot refund. Current status: ${payment.status}`,
        };
      }

      // Update payment status to REFUNDED
      const refundedPayment = await prisma.payment.update({
        where: { id: escrowId },
        data: {
          status: 'REFUNDED',
          releasedAt: new Date(),
          description: `${payment.description} - Refunded`,
        },
      });

      // Restore funds to agent's virtual account
      const agent = await prisma.user.findUnique({
        where: { id: payment.userId },
        include: { virtualAccounts: true },
      });

      if (agent?.virtualAccounts?.[0]) {
        await prisma.virtualAccount.update({
          where: { id: agent.virtualAccounts[0].id },
          data: {
            balance: agent.virtualAccounts[0].balance.plus(
              refundedPayment.amount
            ),
          },
        });
      }

      return {
        success: true,
        refundedAmount: refundedPayment.amount,
      };
    } catch (error) {
      console.error('Error refunding escrow:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to refund escrow',
      };
    }
  }

  /**
   * Expire escrow holds that have exceeded time limits
   * Called by a scheduled job
   */
  async expireOldEscrowHolds(): Promise<{
    success: boolean;
    expiredCount: number;
    error?: string;
  }> {
    try {
      // Find all held payments that have expired (older than 3 days)
      const expiredPayments = await prisma.payment.findMany({
        where: {
          status: 'HELD',
          createdAt: {
            lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          },
          paymentType: 'PROPERTY_MARKING',
        },
      });

      let expiredCount = 0;

      for (const payment of expiredPayments) {
        // Mark as expired and return funds
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'CANCELLED',
            description: `${payment.description} - Expired (auto-cancelled)`,
          },
        });

        // Restore funds
        const agent = await prisma.user.findUnique({
          where: { id: payment.userId },
          include: { virtualAccounts: true },
        });

        if (agent?.virtualAccounts?.[0]) {
          await prisma.virtualAccount.update({
            where: { id: agent.virtualAccounts[0].id },
            data: {
              balance: agent.virtualAccounts[0].balance.plus(payment.amount),
            },
          });
        }

        expiredCount++;
      }

      return {
        success: true,
        expiredCount,
      };
    } catch (error) {
      console.error('Error expiring escrow holds:', error);
      return {
        success: false,
        expiredCount: 0,
        error:
          error instanceof Error ? error.message : 'Failed to expire escrow',
      };
    }
  }

  /**
   * Get escrow details for a marking job
   */
  async getMarkingJobEscrow(markingJobId: string): Promise<{
    success: boolean;
    escrow?: EscrowTransaction;
    error?: string;
  }> {
    try {
      const payment = await prisma.payment.findFirst({
        where: {
          markingJobId,
          paymentType: 'PROPERTY_MARKING',
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!payment) {
        return {
          success: false,
          error: 'No escrow found for this marking job',
        };
      }

      const escrow: EscrowTransaction = {
        id: payment.id,
        agentId: payment.userId,
        markingJobId: payment.markingJobId || undefined,
        amount: payment.amount,
        status: payment.status as 'HELD' | 'RELEASED' | 'REFUNDED' | 'EXPIRED',
        reason: payment.description?.split(':')[0] || 'MARKING_JOB',
        description: payment.description || '',
        heldAt: payment.createdAt,
        releasedAt: payment.releasedAt || undefined,
        expiresAt: new Date(payment.createdAt.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from creation
        releaseNotes: payment.description?.includes('Released')
          ? payment.description
          : undefined,
      };

      return {
        success: true,
        escrow,
      };
    } catch (error) {
      console.error('Error getting escrow:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to get escrow',
      };
    }
  }

  /**
   * Get all escrows for an agent
   */
  async getAgentEscrows(agentId: string): Promise<{
    success: boolean;
    escrows?: EscrowTransaction[];
    total?: number;
    error?: string;
  }> {
    try {
      const payments = await prisma.payment.findMany({
        where: {
          userId: agentId,
          paymentType: 'PROPERTY_MARKING',
        },
        orderBy: { createdAt: 'desc' },
      });

      const escrows: EscrowTransaction[] = payments.map((payment) => ({
        id: payment.id,
        agentId: payment.userId,
        markingJobId: payment.markingJobId || undefined,
        amount: payment.amount,
        status: payment.status as 'HELD' | 'RELEASED' | 'REFUNDED' | 'EXPIRED',
        reason: payment.description?.split(':')[0] || 'MARKING_JOB',
        description: payment.description || '',
        heldAt: payment.createdAt,
        releasedAt: payment.releasedAt || undefined,
        expiresAt: new Date(
          payment.createdAt.getTime() + 3 * 24 * 60 * 60 * 1000
        ),
        releaseNotes: payment.description?.includes('Released')
          ? payment.description
          : undefined,
      }));

      return {
        success: true,
        escrows,
        total: escrows.length,
      };
    } catch (error) {
      console.error('Error getting agent escrows:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to get escrows',
      };
    }
  }

  /**
   * Calculate agent's available balance (total - held escrows)
   */
  async getAgentAvailableBalance(agentId: string): Promise<{
    success: boolean;
    totalBalance?: Decimal;
    heldAmount?: Decimal;
    availableBalance?: Decimal;
    error?: string;
  }> {
    try {
      const agent = await prisma.user.findUnique({
        where: { id: agentId },
        include: { virtualAccounts: true },
      });

      if (!agent?.virtualAccounts?.[0]) {
        return {
          success: false,
          error: 'Agent does not have a virtual account',
        };
      }

      const virtualAccount = agent.virtualAccounts[0];

      // Get total held escrows
      const heldPayments = await prisma.payment.findMany({
        where: {
          userId: agentId,
          status: 'HELD',
          paymentType: 'PROPERTY_MARKING',
        },
      });

      const heldAmount = heldPayments.reduce(
        (sum, payment) => sum.plus(payment.amount),
        new Decimal(0)
      );

      const availableBalance = virtualAccount.balance.plus(heldAmount);

      return {
        success: true,
        totalBalance: virtualAccount.balance,
        heldAmount,
        availableBalance,
      };
    } catch (error) {
      console.error('Error calculating available balance:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to calculate available balance',
      };
    }
  }

  private generateId(): string {
    return `escrow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default new EscrowService();