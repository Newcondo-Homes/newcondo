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