import { Router } from 'express';
import { TrendsController } from '../controllers/trendsController';
import { authMiddleware } from '../../../shared/src/middleware/auth';
import { adminAuthMiddleware } from '../../../shared/src/middleware/adminAuth';

const router = Router();
const trendsController = new TrendsController();

// All trends routes require authentication and admin role
router.use(authMiddleware);
router.use(adminAuthMiddleware);

// User growth trends
router.get(
  '/user-growth',
  trendsController.getUserGrowthTrends.bind(trendsController)
);

// Revenue trends
router.get(
  '/revenue',
  trendsController.getRevenueTrends.bind(trendsController)
);

// Property trends
router.get(
  '/properties',
  trendsController.getPropertyTrends.bind(trendsController)
);

// Engagement trends
router.get(
  '/engagement',
  trendsController.getEngagementTrends.bind(trendsController)
);

// Geographic trends
router.get(
  '/geographic',
  trendsController.getGeographicTrends.bind(trendsController)
);

// Property type trends
router.get(
  '/property-types',
  trendsController.getPropertyTypeTrends.bind(trendsController)
);

// Payment method trends
router.get(
  '/payment-methods',
  trendsController.getPaymentMethodTrends.bind(trendsController)
);

// Seasonal trends
router.get(
  '/seasonal',
  trendsController.getSeasonalTrends.bind(trendsController)
);

// Anomaly detection
router.get(
  '/anomalies',
  trendsController.detectAnomalies.bind(trendsController)
);

export default router;