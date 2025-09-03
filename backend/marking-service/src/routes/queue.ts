import express from 'express';
import { auth, requireRole } from '@newcondo/auth/middleware';
import { queueController } from '../controllers/queueController';
import { queueValidation } from '../middleware/queueValidation';
import { validateRequest } from '../../../shared/src/middleware/validation';

const router = express.Router();

// Agent queue management
router.get(
  '/available-jobs',
  auth,
  requireRole(['AGENT']),
  queueController.getAvailableJobs
);

router.get(
  '/my-queue',
  auth,
  requireRole(['AGENT']),
  queueController.getAgentQueue
);

router.patch(
  '/availability',
  auth,
  requireRole(['AGENT']),
  queueValidation.updateAvailability,
  validateRequest,
  queueController.updateAgentAvailability
);

router.patch(
  '/service-areas',
  auth,
  requireRole(['AGENT']),
  queueValidation.updateServiceAreas,
  validateRequest,
  queueController.updateServiceAreas
);

// Job queue statistics
router.get(
  '/stats',
  auth,
  requireRole(['AGENT']),
  queueController.getQueueStats
);

router.get(
  '/position/:jobId',
  auth,
  queueController.getJobQueuePosition
);

// Admin queue management
router.get(
  '/admin/overview',
  auth,
  requireRole(['ADMIN']),
  queueController.getQueueOverview
);

router.patch(
  '/admin/prioritize/:jobId',
  auth,
  requireRole(['ADMIN']),
  queueValidation.prioritizeJob,
  validateRequest,
  queueController.prioritizeJob
);

router.get(
  '/admin/agents',
  auth,
  requireRole(['ADMIN']),
  queueController.getActiveAgents
);

router.patch(
  '/admin/reassign/:jobId',
  auth,
  requireRole(['ADMIN']),
  queueValidation.reassignJob,
  validateRequest,
  queueController.reassignJob
);

// Queue health monitoring
router.get(
  '/health',
  auth,
  requireRole(['ADMIN']),
  queueController.getQueueHealth
);

router.post(
  '/process',
  auth,
  requireRole(['ADMIN']),
  queueController.processQueue
);

export default router;