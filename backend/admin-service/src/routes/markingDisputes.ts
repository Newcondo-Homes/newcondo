// backend/admin-service/src/routes/markingDisputes.ts
import { Router, Request, Response } from 'express';
import { markingDisputeController } from '../controllers/markingDisputeController';
import { adminAuth } from '../middleware/adminAuth';
import { adminValidation } from '../middleware/adminValidation';

const router = Router();

/**
 * GET /admin/marking-disputes
 * Retrieve all marking disputes with filtering and pagination
 * Query params: status, propertyId, page, limit, sortBy
 */
router.get(
  '/',
  adminAuth,
  adminValidation.validateQueryParams(['status', 'propertyId', 'page', 'limit', 'sortBy']),
  (req: Request, res: Response) => markingDisputeController.getAllDisputes(req, res)
);

/**
 * GET /admin/marking-disputes/:disputeId
 * Retrieve a specific marking dispute with all related data
 */
router.get(
  '/:disputeId',
  adminAuth,
  adminValidation.validateParams(['disputeId']),
  (req: Request, res: Response) => markingDisputeController.getDisputeById(req, res)
);

/**
 * POST /admin/marking-disputes/:disputeId/resolve
 * Resolve a marking dispute - mark property as verified or reject marking
 * Body: { resolution: 'APPROVED' | 'REJECTED', notes: string, action: string }
 */
router.post(
  '/:disputeId/resolve',
  adminAuth,
  adminValidation.validateParams(['disputeId']),
  adminValidation.validateBodySchema({
    resolution: 'string',
    notes: 'string',
    action: 'string', // 'APPROVE_PROPERTY', 'REJECT_MARKING', 'REQUEST_REMARKING'
  }),
  (req: Request, res: Response) => markingDisputeController.resolveDispute(req, res)
);

/**
 * POST /admin/marking-disputes/:markingJobId/escalate
 * Escalate a marking job dispute for manual review
 * Body: { reason: string, priority: 'LOW' | 'MEDIUM' | 'HIGH' }
 */
router.post(
  '/:markingJobId/escalate',
  adminAuth,
  adminValidation.validateParams(['markingJobId']),
  adminValidation.validateBodySchema({
    reason: 'string',
    priority: 'string',
  }),
  (req: Request, res: Response) => markingDisputeController.escalateDispute(req, res)
);

/**
 * PUT /admin/marking-disputes/:disputeId/update-status
 * Update dispute status (e.g., from PENDING to IN_REVIEW)
 * Body: { status: string, notes?: string }
 */
router.put(
  '/:disputeId/update-status',
  adminAuth,
  adminValidation.validateParams(['disputeId']),
  adminValidation.validateBodySchema({
    status: 'string',
    notes: 'string',
  }),
  (req: Request, res: Response) => markingDisputeController.updateDisputeStatus(req, res)
);

/**
 * POST /admin/marking-disputes/:disputeId/assign-agent
 * Assign a new agent to re-mark the property
 * Body: { agentId: string, deadline: Date }
 */
router.post(
  '/:disputeId/assign-agent',
  adminAuth,
  adminValidation.validateParams(['disputeId']),
  adminValidation.validateBodySchema({
    agentId: 'string',
    deadline: 'date',
  }),
  (req: Request, res: Response) => markingDisputeController.assignNewAgent(req, res)
);

/**
 * GET /admin/marking-disputes/stats/overview
 * Get overview statistics for marking disputes
 */
router.get(
  '/stats/overview',
  adminAuth,
  (req: Request, res: Response) => markingDisputeController.getDisputeStats(req, res)
);

/**
 * POST /admin/marking-disputes/:disputeId/send-notification
 * Send notification to property owner or agent regarding dispute
 * Body: { recipientId: string, message: string, type: 'OWNER' | 'AGENT' }
 */
router.post(
  '/:disputeId/send-notification',
  adminAuth,
  adminValidation.validateParams(['disputeId']),
  adminValidation.validateBodySchema({
    recipientId: 'string',
    message: 'string',
    type: 'string',
  }),
  (req: Request, res: Response) => markingDisputeController.sendDispute Notification(req, res)
);

export default router;