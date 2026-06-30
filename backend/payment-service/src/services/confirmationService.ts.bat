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




// import { PrismaClient, Payment, PaymentStatus, RentalStatus } from '@newcondo/db';
// import { Decimal } from 'decimal.js';
// import { standardResponse, ApiError } from '../../../shared/src/utils/response';
// import type { ApiResponse } from '../../../shared/src/types/api';
// import { logger } from '../../../shared/src/utils/logger';
// import { sendPaymentConfirmationEmail, sendPaymentDisputeEmail } from '../../../notification-service/src/services/emailService'; // Assuming a notification service

// const prisma = new PrismaClient();

// export interface PaymentConfirmation {
//   paymentId: string;
//   status: 'CONFIRMED' | 'DISPUTED' | 'PENDING';
//   confirmationDate: Date;
//   disputeReason?: string;
//   adminNotes?: string;
// }

// export interface ConfirmationRequest {
//   paymentId: string;
//   userId: string;
//   confirmed: boolean;
//   disputeReason?: string;
// }

// export interface EscrowRelease {
//   paymentId: string;
//   releaseAmount: Decimal;
//   commissionAmount: Decimal;
//   platformFee: Decimal;
//   ownerAmount: Decimal;
// }

// export interface ConfirmationStats {
//   totalPayments: number;
//   pendingConfirmations: number;
//   disputedPayments: number;
//   releasedPayments: number;
// }

// export class ConfirmationService {
//   /**
//    * Handles a user's confirmation or dispute of a payment.
//    * @param data The confirmation request data.
//    * @returns The updated payment record.
//    */
//   async handlePaymentConfirmation(data: ConfirmationRequest): Promise<Payment> {
//     const { paymentId, userId, confirmed, disputeReason } = data;

//     logger.info('Handling payment confirmation', { paymentId, userId, confirmed });

//     const payment = await prisma.payment.findUnique({
//       where: { id: paymentId },
//       include: { user: true, rental: { include: { property: true } } }
//     });

//     if (!payment) {
//       throw new ApiError(404, 'Payment not found.');
//     }

//     if (payment.userId !== userId) {
//       throw new ApiError(403, 'User is not authorized to confirm this payment.');
//     }

//     if (payment.status !== PaymentStatus.HELD) {
//       throw new ApiError(400, `Payment cannot be confirmed in status: ${payment.status}.`);
//     }

//     if (confirmed) {
//       // User confirms payment, release funds after a grace period.
//       const releaseTime = new Date();
//       releaseTime.setDate(releaseTime.getDate() + 2); // Release in 2 days as a grace period.

//       const updatedPayment = await prisma.payment.update({
//         where: { id: paymentId },
//         data: {
//           status: PaymentStatus.RELEASED,
//           isReleased: true,
//           releasedAt: releaseTime,
//           confirmationPeriodEnd: null, // Confirmation period is over
//         },
//       });

//       // Notify owner/agent of successful confirmation
//       // const owner = await prisma.user.findUnique({ where: { id: payment.rental.property.ownerId } });
//       // if (owner) {
//       //   await sendPaymentConfirmationEmail(owner.email, {
//       //     amount: updatedPayment.amount,
//       //     description: updatedPayment.description,
//       //     paymentId: updatedPayment.id,
//       //   });
//       // }

//       logger.info('Payment confirmed and scheduled for release', { paymentId });
//       return updatedPayment;

//     } else {
//       // User disputes the payment
//       if (!disputeReason || disputeReason.length < 10) {
//         throw new ApiError(400, 'A valid reason is required to dispute a payment.');
//       }

//       const updatedPayment = await prisma.payment.update({
//         where: { id: paymentId },
//         data: {
//           status: PaymentStatus.FAILED, // Mark as failed or 'disputed' depending on your flow. 'FAILED' is a good initial state.
//           failureReason: `Payment disputed by user: ${disputeReason}`,
//           isReleased: false,
//           confirmationPeriodEnd: null,
//         },
//       });

//       // Notify admin of the dispute
//       // await sendPaymentDisputeEmail({
//       //   paymentId: updatedPayment.id,
//       //   disputer: payment.user.email,
//       //   reason: disputeReason,
//       // });

//       logger.warn('Payment disputed by user', { paymentId, disputeReason });
//       return updatedPayment;
//     }
//   }

