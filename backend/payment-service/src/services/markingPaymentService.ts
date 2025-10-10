// backend/payment-service/src/services/markingPaymentService.ts

import { PrismaClient, PaymentType, PaymentStatus } from '@newcondo/db';
import { flutterwaveService } from './flutterwaveService';
import {
  MarkingPaymentRequest,
  MarkingPaymentResponse,
  MarkingFeeCalculation,
  FlutterwaveMarkingPaymentData,
  MarkingPaymentConfirmation,
  MarkingRefundRequest,
  MarkingRefundResponse,
  MarkingPaymentWebhookPayload
} from '../types/markingPayment';
import { response } from '../../shared/src/utils/response';

const prisma = new PrismaClient();

export class MarkingPaymentService {
  /**
   * Calculate marking fee based on urgency and other factors
   */
  async calculateMarkingFee(
    urgencyLevel: string,
    userLocation?: { lat: number; lng: number },
    propertyLocation?: { lat: number; lng: number }
  ): Promise<MarkingFeeCalculation> {
    try {
      // Base fee in Naira
      const baseFee = 5000; // ₦5,000 base fee
      
      // Urgency multipliers
      const urgencyMultipliers = {
        LOW: 1.0,
        NORMAL: 1.2,
        HIGH: 1.5,
        URGENT: 2.0
      };

      const urgencyMultiplier = urgencyMultipliers[urgencyLevel as keyof typeof urgencyMultipliers] || 1.2;

      // Calculate distance fee if locations are provided
      let distanceFee = 0;
      if (userLocation && propertyLocation) {
        const distance = this.calculateDistance(userLocation, propertyLocation);
        // Add ₦500 for every 10km beyond first 10km
        if (distance > 10) {
          distanceFee = Math.ceil((distance - 10) / 10) * 500;
        }
      }

      const totalFee = Math.round((baseFee * urgencyMultiplier) + distanceFee);

      return {
        baseFee,
        urgencyMultiplier,
        distanceFee,
        totalFee,
        currency: 'NGN'
      };
    } catch (error) {
      console.error('Error calculating marking fee:', error);
      throw new Error('Failed to calculate marking fee');
    }
  }

  /**
   * Initiate marking service payment
   */
  async initiateMarkingPayment(
    userId: string,
    request: MarkingPaymentRequest
  ): Promise<MarkingPaymentResponse> {
    try {
      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          phone: true,
          name: true
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get property details
      const property = await prisma.property.findUnique({
        where: { id: request.propertyId },
        select: {
          id: true,
          title: true,
          address: true,
          gpsCoordinates: true,
          ownerId: true
        }
      });

      if (!property) {
        throw new Error('Property not found');
      }

      // Verify user owns the property
      if (property.ownerId !== userId) {
        throw new Error('You can only request marking for your own properties');
      }

      // Check if property already has a pending marking job
      const existingJob = await prisma.propertyMarkingJob.findFirst({
        where: {
          propertyId: request.propertyId,
          status: {
            in: ['QUEUED', 'ASSIGNED', 'IN_PROGRESS']
          }
        }
      });

      if (existingJob) {
        throw new Error('Property already has a pending marking job');
      }

      // Calculate marking fee
      let propertyCoords;
      if (property.gpsCoordinates) {
        try {
          propertyCoords = JSON.parse(property.gpsCoordinates);
        } catch (error) {
          console.error('Error parsing property coordinates:', error);
        }
      }

      const feeCalculation = await this.calculateMarkingFee(
        request.urgencyLevel,
        undefined, // User location not available here
        propertyCoords
      );

      // Create marking job first
      const markingJob = await prisma.propertyMarkingJob.create({
        data: {
          propertyId: request.propertyId,
          requestedBy: userId,
          contactPersonName: request.contactPersonName,
          contactPersonPhone: request.contactPersonPhone,
          accessInstructions: request.accessInstructions,
          preferredTime: request.preferredTime ? new Date(request.preferredTime) : undefined,
          urgencyLevel: request.urgencyLevel as any,
          markingFee: feeCalculation.totalFee,
          status: 'QUEUED',
          maxCompletionTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
        }
      });

      // Generate unique transaction reference
      const txRef = `marking_${markingJob.id}_${Date.now()}`;

      // Prepare Flutterwave payment data
      const flutterwaveData: FlutterwaveMarkingPaymentData = {
        tx_ref: txRef,
        amount: feeCalculation.totalFee,
        currency: 'NGN',
        customer: {
          email: user.email,
          phonenumber: user.phone || '',
          name: user.name || 'Newcondo User'
        },
        customizations: {
          title: 'Property Marking Service',
          description: `Marking service for ${property.title}`,
          logo: process.env.COMPANY_LOGO_URL || ''
        },
        redirect_url: `${process.env.FRONTEND_URL}/dashboard/properties/marking/success`,
        meta: {
          markingJobId: markingJob.id,
          propertyId: request.propertyId,
          urgencyLevel: request.urgencyLevel
        }
      };

      // Initialize payment with Flutterwave
      const flutterwaveResponse = await flutterwaveService.initializePayment(flutterwaveData);

      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          userId,
          markingJobId: markingJob.id,
          amount: feeCalculation.totalFee,
          currency: 'NGN',
          paymentType: PaymentType.PROPERTY_MARKING,
          status: PaymentStatus.PENDING,
          flutterwaveRef: txRef,
          description: `Property marking service for ${property.title}`,
          confirmationPeriodEnd: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
      });

