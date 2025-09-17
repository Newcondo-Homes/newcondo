import { Request, Response } from 'express';
import { PaymentService } from '../services/paymentService';
import { standardResponse } from '../../../shared/src/utils/response';
import { logger } from '../../../shared/src/middleware/logger';
import { z } from 'zod';

// Validation schemas
const initiatePaymentSchema = z.object({
  markingJobId: z.string().min(1, 'Marking job ID is required'),
  amount: z.number().min(1, 'Amount must be greater than 0'),
  paymentMethod: z.enum(['card', 'bank_transfer', 'ussd', 'mobile_money']).optional().default('card')
});

const verifyPaymentSchema = z.object({
  transactionId: z.string().min(1, 'Transaction ID is required'),
  flutterwaveRef: z.string().min(1, 'Flutterwave reference is required')
});

const refundPaymentSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
  reason: z.string().min(1, 'Refund reason is required'),
  amount: z.number().optional()
});

export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  /**
   * Initiate payment for property marking service
   * POST /api/marking/payments/initiate
   */
  initiatePayment = async (req: Request, res: Response) => {
    try {
      const validation = initiatePaymentSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json(
          standardResponse.error(
            'Validation failed',
            validation.error.errors
          )
        );
      }

      const { markingJobId, amount, paymentMethod } = validation.data;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json(
          standardResponse.error('User authentication required')
        );
      }

      const result = await this.paymentService.initiateMarkingPayment({
        markingJobId,
        userId,
        amount,
        paymentMethod
      });

      if (!result.success) {
        return res.status(400).json(
          standardResponse.error(result.message)
        );
      }

      logger.info('Marking payment initiated', {
        markingJobId,
        userId,
        amount,
        paymentLink: result.paymentLink
      });

      res.json(
        standardResponse.success(
          'Payment initiated successfully',
          {
            paymentId: result.paymentId,
            paymentLink: result.paymentLink,
            reference: result.reference
          }
        )
      );

    } catch (error) {
      logger.error('Error initiating marking payment', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        body: req.body 
      });
      
      res.status(500).json(
        standardResponse.error('Failed to initiate payment')
      );
    }
  };

  /**
   * Verify payment status
   * POST /api/marking/payments/verify
   */
  verifyPayment = async (req: Request, res: Response) => {
    try {
      const validation = verifyPaymentSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json(
          standardResponse.error(
            'Validation failed',
            validation.error.errors
          )
        );
      }

      const { transactionId, flutterwaveRef } = validation.data;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json(
          standardResponse.error('User authentication required')
        );
      }

      const result = await this.paymentService.verifyMarkingPayment({
        transactionId,
        flutterwaveRef,
        userId
      });

      if (!result.success) {
        return res.status(400).json(
          standardResponse.error(result.message)
        );
      }

      logger.info('Marking payment verified', {
        transactionId,
        flutterwaveRef,
        userId,
        status: result.status
      });

      res.json(
        standardResponse.success(
          'Payment verification completed',
          {
            paymentStatus: result.status,
            markingJobId: result.markingJobId,
            amount: result.amount
          }
        )
      );

    } catch (error) {
      logger.error('Error verifying marking payment', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        body: req.body 
      });
      
      res.status(500).json(
        standardResponse.error('Failed to verify payment')
      );
    }
  };

  /**
   * Get payment history for marking services
   * GET /api/marking/payments/history
   */
  getPaymentHistory = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;

      if (!userId) {
        return res.status(401).json(
          standardResponse.error('User authentication required')
        );
      }

      const result = await this.paymentService.getMarkingPaymentHistory({
        userId,
        page,
        limit,
        status
      });

      res.json(result);

    } catch (error) {
      logger.error('Error getting marking payment history', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id 
      });
      
      res.status(500).json(
        standardResponse.error('Failed to retrieve payment history')
      );
    }
  };

  /**
   * Get specific payment details
   * GET /api/marking/payments/:paymentId
   */
  getPaymentDetails = async (req: Request, res: Response) => {
    try {
      const { paymentId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json(
          standardResponse.error('User authentication required')
        );
      }

      if (!paymentId) {
        return res.status(400).json(
          standardResponse.error('Payment ID is required')
        );
      }

      const result = await this.paymentService.getMarkingPaymentDetails({
        paymentId,
        userId
      });

      if (!result.success) {
        return res.status(404).json(
          standardResponse.error(result.message)
        );
      }

      res.json(
        standardResponse.success(
          'Payment details retrieved successfully',
          result.payment
        )
      );

    } catch (error) {
      logger.error('Error getting marking payment details', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        paymentId: req.params.paymentId 
      });
      
      res.status(500).json(
        standardResponse.error('Failed to retrieve payment details')
      );
    }
  };

  /**
   * Cancel pending payment
   * POST /api/marking/payments/:paymentId/cancel
   */
  cancelPayment = async (req: Request, res: Response) => {
    try {
      const { paymentId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json(
          standardResponse.error('User authentication required')
        );
      }

      if (!paymentId) {
        return res.status(400).json(
          standardResponse.error('Payment ID is required')
        );
      }

      const result = await this.paymentService.cancelMarkingPayment({
        paymentId,
        userId
      });

      if (!result.success) {
        return res.status(400).json(
          standardResponse.error(result.message)
        );
      }

      logger.info('Marking payment cancelled', {
        paymentId,
        userId
      });

      res.json(
        standardResponse.success('Payment cancelled successfully')
      );

    } catch (error) {
      logger.error('Error cancelling marking payment', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        paymentId: req.params.paymentId 
      });
      
      res.status(500).json(
        standardResponse.error('Failed to cancel payment')
      );
    }
  };

  /**
   * Request refund for marking payment (Admin only)
   * POST /api/marking/payments/:paymentId/refund
   */
  refundPayment = async (req: Request, res: Response) => {
    try {
      const { paymentId } = req.params;
      const validation = refundPaymentSchema.safeParse({
        paymentId,
        ...req.body
      });

      if (!validation.success) {
        return res.status(400).json(
          standardResponse.error(
            'Validation failed',
            validation.error.errors
          )
        );
      }

      const { reason, amount } = validation.data;
      const adminId = req.user?.id;

      if (!adminId) {
        return res.status(401).json(
          standardResponse.error('Admin authentication required')
        );
      }

      // Check if user has admin privileges
      if (req.user?.role !== 'ADMIN') {
        return res.status(403).json(
          standardResponse.error('Admin privileges required')
        );
      }

      const result = await this.paymentService.refundMarkingPayment({
        paymentId,
        reason,
        adminId,
        refundAmount: amount
      });

      if (!result.success) {
        return res.status(400).json(
          standardResponse.error(result.message)
        );
      }

      logger.info('Marking payment refunded', {
        paymentId,
        reason,
        refundAmount: amount,
        adminId
      });

      res.json(
        standardResponse.success(
          'Payment refunded successfully',
          {
            refundId: result.refundId
          }
        )
      );

    } catch (error) {
      logger.error('Error refunding marking payment', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        paymentId: req.params.paymentId 
      });
      
      res.status(500).json(
        standardResponse.error('Failed to process refund')
      );
    }
  };

  /**
   * Get payment statistics for marking services (Admin only)
   * GET /api/marking/payments/statistics
   */
  getPaymentStatistics = async (req: Request, res: Response) => {
    try {
      const adminId = req.user?.id;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      if (!adminId) {
        return res.status(401).json(
          standardResponse.error('Admin authentication required')
        );
      }

      if (req.user?.role !== 'ADMIN') {
        return res.status(403).json(
          standardResponse.error('Admin privileges required')
        );
      }

      const result = await this.paymentService.getMarkingPaymentStatistics({
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined
      });

      res.json(
        standardResponse.success(
          'Payment statistics retrieved successfully',
          result
        )
      );

    } catch (error) {
      logger.error('Error getting marking payment statistics', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      res.status(500).json(
        standardResponse.error('Failed to retrieve payment statistics')
      );
    }
  };

  /**
   * Retry failed payment
   * POST /api/marking/payments/:paymentId/retry
   */
  retryPayment = async (req: Request, res: Response) => {
    try {
      const { paymentId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json(
          standardResponse.error('User authentication required')
        );
      }

      if (!paymentId) {
        return res.status(400).json(
          standardResponse.error('Payment ID is required')
        );
      }

      const result = await this.paymentService.retryMarkingPayment({
        paymentId,
        userId
      });

      if (!result.success) {
        return res.status(400).json(
          standardResponse.error(result.message)
        );
      }

      logger.info('Marking payment retry initiated', {
        paymentId,
        userId,
        newPaymentId: result.paymentId
      });

      res.json(
        standardResponse.success(
          'Payment retry initiated successfully',
          {
            paymentId: result.paymentId,
            paymentLink: result.paymentLink,
            reference: result.reference
          }
        )
      );

    } catch (error) {
      logger.error('Error retrying marking payment', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        paymentId: req.params.paymentId 
      });
      
      res.status(500).json(
        standardResponse.error('Failed to retry payment')
      );
    }
  };
}