//   /**
//    * Automatically releases funds for confirmed or expired payments.
//    * This function should be called by a cron job.
//    */
//   async releaseConfirmedPayments(): Promise<void> {
//     const now = new Date();

//     const paymentsToRelease = await prisma.payment.findMany({
//       where: {
//         status: PaymentStatus.HELD,
//         confirmationPeriodEnd: {
//           lte: now, // Confirmation period has expired
//         },
//       },
//       include: { rental: { include: { property: true } } },
//     });

//     logger.info(`Found ${paymentsToRelease.length} payments to automatically release.`);

//     for (const payment of paymentsToRelease) {
//       try {
//         const { platformFee, agentCommission, ownerAmount } = this.calculateEscrowSplit(payment);

//         await prisma.$transaction(async (tx) => {
//           // 1. Update Payment status to RELEASED
//           await tx.payment.update({
//             where: { id: payment.id },
//             data: {
//               status: PaymentStatus.RELEASED,
//               isReleased: true,
//               releasedAt: now,
//               platformFee,
//               agentCommission,
//               ownerAmount,
//             },
//           });

//           // 2. Transfer funds to virtual accounts (simulated or real)
//           // Here, you would call a virtual account service to handle the actual transfer
//           // For now, we'll just log it.
//           logger.info(`Simulating fund release for payment ${payment.id}:`);
//           logger.info(`  - Platform Fee: ${platformFee.toFixed(2)}`);
//           logger.info(`  - Agent Commission: ${agentCommission.toFixed(2)}`);
//           logger.info(`  - Owner Amount: ${ownerAmount.toFixed(2)}`);

//           // 3. Mark the rental as active (if it's the first payment)
//           if (payment.rentalId) {
//             const rental = await tx.rental.findUnique({
//               where: { id: payment.rentalId },
//             });
//             if (rental?.status === RentalStatus.PENDING_CONFIRMATION) {
//               await tx.rental.update({
//                 where: { id: rental.id },
//                 data: {
//                   status: RentalStatus.ACTIVE,
//                   isConfirmed: true,
//                   confirmedAt: now,
//                 },
//               });
//             }
//           }
//         });
//         logger.info(`Payment ${payment.id} successfully released.`);
//       } catch (error) {
//         logger.error(`Failed to release payment ${payment.id}:`, { error });
//       }
//     }
//   }

//   /**
//    * Calculates the split of a payment between the owner, agent, and platform.
//    * This is a simplified example.
//    * @param payment The payment record.
//    * @returns The split amounts.
//    */
//   private calculateEscrowSplit(payment: Payment): EscrowRelease {
//     const totalAmount = new Decimal(payment.amount);
//     const platformFeeRate = new Decimal(0.05); // 5% platform fee
//     const agentCommissionRate = new Decimal(0.05); // 5% agent commission

//     const platformFee = totalAmount.times(platformFeeRate);
//     const agentCommission = totalAmount.times(agentCommissionRate);
//     const ownerAmount = totalAmount.minus(platformFee).minus(agentCommission);

//     return {
//       paymentId: payment.id,
//       releaseAmount: totalAmount,
//       commissionAmount: agentCommission,
//       platformFee,
//       ownerAmount,
//     };
//   }
// }

// // You can create a singleton instance for easier use
// export const confirmationService = new ConfirmationService();




// import { PrismaClient, PaymentStatus, RentalStatus } from '@prisma/client';
// import { NotificationService } from './notificationService';

// const prisma = new PrismaClient();

// interface ConfirmPaymentInput {
//   paymentId: string;
//   renterId: string;
//   isConfirmed: boolean;
//   notes?: string;
// }

// interface ConfirmationCheckResult {
//   paymentId: string;
//   canConfirm: boolean;
//   reason?: string;
//   hoursRemaining?: number;
// }

// export class ConfirmationService {
//   private notificationService: NotificationService;

//   constructor() {
//     this.notificationService = new NotificationService();
//   }

//   /**
//    * Renter confirms they have verified the property
//    */
//   async confirmPayment(input: ConfirmPaymentInput) {
//     const { paymentId, renterId, isConfirmed, notes } = input;

//     // Fetch payment with relations
//     const payment = await prisma.payment.findUnique({
//       where: { id: paymentId },
//       include: {
//         rental: {
//           include: {
//             property: {
//               include: {
//                 owner: true,
//                 agent: true,
//               },
//             },
//             unit: true,
//           },
//         },
//         user: true,
//       },
//     });

