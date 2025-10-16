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







// // backend/payment-service/src/services/markingPaymentService.ts

// import { Request } from 'express';
// import { prisma } from '@newcondo/db';
// import {
//   MarkingPaymentType,
//   MarkingPaymentCreateInput,
//   PaymentWebhookData,
// } from '../types/markingPayment';
// import { logger } from '@newcondo/shared/middleware/logger';
// import crypto from 'crypto';

// class MarkingPaymentService {
//   private flutterwaveSecretKey = process.env.FLUTTERWAVE_SECRET_KEY || '';
//   private platformFeePercentage = 0.75; // 75% goes to platform from 20,000 NGN fee
//   private agentCommissionPercentage = 0.25; // 25% goes to agent (5,000 NGN)
//   private initialEscrowAmount = 1000; // Initial hold amount for agent
//   private totalMarkingFee = 20000; // Total fee for marking service

//   /**
//    * Create a new marking payment record
//    * Initializes payment with PENDING status and links to marking job
//    */
//   async createMarkingPayment(
//     input: MarkingPaymentCreateInput
//   ): Promise<MarkingPaymentType> {
//     try {
//       logger.info(`Creating marking payment - JobID: ${input.markingJobId}`);

//       // Verify marking job exists
//       const markingJob = await prisma.propertyMarkingJob.findUnique({
//         where: { id: input.markingJobId },
//         include: { property: true },
//       });

//       if (!markingJob) {
//         throw new Error(`Marking job not found: ${input.markingJobId}`);
//       }

//       // Verify user is property owner or assigned agent
//       const isPropertyOwner = markingJob.requestedBy === input.userId;
//       const isAssignedAgent = markingJob.assignedAgentId === input.userId;

//       if (!isPropertyOwner && !isAssignedAgent) {
//         throw new Error(
//           'User is not authorized to make payment for this marking job'
//         );
//       }

//       // Determine marking type and calculate fees
//       const { markingType } = input;
//       let amount = this.totalMarkingFee;

//       if (markingType === 'AGENT_ASSIGNED') {
//         // Full fee for Newcondo or agent-assigned marking
//         amount = this.totalMarkingFee;
//       } else if (markingType === 'OWNER_SELF_MARK') {
//         // No fee if owner marks themselves
//         amount = 0;
//       } else if (markingType === 'KNOWN_PERSON') {
//         // No fee for known person marking (owner arranges separately)
//         amount = 0;
//       }

//       // Create payment record in database
//       const paymentRecord = await prisma.payment.create({
//         data: {
//           userId: input.userId,
//           propertyId: input.propertyId,
//           markingJobId: input.markingJobId,
//           amount,
//           currency: 'NGN',
//           paymentType: 'PROPERTY_MARKING',
//           status: 'PENDING',
//           description: `Marking payment for property ${input.propertyId} - Type: ${markingType}`,
//         },
//       });

//       logger.info(
//         `Marking payment created - PaymentID: ${paymentRecord.id}, Amount: ${amount}`
//       );

//       return {
//         id: paymentRecord.id,
//         userId: paymentRecord.userId,
//         propertyId: paymentRecord.propertyId,
//         markingJobId: paymentRecord.markingJobId || '',
//         amount: paymentRecord.amount,
//         currency: paymentRecord.currency,
//         status: paymentRecord.status,
//         paymentType: paymentRecord.paymentType,
//         flutterwaveRef: paymentRecord.flutterwaveRef || undefined,
//         createdAt: paymentRecord.createdAt,
//         paidAt: paymentRecord.paidAt || undefined,
//       };
//     } catch (error) {
//       logger.error('Error creating marking payment:', error);
//       throw error;
//     }
//   }

//   /**
//    * Prepare Flutterwave payment payload for marking payment
//    * Constructs the necessary data for initiating payment with Flutterwave
//    */
//   async prepareFlutterwavePayload(payment: MarkingPaymentType) {
//     try {
//       // Get user details
//       const user = await prisma.user.findUnique({
//         where: { id: payment.userId },
//       });

//       if (!user || !user.email) {
//         throw new Error('User not found or missing email');
//       }

