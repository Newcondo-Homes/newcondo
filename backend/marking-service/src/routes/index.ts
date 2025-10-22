// backend/marking-service/src/routes/index.ts
import { Router } from 'express';
import markingJobsRouter from './markingJobs';
import queueRouter from './queue';
import assignmentsRouter from './assignments';
import completionRouter from './completion';
import confirmationRouter from './confirmation';
import timeSlotsRouter from './timeSlots';
import agentLocationRouter from './agentLocation';

const router = Router();

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Marking service is running',
    timestamp: new Date().toISOString(),
    service: 'marking-service',
    version: '1.0.0'
  });
});

/**
 * Mount route modules
 */
router.use('/jobs', markingJobsRouter);
router.use('/queue', queueRouter);
router.use('/assignments', assignmentsRouter);
router.use('/completion', completionRouter);
router.use('/confirmation', confirmationRouter);
router.use('/time-slots', timeSlotsRouter);
router.use('/agent-location', agentLocationRouter);

/**
 * 404 handler for undefined routes
 */
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

export default router;