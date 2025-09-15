// backend/payment-service/src/services/confirmationService.ts

import { PrismaClient, PaymentStatus, RentalStatus } from '@newcondo/db';
import { Response } from '../../../shared/src/utils/response';
import { logger } from '../../../shared/src/middleware/logger';

export interface PaymentConfirmationData {
  paymentId: string;
  confirmedBy?: string; // User ID of confirmer
  confirmationType: 'AUTO' | 'MANUAL' | 'LANDLORD';
  confirmationNotes?: string;
}

export interface ConfirmationPeriodConfig {
  standardPeriodDays: number; // Default 7 days
  extendedPeriodDays: number; // For disputed payments: 14 days
  autoReleaseEnabled: boolean;
}

export interface PaymentHoldData {
  paymentId: string;
  holdReason: string;
  expectedResolutionDate?: Date;
  requiredAction?: string;
}

class ConfirmationService {
  private prisma: PrismaClient;
  private defaultConfig: ConfirmationPeriodConfig = {
    standardPeriodDays: 7,
    extendedPeriodDays: 14,
    autoReleaseEnabled: true,
  };

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Initialize payment confirmation period
   * Called immediately after successful payment
   */
  async initializeConfirmationPeriod(paymentId: string): Promise<Response> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: { rental: true },
      });

      if (!payment) {
        return Response.error('Payment not found');
      }

      if (payment.status !== 'SUCCESS') {
        return Response.error('Payment must be successful to start confirmation period');
      }

      // Calculate confirmation period end date
      const confirmationPeriodEnd = new Date();
      confirmationPeriodEnd.setDate(confirmationPeriodEnd.getDate() + this.defaultConfig.standardPeriodDays);

      // Update payment with confirmation period
      const updatedPayment = await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          confirmationPeriodEnd,
          status: 'HELD', // Hold payment during confirmation period
        },
      });

      // Update rental status if applicable
      if (payment.rental) {
        await this.prisma.rental.update({
          where: { id: payment.rental.id },
          data: {
            status: 'PENDING_CONFIRMATION',
            confirmationDeadline: confirmationPeriodEnd,
          },
        });
      }

      logger.info(`Confirmation period initialized for payment ${paymentId}:`, {
        confirmationPeriodEnd,
        rentalId: payment.rentalId,
      });

      // Schedule auto-release job (in production, use a job queue like Bull/Agenda)
      if (this.defaultConfig.autoReleaseEnabled) {
        this.scheduleAutoRelease(paymentId, confirmationPeriodEnd);
      }

      return Response.success({
        paymentId,
        confirmationPeriodEnd,
        daysRemaining: this.defaultConfig.standardPeriodDays,
        autoReleaseEnabled: this.defaultConfig.autoReleaseEnabled,
      }, 'Confirmation period started');
    } catch (error) {
      logger.error('Error initializing confirmation period:', error);
      return Response.error('Failed to initialize confirmation period');
    }
  }

  /**
   * Confirm payment and release funds
   */
  async confirmPayment(data: PaymentConfirmationData): Promise<Response> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: data.paymentId },
        include: {
          rental: {
            include: {
              property: {
                select: { ownerId: true, agentId: true },
              },
            },
          },
        },
      });

      if (!payment) {
        return Response.error('Payment not found');
      }

      if (payment.status !== 'HELD') {
        return Response.error('Payment is not in confirmation period');
      }

      if (payment.isReleased) {
        return Response.error('Payment has already been released');
      }

      // Validate confirmation authority
      const isAuthorized = await this.validateConfirmationAuthority(payment, data.confirmedBy, data.confirmationType);
      if (!isAuthorized.success) {
        return isAuthorized;
      }

      // Start transaction to confirm payment and update related records
      const result = await this.prisma.$transaction(async (tx) => {
        // Release payment
        const confirmedPayment = await tx.payment.update({
          where: { id: data.paymentId },
          data: {
            status: 'RELEASED',
            isReleased: true,
            releasedAt: new Date(),
            description: data.confirmationNotes ?
              `${payment.description || ''} | Confirmation: ${data.confirmationNotes}`.trim() :
              payment.description,
          },
        });

        // Update rental status if applicable
        if (payment.rental) {
          await tx.rental.update({
            where: { id: payment.rental.id },
            data: {
              status: 'ACTIVE',
              isConfirmed: true,
              confirmedAt: new Date(),
            },
          });

          // Update property availability
          await tx.property.update({
            where: { id: payment.rental.propertyId },
            data: {
              isAvailable: false,
              isPaymentLocked: false, // Remove payment lock
            },
          });

          // If rental has a specific unit, update unit availability
          if (payment.rental.unitId) {
            await tx.propertyUnit.update({
              where: { id: payment.rental.unitId },
              data: {
                isAvailable: false,
                status: 'OCCUPIED',
                isPaymentLocked: false,
              },
            });
          }
        }

        // Process commission splits if applicable
        if (payment.rental?.property.agentId && payment.agentCommission) {
          await this.processCommissionPayment(tx, payment, payment.rental.property.agentId);
        }

        return confirmedPayment;
      });

      logger.info(`Payment confirmed and released:`, {
        paymentId: data.paymentId,
        confirmationType: data.confirmationType,
        confirmedBy: data.confirmedBy,
        amount: payment.amount,
        rentalId: payment.rentalId,
      });

      // Send confirmation notifications (implement in notification service)
      await this.sendConfirmationNotifications(payment);

      return Response.success({
        paymentId: data.paymentId,
        status: 'RELEASED',
        releasedAt: result.releasedAt,
        confirmationType: data.confirmationType,
        rental: payment.rental ? {
          id: payment.rental.id,
          status: 'ACTIVE',
          confirmedAt: new Date(),
        } : null,
      }, 'Payment confirmed and released successfully');
    } catch (error) {
      logger.error('Error confirming payment:', error);
      return Response.error('Failed to confirm payment');
    }
  }

  /**
   * Dispute payment and extend confirmation period
   */
  async disputePayment(paymentId: string, disputeReason: string, disputedBy: string): Promise<Response> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: { rental: true },
      });

      if (!payment) {
        return Response.error('Payment not found');
      }

      if (payment.status !== 'HELD') {
        return Response.error('Payment is not in confirmation period');
      }

      if (payment.isReleased) {
        return Response.error('Payment has already been released');
      }

      // Extend confirmation period
      const extendedDeadline = new Date();
      extendedDeadline.setDate(extendedDeadline.getDate() + this.defaultConfig.extendedPeriodDays);

      const updatedPayment = await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          confirmationPeriodEnd: extendedDeadline,
          description: `${payment.description || ''} | DISPUTED: ${disputeReason}`.trim(),
        },
      });

      // Update rental confirmation deadline if applicable
      if (payment.rental) {
        await this.prisma.rental.update({
          where: { id: payment.rental.id },
          data: {
            confirmationDeadline: extendedDeadline,
          },
        });
      }

      logger.info(`Payment disputed and confirmation period extended:`, {
        paymentId,
        disputedBy,
        disputeReason,
        newDeadline: extendedDeadline,
      });

      // Notify relevant parties about dispute
      await this.sendDisputeNotifications(payment, disputeReason, disputedBy);

      return Response.success({
        paymentId,
        disputeReason,
        extendedDeadline,
        daysExtension: this.defaultConfig.extendedPeriodDays,
      }, 'Payment disputed and confirmation period extended');
    } catch (error) {
      logger.error('Error disputing payment:', error);
      return Response.error('Failed to dispute payment');
    }
  }

  /**
   * Auto-release payments after confirmation period expires
   */
  async autoReleaseExpiredPayments(): Promise<Response> {
    try {
      const expiredPayments = await this.prisma.payment.findMany({
        where: {
          status: 'HELD',
          isReleased: false,
          confirmationPeriodEnd: {
            lte: new Date(),
          },
        },
        include: {
          rental: {
            include: {
              property: {
                select: { ownerId: true, agentId: true },
              },
            },
          },
        },
      });

      if (expiredPayments.length === 0) {
        return Response.success([], 'No expired payments found');
      }

      const results = [];

      for (const payment of expiredPayments) {
        try {
          const confirmationResult = await this.confirmPayment({
            paymentId: payment.id,
            confirmationType: 'AUTO',
            confirmationNotes: 'Auto-released after confirmation period expired',
          });

          results.push({
            paymentId: payment.id,
            success: confirmationResult.success,
            message: confirmationResult.message,
          });
        } catch (error) {
          logger.error(`Failed to auto-release payment ${payment.id}:`, error);
          results.push({
            paymentId: payment.id,
            success: false,
            message: 'Auto-release failed',
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      logger.info(`Auto-release completed:`, {
        total: results.length,
        successful: successCount,
        failed: failureCount,
      });

      return Response.success({
        processedCount: results.length,
        successfulReleases: successCount,
        failedReleases: failureCount,
        results,
      }, `Auto-released ${successCount} payments`);
    } catch (error) {
      logger.error('Error in auto-release process:', error);
      return Response.error('Auto-release process failed');
    }
  }

  /**
   * Get payment confirmation status
   */
  async getConfirmationStatus(paymentId: string): Promise<Response> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          rental: {
            select: {
              id: true,
              status: true,
              isConfirmed: true,
              confirmationDeadline: true,
              confirmedAt: true,
            },
          },
        },
      });

      if (!payment) {
        return Response.error('Payment not found');
      }

      const now = new Date();
      const isExpired = payment.confirmationPeriodEnd && payment.confirmationPeriodEnd < now;
      const daysRemaining = payment.confirmationPeriodEnd ?
        Math.max(0, Math.ceil((payment.confirmationPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) :
        0;

      const status = {
        paymentId,
        paymentStatus: payment.status,
        isReleased: payment.isReleased,
        releasedAt: payment.releasedAt,
        confirmationPeriodEnd: payment.confirmationPeriodEnd,
        isExpired,
        daysRemaining,
        canBeConfirmed: payment.status === 'HELD' && !payment.isReleased && !isExpired,
        canBeDisputed: payment.status === 'HELD' && !payment.isReleased && !isExpired,
        rental: payment.rental,
      };

      return Response.success(status);
    } catch (error) {
      logger.error('Error getting confirmation status:', error);
      return Response.error('Failed to get confirmation status');
    }
  }

  /**
   * Hold payment (prevent release)
   */
  async holdPayment(data: PaymentHoldData): Promise<Response> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: data.paymentId },
      });

      if (!payment) {
        return Response.error('Payment not found');
      }

      if (payment.isReleased) {
        return Response.error('Cannot hold payment that has already been released');
      }

      // Update payment to extend hold or add hold reason
      const holdDescription = `${payment.description || ''} | HOLD: ${data.holdReason}`.trim();

      const updatedPayment = await this.prisma.payment.update({
        where: { id: data.paymentId },
        data: {
          status: 'HELD',
          description: holdDescription,
          confirmationPeriodEnd: data.expectedResolutionDate || payment.confirmationPeriodEnd,
        },
      });

      logger.info(`Payment put on hold:`, {
        paymentId: data.paymentId,
        holdReason: data.holdReason,
        expectedResolutionDate: data.expectedResolutionDate,
        requiredAction: data.requiredAction,
      });

      return Response.success({
        paymentId: data.paymentId,
        holdReason: data.holdReason,
        expectedResolutionDate: data.expectedResolutionDate,
        requiredAction: data.requiredAction,
      }, 'Payment held successfully');
    } catch (error) {
      logger.error('Error holding payment:', error);
      return Response.error('Failed to hold payment');
    }
  }

  // Private helper methods

  private async validateConfirmationAuthority(payment: any, confirmedBy?: string, confirmationType?: string): Promise<Response> {
    try {
      switch (confirmationType) {
        case 'AUTO':
          return Response.success(null); // Auto confirmations are always allowed

        case 'LANDLORD':
          if (!confirmedBy) {
            return Response.error('Landlord confirmation requires confirmedBy user ID');
          }

          if (!payment.rental) {
            return Response.error('Landlord confirmation only applicable for rental payments');
          }

          if (payment.rental.property.ownerId !== confirmedBy) {
            return Response.error('Only property owner can perform landlord confirmation');
          }
          return Response.success(null);

        case 'MANUAL':
          if (!confirmedBy) {
            return Response.error('Manual confirmation requires confirmedBy user ID');
          }

          // Check if confirmedBy is an admin user
          const user = await this.prisma.user.findUnique({
            where: { id: confirmedBy },
            select: { role: true },
          });

          if (!user || user.role !== 'ADMIN') {
            return Response.error('Manual confirmation requires admin privileges');
          }
          return Response.success(null);

        default:
          return Response.error('Invalid confirmation type');
      }
    } catch (error) {
      logger.error('Error validating confirmation authority:', error);
      return Response.error('Failed to validate confirmation authority');
    }
  }

  private async processCommissionPayment(tx: any, payment: any, agentId: string): Promise<void> {
    // Create commission payment record
    await tx.payment.create({
      data: {
        userId: agentId,
        amount: payment.agentCommission,
        currency: payment.currency,
        paymentType: 'AGENT_COMMISSION',
        status: 'SUCCESS',
        description: `Commission for rental payment ${payment.id}`,
        paidAt: new Date(),
      },
    });

    logger.info(`Commission payment processed:`, {
      agentId,
      amount: payment.agentCommission,
      originalPaymentId: payment.id,
    });
  }

  private async sendConfirmationNotifications(payment: any): Promise<void> {
    // Implementation would integrate with notification service
    logger.info(`Sending confirmation notifications for payment ${payment.id}`);
  }

  private async sendDisputeNotifications(payment: any, disputeReason: string, disputedBy: string): Promise<void> {
    // Implementation would integrate with a notification service
    logger.info(`Sending dispute notifications for payment ${payment.id}:`, { disputeReason, disputedBy });
  }

  /**
   * Schedules a delayed job to auto-release a payment.
   * NOTE: This is a simple in-memory implementation for demonstration.
   * A production system should use a persistent job queue (e.g., Bull, Agenda, or a dedicated cron service).
   */
  private scheduleAutoRelease(paymentId: string, scheduledDate: Date): void {
    const delay = scheduledDate.getTime() - new Date().getTime();
    if (delay > 0) {
      setTimeout(async () => {
        logger.info(`Attempting auto-release for payment ${paymentId} based on scheduled job.`);
        await this.autoReleaseExpiredPayments();
      }, delay);
    }
  }
}

export const confirmationService = new ConfirmationService();