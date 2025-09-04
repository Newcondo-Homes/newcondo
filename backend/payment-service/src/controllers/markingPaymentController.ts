// backend/payment-service/src/controllers/markingPaymentController.ts

import { Request, Response } from 'express';
import { markingPaymentService } from '../services/markingPaymentService';
import { response } from '../../shared/src/utils/response';
import { MarkingPaymentRequest, MarkingRefundRequest } from '../types/markingPayment';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export class MarkingPaymentController {
  /**
   * Calculate marking fee
   */
  async calculateFee(req: AuthenticatedRequest, res: Response) {
    try {
      const { urgencyLevel, userLocation, propertyLocation } = req.body;

      if (!urgencyLevel) {
        return response.badRequest(res, 'Urgency level is required');
      }

      const validUrgencyLevels = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
      if (!validUrgencyLevels.includes(urgencyLevel)) {
        return response.badRequest(res, 'Invalid urgency level');
      }

      const feeCalculation = await markingPaymentService.calculateMarkingFee(
        urgencyLevel,
        userLocation,
        propertyLocation
      );

      return response.success(res, 'Fee calculated successfully', feeCalculation);
    } catch (error) {
      console.error('Error calculating marking fee:', error);
      return response.serverError(res, 'Failed to calculate marking fee');
    }
  }

  /**
   * Initiate marking payment
   */
  async initiatePayment(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.id) {
        return response.unauthorized(res, 'User authentication required');
      }

      const paymentRequest: MarkingPaymentRequest = req.body;

      // Validate required fields
      const requiredFields = ['propertyId', 'markingJobId', 'contactPersonName', 'contactPersonPhone', 'urgencyLevel'];
      const missingFields = requiredFields.filter(field => !paymentRequest[field as keyof MarkingPaymentRequest]);

      if (missingFields.length > 0) {
        return response.badRequest(res, `Missing required fields: ${missingFields.join(', ')}`);
      }

      // Validate phone number format
      const phoneRegex = /^\+234[0-9]{10}$|^0[0-9]{10}$/;
      if (!phoneRegex.test(paymentRequest.contactPersonPhone)) {
        return response.badRequest(res, 'Invalid phone number format');
      }

      // Validate urgency level
      const validUrgencyLevels = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
      if (!validUrgencyLevels.includes(paymentRequest.urgencyLevel)) {
        return response.badRequest(res, 'Invalid urgency level');
      }

      // Validate preferred time if provided
      if (paymentRequest.preferredTime) {
        const preferredTime = new Date(paymentRequest.preferredTime);
        const now = new Date();
        
        if (preferredTime <= now) {
          return response.badRequest(res, 'Preferred time must be in the future');
        }

        // Check if preferred time is within business hours (8 AM - 6 PM)
        const hour = preferredTime.getHours();
        if (hour < 8 || hour > 18) {
          return response.badRequest(res, 'Preferred time must be within business hours (8 AM - 6 PM)');
        }
      }

      const paymentResponse = await markingPaymentService.initiateMarkingPayment(
        req.user.id,
        paymentRequest
      );

      return response.created(res, 'Payment initiated successfully', paymentResponse);
    } catch (error) {
      console.error('Error initiating marking payment:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return response.notFound(res, error.message);
        }
        if (error.message.includes('already has') || error.message.includes('can only request')) {
          return response.badRequest(res, error.message);
        }
      }
      
      return response.serverError(res, 'Failed to initiate payment');
    }
  }

  /**
   * Handle marking payment webhook
   */
  async handleWebhook(req: Request, res: Response) {
    try {
      const webhookPayload = req.body;

      // Verify webhook signature (implement based on Flutterwave requirements)
      const signature = req.headers['verif-hash'] as string;
      const expectedSignature = process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH;

      if (signature !== expectedSignature) {
        return response.unauthorized(res, 'Invalid webhook signature');
      }

      // Process the webhook
      await markingPaymentService.handleMarkingPaymentWebhook(webhookPayload);

      return response.success(res, 'Webhook processed successfully');
    } catch (error) {
      console.error('Error processing marking payment webhook:', error);
      return response.serverError(res, 'Failed to process webhook');
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.id) {
        return response.unauthorized(res, 'User authentication required');
      }

      const { paymentId } = req.params;

      if (!paymentId) {
        return response.badRequest(res, 'Payment ID is required');
      }

      const paymentStatus = await markingPaymentService.getMarkingPaymentStatus(
        paymentId,
        req.user.id
      );

      return response.success(res, 'Payment status retrieved successfully', paymentStatus);
    } catch (error) {
      console.error('Error getting payment status:', error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        return response.notFound(res, error.message);
      }
      
      return response.serverError(res, 'Failed to get payment status');
    }
  }

  /**
   * Get user's marking payments history
   */
  async getPaymentHistory(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.id) {
        return response.unauthorized(res, 'User authentication required');
      }

      const { page = 1, limit = 10, status } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      // Build where clause
      const whereClause: any = {
        userId: req.user.id,
        paymentType: 'PROPERTY_MARKING'
      };

      if (status && typeof status === 'string') {
        whereClause.status = status.toUpperCase();
      }

      // Get payments with related data
      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where: whereClause,
          include: {
            user: {
              select: { name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit)
        }),
        prisma.payment.count({ where: whereClause })
      ]);

      const totalPages = Math.ceil(total / Number(limit));

      return response.success(res, 'Payment history retrieved successfully', {
        payments,
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalItems: total,
          itemsPerPage: Number(limit)
        }
      });
    } catch (error) {
      console.error('Error getting payment history:', error);
      return response.serverError(res, 'Failed to get payment history');
    }
  }

  /**
   * Process refund (Admin only)
   */
  async processRefund(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.id) {
        return response.unauthorized(res, 'User authentication required');
      }

      // Check if user is admin
      if (req.user.role !== 'ADMIN') {
        return response.forbidden(res, 'Admin access required');
      }

      const refundRequest: MarkingRefundRequest = req.body;

      // Validate required fields
      if (!refundRequest.paymentId || !refundRequest.reason) {
        return response.badRequest(res, 'Payment ID and reason are required');
      }

      const refundResponse = await markingPaymentService.processMarkingRefund(
        refundRequest,
        req.user.id
      );

      if (refundResponse.status === 'FAILED') {
        return response.badRequest(res, `Refund failed: ${refundResponse.failureReason}`);
      }

      return response.success(res, 'Refund processed successfully', refundResponse);
    } catch (error) {
      console.error('Error processing refund:', error);
      return response.serverError(res, 'Failed to process refund');
    }
  }

  /**
   * Retry failed payment
   */
  async retryPayment(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.id) {
        return response.unauthorized(res, 'User authentication required');
      }

      const { paymentId } = req.params;

      if (!paymentId) {
        return response.badRequest(res, 'Payment ID is required');
      }

      // Get the failed payment
      const payment = await prisma.payment.findFirst({
        where: {
          id: paymentId,
          userId: req.user.id,
          status: 'FAILED',
          paymentType: 'PROPERTY_MARKING'
        },
        include: {
          user: true
        }
      });

      if (!payment) {
        return response.notFound(res, 'Failed payment not found');
      }

      // Get the marking job details
      if (!payment.markingJobId) {
        return response.badRequest(res, 'No associated marking job found');
      }

      const markingJob = await prisma.propertyMarkingJob.findUnique({
        where: { id: payment.markingJobId },
        include: {
          property: true
        }
      });

      if (!markingJob) {
        return response.notFound(res, 'Marking job not found');
      }

      // Create new payment request
      const paymentRequest: MarkingPaymentRequest = {
        propertyId: markingJob.propertyId,
        markingJobId: markingJob.id,
        contactPersonName: markingJob.contactPersonName,
        contactPersonPhone: markingJob.contactPersonPhone,
        accessInstructions: markingJob.accessInstructions || undefined,
        preferredTime: markingJob.preferredTime?.toISOString(),
        urgencyLevel: markingJob.urgencyLevel as any
      };

      // Initiate new payment
      const newPaymentResponse = await markingPaymentService.initiateMarkingPayment(
        req.user.id,
        paymentRequest
      );

      // Mark old payment as cancelled
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'CANCELLED' }
      });

      return response.success(res, 'Payment retry initiated successfully', newPaymentResponse);
    } catch (error) {
      console.error('Error retrying payment:', error);
      return response.serverError(res, 'Failed to retry payment');
    }
  }
}

export const markingPaymentController = new MarkingPaymentController();