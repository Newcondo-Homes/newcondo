// backend/admin-service/src/routes/agentPerformance.ts
import { Router } from 'express';
import {
  getAgentOverview,
  getAgentLeaderboard,
  getAgentDetails,
  getAgentPerformanceMetrics,
  getAgentReliabilityScore,
  getAgentEarnings,
  getAgentMarkingJobStats,
  getAgentPropertyListings,
  getAgentReferralStats,
  compareAgents,
  getAgentPerformanceTrends,
  getAgentActivityLog,
  getAgentWarnings,
  suspendAgent,
  reactivateAgent
} from '../controllers/agentPerformanceController';
import { authenticateAdmin } from '../middleware/adminAnalyticsAuth';
import { 
  validateMetricsQuery,
  validateAgentId
} from '../middleware/analyticsValidation';

const router = Router();

// Apply admin authentication to all routes
router.use(authenticateAdmin);

/**
 * @route   GET /api/admin/agents/overview
 * @desc    Get agent performance overview
 * @access  Admin
 */
router.get('/overview', validateMetricsQuery, getAgentOverview);

/**
 * @route   GET /api/admin/agents/leaderboard
 * @desc    Get agent leaderboard (top performers)
 * @access  Admin
 */
router.get('/leaderboard', validateMetricsQuery, getAgentLeaderboard);

/**
 * @route   GET /api/admin/agents/:agentId
 * @desc    Get detailed agent information
 * @access  Admin
 */
router.get('/:agentId', validateAgentId, getAgentDetails);

/**
 * @route   GET /api/admin/agents/:agentId/metrics
 * @desc    Get comprehensive performance metrics for an agent
 * @access  Admin
 */
router.get('/:agentId/metrics', validateAgentId, getAgentPerformanceMetrics);

/**
 * @route   GET /api/admin/agents/:agentId/reliability
 * @desc    Get agent reliability score breakdown
 * @access  Admin
 */
router.get('/:agentId/reliability', validateAgentId, getAgentReliabilityScore);

/**
 * @route   GET /api/admin/agents/:agentId/earnings
 * @desc    Get agent earnings history and breakdown
 * @access  Admin
 */
router.get('/:agentId/earnings', validateAgentId, getAgentEarnings);

/**
 * @route   GET /api/admin/agents/:agentId/marking-jobs
 * @desc    Get agent marking job statistics
 * @access  Admin
 */
router.get('/:agentId/marking-jobs', validateAgentId, getAgentMarkingJobStats);

/**
 * @route   GET /api/admin/agents/:agentId/listings
 * @desc    Get agent property listings statistics
 * @access  Admin
 */
router.get('/:agentId/listings', validateAgentId, getAgentPropertyListings);

/**
 * @route   GET /api/admin/agents/:agentId/referrals
 * @desc    Get agent referral statistics
 * @access  Admin
 */
router.get('/:agentId/referrals', validateAgentId, getAgentReferralStats);

/**
 * @route   POST /api/admin/agents/compare
 * @desc    Compare multiple agents
 * @access  Admin
 */
router.post('/compare', compareAgents);

/**
 * @route   GET /api/admin/agents/:agentId/trends
 * @desc    Get agent performance trends over time
 * @access  Admin
 */
router.get('/:agentId/trends', validateAgentId, getAgentPerformanceTrends);

/**
 * @route   GET /api/admin/agents/:agentId/activity
 * @desc    Get agent activity log
 * @access  Admin
 */
router.get('/:agentId/activity', validateAgentId, getAgentActivityLog);

/**
 * @route   GET /api/admin/agents/:agentId/warnings
 * @desc    Get agent warnings and issues
 * @access  Admin
 */
router.get('/:agentId/warnings', validateAgentId, getAgentWarnings);

/**
 * @route   POST /api/admin/agents/:agentId/suspend
 * @desc    Suspend an agent
 * @access  Admin
 */
router.post('/:agentId/suspend', validateAgentId, suspendAgent);

/**
 * @route   POST /api/admin/agents/:agentId/reactivate
 * @desc    Reactivate a suspended agent
 * @access  Admin
 */
router.post('/:agentId/reactivate', validateAgentId, reactivateAgent);

export default router;