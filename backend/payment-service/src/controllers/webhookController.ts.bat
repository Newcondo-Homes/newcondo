import { Request, Response } from 'express';
import { FlutterwaveService } from '../services/flutterwaveService';
import { PaymentService } from '../services/paymentService';
import { RentalService } from '../services/rentalService';
import { VirtualAccountService } from '../services/virtualAccountService';
import { LockingService } from '../services/lockingService';
import { ApiResponse } from '../../shared/src/utils/response';
import { PaymentStatus, PaymentType } from '@newcondo/db';
import crypto from 'crypto';

export class WebhookController {
  private flutterwaveService: FlutterwaveService;
  private paymentService: PaymentService;
  private rentalService: RentalService;
  private virtualAccountService: VirtualAccountService;
  private lockingService: LockingService;

  constructor() {
    this.flutterwaveService = new FlutterwaveService();
    this.paymentService = new PaymentService();
    this.rentalService = new RentalService();
    this.virtualAccountService = new VirtualAccountService();
    this.lockingService = new LockingService();
  }

  /**
   * Verify webhook signature from Flutterwave
   */
  private verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
      if (!secretHash) {
        console.error('FLUTTERWAVE_SECRET_HASH not configured');
        return false;
      }

      const hash = crypto
        .createHmac('sha256', secretHash)
        .update(payload)
        .digest('hex');

