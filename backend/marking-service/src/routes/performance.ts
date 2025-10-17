// backend/marking-service/src/routes/performance.ts
import { Router } from 'express';
import { authMiddleware } from '../middleware/agentAuth';
import { performanceValidation } from '../middleware/performanceValidation';
import * as performanceController from '../controllers/performanceController';

const router = Router();

/**
 * Performance Metrics Endpoints
 * Tracks agent reliability scores, completion rates, and performance metrics
 */

// Get agent performance dashboard
router.get('/agent/dashboard', authMiddleware, performanceController.getAgentPerformanceDashboard);

// Get detailed agent performance metrics
router.get('/agent/:agentId/metrics', authMiddleware, performanceController.getAgentMetrics);

// Get agent completion history
router.get('/agent/:agentId/completions', authMiddleware, performanceController.getCompletionHistory);

// Get agent queue performance (acceptance rates, dropout rates)
router.get('/agent/:agentId/queue-performance', authMiddleware, performanceController.getQueuePerformance);

// Get platform-wide performance statistics (admin only)
router.get('/platform/statistics', authMiddleware, performanceController.getPlatformStatistics);

// Get top performing agents (admin only)
router.get('/platform/top-agents', authMiddleware, performanceController.getTopPerformingAgents);

// Get agent reliability score
router.get('/agent/:agentId/reliability-score', authMiddleware, performanceController.getReliabilityScore);

// Get marking job performance details
router.get('/marking-job/:markingJobId/performance', authMiddleware, performanceController.getMarkingJobPerformance);

// Update agent performance (internal - triggered by job completion)
router.post(
  '/internal/update-agent-performance',
  performanceValidation.validatePerformanceUpdate,
  performanceController.updateAgentPerformance
);

// Recalculate agent reliability score (admin endpoint)
router.post(
  '/admin/recalculate-reliability/:agentId',
  authMiddleware,
  performanceController.recalculateReliabilityScore
);

// Get performance report for period (admin)
router.get(
  '/admin/performance-report',
  authMiddleware,
  performanceValidation.validateReportPeriod,
  performanceController.getPerformanceReport
);

// Suspend agent for poor performance (admin)
router.post(
  '/admin/suspend-agent/:agentId',
  authMiddleware,
  performanceValidation.validateSuspensionReason,
  performanceController.suspendAgentForPerformance
);

// Resume suspended agent (admin)
router.post('/admin/resume-agent/:agentId', authMiddleware, performanceController.resumeAgent);

// Get agent performance comparison (admin)
router.get(
  '/admin/performance-comparison',
  authMiddleware,
  performanceValidation.validateComparisonParams,
  performanceController.getPerformanceComparison
);

// Batch update performance metrics (internal - scheduled job)
router.post(
  '/internal/batch-update-metrics',
  performanceValidation.validateBatchUpdate,
  performanceController.batchUpdatePerformanceMetrics
);

export default router;