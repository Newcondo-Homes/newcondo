import { Router } from 'express';
import { propertyApprovalController } from '../controllers/propertyApprovalController';
import { authenticateAdmin } from '../middleware/adminAuth';
import { validateRequest } from '../middleware/adminValidation';
import {
  propertyListSchema,
  approvePropertySchema,
  rejectPropertySchema,
  bulkPropertyActionSchema,
} from '../validations/propertySchemas';

const router = Router();

// Apply admin authentication to all routes
router.use(authenticateAdmin);

/**
 * GET /api/admin/properties/pending
 * Get all properties pending approval
 */
router.get(
  '/pending',
  validateRequest(propertyListSchema, 'query'),
  propertyApprovalController.getPendingProperties
);

/**
 * GET /api/admin/properties/:propertyId
 * Get detailed property information for review
 */
router.get('/:propertyId', propertyApprovalController.getPropertyDetails);

/**
 * GET /api/admin/properties/:propertyId/boundary
 * Get property boundary information and marking details
 */
router.get('/:propertyId/boundary', propertyApprovalController.getPropertyBoundary);

/**
 * POST /api/admin/properties/:propertyId/approve
 * Approve a property listing
 */
router.post(
  '/:propertyId/approve',
  validateRequest(approvePropertySchema, 'body'),
  propertyApprovalController.approveProperty
);

/**
 * POST /api/admin/properties/:propertyId/reject
 * Reject a property listing with reason
 */
router.post(
  '/:propertyId/reject',
  validateRequest(rejectPropertySchema, 'body'),
  propertyApprovalController.rejectProperty
);

/**
 * PUT /api/admin/properties/:propertyId/suspend
 * Suspend an approved property
 */
router.put('/:propertyId/suspend', propertyApprovalController.suspendProperty);

/**
 * PUT /api/admin/properties/:propertyId/unsuspend
 * Unsuspend a suspended property
 */
router.put('/:propertyId/unsuspend', propertyApprovalController.unsuspendProperty);

/**
 * POST /api/admin/properties/bulk-approve
 * Bulk approve multiple properties
 */
router.post(
  '/bulk-approve',
  validateRequest(bulkPropertyActionSchema, 'body'),
  propertyApprovalController.bulkApproveProperties
);

/**
 * POST /api/admin/properties/bulk-reject
 * Bulk reject multiple properties
 */
router.post(
  '/bulk-reject',
  validateRequest(bulkPropertyActionSchema, 'body'),
  propertyApprovalController.bulkRejectProperties
);

/**
 * GET /api/admin/properties/stats
 * Get property approval statistics
 */
router.get('/stats', propertyApprovalController.getPropertyStats);

/**
 * GET /api/admin/properties/:propertyId/documents
 * Get all legal documents for a property
 */
router.get('/:propertyId/documents', propertyApprovalController.getPropertyDocuments);

export default router;