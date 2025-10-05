import { User, Payment, Rental, Property } from '@newcondo/db';
import { emailService } from './emailService';
import { smsService } from './smsService';
import { formatCurrency } from '../utils/formatters';
import { logger } from '../utils/logger';

interface RefundNotificationData {
  payment: Payment & {
    user: User;
    rental?: Rental & {
      property: Property;
    } | null;
  };
  refundAmount: Decimal;
  serviceFeeAmount: Decimal;
  refundReason?: string;
}

interface RefundInitiatedData extends RefundNotificationData {
  estimatedProcessingTime: string;
}

interface RefundCompletedData extends RefundNotificationData {
  transactionReference: string;
  processedAt: Date;
}

interface RefundFailedData extends RefundNotificationData {
  failureReason: string;
  supportContact: string;
}

class RefundNotificationService {
  /**
   * Notify renter that refund has been initiated
   */
  async notifyRefundInitiated(data: RefundInitiatedData): Promise<void> {
    const { payment, refundAmount, serviceFeeAmount, refundReason, estimatedProcessingTime } = data;
    const { user, rental } = payment;

    const propertyTitle = rental?.property?.title || 'Property';
    const totalRefund = formatCurrency(refundAmount, payment.currency);
    const serviceFee = formatCurrency(serviceFeeAmount, payment.currency);

    try {
      // Send email notification
      if (user.email) {
        await emailService.send({
          to: user.email,
          subject: 'Refund Request Initiated - Newcondo',
          template: 'refund-initiated',
          data: {
            userName: user.name || 'Valued Customer',
            propertyTitle,
            refundAmount: totalRefund,
            serviceFeeAmount: serviceFee,
            refundReason: refundReason || 'Cancellation within confirmation period',
            estimatedProcessingTime,
            paymentReference: payment.flutterwaveRef || payment.id,
            supportEmail: process.env.SUPPORT_EMAIL || 'support@newcondo.com',
          },
        });
      }

      // Send SMS notification
      if (user.phone) {
        await smsService.send({
          to: user.phone,
          message: `Newcondo: Your refund of ${totalRefund} for ${propertyTitle} has been initiated. Service fee of ${serviceFee} is non-refundable. Processing time: ${estimatedProcessingTime}. Ref: ${payment.flutterwaveRef || payment.id}`,
        });
      }

      logger.info('Refund initiated notification sent', {
        userId: user.id,
        paymentId: payment.id,
        refundAmount: refundAmount.toString(),
      });
    } catch (error) {
      logger.error('Failed to send refund initiated notification', {
        userId: user.id,
        paymentId: payment.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Notify renter that refund has been completed
   */
  async notifyRefundCompleted(data: RefundCompletedData): Promise<void> {
    const { payment, refundAmount, serviceFeeAmount, transactionReference, processedAt } = data;
    const { user, rental } = payment;

    const propertyTitle = rental?.property?.title || 'Property';
    const totalRefund = formatCurrency(refundAmount, payment.currency);
    const serviceFee = formatCurrency(serviceFeeAmount, payment.currency);

    try {
      // Send email notification
      if (user.email) {
        await emailService.send({
          to: user.email,
          subject: 'Refund Completed Successfully - Newcondo',
          template: 'refund-completed',
          data: {
            userName: user.name || 'Valued Customer',
            propertyTitle,
            refundAmount: totalRefund,
            serviceFeeAmount: serviceFee,
            transactionReference,
            processedAt: processedAt.toLocaleString(),
            originalPaymentRef: payment.flutterwaveRef || payment.id,
            supportEmail: process.env.SUPPORT_EMAIL || 'support@newcondo.com',
          },
        });
      }

      // Send SMS notification
      if (user.phone) {
        await smsService.send({
          to: user.phone,
          message: `Newcondo: Refund of ${totalRefund} completed successfully! Funds should reflect in your account within 24-48 hours. Ref: ${transactionReference}`,
        });
      }

      logger.info('Refund completed notification sent', {
        userId: user.id,
        paymentId: payment.id,
        refundAmount: refundAmount.toString(),
        transactionReference,
      });
    } catch (error) {
      logger.error('Failed to send refund completed notification', {
        userId: user.id,
        paymentId: payment.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Notify renter that refund has failed
   */
  async notifyRefundFailed(data: RefundFailedData): Promise<void> {
    const { payment, refundAmount, failureReason, supportContact } = data;
    const { user, rental } = payment;

    const propertyTitle = rental?.property?.title || 'Property';
    const totalRefund = formatCurrency(refundAmount, payment.currency);

    try {
      // Send email notification
      if (user.email) {
        await emailService.send({
          to: user.email,
          subject: 'Refund Processing Issue - Action Required',
          template: 'refund-failed',
          data: {
            userName: user.name || 'Valued Customer',
            propertyTitle,
            refundAmount: totalRefund,
            failureReason,
            paymentReference: payment.flutterwaveRef || payment.id,
            supportContact,
            supportEmail: process.env.SUPPORT_EMAIL || 'support@newcondo.com',
            supportPhone: process.env.SUPPORT_PHONE || '+234-XXX-XXX-XXXX',
          },
        });
      }

      // Send SMS notification
      if (user.phone) {
        await smsService.send({
          to: user.phone,
          message: `Newcondo: Refund of ${totalRefund} could not be processed. Reason: ${failureReason}. Please contact support at ${supportContact}. Ref: ${payment.flutterwaveRef || payment.id}`,
        });
      }

      logger.warn('Refund failed notification sent', {
        userId: user.id,
        paymentId: payment.id,
        failureReason,
      });
    } catch (error) {
      logger.error('Failed to send refund failed notification', {
        userId: user.id,
        paymentId: payment.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Notify property owner/agent that a refund has been issued
   */
  async notifyOwnerAgentOfRefund(data: {
    ownerId: string;
    agentId?: string;
    propertyTitle: string;
    refundAmount: Decimal;
    currency: string;
    renterName: string;
    refundReason: string;
  }): Promise<void> {
    const { ownerId, agentId, propertyTitle, refundAmount, currency, renterName, refundReason } = data;

    const amount = formatCurrency(refundAmount, currency);

    try {
      // Notify property owner
      const owner = await this.getUserById(ownerId);
      if (owner?.email) {
        await emailService.send({
          to: owner.email,
          subject: 'Rental Payment Refunded - Newcondo',
          template: 'owner-refund-notice',
          data: {
            ownerName: owner.name || 'Property Owner',
            propertyTitle,
            refundAmount: amount,
            renterName,
            refundReason,
            supportEmail: process.env.SUPPORT_EMAIL || 'support@newcondo.com',
          },
        });
      }

      // Notify agent if involved
      if (agentId) {
        const agent = await this.getUserById(agentId);
        if (agent?.email) {
          await emailService.send({
            to: agent.email,
            subject: 'Rental Payment Refunded - Newcondo',
            template: 'agent-refund-notice',
            data: {
              agentName: agent.name || 'Agent',
              propertyTitle,
              refundAmount: amount,
              renterName,
              refundReason,
              supportEmail: process.env.SUPPORT_EMAIL || 'support@newcondo.com',
            },
          });
        }
      }

      logger.info('Owner/Agent refund notification sent', {
        ownerId,
        agentId,
        refundAmount: refundAmount.toString(),
      });
    } catch (error) {
      logger.error('Failed to send owner/agent refund notification', {
        ownerId,
        agentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Notify admin of refund processing issues
   */
  async notifyAdminOfRefundIssue(data: {
    paymentId: string;
    userId: string;
    refundAmount: Decimal;
    currency: string;
    issue: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }): Promise<void> {
    const { paymentId, userId, refundAmount, currency, issue, severity } = data;

    const amount = formatCurrency(refundAmount, currency);

    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@newcondo.com';

      await emailService.send({
        to: adminEmail,
        subject: `[${severity.toUpperCase()}] Refund Processing Issue - Payment ${paymentId}`,
        template: 'admin-refund-issue',
        data: {
          paymentId,
          userId,
          refundAmount: amount,
          issue,
          severity,
          timestamp: new Date().toISOString(),
          dashboardLink: `${process.env.ADMIN_DASHBOARD_URL}/payments/${paymentId}`,
        },
      });

      logger.warn('Admin refund issue notification sent', {
        paymentId,
        userId,
        severity,
        issue,
      });
    } catch (error) {
      logger.error('Failed to send admin refund issue notification', {
        paymentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Don't throw - admin notifications failing shouldn't break the refund process
    }
  }

  /**
   * Helper method to get user by ID
   */
  private async getUserById(userId: string): Promise<User | null> {
    try {
      // This would typically use your database client
      // For now, we'll assume it's imported from a shared location
      const { prisma } = await import('@newcondo/db');
      return await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      });
    } catch (error) {
      logger.error('Failed to fetch user', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }
}

export const refundNotificationService = new RefundNotificationService();
export { RefundNotificationService };