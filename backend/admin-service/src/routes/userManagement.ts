import { Router } from 'express';
import { userManagementController } from '../controllers/userManagementController';
import { authMiddleware } from '../../../shared/src/middleware/auth';
import { adminAuth } from '../middleware/adminAnalyticsAuth';
import { analyticsValidation } from '../middleware/analyticsValidation';

const router = Router();

router.use(authMiddleware);
router.use(adminAuth);

// Get all users
router.get(
  '/',
  analyticsValidation.validateUserQuery,
  userManagementController.getUsers
);

// Get user profile
router.get('/:id/profile', userManagementController.getUserProfile);

// Get user activity
router.get(
  '/:id/activity',
  analyticsValidation.validatePagination,
  userManagementController.getUserActivity
);

// Update user status
router.patch(
  '/:id/status',
  analyticsValidation.validateUserStatus,
  userManagementController.updateUserStatus
);

// Get user statistics
router.get(
  '/stats/overview',
  analyticsValidation.validateDateRange,
  userManagementController.getUserStats
);

// Get inactive users
router.get('/inactive/list', userManagementController.getInactiveUsers);

// Bulk user operations
router.post(
  '/bulk',
  analyticsValidation.validateBulkOperation,
  userManagementController.bulkUserOperation
);

// Get cohort analysis
router.get(
  '/analytics/cohort',
  analyticsValidation.validateCohortQuery,
  userManagementController.getCohortAnalysis
);

export default router;