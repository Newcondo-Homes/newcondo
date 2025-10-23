import { PrismaClient, Payment, PaymentStatus, PaymentType, MarkingJobStatus } from '@newcondo/db';
import { FlutterwaveAPI } from '../../../shared/src/utils/flutterwave';
import { generatePaymentReference, calculateMarkingFee } from '../../../shared/src/utils/payment';
import { standardResponse } from '../../../shared/src/utils/response';
import { logger } from '../../../shared/src/middleware/logger';

interface InitiateMarkingPaymentParams {
  markingJobId: string;
  userId: string;
  amount: number;
  paymentMethod: string;
}

interface VerifyMarkingPaymentParams {
  transactionId: string;
  flutterwaveRef: string;
  userId: string;
}

interface GetMarkingPaymentHistoryParams {
  userId: string;
  page: number;
  limit: number;
  status?: string;
}

interface GetMarkingPaymentDetailsParams {
  paymentId: string;
  userId: string;
}

interface CancelMarkingPaymentParams {
  paymentId: string;
  userId: string;
}

interface RefundMarkingPaymentParams {
  paymentId: string;
  reason: string;
  adminId: string;
  refundAmount?: number;
}

interface GetMarkingPaymentStatisticsParams {
  startDate?: Date;
  endDate?: Date;
}

interface RetryMarkingPaymentParams {
  paymentId: string;
  userId: string;
}

export class PaymentService {
  private prisma: PrismaClient;
  private flutterwaveAPI: FlutterwaveAPI;

  constructor() {
    this.prisma = new PrismaClient();
    this.flutterwaveAPI = new FlutterwaveAPI();
  }

  /**
   * Initiate payment for property marking service
   */
  async initiateMarkingPayment(params: InitiateMarkingPaymentParams): Promise<{
    success: boolean;
    paymentId?: string;
    paymentLink?: string;
    reference?: string;
    message: string;
  }> {
    try {
      const { markingJobId, userId, amount, paymentMethod } = params;

      // Verify marking job exists and belongs to user
      const markingJob = await this.prisma.propertyMarkingJob.findUnique({
        where: { id: markingJobId },
        include: {
          property: {
            select: {
              title: true,
              address: true
            }
          },
          requestingUser: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        }
      });

      if (!markingJob) {
        return {
          success: false,
          message: 'Marking job not found'
        };
      }

      if (markingJob.requestedBy !== userId) {
        return {
          success: false,
          message: 'Unauthorized to pay for this marking job'
        };
      }

      if (markingJob.paymentStatus === PaymentStatus.SUCCESS) {
        return {
          success: false,
          message: 'Marking job has already been paid for'
        };
      }

      // Validate amount matches marking fee
      const expectedFee = markingJob.markingFee.toNumber();
      if (amount < expectedFee) {
        return {
          success: false,
          message: 'Payment amount is less than the required fee'
        };
      }

      const user = markingJob.requestingUser;
      const txRef = generatePaymentReference(userId, PaymentType.PROPERTY_MARKING);
      const description = `Payment for property marking service for ${markingJob.property.title}`;
      const currency = 'NGN'; // Assuming NGN for marking service

      // Create a pending payment record
      const payment = await this.prisma.payment.create({
        data: {
          transactionId: txRef,
          amount,
          currency,
          paymentType: PaymentType.PROPERTY_MARKING,
          status: PaymentStatus.PENDING,
          paymentMethod,
          description,
          userId: user.id,
          markingJobId: markingJob.id,
        }
      });

      // Initiate payment with Flutterwave
      const paymentLink = await this.flutterwaveAPI.initiatePayment({
        amount,
        currency,
        email: user.email,
        txRef,
        redirectUrl: `${process.env.FRONTEND_URL}/marking-jobs/${markingJob.id}/payment/verify`,
        customerId: user.id,
        customerName: user.name || '',
        customerPhone: user.phone || undefined,
        paymentType: PaymentType.PROPERTY_MARKING,
      });

      // Update payment record with the returned link
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { paymentLink }
      });

