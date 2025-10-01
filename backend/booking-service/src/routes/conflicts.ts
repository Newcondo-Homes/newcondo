import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authMiddleware } from '../../../shared/src/middleware/auth';
import { validate } from '../../../shared/src/middleware/validation';
import { conflictController } from '../controllers/conflictController';

const router = Router();

/**
 * @route   POST /api/booking/conflicts/check
 * @desc    Check for booking conflicts before payment
 * @access  Private
 */
router.post(
  '/conflicts/check',
  authMiddleware,
  [
    body('propertyId').isString().notEmpty().withMessage('Property ID is required'),
    body('unitId').optional().isString().withMessage('Unit ID must be a string'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
  ],
  validate,
  conflictController.checkConflicts
);

/**
 * @route   GET /api/booking/conflicts/property/:propertyId
 * @desc    Get all conflicts for a property
 * @access  Private (Owner/Admin)
 */
router.get(
  '/conflicts/property/:propertyId',
  authMiddleware,
  [
    param('propertyId').isString().notEmpty().withMessage('Property ID is required'),
    query('unitId').optional().isString().withMessage('Unit ID must be a string'),
    query('status')
      .optional()
      .isIn(['PENDING', 'RESOLVED', 'CANCELLED'])
      .withMessage('Invalid status'),
    query('from').optional().isISO8601().withMessage('From date must be valid'),
    query('to').optional().isISO8601().withMessage('To date must be valid'),
  ],
  validate,
  conflictController.getPropertyConflicts
);

/**
 * @route   POST /api/booking/conflicts/:conflictId/resolve
 * @desc    Resolve a booking conflict
 * @access  Private (Admin)
 */
router.post(
  '/conflicts/:conflictId/resolve',
  authMiddleware,
  [
    param('conflictId').isString().notEmpty().withMessage('Conflict ID is required'),
    body('resolution')
      .isIn(['REFUND_FIRST', 'REFUND_SECOND', 'BOTH_PROCEED', 'CANCEL_BOTH'])
      .withMessage('Invalid resolution'),
    body('notes').optional().isString().withMessage('Notes must be a string'),
  ],
  validate,
  conflictController.resolveConflict
);

/**
 * @route   GET /api/booking/conflicts/active
 * @desc    Get all active conflicts (Admin only)
 * @access  Private (Admin)
 */
router.get(
  '/conflicts/active',
  authMiddleware,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('severity')
      .optional()
      .isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
      .withMessage('Invalid severity'),
  ],
  validate,
  conflictController.getActiveConflicts
);

/**
 * @route   GET /api/booking/conflicts/user
 * @desc    Get user's booking conflicts
 * @access  Private
 */
router.get(
  '/conflicts/user',
  authMiddleware,
  [
    query('status')
      .optional()
      .isIn(['PENDING', 'RESOLVED', 'CANCELLED'])
      .withMessage('Invalid status'),
  ],
  validate,
  conflictController.getUserConflicts
);

/**
 * @route   POST /api/booking/conflicts/detect
 * @desc    Detect potential conflicts across platform
 * @access  Private (Admin/Cron)
 */
router.post(
  '/conflicts/detect',
  authMiddleware,
  [
    body('propertyIds').optional().isArray().withMessage('Property IDs must be an array'),
    body('lookAheadDays')
      .optional()
      .isInt({ min: 1, max: 30 })
      .withMessage('Look ahead days must be between 1 and 30'),
  ],
  validate,
  conflictController.detectConflicts
);

/**
 * @route   GET /api/booking/conflicts/:conflictId
 * @desc    Get conflict details
 * @access  Private
 */
router.get(
  '/conflicts/:conflictId',
  authMiddleware,
  [
    param('conflictId').isString().notEmpty().withMessage('Conflict ID is required'),
  ],
  validate,
  conflictController.getConflictDetails
);

/**
 * @route   POST /api/booking/conflicts/:conflictId/notify
 * @desc    Send notification about conflict to involved parties
 * @access  Private (Admin)
 */
router.post(
  '/conflicts/:conflictId/notify',
  authMiddleware,
  [
    param('conflictId').isString().notEmpty().withMessage('Conflict ID is required'),
    body('notificationType')
      .isIn(['EMAIL', 'SMS', 'PUSH', 'ALL'])
      .withMessage('Invalid notification type'),
    body('customMessage').optional().isString().withMessage('Custom message must be a string'),
  ],
  validate,
  conflictController.notifyConflict
);

/**
 * @route   POST /api/booking/conflicts/validate-availability
 * @desc    Validate property/unit availability in real-time
 * @access  Public
 */
router.post(
  '/conflicts/validate-availability',
  [
    body('propertyId').isString().notEmpty().withMessage('Property ID is required'),
    body('unitId').optional().isString().withMessage('Unit ID must be a string'),
    body('requestedDate').isISO8601().withMessage('Valid requested date is required'),
  ],
  validate,
  conflictController.validateAvailability
);

/**
 * @route   GET /api/booking/conflicts/statistics
 * @desc    Get conflict statistics (Admin only)
 * @access  Private (Admin)
 */
router.get(
  '/conflicts/statistics',
  authMiddleware,
  [
    query('from').optional().isISO8601().withMessage('From date must be valid'),
    query('to').optional().isISO8601().withMessage('To date must be valid'),
    query('groupBy')
      .optional()
      .isIn(['day', 'week', 'month'])
      .withMessage('Invalid groupBy value'),
  ],
  validate,
  conflictController.getConflictStatistics
);

/**
 * @route   POST /api/booking/conflicts/:conflictId/escalate
 * @desc    Escalate a conflict to higher priority
 * @access  Private (Admin)
 */
router.post(
  '/conflicts/:conflictId/escalate',
  authMiddleware,
  [
    param('conflictId').isString().notEmpty().withMessage('Conflict ID is required'),
    body('newSeverity')
      .isIn(['MEDIUM', 'HIGH', 'CRITICAL'])
      .withMessage('Invalid severity level'),
    body('reason').isString().notEmpty().withMessage('Escalation reason is required'),
  ],
  validate,
  conflictController.escalateConflict
);

/**
 * @route   DELETE /api/booking/conflicts/:conflictId
 * @desc    Delete/cancel a conflict record
 * @access  Private (Admin)
 */
router.delete(
  '/conflicts/:conflictId',
  authMiddleware,
  [
    param('conflictId').isString().notEmpty().withMessage('Conflict ID is required'),
    body('reason').isString().notEmpty().withMessage('Deletion reason is required'),
  ],
  validate,
  conflictController.deleteConflict
);

export default router;