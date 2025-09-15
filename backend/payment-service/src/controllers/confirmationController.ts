// backend/payment-service/src/controllers/confirmationController.ts
import { Request, Response } from 'express';
import { confirmationService } from '../services/confirmationService';
import { responseUtil } from '../../../shared/src/utils/response';
import { z } from 'zod';

// Validation schemas
const confirmPaymentSchema = z.object({
  paymentId: z.string().min(1),
  confirmationType: z.enum(['LANDLORD', 'TENANT', 'ADMIN']),
  notes: z.string().optional(),
});

const disputePaymentSchema = z.object({
  paymentId: z.string().min(1),
  disputeReason: z.string().min(1),
  disputeDetails: z.string().min(10),
  evidence: z.array(z.string()).optional(), // URLs to evidence files
});

const resolveDisputeSchema = z.object({
  disputeId: z.string().min(1),
  resolution: z.enum(['REFUND_TENANT', 'RELEASE_LANDLORD', 'PARTIAL_REFUND']),
  adminNotes: z.string().min(1),
  refundAmount: z.number().optional(),
});

export class ConfirmationController {
  /**
   * Confirm a payment (by landlord, tenant, or admin)
   */
  async confirmPayment(req: Request, res: Response) {
    try {
      const validatedData = confirmPaymentSchema.parse(req.body);
      const userId = req.user?.id;
      
      if (!userId) {
        return responseUtil.unauthorized(res, 'User authentication required');
      }
      
      const confirmation = await confirmationService.confirmPayment({
        ...validatedData,
        confirmedBy: userId,
      });
      
      return responseUtil.success(res, confirmation, 'Payment confirmed successfully');
    } catch (error) {
      console.error('Error confirming payment:', error);
      
      if (error instanceof z.ZodError) {
        return responseUtil.badRequest(res, 'Invalid input data', error.errors);
      }
      
      if (error instanceof Error) {
        return responseUtil.badRequest(res, error.message);
      }
      
      return responseUtil.error(res, 'Failed to confirm payment');
    }
  }

  /**
   * Dispute a payment
   */
  async disputePayment(req: Request, res: Response) {
    try {
      const validatedData = disputePaymentSchema.parse(req.body);
      const userId = req.user?.id;
      
      if (!userId) {
        return responseUtil.unauthorized(res, 'User authentication required');
      }
      
      const dispute = await confirmationService.disputePayment({
        ...validatedData,
        disputedBy: userId,
      });
      
      return responseUtil.success(res, dispute, 'Payment dispute submitted successfully', 201);
    } catch (error) {
      console.error('Error disputing payment:', error);
      
      if (error instanceof z.ZodError) {
        return responseUtil.badRequest(res, 'Invalid input data', error.errors);
      }
      
      if (error instanceof Error) {
        return responseUtil.badRequest(res, error.message);
      }
      
      return responseUtil.error(res, 'Failed to submit payment dispute');
    }
  }

  /**
   * Get payment confirmation status
   */
  async getPaymentConfirmationStatus(req: Request, res: Response) {
    try {
      const { paymentId } = req.params;
      
      if (!paymentId) {
        return responseUtil.badRequest(res, 'Payment ID is required');
      }
      
      const status = await confirmationService.getPaymentConfirmationStatus(paymentId);
      
      return responseUtil.success(res, status);
    } catch (error) {
      console.error('Error fetching confirmation status:', error);
      return responseUtil.error(res, 'Failed to fetch confirmation status');
    }
  }