      // Update marking job status
      await this.prisma.propertyMarkingJob.update({
        where: { id: markingJobId },
        data: { paymentStatus: PaymentStatus.PENDING, status: MarkingJobStatus.PAYMENT_PENDING }
      });

      return {
        success: true,
        paymentId: payment.id,
        paymentLink,
        reference: txRef,
        message: 'Payment initiated successfully'
      };

    } catch (error) {
      logger.error('Failed to initiate marking payment:', error);
      return {
        success: false,
        message: 'Failed to initiate payment. Please try again later.'
      };
    }
  }

  /**
   * Verify and confirm a property marking payment
   */
  async verifyMarkingPayment(params: VerifyMarkingPaymentParams): Promise<{
    success: boolean;
    paymentId?: string;
    message: string;
  }> {
    const { transactionId, flutterwaveRef, userId } = params;

    try {
      // Find the pending payment record
      const payment = await this.prisma.payment.findFirst({
        where: {
          transactionId,
          userId,
          paymentType: PaymentType.PROPERTY_MARKING,
          status: PaymentStatus.PENDING
        },
        include: { markingJob: true }
      });

      if (!payment) {
        return { success: false, message: 'Payment record not found or already processed.' };
      }

      // Verify the transaction with Flutterwave
      const verificationResponse = await this.flutterwaveAPI.verifyTransaction(flutterwaveRef);

      if (verificationResponse.status === 'successful') {
        const isAmountMatch = verificationResponse.amount >= payment.amount.toNumber();
        if (!isAmountMatch) {
          logger.warn('Amount mismatch on verification', {
            paymentId: payment.id,
            expectedAmount: payment.amount.toNumber(),
            receivedAmount: verificationResponse.amount
          });
          // Handle potential fraud/error here, e.g., set status to a specific `REVIEW` state.
        }

        const isUserMatch = verificationResponse.metadata?.consumer_id === userId;
        if (!isUserMatch) {
          logger.warn('User ID mismatch on verification', {
            paymentId: payment.id,
            expectedUserId: userId,
            receivedUserId: verificationResponse.metadata?.consumer_id
          });
          // Handle potential fraud/error
        }

        // Update payment status
        const updatedPayment = await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.SUCCESS,
            paidAt: new Date(),
            transactionId: verificationResponse.flw_ref, // Use the official Flutterwave ref as the final transaction ID
            paymentDetails: verificationResponse.metadata
          }
        });

        // Update marking job status
        if (payment.markingJob) {
          await this.prisma.propertyMarkingJob.update({
            where: { id: payment.markingJob.id },
            data: {
              paymentStatus: PaymentStatus.SUCCESS,
              status: MarkingJobStatus.PAID,
            }
          });
        }

        // TODO: Trigger a notification to the user and admin
        logger.info('Marking payment verified and confirmed', { paymentId: updatedPayment.id });

        return {
          success: true,
          paymentId: updatedPayment.id,
          message: 'Payment confirmed successfully.'
        };
      } else {
        // Payment failed or is still pending
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.FAILED,
            failureReason: verificationResponse.message || 'Payment verification failed.'
          }
        });

        // Update marking job status
        if (payment.markingJob) {
          await this.prisma.propertyMarkingJob.update({
            where: { id: payment.markingJob.id },
            data: {
              paymentStatus: PaymentStatus.FAILED,
              status: MarkingJobStatus.PAYMENT_FAILED,
            }
          });
        }

        return {
          success: false,
          message: `Payment verification failed: ${verificationResponse.message}`
        };
      }

    } catch (error) {
      logger.error('Error verifying marking payment:', error);
      return {
        success: false,
        message: 'An error occurred during payment verification.'
      };
    }
  }

  /**
   * Get payment history for a user
   */
  async getMarkingPaymentHistory(params: GetMarkingPaymentHistoryParams): Promise<Payment[]> {
    const { userId, page, limit, status } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
      paymentType: PaymentType.PROPERTY_MARKING
    };
    if (status) {
      where.status = status;
    }

    const payments = await this.prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        markingJob: {
          include: {
            property: true
          }
        }
      }
    });

    return payments;
  }

  /**
   * Get details of a single marking payment
   */
  async getMarkingPaymentDetails(params: GetMarkingPaymentDetailsParams): Promise<Payment | null> {
    const { paymentId, userId } = params;

    const payment = await this.prisma.payment.findUnique({
      where: {
        id: paymentId,
        userId,
        paymentType: PaymentType.PROPERTY_MARKING
      },
      include: {
        markingJob: {
          include: {
            property: true
          }
        }
      }
    });

    return payment;
  }
}

















