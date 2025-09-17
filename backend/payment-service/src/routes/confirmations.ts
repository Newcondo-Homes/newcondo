import { Router } from 'express';
import { auth } from '../../../shared/src/middleware/auth';
import { validateRequest } from '../../../shared/src/middleware/validation';
import { rateLimiter } from '../../../shared/src/middleware/rateLimiter';
import { confirmationController } from '../controllers/confirmationController';
import { z } from 'zod';

const router = Router();

// Validation schemas
const confirmPaymentSchema = z.object({
  body: z.object({
    action: z.enum(['confirm', 'dispute']),
    reason: z.string().min(10).max(500).optional(), // Required for disputes
    evidence: z.array(z.string().url()).optional() // Evidence URLs for disputes
  })
});

const extendConfirmationSchema = z.object({
  body: z.object({
    extensionHours: z.number().min(1).max(168), // Max 7 days extension
    reason: z.string().min(10).max(300)
  })
});

const bulkConfirmSchema = z.object({
  body: z.object({
    paymentIds: z.array(z.string().cuid()).max(50), // Max 50 payments at once
    action: z.enum(['confirm', 'dispute']),
    reason: z.string().min(10).max(500).optional()
  })
});

const disputeResolutionSchema = z.object({
  body: z.object({
    resolution: z.enum(['refund', 'release', 'partial_refund']),
    refundAmount: z.number().positive().optional(), // For partial refunds
    resolutionNotes: z.string().min(10).max(1000),
    notifyParties: z.boolean().default(true)
  })
});

const autoConfirmSchema = z.object({
  body: z.object({
    enabled: z.boolean(),
    confirmationWindow: z.number().min(24).max(168) // 1-7 days in hours
  })
});

// Routes

/**
 * @route GET /api/confirmations/pending
 * @desc Get pending payment confirmations for user
 * @access Private
 */
router.get(
  '/pending',
  auth,
  confirmationController.getPendingConfirmations
);

/**
 * @route GET /api/confirmations/:paymentId
 * @desc Get confirmation details for specific payment
 * @access Private (Payment stakeholder)
 */
router.get(
  '/:paymentId',
  auth,
  confirmationController.getConfirmationDetails
);

/**
 * @route POST /api/confirmations/:paymentId/confirm
 * @desc Confirm or dispute a payment
 * @access Private (Renter for rent payments, Property owner for received payments)
 */
router.post(
  '/:paymentId/confirm',
  auth,
  rateLimiter(20, 60), // 20 confirmations per hour
  validateRequest(confirmPaymentSchema),
  confirmationController.confirmPayment
);

/**
 * @route POST /api/confirmations/:paymentId/extend
 * @desc Request extension for confirmation deadline
 * @access Private (Payment stakeholder)
 */
router.post(
  '/:paymentId/extend',
  auth,
  rateLimiter(3, 24 * 60), // 3 extensions per day
  validateRequest(extendConfirmationSchema),
  confirmationController.extendConfirmationDeadline
);

/**
 * @route GET /api/confirmations/:paymentId/history
 * @desc Get confirmation action history
 * @access Private (Payment stakeholder)
 */
router.get(
  '/:paymentId/history',
  auth,
  confirmationController.getConfirmationHistory
);

/**
 * @route POST /api/confirmations/bulk
 * @desc Bulk confirm or dispute multiple payments
 * @access Private
 */
router.post(
  '/bulk',
  auth,
  rateLimiter(5, 60), // 5 bulk actions per hour
  validateRequest(bulkConfirmSchema),
  confirmationController.bulkConfirmPayments
);

/**
 * @route GET /api/confirmations/statistics
 * @desc Get confirmation statistics for user
 * @access Private
 */
router.get(
  '/statistics',
  auth,
  confirmationController.getConfirmationStatistics
);

/**
 * @route GET /api/confirmations/expiring
 * @desc Get confirmations expiring within specified timeframe
 * @access Private
 */
router.get(
  '/expiring',
  auth,
  confirmationController.getExpiringConfirmations
);

/**
 * @route POST /api/confirmations/auto-confirm
 * @desc Configure auto-confirmation settings
 * @access Private
 */
router.post(
  '/auto-confirm',
  auth,
  rateLimiter(5, 60), // 5 configuration changes per hour
  validateRequest(autoConfirmSchema),
  confirmationController.configureAutoConfirm
);

