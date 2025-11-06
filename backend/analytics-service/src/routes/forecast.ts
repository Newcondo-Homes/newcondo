import { Router } from 'express';
import { ForecastController } from '../controllers/forecastController';
import { authMiddleware } from '../../../shared/src/middleware/auth';
import { adminAuthMiddleware } from '../../../shared/src/middleware/adminAuth';

const router = Router();
const forecastController = new ForecastController();

// All forecast routes require authentication and admin role
router.use(authMiddleware);
router.use(adminAuthMiddleware);

// Revenue forecast
router.get(
  '/revenue',
  forecastController.getRevenueForecast.bind(forecastController)
);

// User growth forecast
router.get(
  '/user-growth',
  forecastController.getUserGrowthForecast.bind(forecastController)
);

// Property forecast
router.get(
  '/properties',
  forecastController.getPropertyForecast.bind(forecastController)
);

// Demand forecast
router.get(
  '/demand',
  forecastController.getDemandForecast.bind(forecastController)
);

// Churn prediction
router.get(
  '/churn',
  forecastController.getChurnPrediction.bind(forecastController)
);

// Agent performance forecast
router.get(
  '/agent-performance',
  forecastController.getAgentPerformanceForecast.bind(forecastController)
);

// Custom forecast
router.post(
  '/custom',
  forecastController.getCustomForecast.bind(forecastController)
);

// Forecast accuracy
router.get(
  '/accuracy',
  forecastController.getForecastAccuracy.bind(forecastController)
);

export default router;