//     if (!payment) {
//       throw new Error('Payment not found');
//     }

//     // Verify the renter owns this payment
//     if (payment.userId !== renterId) {
//       throw new Error('Unauthorized: You can only confirm your own payments');
//     }

//     // Check if payment is in HELD status
//     if (payment.status !== PaymentStatus.HELD) {
//       throw new Error(
//         `Payment cannot be confirmed. Current status: ${payment.status}`
//       );
//     }

//     // Check if confirmation period has expired
//     if (
//       payment.confirmationPeriodEnd &&
//       new Date() > payment.confirmationPeriodEnd
//     ) {
//       throw new Error('Confirmation period has expired');
//     }

//     // Check if already confirmed
//     if (payment.rental?.isConfirmed) {
//       throw new Error('Payment already confirmed');
//     }

//     // Update payment and rental
//     const [updatedPayment, updatedRental] = await prisma.$transaction([
//       // Update payment status to awaiting release
//       prisma.payment.update({
//         where: { id: paymentId },
//         data: {
//           status: isConfirmed ? PaymentStatus.HELD : PaymentStatus.PENDING,
//           updatedAt: new Date(),
//         },
//       }),

//       // Update rental confirmation
//       prisma.rental.update({
//         where: { id: payment.rentalId! },
//         data: {
//           isConfirmed,
//           confirmedAt: isConfirmed ? new Date() : null,
//           status: isConfirmed
//             ? RentalStatus.ACTIVE
//             : RentalStatus.PENDING_CONFIRMATION,
//         },
//       }),
//     ]);

//     // Log the confirmation event
//     await prisma.eventLog.create({
//       data: {
//         userId: renterId,
//         type: isConfirmed ? 'PAYMENT_CONFIRMED' : 'PAYMENT_DISPUTED',
//         metadata: {
//           paymentId,
//           rentalId: payment.rentalId,
//           propertyId: payment.rental?.propertyId,
//           unitId: payment.rental?.unitId,
//           notes,
//           confirmedAt: new Date().toISOString(),
//         },
//       },
//     });

//     // Send notifications
//     if (isConfirmed) {
//       // Notify property owner
//       await this.notificationService.sendPaymentConfirmedNotification({
//         recipientId: payment.rental!.property.ownerId,
//         paymentId,
//         propertyTitle: payment.rental!.property.title,
//         amount: payment.amount.toString(),
//         renterName: payment.user.name || 'Renter',
//       });

//       // Notify agent if exists
//       if (payment.rental!.property.agentId) {
//         await this.notificationService.sendPaymentConfirmedNotification({
//           recipientId: payment.rental!.property.agentId,
//           paymentId,
//           propertyTitle: payment.rental!.property.title,
//           amount: payment.amount.toString(),
//           renterName: payment.user.name || 'Renter',
//         });
//       }
//     } else {
//       // Notify admin of dispute
//       await this.notificationService.sendPaymentDisputeNotification({
//         paymentId,
//         propertyTitle: payment.rental!.property.title,
//         renterName: payment.user.name || 'Renter',
//         notes: notes || 'No notes provided',
//       });
//     }

//     return {
//       success: true,
//       payment: updatedPayment,
//       rental: updatedRental,
//       message: isConfirmed
//         ? 'Payment confirmed. Funds will be released after 24 hours.'
//         : 'Dispute registered. Admin will review your case.',
//     };
//   }

//   /**
//    * Check if a payment can be confirmed
//    */
//   async checkConfirmationEligibility(
//     paymentId: string
//   ): Promise<ConfirmationCheckResult> {
//     const payment = await prisma.payment.findUnique({
//       where: { id: paymentId },
//       include: {
//         rental: true,
//       },
//     });

//     if (!payment) {
//       return {
//         paymentId,
//         canConfirm: false,
//         reason: 'Payment not found',
//       };
//     }

//     if (payment.status !== PaymentStatus.HELD) {
//       return {
//         paymentId,
//         canConfirm: false,
//         reason: `Payment is not in HELD status (current: ${payment.status})`,
//       };
//     }

//     if (payment.rental?.isConfirmed) {
//       return {
//         paymentId,
//         canConfirm: false,
//         reason: 'Payment already confirmed',
//       };
//     }

