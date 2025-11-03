// backend/referral-service/src/routes/subAgents.ts

import { Router } from 'express';
import { subAgentController } from '../controllers/subAgentController';
import { auth } from '../../../shared/src/middleware/auth';
import { rateLimiter } from '../../../shared/src/middleware/rateLimiter';

const router = Router();

// Apply authentication to all routes
router.use(auth);

// Apply rate limiting
router.use(rateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }));

/**
 * @route   POST /api/sub-agents/request
 * @desc    Request to promote a property (become sub-agent)
 * @access  Private (Agent)
 * @body    { propertyId, message? }
 */
router.post(
  '/request',
  subAgentController.requestPromotion.bind(subAgentController)
);

/**
 * @route   GET /api/sub-agents/requests
 * @desc    Get promotion requests for property owner/listing agent
 * @access  Private (Owner/Agent)
 * @query   propertyId?, status?, page, limit
 */
router.get(
  '/requests',
  subAgentController.getPromotionRequests.bind(subAgentController)
);

/**
 * @route   PUT /api/sub-agents/requests/:requestId
 * @desc    Approve or reject promotion request
 * @access  Private (Owner/Listing Agent)
 * @body    { action: 'approve' | 'reject', rejectionReason? }
 */
router.put(
  '/requests/:requestId',
  subAgentController.handlePromotionRequest.bind(subAgentController)
);

/**
 * @route   GET /api/sub-agents/property/:propertyId
 * @desc    Get sub-agents for a property
 * @access  Private (Owner/Listing Agent)
 */
router.get(
  '/property/:propertyId',
  subAgentController.getPropertySubAgents.bind(subAgentController)
);

/**
 * @route   DELETE /api/sub-agents/property/:propertyId/agent/:subAgentId
 * @desc    Remove sub-agent from property
 * @access  Private (Owner/Listing Agent)
 */
router.delete(
  '/property/:propertyId/agent/:subAgentId',
  subAgentController.removeSubAgent.bind(subAgentController)
);

/**
 * @route   GET /api/sub-agents/my-properties
 * @desc    Get properties where user is sub-agent
 * @access  Private (Agent)
 * @query   page, limit
 */
router.get(
  '/my-properties',
  subAgentController.getSubAgentProperties.bind(subAgentController)
);

/**
 * @route   PUT /api/sub-agents/property/:propertyId/settings
 * @desc    Update property promotion settings
 * @access  Private (Owner/Listing Agent)
 * @body    { promotionType: 'PUBLIC' | 'PERMISSION_BASED' | 'RESTRICTED' | 'REQUEST_BASED' }
 */
router.put(
  '/property/:propertyId/settings',
  subAgentController.updatePromotionSettings.bind(subAgentController)
);

export default router;