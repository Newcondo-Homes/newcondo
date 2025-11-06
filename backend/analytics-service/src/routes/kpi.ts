import { Router } from 'express';
import { KPIController } from '../controllers/kpiController';
import { authMiddleware } from '../../../shared/src/middleware/auth';
import { adminAuthMiddleware } from '../../../shared/src/middleware/adminAuth';

const router = Router();
const kpiController = new KPIController();

// All KPI routes require authentication and admin role
router.use(authMiddleware);
router.use(adminAuthMiddleware);

// Get all KPIs
router.get(
  '/',
  kpiController.getAllKPIs.bind(kpiController)
);

// Get user KPIs
router.get(
  '/users',
  kpiController.getUserKPIs.bind(kpiController)
);

// Get property KPIs
router.get(
  '/properties',
  kpiController.getPropertyKPIs.bind(kpiController)
);

// Get revenue KPIs
router.get(
  '/revenue',
  kpiController.getRevenueKPIs.bind(kpiController)
);

// Get engagement KPIs
router.get(
  '/engagement',
  kpiController.getEngagementKPIs.bind(kpiController)
);

// Get conversion KPIs
router.get(
  '/conversions',
  kpiController.getConversionKPIs.bind(kpiController)
);

// Get marking service KPIs
router.get(
  '/marking-service',
  kpiController.getMarkingServiceKPIs.bind(kpiController)
);

// Calculate custom KPI
router.post(
  '/custom',
  kpiController.calculateCustomKPI.bind(kpiController)
);

export default router;