//       // If amount is 0 (owner self-marking), skip Flutterwave
//       if (payment.amount === 0) {
//         logger.info(
//           `No payment required for marking - PaymentID: ${payment.id}`
//         );
//         return {
//           requiresPayment: false,
//           message: 'No payment required for this marking type',
//         };
//       }

//       // Construct Flutterwave payload
//       const flutterwavePayload = {
//         public_key: process.env.FLUTTERWAVE_PUBLIC_KEY,
//         tx_ref: `MARKING_${payment.id}_${Date.now()}`,
//         amount: payment.amount,
//         currency: payment.currency,
//         payment_options: 'card,bank_transfer,ussd,qr',
//         customer: {
//           email: user.email,
//           phone_number: user.phone || '',
//           name: user.name || 'Newcondo User',
//         },
//         customizations: {
//           title: 'Property Marking Payment',
//           description: `Marking fee for property: ${payment.propertyId}`,
//           logo: process.env.PLATFORM_LOGO_URL,
//         },
//         meta: {
//           paymentId: payment.id,
//           markingJobId: payment.markingJobId,
//           propertyId: payment.propertyId,
//           userId: payment.userId,
//         },
//       };

//       logger.info(
//         `Flutterwave payload prepared - PaymentID: ${payment.id}`
//       );

//       return {
//         requiresPayment: true,
//         payload: flutterwavePayload,
//       };
//     } catch (error) {
//       logger.error('Error preparing Flutterwave payload:', error);
//       throw error;
//     }
//   }

//   /**
//    * Verify Flutterwave webhook signature
//    * Ensures webhook originates from Flutterwave and hasn't been tampered with
//    */
//   async verifyWebhookSignature(req: Request): Promise<boolean> {
//     try {
//       const signature = req.headers['verificationhash'] as string;

//       if (!signature) {
//         logger.warn('Webhook signature missing');
//         return false;
//       }

//       // Reconstruct the hash using Flutterwave secret
//       const hash = crypto
//         .createHmac('sha256', this.flutterwaveSecretKey)
//         .update(JSON.stringify(req.body))
//         .digest('hex');

//       const isValid = hash === signature;

//       if (!isValid) {
//         logger.warn('Webhook signature verification failed');
//       }

//       return isValid;
//     } catch (error) {
//       logger.error('Error verifying webhook signature:', error);
//       return false;
//     }
//   }

//   /**
//    * Get payment record by Flutterwave reference
//    * Used to match webhook callbacks to payment records
//    */
//   async getPaymentByFlutterwaveRef(flutterwaveRef: string) {
//     try {
//       const payment = await prisma.payment.findUnique({
//         where: { flutterwaveRef },
//       });

//       return payment;
//     } catch (error) {
//       logger.error('Error retrieving payment by Flutterwave ref:', error);
//       throw error;
//     }
//   }

//   /**
//    * Update payment status based on webhook data
//    * Handles successful, failed, and cancelled payments
//    */
//   async updatePaymentStatus(
//     paymentId: string,
//     flutterwaveStatus: string,
//     webhookData: PaymentWebhookData
//   ) {
//     try {
//       let paymentStatus = 'FAILED';

//       if (
//         flutterwaveStatus === 'successful' ||
//         flutterwaveStatus === 'completed'
//       ) {
//         paymentStatus = 'SUCCESS';
//       } else if (
//         flutterwaveStatus === 'failed' ||
//         flutterwaveStatus === 'declined'
//       ) {
//         paymentStatus = 'FAILED';
//       } else if (flutterwaveStatus === 'cancelled') {
//         paymentStatus = 'CANCELLED';
//       }

//       const updatedPayment = await prisma.payment.update({
//         where: { id: paymentId },
//         data: {
//           status: paymentStatus,
//           flutterwaveRef: webhookData.id,
//           transactionId: webhookData.transaction_id,
//           paidAt: paymentStatus === 'SUCCESS' ? new Date() : null,
//           failureReason:
//             paymentStatus === 'FAILED' ? webhookData.status : null,
//         },
//       });

//       logger.info(
//         `Payment status updated - PaymentID: ${paymentId}, Status: ${paymentStatus}`
//       );

//       return updatedPayment;
//     } catch (error) {
//       logger.error('Error updating payment status:', error);
//       throw error;
//     }
//   }

