import { Router } from 'express';
import { releaseController } from '../controllers/releaseController';
import { authMiddleware } from '../../../shared/src/middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   POST /api/releases/:rentalId/release
 * @desc    Manually release payment (admin only)
 * @access  Private (Admin only)
 */
router.post(
  '/:rentalId/release',
  releaseController.releasePayment
);

/**
 * @route   GET /api/releases/:rentalId/status
 * @desc    Get release status for rental
 * @access  Private
 */
router.get(
  '/:rentalId/status',
  releaseController.getReleaseStatus
);

/**
 * @route   GET /api/releases/pending
 * @desc    Get all pending releases (admin only)
 * @access  Private (Admin only)
 */
router.get(
  '/pending',
  releaseController.getPendingReleases
);

/**
 * @route   GET /api/releases/history
 * @desc    Get release history for user
 * @access  Private
 */
router.get(
  '/history',
  releaseController.getReleaseHistory
);

export default router;