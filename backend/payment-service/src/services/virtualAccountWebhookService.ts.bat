// backend/payment-service/src/services/virtualAccountWebhookService.ts

import crypto from 'crypto';
import { PrismaClient } from '@newcondo/db';
import { virtualAccountLogger } from '../utils/virtualAccountLogger';
import { VirtualAccountErrorHandler } from '../utils/virtualAccountErrorHandler';
import {
  FlutterwaveWebhookPayload,
  VirtualAccountTransaction,
  WebhookProcessingResult,
  WebhookProcessingStatus
} from '@newcondo/shared/types/flutterwaveVirtualAccount';

export class VirtualAccountWebhookService {
  private prisma: PrismaClient;
  private errorHandler: VirtualAccountErrorHandler;
  private readonly webhookSecret: string;

  constructor() {
    this.prisma = new PrismaClient();
    this.errorHandler = new VirtualAccountErrorHandler();
    this.webhookSecret = process.env.FLUTTERWAVE_WEBHOOK_SECRET || '';
  }

  /**
   * Verify webhook signature from Flutterwave
   */
  verifyWebhookSignature(payload: any, signature: string): boolean {
    try {
      if (!this.webhookSecret) {
        virtualAccountLogger.error('Webhook secret not configured');
        return false;
      }

      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      virtualAccountLogger.error('Signature verification failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Handle virtual account transaction webhook
   */
  async handleVirtualAccountTransaction(payload: FlutterwaveWebhookPayload): Promise<WebhookProcessingResult> {
    try {
      const transactionData = payload.data;

      virtualAccountLogger.info('Processing virtual account transaction', {
        txRef: transactionData.tx_ref,
        accountNumber: transactionData.account_number,
        amount: transactionData.amount,
        status: transactionData.status
      });

      // Find the virtual account
      const virtualAccount = await this.prisma.virtualAccount.findUnique({
        where: { accountNumber: transactionData.account_number },
        include: {
          user: true,
          property: true
        }
      });

      if (!virtualAccount) {
        throw new Error(`Virtual account not found: ${transactionData.account_number}`);
      }

      // Create payment record
      const payment = await this.prisma.payment.create({
        data: {
          userId: virtualAccount.userId,
          amount: transactionData.amount,
          currency: transactionData.currency || 'NGN',
          paymentType: this.determinePaymentType(transactionData),
          status: this.mapFlutterwaveStatus(transactionData.status),
          flutterwaveRef: transactionData.tx_ref,
          transactionId: transactionData.transaction_id,
          description: `Virtual account credit - ${transactionData.account_number}`,
          paidAt: new Date(transactionData.created_at)
        }
      });

      // Update virtual account balance if transaction is successful
      if (transactionData.status === 'successful') {
        await this.updateVirtualAccountBalance(
          virtualAccount.id,
          transactionData.amount,
          'credit'
        );

        // Trigger relevant business logic based on payment type
        await this.processSuccessfulTransaction(payment, virtualAccount);
      }

      virtualAccountLogger.info('Virtual account transaction processed', {
        paymentId: payment.id,
        accountId: virtualAccount.id,
        amount: transactionData.amount
      });

      return {
        success: true,
        paymentId: payment.id,
        accountId: virtualAccount.id,
        message: 'Transaction processed successfully'
      };

    } catch (error) {
      await this.errorHandler.handleWebhookError(error, payload);
      throw error;
    }
  }

  /**
   * Handle virtual account created webhook
   */
  async handleVirtualAccountCreated(payload: FlutterwaveWebhookPayload): Promise<WebhookProcessingResult> {
    try {
      const accountData = payload.data;

      // Update virtual account with Flutterwave account ID
      const updatedAccount = await this.prisma.virtualAccount.update({
        where: { accountNumber: accountData.account_number },
        data: {
          flutterwaveAccountId: accountData.account_id,
          isActive: true
        }
      });

      virtualAccountLogger.info('Virtual account creation confirmed', {
        accountId: updatedAccount.id,
        flutterwaveId: accountData.account_id
      });

      return {
        success: true,
        accountId: updatedAccount.id,
        message: 'Virtual account creation confirmed'
      };

    } catch (error) {
      await this.errorHandler.handleWebhookError(error, payload);
      throw error;
    }
  }

  /**
   * Handle virtual account updated webhook
   */
  async handleVirtualAccountUpdated(payload: FlutterwaveWebhookPayload): Promise<WebhookProcessingResult> {
    try {
      const accountData = payload.data;

      const updatedAccount = await this.prisma.virtualAccount.update({
        where: { accountNumber: accountData.account_number },
        data: {
          accountName: accountData.account_name,
          isActive: accountData.is_active ?? true
        }
      });

      virtualAccountLogger.info('Virtual account updated', {
        accountId: updatedAccount.id,
        changes: accountData
      });

      return {
        success: true,
        accountId: updatedAccount.id,
        message: 'Virtual account updated successfully'
      };

    } catch (error) {
      await this.errorHandler.handleWebhookError(error, payload);
      throw error;
    }
  }

  /**
   * Handle virtual account disabled webhook
   */
  async handleVirtualAccountDisabled(payload: FlutterwaveWebhookPayload): Promise<WebhookProcessingResult> {
    try {
      const accountData = payload.data;

      const updatedAccount = await this.prisma.virtualAccount.update({
        where: { accountNumber: accountData.account_number },
        data: {
          isActive: false
        }
      });

      virtualAccountLogger.warn('Virtual account disabled', {
        accountId: updatedAccount.id,
        reason: accountData.reason
      });

      return {
        success: true,
        accountId: updatedAccount.id,
        message: 'Virtual account disabled'
      };

    } catch (error) {
      await this.errorHandler.handleWebhookError(error, payload);
      throw error;
    }
  }

  /**
   * Handle balance update webhook
   */
  async handleBalanceUpdate(payload: any): Promise<void> {
    const { account_number, available_balance, currency } = payload;

    await this.prisma.virtualAccount.update({
      where: { accountNumber: account_number },
      data: {
        balance: available_balance,
        currency: currency || 'NGN'
      }
    });

    virtualAccountLogger.info('Virtual account balance updated', {
      accountNumber: account_number,
      newBalance: available_balance
    });
  }

  /**
   * Handle transaction status update webhook
   */
  async handleTransactionStatusUpdate(payload: any): Promise<void> {
    const { transaction_id, status, tx_ref } = payload;

    // Update payment status
    await this.prisma.payment.updateMany({
      where: {
        OR: [
          { transactionId: transaction_id },
          { flutterwaveRef: tx_ref }
        ]
      },
      data: {
        status: this.mapFlutterwaveStatus(status)
      }
    });

    virtualAccountLogger.info('Transaction status updated', {
      transactionId: transaction_id,
      newStatus: status
    });
  }

  /**
   * Update virtual account balance
   */
  private async updateVirtualAccountBalance(
    accountId: string,
    amount: number,
    type: 'credit' | 'debit'
  ): Promise<void> {
    const increment = type === 'credit' ? amount : -amount;

    await this.prisma.virtualAccount.update({
      where: { id: accountId },
      data: {
        balance: {
          increment
        }
      }
    });
  }

  /**
   * Process successful transaction for business logic
   */
  private async processSuccessfulTransaction(payment: any, virtualAccount: any): Promise<void> {
    try {
      // Handle different payment types
      switch (payment.paymentType) {
        case 'RENT':
          await this.processRentPayment(payment, virtualAccount);
          break;
        case 'DEPOSIT':
          await this.processDepositPayment(payment, virtualAccount);
          break;
        case 'PROPERTY_MARKING':
          await this.processMarkingPayment(payment, virtualAccount);
          break;
        default:
          virtualAccountLogger.info('No specific processing required', {
            paymentType: payment.paymentType
          });
      }
    } catch (error) {
      virtualAccountLogger.error('Error processing successful transaction', {
        paymentId: payment.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Process rent payment
   */
  private async processRentPayment(payment: any, virtualAccount: any): Promise<void> {
    // Implementation depends on rental logic
    virtualAccountLogger.info('Processing rent payment', {
      paymentId: payment.id,
      propertyId: virtualAccount.propertyId
    });
    // Add rent payment processing logic here
  }

  /**
   * Process deposit payment
   */
  private async processDepositPayment(payment: any, virtualAccount: any): Promise<void> {
    // Implementation depends on deposit logic
    virtualAccountLogger.info('Processing deposit payment', {
      paymentId: payment.id,
      propertyId: virtualAccount.propertyId
    });
    // Add deposit payment processing logic here
  }

  /**
   * Process marking payment
   */
  private async processMarkingPayment(payment: any, virtualAccount: any): Promise<void> {
    // Implementation depends on marking service logic
    virtualAccountLogger.info('Processing marking payment', {
      paymentId: payment.id
    });
    // Add marking payment processing logic here
  }

  /**
   * Determine payment type from transaction data
   */
  private determinePaymentType(transactionData: any): string {
    // Logic to determine payment type based on transaction data
    // This could be based on tx_ref format, narration, etc.
    if (transactionData.tx_ref?.includes('RENT_')) return 'RENT';
    if (transactionData.tx_ref?.includes('DEPOSIT_')) return 'DEPOSIT';
    if (transactionData.tx_ref?.includes('MARKING_')) return 'PROPERTY_MARKING';
    return 'RENT'; // Default
  }

  /**
   * Map Flutterwave status to internal payment status
   */
  private mapFlutterwaveStatus(flutterwaveStatus: string): string {
    const statusMap: { [key: string]: string } = {
      'successful': 'SUCCESS',
      'failed': 'FAILED',
      'pending': 'PENDING',
      'cancelled': 'CANCELLED'
    };

    return statusMap[flutterwaveStatus] || 'PENDING';
  }

  /**
   * Get webhook processing status
   */
  async getWebhookProcessingStatus(webhookId: string): Promise<WebhookProcessingStatus> {
    // Implementation to track webhook processing status
    // This would require additional webhook tracking table
    return {
      webhookId,
      status: 'processed',
      processedAt: new Date(),
      attempts: 1,
      lastError: null
    };
  }

  /**
   * Retry failed webhook processing
   */
  async retryFailedWebhook(webhookId: string): Promise<{ success: boolean; message: string }> {
    // Implementation to retry failed webhook processing
    // This would require webhook retry logic and tracking
    return {
      success: true,
      message: 'Webhook retry completed'
    };
  }
}