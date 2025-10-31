import { Router } from 'express';
import { userController } from '../controllers/userController';
import { authenticateAdmin } from '../middleware/adminAuth';
import { validateRequest } from '../middleware/adminValidation';
import {
  userListSchema,
  updateUserSchema,
  suspendUserSchema,
  searchUserSchema,
} from '../validations/userSchemas';

const router = Router();

// Apply admin authentication to all routes
router.use(authenticateAdmin);

/**
 * GET /api/admin/users
 * Get all users with pagination and filters
 */
router.get(
  '/',
  validateRequest(userListSchema, 'query'),
  userController.getUsers
);

/**
 * GET /api/admin/users/search
 * Search users by email, phone, or name
 */
router.get(
  '/search',
  validateRequest(searchUserSchema, 'query'),
  userController.searchUsers
);

/**
 * GET /api/admin/users/:userId
 * Get detailed user information
 */
router.get('/:userId', userController.getUserDetails);

/**
 * GET /api/admin/users/:userId/properties
 * Get all properties listed by a user
 */
router.get('/:userId/properties', userController.getUserProperties);

/**
 * GET /api/admin/users/:userId/rentals
 * Get user's rental history
 */
router.get('/:userId/rentals', userController.getUserRentals);

/**
 * GET /api/admin/users/:userId/payments
 * Get user's payment history
 */
router.get('/:userId/payments', userController.getUserPayments);

/**
 * GET /api/admin/users/:userId/marking-jobs
 * Get user's property marking job history
 */
router.get('/:userId/marking-jobs', userController.getUserMarkingJobs);

/**
 * PUT /api/admin/users/:userId
 * Update user information
 */
router.put(
  '/:userId',
  validateRequest(updateUserSchema, 'body'),
  userController.updateUser
);

/**
 * POST /api/admin/users/:userId/suspend
 * Suspend a user account
 */
router.post(
  '/:userId/suspend',
  validateRequest(suspendUserSchema, 'body'),
  userController.suspendUser
);

/**
 * POST /api/admin/users/:userId/unsuspend
 * Unsuspend a user account
 */
router.post('/:userId/unsuspend', userController.unsuspendUser);

/**
 * DELETE /api/admin/users/:userId
 * Soft delete a user account
 */
router.delete('/:userId', userController.deleteUser);

/**
 * POST /api/admin/users/:userId/verify
 * Manually verify a user
 */
router.post('/:userId/verify', userController.manuallyVerifyUser);

/**
 * POST /api/admin/users/:userId/role
 * Change user role
 */
router.post('/:userId/role', userController.changeUserRole);

/**
 * GET /api/admin/users/stats
 * Get user statistics
 */
router.get('/stats', userController.getUserStats);

/**
 * GET /api/admin/users/:userId/virtual-account
 * Get user's virtual account details
 */
router.get('/:userId/virtual-account', userController.getUserVirtualAccount);

export default router;