// // backend/marking-service/src/services/paymentService.ts

// import { PrismaClient, PaymentStatus, PaymentType } from '@prisma/client';

// const prisma = new PrismaClient();

// export class PaymentService {
//   private readonly INITIAL_PAYMENT_PERCENTAGE = 0.05; // 5% initial (approx 1000 naira)
//   private readonly AGENT_COMMISSION_RATE = 0.25; // 25% of marking fee

//   /**
//    * Process initial agent payment (small advance)
//    */
//   async processInitialAgentPayment(jobId: string, agentId: string) {
//     const job = await prisma.propertyMarkingJob.findUnique({
//       where: { id: jobId },
//     });

//     if (!job) {
//       throw new Error('Job not found');
//     }

//     // Calculate initial payment (approximately 1000 naira)
//     const totalAgentEarning = Number(job.markingFee) * this.AGENT_COMMISSION_RATE;
//     const initialPayment = totalAgentEarning * this.INITIAL_PAYMENT_PERCENTAGE;

//     // Get agent's virtual account
//     const virtualAccount = await prisma.virtualAccount.findFirst({
//       where: { userId: agentId },
//     });

//     if (!virtualAccount) {
//       throw new Error('Agent virtual account not found');
//     }

//     // Credit virtual account (initial payment is held, not immediately withdrawable)
//     await prisma.virtualAccount.update({
//       where: { id: virtualAccount.id },
//       data: {
//         balance: {
//           increment: initialPayment,
//         },
//       },
//     });

//     // Create payment record
//     const payment = await prisma.payment.create({
//       data: {
//         userId: agentId,
//         amount: initialPayment,
//         currency: 'NGN',
//         paymentType: PaymentType.PROPERTY_MARKING,
//         status: PaymentStatus.HELD,
//         description: `Initial payment for marking job ${jobId}`,
//         markingJobId: jobId,
//       },
//     });

//     // Log event
//     await prisma.eventLog.create({
//       data: {
//         userId: agentId,
//         type: 'INITIAL_PAYMENT_CREDITED',
//         metadata: {
//           jobId,
//           amount: initialPayment,
//           paymentId: payment.id,
//         },
//       },
//     });

//     return {
//       payment,
//       amount: initialPayment,
//       status: 'HELD',
//     };
//   }

//   /**
//    * Release remaining payment to agent after confirmation
//    */
//   async releaseRemainingPayment(jobId: string, agentId: string) {
//     const job = await prisma.propertyMarkingJob.findUnique({
//       where: { id: jobId },
//     });

//     if (!job) {
//       throw new Error('Job not found');
//     }

//     // Calculate remaining payment
//     const totalAgentEarning = Number(job.markingFee) * this.AGENT_COMMISSION_RATE;
//     const initialPayment = totalAgentEarning * this.INITIAL_PAYMENT_PERCENTAGE;
//     const remainingPayment = totalAgentEarning - initialPayment;

//     // Get agent's virtual account
//     const virtualAccount = await prisma.virtualAccount.findFirst({
//       where: { userId: agentId },
//     });

//     if (!virtualAccount) {
//       throw new Error('Agent virtual account not found');
//     }

//     // Credit virtual account (now withdrawable)
//     await prisma.virtualAccount.update({
//       where: { id: virtualAccount.id },
//       data: {
//         balance: {
//           increment: remainingPayment,
//         },
//       },
//     });

