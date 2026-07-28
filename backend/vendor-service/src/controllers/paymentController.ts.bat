import { Request, Response } from 'express';
import { PaymentService } from '../services/paymentService';
import { FlutterwaveService } from '../services/flutterwaveService';
import { ReceiptService } from '../services/receiptService';
import { RefundService } from '../services/refundService';
import { LockingService } from '../services/lockingService';
import { ApiResponse } from '../../shared/src/utils/response';
import { PaymentType, PaymentStatus } from '@newcondo/db';
import { z } from 'zod';

const createPaymentSchema = z.object({
  propertyId: z.string().optional(),
  unitId: z.string().optional(),
  markingJobId: z.string().optional(),
  amount: z.number().positive(),
  currency: z.string().default('NGN'),
  paymentType: z.nativeEnum(PaymentType),
  description: z.string().optional(),
  redirectUrl: z.string().url(),
});

const retryPaymentSchema = z.object({
  paymentId: z.string(),
  redirectUrl: z.string().url().optional(),
});

export class PaymentController {
  private paymentService: PaymentService;
  private flutterwaveService: FlutterwaveService;
  private receiptService: ReceiptService;
  private refundService: RefundService;
  private lockingService: LockingService;

  constructor() {
    this.paymentService = new PaymentService();
    this.flutterwaveService = new FlutterwaveService();
    this.receiptService = new ReceiptService();
    this.refundService = new RefundService();
    this.lockingService = new LockingService();
  }