/**
 * @route GET /api/confirmations/auto-confirm
 * @desc Get auto-confirmation settings
 * @access Private
 */
router.get(
  '/auto-confirm',
  auth,
  confirmationController.getAutoConfirmSettings
);

/**
 * @route POST /api/confirmations/:paymentId/release
 * @desc Manually release payment (admin or system trigger)
 * @access Private (Admin or automated system)
 */
router.post(
  '/:paymentId/release',
  auth,
  rateLimiter(10, 60), // 10 releases per hour
  confirmationController.releasePayment
);

/**
 * @route GET /api/confirmations/disputes
 * @desc Get payment disputes for user
 * @access Private
 */
router.get(
  '/disputes',
  auth,
  confirmationController.getPaymentDisputes
);

/**
 * @route POST /api/confirmations/disputes/:disputeId/resolve
 * @desc Resolve a payment dispute (Admin only)
 * @access Private (Admin)
 */
router.post(
  '/disputes/:disputeId/resolve',
  auth,
  rateLimiter(10, 60), // 10 dispute resolutions per hour
  validateRequest(disputeResolutionSchema),
  confirmationController.resolveDispute
);

/**
 * @route GET /api/confirmations/disputes/:disputeId/evidence
 * @desc Get dispute evidence files
 * @access Private (Dispute stakeholder or Admin)
 */
router.get(
  '/disputes/:disputeId/evidence',
  auth,
  confirmationController.getDisputeEvidence
);

/**
 * @route POST /api/confirmations/disputes/:disputeId/evidence
 * @desc Add evidence to dispute
 * @access Private (Dispute stakeholder)
 */
router.post(
  '/disputes/:disputeId/evidence',
  auth,
  rateLimiter(10, 60), // 10 evidence uploads per hour
  validateRequest(z.object({
    body: z.object({
      evidenceUrls: z.array(z.string().url()).max(10),
      description: z.string().max(500).optional()
    })
  })),
  confirmationController.addDisputeEvidence
);

/**
 * @route POST /api/confirmations/:paymentId/reminder
 * @desc Send confirmation reminder to relevant party
 * @access Private
 */
router.post(
  '/:paymentId/reminder',
  auth,
  rateLimiter(5, 24 * 60), // 5 reminders per day
  confirmationController.sendConfirmationReminder
);

/**
 * @route GET /api/confirmations/overdue
 * @desc Get overdue confirmations (past deadline)
 * @access Private
 */
router.get(
  '/overdue',
  auth,
  confirmationController.getOverdueConfirmations
);

/**
 * @route POST /api/confirmations/batch-process
 * @desc Process batch of expired confirmations (system/admin)
 * @access Private (Admin or system)
 */
router.post(
  '/batch-process',
  auth,
  rateLimiter(2, 60), // 2 batch processes per hour
  validateRequest(z.object({
    body: z.object({
      action: z.enum(['auto_confirm', 'auto_dispute', 'extend_deadline']),
      paymentIds: z.array(z.string().cuid()).max(100),
      reason: z.string().max(500).optional()
    })
  })),
  confirmationController.batchProcessConfirmations
);

/**
 * @route GET /api/confirmations/reports/summary
 * @desc Get confirmation summary report
 * @access Private
 */
router.get(
  '/reports/summary',
  auth,
  confirmationController.getConfirmationSummaryReport
);

export default router;

// import express from 'express';
// import { authMiddleware } from '../../../shared/src/middleware/auth';
// import { validateRequest } from '../../../shared/src/middleware/validation';
// import { paymentValidation } from '../middleware/paymentValidation';
// import {
//   confirmPayment,
//   rejectPayment,
//   getPaymentConfirmationStatus,
//   getPendingConfirmations,
//   autoConfirmExpiredPayments,
//   extendConfirmationPeriod,
//   bulkConfirmPayments,
//   getConfirmationHistory,
//   sendConfirmationReminder,
//   updateConfirmationSettings,
//   getConfirmationStats
// } from '../controllers/confirmationController';

// const router = express.Router();

// // Apply auth middleware to all routes
// router.use(authMiddleware);

// /**
//  * @route   POST /api/confirmations/:paymentId/confirm
//  * @desc    Confirm a successful payment
//  * @access  Private
//  * @body    { confirmationCode?, notes? }
//  */
// router.post(
//   '/:paymentId/confirm',
//   validateRequest(paymentValidation.confirmPayment),
//   confirmPayment
// );

