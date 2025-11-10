// backend/admin-service/src/routes/systemHealth.ts
import { Router } from 'express';
import {
  getSystemHealthOverview,
  getServiceStatus,
  getDatabaseHealth,
  getApiPerformance,
  getErrorLogs,
  getSystemMetrics,
  getUptime,
  getLatencyMetrics,
  getThroughputMetrics,
  getResourceUsage,
  getQueueStatus,
  getIntegrationHealth,
  getSecurityEvents,
  getSystemAlerts,
  acknowledgeAlert,
  runHealthCheck
} from '../controllers/systemHealthController';
import { authenticateAdmin } from '../middleware/adminAnalyticsAuth';
import { validateMetricsQuery } from '../middleware/analyticsValidation';

const router = Router();

// Apply admin authentication to all routes
router.use(authenticateAdmin);

/**
 * @route   GET /api/admin/health/overview
 * @desc    Get system health overview
 * @access  Admin
 */
router.get('/overview', getSystemHealthOverview);

/**
 * @route   GET /api/admin/health/services
 * @desc    Get status of all services
 * @access  Admin
 */
router.get('/services', getServiceStatus);

/**
 * @route   GET /api/admin/health/database
 * @desc    Get database health metrics
 * @access  Admin
 */
router.get('/database', getDatabaseHealth);

/**
 * @route   GET /api/admin/health/api-performance
 * @desc    Get API performance metrics
 * @access  Admin
 */
router.get('/api-performance', validateMetricsQuery, getApiPerformance);

/**
 * @route   GET /api/admin/health/error-logs
 * @desc    Get recent error logs
 * @access  Admin
 */
router.get('/error-logs', validateMetricsQuery, getErrorLogs);

/**
 * @route   GET /api/admin/health/metrics
 * @desc    Get comprehensive system metrics
 * @access  Admin
 */
router.get('/metrics', getSystemMetrics);

/**
 * @route   GET /api/admin/health/uptime
 * @desc    Get service uptime statistics
 * @access  Admin
 */
router.get('/uptime', validateMetricsQuery, getUptime);

/**
 * @route   GET /api/admin/health/latency
 * @desc    Get latency metrics for various endpoints
 * @access  Admin
 */
router.get('/latency', validateMetricsQuery, getLatencyMetrics);

/**
 * @route   GET /api/admin/health/throughput
 * @desc    Get throughput metrics
 * @access  Admin
 */
router.get('/throughput', validateMetricsQuery, getThroughputMetrics);

/**
 * @route   GET /api/admin/health/resources
 * @desc    Get resource usage (CPU, memory, disk)
 * @access  Admin
 */
router.get('/resources', getResourceUsage);

/**
 * @route   GET /api/admin/health/queues
 * @desc    Get queue status (marking jobs, notifications)
 * @access  Admin
 */
router.get('/queues', getQueueStatus);

/**
 * @route   GET /api/admin/health/integrations
 * @desc    Get external integration health (Flutterwave, Maps, etc.)
 * @access  Admin
 */
router.get('/integrations', getIntegrationHealth);

/**
 * @route   GET /api/admin/health/security
 * @desc    Get security events and alerts
 * @access  Admin
 */
router.get('/security', validateMetricsQuery, getSecurityEvents);

/**
 * @route   GET /api/admin/health/alerts
 * @desc    Get active system alerts
 * @access  Admin
 */
router.get('/alerts', getSystemAlerts);

/**
 * @route   POST /api/admin/health/alerts/:alertId/acknowledge
 * @desc    Acknowledge a system alert
 * @access  Admin
 */
router.post('/alerts/:alertId/acknowledge', acknowledgeAlert);

/**
 * @route   POST /api/admin/health/check
 * @desc    Run comprehensive health check
 * @access  Admin
 */
router.post('/check', runHealthCheck);

export default router;