      return hash === signature;
    } catch (error) {
      console.error('Webhook signature verification error:', error);
      return false;
    }
  }

  /**
   * Handle Flutterwave payment webhooks
   */
  public handlePaymentWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const signature = req.headers['verif-hash'] as string;
      const payload = JSON.stringify(req.body);

      // Verify webhook signature
      if (!this.verifyWebhookSignature(payload, signature)) {
        console.error('Invalid webhook signature');
        res.status(401).json(ApiResponse.error('Invalid signature', 401));
        return;
      }

      const { event, data } = req.body;

      switch (event) {
        case 'charge.completed':
          await this.handlePaymentCompleted(data);
          break;
        case 'charge.failed':
          await this.handlePaymentFailed(data);
          break;
        case 'transfer.completed':
          await this.handleTransferCompleted(data);
          break;
        case 'transfer.failed':
          await this.handleTransferFailed(data);
          break;
        default:
          console.log(`Unhandled webhook event: ${event}`);
      }

      res.json(ApiResponse.success(null, 'Webhook processed successfully'));
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json(ApiResponse.error('Webhook processing failed', 500));
    }
  };

  /**
   * Handle successful payment completion
   */
  private handlePaymentCompleted = async (data: any): Promise<void> => {
    try {
      const { tx_ref, transaction_id, amount, currency, customer, status, payment_type } = data;

      console.log(`Processing completed payment: ${tx_ref}`);

      // Find payment by Flutterwave reference
      const payment = await this.paymentService.getPaymentByFlutterwaveRef(tx_ref);

      if (!payment) {
        console.error(`Payment not found for tx_ref: ${tx_ref}`);
        return;
      }

      // Prevent double processing
      if (payment.status === PaymentStatus.SUCCESS) {
        console.log(`Payment ${payment.id} already processed`);
        return;
      }

      // Update payment status
      await this.paymentService.updatePayment(payment.id, {
        status: PaymentStatus.SUCCESS,
        transactionId: transaction_id,
        paidAt: new Date(),
        paymentMethod: payment_type,
      });

      // Handle specific payment types
      switch (payment.paymentType) {
        case PaymentType.RENT:
          await this.handleRentPaymentSuccess(payment);
          break;
        case PaymentType.DEPOSIT:
          await this.handleDepositPaymentSuccess(payment);
          break;
        case PaymentType.PROPERTY_MARKING:
          await this.handleMarkingPaymentSuccess(payment);
          break;
        default:
          console.log(`No specific handler for payment type: ${payment.paymentType}`);
      }

      console.log(`Payment ${payment.id} processed successfully`);
    } catch (error) {
      console.error('Error handling payment completion:', error);
      throw error;
    }
  };

  /**
   * Handle failed payment
   */
  private handlePaymentFailed = async (data: any): Promise<void> => {
    try {
      const { tx_ref, transaction_id, status } = data;

      console.log(`Processing failed payment: ${tx_ref}`);

      // Find payment by Flutterwave reference
      const payment = await this.paymentService.getPaymentByFlutterwaveRef(tx_ref);

      if (!payment) {
        console.error(`Payment not found for tx_ref: ${tx_ref}`);
        return;
      }

      // Update payment status
      await this.paymentService.updatePayment(payment.id, {
        status: PaymentStatus.FAILED,
        transactionId: transaction_id,
        failureReason: data.processor_response || 'Payment failed',
      });

      // Release any locks if this was a rent payment
      if (payment.paymentType === PaymentType.RENT && payment.rental) {
        await this.lockingService.releaseLock(
          payment.rental.propertyId,
          payment.rental.unitId,
          payment.userId
        );
      }

      console.log(`Payment ${payment.id} marked as failed`);
    } catch (error) {
      console.error('Error handling payment failure:', error);
      throw error;
    }
  };

  /**
   * Handle successful rent payment
   */
  private handleRentPaymentSuccess = async (payment: any): Promise<void> => {
    try {
      // Create rental record if payment is for rent
      if (!payment.rentalId) {
        // Extract property/unit info from payment metadata or related records
        // This would depend on how the payment was structured
        const rentalData = await this.extractRentalDataFromPayment(payment);
        
        if (rentalData) {
          const rental = await this.rentalService.createRental({
            propertyId: rentalData.propertyId,
            unitId: rentalData.unitId,
            renterId: payment.userId,
            monthlyRent: payment.amount,
            startDate: new Date(),
            // Set confirmation deadline (7 days from now)
            confirmationDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          });

          // Update payment with rental ID
          await this.paymentService.updatePayment(payment.id, {
            rentalId: rental.id,
          });

          // Set payment confirmation period
          await this.paymentService.setConfirmationPeriod(payment.id);

          // Release property lock
          await this.lockingService.releaseLock(
            rentalData.propertyId,
            rentalData.unitId,
            payment.userId
          );

          console.log(`Rental ${rental.id} created for payment ${payment.id}`);
        }
      }

      // TODO: Send payment confirmation email/SMS
      // await this.notificationService.sendPaymentConfirmation(payment);
    } catch (error) {
      console.error('Error handling rent payment success:', error);
      throw error;
    }
  };

  /**
   * Handle successful deposit payment
   */
  private handleDepositPaymentSuccess = async (payment: any): Promise<void> => {
    try {
      // Similar to rent payment but for deposit
      // TODO: Implement deposit-specific logic
      console.log(`Deposit payment ${payment.id} processed successfully`);
    } catch (error) {
      console.error('Error handling deposit payment success:', error);
      throw error;
    }
  };

  /**
   * Handle successful property marking payment
   */
  private handleMarkingPaymentSuccess = async (payment: any): Promise<void> => {
    try {
      if (payment.markingJobId) {
        // Update marking job status to paid
        // TODO: Call marking service to update job status
        console.log(`Marking job ${payment.markingJobId} payment completed`);
      }
    } catch (error) {
      console.error('Error handling marking payment success:', error);
      throw error;
    }
  };

  /**
   * Handle completed transfer (for payouts/refunds)
   */
  private handleTransferCompleted = async (data: any): Promise<void> => {
    try {
      const { reference, amount, status } = data;
      console.log(`Transfer completed: ${reference}, Amount: ${amount}`);

      // TODO: Update refund or payout status
      // This would depend on your implementation of transfers/payouts
    } catch (error) {
      console.error('Error handling transfer completion:', error);
      throw error;
    }
  };

  /**
   * Handle failed transfer
   */
  private handleTransferFailed = async (data: any): Promise<void> => {
    try {
      const { reference, amount, status } = data;
      console.log(`Transfer failed: ${reference}, Amount: ${amount}`);

      // TODO: Update refund or payout status as failed
    } catch (error) {
      console.error('Error handling transfer failure:', error);
      throw error;
    }
  };

  /**
   * Handle virtual account credit webhook
   */
  public handleVirtualAccountCredit = async (req: Request, res: Response): Promise<void> => {
    try {
      const signature = req.headers['verif-hash'] as string;
      const payload = JSON.stringify(req.body);

      // Verify webhook signature
      if (!this.verifyWebhookSignature(payload, signature)) {
        console.error('Invalid webhook signature for virtual account credit');
        res.status(401).json(ApiResponse.error('Invalid signature', 401));
        return;
      }

      const { data } = req.body;
      const { account_number, amount, currency, customer_name, reference } = data;

      console.log(`Virtual account credited: ${account_number}, Amount: ${amount}`);

      // Find virtual account
      const virtualAccount = await this.virtualAccountService.getByAccountNumber(account_number);

      if (!virtualAccount) {
        console.error(`Virtual account not found: ${account_number}`);
        res.status(404).json(ApiResponse.error('Virtual account not found', 404));
        return;
      }

      // Credit the virtual account
      await this.virtualAccountService.creditAccount(virtualAccount.id, amount, {
        reference,
        currency,
        customerName: customer_name,
        creditedAt: new Date(),
      });

      console.log(`Virtual account ${virtualAccount.id} credited with ${amount}`);

      res.json(ApiResponse.success(null, 'Virtual account credit processed'));
    } catch (error) {
      console.error('Virtual account credit webhook error:', error);
      res.status(500).json(ApiResponse.error('Failed to process virtual account credit', 500));
    }
  };

  /**
   * Health check endpoint for webhooks
   */
  public webhookHealthCheck = async (req: Request, res: Response): Promise<void> => {
    res.json(ApiResponse.success({ status: 'healthy', timestamp: new Date() }));
  };

  /**
   * Extract rental data from payment (helper method)
   */
  private extractRentalDataFromPayment = async (payment: any): Promise<{
    propertyId: string;
    unitId?: string;
  } | null> => {
    try {
      // This would depend on how you store the property/unit information
      // It could be in payment metadata, or you might need to query related tables
      
      // For now, returning null - implement based on your data structure
      return null;
    } catch (error) {
      console.error('Error extracting rental data from payment:', error);
      return null;
    }
  };
}