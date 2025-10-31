import { Router } from 'express';
import { duplicateController } from '../controllers/duplicateController';
import { authenticateAdmin } from '../middleware/adminAuth';
import { validateRequest } from '../middleware/adminValidation';
import {
  duplicateListSchema,
  resolveDuplicateSchema,
  mergeDuplicateSchema,
} from '../validations/duplicateSchemas';

const router = Router();

// Apply admin authentication to all routes
router.use(authenticateAdmin);

/**
 * GET /api/admin/duplicates
 * Get all duplicate property reports
 */
router.get(
  '/',
  validateRequest(duplicateListSchema, 'query'),
  duplicateController.getDuplicates
);

/**
 * GET /api/admin/duplicates/pending
 * Get pending duplicate reports
 */
router.get('/pending', duplicateController.getPendingDuplicates);

/**
 * GET /api/admin/duplicates/:duplicateId
 * Get detailed duplicate report information
 */
router.get('/:duplicateId', duplicateController.getDuplicateDetails);

/**
 * GET /api/admin/duplicates/:duplicateId/comparison
 * Compare properties in duplicate report
 */
router.get('/:duplicateId/comparison', duplicateController.compareProperties);

/**
 * POST /api/admin/duplicates/:duplicateId/confirm
 * Confirm properties as duplicates
 */
router.post(
  '/:duplicateId/confirm',
  validateRequest(resolveDuplicateSchema, 'body'),
  duplicateController.confirmDuplicate
);

/**
 * POST /api/admin/duplicates/:duplicateId/dismiss
 * Dismiss duplicate report as not duplicate
 */
router.post(
  '/:duplicateId/dismiss',
  validateRequest(resolveDuplicateSchema, 'body'),
  duplicateController.dismissDuplicate
);

/**
 * POST /api/admin/duplicates/:duplicateId/merge
 * Merge duplicate properties
 */
router.post(
  '/:duplicateId/merge',
  validateRequest(mergeDuplicateSchema, 'body'),
  duplicateController.mergeProperties
);

/**
 * DELETE /api/admin/duplicates/:duplicateId/remove-duplicate
 * Remove duplicate property listing
 */
router.delete('/:duplicateId/remove-duplicate', duplicateController.removeDuplicateProperty);

/**
 * GET /api/admin/duplicates/stats
 * Get duplicate detection statistics
 */
router.get('/stats', duplicateController.getDuplicateStats);

/**
 * GET /api/admin/duplicates/property/:propertyId
 * Check for duplicates of a specific property
 */
router.get('/property/:propertyId', duplicateController.checkPropertyDuplicates);

/**
 * POST /api/admin/duplicates/scan
 * Trigger duplicate scan across platform
 */
router.post('/scan', duplicateController.triggerDuplicateScan);

/**
 * GET /api/admin/duplicates/:duplicateId/history
 * Get duplicate resolution history
 */
router.get('/:duplicateId/history', duplicateController.getDuplicateHistory);

/**
 * PUT /api/admin/duplicates/:duplicateId/reassign
 * Reassign duplicate report to different admin
 */
router.put('/:duplicateId/reassign', duplicateController.reassignDuplicate);

/**
 * GET /api/admin/duplicates/user/:userId
 * Get duplicate reports involving a specific user
 */
router.get('/user/:userId', duplicateController.getUserDuplicates);

export default router;