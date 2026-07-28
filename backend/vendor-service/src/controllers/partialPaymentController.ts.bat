// backend/payment-service/src/controllers/partialPaymentController.ts

import { Request, Response } from 'express';
import { partialPaymentService } from '../services/partialPaymentService';
import { successResponse, errorResponse } from '../../../shared/src/utils/response';

export class PartialPaymentController {
  /**
   * Process partial payment to agent (1000 naira initial payment)
   */
  async processPartialPayment(req: Request, res: Response) {
    try {
      const { markingJobId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return errorResponse(res, 'Unauthorized', 401);
      }

      const result = await partialPaymentService.processPartialPayment({
        markingJobId,
        triggeredBy: userId,
      });

      return successResponse(res, result, 'Partial payment processed successfully');
    } catch (error: any) {
      console.error('Error processing partial payment:', error);
      return errorResponse(res, error.message || 'Failed to process partial payment', 500);
    }
  }

  /**
   * Release remaining payment to agent after property owner confirmation
   */
  async releaseRemainingPayment(req: Request, res: Response) {
    try {
      const { markingJobId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return errorResponse(res, 'Unauthorized', 401);
      }

      const result = await partialPaymentService.releaseRemainingPayment({
        markingJobId,
        confirmedBy: userId,
      });

      return successResponse(res, result, 'Remaining payment released successfully');
    } catch (error: any) {
      console.error('Error releasing remaining payment:', error);
      return errorResponse(res, error.message || 'Failed to release payment', 500);
    }
  }

  /**
   * Process timeout compensation payment
   */
  async processTimeoutCompensation(req: Request, res: Response) {
    try {
      const { markingJobId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return errorResponse(res, 'Unauthorized', 401);
      }

      const result = await partialPaymentService.processTimeoutCompensation({
        markingJobId,
        triggeredBy: userId,
      });

      return successResponse(res, result, 'Timeout compensation processed successfully');
    } catch (error: any) {
      console.error('Error processing timeout compensation:', error);
      return errorResponse(res, error.message || 'Failed to process compensation', 500);
    }
  }

  /**
   * Get partial payment status for a marking job
   */
  async getPartialPaymentStatus(req: Request, res: Response) {
    try {
      const { markingJobId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return errorResponse(res, 'Unauthorized', 401);
      }

      const result = await partialPaymentService.getPartialPaymentStatus(markingJobId, userId);

      return successResponse(res, result, 'Partial payment status retrieved successfully');
    } catch (error: any) {
      console.error('Error fetching partial payment status:', error);
      return errorResponse(res, error.message || 'Failed to fetch payment status', 500);
    }
  }

  /**
   * Get agent's partial payment history
   */
  async getAgentPartialPayments(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { page = 1, limit = 10, status } = req.query;

      if (!userId) {
        return errorResponse(res, 'Unauthorized', 401);
      }

      const result = await partialPaymentService.getAgentPartialPayments(
        userId,
        Number(page),
        Number(limit),
        status as string | undefined
      );

      return successResponse(res, result, 'Agent partial payments retrieved successfully');
    } catch (error: any) {
      console.error('Error fetching agent partial payments:', error);
      return errorResponse(res, error.message || 'Failed to fetch payments', 500);
    }
  }

  /**
   * Calculate pending partial payments for agent
   */
  async calculatePendingPartialPayments(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return errorResponse(res, 'Unauthorized', 401);
      }

      const result = await partialPaymentService.calculatePendingPartialPayments(userId);

      return successResponse(res, result, 'Pending payments calculated successfully');
    } catch (error: any) {
      console.error('Error calculating pending payments:', error);
      return errorResponse(res, error.message || 'Failed to calculate payments', 500);
    }
  }

  /**
   * Get payment breakdown for a marking job
   */
  async getPaymentBreakdown(req: Request, res: Response) {
    try {
      const { markingJobId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return errorResponse(res, 'Unauthorized', 401);
      }

      const result = await partialPaymentService.getPaymentBreakdown(markingJobId, userId);

      return successResponse(res, result, 'Payment breakdown retrieved successfully');
    } catch (error: any) {
      console.error('Error fetching payment breakdown:', error);
      return errorResponse(res, error.message || 'Failed to fetch breakdown', 500);
    }
  }
}

export const partialPaymentController = new PartialPaymentController();