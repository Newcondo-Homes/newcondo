import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../../../shared/src/middleware/auth';
import { validateRequest } from '../../../shared/src/middleware/validation';
import * as disputeController from '../controllers/disputeController';
import { z } from 'zod';

const router = Router();

// All routes require admin authentication
router.use(authenticateToken);
router.use(requireAdmin);

// Validation schemas
const disputeQuerySchema = z.object({
  status: z.enum(['OPEN', 'INVESTIGATING', 'RESOLVED', 'REJECTED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

const disputeIdSchema = z.object({
  disputeId: z.string().cuid(),
});

const updateDisputeStatusSchema = z.object({
  status: z.enum(['INVESTIGATING', 'RESOLVED', 'REJECTED']),
  adminNotes: z.string().min(10),
  internalNotes: z.string().optional(),
});

const resolveDisputeSchema = z.object({
  resolution: z.enum(['REFUND_FULL', 'REFUND_PARTIAL', 'NO_REFUND', 'EXTEND_PERIOD']),
  resolutionNotes: z.string().min(20),
  refundAmount: z.number().positive().optional(),
  compensationAmount: z.number().positive().optional(),
  notifyParties: z.boolean().default(true),
});

const assignDisputeSchema = z.object({
  assignedToAdminId: z.string().cuid(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
});

const addDisputeNoteSchema = z.object({
  note: z.string().min(10),
  isInternal: z.boolean().default(false),
});

// GET /api/admin/disputes - Get all disputes
router.get(
  '/',
  validateRequest({ query: disputeQuerySchema }),
  disputeController.getAllDisputes
);

// GET /api/admin/disputes/stats - Get dispute statistics
router.get(
  '/stats',
  disputeController.getDisputeStats
);

// GET /api/admin/disputes/:disputeId - Get specific dispute details
router.get(
  '/:disputeId',
  validateRequest({ params: disputeIdSchema }),
  disputeController.getDisputeDetails
);

// PATCH /api/admin/disputes/:disputeId/status - Update dispute status
router.patch(
  '/:disputeId/status',
  validateRequest({ 
    params: disputeIdSchema,
    body: updateDisputeStatusSchema 
  }),
  disputeController.updateDisputeStatus
);

// POST /api/admin/disputes/:disputeId/resolve - Resolve dispute
router.post(
  '/:disputeId/resolve',
  validateRequest({ 
    params: disputeIdSchema,
    body: resolveDisputeSchema 
  }),
  disputeController.resolveDispute
);

// POST /api/admin/disputes/:disputeId/assign - Assign dispute to admin
router.post(
  '/:disputeId/assign',
  validateRequest({ 
    params: disputeIdSchema,
    body: assignDisputeSchema 
  }),
  disputeController.assignDispute
);

// POST /api/admin/disputes/:disputeId/notes - Add note to dispute
router.post(
  '/:disputeId/notes',
  validateRequest({ 
    params: disputeIdSchema,
    body: addDisputeNoteSchema 
  }),
  disputeController.addDisputeNote
);

// GET /api/admin/disputes/:disputeId/evidence - Get dispute evidence
router.get(
  '/:disputeId/evidence',
  validateRequest({ params: disputeIdSchema }),
  disputeController.getDisputeEvidence
);

// POST /api/admin/disputes/:disputeId/escalate - Escalate dispute
router.post(
  '/:disputeId/escalate',
  validateRequest({ 
    params: disputeIdSchema,
    body: z.object({
      escalationReason: z.string().min(20),
      escalateTo: z.string().cuid(),
    })
  }),
  disputeController.escalateDispute
);

export default router;