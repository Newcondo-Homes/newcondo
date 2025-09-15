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