//     // Create payment record for remaining amount
//     const payment = await prisma.payment.create({
//       data: {
//         userId: agentId,
//         amount: remainingPayment,
//         currency: 'NGN',
//         paymentType: PaymentType.PROPERTY_MARKING,
//         status: PaymentStatus.RELEASED,
//         description: `Final payment for marking job ${jobId}`,
//         markingJobId: jobId,
//         isReleased: true,
//         releasedAt: new Date(),
//       },
//     });

//     // Update initial payment status to released
//     await prisma.payment.updateMany({
//       where: {
//         userId: agentId,
//         markingJobId: jobId,
//         status: PaymentStatus.HELD,
//       },
//       data: {
//         status: PaymentStatus.RELEASED,
//         isReleased: true,
//         releasedAt: new Date(),
//       },
//     });

//     // Log event
//     await prisma.eventLog.create({
//       data: {
//         userId: agentId,
//         type: 'FINAL_PAYMENT_RELEASED',
//         metadata: {
//           jobId,
//           amount: remainingPayment,
//           totalEarning: totalAgentEarning,
//           paymentId: payment.id,
//         },
//       },
//     });

//     return {
//       payment,
//       amount: remainingPayment,
//       totalEarning: totalAgentEarning,
//       status: 'RELEASED',
//     };
//   }

//   /**
//    * Process refund for cancelled job
//    */
//   async processRefund(jobId: string, reason: string) {
//     const job = await prisma.propertyMarkingJob.findUnique({
//       where: { id: jobId },
//       include: {
//         requestingUser: true,
//       },
//     });

//     if (!job) {
//       throw new Error('Job not found');
//     }

//     // Find the original payment
//     const originalPayment = await prisma.payment.findFirst({
//       where: {
//         markingJobId: jobId,
//         paymentType: PaymentType.PROPERTY_MARKING,
//         userId: job.requestedBy,
//       },
//       orderBy: {
//         createdAt: 'desc',
//       },
//     });

//     if (!originalPayment) {
//       throw new Error('Original payment not found');
//     }

//     // Create refund payment record
//     const refund = await prisma.payment.create({
//       data: {
//         userId: job.requestedBy,
//         amount: originalPayment.amount,
//         currency: 'NGN',
//         paymentType: PaymentType.PROPERTY_MARKING,
//         status: PaymentStatus.REFUNDED,
//         description: `Refund for cancelled marking job. Reason: ${reason}`,
//         markingJobId: jobId,
//       },
//     });

//     // Update original payment status
//     await prisma.payment.update({
//       where: { id: originalPayment.id },
//       data: {
//         status: PaymentStatus.REFUNDED,
//       },
//     });

//     // Credit user's virtual account
//     const virtualAccount = await prisma.virtualAccount.findFirst({
//       where: { userId: job.requestedBy },
//     });

//     if (virtualAccount) {
//       await prisma.virtualAccount.update({
//         where: { id: virtualAccount.id },
//         data: {
//           balance: {
//             increment: Number(originalPayment.amount),
//           },
//         },
//       });
//     }

//     // Log event
//     await prisma.eventLog.create({
//       data: {
//         userId: job.requestedBy,
//         type: 'MARKING_PAYMENT_REFUNDED',
//         metadata: {
//           jobId,
//           amount: Number(originalPayment.amount),
//           reason,
//           refundId: refund.id,
//         },
//       },
//     });

//     return {
//       refund,
//       amount: Number(originalPayment.amount),
//       status: 'REFUNDED',
//     };
//   }

//   /**
//    * Calculate marking fee breakdown
//    */
//   calculateMarkingFeeBreakdown(markingFee: number) {
//     const agentEarning = markingFee * this.AGENT_COMMISSION_RATE; // 25%
//     const platformFee = markingFee - agentEarning; // 75%
//     const initialPayment = agentEarning * this.INITIAL_PAYMENT_PERCENTAGE;
//     const finalPayment = agentEarning - initialPayment;

