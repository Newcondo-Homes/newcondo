import { PrismaClient, PaymentStatus, Payment, User, Rental } from '@newcondo/db';
import { flutterwaveService } from './flutterwaveService';
import { notificationService } from '../../shared/src/utils/email';
import { logger } from '../../shared/src/middleware/logger';

interface RefundRequest {
  paymentId: string;
  reason: string;
  amount?: number; // Partial refund amount (optional)
  adminId: string;
  notes?: string;
}

interface RefundResult {
  success: boolean;
  refundId?: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  message: string;
  transactionId?: string;
}

interface RefundValidation {
  isValid: boolean;
  reason?: string;
  refundableAmount?: number;
}

export class RefundService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Process a refund for a payment
   */
  async processRefund(request: RefundRequest): Promise<RefundResult> {
    try {
      // Validate refund request
      const validation = await this.validateRefund(request);
      if (!validation.isValid) {
        return {
          success: false,
          amount: 0,
          status: 'FAILED',
          message: validation.reason || 'Invalid refund request'
        };
      }

      // Get payment details
      const payment = await this.prisma.payment.findUnique({
        where: { id: request.paymentId },
        include: {
          user: true,
          rental: {
            include: {
              property: true
            }
          }
        }
      });

      if (!payment) {
        return {
          success: false,
          amount: 0,
          status: 'FAILED',
          message: 'Payment not found'
        };
      }

      // Calculate refund amount
      const refundAmount = request.amount || payment.amount.toNumber();
      
      // Validate refund amount
      if (refundAmount > validation.refundableAmount!) {
        return {
          success: false,
          amount: 0,
          status: 'FAILED',
          message: 'Refund amount exceeds refundable amount'
        };
      }

      // Process refund through Flutterwave
      const flutterwaveResult = await flutterwaveService.processRefund({
        transactionId: payment.transactionId!,
        amount: refundAmount,
        reason: request.reason
      });

      if (!flutterwaveResult.success) {
        return {
          success: false,
          amount: refundAmount,
          status: 'FAILED',
          message: flutterwaveResult.message || 'Flutterwave refund failed'
        };
      }

      // Update payment status
      const updatedPayment = await this.prisma.payment.update({
        where: { id: request.paymentId },
        data: {
          status: PaymentStatus.REFUNDED,
          failureReason: request.reason,
          updatedAt: new Date()
        }
      });

      // Create refund record
      const refundRecord = await this.createRefundRecord({
        originalPaymentId: payment.id,
        refundAmount,
        reason: request.reason,
        adminId: request.adminId,
        notes: request.notes,
        flutterwaveRefundId: flutterwaveResult.refundId!,
        status: 'COMPLETED'
      });

      // Handle rental status if applicable
      if (payment.rental) {
        await this.handleRentalRefund(payment.rental, refundAmount);
      }

      // Release property lock if applicable
      if (payment.rental) {
        await this.releasePropertyLock(payment.rental.propertyId);
      }

      // Send notifications
      await this.sendRefundNotifications(payment, refundAmount, request.reason);

      // Log refund activity
      logger.info('Refund processed successfully', {
        paymentId: payment.id,
        userId: payment.userId,
        amount: refundAmount,
        adminId: request.adminId,
        refundId: flutterwaveResult.refundId
      });

      return {
        success: true,
        refundId: flutterwaveResult.refundId,
        amount: refundAmount,
        status: 'COMPLETED',
        message: 'Refund processed successfully',
        transactionId: flutterwaveResult.refundId
      };

    } catch (error) {
      logger.error('Refund processing failed', {
        paymentId: request.paymentId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        amount: 0,
        status: 'FAILED',
        message: 'Internal server error during refund processing'
      };
    }
  }

  /**
   * Validate if a payment can be refunded
   */
  async validateRefund(request: RefundRequest): Promise<RefundValidation> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: request.paymentId },
        include: {
          rental: true
        }
      });

      if (!payment) {
        return {
          isValid: false,
          reason: 'Payment not found'
        };
      }

      // Check if payment is eligible for refund
      if (payment.status !== PaymentStatus.SUCCESS) {
        return {
          isValid: false,
          reason: 'Only successful payments can be refunded'
        };
      }

      // Check if payment hasn't been refunded already
      if (payment.status === PaymentStatus.REFUNDED) {
        return {
          isValid: false,
          reason: 'Payment has already been refunded'
        };
      }

      // Check refund time limits based on payment type
      const refundTimeLimit = this.getRefundTimeLimit(payment.paymentType);
      const paymentAge = Date.now() - payment.paidAt!.getTime();
      
      if (paymentAge > refundTimeLimit) {
        return {
          isValid: false,
          reason: 'Refund time limit exceeded'
        };
      }

      // Calculate refundable amount
      const refundableAmount = await this.calculateRefundableAmount(payment);

      return {
        isValid: true,
        refundableAmount
      };

    } catch (error) {
      logger.error('Refund validation failed', {
        paymentId: request.paymentId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        isValid: false,
        reason: 'Validation error occurred'
      };
    }
  }

  /**
   * Get refund time limit based on payment type
   */
  private getRefundTimeLimit(paymentType: string): number {
    const timeLimit = {
      RENT: 7 * 24 * 60 * 60 * 1000, // 7 days
      DEPOSIT: 30 * 24 * 60 * 60 * 1000, // 30 days
      PROPERTY_MARKING: 24 * 60 * 60 * 1000, // 24 hours
      PREMIUM_UPGRADE: 14 * 24 * 60 * 60 * 1000, // 14 days
      AGENT_COMMISSION: 0 // No refunds for commissions
    };

    return timeLimit[paymentType as keyof typeof timeLimit] || 0;
  }

  /**
   * Calculate refundable amount considering deductions
   */
  private async calculateRefundableAmount(payment: Payment): Promise<number> {
    let refundableAmount = payment.amount.toNumber();

    // Deduct platform fee if applicable (non-refundable)
    if (payment.platformFee) {
      refundableAmount -= payment.platformFee.toNumber();
    }

    // For rent payments, consider usage-based deductions
    if (payment.paymentType === 'RENT' && payment.rental) {
      const usageDeduction = await this.calculateUsageDeduction(payment.rental);
      refundableAmount -= usageDeduction;
    }

    return Math.max(0, refundableAmount);
  }

  /**
   * Calculate usage-based deduction for rent refunds
   */
  private async calculateUsageDeduction(rental: any): Promise<number> {
    const now = new Date();
    const startDate = new Date(rental.startDate);
    const endDate = rental.endDate ? new Date(rental.endDate) : new Date(startDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // Default 30 days

    // If rental hasn't started, no usage deduction
    if (now < startDate) {
      return 0;
    }

    // Calculate used days
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    const usedDays = Math.ceil((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    
    // Calculate pro-rated deduction
    const usagePercentage = Math.min(usedDays / totalDays, 1);
    const monthlyRent = rental.monthlyRent.toNumber();
    
    return monthlyRent * usagePercentage;
  }

  /**
   * Create refund record for tracking
   */
  private async createRefundRecord(data: {
    originalPaymentId: string;
    refundAmount: number;
    reason: string;
    adminId: string;
    notes?: string;
    flutterwaveRefundId: string;
    status: string;
  }) {
    return await this.prisma.payment.create({
      data: {
        userId: (await this.prisma.payment.findUnique({
          where: { id: data.originalPaymentId }
        }))!.userId,
        amount: -data.refundAmount, // Negative amount for refund
        currency: 'NGN',
        paymentType: 'REFUND' as any,
        status: PaymentStatus.SUCCESS,
        transactionId: data.flutterwaveRefundId,
        description: `Refund for payment ${data.originalPaymentId}: ${data.reason}`,
        paidAt: new Date()
      }
    });
  }

  /**
   * Handle rental status after refund
   */
  private async handleRentalRefund(rental: any, refundAmount: number) {
    // If full rent refund, terminate rental
    if (refundAmount >= rental.monthlyRent.toNumber()) {
      await this.prisma.rental.update({
        where: { id: rental.id },
        data: {
          status: 'TERMINATED',
          endDate: new Date()
        }
      });
    }
  }

  /**
   * Release property payment lock
   */
  private async releasePropertyLock(propertyId: string) {
    await this.prisma.property.update({
      where: { id: propertyId },
      data: {
        isPaymentLocked: false,
        paymentLockExpiry: null,
        isAvailable: true
      }
    });
  }

  /**
   * Send refund notifications
   */
  private async sendRefundNotifications(
    payment: Payment & { user: User; rental?: any },
    refundAmount: number,
    reason: string
  ) {
    try {
      // Email notification to user
      await notificationService.sendEmail({
        to: payment.user.email,
        subject: 'Refund Processed - NewCondo',
        template: 'refund-processed',
        data: {
          userName: payment.user.name || 'User',
          refundAmount: refundAmount.toLocaleString(),
          reason,
          transactionId: payment.transactionId,
          processedDate: new Date().toLocaleDateString()
        }
      });

      // SMS notification if phone available
      if (payment.user.phone) {
        await notificationService.sendSMS({
          to: payment.user.phone,
          message: `Your refund of ₦${refundAmount.toLocaleString()} has been processed. Reason: ${reason}. It will reflect in your account within 3-5 business days.`
        });
      }

    } catch (error) {
      logger.error('Failed to send refund notifications', {
        paymentId: payment.id,
        userId: payment.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get refund history for a user
   */
  async getRefundHistory(userId: string, limit: number = 20, offset: number = 0) {
    try {
      const refunds = await this.prisma.payment.findMany({
        where: {
          userId,
          paymentType: 'REFUND' as any,
          amount: { lt: 0 } // Negative amounts for refunds
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          description: true,
          transactionId: true,
          createdAt: true,
          paidAt: true
        }
      });

      return {
        success: true,
        data: refunds.map(refund => ({
          ...refund,
          amount: Math.abs(refund.amount.toNumber()) // Convert to positive for display
        }))
      };

    } catch (error) {
      logger.error('Failed to get refund history', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Failed to fetch refund history'
      };
    }
  }

  /**
   * Check refund status
   */
  async checkRefundStatus(refundId: string): Promise<{
    success: boolean;
    status?: string;
    message: string;
  }> {
    try {
      // Check with Flutterwave
      const flutterwaveStatus = await flutterwaveService.getRefundStatus(refundId);
      
      if (flutterwaveStatus.success) {
        // Update local record if status changed
        await this.prisma.payment.updateMany({
          where: { transactionId: refundId },
          data: { 
            status: flutterwaveStatus.status === 'completed' ? PaymentStatus.SUCCESS : PaymentStatus.PENDING
          }
        });
      }

      return flutterwaveStatus;

    } catch (error) {
      logger.error('Failed to check refund status', {
        refundId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Failed to check refund status'
      };
    }
  }
}

export const refundService = new RefundService();