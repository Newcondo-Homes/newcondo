import { Router } from 'express';
import { verificationController } from '../controllers/verificationController';
import { authenticateAdmin } from '../middleware/adminAuth';
import { validateRequest } from '../middleware/adminValidation';
import {
  verificationListSchema,
  verifyDocumentSchema,
  rejectDocumentSchema,
  bulkVerificationSchema,
} from '../validations/verificationSchemas';

const router = Router();

// Apply admin authentication to all routes
router.use(authenticateAdmin);

/**
 * GET /api/admin/verifications/pending
 * Get all pending user verifications
 */
router.get(
  '/pending',
  validateRequest(verificationListSchema, 'query'),
  verificationController.getPendingVerifications
);

/**
 * GET /api/admin/verifications/:userId
 * Get verification details for a specific user
 */
router.get('/:userId', verificationController.getUserVerificationDetails);

/**
 * GET /api/admin/verifications/:userId/documents
 * Get all documents for a user
 */
router.get('/:userId/documents', verificationController.getUserDocuments);

/**
 * POST /api/admin/verifications/:userId/verify
 * Approve user verification
 */
router.post(
  '/:userId/verify',
  validateRequest(verifyDocumentSchema, 'body'),
  verificationController.verifyUser
);

/**
 * POST /api/admin/verifications/:userId/reject
 * Reject user verification with reason
 */
router.post(
  '/:userId/reject',
  validateRequest(rejectDocumentSchema, 'body'),
  verificationController.rejectUser
);

/**
 * POST /api/admin/verifications/documents/:documentId/verify
 * Approve a specific document
 */
router.post(
  '/documents/:documentId/verify',
  verificationController.verifyDocument
);

/**
 * POST /api/admin/verifications/documents/:documentId/reject
 * Reject a specific document
 */
router.post(
  '/documents/:documentId/reject',
  validateRequest(rejectDocumentSchema, 'body'),
  verificationController.rejectDocument
);

/**
 * POST /api/admin/verifications/bulk-verify
 * Bulk verify multiple users
 */
router.post(
  '/bulk-verify',
  validateRequest(bulkVerificationSchema, 'body'),
  verificationController.bulkVerifyUsers
);

/**
 * GET /api/admin/verifications/stats
 * Get verification statistics
 */
router.get('/stats', verificationController.getVerificationStats);

export default router;