//     return {
//       totalFee: markingFee,
//       agentEarning,
//       platformFee,
//       initialPayment,
//       finalPayment,
//       agentCommissionRate: `${this.AGENT_COMMISSION_RATE * 100}%`,
//     };
//   }

//   /**
//    * Get payment history for marking jobs
//    */
//   async getMarkingPaymentHistory(userId: string, role: 'AGENT' | 'OWNER') {
//     if (role === 'AGENT') {
//       // Get payments received by agent
//       return prisma.payment.findMany({
//         where: {
//           userId,
//           paymentType: PaymentType.PROPERTY_MARKING,
//         },
//         orderBy: {
//           createdAt: 'desc',
//         },
//       });
//     } else {
//       // Get payments made by property owner
//       return prisma.payment.findMany({
//         where: {
//           userId,
//           paymentType: PaymentType.PROPERTY_MARKING,
//         },
//         orderBy: {
//           createdAt: 'desc',
//         },
//       });
//     }
//   }

//   /**
//    * Get agent earnings summary
//    */
//   async getAgentEarningsSummary(agentId: string) {
//     const payments = await prisma.payment.findMany({
//       where: {
//         userId: agentId,
//         paymentType: PaymentType.PROPERTY_MARKING,
//         status: {
//           in: [PaymentStatus.HELD, PaymentStatus.RELEASED],
//         },
//       },
//     });

//     const totalEarnings = payments.reduce((sum, p) => sum + Number(p.amount), 0);
//     const heldAmount = payments
//       .filter(p => p.status === PaymentStatus.HELD)
//       .reduce((sum, p) => sum + Number(p.amount), 0);
//     const releasedAmount = payments
//       .filter(p => p.status === PaymentStatus.RELEASED)
//       .reduce((sum, p) => sum + Number(p.amount), 0);

//     return {
//       totalEarnings,
//       heldAmount,
//       releasedAmount,
//       availableForWithdrawal: releasedAmount,
//       pendingConfirmation: heldAmount,
//       totalJobs: payments.length,
//     };
//   }

//   /**
//    * Process platform fee collection
//    */
//   async processPlatformFee(jobId: string) {
//     const job = await prisma.propertyMarkingJob.findUnique({
//       where: { id: jobId },
//     });

//     if (!job) {
//       throw new Error('Job not found');
//     }

//     const agentEarning = Number(job.markingFee) * this.AGENT_COMMISSION_RATE;
//     const platformFee = Number(job.markingFee) - agentEarning;

//     // Log platform fee collection
//     await prisma.eventLog.create({
//       data: {
//         userId: null,
//         type: 'PLATFORM_FEE_COLLECTED',
//         metadata: {
//           jobId,
//           amount: platformFee,
//           markingFee: Number(job.markingFee),
//           agentEarning,
//         },
//       },
//     });

//     return {
//       platformFee,
//       markingFee: Number(job.markingFee),
//       agentEarning,
//     };
//   }

//   /**
//    * Get payment statistics
//    */
//   async getPaymentStats(userId?: string) {
//     const where: any = {
//       paymentType: PaymentType.PROPERTY_MARKING,
//     };

//     if (userId) {
//       where.userId = userId;
//     }

//     const [totalPayments, totalAmount, heldPayments, releasedPayments, refunded] = await Promise.all([
//       prisma.payment.count({ where }),
//       prisma.payment.aggregate({
//         where,
//         _sum: { amount: true },
//       }),
//       prisma.payment.count({
//         where: { ...where, status: PaymentStatus.HELD },
//       }),
//       prisma.payment.count({
//         where: { ...where, status: PaymentStatus.RELEASED },
//       }),
//       prisma.payment.count({
//         where: { ...where, status: PaymentStatus.REFUNDED },
//       }),
//     ]);

//     return {
//       totalPayments,
//       totalAmount: Number(totalAmount._sum.amount) || 0,
//       heldPayments,
//       releasedPayments,
//       refunded,
//       releaseRate: totalPayments > 0 ? (releasedPayments / totalPayments) * 100 : 0,
//     };
//   }
// }

// export default PaymentService;