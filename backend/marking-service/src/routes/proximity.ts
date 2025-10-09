import { Router } from 'express';
import {
  broadcastJobToNearbyAgents,
  getJobsInRadius,
  updateAgentLocation,
  getAgentServiceAreas,
  updateAgentServiceAreas,
  calculateProximityScore,
  getOptimalAgents,
  getNearbyAgentsForJob,
} from '../controllers/proximityController';
import { auth } from '../../../shared/src/middleware/auth';
import { validateProximitySearch, validateServiceAreaUpdate } from '../middleware/proximityValidation';
import { checkRolePermission } from '../middleware/rolePermission';

const router = Router();

/**
 * @route   POST /api/proximity/broadcast/:jobId
 * @desc    Broadcast marking job to nearby agents
 * @access  Private (System/Admin - triggered automatically)
 */
router.post(
  '/broadcast/:jobId',
  auth,
  checkRolePermission(['ADMIN']),
  broadcastJobToNearbyAgents
);

/**
 * @route   GET /api/proximity/jobs/nearby
 * @desc    Get marking jobs within radius of agent's location
 * @access  Private (Agent/Premium Renter)
 */
router.get(
  '/jobs/nearby',
  auth,
  checkRolePermission(['AGENT', 'RENTER']),
  validateProximitySearch,
  getJobsInRadius
);

/**
 * @route   GET /api/proximity/agents/:jobId
 * @desc    Get nearby agents for a specific job
 * @access  Private (Admin/System)
 */
router.get(
  '/agents/:jobId',
  auth,
  checkRolePermission(['ADMIN']),
  getNearbyAgentsForJob
);

/**
 * @route   GET /api/proximity/optimal-agents/:jobId
 * @desc    Get optimal agents based on proximity, rating, and availability
 * @access  Private (Admin/System)
 */
router.get(
  '/optimal-agents/:jobId',
  auth,
  checkRolePermission(['ADMIN']),
  getOptimalAgents
);

/**
 * @route   POST /api/proximity/location/update
 * @desc    Update agent's current location
 * @access  Private (Agent/Premium Renter)
 */
router.post(
  '/location/update',
  auth,
  checkRolePermission(['AGENT', 'RENTER']),
  updateAgentLocation
);

/**
 * @route   GET /api/proximity/service-areas
 * @desc    Get agent's service areas
 * @access  Private (Agent)
 */
router.get(
  '/service-areas',
  auth,
  checkRolePermission(['AGENT', 'RENTER']),
  getAgentServiceAreas
);

/**
 * @route   PUT /api/proximity/service-areas
 * @desc    Update agent's service areas
 * @access  Private (Agent)
 */
router.put(
  '/service-areas',
  auth,
  checkRolePermission(['AGENT', 'RENTER']),
  validateServiceAreaUpdate,
  updateAgentServiceAreas
);

/**
 * @route   POST /api/proximity/calculate-score
 * @desc    Calculate proximity score for agent-job pair
 * @access  Private (System/Admin)
 */
router.post(
  '/calculate-score',
  auth,
  checkRolePermission(['ADMIN']),
  calculateProximityScore
);

export default router;