//     if (
//       !payment.confirmationPeriodEnd ||
//       new Date() > payment.confirmationPeriodEnd
//     ) {
//       return {
//         paymentId,
//         canConfirm: false,
//         reason: 'Confirmation period has expired',
//       };
//     }

//     // Calculate hours remaining
//     const hoursRemaining = Math.floor(
//       (payment.confirmationPeriodEnd.getTime() - new Date().getTime()) /
//         (1000 * 60 * 60)
//     );

//     return {
//       paymentId,
//       canConfirm: true,
//       hoursRemaining,
//     };
//   }

//   /**
//    * Get all payments pending confirmation for a user
//    */
//   async getPendingConfirmations(userId: string) {
//     const payments = await prisma.payment.findMany({
//       where: {
//         userId,
//         status: PaymentStatus.HELD,
//         rental: {
//           isConfirmed: false,
//         },
//         confirmationPeriodEnd: {
//           gte: new Date(),
//         },
//       },
//       include: {
//         rental: {
//           include: {
//             property: {
//               select: {
//                 id: true,
//                 title: true,
//                 address: true,
//                 city: true,
//               },
//             },
//             unit: {
//               select: {
//                 id: true,
//                 unitNumber: true,
//               },
//             },
//           },
//         },
//       },
//       orderBy: {
//         confirmationPeriodEnd: 'asc',
//       },
//     });

//     return payments.map((payment) => ({
//       ...payment,
//       hoursRemaining: Math.floor(
//         (payment.confirmationPeriodEnd!.getTime() - new Date().getTime()) /
//           (1000 * 60 * 60)
//       ),
//     }));
//   }

//   /**
//    * Get expired confirmations that need auto-processing
//    */
//   async getExpiredConfirmations() {
//     return prisma.payment.findMany({
//       where: {
//         status: PaymentStatus.HELD,
//         confirmationPeriodEnd: {
//           lt: new Date(),
//         },
//         rental: {
//           isConfirmed: false,
//         },
//       },
//       include: {
//         rental: {
//           include: {
//             property: true,
//           },
//         },
//         user: true,
//       },
//     });
//   }

//   /**
//    * Auto-confirm expired payments (called by scheduler)
//    */
//   async autoConfirmExpiredPayments() {
//     const expiredPayments = await this.getExpiredConfirmations();

//     const results = [];

//     for (const payment of expiredPayments) {
//       try {
//         // Auto-confirm the payment
//         const result = await prisma.$transaction([
//           prisma.payment.update({
//             where: { id: payment.id },
//             data: {
//               status: PaymentStatus.HELD, // Keep HELD until release
//               updatedAt: new Date(),
//             },
//           }),
//           prisma.rental.update({
//             where: { id: payment.rentalId! },
//             data: {
//               isConfirmed: true,
//               confirmedAt: new Date(),
//               status: RentalStatus.ACTIVE,
//             },
//           }),
//         ]);

//         // Log auto-confirmation
//         await prisma.eventLog.create({
//           data: {
//             userId: payment.userId,
//             type: 'PAYMENT_AUTO_CONFIRMED',
//             metadata: {
//               paymentId: payment.id,
//               rentalId: payment.rentalId,
//               reason: 'Confirmation period expired without dispute',
//               autoConfirmedAt: new Date().toISOString(),
//             },
//           },
//         });

//         // Notify renter
//         await this.notificationService.sendAutoConfirmationNotification({
//           recipientId: payment.userId,
//           paymentId: payment.id,
//           propertyTitle: payment.rental!.property.title,
//         });

//         results.push({
//           paymentId: payment.id,
//           success: true,
//         });
//       } catch (error) {
//         results.push({
//           paymentId: payment.id,
//           success: false,
//           error: error instanceof Error ? error.message : 'Unknown error',
//         });
//       }
//     }

//     return {
//       processed: results.length,
//       successful: results.filter((r) => r.success).length,
//       failed: results.filter((r) => !r.success).length,
//       results,
//     };
//   }
// }


// import { PrismaClient, PaymentStatus, RentalStatus } from '@prisma/client';
// import { NotificationService } from './notificationService';
// import { logger } from '../../../shared/src/middleware/logger';

// const prisma = new PrismaClient();

// export class ConfirmationService {
//   private notificationService: NotificationService;

//   constructor() {
//     this.notificationService = new NotificationService();
//   }

