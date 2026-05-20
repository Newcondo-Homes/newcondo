import { Request, Response } from 'express';
import { disputeService } from '../services/disputeService';
import { z } from 'zod';

// Validation schemas
const getDisputesQuerySchema = z.object({
  status: z.enum(['PENDING', 'INVESTIGATING', 'RESOLVED', 'REJECTED', 'ALL']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'ALL']).optional(),
  page: z.string().transform(Number).pipe(z.number().min(1)).optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
  sortBy: z.enum(['createdAt', 'priority', 'status']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

const resolveDisputeSchema = z.object({
  disputeId: z.string().cuid(),
  resolution: z.enum(['REFUND_FULL', 'REFUND_PARTIAL', 'NO_REFUND', 'RELEASE_PAYMENT']),
  refundAmount: z.number().positive().optional(),
  reason: z.string().min(20).max(1000),
  additionalNotes: z.string().max(500).optional(),
});

const updateDisputeStatusSchema = z.object({
  disputeId: z.string().cuid(),
  status: z.enum(['PENDING', 'INVESTIGATING', 'RESOLVED', 'REJECTED']),
  notes: z.string().max(500).optional(),
});

const addDisputeNoteSchema = z.object({
  disputeId: z.string().cuid(),
  note: z.string().min(10).max(1000),
  isInternal: z.boolean().default(false),
});

const escalateDisputeSchema = z.object({
  disputeId: z.string().cuid(),
  priority: z.enum(['HIGH', 'URGENT']),
  reason: z.string().min(10).max(500),
});


function getAdminId(req: Request): string | null {
  return req.user?.id ?? null;
}

function handleUnauthorized(res: Response): Response {
  return res.status(401).json({ success: false, error: 'Unauthorized' });
}

function handleAdminError(res: Response, error: unknown): Response {
  if (error instanceof Error && error.message.startsWith('Unauthorized')) {
    return res.status(403).json({ success: false, error: error.message });
  }
  if (error instanceof Error && error.message.includes('not found')) {
    return res.status(404).json({ success: false, error: error.message });
  }
  return res.status(500).json({
    success: false,
    error: error instanceof Error ? error.message : 'Internal server error',
  });
}


export const disputeController = {
  /**
   * Get all disputes
   * GET /api/admin/disputes
   */
  async getDisputes(req: Request, res: Response): Promise<Response | void>  {
    try {
      const query = getDisputesQuerySchema.parse(req.query);

      const result = await disputeService.getDisputes({
        status: query.status || 'ALL',
        priority: query.priority || 'ALL',
        page: query.page || 1,
        limit: query.limit || 20,
        sortBy: query.sortBy || 'createdAt',
        sortOrder: query.sortOrder || 'desc',
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

      console.error('Error fetching disputes:', error);
      return handleAdminError(res, error);
    }
  },

  /**
   * Get dispute statistics
   * GET /api/admin/disputes/stats
   */
  async getDisputeStats(_req: Request, res: Response): Promise<Response | void> {
    try {
      const stats = await disputeService.getDisputeStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error fetching dispute stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dispute statistics',
      });
    }
  },

  /**
   * Get dispute details
   * GET /api/admin/disputes/:disputeId
   */
  async getDisputeDetails(req: Request, res: Response): Promise<Response | void>  {
    try {
      const { disputeId } = req.params;
      const adminId = getAdminId(req);

      if (!adminId) return handleUnauthorized(res);

      const details = await disputeService.getDisputeDetails(disputeId, adminId);


      res.status(200).json({
        success: true,
        data: details,
      });
    } catch (error) {
      console.error('Error fetching dispute details:', error);
      return handleAdminError(res, error);
    }
  },

  /**
   * Resolve a dispute
   * POST /api/admin/disputes/resolve
   */
  async resolveDispute(req: Request, res: Response): Promise<Response | void>  {
    try {
      const data = resolveDisputeSchema.parse(req.body);
      const adminId = getAdminId(req);

      if (!adminId) return handleUnauthorized(res);


      const result = await disputeService.resolveDispute({
        disputeId: data.disputeId,
        adminId,
        resolution: data.resolution,
        refundAmount: data.refundAmount,
        reason: data.reason,
        additionalNotes: data.additionalNotes,
      });

      res.status(200).json({
        success: true,
        data: result,
        message: 'Dispute resolved successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }

      console.error('Error resolving dispute:', error);
      return handleAdminError(res, error);
    }
  },

  /**
   * Update dispute status
   * PATCH /api/admin/disputes/:disputeId/status
   */
  async updateDisputeStatus(req: Request, res: Response): Promise<Response | void>  {
    try {
      const data = updateDisputeStatusSchema.parse({
        ...req.body,
        disputeId: req.params.disputeId,
      });
      const adminId = getAdminId(req);

      if (!adminId) return handleUnauthorized(res);

      const result = await disputeService.updateDisputeStatus({
        disputeId: data.disputeId,
        status: data.status,
        adminId,
        notes: data.notes,
      });

      res.status(200).json({
        success: true,
        data: result,
        message: 'Dispute status updated successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }

      console.error('Error updating dispute status:', error);
      return handleAdminError(res, error);
    }
  },

  /**
   * Add note to dispute
   * POST /api/admin/disputes/:disputeId/notes
   */
  async addDisputeNote(req: Request, res: Response): Promise<Response | void>  {
    try {
      const data = addDisputeNoteSchema.parse({
        ...req.body,
        disputeId: req.params.disputeId,
      });

      const adminId = getAdminId(req);

      if (!adminId) return handleUnauthorized(res);

      const result = await disputeService.addDisputeNote({
        disputeId: data.disputeId,
        adminId,
        note: data.note,
        isInternal: data.isInternal,
      });

      res.status(201).json({
        success: true,
        data: result,
        message: 'Note added successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }

      console.error('Error adding dispute note:', error);
      return handleAdminError(res, error);
    }
  },

  /**
   * Escalate dispute priority
   * POST /api/admin/disputes/:disputeId/escalate
   */
  async escalateDispute(req: Request, res: Response): Promise<Response | void>  {
    try {
      const data = escalateDisputeSchema.parse({
        ...req.body,
        disputeId: req.params.disputeId,
      });
      
      const adminId = getAdminId(req);

      if (!adminId) return handleUnauthorized(res);

      const result = await disputeService.escalateDispute({
        disputeId: data.disputeId,
        priority: data.priority,
        adminId,
        reason: data.reason,
      });

      res.status(200).json({
        success: true,
        data: result,
        message: 'Dispute escalated successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }

      console.error('Error escalating dispute:', error);
      return handleAdminError(res, error);
    }
  },

  /**
   * Get dispute timeline
   * GET /api/admin/disputes/:disputeId/timeline
   */
  async getDisputeTimeline(req: Request, res: Response): Promise<Response | void> {
    try {
      const { disputeId } = req.params;

      const adminId = getAdminId(req);

      if (!adminId) return handleUnauthorized(res);

      const timeline = await disputeService.getDisputeTimeline(disputeId);

      res.status(200).json({
        success: true,
        data: timeline,
      });
    } catch (error) {
      console.error('Error fetching dispute timeline:', error);
      return handleAdminError(res, error);
    }
  },
};