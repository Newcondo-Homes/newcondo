import { Router } from 'express';
import { 
  createProperty,
  getAllProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  getUserProperties,
  updatePropertyStatus,
  getPropertyStats,
  checkPropertyAvailability,
  lockProperty,
  unlockProperty,
  getPropertyViews,
  incrementPropertyView,
  getPropertiesByBoundingBox,
  getNearbyProperties,
  validatePropertyBoundary,
  getPropertyBoundaryConflicts,
  bulkCreateUnits,
  updateUnit,
  deleteUnit,
  getPropertyUnits,
  publishProperty,
  unpublishProperty
} from '../controllers/propertyController';
import {
  validateCreateProperty,
  validateUpdateProperty,
  validateBoundary,
  validateOwnership,
  validatePropertyUnits,
  createPropertyRateLimit
} from '../middleware/propertyValidation';
import { authMiddleware, adminAuthMiddleware } from '../../../shared/src/middleware/auth';

const router = Router();

// Public routes - no authentication required
router.get('/', getAllProperties); // Get all published properties with filters
router.get('/search', getPropertiesByBoundingBox); // Map-based search
router.get('/nearby/:id', getNearbyProperties); // Get properties near a specific property
router.get('/:id', getPropertyById); // Get single property by ID
router.get('/:id/stats', getPropertyStats); // Public stats (views, etc.)
router.post('/:id/view', incrementPropertyView); // Track property views

// Protected routes - authentication required
router.use(authMiddleware); // All routes below require authentication

// Property creation and management
router.post(
  '/',
  createPropertyRateLimit,
  validateCreateProperty,
  createProperty
);

router.put(
  '/:id',
  validateUpdateProperty,
  validateOwnership,
  updateProperty
);

router.delete(
  '/:id',
  validateOwnership,
  deleteProperty
);

// Property status management
router.patch(
  '/:id/status',
  validateOwnership,
  updatePropertyStatus
);

router.patch(
  '/:id/publish',
  validateOwnership,
  publishProperty
);

router.patch(
  '/:id/unpublish',
  validateOwnership,
  unpublishProperty
);

// User property management
router.get('/user/my-properties', getUserProperties);
router.get('/user/properties/:userId', getUserProperties); // Get properties by user ID

// Property availability and locking
router.get('/:id/availability', checkPropertyAvailability);
router.post('/:id/lock', lockProperty); // Lock property during payment
router.delete('/:id/lock', unlockProperty); // Remove property lock

// Property boundary and duplicate prevention
router.post(
  '/:id/boundary/validate',
  validateBoundary,
  validateOwnership,
  validatePropertyBoundary
);

router.get(
  '/:id/boundary/conflicts',
  validateOwnership,
  getPropertyBoundaryConflicts
);

// Multi-family property unit management
router.get('/:id/units', getPropertyUnits);

router.post(
  '/:id/units',
  validatePropertyUnits,
  validateOwnership,
  bulkCreateUnits
);

router.put(
  '/:id/units/:unitId',
  validateOwnership,
  updateUnit
);

router.delete(
  '/:id/units/:unitId',
  validateOwnership,
  deleteUnit
);

// Property views and analytics
router.get('/:id/views', getPropertyViews);

// Admin only routes
router.use(adminAuthMiddleware);

// Admin property management
router.get('/admin/all', getAllProperties); // Get all properties including drafts
router.patch('/admin/:id/approve', updatePropertyStatus); // Approve property
router.patch('/admin/:id/reject', updatePropertyStatus); // Reject property
router.get('/admin/stats', getPropertyStats); // Platform-wide stats

export default router;