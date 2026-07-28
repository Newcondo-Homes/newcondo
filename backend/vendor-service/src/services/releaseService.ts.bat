import { PrismaClient, PaymentStatus } from '@prisma/client';
import { CommissionService } from './commissionService';
import { VirtualAccountTransferService } from './virtualAccountTransferService';
import { NotificationService } from './notificationService';

const prisma = new PrismaClient();

interface PaymentReleaseResult {
  paymentId: string;
  success: boolean;
  releasedAmount: Decimal;
  commissionAmount: Decimal;
  ownerAmount: Decimal;
  agentCommission?: Decimal;
  platformFee: Decimal;
  error?: string;
}

export class ReleaseService {
  private commissionService: CommissionService;
  private transferService: VirtualAccountTransferService;
  private notificationService: NotificationService;

  constructor() {
    this.commissionService = new CommissionService();
    this.transferService = new VirtualAccountTransferService();
    this.notificationService = new NotificationService();
  }

  /**
   * Release payment after 24-hour confirmation period
   */
  async releasePayment(paymentId: string): Promise<PaymentReleaseResult> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        rental: {
          include: {
            property: {
              include: {
                owner: true,
                agent: true,
                virtualAccount: true,
              },
            },
            unit: true,
          },
        },
        user: true,
      },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Verify payment is ready for release
    if (payment.status !== PaymentStatus.HELD) {
      throw new Error(
        `Payment cannot be released. Current status: ${payment.status}`
      );
    }

    if (!payment.rental?.isConfirmed) {
      throw new Error('Payment not confirmed by renter');
    }

    // Check if 24 hours have passed since confirmation
    const confirmationDate = payment.rental.confirmedAt!;
    const releaseDate = new Date(confirmationDate.getTime() + 24 * 60 * 60 * 1000);
    
    if (new Date() < releaseDate) {
      throw new Error(
        `Payment can only be released after 24 hours from confirmation (available at: ${releaseDate.toISOString()})`
      );
    }

    if (payment.isReleased) {
      throw new Error('Payment already released');
    }

    try {
      // Calculate commission breakdown
      const commissionBreakdown = await this.commissionService.calculateCommission({
        paymentAmount: payment.amount,
        propertyId: payment.rental.propertyId,
        unitId: payment.rental.unitId,
        agentId: payment.rental.property.agentId,
        ownerId: payment.rental.property.ownerId,
      });

      // Perform the release in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // 1. Update payment status
        const updatedPayment = await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: PaymentStatus.RELEASED,
            isReleased: true,
            releasedAt: new Date(),
            platformFee: commissionBreakdown.platformFee,
            agentCommission: commissionBreakdown.agentCommission,
            ownerAmount: commissionBreakdown.ownerAmount,
          },
        });

        // 2. Transfer funds to recipients
        await this.transferService.distributeFunds({
          paymentId,
          breakdown: commissionBreakdown,
          propertyVirtualAccountId: payment.rental!.property.virtualAccount?.id,
        });

        // 3. Log the release event
        await tx.eventLog.create({
          data: {
            userId: payment.userId,
            type: 'PAYMENT_RELEASED',
            metadata: {
              paymentId,
              rentalId: payment.rentalId,
              propertyId: payment.rental?.propertyId,
              unitId: payment.rental?.unitId,
              totalAmount: payment.amount.toString(),
              platformFee: commissionBreakdown.platformFee.toString(),
              agentCommission: commissionBreakdown.agentCommission?.toString(),
              ownerAmount: commissionBreakdown.ownerAmount.toString(),
              releasedAt: new Date().toISOString(),
            },
          },
        });

        return updatedPayment;
      });

      // Send notifications
      await this.sendReleaseNotifications(payment, commissionBreakdown);

      return {
        paymentId,
        success: true,
        releasedAmount: payment.amount,
        commissionAmount: commissionBreakdown.totalCommission,
        ownerAmount: commissionBreakdown.ownerAmount,
        agentCommission: commissionBreakdown.agentCommission,
        platformFee: commissionBreakdown.platformFee,
      };
    } catch (error) {
      // Log release failure
      await prisma.eventLog.create({
        data: {
          userId: payment.userId,
          type: 'PAYMENT_RELEASE_FAILED',
          metadata: {
            paymentId,
            error: error instanceof Error ? error.message : 'Unknown error',
            attemptedAt: new Date().toISOString(),
          },
        },
      });

      return {
        paymentId,
        success: false,
        releasedAmount: new Decimal(0),
        commissionAmount: new Decimal(0),
        ownerAmount: new Decimal(0),
        platformFee: new Decimal(0),
        error: error instanceof Error ? error.message : 'Release failed',
      };
    }
  }

  /**
   * Get all payments ready for release
   */
  async getPaymentsReadyForRelease() {
    const releaseThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return prisma.payment.findMany({
      where: {
        status: PaymentStatus.HELD,
        isReleased: false,
        rental: {
          isConfirmed: true,
          confirmedAt: {
            lte: releaseThreshold,
          },
        },
      },
      include: {
        rental: {
          include: {
            property: {
              include: {
                owner: true,
                agent: true,
              },
            },
            unit: true,
          },
        },
        user: true,
      },
      orderBy: {
        rental: {
          confirmedAt: 'asc',
        },
      },
    });
  }

  /**
   * Batch release multiple payments (called by scheduler)
   */
  async batchReleasePayments() {
    const paymentsToRelease = await this.getPaymentsReadyForRelease();

    const results: PaymentReleaseResult[] = [];

    for (const payment of paymentsToRelease) {
      const result = await this.releasePayment(payment.id);
      results.push(result);

      // Add delay between releases to avoid overwhelming the system
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return {
      total: results.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }

  /**
   * Send notifications after payment release
   */
  private async sendReleaseNotifications(payment: any, breakdown: any) {
    // Notify property owner
    await this.notificationService.sendPaymentReleasedNotification({
      recipientId: payment.rental.property.ownerId,
      paymentId: payment.id,
      amount: breakdown.ownerAmount.toString(),
      propertyTitle: payment.rental.property.title,
    });

    // Notify agent if exists
    if (
      payment.rental.property.agentId &&
      breakdown.agentCommission &&
      breakdown.agentCommission.greaterThan(0)
    ) {
      await this.notificationService.sendCommissionPaidNotification({
        recipientId: payment.rental.property.agentId,
        paymentId: payment.id,
        commission: breakdown.agentCommission.toString(),
        propertyTitle: payment.rental.property.title,
      });
    }

    // Notify renter
    await this.notificationService.sendPaymentCompletedNotification({
      recipientId: payment.userId,
      paymentId: payment.id,
      propertyTitle: payment.rental.property.title,
    });
  }

  /**
   * Get release schedule for a payment
   */
  async getReleaseSchedule(paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        rental: true,
      },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (!payment.rental?.confirmedAt) {
      return {
        paymentId,
        status: 'NOT_CONFIRMED',
        message: 'Payment has not been confirmed yet',
      };
    }

    const releaseDate = new Date(
      payment.rental.confirmedAt.getTime() + 24 * 60 * 60 * 1000
    );
    const now = new Date();

    return {
      paymentId,
      confirmedAt: payment.rental.confirmedAt,
      releaseDate,
      hoursUntilRelease: Math.max(
        0,
        Math.floor((releaseDate.getTime() - now.getTime()) / (1000 * 60 * 60))
      ),
      isReadyForRelease: now >= releaseDate,
      isReleased: payment.isReleased,
      releasedAt: payment.releasedAt,
    };
  }
}


