import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController';
import { authMiddleware } from '../../../shared/src/middleware/auth';
import { adminAuthMiddleware } from '../../../shared/src/middleware/adminAuth';

const router = Router();
const dashboardController = new DashboardController();

// All dashboard routes require authentication and admin role
router.use(authMiddleware);
router.use(adminAuthMiddleware);

// Dashboard overview
router.get(
  '/overview',
  dashboardController.getDashboardOverview.bind(dashboardController)
);

// Real-time metrics
router.get(
  '/real-time',
  dashboardController.getRealTimeMetrics.bind(dashboardController)
);

// Platform health
router.get(
  '/health',
  dashboardController.getPlatformHealth.bind(dashboardController)
);

// User activity
router.get(
  '/user-activity',
  dashboardController.getUserActivity.bind(dashboardController)
);

// Property performance
router.get(
  '/property-performance',
  dashboardController.getPropertyPerformance.bind(dashboardController)
);

// Revenue summary
router.get(
  '/revenue',
  dashboardController.getRevenueSummary.bind(dashboardController)
);

// Agent performance
router.get(
  '/agent-performance',
  dashboardController.getAgentPerformance.bind(dashboardController)
);

// Recent activity feed
router.get(
  '/recent-activity',
  dashboardController.getRecentActivity.bind(dashboardController)
);

// Alerts
router.get(
  '/alerts',
  dashboardController.getAlerts.bind(dashboardController)
);

export default router;