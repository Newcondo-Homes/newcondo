// backend/property-service/src/routes/propertyMarketing.ts

import express from 'express';
import propertyMarketingController from '../controllers/propertyMarketingController';
import { authMiddleware } from '../../shared/src/middleware/auth';
import { verifyPropertyOwnership, verifyAgentRole } from '../middleware/ownershipValidation';
import { verifyPropertyPublished } from '../middleware/propertyAccessControl';

const router = express.Router();

/**
 * Track property share (public endpoint - no auth required)
 * POST /api/property-marketing/properties/:propertyId/track-share
 */
router.post(
  '/properties/:propertyId/track-share',
  propertyMarketingController.trackPropertyShare
);

/**
 * All other routes require authentication
 */
router.use(authMiddleware);

/**
 * Get property marketing data
 * GET /api/property-marketing/properties/:propertyId
 */
router.get(
  '/properties/:propertyId',
  verifyPropertyOwnership,
  propertyMarketingController.getPropertyMarketingData
);

/**
 * Get or generate shareable link
 * GET /api/property-marketing/properties/:propertyId/shareable-link
 */
router.get(
  '/properties/:propertyId/shareable-link',
  verifyPropertyOwnership,
  propertyMarketingController.getShareableLink
);

/**
 * Generate agent promotion link
 * POST /api/property-marketing/properties/:propertyId/promotion-link
 */
router.post(
  '/properties/:propertyId/promotion-link',
  verifyAgentRole,
  verifyPropertyPublished,
  propertyMarketingController.generateAgentPromotionLink
);

/**
 * Update property promotion settings
 * PUT /api/property-marketing/properties/:propertyId/promotion-settings
 */
router.put(
  '/properties/:propertyId/promotion-settings',
  verifyPropertyOwnership,
  propertyMarketingController.updatePromotionSettings
);

/**
 * Request permission to promote property
 * POST /api/property-marketing/properties/:propertyId/request-promotion
 */
router.post(
  '/properties/:propertyId/request-promotion',
  verifyAgentRole,
  verifyPropertyPublished,
  propertyMarketingController.requestPromotionPermission
);

/**
 * Handle promotion request (approve/reject)
 * POST /api/property-marketing/properties/:propertyId/handle-promotion-request
 */
router.post(
  '/properties/:propertyId/handle-promotion-request',
  verifyPropertyOwnership,
  propertyMarketingController.handlePromotionRequest
);

/**
 * Track referral conversion
 * POST /api/property-marketing/properties/:propertyId/track-conversion
 */
router.post(
  '/properties/:propertyId/track-conversion',
  propertyMarketingController.trackReferralConversion
);

/**
 * Get sub-agent performance
 * GET /api/property-marketing/properties/:propertyId/sub-agents
 */
router.get(
  '/properties/:propertyId/sub-agents',
  verifyPropertyOwnership,
  propertyMarketingController.getSubAgentPerformance
);

/**
 * Generate QR code for property
 * GET /api/property-marketing/properties/:propertyId/qr-code
 */
router.get(
  '/properties/:propertyId/qr-code',
  verifyPropertyOwnership,
  propertyMarketingController.generatePropertyQRCode
);

/**
 * Get marketing analytics summary
 * GET /api/property-marketing/properties/:propertyId/analytics-summary
 */
router.get(
  '/properties/:propertyId/analytics-summary',
  verifyPropertyOwnership,
  propertyMarketingController.getMarketingAnalyticsSummary
);

/**
 * Copy promotion link (with tracking)
 * POST /api/property-marketing/properties/:propertyId/copy-link
 */
router.post(
  '/properties/:propertyId/copy-link',
  verifyAgentRole,
  propertyMarketingController.copyPromotionLink
);

export default router;