// /**
//  * @route   POST /api/confirmations/:paymentId/reject
//  * @desc    Reject/dispute a payment
//  * @access  Private
//  * @body    { reason, description?, evidence? }
//  */
// router.post(
//   '/:paymentId/reject',
//   validateRequest(paymentValidation.rejectPayment),
//   rejectPayment
// );

// /**
//  * @route   GET /api/confirmations/:paymentId/status
//  * @desc    Get payment confirmation status
//  * @access  Private
//  */
// router.get(
//   '/:paymentId/status',
//   validateRequest(paymentValidation.getPaymentConfirmationStatus),
//   getPaymentConfirmationStatus
// );

// /**
//  * @route   GET /api/confirmations/pending
//  * @desc    Get pending payment confirmations for user
//  * @access  Private
//  * @query   { paymentType?, page?, limit?, sortBy? }
//  */
// router.get(
//   '/pending',
//   validateRequest(paymentValidation.getPendingConfirmations),
//   getPendingConfirmations
// );

// /**
//  * @route   GET /api/confirmations/history
//  * @desc    Get confirmation history for user
//  * @access  Private
//  * @query   { status?, paymentType?, startDate?, endDate?, page?, limit? }
//  */
// router.get(
//   '/history',
//   validateRequest(paymentValidation.getConfirmationHistory),
//   getConfirmationHistory
// );

// /**
//  * @route   POST /api/confirmations/:paymentId/extend
//  * @desc    Extend confirmation period
//  * @access  Private
//  * @body    { extensionDays, reason? }
//  */
// router.post(
//   '/:paymentId/extend',
//   validateRequest(paymentValidation.extendConfirmationPeriod),
//   extendConfirmationPeriod
// );

// /**
//  * @route   POST /api/confirmations/:paymentId/reminder
//  * @desc    Send confirmation reminder
//  * @access  Private
//  * @body    { reminderType?, customMessage? }
//  */
// router.post(
//   '/:paymentId/reminder',
//   validateRequest(paymentValidation.sendConfirmationReminder),
//   sendConfirmationReminder
// );

// /**
//  * @route   POST /api/confirmations/bulk-confirm
//  * @desc    Bulk confirm multiple payments
//  * @access  Private
//  * @body    { paymentIds: string[], notes? }
//  */
// router.post(
//   '/bulk-confirm',
//   validateRequest(paymentValidation.bulkConfirmPayments),
//   bulkConfirmPayments
// );

// /**
//  * @route   PUT /api/confirmations/settings
//  * @desc    Update user confirmation preferences
//  * @access  Private
//  * @body    { autoConfirmAfterDays?, emailReminders?, smsReminders?, reminderFrequency? }
//  */
// router.put(
//   '/settings',
//   validateRequest(paymentValidation.updateConfirmationSettings),
//   updateConfirmationSettings
// );

// /**
//  * @route   GET /api/confirmations/stats
//  * @desc    Get confirmation statistics for user
//  * @access  Private
//  * @query   { period?, startDate?, endDate? }
//  */
// router.get(
//   '/stats',
//   validateRequest(paymentValidation.getConfirmationStats),
//   getConfirmationStats
// );

// // System/Admin routes for automated processes

// /**
//  * @route   POST /api/confirmations/auto-confirm
//  * @desc    Auto-confirm expired payments (system/cron job)
//  * @access  Private (System/Admin only)
//  * @body    { dryRun?, batchSize? }
//  */
// router.post(
//   '/auto-confirm',
//   validateRequest(paymentValidation.autoConfirmExpiredPayments),
//   autoConfirmExpiredPayments
// );

// /**
//  * @route   GET /api/confirmations/system/pending-count
//  * @desc    Get count of pending confirmations system-wide
//  * @access  Private (Admin only)
//  * @query   { olderThanDays? }
//  */
// router.get('/system/pending-count', (req, res) => {
//   // This would typically be handled by a system controller
//   // Placeholder for system-level confirmation monitoring
//   res.status(200).json({
//     status: 'success',
//     message: 'System confirmation monitoring endpoint',
//     timestamp: new Date().toISOString()
//   });
// });

// /**
//  * @route   GET /api/confirmations/health
//  * @desc    Health check for confirmation service
//  * @access  Public
//  */
// router.get('/health', (req, res) => {
//   res.status(200).json({
//     status: 'success',
//     message: 'Confirmation service is healthy',
//     timestamp: new Date().toISOString()
//   });
// });

// export default router;