import axios from 'axios';
import { logger } from '../../../shared/src/utils/logger';

export interface PaymentNotificationData {
  userId: string;
  userEmail: string;
  userName: string;
  paymentId: string;
  amount: number;
  currency: string;
  paymentType: 'RENT' | 'DEPOSIT' | 'PROPERTY_MARKING' | 'AGENT_COMMISSION' | 'PREMIUM_UPGRADE';
  propertyTitle?: string;
  propertyAddress?: string;
  transactionId?: string;
  flutterwaveRef?: string;
  paidAt: Date;
  confirmationDeadline?: Date;
  failureReason?: string;
  refundAmount?: number;
  refundReason?: string;
}

export interface SMSNotificationData {
  phone: string;
  message: string;
  userId: string;
  notificationType: string;
}

export interface PushNotificationData {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

class PaymentNotificationService {
  private notificationServiceURL: string;

  constructor() {
    this.notificationServiceURL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3008';
  }

  private async sendRequest(endpoint: string, data: any): Promise<void> {
    try {
      await axios.post(`${this.notificationServiceURL}${endpoint}`, data, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SERVICE_AUTH_TOKEN}`,
        },
      });
    } catch (error) {
      logger.error('Failed to send notification:', {
        endpoint,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: { ...data, userEmail: '[REDACTED]' }, // Don't log sensitive data
      });
      throw error;
    }
  }

  async sendPaymentSuccessNotification(data: PaymentNotificationData): Promise<void> {
    try {
      // Send email notification
      await this.sendRequest('/email/payment-success', {
        to: data.userEmail,
        templateData: {
          userName: data.userName,
          paymentId: data.paymentId,
          amount: this.formatCurrency(data.amount, data.currency),
          paymentType: this.formatPaymentType(data.paymentType),
          propertyTitle: data.propertyTitle,
          propertyAddress: data.propertyAddress,
          transactionId: data.transactionId,
          flutterwaveRef: data.flutterwaveRef,
          paidAt: this.formatDate(data.paidAt),
          confirmationDeadline: data.confirmationDeadline ? this.formatDate(data.confirmationDeadline) : null,
          receiptUrl: `${process.env.FRONTEND_URL}/payments/receipt/${data.paymentId}`,
        },
      });

      // Send SMS notification for rent payments
      if (data.paymentType === 'RENT' && data.propertyTitle) {
        const message = `Payment successful! You've paid ${this.formatCurrency(data.amount, data.currency)} for ${data.propertyTitle}. Ref: ${data.flutterwaveRef}`;
        
        // Note: We need the user's phone number from the user service
        await this.sendSMSNotification({
          userId: data.userId,
          message,
          notificationType: 'PAYMENT_SUCCESS',
        });
      }

      // Send push notification
      await this.sendPushNotification({
        userId: data.userId,
        title: 'Payment Successful',
        body: `Your ${this.formatPaymentType(data.paymentType).toLowerCase()} payment of ${this.formatCurrency(data.amount, data.currency)} was successful`,
        data: {
          type: 'PAYMENT_SUCCESS',
          paymentId: data.paymentId,
          amount: data.amount.toString(),
        },
      });

      logger.info('Payment success notification sent', {
        userId: data.userId,
        paymentId: data.paymentId,
        paymentType: data.paymentType,
      });

    } catch (error) {
      logger.error('Failed to send payment success notification', {
        userId: data.userId,
        paymentId: data.paymentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Don't throw - notification failure shouldn't break payment processing
    }
  }

  async sendPaymentFailedNotification(data: PaymentNotificationData): Promise<void> {
    try {
      // Send email notification
      await this.sendRequest('/email/payment-failed', {
        to: data.userEmail,
        templateData: {
          userName: data.userName,
          paymentId: data.paymentId,
          amount: this.formatCurrency(data.amount, data.currency),
          paymentType: this.formatPaymentType(data.paymentType),
          propertyTitle: data.propertyTitle,
          failureReason: data.failureReason || 'Payment could not be processed',
          retryUrl: `${process.env.FRONTEND_URL}/payments/retry/${data.paymentId}`,
          supportUrl: `${process.env.FRONTEND_URL}/support`,
        },
      });

      // Send SMS notification
      const message = `Payment failed for ${this.formatPaymentType(data.paymentType).toLowerCase()}. Amount: ${this.formatCurrency(data.amount, data.currency)}. Please try again.`;
      
      await this.sendSMSNotification({
        userId: data.userId,
        message,
        notificationType: 'PAYMENT_FAILED',
      });

      // Send push notification
      await this.sendPushNotification({
        userId: data.userId,
        title: 'Payment Failed',
        body: `Your ${this.formatPaymentType(data.paymentType).toLowerCase()} payment of ${this.formatCurrency(data.amount, data.currency)} failed. Please try again.`,
        data: {
          type: 'PAYMENT_FAILED',
          paymentId: data.paymentId,
          failureReason: data.failureReason || 'Unknown error',
        },
      });

      logger.info('Payment failure notification sent', {
        userId: data.userId,
        paymentId: data.paymentId,
        paymentType: data.paymentType,
      });

    } catch (error) {
      logger.error('Failed to send payment failure notification', {
        userId: data.userId,
        paymentId: data.paymentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async sendRefundProcessedNotification(data: PaymentNotificationData): Promise<void> {
    try {
      // Send email notification
      await this.sendRequest('/email/refund-processed', {
        to: data.userEmail,
        templateData: {
          userName: data.userName,
          originalPaymentId: data.paymentId,
          refundAmount: this.formatCurrency(data.refundAmount || data.amount, data.currency),
          originalAmount: this.formatCurrency(data.amount, data.currency),
          paymentType: this.formatPaymentType(data.paymentType),
          refundReason: data.refundReason,
          propertyTitle: data.propertyTitle,
          transactionId: data.transactionId,
          processedAt: this.formatDate(new Date()),
          refundMethod: 'Original payment method',
          processingTime: '3-5 business days',
        },
      });

      // Send SMS notification
      const message = `Refund processed! ${this.formatCurrency(data.refundAmount || data.amount, data.currency)} will be credited to your account in 3-5 business days.`;
      
      await this.sendSMSNotification({
        userId: data.userId,
        message,
        notificationType: 'REFUND_PROCESSED',
      });

      // Send push notification
      await this.sendPushNotification({
        userId: data.userId,
        title: 'Refund Processed',
        body: `Your refund of ${this.formatCurrency(data.refundAmount || data.amount, data.currency)} has been processed`,
        data: {
          type: 'REFUND_PROCESSED',
          paymentId: data.paymentId,
          refundAmount: (data.refundAmount || data.amount).toString(),
        },
      });

      logger.info('Refund processed notification sent', {
        userId: data.userId,
        paymentId: data.paymentId,
        refundAmount: data.refundAmount || data.amount,
      });

    } catch (error) {
      logger.error('Failed to send refund processed notification', {
        userId: data.userId,
        paymentId: data.paymentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async sendPaymentConfirmationReminderNotification(data: PaymentNotificationData): Promise<void> {
    try {
      if (!data.confirmationDeadline) {
        throw new Error('Confirmation deadline is required for reminder notification');
      }

      const daysLeft = Math.ceil(
        (data.confirmationDeadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      // Send email notification
      await this.sendRequest('/email/payment-confirmation-reminder', {
        to: data.userEmail,
        templateData: {
          userName: data.userName,
          paymentId: data.paymentId,
          amount: this.formatCurrency(data.amount, data.currency),
          propertyTitle: data.propertyTitle,
          propertyAddress: data.propertyAddress,
          confirmationDeadline: this.formatDate(data.confirmationDeadline),
          daysLeft,
          confirmationUrl: `${process.env.FRONTEND_URL}/payments/${data.paymentId}/confirm`,
          supportUrl: `${process.env.FRONTEND_URL}/support`,
        },
      });

      // Send push notification
      await this.sendPushNotification({
        userId: data.userId,
        title: 'Payment Confirmation Required',
        body: `Please confirm your rent payment within ${daysLeft} day${daysLeft !== 1 ? 's' : ''} to avoid automatic refund`,
        data: {
          type: 'PAYMENT_CONFIRMATION_REMINDER',
          paymentId: data.paymentId,
          daysLeft: daysLeft.toString(),
        },
      });

      logger.info('Payment confirmation reminder sent', {
        userId: data.userId,
        paymentId: data.paymentId,
        daysLeft,
      });

    } catch (error) {
      logger.error('Failed to send payment confirmation reminder', {
        userId: data.userId,
        paymentId: data.paymentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async sendSMSNotification(data: Omit<SMSNotificationData, 'phone'>): Promise<void> {
    try {
      // Get user's phone number from user service
      const userResponse = await axios.get(
        `${process.env.USER_SERVICE_URL || 'http://localhost:3002'}/users/${data.userId}/phone`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.SERVICE_AUTH_TOKEN}`,
          },
        }
      );

      const phone = userResponse.data.phone;
      if (!phone) {
        logger.warn('User has no phone number for SMS notification', {
          userId: data.userId,
        });
        return;
      }

      await this.sendRequest('/sms/send', {
        phone,
        message: data.message,
        userId: data.userId,
        notificationType: data.notificationType,
      });

    } catch (error) {
      logger.error('Failed to send SMS notification', {
        userId: data.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async sendPushNotification(data: PushNotificationData): Promise<void> {
    try {
      await this.sendRequest('/push/send', data);
    } catch (error) {
      logger.error('Failed to send push notification', {
        userId: data.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private formatCurrency(amount: number, currency: string): string {
    const formatter = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    return formatter.format(amount);
  }

  private formatPaymentType(type: string): string {
    const typeMap: Record<string, string> = {
      'RENT': 'Rent Payment',
      'DEPOSIT': 'Security Deposit',
      'PROPERTY_MARKING': 'Property Marking Service',
      'AGENT_COMMISSION': 'Agent Commission',
      'PREMIUM_UPGRADE': 'Premium Upgrade',
    };
    return typeMap[type] || type;
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Africa/Lagos',
    }).format(date);
  }
}

export const paymentNotificationService = new PaymentNotificationService();