// import { PrismaClient, PaymentStatus, RentalStatus } from '@prisma/client';
// import { CommissionService } from './commissionService';
// import { VirtualAccountService } from './virtualAccountService';
// import { logger } from '../../../shared/src/middleware/logger';

// const prisma = new PrismaClient();

// export class ReleaseService {
//   private commissionService: CommissionService;
//   private virtualAccountService: VirtualAccountService;

//   constructor() {
//     this.commissionService = new CommissionService();
//     this.virtualAccountService = new VirtualAccountService();
//   }

//   /**
//    * Release payments after confirmation period ends
//    */
//   async releasePayment(rentalId: string): Promise<{
//     success: boolean;
//     message: string;
//     distributions?: any[];
//   }> {
//     try {
//       const rental = await prisma.rental.findUnique({
//         where: { id: rentalId },
//         include: {
//           property: {
//             include: {
//               owner: true,
//               agent: true,
//               virtualAccount: true,
//             },
//           },
//           unit: true,
//           renter: true,
//           payments: {
//             where: {
//               status: PaymentStatus.HELD,
//               paymentType: 'RENT',
//             },
//           },
//         },
//       });

//       if (!rental) {
//         return {
//           success: false,
//           message: 'Rental not found',
//         };
//       }

//       // Verify rental is confirmed
//       if (!rental.isConfirmed) {
//         return {
//           success: false,
//           message: 'Rental must be confirmed before releasing payment',
//         };
//       }

//       // Verify 24 hours have passed since confirmation
//       if (rental.confirmedAt) {
//         const hoursSinceConfirmation = 
//           (new Date().getTime() - rental.confirmedAt.getTime()) / (1000 * 60 * 60);
        
//         if (hoursSinceConfirmation < 24) {
//           return {
//             success: false,
//             message: `Payment can be released in ${(24 - hoursSinceConfirmation).toFixed(1)} hours`,
//           };
//         }
//       }

//       const heldPayments = rental.payments.filter(p => p.status === PaymentStatus.HELD);

//       if (heldPayments.length === 0) {
//         return {
//           success: false,
//           message: 'No held payments found for this rental',
//         };
//       }