//   /**
//    * Record renter's confirmation that property is as advertised
//    */
//   async confirmProperty(rentalId: string, userId: string): Promise<{
//     success: boolean;
//     message: string;
//     rental?: any;
//   }> {
//     try {
//       // Verify rental exists and belongs to user
//       const rental = await prisma.rental.findFirst({
//         where: {
//           id: rentalId,
//           renterId: userId,
//           status: RentalStatus.PENDING_CONFIRMATION,
//         },
//         include: {
//           property: {
//             include: {
//               owner: true,
//               agent: true,
//             },
//           },
//           unit: true,
//           payments: {
//             where: {
//               status: PaymentStatus.HELD,
//             },
//           },
//         },
//       });

//       if (!rental) {
//         return {
//           success: false,
//           message: 'Rental not found or not eligible for confirmation',
//         };
//       }

//       // Check if confirmation deadline has passed
//       if (rental.confirmationDeadline && new Date() > rental.confirmationDeadline) {
//         return {
//           success: false,
//           message: 'Confirmation period has expired',
//         };
//       }

//       // Update rental status
//       const updatedRental = await prisma.rental.update({
//         where: { id: rentalId },
//         data: {
//           isConfirmed: true,
//           confirmedAt: new Date(),
//           status: RentalStatus.ACTIVE,
//         },
//       });

//       // Log confirmation event
//       await prisma.eventLog.create({
//         data: {
//           userId,
//           type: 'RENTAL_CONFIRMED',
//           metadata: {
//             rentalId,
//             propertyId: rental.property.id,
//             unitId: rental.unitId,
//             confirmedAt: new Date(),
//           },
//         },
//       });

//       // Send notifications
//       await this.notificationService.sendConfirmationNotifications({
//         rental,
//         renter: { id: userId },
//         propertyOwner: rental.property.owner,
//         agent: rental.property.agent,
//       });

//       logger.info(`Rental ${rentalId} confirmed by user ${userId}`);

//       return {
//         success: true,
//         message: 'Property confirmed successfully. Payment will be released after 24 hours.',
//         rental: updatedRental,
//       };
//     } catch (error) {
//       logger.error('Error confirming property:', error);
//       throw error;
//     }
//   }

//   /**
//    * Handle dispute raised by renter
//    */
//   async raiseDispute(
//     rentalId: string,
//     userId: string,
//     disputeDetails: {
//       reason: string;
//       description: string;
//       evidence?: string[];
//     }
//   ): Promise<{
//     success: boolean;
//     message: string;
//     ticket?: any;
//   }> {
//     try {
//       // Verify rental exists and belongs to user
//       const rental = await prisma.rental.findFirst({
//         where: {
//           id: rentalId,
//           renterId: userId,
//           status: RentalStatus.PENDING_CONFIRMATION,
//         },
//         include: {
//           property: {
//             include: {
//               owner: true,
//               agent: true,
//             },
//           },
//           unit: true,
//           payments: {
//             where: {
//               status: PaymentStatus.HELD,
//             },
//           },
//         },
//       });

//       if (!rental) {
//         return {
//           success: false,
//           message: 'Rental not found or not eligible for dispute',
//         };
//       }

//       // Check if still within confirmation period
//       if (rental.confirmationDeadline && new Date() > rental.confirmationDeadline) {
//         return {
//           success: false,
//           message: 'Dispute period has expired',
//         };
//       }

//       // Create support ticket
//       const ticket = await prisma.supportTicket.create({
//         data: {
//           userId,
//           title: `Property Dispute - Rental ${rentalId}`,
//           description: `Reason: ${disputeDetails.reason}\n\nDetails: ${disputeDetails.description}`,
//           category: 'PROPERTY',
//           priority: 'HIGH',
//           status: 'OPEN',
//         },
//       });

//       // Log dispute event
//       await prisma.eventLog.create({
//         data: {
//           userId,
//           type: 'RENTAL_DISPUTED',
//           metadata: {
//             rentalId,
//             propertyId: rental.property.id,
//             ticketId: ticket.id,
//             reason: disputeDetails.reason,
//             evidence: disputeDetails.evidence || [],
//           },
//         },
//       });

//       // Update rental status to indicate dispute
//       await prisma.rental.update({
//         where: { id: rentalId },
//         data: {
//           status: RentalStatus.PENDING_CONFIRMATION, // Keep in pending
//         },
//       });

