// backend/property-service/src/routes/sharing.ts

import express from 'express';
import {
  generateShareableLink,
  getPropertyByShareableLink,
  revokeShareableLink,
  getSharingAnalytics
} from '../controllers/sharingController';
import { authenticateToken } from '../../../shared/src/middleware/auth';
import { validateRequest } from '../../../shared/src/middleware/validation';
import { param } from 'express-validator';

const router = express.Router();

/**
 * @route   POST /api/properties/:propertyId/share
 * @desc    Generate a shareable link for a property
 * @access  Private (Owner/Agent)
 */
router.post(
  '/:propertyId/share',
  authenticateToken,
  [
    param('propertyId').isString().notEmpty().withMessage('Property ID is required')
  ],
  validateRequest,
  generateShareableLink
);

/**
 * @route   GET /api/properties/shared/:shareableLink
 * @desc    Get property details by shareable link
 * @access  Public
 */
router.get(
  '/shared/:shareableLink',
  [
    param('shareableLink').isString().notEmpty().withMessage('Shareable link is required')
  ],
  validateRequest,
  getPropertyByShareableLink
);

/**
 * @route   DELETE /api/properties/:propertyId/share
 * @desc    Revoke/delete shareable link for a property
 * @access  Private (Owner/Agent)
 */
router.delete(
  '/:propertyId/share',
  authenticateToken,
  [
    param('propertyId').isString().notEmpty().withMessage('Property ID is required')
  ],
  validateRequest,
  revokeShareableLink
);

/**
 * @route   GET /api/properties/:propertyId/share/analytics
 * @desc    Get sharing analytics for a property
 * @access  Private (Owner/Agent)
 */
router.get(
  '/:propertyId/share/analytics',
  authenticateToken,
  [
    param('propertyId').isString().notEmpty().withMessage('Property ID is required')
  ],
  validateRequest,
  getSharingAnalytics
);

export default router;