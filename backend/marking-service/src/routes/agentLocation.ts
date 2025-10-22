// backend/marking-service/src/routes/agentLocation.ts
import { Router } from 'express';
import {
  updateAgentLocation,
  getAgentLocation,
  setServiceAreas,
  getServiceAreas,
  toggleAvailability,
  getAvailableAgents,
  getNearbyAgents,
  getAgentLocationHistory,
  validateServiceArea
} from '../controllers/agentLocationController';
import { authenticate, authorize } from '../middleware/auth';
import { validateLocationData } from '../middleware/queueValidation';

const router = Router();

/**
 * @route   POST /api/marking/agent-location/update
 * @desc    Update agent's current location
 * @access  Private (AGENT or RENTER with premium)
 */
router.post(
  '/update',
  authenticate,
  authorize(['AGENT', 'RENTER']),
  validateLocationData,
  updateAgentLocation
);

/**
 * @route   GET /api/marking/agent-location/me
 * @desc    Get authenticated agent's location details
 * @access  Private (AGENT or RENTER)
 */
router.get(
  '/me',
  authenticate,
  authorize(['AGENT', 'RENTER']),
  getAgentLocation
);

/**
 * @route   POST /api/marking/agent-location/service-areas
 * @desc    Set agent's service areas (States, LGAs, locations)
 * @access  Private (AGENT or RENTER with premium)
 */
router.post(
  '/service-areas',
  authenticate,
  authorize(['AGENT', 'RENTER']),
  setServiceAreas
);

/**
 * @route   GET /api/marking/agent-location/service-areas/me
 * @desc    Get agent's service areas
 * @access  Private (AGENT or RENTER)
 */
router.get(
  '/service-areas/me',
  authenticate,
  authorize(['AGENT', 'RENTER']),
  getServiceAreas
);

/**
 * @route   PATCH /api/marking/agent-location/availability
 * @desc    Toggle agent's availability for marking jobs
 * @access  Private (AGENT or RENTER)
 */
router.patch(
  '/availability',
  authenticate,
  authorize(['AGENT', 'RENTER']),
  toggleAvailability
);

/**
 * @route   GET /api/marking/agent-location/available
 * @desc    Get all available agents (for admin monitoring)
 * @access  Private (ADMIN only)
 */
router.get(
  '/available',
  authenticate,
  authorize(['ADMIN']),
  getAvailableAgents
);

/**
 * @route   POST /api/marking/agent-location/nearby
 * @desc    Get nearby agents for a specific location
 * @access  Private
 */
router.post(
  '/nearby',
  authenticate,
  getNearbyAgents
);

/**
 * @route   GET /api/marking/agent-location/history
 * @desc    Get agent's location update history
 * @access  Private (AGENT or RENTER)
 */
router.get(
  '/history',
  authenticate,
  authorize(['AGENT', 'RENTER']),
  getAgentLocationHistory
);

/**
 * @route   POST /api/marking/agent-location/validate-service-area
 * @desc    Validate if property is within agent's service area
 * @access  Private
 */
router.post(
  '/validate-service-area',
  authenticate,
  validateServiceArea
);

export default router;