import { Request, Response } from 'express';
import { confirmationOversightService } from '../services/confirmationOversightService';
import { z } from 'zod';

// Validation schemas
const getConfirmationsQuerySchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'DISPUTED', 'EXPIRED', 'ALL']).optional(),
  page: z.string().transform(Number).pipe(z.number().min(1)).optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
  sortBy: z.enum(['createdAt', 'confirmationDeadline', 'amount']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional(),
});

const forceReleaseSchema = z.object({
  paymentId: z.string().cuid(),
  reason: z.string().min(10).max(500),
  notifyParties: z.boolean().default(true),
});

const extendDeadlineSchema = z.object({
  paymentId: z.string().cuid(),
  extensionDays: z.number().min(1).max(7),
  reason: z.string().min(10).max(500),
});

const bulkActionSchema = z.object({
  paymentIds: z.array(z.string().cuid()).min(1).max(50),
  action: z.enum(['RELEASE', 'EXTEND', 'CANCEL']),
  reason: z.string().min(10).max(500),
  extensionDays: z.number().min(1).max(7).optional(),
});

// Helper to extract and validate adminId from request
function getAdminId(req: Request): string | null {
  return req.user?.id ?? null;
}


export const confirmationOversightController = {
  /**
   * Get all payments awaiting confirmation
   * GET /api/admin/confirmations
   */
  async getConfirmations(req: Request, res: Response): Promise<Response | void> {
    try {
      const query = getConfirmationsQuerySchema.parse(req.query);

      const result = await confirmationOversightService.getConfirmations({
        status: query.status || 'ALL',
        page: query.page || 1,
        limit: query.limit || 20,
        sortBy: query.sortBy || 'confirmationDeadline',
        sortOrder: query.sortOrder || 'asc',
        search: query.search,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }

      console.error('Error fetching confirmations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch confirmations',
      });
    }
  },

  /**
   * Get confirmation statistics
   * GET /api/admin/confirmations/stats
   */
  async getConfirmationStats(req: Request, res: Response): Promise<Response | void> {
    try {
      const stats = await confirmationOversightService.getConfirmationStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error fetching confirmation stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch confirmation statistics',
      });
    }
  },

  /**
   * Get details of a specific confirmation
   * GET /api/admin/confirmations/:paymentId
   */
  async getConfirmationDetails(req: Request, res: Response): Promise<Response | void>  {
    try {
      const { paymentId } = req.params;
      const adminId = getAdminId(req);

      if (!adminId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const details = await confirmationOversightService.getConfirmationDetails(paymentId, adminId );

      res.status(200).json({
        success: true,
        data: details,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Payment not found') {
        return res.status(404).json({ success: false, error: 'Confirmation not found' });
      }
      if (error instanceof Error && error.message.startsWith('Unauthorized')) {
        return res.status(403).json({ success: false, error: error.message });
      }

      console.error('Error fetching confirmation details:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch confirmation details',
      });
    }
  },

  /**
   * Force release payment (admin override)
   * POST /api/admin/confirmations/force-release
   */
  async forceReleasePayment(req: Request, res: Response): Promise<Response  | void>  {
    try {
      const data = forceReleaseSchema.parse(req.body);
      const adminId = req.user?.id;

      if (!adminId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const result = await confirmationOversightService.forceReleasePayment({
        paymentId: data.paymentId,
        adminId,
        reason: data.reason,
        notifyParties: data.notifyParties,
      });

      res.status(200).json({
        success: true,
        data: result,
        message: 'Payment released successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }

      if (error instanceof Error && error.message.startsWith('Unauthorized')) {
        return res.status(403).json({ success: false, error: error.message });
      }

      console.error('Error forcing payment release:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to release payment',
      });
    }
  },

  /**
   * Extend confirmation deadline
   * POST /api/admin/confirmations/extend-deadline
   */
  async extendDeadline(req: Request, res: Response): Promise<Response  | void> {
    try {
      const data = extendDeadlineSchema.parse(req.body);
      const adminId = getAdminId(req);

      if (!adminId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const result = await confirmationOversightService.extendConfirmationDeadline({
          paymentId: data.paymentId,
          extensionDays: data.extensionDays,
          adminId,
          reason: data.reason,
        });

      res.status(200).json({
        success: true,
        data: result,
        message: 'Confirmation deadline extended successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }

      if (error instanceof Error && error.message.startsWith('Unauthorized')) {
        return res.status(403).json({ success: false, error: error.message });
      }

      console.error('Error extending deadline:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to extend deadline',
      });
    }
  },

  /**
   * Get expired confirmations that need attention
   * GET /api/admin/confirmations/expired
   */
  async getExpiredConfirmations(req: Request, res: Response): Promise<Response  | void>  {
    try {
      const expired = await confirmationOversightService.getExpiredConfirmations();

      res.status(200).json({
        success: true,
        data: expired,
      });
    } catch (error) {
      console.error('Error fetching expired confirmations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch expired confirmations',
      });
    }
  },

  /**
   * Bulk action on multiple confirmations
   * POST /api/admin/confirmations/bulk-action
   */
  async bulkAction(req: Request, res: Response): Promise<Response | void> {
    try {
      const data = bulkActionSchema.parse(req.body);
      const adminId = getAdminId(req);

      if (!adminId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const result = await confirmationOversightService.bulkAction({
        paymentIds: data.paymentIds,
        action: data.action,
        adminId,
        reason: data.reason,
        extensionDays: data.extensionDays,
      });

      res.status(200).json({
        success: true,
        data: result,
        message: `Bulk ${data.action.toLowerCase()} completed successfully`,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }

      if (error instanceof Error && error.message.startsWith('Unauthorized')) {
        return res.status(403).json({ success: false, error: error.message });
      }
      console.error('Error performing bulk action:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to perform bulk action',
      });
    }
  },

  /**
   * Get confirmation timeline/history
   * GET /api/admin/confirmations/:paymentId/timeline
   */
  async getConfirmationTimeline(req: Request, res: Response): Promise<Response | void> {
    try {
      const { paymentId } = req.params;
      const adminId = getAdminId(req);

      if (!adminId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }


      const timeline = await confirmationOversightService.getConfirmationTimeline(paymentId);

      res.status(200).json({
        success: true,
        data: timeline,
      });
    } catch (error) {
       if (error instanceof Error && error.message === 'Payment not found') {
        return res.status(404).json({ success: false, error: 'Payment not found' });
      }
      
      console.error('Error fetching confirmation timeline:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch confirmation timeline',
      });
    }
  },
};