  /**
   * Get payments pending confirmation
   */
  async getPendingConfirmations(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { page = '1', limit = '10', type } = req.query;
      
      if (!userId) {
        return responseUtil.unauthorized(res, 'User authentication required');
      }
      
      const filters = {
        type: type as 'LANDLORD' | 'TENANT' | undefined,
      };
      
      const pendingConfirmations = await confirmationService.getPendingConfirmations(
        userId,
        parseInt(page as string),
        parseInt(limit as string),
        filters
      );
      
      return responseUtil.success(res, pendingConfirmations);
    } catch (error) {
      console.error('Error fetching pending confirmations:', error);
      return responseUtil.error(res, 'Failed to fetch pending confirmations');
    }
  }

  /**
   * Get payment disputes (admin only)
   */
  async getPaymentDisputes(req: Request, res: Response) {
    try {
      const { page = '1', limit = '10', status, priority } = req.query;
      
      const filters = {
        status: status as 'PENDING' | 'IN_REVIEW' | 'RESOLVED' | undefined,
        priority: priority as 'LOW' | 'MEDIUM' | 'HIGH' | undefined,
      };
      
      const disputes = await confirmationService.getPaymentDisputes(
        parseInt(page as string),
        parseInt(limit as string),
        filters
      );
      
      return responseUtil.success(res, disputes);
    } catch (error) {
      console.error('Error fetching payment disputes:', error);
      return responseUtil.error(res, 'Failed to fetch payment disputes');
    }
  }

  /**
   * Get specific payment dispute
   */
  async getPaymentDispute(req: Request, res: Response) {
    try {
      const { disputeId } = req.params;
      
      if (!disputeId) {
        return responseUtil.badRequest(res, 'Dispute ID is required');
      }
      
      const dispute = await confirmationService.getPaymentDisputeById(disputeId);
      
      if (!dispute) {
        return responseUtil.notFound(res, 'Payment dispute not found');
      }
      
      return responseUtil.success(res, dispute);
    } catch (error) {
      console.error('Error fetching payment dispute:', error);
      return responseUtil.error(res, 'Failed to fetch payment dispute');
    }
  }

  /**
   * Resolve payment dispute (admin only)
   */
  async resolveDispute(req: Request, res: Response) {
    try {
      const validatedData = resolveDisputeSchema.parse(req.body);
      const adminId = req.user?.id;
      
      if (!adminId) {
        return responseUtil.unauthorized(res, 'Admin authentication required');
      }
      
      const resolution = await confirmationService.resolveDispute({
        ...validatedData,
        resolvedBy: adminId,
      });
      
      return responseUtil.success(res, resolution, 'Dispute resolved successfully');
    } catch (error) {
      console.error('Error resolving dispute:', error);
      
      if (error instanceof z.ZodError) {
        return responseUtil.badRequest(res, 'Invalid input data', error.errors);
      }
      
      if (error instanceof Error) {
        return responseUtil.badRequest(res, error.message);
      }
      
      return responseUtil.error(res, 'Failed to resolve dispute');
    }
  }

  /**
   * Release payment after confirmation period
   */
  async releasePayment(req: Request, res: Response) {
    try {
      const { paymentId } = req.params;
      const { force } = req.query;
      
      if (!paymentId) {
        return responseUtil.badRequest(res, 'Payment ID is required');
      }
      
      const released = await confirmationService.releasePayment(
        paymentId, 
        force === 'true'
      );
      
      return responseUtil.success(res, released, 'Payment released successfully');
    } catch (error) {
      console.error('Error releasing payment:', error);
      
      if (error instanceof Error) {
        return responseUtil.badRequest(res, error.message);
      }
      
      return responseUtil.error(res, 'Failed to release payment');
    }
  }

  /**
   * Get confirmation period timeline for a payment
   */
  async getConfirmationTimeline(req: Request, res: Response) {
    try {
      const { paymentId } = req.params;
      
      if (!paymentId) {
        return responseUtil.badRequest(res, 'Payment ID is required');
      }
      
      const timeline = await confirmationService.getConfirmationTimeline(paymentId);
      
      return responseUtil.success(res, timeline);
    } catch (error) {
      console.error('Error fetching confirmation timeline:', error);
      return responseUtil.error(res, 'Failed to fetch confirmation timeline');
    }
  }

  /**
   * Extend confirmation period (admin only)
   */
  async extendConfirmationPeriod(req: Request, res: Response) {
    try {
      const { paymentId } = req.params;
      const { extensionDays, reason } = req.body;
      const adminId = req.user?.id;
      
      if (!paymentId || !extensionDays || !reason) {
        return responseUtil.badRequest(res, 'Payment ID, extension days, and reason are required');
      }
      
      if (!adminId) {
        return responseUtil.unauthorized(res, 'Admin authentication required');
      }
      
      const extended = await confirmationService.extendConfirmationPeriod(
        paymentId,
        extensionDays,
        reason,
        adminId
      );
      
      return responseUtil.success(res, extended, 'Confirmation period extended successfully');
    } catch (error) {
      console.error('Error extending confirmation period:', error);
      
      if (error instanceof Error) {
        return responseUtil.badRequest(res, error.message);
      }
      
      return responseUtil.error(res, 'Failed to extend confirmation period');
    }
  }

  /**
   * Get payments nearing confirmation deadline
   */
  async getPaymentsNearingDeadline(req: Request, res: Response) {
    try {
      const { hours = '24' } = req.query;
      
      const payments = await confirmationService.getPaymentsNearingDeadline(
        parseInt(hours as string)
      );
      
      return responseUtil.success(res, payments);
    } catch (error) {
      console.error('Error fetching payments nearing deadline:', error);
      return responseUtil.error(res, 'Failed to fetch payments nearing deadline');
    }
  }
}

export const confirmationController = new ConfirmationController();