//       // Send notifications to admin and property owner
//       await this.notificationService.sendDisputeNotifications({
//         rental,
//         renter: { id: userId },
//         propertyOwner: rental.property.owner,
//         agent: rental.property.agent,
//         ticket,
//         disputeDetails,
//       });

//       logger.info(`Dispute raised for rental ${rentalId} by user ${userId}`);

//       return {
//         success: true,
//         message: 'Dispute raised successfully. Admin will review your case within 24 hours.',
//         ticket,
//       };
//     } catch (error) {
//       logger.error('Error raising dispute:', error);
//       throw error;
//     }
//   }

//   /**
//    * Get confirmation status for a rental
//    */
//   async getConfirmationStatus(rentalId: string, userId: string): Promise<{
//     rental: any;
//     canConfirm: boolean;
//     canDispute: boolean;
//     timeRemaining: number | null;
//   }> {
//     try {
//       const rental = await prisma.rental.findFirst({
//         where: {
//           id: rentalId,
//           renterId: userId,
//         },
//         include: {
//           property: {
//             include: {
//               owner: true,
//               agent: true,
//             },
//           },
//           unit: true,
//           payments: true,
//         },
//       });

//       if (!rental) {
//         throw new Error('Rental not found');
//       }

//       const now = new Date();
//       const canConfirm = 
//         rental.status === RentalStatus.PENDING_CONFIRMATION &&
//         rental.confirmationDeadline &&
//         now < rental.confirmationDeadline &&
//         !rental.isConfirmed;

//       const canDispute = canConfirm;

//       const timeRemaining = rental.confirmationDeadline
//         ? Math.max(0, rental.confirmationDeadline.getTime() - now.getTime())
//         : null;

//       return {
//         rental,
//         canConfirm,
//         canDispute,
//         timeRemaining,
//       };
//     } catch (error) {
//       logger.error('Error getting confirmation status:', error);
//       throw error;
//     }
//   }

//   /**
//    * Auto-confirm rental if deadline passed without dispute
//    */
//   async autoConfirmExpiredRentals(): Promise<number> {
//     try {
//       const now = new Date();

//       // Find all rentals past confirmation deadline that aren't confirmed
//       const expiredRentals = await prisma.rental.findMany({
//         where: {
//           status: RentalStatus.PENDING_CONFIRMATION,
//           isConfirmed: false,
//           confirmationDeadline: {
//             lt: now,
//           },
//         },
//         include: {
//           property: {
//             include: {
//               owner: true,
//               agent: true,
//             },
//           },
//           renter: true,
//         },
//       });

//       logger.info(`Found ${expiredRentals.length} rentals to auto-confirm`);

//       let confirmedCount = 0;

//       for (const rental of expiredRentals) {
//         try {
//           await prisma.rental.update({
//             where: { id: rental.id },
//             data: {
//               isConfirmed: true,
//               confirmedAt: now,
//               status: RentalStatus.ACTIVE,
//             },
//           });

//           // Log auto-confirmation
//           await prisma.eventLog.create({
//             data: {
//               userId: rental.renterId,
//               type: 'RENTAL_AUTO_CONFIRMED',
//               metadata: {
//                 rentalId: rental.id,
//                 propertyId: rental.property.id,
//                 autoConfirmedAt: now,
//               },
//             },
//           });

//           // Send notifications
//           await this.notificationService.sendAutoConfirmationNotifications({
//             rental,
//             renter: rental.renter,
//             propertyOwner: rental.property.owner,
//             agent: rental.property.agent,
//           });

//           confirmedCount++;
//         } catch (error) {
//           logger.error(`Error auto-confirming rental ${rental.id}:`, error);
//         }
//       }

//       logger.info(`Auto-confirmed ${confirmedCount} rentals`);
//       return confirmedCount;
//     } catch (error) {
//       logger.error('Error in auto-confirm expired rentals:', error);
//       throw error;
//     }
//   }
// }

// // Notification service placeholder
// class NotificationService {
//   async sendConfirmationNotifications(data: any) {
//     // Implementation will be in notification-service
//     logger.info('Sending confirmation notifications', data);
//   }

//   async sendDisputeNotifications(data: any) {
//     logger.info('Sending dispute notifications', data);
//   }

//   async sendAutoConfirmationNotifications(data: any) {
//     logger.info('Sending auto-confirmation notifications', data);
//   }
// }