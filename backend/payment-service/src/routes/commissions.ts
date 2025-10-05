import { Router } from 'express';
import { commissionController } from '../controllers/commissionController';
import { authMiddleware } from '../../../shared/src/middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/commissions/:rentalId/calculate
 * @desc    Calculate commission breakdown
 * @access  Private
 */
router.get(
  '/:rentalId/calculate',
  commissionController.calculateCommission
);

/**
 * @route   GET /api/commissions/history
 * @desc    Get commission history for user
 * @access  Private
 */
router.get(
  '/history',
  commissionController.getCommissionHistory
);

/**
 * @route   GET /api/commissions/totals
 * @desc    Get total commissions earned
 * @access  Private
 */
router.get(
  '/totals',
  commissionController.getTotalCommissions
);

/**
 * @route   GET /api/commissions/platform/stats
 * @desc    Get platform commission statistics (admin only)
 * @access  Private (Admin only)
 */
router.get(
  '/platform/stats',
  commissionController.getPlatformCommissions
);

export default router;