import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../../../shared/src/middleware/auth';
import { validateRequest } from '../../../shared/src/middleware/validation';
import * as confirmationOversightController from '../controllers/confirmationOversightController';
import { z } from 'zod';

const router = Router();

// All routes require admin authentication
router.use(authenticateToken);
router.use(requireAdmin);

// Validation schemas
const confirmationQuerySchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'DISPUTED', 'CANCELLED']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

const confirmationIdSchema = z.object({
  paymentId: z.string().cuid(),
});

const forceReleaseSchema = z.object({
  reason: z.string().min(10, 'Release reason must be at least 10 characters'),
  notifyParties: z.boolean().default(true),
});

const extendPeriodSchema = z.object({
  extensionHours: z.number().min(1).max(72), // Max 3 days extension
  reason: z.string().min(10),
});

// GET /api/admin/confirmations - Get all pending confirmations
router.get(
  '/',
  validateRequest({ query: confirmationQuerySchema }),
  confirmationOversightController.getAllConfirmations
);

// GET /api/admin/confirmations/stats - Get confirmation statistics
router.get(
  '/stats',
  confirmationOversightController.getConfirmationStats
);

// GET /api/admin/confirmations/:paymentId - Get specific confirmation details
router.get(
  '/:paymentId',
  validateRequest({ params: confirmationIdSchema }),
  confirmationOversightController.getConfirmationDetails
);

// POST /api/admin/confirmations/:paymentId/force-release - Force release payment
router.post(
  '/:paymentId/force-release',
  validateRequest({ 
    params: confirmationIdSchema,
    body: forceReleaseSchema 
  }),
  confirmationOversightController.forceReleasePayment
);

// POST /api/admin/confirmations/:paymentId/extend-period - Extend confirmation period
router.post(
  '/:paymentId/extend-period',
  validateRequest({ 
    params: confirmationIdSchema,
    body: extendPeriodSchema 
  }),
  confirmationOversightController.extendConfirmationPeriod
);

// POST /api/admin/confirmations/:paymentId/cancel - Cancel and refund payment
router.post(
  '/:paymentId/cancel',
  validateRequest({ 
    params: confirmationIdSchema,
    body: z.object({
      reason: z.string().min(10),
      refundAmount: z.number().positive().optional(),
    })
  }),
  confirmationOversightController.cancelPayment
);

// GET /api/admin/confirmations/:paymentId/timeline - Get payment timeline
router.get(
  '/:paymentId/timeline',
  validateRequest({ params: confirmationIdSchema }),
  confirmationOversightController.getPaymentTimeline
);

export default router;