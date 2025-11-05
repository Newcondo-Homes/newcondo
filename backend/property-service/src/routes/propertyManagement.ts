// backend/property-service/src/routes/propertyManagement.ts

import express from 'express';
import propertyManagementController from '../controllers/propertyManagementController';
import { authMiddleware } from '../../shared/src/middleware/auth';
import {
  verifyPropertyOwnership,
  verifyPropertyOwnerOnly,
  verifyUnitOwnership,
} from '../middleware/ownershipValidation';
import {
  checkPropertyEditableStatus,
  checkPropertyDeletable,
  rateLimitPropertyUpdates,
  logPropertyAccess,
} from '../middleware/propertyAccessControl';

const router = express.Router();

/**
 * All routes require authentication
 */
router.use(authMiddleware);

/**
 * Get all properties for the authenticated user
 * GET /api/property-management/properties
 */
router.get(
  '/properties',
  propertyManagementController.getUserProperties
);

/**
 * Get management dashboard
 * GET /api/property-management/dashboard
 */
router.get(
  '/dashboard',
  propertyManagementController.getManagementDashboard
);

/**
 * Get single property details
 * GET /api/property-management/properties/:propertyId
 */
router.get(
  '/properties/:propertyId',
  verifyPropertyOwnership,
  logPropertyAccess,
  propertyManagementController.getPropertyDetails
);

/**
 * Update property information
 * PUT /api/property-management/properties/:propertyId
 */
router.put(
  '/properties/:propertyId',
  verifyPropertyOwnership,
  checkPropertyEditableStatus,
  rateLimitPropertyUpdates,
  propertyManagementController.updateProperty
);

/**
 * Update property boundary
 * PUT /api/property-management/properties/:propertyId/boundary
 */
router.put(
  '/properties/:propertyId/boundary',
  verifyPropertyOwnership,
  propertyManagementController.updatePropertyBoundary
);

/**
 * Delete a property
 * DELETE /api/property-management/properties/:propertyId
 */
router.delete(
  '/properties/:propertyId',
  verifyPropertyOwnerOnly,
  checkPropertyDeletable,
  propertyManagementController.deleteProperty
);

/**
 * Get unit management data (for multi-family properties)
 * GET /api/property-management/properties/:propertyId/units
 */
router.get(
  '/properties/:propertyId/units',
  verifyPropertyOwnership,
  propertyManagementController.getUnitManagement
);

/**
 * Update a specific unit
 * PUT /api/property-management/properties/:propertyId/units/:unitId
 */
router.put(
  '/properties/:propertyId/units/:unitId',
  verifyUnitOwnership,
  checkPropertyEditableStatus,
  propertyManagementController.updatePropertyUnit
);

/**
 * Get marking service history
 * GET /api/property-management/properties/:propertyId/marking-history
 */
router.get(
  '/properties/:propertyId/marking-history',
  verifyPropertyOwnership,
  propertyManagementController.getMarkingServiceHistory
);

/**
 * Verify property ownership/access
 * GET /api/property-management/properties/:propertyId/verify-access
 */
router.get(
  '/properties/:propertyId/verify-access',
  propertyManagementController.verifyPropertyAccess
);

export default router;