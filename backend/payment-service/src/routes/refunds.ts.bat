import { Router } from 'express';
import { refundController } from '../controllers/refundController';
import { authMiddleware } from '../../../shared/src/middleware/auth';
import { refundValidation } from '../middleware/refundValidation';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   POST /api/refunds/:rentalId/process
 * @desc    Process refund for disputed property (admin only)
 * @access  Private (Admin only)
 */
router.post(
  '/:rentalId/process',
  refundValidation.validateProcessRefund,
  refundController.processRefund
);

/**
 * @route   GET /api/refunds/:rentalId/status
 * @desc    Get refund status
 * @access  Private
 */
router.get(
  '/:rentalId/status',
  refundController.getRefundStatus
);

/**
 * @route   GET /api/refunds/pending
 * @desc    Get all pending refunds (admin only)
 * @access  Private (Admin only)
 */
router.get(
  '/pending',
  refundController.getPendingRefunds
);

/**
 * @route   GET /api/refunds/:rentalId/calculate
 * @desc    Calculate refund amount
 * @access  Private
 */
router.get(
  '/:rentalId/calculate',
  refundController.calculateRefund
);

export default router;