  /**
   * Initialize a new payment
   */
  public createPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json(ApiResponse.error('Unauthorized', 401));
        return;
      }

      const validatedData = createPaymentSchema.parse(req.body);

      // For rent payments, lock the property to prevent double booking
      if (validatedData.paymentType === PaymentType.RENT && validatedData.propertyId) {
        const lockResult = await this.lockingService.lockProperty(
          validatedData.propertyId,
          validatedData.unitId,
          userId,
          15 // 15 minutes lock
        );

        if (!lockResult.success) {
          res.status(409).json(ApiResponse.error(lockResult.error || 'Property is not available', 409));
          return;
        }
      }

      // Create payment record
      const payment = await this.paymentService.createPayment({
        userId,
        amount: validatedData.amount,
        currency: validatedData.currency,
        paymentType: validatedData.paymentType,
        description: validatedData.description,
        rentalId: null, // Will be set after successful payment
        markingJobId: validatedData.markingJobId,
      });

      // Initialize Flutterwave payment
      const flutterwavePayment = await this.flutterwaveService.initializePayment({
        paymentId: payment.id,
        amount: validatedData.amount,
        currency: validatedData.currency,
        customerEmail: req.user.email,
        customerName: req.user.name || 'NewCondo User',
        customerPhone: req.user.phone,
        redirectUrl: validatedData.redirectUrl,
        metadata: {
          paymentType: validatedData.paymentType,
          propertyId: validatedData.propertyId,
          unitId: validatedData.unitId,
          markingJobId: validatedData.markingJobId,
        },
      });

      // Update payment with Flutterwave reference
      await this.paymentService.updatePayment(payment.id, {
        flutterwaveRef: flutterwavePayment.txRef,
        status: PaymentStatus.PENDING,
      });

      res.status(201).json(
        ApiResponse.success({
          payment: {
            id: payment.id,
            amount: payment.amount,
            currency: payment.currency,
            status: PaymentStatus.PENDING,
            createdAt: payment.createdAt,
          },
          flutterwave: {
            paymentLink: flutterwavePayment.link,
            reference: flutterwavePayment.txRef,
          },
        }, 'Payment initialized successfully')
      );
    } catch (error) {
      console.error('Create payment error:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json(ApiResponse.error('Invalid request data', 400, error.errors));
        return;
      }

      res.status(500).json(ApiResponse.error('Failed to create payment', 500));
    }
  };

  /**
   * Get payment details
   */
  public getPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { paymentId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json(ApiResponse.error('Unauthorized', 401));
        return;
      }

      const payment = await this.paymentService.getPayment(paymentId, userId);

      if (!payment) {
        res.status(404).json(ApiResponse.error('Payment not found', 404));
        return;
      }

      res.json(ApiResponse.success(payment));
    } catch (error) {
      console.error('Get payment error:', error);
      res.status(500).json(ApiResponse.error('Failed to get payment', 500));
    }
  };

  /**
   * Get user's payment history
   */
  public getPaymentHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json(ApiResponse.error('Unauthorized', 401));
        return;
      }

      const { page = 1, limit = 10, status, paymentType } = req.query;
      
      const filters = {
        status: status as PaymentStatus,
        paymentType: paymentType as PaymentType,
      };

      const payments = await this.paymentService.getPaymentHistory(
        userId,
        parseInt(page as string),
        parseInt(limit as string),
        filters
      );

      res.json(ApiResponse.success(payments));
    } catch (error) {
      console.error('Get payment history error:', error);
      res.status(500).json(ApiResponse.error('Failed to get payment history', 500));
    }
  };

  /**
   * Verify payment status with Flutterwave
   */
  public verifyPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { paymentId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json(ApiResponse.error('Unauthorized', 401));
        return;
      }

      const payment = await this.paymentService.getPayment(paymentId, userId);

      if (!payment) {
        res.status(404).json(ApiResponse.error('Payment not found', 404));
        return;
      }

      if (!payment.flutterwaveRef) {
        res.status(400).json(ApiResponse.error('Payment reference not found', 400));
        return;
      }

      // Verify with Flutterwave
      const verificationResult = await this.flutterwaveService.verifyPayment(payment.flutterwaveRef);

      // Update payment status
      const updatedPayment = await this.paymentService.updatePaymentFromVerification(
        payment.id,
        verificationResult
      );

      res.json(ApiResponse.success({
        payment: updatedPayment,
        verification: verificationResult,
      }));
    } catch (error) {
      console.error('Verify payment error:', error);
      res.status(500).json(ApiResponse.error('Failed to verify payment', 500));
    }
  };

  /**
   * Retry a failed payment
   */
  public retryPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json(ApiResponse.error('Unauthorized', 401));
        return;
      }

      const validatedData = retryPaymentSchema.parse(req.body);
      
      const originalPayment = await this.paymentService.getPayment(validatedData.paymentId, userId);

      if (!originalPayment) {
        res.status(404).json(ApiResponse.error('Payment not found', 404));
        return;
      }

      if (originalPayment.status !== PaymentStatus.FAILED) {
        res.status(400).json(ApiResponse.error('Only failed payments can be retried', 400));
        return;
      }

      // Create new payment retry
      const retryPayment = await this.paymentService.createPaymentRetry(originalPayment);

      // Initialize new Flutterwave payment
      const flutterwavePayment = await this.flutterwaveService.initializePayment({
        paymentId: retryPayment.id,
        amount: originalPayment.amount.toNumber(),
        currency: originalPayment.currency,
        customerEmail: req.user.email,
        customerName: req.user.name || 'NewCondo User',
        customerPhone: req.user.phone,
        redirectUrl: validatedData.redirectUrl || `${process.env.FRONTEND_URL}/payments/success`,
        metadata: {
          paymentType: originalPayment.paymentType,
          originalPaymentId: originalPayment.id,
        },
      });

      // Update retry payment with new Flutterwave reference
      await this.paymentService.updatePayment(retryPayment.id, {
        flutterwaveRef: flutterwavePayment.txRef,
        status: PaymentStatus.PENDING,
      });

      res.json(
        ApiResponse.success({
          payment: {
            id: retryPayment.id,
            amount: retryPayment.amount,
            currency: retryPayment.currency,
            status: PaymentStatus.PENDING,
            createdAt: retryPayment.createdAt,
          },
          flutterwave: {
            paymentLink: flutterwavePayment.link,
            reference: flutterwavePayment.txRef,
          },
        }, 'Payment retry initialized successfully')
      );
    } catch (error) {
      console.error('Retry payment error:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json(ApiResponse.error('Invalid request data', 400, error.errors));
        return;
      }

      res.status(500).json(ApiResponse.error('Failed to retry payment', 500));
    }
  };

  /**
   * Generate payment receipt
   */
  public generateReceipt = async (req: Request, res: Response): Promise<void> => {
    try {
      const { paymentId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json(ApiResponse.error('Unauthorized', 401));
        return;
      }

      const payment = await this.paymentService.getPayment(paymentId, userId);

      if (!payment) {
        res.status(404).json(ApiResponse.error('Payment not found', 404));
        return;
      }

      if (payment.status !== PaymentStatus.SUCCESS) {
        res.status(400).json(ApiResponse.error('Receipt can only be generated for successful payments', 400));
        return;
      }

      const receipt = await this.receiptService.generateReceipt(payment);

      res.json(ApiResponse.success({
        receiptUrl: receipt.url,
        receiptId: receipt.id,
        generatedAt: receipt.createdAt,
      }, 'Receipt generated successfully'));
    } catch (error) {
      console.error('Generate receipt error:', error);
      res.status(500).json(ApiResponse.error('Failed to generate receipt', 500));
    }
  };

  /**
   * Request payment refund
   */
  public requestRefund = async (req: Request, res: Response): Promise<void> => {
    try {
      const { paymentId } = req.params;
      const { reason } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json(ApiResponse.error('Unauthorized', 401));
        return;
      }

      const payment = await this.paymentService.getPayment(paymentId, userId);

      if (!payment) {
        res.status(404).json(ApiResponse.error('Payment not found', 404));
        return;
      }

      if (payment.status !== PaymentStatus.SUCCESS) {
        res.status(400).json(ApiResponse.error('Only successful payments can be refunded', 400));
        return;
      }

      const refundResult = await this.refundService.initiateRefund(payment.id, reason);

      res.json(ApiResponse.success({
        refundId: refundResult.refundId,
        status: refundResult.status,
        estimatedProcessingTime: refundResult.estimatedProcessingTime,
      }, 'Refund request initiated successfully'));
    } catch (error) {
      console.error('Request refund error:', error);
      res.status(500).json(ApiResponse.error('Failed to request refund', 500));
    }
  };

  /**
   * Get payment analytics for user
   */
  public getPaymentAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json(ApiResponse.error('Unauthorized', 401));
        return;
      }

      const { startDate, endDate } = req.query;
      
      const analytics = await this.paymentService.getPaymentAnalytics(
        userId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json(ApiResponse.success(analytics));
    } catch (error) {
      console.error('Get payment analytics error:', error);
      res.status(500).json(ApiResponse.error('Failed to get payment analytics', 500));
    }
  };
}









