import { PrismaClient, Payment, PaymentStatus, PaymentType } from '@newcondo/db';
import { flutterwaveService } from './flutterwaveService';
import { rentalService } from './rentalService';
import { lockingService } from './lockingService';
import { receiptService } from './receiptService';
import { refundService } from './refundService';
import { confirmationService } from './confirmationService';

export class PaymentService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async createPayment(paymentData: {
    userId: string;
    rentalId?: string;
    markingJobId?: string;
    amount: number;
    paymentType: PaymentType;
    description?: string;
    currency?: string;
  }): Promise<Payment> {
    try {
      // Create payment record
      const payment = await this.prisma.payment.create({
        data: {
          userId: paymentData.userId,
          rentalId: paymentData.rentalId,
          markingJobId: paymentData.markingJobId,
          amount: paymentData.amount,
          currency: paymentData.currency || 'NGN',
          paymentType: paymentData.paymentType,
          description: paymentData.description,
          status: PaymentStatus.PENDING,
        },
      });

      return payment;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw new Error('Failed to create payment');
    }
  }

  async initiatePayment(paymentId: string, paymentMethod: string = 'card'): Promise<{
    paymentLink?: string;
    paymentReference: string;
    status: string;
  }> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          user: true,
          rental: {
            include: {
              property: true,
            },
          },
        },
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== PaymentStatus.PENDING) {
        throw new Error('Payment is not in pending status');
      }

      // Lock property if it's a rental payment
      if (payment.rentalId && payment.rental) {
        await lockingService.lockProperty(payment.rental.propertyId, payment.userId);
      }

      // Generate Flutterwave payment link
      const flutterwaveResponse = await flutterwaveService.initializePayment({
        tx_ref: `newcondo_${payment.id}_${Date.now()}`,
        amount: payment.amount.toNumber(),
        currency: payment.currency,
        redirect_url: `${process.env.FRONTEND_URL}/payments/success`,
        customer: {
          email: payment.user.email,
          phonenumber: payment.user.phone,
          name: payment.user.name || 'Customer',
        },
        customizations: {
          title: 'NewCondo Payment',
          description: payment.description || `Payment for ${payment.paymentType}`,
          logo: `${process.env.FRONTEND_URL}/images/logos/newcondo-logo.png`,
        },
        meta: {
          payment_id: payment.id,
          user_id: payment.userId,
          rental_id: payment.rentalId,
          marking_job_id: payment.markingJobId,
        },
      });

      // Update payment with Flutterwave reference
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          flutterwaveRef: flutterwaveResponse.tx_ref,
          paymentMethod,
        },
      });

      return {
        paymentLink: flutterwaveResponse.link,
        paymentReference: flutterwaveResponse.tx_ref,
        status: 'initialized',
      };
    } catch (error) {
      console.error('Error initiating payment:', error);
      
      // Release property lock if payment initiation fails
      try {
        const payment = await this.prisma.payment.findUnique({
          where: { id: paymentId },
          include: { rental: true },
        });
        
        if (payment?.rentalId && payment.rental) {
          await lockingService.unlockProperty(payment.rental.propertyId);
        }
      } catch (unlockError) {
        console.error('Error releasing property lock:', unlockError);
      }

      throw new Error(`Failed to initiate payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async handleWebhook(webhookData: any): Promise<void> {
    try {
      const { txRef, status, flw_ref, transaction_id, amount } = webhookData;

      // Find payment by Flutterwave reference
      const payment = await this.prisma.payment.findFirst({
        where: { flutterwaveRef: txRef },
        include: {
          rental: {
            include: {
              property: true,
            },
          },
          user: true,
        },
      });

      if (!payment) {
        console.error('Payment not found for webhook:', txRef);
        return;
      }

      // Verify transaction with Flutterwave
      const verificationResult = await flutterwaveService.verifyTransaction(transaction_id);
      
      if (!verificationResult.success) {
        console.error('Transaction verification failed:', verificationResult);
        return;
      }

      // Update payment status
      const updatedPayment = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: status === 'successful' ? PaymentStatus.SUCCESS : PaymentStatus.FAILED,
          transactionId: transaction_id,
          paidAt: status === 'successful' ? new Date() : null,
          failureReason: status !== 'successful' ? webhookData.failure_reason : null,
        },
      });

      if (status === 'successful') {
        await this.handleSuccessfulPayment(updatedPayment);
      } else {
        await this.handleFailedPayment(updatedPayment);
      }
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw error;
    }
  }

  private async handleSuccessfulPayment(payment: Payment): Promise<void> {
    try {
      // Process rental payment
      if (payment.rentalId && payment.paymentType === PaymentType.RENT) {
        await rentalService.processSuccessfulRentPayment(payment.id);
      }

      // Process marking job payment
      if (payment.markingJobId && payment.paymentType === PaymentType.PROPERTY_MARKING) {
        // Update marking job payment status
        await this.prisma.propertyMarkingJob.update({
          where: { id: payment.markingJobId },
          data: { paymentStatus: PaymentStatus.SUCCESS },
        });
      }

      // Start confirmation period for rental payments
      if (payment.paymentType === PaymentType.RENT) {
        await confirmationService.startConfirmationPeriod(payment.id);
      }

      // Generate receipt
      await receiptService.generateReceipt(payment.id);

      console.log(`Payment ${payment.id} processed successfully`);
    } catch (error) {
      console.error('Error handling successful payment:', error);
      throw error;
    }
  }

  private async handleFailedPayment(payment: Payment): Promise<void> {
    try {
      // Release property lock for failed rental payments
      if (payment.rentalId) {
        const rental = await this.prisma.rental.findUnique({
          where: { id: payment.rentalId },
        });
        
        if (rental) {
          await lockingService.unlockProperty(rental.propertyId);
        }
      }

      console.log(`Payment ${payment.id} failed`);
    } catch (error) {
      console.error('Error handling failed payment:', error);
      throw error;
    }
  }

  async getPaymentHistory(userId: string, filters?: {
    paymentType?: PaymentType;
    status?: PaymentStatus;
    limit?: number;
    offset?: number;
  }): Promise<{
    payments: Payment[];
    total: number;
  }> {
    try {
      const whereClause: any = { userId };

      if (filters?.paymentType) {
        whereClause.paymentType = filters.paymentType;
      }

      if (filters?.status) {
        whereClause.status = filters.status;
      }

      const [payments, total] = await Promise.all([
        this.prisma.payment.findMany({
          where: whereClause,
          include: {
            rental: {
              include: {
                property: {
                  select: {
                    id: true,
                    title: true,
                    address: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: filters?.limit || 20,
          skip: filters?.offset || 0,
        }),
        this.prisma.payment.count({ where: whereClause }),
      ]);

      return { payments, total };
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw new Error('Failed to fetch payment history');
    }
  }

  async getPaymentById(paymentId: string): Promise<Payment | null> {
    try {
      return await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          rental: {
            include: {
              property: {
                select: {
                  id: true,
                  title: true,
                  address: true,
                  city: true,
                  state: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      console.error('Error fetching payment:', error);
      throw new Error('Failed to fetch payment');
    }
  }

  async retryPayment(paymentId: string): Promise<{
    paymentLink?: string;
    paymentReference: string;
    status: string;
  }> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== PaymentStatus.FAILED) {
        throw new Error('Only failed payments can be retried');
      }

      // Update payment status to pending
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.PENDING,
          failureReason: null,
        },
      });

      // Re-initiate payment
      return await this.initiatePayment(paymentId, payment.paymentMethod || 'card');
    } catch (error) {
      console.error('Error retrying payment:', error);
      throw new Error('Failed to retry payment');
    }
  }

  async cancelPayment(paymentId: string, reason?: string): Promise<void> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: { rental: true },
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== PaymentStatus.PENDING) {
        throw new Error('Only pending payments can be cancelled');
      }

      // Update payment status
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.CANCELLED,
          failureReason: reason,
        },
      });

      // Release property lock if rental payment
      if (payment.rentalId && payment.rental) {
        await lockingService.unlockProperty(payment.rental.propertyId);
      }
    } catch (error) {
      console.error('Error cancelling payment:', error);
      throw new Error('Failed to cancel payment');
    }
  }

  async calculateCommissionSplit(amount: number, paymentType: PaymentType): Promise<{
    agentCommission: number;
    platformFee: number;
    ownerAmount: number;
  }> {
    const platformFeeRate = 0.05; // 5% platform fee
    const agentCommissionRate = paymentType === PaymentType.RENT ? 0.10 : 0; // 10% for rental, 0% for others

    const platformFee = amount * platformFeeRate;
    const agentCommission = amount * agentCommissionRate;
    const ownerAmount = amount - platformFee - agentCommission;

    return {
      agentCommission,
      platformFee,
      ownerAmount,
    };
  }
}

export const paymentService = new PaymentService();

// backend/payment-service/src/services/paymentService.ts
// import { PrismaClient, Payment, PaymentStatus, PaymentType, Rental } from '@newcondo/db';
// import { FlutterwaveService } from './flutterwaveService';
// import { RentalService } from './rentalService';
// import { VirtualAccountService } from './virtualAccountService';
// import { ConfirmationService } from './confirmationService';
// import { LockingService } from './lockingService';
// import { ReceiptService } from './receiptService';
// import { logger } from '../../../shared/src/utils/logger';
// import { ApiError } from '../../../shared/src/utils/response';

// export interface PaymentRequest {
//   userId: string;
//   amount: number;
//   paymentType: PaymentType;
//   description?: string;
//   propertyId?: string;
//   unitId?: string;
//   markingJobId?: string;
//   redirectUrl: string;
//   metadata?: Record<string, any>;
// }

// export interface PaymentResponse {
//   paymentId: string;
//   paymentLink: string;
//   transactionId: string;
//   status: PaymentStatus;
//   amount: number;
//   currency: string;
// }

// export interface PaymentVerification {
//   transactionId: string;
//   status: PaymentStatus;
//   amount: number;
//   currency: string;
//   paidAt?: Date;
//   failureReason?: string;
//   metadata?: Record<string, any>;
// }

// export class PaymentService {
//   private db: PrismaClient;
//   private flutterwaveService: FlutterwaveService;
//   private rentalService: RentalService;
//   private virtualAccountService: VirtualAccountService;
//   private confirmationService: ConfirmationService;
//   private lockingService: LockingService;
//   private receiptService: ReceiptService;

//   constructor() {
//     this.db = new PrismaClient();
//     this.flutterwaveService = new FlutterwaveService();
//     this.rentalService = new RentalService();
//     this.virtualAccountService = new VirtualAccountService();
//     this.confirmationService = new ConfirmationService();
//     this.lockingService = new LockingService();
//     this.receiptService = new ReceiptService();
//   }

//   async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
//     try {
//       logger.info('Initiating payment', { 
//         userId: request.userId, 
//         amount: request.amount, 
//         type: request.paymentType 
//       });

//       // Validate payment request
//       await this.validatePaymentRequest(request);

//       // Apply property lock if it's a rental payment
//       if (request.paymentType === PaymentType.RENT && request.propertyId) {
//         await this.lockingService.lockProperty(request.propertyId, request.userId, request.unitId);
//       }

//       // Create payment record
//       const payment = await this.createPaymentRecord(request);

//       // Initialize Flutterwave payment
//       const flutterwavePayment = await this.flutterwaveService.initializePayment({
//         amount: request.amount,
//         currency: 'NGN',
//         email: await this.getUserEmail(request.userId),
//         txRef: payment.id,
//         redirectUrl: request.redirectUrl,
//         customerId: request.userId,
//         customerName: await this.getUserName(request.userId),
//         paymentType: request.paymentType,
//         metadata: {
//           paymentId: payment.id,
//           propertyId: request.propertyId,
//           unitId: request.unitId,
//           markingJobId: request.markingJobId,
//           ...request.metadata
//         }
//       });

//       // Update payment with Flutterwave reference
//       await this.updatePaymentWithFlutterwaveRef(payment.id, flutterwavePayment.data.link, flutterwavePayment.data.id);

//       return {
//         paymentId: payment.id,
//         paymentLink: flutterwavePayment.data.link,
//         transactionId: flutterwavePayment.data.id,
//         status: PaymentStatus.PENDING,
//         amount: request.amount,
//         currency: 'NGN'
//       };
//     } catch (error) {
//       logger.error('Failed to initiate payment', { error, request });
      
//       // Release property lock if payment initiation fails
//       if (request.paymentType === PaymentType.RENT && request.propertyId) {
//         await this.lockingService.releasePropertyLock(request.propertyId, request.unitId);
//       }
      
//       throw error;
//     }
//   }

//   async verifyPayment(transactionId: string): Promise<PaymentVerification> {
//     try {
//       logger.info('Verifying payment', { transactionId });

//       // Verify with Flutterwave
//       const verification = await this.flutterwaveService.verifyTransaction(transactionId);
      
//       // Find payment record
//       const payment = await this.db.payment.findFirst({
//         where: {
//           OR: [
//             { transactionId },
//             { flutterwaveRef: transactionId }
//           ]
//         },
//         include: {
//           user: true,
//           rental: {
//             include: {
//               property: true,
//               unit: true
//             }
//           }
//         }
//       });

//       if (!payment) {
//         throw new ApiError(404, 'Payment record not found');
//       }

//       // Update payment status
//       const updatedPayment = await this.updatePaymentStatus(payment.id, {
//         status: verification.status,
//         paidAt: verification.paidAt,
//         failureReason: verification.failureReason,
//         transactionId: verification.transactionId
//       });

//       // Handle successful payment
//       if (verification.status === PaymentStatus.SUCCESS) {
//         await this.handleSuccessfulPayment(updatedPayment);
//       }

//       // Handle failed payment
//       if (verification.status === PaymentStatus.FAILED) {
//         await this.handleFailedPayment(updatedPayment);
//       }

//       return verification;
//     } catch (error) {
//       logger.error('Failed to verify payment', { error, transactionId });
//       throw error;
//     }
//   }

//   async retryPayment(paymentId: string): Promise<PaymentResponse> {
//     try {
//       logger.info('Retrying payment', { paymentId });

//       const payment = await this.db.payment.findUnique({
//         where: { id: paymentId },
//         include: { user: true }
//       });

//       if (!payment) {
//         throw new ApiError(404, 'Payment not found');
//       }

//       if (payment.status === PaymentStatus.SUCCESS) {
//         throw new ApiError(400, 'Payment already successful');
//       }

//       // Create new payment request from existing payment
//       const retryRequest: PaymentRequest = {
//         userId: payment.userId,
//         amount: Number(payment.amount),
//         paymentType: payment.paymentType,
//         description: payment.description || undefined,
//         propertyId: payment.rental?.propertyId,
//         unitId: payment.rental?.unitId,
//         markingJobId: payment.markingJobId || undefined,
//         redirectUrl: process.env.FRONTEND_URL + '/payments/success',
//         metadata: { isRetry: true, originalPaymentId: paymentId }
//       };

//       return await this.initiatePayment(retryRequest);
//     } catch (error) {
//       logger.error('Failed to retry payment', { error, paymentId });
//       throw error;
//     }
//   }

//   async refundPayment(paymentId: string, reason: string, adminId: string): Promise<void> {
//     try {
//       logger.info('Processing refund', { paymentId, reason, adminId });

//       const payment = await this.db.payment.findUnique({
//         where: { id: paymentId },
//         include: { 
//           user: true,
//           rental: {
//             include: {
//               property: true,
//               unit: true
//             }
//           }
//         }
//       });

//       if (!payment) {
//         throw new ApiError(404, 'Payment not found');
//       }

//       if (payment.status !== PaymentStatus.SUCCESS) {
//         throw new ApiError(400, 'Can only refund successful payments');
//       }

//       // Process refund with Flutterwave
//       if (payment.flutterwaveRef) {
//         await this.flutterwaveService.processRefund(payment.flutterwaveRef, Number(payment.amount));
//       }

//       // Update payment status
//       await this.db.payment.update({
//         where: { id: paymentId },
//         data: {
//           status: PaymentStatus.REFUNDED,
//           description: `${payment.description} - REFUNDED: ${reason}`
//         }
//       });

//       // Handle rental refund
//       if (payment.paymentType === PaymentType.RENT && payment.rental) {
//         await this.rentalService.handleRentalRefund(payment.rental.id);
//       }

//       // Release property lock
//       if (payment.rental?.propertyId) {
//         await this.lockingService.releasePropertyLock(
//           payment.rental.propertyId, 
//           payment.rental.unitId || undefined
//         );
//       }

//       logger.info('Refund processed successfully', { paymentId, adminId });
//     } catch (error) {
//       logger.error('Failed to process refund', { error, paymentId });
//       throw error;
//     }
//   }

//   async getUserPayments(userId: string, page: number = 1, limit: number = 20) {
//     try {
//       const skip = (page - 1) * limit;

//       const [payments, total] = await Promise.all([
//         this.db.payment.findMany({
//           where: { userId },
//           include: {
//             rental: {
//               include: {
//                 property: {
//                   select: {
//                     id: true,
//                     title: true,
//                     address: true
//                   }
//                 },
//                 unit: {
//                   select: {
//                     id: true,
//                     unitNumber: true
//                   }
//                 }
//               }
//             }
//           },
//           orderBy: { createdAt: 'desc' },
//           skip,
//           take: limit
//         }),
//         this.db.payment.count({ where: { userId } })
//       ]);

//       return {
//         payments,
//         pagination: {
//           total,
//           pages: Math.ceil(total / limit),
//           currentPage: page,
//           limit
//         }
//       };
//     } catch (error) {
//       logger.error('Failed to get user payments', { error, userId });
//       throw error;
//     }
//   }

//   async getPaymentReceipt(paymentId: string, userId: string): Promise<Buffer> {
//     try {
//       const payment = await this.db.payment.findFirst({
//         where: { 
//           id: paymentId,
//           userId 
//         },
//         include: {
//           user: true,
//           rental: {
//             include: {
//               property: true,
//               unit: true
//             }
//           }
//         }
//       });

//       if (!payment) {
//         throw new ApiError(404, 'Payment not found');
//       }

//       if (payment.status !== PaymentStatus.SUCCESS) {
//         throw new ApiError(400, 'Receipt only available for successful payments');
//       }

//       return await this.receiptService.generateReceipt(payment);
//     } catch (error) {
//       logger.error('Failed to get payment receipt', { error, paymentId });
//       throw error;
//     }
//   }

//   private async validatePaymentRequest(request: PaymentRequest): Promise<void> {
//     if (request.amount <= 0) {
//       throw new ApiError(400, 'Payment amount must be greater than 0');
//     }

//     // Validate user exists
//     const user = await this.db.user.findUnique({
//       where: { id: request.userId }
//     });

//     if (!user) {
//       throw new ApiError(404, 'User not found');
//     }

//     // Additional validations based on payment type
//     if (request.paymentType === PaymentType.RENT) {
//       if (!request.propertyId) {
//         throw new ApiError(400, 'Property ID required for rent payments');
//       }

//       const property = await this.db.property.findUnique({
//         where: { id: request.propertyId }
//       });

//       if (!property) {
//         throw new ApiError(404, 'Property not found');
//       }

//       if (!property.isAvailable) {
//         throw new ApiError(400, 'Property is not available for rent');
//       }
//     }
//   }

//   private async createPaymentRecord(request: PaymentRequest): Promise<Payment> {
//     return await this.db.payment.create({
//       data: {
//         userId: request.userId,
//         amount: request.amount,
//         currency: 'NGN',
//         paymentType: request.paymentType,
//         status: PaymentStatus.PENDING,
//         description: request.description,
//         markingJobId: request.markingJobId
//       }
//     });
//   }

//   private async updatePaymentWithFlutterwaveRef(
//     paymentId: string, 
//     paymentLink: string, 
//     flutterwaveRef: string
//   ): Promise<void> {
//     await this.db.payment.update({
//       where: { id: paymentId },
//       data: {
//         flutterwaveRef,
//         // Store payment link in metadata if needed
//       }
//     });
//   }

//   private async updatePaymentStatus(
//     paymentId: string, 
//     update: {
//       status: PaymentStatus;
//       paidAt?: Date;
//       failureReason?: string;
//       transactionId?: string;
//     }
//   ): Promise<Payment> {
//     return await this.db.payment.update({
//       where: { id: paymentId },
//       data: {
//         status: update.status,
//         paidAt: update.paidAt,
//         failureReason: update.failureReason,
//         transactionId: update.transactionId || undefined
//       },
//       include: {
//         user: true,
//         rental: {
//           include: {
//             property: true,
//             unit: true
//           }
//         }
//       }
//     });
//   }

//   private async handleSuccessfulPayment(payment: Payment): Promise<void> {
//     try {
//       // Handle rental payments
//       if (payment.paymentType === PaymentType.RENT) {
//         await this.rentalService.processRentalPayment(payment.id);
//         // Start confirmation period
//         await this.confirmationService.startConfirmationPeriod(payment.id);
//       }

//       // Handle property marking payments
//       if (payment.paymentType === PaymentType.PROPERTY_MARKING) {
//         // Update marking job status or trigger assignment
//         // This would be handled by the marking service
//       }

//       // Generate receipt
//       await this.receiptService.generateAndStoreReceipt(payment);

//       logger.info('Successfully handled payment', { paymentId: payment.id });
//     } catch (error) {
//       logger.error('Failed to handle successful payment', { error, paymentId: payment.id });
//       // Don't throw here to avoid reverting the payment status
//     }
//   }

//   private async handleFailedPayment(payment: Payment): Promise<void> {
//     try {
//       // Release property lock for rental payments
//       if (payment.paymentType === PaymentType.RENT && payment.rental?.propertyId) {
//         await this.lockingService.releasePropertyLock(
//           payment.rental.propertyId,
//           payment.rental.unitId || undefined
//         );
//       }

//       logger.info('Handled failed payment', { paymentId: payment.id });
//     } catch (error) {
//       logger.error('Failed to handle failed payment', { error, paymentId: payment.id });
//     }
//   }

//   private async getUserEmail(userId: string): Promise<string> {
//     const user = await this.db.user.findUnique({
//       where: { id: userId },
//       select: { email: true }
//     });
    
//     if (!user?.email) {
//       throw new ApiError(404, 'User email not found');
//     }
    
//     return user.email;
//   }

//   private async getUserName(userId: string): Promise<string> {
//     const user = await this.db.user.findUnique({
//       where: { id: userId },
//       select: { name: true, email: true }
//     });
    
//     return user?.name || user?.email?.split('@')[0] || 'User';
//   }
// }













// // backend/payment-service/src/services/paymentService.ts

// import { PrismaClient, PaymentType, PaymentStatus } from '@prisma/client';
// import { flutterwaveService } from './flutterwaveService';
// import { getTranslation } from '../utils/i18n';
// import { convertCurrency } from '../utils/currencyConverter';

// const prisma = new PrismaClient();

// interface InitiatePaymentParams {
//   userId: string;
//   rentalId?: string;
//   markingJobId?: string;
//   amount: number;
//   currency: string;
//   paymentType: PaymentType;
//   locale: string;
// }

// interface ConfirmPaymentParams {
//   paymentId: string;
//   userId: string;
//   confirmed: boolean;
//   locale: string;
// }

// export class PaymentService {
//   /**
//    * Initiate a new payment
//    */
//   async initiatePayment(params: InitiatePaymentParams) {
//     const { userId, rentalId, markingJobId, amount, currency, paymentType, locale } = params;

//     // Validate payment amount
//     if (amount <= 0) {
//       throw new Error(getTranslation('payment.invalid_amount', locale));
//     }

//     // Check if rental/marking job exists and is valid
//     if (rentalId) {
//       const rental = await prisma.rental.findUnique({
//         where: { id: rentalId },
//         include: { property: true, unit: true }
//       });

//       if (!rental) {
//         throw new Error(getTranslation('payment.rental_not_found', locale));
//       }

//       // Check if property is locked by another payment
//       if (rental.property.isPaymentLocked) {
//         throw new Error(getTranslation('payment.property_locked', locale));
//       }
//     }

//     if (markingJobId) {
//       const markingJob = await prisma.propertyMarkingJob.findUnique({
//         where: { id: markingJobId }
//       });

//       if (!markingJob) {
//         throw new Error(getTranslation('payment.marking_job_not_found', locale));
//       }

//       if (markingJob.paymentStatus === 'SUCCESS') {
//         throw new Error(getTranslation('payment.already_paid', locale));
//       }
//     }

//     // Calculate fees
//     const platformFeePercentage = 0.015; // 1.5% platform fee
//     const flutterwaveFee = this.calculateFlutterwaveFee(amount);
//     const platformFee = amount * platformFeePercentage;
//     const totalAmount = amount + flutterwaveFee + platformFee;

//     // Create payment record
//     const payment = await prisma.payment.create({
//       data: {
//         userId,
//         rentalId,
//         markingJobId,
//         amount: totalAmount,
//         currency,
//         paymentType,
//         status: PaymentStatus.PENDING,
//         platformFee,
//         description: this.generatePaymentDescription(paymentType, locale)
//       }
//     });

//     // Lock property if it's a rental payment
//     if (rentalId) {
//       const rental = await prisma.rental.findUnique({
//         where: { id: rentalId }
//       });

//       if (rental?.propertyId) {
//         await prisma.property.update({
//           where: { id: rental.propertyId },
//           data: {
//             isPaymentLocked: true,
//             paymentLockExpiry: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
//           }
//         });
//       }

//       if (rental?.unitId) {
//         await prisma.propertyUnit.update({
//           where: { id: rental.unitId },
//           data: {
//             isPaymentLocked: true,
//             paymentLockExpiry: new Date(Date.now() + 15 * 60 * 1000)
//           }
//         });
//       }
//     }

//     // Initiate payment with Flutterwave
//     const paymentLink = await flutterwaveService.initiatePayment({
//       amount: totalAmount,
//       currency,
//       email: (await prisma.user.findUnique({ where: { id: userId } }))!.email,
//       paymentId: payment.id,
//       locale
//     });

//     await prisma.payment.update({
//       where: { id: payment.id },
//       data: {
//         flutterwaveRef: paymentLink.reference,
//         transactionId: paymentLink.transactionId
//       }
//     });

//     return {
//       ...payment,
//       paymentLink: paymentLink.link
//     };
//   }

//   /**
//    * Verify payment after Flutterwave callback
//    */
//   async verifyPayment(transactionId: string, locale: string) {
//     const payment = await prisma.payment.findUnique({
//       where: { transactionId },
//       include: { rental: { include: { property: true, unit: true } } }
//     });

//     if (!payment) {
//       throw new Error(getTranslation('payment.not_found', locale));
//     }

//     // Verify with Flutterwave
//     const verification = await flutterwaveService.verifyPayment(transactionId);

//     if (verification.status === 'successful') {
//       await this.handleSuccessfulPayment(payment, locale);
//     } else {
//       await this.handleFailedPayment(payment, verification.failureReason, locale);
//     }

//     return prisma.payment.findUnique({
//       where: { id: payment.id },
//       include: { rental: true }
//     });
//   }

//   /**
//    * Handle successful payment
//    */
//   private async handleSuccessfulPayment(payment: any, locale: string) {
//     const confirmationPeriodEnd = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

//     await prisma.payment.update({
//       where: { id: payment.id },
//       data: {
//         status: PaymentStatus.HELD,
//         paidAt: new Date(),
//         confirmationPeriodEnd
//       }
//     });

//     // Update rental status
//     if (payment.rentalId) {
//       await prisma.rental.update({
//         where: { id: payment.rentalId },
//         data: {
//           status: 'PENDING_CONFIRMATION',
//           confirmationDeadline: confirmationPeriodEnd
//         }
//       });

//       // Unlock and mark property as rented
//       if (payment.rental?.propertyId) {
//         await prisma.property.update({
//           where: { id: payment.rental.propertyId },
//           data: {
//             isPaymentLocked: false,
//             paymentLockExpiry: null,
//             isAvailable: false,
//             status: 'RENTED'
//           }
//         });
//       }

//       if (payment.rental?.unitId) {
//         await prisma.propertyUnit.update({
//           where: { id: payment.rental.unitId },
//           data: {
//             isPaymentLocked: false,
//             paymentLockExpiry: null,
//             isAvailable: false,
//             status: 'OCCUPIED'
//           }
//         });
//       }
//     }

//     // Update marking job status
//     if (payment.markingJobId) {
//       await prisma.propertyMarkingJob.update({
//         where: { id: payment.markingJobId },
//         data: {
//           paymentStatus: 'SUCCESS'
//         }
//       });
//     }

//     // TODO: Send confirmation notification
//   }

//   /**
//    * Handle failed payment
//    */
//   private async handleFailedPayment(payment: any, reason: string, locale: string) {
//     await prisma.payment.update({
//       where: { id: payment.id },
//       data: {
//         status: PaymentStatus.FAILED,
//         failureReason: reason
//       }
//     });

//     // Unlock property
//     if (payment.rentalId && payment.rental?.propertyId) {
//       await prisma.property.update({
//         where: { id: payment.rental.propertyId },
//         data: {
//           isPaymentLocked: false,
//           paymentLockExpiry: null
//         }
//       });
//     }

//     if (payment.rental?.unitId) {
//       await prisma.propertyUnit.update({
//         where: { id: payment.rental.unitId },
//         data: {
//           isPaymentLocked: false,
//           paymentLockExpiry: null
//         }
//       });
//     }
//   }

//   /**
//    * Confirm rental payment (renter confirms property is as expected)
//    */
//   async confirmRentalPayment(params: ConfirmPaymentParams) {
//     const { paymentId, userId, confirmed, locale } = params;

//     const payment = await prisma.payment.findUnique({
//       where: { id: paymentId },
//       include: { rental: { include: { property: true, unit: true } } }
//     });

//     if (!payment) {
//       throw new Error(getTranslation('payment.not_found', locale));
//     }

//     if (payment.userId !== userId) {
//       throw new Error(getTranslation('payment.unauthorized', locale));
//     }

//     if (payment.status !== PaymentStatus.HELD) {
//       throw new Error(getTranslation('payment.cannot_confirm', locale));
//     }

//     if (confirmed) {
//       // Release funds to virtual accounts
//       await this.releaseFunds(payment, locale);

//       await prisma.payment.update({
//         where: { id: paymentId },
//         data: {
//           status: PaymentStatus.RELEASED,
//           isReleased: true,
//           releasedAt: new Date()
//         }
//       });

//       await prisma.rental.update({
//         where: { id: payment.rentalId! },
//         data: {
//           status: 'ACTIVE',
//           isConfirmed: true,
//           confirmedAt: new Date()
//         }
//       });

//       return { confirmed: true, message: getTranslation('payment.funds_released', locale) };
//     } else {
//       // Initiate refund process
//       await this.requestRefund({
//         paymentId,
//         userId,
//         reason: 'Property not as described',
//         locale
//       });

//       return { confirmed: false, message: getTranslation('payment.refund_initiated', locale) };
//     }
//   }

//   /**
//    * Release funds to virtual accounts
//    */
//   private async releaseFunds(payment: any, locale: string) {
//     const rental = payment.rental;
//     const property = rental.property;

//     // Calculate commission split
//     const rentAmount = payment.amount - (payment.platformFee || 0);
//     const commissionPercentage = 0.20; // 20% commission
//     const totalCommission = rentAmount * commissionPercentage;
    
//     let agentCommission = 0;
//     let ownerAmount = rentAmount - totalCommission;

//     // If there's an agent, split the commission
//     if (property.agentId) {
//       agentCommission = totalCommission * 0.50; // Agent gets 50% of commission
//       const platformCommission = totalCommission - agentCommission;

//       // Credit agent's virtual account
//       await this.creditVirtualAccount(property.agentId, agentCommission, 'NGN');
//       // Credit platform virtual account
//       await this.creditPlatformAccount(platformCommission, 'NGN');
//     } else {
//       // No agent, platform gets full commission
//       await this.creditPlatformAccount(totalCommission, 'NGN');
//     }

//     // Credit owner's virtual account
//     await this.creditVirtualAccount(property.ownerId, ownerAmount, 'NGN');

//     // Update payment record with split details
//     await prisma.payment.update({
//       where: { id: payment.id },
//       data: {
//         agentCommission: agentCommission > 0 ? agentCommission : null,
//         platformFee: totalCommission - agentCommission,
//         ownerAmount
//       }
//     });
//   }

//   /**
//    * Credit user's virtual account
//    */
//   private async creditVirtualAccount(userId: string, amount: number, currency: string) {
//     await prisma.virtualAccount.updateMany({
//       where: { userId },
//       data: {
//         balance: { increment: amount }
//       }
//     });
//   }

//   /**
//    * Credit platform account
//    */
//   private async creditPlatformAccount(amount: number, currency: string) {
//     // TODO: Implement platform account crediting
//     console.log(`Platform credited: ${amount} ${currency}`);
//   }

//   /**
//    * Request refund
//    */
//   async requestRefund(params: { paymentId: string; userId: string; reason: string; locale: string }) {
//     const { paymentId, userId, reason, locale } = params;

//     const payment = await prisma.payment.findUnique({
//       where: { id: paymentId }
//     });

//     if (!payment) {
//       throw new Error(getTranslation('payment.not_found', locale));
//     }

//     if (payment.userId !== userId) {
//       throw new Error(getTranslation('payment.unauthorized', locale));
//     }

//     // Initiate refund with Flutterwave
//     const refund = await flutterwaveService.initiateRefund(payment.transactionId!, reason);

//     await prisma.payment.update({
//       where: { id: paymentId },
//       data: {
//         status: PaymentStatus.REFUNDED,
//         failureReason: reason
//       }
//     });

//     return refund;
//   }

//   /**
//    * Get payment history
//    */
//   async getPaymentHistory(params: {
//     userId: string;
//     page: number;
//     limit: number;
//     status?: string;
//     paymentType?: string;
//   }) {
//     const { userId, page, limit, status, paymentType } = params;
//     const skip = (page - 1) * limit;

//     const where: any = { userId };
//     if (status) where.status = status;
//     if (paymentType) where.paymentType = paymentType;

//     const [payments, total] = await Promise.all([
//       prisma.payment.findMany({
//         where,
//         skip,
//         take: limit,
//         orderBy: { createdAt: 'desc' },
//         include: { rental: { include: { property: true } } }
//       }),
//       prisma.payment.count({ where })
//     ]);

//     return {
//       payments,
//       pagination: {
//         page,
//         limit,
//         total,
//         totalPages: Math.ceil(total / limit)
//       }
//     };
//   }

//   /**
//    * Get payment statistics
//    */
//   async getPaymentStats(params: {
//     userId: string;
//     startDate?: Date;
//     endDate?: Date;
//   }) {
//     const { userId, startDate, endDate } = params;

//     const where: any = { userId };
//     if (startDate || endDate) {
//       where.createdAt = {};
//       if (startDate) where.createdAt.gte = startDate;
//       if (endDate) where.createdAt.lte = endDate;
//     }

//     const [totalEarnings, pendingPayments, releasedPayments, commissionEarned] = await Promise.all([
//       prisma.payment.aggregate({
//         where: { ...where, status: { in: ['SUCCESS', 'HELD', 'RELEASED'] } },
//         _sum: { amount: true }
//       }),
//       prisma.payment.aggregate({
//         where: { ...where, status: 'HELD' },
//         _sum: { amount: true }
//       }),
//       prisma.payment.aggregate({
//         where: { ...where, status: 'RELEASED' },
//         _sum: { amount: true }
//       }),
//       prisma.payment.aggregate({
//         where: { ...where, status: 'RELEASED' },
//         _sum: { agentCommission: true }
//       })
//     ]);

//     return {
//       totalEarnings: totalEarnings._sum.amount || 0,
//       pendingPayments: pendingPayments._sum.amount || 0,
//       releasedPayments: releasedPayments._sum.amount || 0,
//       commissionEarned: commissionEarned._sum.agentCommission || 0
//     };
//   }

//   /**
//    * Handle Flutterwave webhook
//    */
//   async handleWebhook(payload: any, signature: string) {
//     // Verify webhook signature
//     const isValid = flutterwaveService.verifyWebhookSignature(payload, signature);
//     if (!isValid) {
//       throw new Error('Invalid webhook signature');
//     }

//     const { event, data } = payload;

//     if (event === 'charge.completed') {
//       await this.verifyPayment(data.tx_ref, 'en');
//     }
//   }

//   /**
//    * Retry failed payment
//    */
//   async retryPayment(paymentId: string, userId: string, locale: string) {
//     const payment = await prisma.payment.findUnique({
//       where: { id: paymentId }
//     });

//     if (!payment) {
//       throw new Error(getTranslation('payment.not_found', locale));
//     }

//     if (payment.userId !== userId) {
//       throw new Error(getTranslation('payment.unauthorized', locale));
//     }

//     if (payment.status !== PaymentStatus.FAILED) {
//       throw new Error(getTranslation('payment.cannot_retry', locale));
//     }

//     // Create new payment with same details
//     return this.initiatePayment({
//       userId,
//       rentalId: payment.rentalId || undefined,
//       markingJobId: payment.markingJobId || undefined,
//       amount: Number(payment.amount),
//       currency: payment.currency,
//       paymentType: payment.paymentType,
//       locale
//     });
//   }

//   /**
//    * Calculate Flutterwave transaction fee
//    */
//   private calculateFlutterwaveFee(amount: number): number {
//     // Flutterwave charges 1.4% + NGN 100 for local cards
//     return (amount * 0.014) + 100;
//   }

//   /**
//    * Generate payment description
//    */
//   private generatePaymentDescription(paymentType: PaymentType, locale: string): string {
//     const descriptions: Record<PaymentType, string> = {
//       RENT: getTranslation('payment.type.rent', locale),
//       DEPOSIT: getTranslation('payment.type.deposit', locale),
//       AGENT_COMMISSION: getTranslation('payment.type.commission', locale),
//       PREMIUM_UPGRADE: getTranslation('payment.type.premium', locale),
//       PROPERTY_MARKING: getTranslation('payment.type.marking', locale)
//     };

//     return descriptions[paymentType] || paymentType;
//   }
// }

// export const paymentService = new PaymentService();