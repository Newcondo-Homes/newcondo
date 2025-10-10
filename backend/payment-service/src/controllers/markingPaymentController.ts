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




// import { Request, Response, NextFunction } from 'express';
// import { markingPaymentService } from '../services/markingPaymentService';
// import { partialCompensationService } from '../services/partialCompensationService';

// /**
//  * Controller for handling property marking payment operations
//  */
// class MarkingPaymentController {
//   /**
//    * Initialize marking payment for a property marking job
//    * POST /api/marking-payments/initialize
//    */
//   async initializeMarkingPayment(req: Request, res: Response, next: NextFunction) {
//     try {
//       const { markingJobId, paymentMethod } = req.body;
//       const userId = req.user?.id;

//       if (!userId) {
//         return res.status(401).json({
//           success: false,
//           message: 'Unauthorized - User not authenticated',
//         });
//       }

//       const result = await markingPaymentService.initializePayment({
//         markingJobId,
//         userId,
//         paymentMethod,
//       });

//       return res.status(200).json({
//         success: true,
//         message: 'Marking payment initialized successfully',
//         data: result,
//       });
//     } catch (error) {
//       next(error);
//     }
//   }

//   /**
//    * Verify marking payment after Flutterwave redirect
//    * GET /api/marking-payments/verify/:transactionId
//    */
//   async verifyMarkingPayment(req: Request, res: Response, next: NextFunction) {
//     try {
//       const { transactionId } = req.params;
//       const userId = req.user?.id;

//       if (!userId) {
//         return res.status(401).json({
//           success: false,
//           message: 'Unauthorized - User not authenticated',
//         });
//       }

//       const result = await markingPaymentService.verifyPayment({
//         transactionId,
//         userId,
//       });

//       return res.status(200).json({
//         success: true,
//         message: 'Payment verified successfully',
//         data: result,
//       });
//     } catch (error) {
//       next(error);
//     }
//   }

//   /**
//    * Handle Flutterwave webhook for marking payments
//    * POST /api/marking-payments/webhook
//    */
//   async handleMarkingPaymentWebhook(req: Request, res: Response, next: NextFunction) {
//     try {
//       const webhookData = req.body;
      
//       // Verify webhook signature
//       const signature = req.headers['verif-hash'] as string;
      
//       await markingPaymentService.handleWebhook(webhookData, signature);

//       return res.status(200).json({
//         success: true,
//         message: 'Webhook processed successfully',
//       });
//     } catch (error) {
//       next(error);
//     }
//   }

//   /**
//    * Release partial compensation to agent (initial payment)
//    * POST /api/marking-payments/release-partial
//    */
//   async releasePartialCompensation(req: Request, res: Response, next: NextFunction) {
//     try {
//       const { markingJobId } = req.body;
//       const adminId = req.user?.id;

//       if (!adminId) {
//         return res.status(401).json({
//           success: false,
//           message: 'Unauthorized - Admin authentication required',
//         });
//       }

//       const result = await partialCompensationService.releasePartialPayment({
//         markingJobId,
//         adminId,
//       });

//       return res.status(200).json({
//         success: true,
//         message: 'Partial compensation released successfully',
//         data: result,
//       });
//     } catch (error) {
//       next(error);
//     }
//   }

//   /**
//    * Release full compensation to agent (after confirmation)
//    * POST /api/marking-payments/release-full
//    */
//   async releaseFullCompensation(req: Request, res: Response, next: NextFunction) {
//     try {
//       const { markingJobId, confirmationStatus } = req.body;
//       const userId = req.user?.id;

//       if (!userId) {
//         return res.status(401).json({
//           success: false,
//           message: 'Unauthorized - User not authenticated',
//         });
//       }

//       const result = await partialCompensationService.releaseFullPayment({
//         markingJobId,
//         userId,
//         confirmationStatus,
//       });

//       return res.status(200).json({
//         success: true,
//         message: 'Full compensation released successfully',
//         data: result,
//       });
//     } catch (error) {
//       next(error);
//     }
//   }

//   /**
//    * Handle timeout compensation for unconfirmed marking jobs
//    * POST /api/marking-payments/handle-timeout
//    */
//   async handleTimeoutCompensation(req: Request, res: Response, next: NextFunction) {
//     try {
//       const { markingJobId } = req.body;

//       const result = await partialCompensationService.handleTimeoutCompensation({
//         markingJobId,
//       });

//       return res.status(200).json({
//         success: true,
//         message: 'Timeout compensation processed successfully',
//         data: result,
//       });
//     } catch (error) {
//       next(error);
//     }
//   }

//   /**
//    * Get marking payment details
//    * GET /api/marking-payments/:paymentId
//    */
//   async getMarkingPaymentDetails(req: Request, res: Response, next: NextFunction) {
//     try {
//       const { paymentId } = req.params;
//       const userId = req.user?.id;

//       if (!userId) {
//         return res.status(401).json({
//           success: false,
//           message: 'Unauthorized - User not authenticated',
//         });
//       }

//       const payment = await markingPaymentService.getPaymentDetails(paymentId, userId);

//       return res.status(200).json({
//         success: true,
//         message: 'Payment details retrieved successfully',
//         data: payment,
//       });
//     } catch (error) {
//       next(error);
//     }
//   }

//   /**
//    * Get payment history for marking jobs
//    * GET /api/marking-payments/history
//    */
//   async getMarkingPaymentHistory(req: Request, res: Response, next: NextFunction) {
//     try {
//       const userId = req.user?.id;
//       const { page = 1, limit = 10, status } = req.query;

//       if (!userId) {
//         return res.status(401).json({
//           success: false,
//           message: 'Unauthorized - User not authenticated',
//         });
//       }

//       const history = await markingPaymentService.getPaymentHistory({
//         userId,
//         page: Number(page),
//         limit: Number(limit),
//         status: status as string,
//       });

//       return res.status(200).json({
//         success: true,
//         message: 'Payment history retrieved successfully',
//         data: history,
//       });
//     } catch (error) {
//       next(error);
//     }
//   }

//   /**
//    * Calculate marking job pricing
//    * POST /api/marking-payments/calculate-price
//    */
//   async calculateMarkingPrice(req: Request, res: Response, next: NextFunction) {
//     try {
//       const { markingType, urgencyLevel, propertyId } = req.body;
//       const userId = req.user?.id;

//       if (!userId) {
//         return res.status(401).json({
//           success: false,
//           message: 'Unauthorized - User not authenticated',
//         });
//       }

//       const pricing = await markingPaymentService.calculateMarkingPrice({
//         markingType,
//         urgencyLevel,
//         propertyId,
//         userId,
//       });

//       return res.status(200).json({
//         success: true,
//         message: 'Marking price calculated successfully',
//         data: pricing,
//       });
//     } catch (error) {
//       next(error);
//     }
//   }

//   /**
//    * Refund marking payment
//    * POST /api/marking-payments/refund
//    */
//   async refundMarkingPayment(req: Request, res: Response, next: NextFunction) {
//     try {
//       const { paymentId, reason } = req.body;
//       const adminId = req.user?.id;

//       if (!adminId) {
//         return res.status(401).json({
//           success: false,
//           message: 'Unauthorized - Admin authentication required',
//         });
//       }

//       const result = await markingPaymentService.refundPayment({
//         paymentId,
//         reason,
//         adminId,
//       });

//       return res.status(200).json({
//         success: true,
//         message: 'Payment refunded successfully',
//         data: result,
//       });
//     } catch (error) {
//       next(error);
//     }
//   }
// }

// export const markingPaymentController = new MarkingPaymentController();