//   /**
//    * Get payment record by ID
//    */
//   async getPaymentById(paymentId: string) {
//     try {
//       const payment = await prisma.payment.findUnique({
//         where: { id: paymentId },
//       });

//       return payment;
//     } catch (error) {
//       logger.error('Error retrieving payment by ID:', error);
//       throw error;
//     }
//   }

//   /**
//    * Refund marking payment
//    * Updates payment status to REFUNDED and stores refund reason
//    */
//   async refundMarkingPayment(paymentId: string, reason: string) {
//     try {
//       logger.info(`Refunding marking payment - PaymentID: ${paymentId}`);

//       const payment = await prisma.payment.findUnique({
//         where: { id: paymentId },
//       });

//       if (!payment) {
//         throw new Error(`Payment not found: ${paymentId}`);
//       }

//       // Only allow refund if payment hasn't been released yet
//       if (payment.status === 'RELEASED') {
//         throw new Error(
//           'Cannot refund released payment - contact support'
//         );
//       }

//       const refundedPayment = await prisma.payment.update({
//         where: { id: paymentId },
//         data: {
//           status: 'REFUNDED',
//           failureReason: reason,
//           updatedAt: new Date(),
//         },
//       });

//       logger.info(
//         `Payment refunded successfully - PaymentID: ${paymentId}, Reason: ${reason}`
//       );

//       return refundedPayment;
//     } catch (error) {
//       logger.error('Error refunding marking payment:', error);
//       throw error;
//     }
//   }

//   /**
//    * Get marking payment history for a user
//    * Retrieves paginated list of marking payments with optional status filter
//    */
//   async getPaymentHistory(
//     userId: string,
//     page: number = 1,
//     limit: number = 10,
//     status?: string
//   ) {
//     try {
//       const skip = (page - 1) * limit;

//       const where: any = {
//         userId,
//         paymentType: 'PROPERTY_MARKING',
//       };

//       if (status) {
//         where.status = status;
//       }

//       const [payments, total] = await Promise.all([
//         prisma.payment.findMany({
//           where,
//           skip,
//           take: limit,
//           orderBy: { createdAt: 'desc' },
//           include: {
//             rental: true,
//           },
//         }),
//         prisma.payment.count({ where }),
//       ]);

//       const totalPages = Math.ceil(total / limit);

//       logger.info(
//         `Retrieved marking payment history - UserID: ${userId}, Total: ${total}`
//       );

//       return {
//         payments: payments.map(p => ({
//           id: p.id,
//           amount: p.amount,
//           status: p.status,
//           paymentType: p.paymentType,
//           markingJobId: p.markingJobId,
//           propertyId: p.propertyId,
//           createdAt: p.createdAt,
//           paidAt: p.paidAt,
//           failureReason: p.failureReason,
//         })),
//         pagination: {
//           page,
//           limit,
//           total,
//           totalPages,
//         },
//       };
//     } catch (error) {
//       logger.error('Error retrieving marking payment history:', error);
//       throw error;
//     }
//   }

//   /**
//    * Calculate commission split for marking payment
//    * Returns breakdown of platform fee vs agent commission
//    */
//   calculateCommissionSplit(totalAmount: number) {
//     const agentCommission = totalAmount * this.agentCommissionPercentage; // 25%
//     const platformFee = totalAmount * this.platformFeePercentage; // 75%

//     return {
//       totalAmount,
//       agentCommission,
//       platformFee,
//       breakdown: {
//         agent: `${this.agentCommissionPercentage * 100}% (${agentCommission} NGN)`,
//         platform: `${this.platformFeePercentage * 100}% (${platformFee} NGN)`,
//       },
//     };
//   }

//   /**
//    * Get payment stats for a user (for dashboard)
//    */
//   async getUserPaymentStats(userId: string) {
//     try {
//       const stats = await prisma.payment.groupBy({
//         by: ['status'],
//         where: {
//           userId,
//           paymentType: 'PROPERTY_MARKING',
//         },
//         _sum: {
//           amount: true,
//         },
//         _count: true,
//       });

//       logger.info(`Retrieved payment stats - UserID: ${userId}`);

//       return stats;
//     } catch (error) {
//       logger.error('Error retrieving payment stats:', error);
//       throw error;
//     }
//   }
// }

// export const markingPaymentService = new MarkingPaymentService();