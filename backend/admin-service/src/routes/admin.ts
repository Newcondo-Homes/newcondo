import { Router } from 'express';
import { adminController } from '../controllers/adminController';
import { authenticateAdmin } from '../middleware/adminAuth';
import { validateRequest } from '../middleware/adminValidation';
import { adminDashboardStatsSchema, activityLogSchema } from '../validations/adminSchemas';

const router = Router();

// Apply admin authentication to all routes
router.use(authenticateAdmin);

/**
 * GET /api/admin/dashboard/stats
 * Get dashboard overview statistics
 */
router.get(
  '/dashboard/stats',
  validateRequest(adminDashboardStatsSchema, 'query'),
  adminController.getDashboardStats
);

/**
 * GET /api/admin/activity-logs
 * Get recent admin activity logs
 */
router.get(
  '/activity-logs',
  validateRequest(activityLogSchema, 'query'),
  adminController.getActivityLogs
);

/**
 * GET /api/admin/pending-actions
 * Get count of pending actions requiring admin attention
 */
router.get('/pending-actions', adminController.getPendingActions);

/**
 * POST /api/admin/log-action
 * Log an admin action for audit trail
 */
router.post('/log-action', adminController.logAdminAction);

/**
 * GET /api/admin/notifications
 * Get admin notifications (alerts, warnings, etc.)
 */
router.get('/notifications', adminController.getAdminNotifications);

/**
 * PUT /api/admin/notifications/:id/read
 * Mark notification as read
 */
router.put('/notifications/:id/read', adminController.markNotificationAsRead);

export default router;