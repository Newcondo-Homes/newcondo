import { Router } from 'express';
import { boundaryDisputeController } from '../controllers/boundaryDisputeController';
import { authenticateAdmin } from '../middleware/adminAuth';
import { validateRequest } from '../middleware/adminValidation';
import {
  disputeListSchema,
  resolveDisputeSchema,
  disputeFilterSchema,
} from '../validations/boundaryDisputeSchemas';

const router = Router();

// Apply admin authentication to all routes
router.use(authenticateAdmin);

/**
 * GET /api/admin/boundary-disputes
 * Get all boundary disputes with filters
 */
router.get(
  '/',
  validateRequest(disputeListSchema, 'query'),
  boundaryDisputeController.getDisputes
);

/**
 * GET /api/admin/boundary-disputes/pending
 * Get pending boundary disputes
 */
router.get(
  '/pending',
  validateRequest(disputeFilterSchema, 'query'),
  boundaryDisputeController.getPendingDisputes
);

/**
 * GET /api/admin/boundary-disputes/:disputeId
 * Get detailed information about a specific dispute
 */
router.get('/:disputeId', boundaryDisputeController.getDisputeDetails);

/**
 * GET /api/admin/boundary-disputes/:disputeId/comparison
 * Compare overlapping property boundaries
 */
router.get('/:disputeId/comparison', boundaryDisputeController.compareBoundaries);

/**
 * POST /api/admin/boundary-disputes/:disputeId/resolve
 * Resolve a boundary dispute
 */
router.post(
  '/:disputeId/resolve',
  validateRequest(resolveDisputeSchema, 'body'),
  boundaryDisputeController.resolveDispute
);

/**
 * POST /api/admin/boundary-disputes/:disputeId/confirm-duplicate
 * Confirm properties as duplicates
 */
router.post(
  '/:disputeId/confirm-duplicate',
  boundaryDisputeController.confirmDuplicate
);

/**
 * POST /api/admin/boundary-disputes/:disputeId/not-duplicate
 * Mark dispute as not a duplicate
 */
router.post(
  '/:disputeId/not-duplicate',
  boundaryDisputeController.markNotDuplicate
);

/**
 * POST /api/admin/boundary-disputes/:disputeId/request-remarking
 * Request property to be remarked
 */
router.post(
  '/:disputeId/request-remarking',
  boundaryDisputeController.requestRemarking
);

/**
 * PUT /api/admin/boundary-disputes/:disputeId/adjust-boundary
 * Manually adjust property boundary
 */
router.put(
  '/:disputeId/adjust-boundary',
  boundaryDisputeController.adjustBoundary
);

/**
 * GET /api/admin/boundary-disputes/stats
 * Get boundary dispute statistics
 */
router.get('/stats', boundaryDisputeController.getDisputeStats);

/**
 * GET /api/admin/boundary-disputes/:disputeId/history
 * Get dispute resolution history
 */
router.get('/:disputeId/history', boundaryDisputeController.getDisputeHistory);

/**
 * POST /api/admin/boundary-disputes/:disputeId/escalate
 * Escalate dispute for further review
 */
router.post('/:disputeId/escalate', boundaryDisputeController.escalateDispute);

export default router;