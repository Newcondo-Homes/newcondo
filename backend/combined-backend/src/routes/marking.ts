// backend/combined-app/src/routes/marking.ts
import { Router } from 'express';
// import { markingJobController } from '../../marking-service/src/controllers/markingJobController';
// import { queueController } from '../../marking-service/src/controllers/queueController';
// import { assignmentController } from '../../marking-service/src/controllers/assignmentController';
// import { completionController } from '../../marking-service/src/controllers/completionController';

// Import middleware from marking service
// import { markingValidation } from '../../marking-service/src/middleware/markingValidation';
// import { queueValidation } from '../../marking-service/src/middleware/queueValidation';
// import { agentAuth } from '../../marking-service/src/middleware/agentAuth';

// Import shared middleware
// import { authenticateToken } from '../../shared/src/middleware/auth';
// import { validateRequest } from '../../shared/src/middleware/validation';

const router = Router();

// Marking job CRUD routes
// router.get('/jobs',
//   authenticateToken,
//   markingJobController.getUserMarkingJobs
// );

// router.get('/jobs/:jobId',
//   authenticateToken,
//   markingJobController.getMarkingJobById
// );

// router.post('/jobs',
//   authenticateToken,
//   markingValidation.validateCreateMarkingJob,
//   validateRequest,
//   markingJobController.createMarkingJob
// );

// router.put('/jobs/:jobId',
//   authenticateToken,
//   markingValidation.validateUpdateMarkingJob,
//   validateRequest,
//   markingJobController.updateMarkingJob
// );

// router.delete('/jobs/:jobId',
//   authenticateToken,
//   markingJobController.cancelMarkingJob
// );

// // Marking job status management
// router.post('/jobs/:jobId/confirm',
//   authenticateToken,
//   markingJobController.confirmMarkingJob
// );

// router.post('/jobs/:jobId/start',
//   authenticateToken,
//   agentAuth.verifyAgent,
//   markingJobController.startMarkingJob
// );

// router.post('/jobs/:jobId/pause',
//   authenticateToken,
//   agentAuth.verifyAgent,
//   markingJobController.pauseMarkingJob
// );

// router.post('/jobs/:jobId/resume',
//   authenticateToken,
//   agentAuth.verifyAgent,
//   markingJobController.resumeMarkingJob
// );

// // Agent queue management
// router.get('/queue',
//   authenticateToken,
//   agentAuth.verifyAgent,
//   queueController.getAgentQueue
// );

// router.get('/queue/available',
//   authenticateToken,
//   agentAuth.verifyAgent,
//   queueController.getAvailableJobs
// );

// router.post('/queue/join',
//   authenticateToken,
//   agentAuth.verifyAgent,
//   queueValidation.validateQueueJoin,
//   validateRequest,
//   queueController.joinQueue
// );

// router.post('/queue/leave',
//   authenticateToken,
//   agentAuth.verifyAgent,
//   queueController.leaveQueue
// );

// router.get('/queue/status',
//   authenticateToken,
//   agentAuth.verifyAgent,
//   queueController.getQueueStatus
// );

// // Job assignment routes
// router.post('/assignments/accept/:jobId',
//   authenticateToken,
//   agentAuth.verifyAgent,
//   assignmentController.acceptJobAssignment
// );

// router.post('/assignments/reject/:jobId',
//   authenticateToken,
//   agentAuth.verifyAgent,
//   markingValidation.validateJobRejection,
//   validateRequest,
//   assignmentController.rejectJobAssignment
// );

// router.get('/assignments/current',
//   authenticateToken,
//   agentAuth.verifyAgent,
//   assignmentController.getCurrentAssignments
// );

// router.get('/assignments/history',
//   authenticateToken,
//   agentAuth.verifyAgent,
//   assignmentController.getAssignmentHistory
// );

// // Job completion routes
// router.post('/jobs/:jobId/complete',
//   authenticateToken,
//   agentAuth.verifyAgent,
//   markingValidation.validateJobCompletion,
//   validateRequest,
//   completionController.completeMarkingJob
// );

// router.post('/jobs/:jobId/submit-evidence',
//   authenticateToken,
//   agentAuth.verifyAgent,
//   markingValidation.validateJobEvidence,
//   validateRequest,
//   completionController.submitJobEvidence
// );

// router.get('/jobs/:jobId/evidence',
//   authenticateToken,
//   completionController.getJobEvidence
// );

// // Time slot management
// router.get('/time-slots/available',
//   markingJobController.getAvailableTimeSlots
// );

// router.post('/time-slots/book',
//   authenticateToken,
//   markingValidation.validateTimeSlotBooking,
//   validateRequest,
//   markingJobController.bookTimeSlot
// );

// router.get('/time-slots/booked',
//   authenticateToken,
//   markingJobController.getBookedTimeSlots
// );

// // Contact person management
// router.post('/jobs/:jobId/contact-person',
//   authenticateToken,
//   markingValidation.validateContactPerson,
//   validateRequest,
//   markingJobController.setContactPerson
// );

// router.get('/jobs/:jobId/contact-person',
//   authenticateToken,
//   markingJobController.getContactPerson
// );

// router.put('/jobs/:jobId/contact-person',
//   authenticateToken,
//   markingValidation.validateContactPerson,
//   validateRequest,
//   markingJobController.updateContactPerson
// );

// // Agent performance and analytics
// router.get('/agents/performance',
//   authenticateToken,
//   agentAuth.verifyAgent,
//   queueController.getAgentPerformance
// );

// router.get('/analytics/jobs-summary',
//   authenticateToken,
//   markingJobController.getJobsAnalytics
// );

// // Property owner specific routes
// router.get('/owner/jobs',
//   authenticateToken,
//   markingJobController.getOwnerMarkingJobs
// );

// router.get('/owner/jobs/:jobId/progress',
//   authenticateToken,
//   markingJobController.getJobProgress
// );

// // Job ratings and reviews
// router.post('/jobs/:jobId/rate-agent',
//   authenticateToken,
//   markingValidation.validateAgentRating,
//   validateRequest,
//   completionController.rateAgent
// );

// router.post('/jobs/:jobId/rate-client',
//   authenticateToken,
//   agentAuth.verifyAgent,
//   markingValidation.validateClientRating,
//   validateRequest,
//   completionController.rateClient
// );

export default router;