      return {
        paymentId: payment.id,
        markingJobId: markingJob.id,
        amount: feeCalculation.totalFee,
        currency: 'NGN',
        status: 'PENDING',
        flutterwaveRef: txRef,
        paymentLink: flutterwaveResponse.data.link,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
      };
    } catch (error) {
      console.error('Error initiating marking payment:', error);
      throw error;
    }
  }

  /**
   * Handle marking payment webhook
   */
  async handleMarkingPaymentWebhook(
    payload: MarkingPaymentWebhookPayload
  ): Promise<void> {
    try {
      const { data } = payload;

      // Find the payment record
      const payment = await prisma.payment.findUnique({
        where: { flutterwaveRef: data.tx_ref },
        include: {
          user: true
        }
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      // Verify payment with Flutterwave
      const verification = await flutterwaveService.verifyPayment(data.flw_ref);

      if (verification.data.status === 'successful' && verification.data.amount >= payment.amount) {
        // Update payment status
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.SUCCESS,
            transactionId: data.flw_ref,
            paidAt: new Date(),
            isReleased: true,
            releasedAt: new Date()
          }
        });

        // Update marking job status
        if (payment.markingJobId) {
          await prisma.propertyMarkingJob.update({
            where: { id: payment.markingJobId },
            data: {
              paymentStatus: PaymentStatus.SUCCESS,
              status: 'QUEUED' // Job is now paid and queued for assignment
            }
          });

          // TODO: Trigger agent assignment process
          // This could be handled by a separate queue/job system
        }

        // Log successful payment
        console.log(`Marking payment successful: ${payment.id}`);
      } else {
        // Update payment as failed
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.FAILED,
            failureReason: 'Payment verification failed'
          }
        });

        // Cancel marking job
        if (payment.markingJobId) {
          await prisma.propertyMarkingJob.update({
            where: { id: payment.markingJobId },
            data: {
              status: 'CANCELLED',
              paymentStatus: PaymentStatus.FAILED
            }
          });
        }

        console.log(`Marking payment failed: ${payment.id}`);
      }
    } catch (error) {
      console.error('Error handling marking payment webhook:', error);
      throw error;
    }
  }

  /**
   * Get marking payment status
   */
  async getMarkingPaymentStatus(paymentId: string, userId: string): Promise<MarkingPaymentConfirmation> {
    try {
      const payment = await prisma.payment.findFirst({
        where: {
          id: paymentId,
          userId,
          paymentType: PaymentType.PROPERTY_MARKING
        },
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      return {
        markingJobId: payment.markingJobId || '',
        paymentId: payment.id,
        status: payment.status === PaymentStatus.SUCCESS ? 'CONFIRMED' : 'FAILED',
        transactionId: payment.transactionId || '',
        paidAt: payment.paidAt?.toISOString() || '',
        amount: Number(payment.amount),
        currency: payment.currency
      };
    } catch (error) {
      console.error('Error getting marking payment status:', error);
      throw error;
    }
  }

  /**
   * Process marking payment refund
   */
  async processMarkingRefund(
    refundRequest: MarkingRefundRequest,
    adminId: string
  ): Promise<MarkingRefundResponse> {
    try {
      // Get payment details
      const payment = await prisma.payment.findUnique({
        where: { id: refundRequest.paymentId },
        include: {
          user: true
        }
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== PaymentStatus.SUCCESS) {
        throw new Error('Can only refund successful payments');
      }

      // Calculate refund amount
      const refundAmount = refundRequest.refundAmount || Number(payment.amount);

      // Process refund through Flutterwave
      const refundResponse = await flutterwaveService.processRefund({
        flw_ref: payment.transactionId!,
        amount: refundAmount
      });

      // Update payment status
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.REFUNDED,
          failureReason: refundRequest.reason
        }
      });

      // Update marking job if exists
      if (payment.markingJobId) {
        await prisma.propertyMarkingJob.update({
          where: { id: payment.markingJobId },
          data: {
            status: 'CANCELLED'
          }
        });
      }

      // Log admin action
      await prisma.adminAction.create({
        data: {
          adminId,
          action: 'PAYMENT_REFUNDED',
          targetType: 'Payment',
          targetId: payment.id,
          description: `Refunded marking payment: ${refundRequest.reason}`,
          metadata: {
            originalAmount: Number(payment.amount),
            refundAmount,
            reason: refundRequest.reason
          }
        }
      });

      return {
        refundId: refundResponse.data.id.toString(),
        status: 'PROCESSING',
        refundAmount,
        currency: payment.currency,
        processedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error processing marking refund:', error);
      return {
        refundId: '',
        status: 'FAILED',
        refundAmount: refundRequest.refundAmount || 0,
        currency: 'NGN',
        failureReason: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(
    coord1: { lat: number; lng: number },
    coord2: { lat: number; lng: number }
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(coord2.lat - coord1.lat);
    const dLon = this.toRad(coord2.lng - coord1.lng);
    const lat1 = this.toRad(coord1.lat);
    const lat2 = this.toRad(coord2.lat);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;

    return d;
  }

  private toRad(value: number): number {
    return value * Math.PI / 180;
  }
}

export const markingPaymentService = new MarkingPaymentService();





// // backend/payment-service/src/services/markingPaymentService.ts

// import { PrismaClient, PaymentStatus, PaymentType } from '@newcondo/db';
// import { flutterwaveService } from './flutterwaveService';
// import { virtualAccountService } from './virtualAccountService';

// const prisma = new PrismaClient();

// interface MarkingPaymentData {
//   userId: string;
//   markingJobId: string;
//   amount: number;
//   paymentMethod: 'card' | 'bank_transfer' | 'virtual_account';
//   metadata?: Record<string, any>;
// }

// interface MarkingPaymentResult {
//   success: boolean;
//   payment?: any;
//   paymentLink?: string;
//   virtualAccount?: any;
//   error?: string;
// }

// class MarkingPaymentService {
//   /**
//    * Initialize marking job payment
//    */
//   async initiateMarkingPayment(data: MarkingPaymentData): Promise<MarkingPaymentResult> {
//     try {
//       // Verify marking job exists and is in correct state
//       const markingJob = await prisma.propertyMarkingJob.findUnique({
//         where: { id: data.markingJobId },
//         include: {
//           property: true,
//           requestingUser: true,
//         },
//       });

//       if (!markingJob) {
//         return { success: false, error: 'Marking job not found' };
//       }

//       if (markingJob.paymentStatus === PaymentStatus.SUCCESS) {
//         return { success: false, error: 'Marking job already paid for' };
//       }

//       if (markingJob.requestedBy !== data.userId) {
//         return { success: false, error: 'Unauthorized: Not the job requester' };
//       }

//       // Create payment record
//       const payment = await prisma.payment.create({
//         data: {
//           userId: data.userId,
//           markingJobId: data.markingJobId,
//           amount: data.amount,
//           currency: 'NGN',
//           paymentType: PaymentType.PROPERTY_MARKING,
//           status: PaymentStatus.PENDING,
//           paymentMethod: data.paymentMethod,
//           description: `Property marking service for ${markingJob.property.title}`,
//         },
//       });

//       // Handle different payment methods
//       if (data.paymentMethod === 'virtual_account') {
//         // Get or create virtual account for user
//         const virtualAccount = await virtualAccountService.getOrCreateVirtualAccount({
//           userId: data.userId,
//         });

//         // Update payment with virtual account details
//         await prisma.payment.update({
//           where: { id: payment.id },
//           data: {
//             description: `${payment.description} - Pay to account: ${virtualAccount.accountNumber}`,
//           },
//         });

//         return {
//           success: true,
//           payment,
//           virtualAccount: {
//             accountNumber: virtualAccount.accountNumber,
//             accountName: virtualAccount.accountName,
//             bankCode: virtualAccount.bankCode,
//             amount: data.amount,
//           },
//         };
//       } else {
//         // Generate Flutterwave payment link
//         const flutterwavePayment = await flutterwaveService.initializePayment({
//           amount: data.amount,
//           currency: 'NGN',
//           email: markingJob.requestingUser.email!,
//           txRef: payment.id,
//           redirectUrl: `${process.env.FRONTEND_URL}/payments/marking/verify`,
//           meta: {
//             paymentId: payment.id,
//             markingJobId: data.markingJobId,
//             userId: data.userId,
//           },
//         });

//         // Update payment with Flutterwave reference
//         await prisma.payment.update({
//           where: { id: payment.id },
//           data: {
//             flutterwaveRef: flutterwavePayment.data.link,
//           },
//         });

//         return {
//           success: true,
//           payment,
//           paymentLink: flutterwavePayment.data.link,
//         };
//       }
//     } catch (error) {
//       console.error('Error initiating marking payment:', error);
//       return {
//         success: false,
//         error: error instanceof Error ? error.message : 'Failed to initiate payment',
//       };
//     }
//   }

//   /**
//    * Verify marking payment
//    */
//   async verifyMarkingPayment(paymentId: string, transactionId: string): Promise<MarkingPaymentResult> {
//     try {
//       const payment = await prisma.payment.findUnique({
//         where: { id: paymentId },
//         include: {
//           user: true,
//         },
//       });

//       if (!payment) {
//         return { success: false, error: 'Payment not found' };
//       }

//       if (payment.status === PaymentStatus.SUCCESS) {
//         return { success: true, payment };
//       }

//       // Verify with Flutterwave
//       const verificationResult = await flutterwaveService.verifyPayment(transactionId);

//       if (verificationResult.status === 'success' && verificationResult.data.status === 'successful') {
//         // Update payment status
//         const updatedPayment = await prisma.payment.update({
//           where: { id: paymentId },
//           data: {
//             status: PaymentStatus.SUCCESS,
//             transactionId: verificationResult.data.id.toString(),
//             paidAt: new Date(),
//           },
//         });

//         // Update marking job payment status
//         if (payment.markingJobId) {
//           await prisma.propertyMarkingJob.update({
//             where: { id: payment.markingJobId },
//             data: {
//               paymentStatus: PaymentStatus.SUCCESS,
//             },
//           });
//         }

//         return { success: true, payment: updatedPayment };
//       } else {
//         // Update payment as failed
//         await prisma.payment.update({
//           where: { id: paymentId },
//           data: {
//             status: PaymentStatus.FAILED,
//             failureReason: verificationResult.data.status || 'Payment verification failed',
//           },
//         });

//         return { success: false, error: 'Payment verification failed' };
//       }
//     } catch (error) {
//       console.error('Error verifying marking payment:', error);
//       return {
//         success: false,
//         error: error instanceof Error ? error.message : 'Failed to verify payment',
//       };
//     }
//   }

//   /**
//    * Process virtual account payment for marking job
//    */
//   async processVirtualAccountPayment(webhookData: any): Promise<MarkingPaymentResult> {
//     try {
//       const { account_number, amount, transaction_reference } = webhookData;

//       // Find virtual account
//       const virtualAccount = await prisma.virtualAccount.findUnique({
//         where: { accountNumber: account_number },
//       });

//       if (!virtualAccount) {
//         return { success: false, error: 'Virtual account not found' };
//       }

//       // Find pending marking payment for this user
//       const payment = await prisma.payment.findFirst({
//         where: {
//           userId: virtualAccount.userId,
//           paymentType: PaymentType.PROPERTY_MARKING,
//           status: PaymentStatus.PENDING,
//           amount: parseFloat(amount),
//         },
//         orderBy: { createdAt: 'desc' },
//       });

//       if (!payment) {
//         return { success: false, error: 'No matching pending payment found' };
//       }

//       // Update payment status
//       const updatedPayment = await prisma.payment.update({
//         where: { id: payment.id },
//         data: {
//           status: PaymentStatus.SUCCESS,
//           transactionId: transaction_reference,
//           paidAt: new Date(),
//         },
//       });

//       // Update marking job payment status
//       if (payment.markingJobId) {
//         await prisma.propertyMarkingJob.update({
//           where: { id: payment.markingJobId },
//           data: {
//             paymentStatus: PaymentStatus.SUCCESS,
//           },
//         });
//       }

//       return { success: true, payment: updatedPayment };
//     } catch (error) {
//       console.error('Error processing virtual account payment:', error);
//       return {
//         success: false,
//         error: error instanceof Error ? error.message : 'Failed to process payment',
//       };
//     }
//   }

//   /**
//    * Get marking payment details
//    */
//   async getMarkingPayment(paymentId: string) {
//     try {
//       const payment = await prisma.payment.findUnique({
//         where: { id: paymentId },
//         include: {
//           user: {
//             select: {
//               id: true,
//               name: true,
//               email: true,
//             },
//           },
//         },
//       });

//       return payment;
//     } catch (error) {
//       console.error('Error fetching marking payment:', error);
//       throw error;
//     }
//   }

//   /**
//    * Get all marking payments for a user
//    */
//   async getUserMarkingPayments(userId: string) {
//     try {
//       const payments = await prisma.payment.findMany({
//         where: {
//           userId,
//           paymentType: PaymentType.PROPERTY_MARKING,
//         },
//         orderBy: { createdAt: 'desc' },
//       });

//       return payments;
//     } catch (error) {
//       console.error('Error fetching user marking payments:', error);
//       throw error;
//     }
//   }

//   /**
//    * Refund marking payment
//    */
//   async refundMarkingPayment(paymentId: string, reason: string) {
//     try {
//       const payment = await prisma.payment.findUnique({
//         where: { id: paymentId },
//       });

//       if (!payment) {
//         throw new Error('Payment not found');
//       }

//       if (payment.status !== PaymentStatus.SUCCESS) {
//         throw new Error('Can only refund successful payments');
//       }

//       // Process refund with Flutterwave
//       if (payment.transactionId) {
//         await flutterwaveService.refundPayment(payment.transactionId, payment.amount.toNumber());
//       }

//       // Update payment status
//       const refundedPayment = await prisma.payment.update({
//         where: { id: paymentId },
//         data: {
//           status: PaymentStatus.REFUNDED,
//           failureReason: reason,
//         },
//       });

//       // Update marking job payment status if exists
//       if (payment.markingJobId) {
//         await prisma.propertyMarkingJob.update({
//           where: { id: payment.markingJobId },
//           data: {
//             paymentStatus: PaymentStatus.REFUNDED,
//           },
//         });
//       }

//       return refundedPayment;
//     } catch (error) {
//       console.error('Error refunding marking payment:', error);
//       throw error;
//     }
//   }
// }

// export const markingPaymentService = new MarkingPaymentService();