//       const distributions: any[] = [];

//       for (const payment of heldPayments) {
//         try {
//           // Calculate commission distribution
//           const distribution = await this.commissionService.calculateCommissionDistribution({
//             payment,
//             rental,
//             property: rental.property,
//           });

//           // Distribute to virtual accounts
//           const distributionResult = await this.distributePayment(payment, distribution);

//           // Mark payment as released
//           await prisma.payment.update({
//             where: { id: payment.id },
//             data: {
//               status: PaymentStatus.RELEASED,
//               releasedAt: new Date(),
//             },
//           });

//           distributions.push(distributionResult);

//           // Log release event
//           await prisma.eventLog.create({
//             data: {
//               userId: rental.renterId,
//               type: 'PAYMENT_RELEASED',
//               metadata: {
//                 paymentId: payment.id,
//                 rentalId,
//                 distribution: distributionResult,
//                 releasedAt: new Date(),
//               },
//             },
//           });
//         } catch (error) {
//           logger.error(`Error releasing payment ${payment.id}:`, error);
//           throw error;
//         }
//       }

//       logger.info(`Released ${heldPayments.length} payments for rental ${rentalId}`);

//       return {
//         success: true,
//         message: 'Payments released successfully',
//         distributions,
//       };
//     } catch (error) {
//       logger.error('Error releasing payment:', error);
//       throw error;
//     }
//   }

//   /**
//    * Distribute payment to virtual accounts
//    */
//   private async distributePayment(payment: any, distribution: any): Promise<any> {
//     try {
//       const results = [];

//       // Transfer to property owner
//       if (distribution.ownerAmount > 0) {
//         const ownerTransfer = await this.virtualAccountService.creditAccount(
//           distribution.ownerId,
//           distribution.ownerAmount,
//           `Rent payment - ${payment.id}`
//         );
//         results.push({ type: 'OWNER', ...ownerTransfer });
//       }

//       // Transfer to listing agent
//       if (distribution.listingAgentAmount > 0 && distribution.listingAgentId) {
//         const agentTransfer = await this.virtualAccountService.creditAccount(
//           distribution.listingAgentId,
//           distribution.listingAgentAmount,
//           `Commission - ${payment.id}`
//         );
//         results.push({ type: 'LISTING_AGENT', ...agentTransfer });
//       }

//       // Transfer to sub-agent
//       if (distribution.subAgentAmount > 0 && distribution.subAgentId) {
//         const subAgentTransfer = await this.virtualAccountService.creditAccount(
//           distribution.subAgentId,
//           distribution.subAgentAmount,
//           `Commission - ${payment.id}`
//         );
//         results.push({ type: 'SUB_AGENT', ...subAgentTransfer });
//       }

//       // Transfer platform fee to Newcondo
//       if (distribution.platformFee > 0) {
//         const platformTransfer = await this.virtualAccountService.creditPlatformAccount(
//           distribution.platformFee,
//           `Platform fee - ${payment.id}`
//         );
//         results.push({ type: 'PLATFORM', ...platformTransfer });
//       }

//       return {
//         paymentId: payment.id,
//         totalAmount: payment.amount,
//         distribution,
//         transfers: results,
//       };
//     } catch (error) {
//       logger.error('Error distributing payment:', error);
//       throw error;
//     }
//   }

//   /**
//    * Process all eligible payments for release
//    */
//   async processScheduledReleases(): Promise<{
//     processed: number;
//     successful: number;
//     failed: number;
//   }> {
//     try {
//       const now = new Date();
//       const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

//       // Find confirmed rentals where 24 hours have passed
//       const eligibleRentals = await prisma.rental.findMany({
//         where: {
//           isConfirmed: true,
//           confirmedAt: {
//             lte: twentyFourHoursAgo,
//           },
//           payments: {
//             some: {
//               status: PaymentStatus.HELD,
//               paymentType: 'RENT',
//             },
//           },
//         },
//         include: {
//           payments: {
//             where: {
//               status: PaymentStatus.HELD,
//             },
//           },
//         },
//       });

//       logger.info(`Found ${eligibleRentals.length} rentals eligible for payment release`);

//       let successful = 0;
//       let failed = 0;

//       for (const rental of eligibleRentals) {
//         try {
//           const result = await this.releasePayment(rental.id);
//           if (result.success) {
//             successful++;
//           } else {
//             failed++;
//           }
//         } catch (error) {
//           logger.error(`Error releasing payment for rental ${rental.id}:`, error);
//           failed++;
//         }
//       }

//       logger.info(`Payment release completed: ${successful} successful, ${failed} failed`);

//       return {
//         processed: eligibleRentals.length,
//         successful,
//         failed,
//       };
//     } catch (error) {
//       logger.error('Error processing scheduled releases:', error);
//       throw error;
//     }
//   }
// }