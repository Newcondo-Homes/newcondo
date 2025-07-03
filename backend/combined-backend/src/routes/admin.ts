// backend/combined-app/src/routes/admin.ts
import { Router } from 'express';
// import { adminController } from '../../admin-service/src/controllers/adminController';
// import { verificationController } from '../../admin-service/src/controllers/verificationController';
// import { userController } from '../../admin-service/src/controllers/userController';
// import { analyticsController } from '../../admin-service/src/controllers/analyticsController';
// import { boundaryDisputeController } from '../../admin-service/src/controllers/boundaryDisputeController';
// import { duplicateController } from '../../admin-service/src/controllers/duplicateController';
// import { markingOversightController } from '../../admin-service/src/controllers/markingOversightController';
// import { supportController } from '../../admin-service/src/controllers/supportController';

// Import middleware from admin service
// import { adminAuth } from '../../admin-service/src/middleware/adminAuth';
// import { adminValidation } from '../../admin-service/src/middleware/adminValidation';
// import { oversightValidation } from '../../admin-service/src/middleware/oversightValidation';

// Import shared middleware
// import { authenticateToken } from '../../shared/src/middleware/auth';
// import { validateRequest } from '../../shared/src/middleware/validation';

const router = Router();

// Admin authentication and profile
// router.post('/login',
//   adminValidation.validateAdminLogin,
//   validateRequest,
//   adminController.adminLogin
// );

// router.get('/profile',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   adminController.getAdminProfile
// );

// router.put('/profile',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   adminValidation.validateAdminProfileUpdate,
//   validateRequest,
//   adminController.updateAdminProfile
// );

// // User management
// router.get('/users',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   userController.getAllUsers
// );

// router.get('/users/:userId',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   userController.getUserById
// );

// router.put('/users/:userId/status',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   adminValidation.validateUserStatusUpdate,
//   validateRequest,
//   userController.updateUserStatus
// );

// router.delete('/users/:userId',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   userController.deleteUser
// );

// router.get('/users/:userId/activity',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   userController.getUserActivity
// );

// // User verification management
// router.get('/verifications/pending',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   verificationController.getPendingVerifications
// );

// router.get('/verifications/:verificationId',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   verificationController.getVerificationDetails
// );

// router.post('/verifications/:verificationId/approve',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   verificationController.approveVerification
// );

// router.post('/verifications/:verificationId/reject',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   adminValidation.validateVerificationRejection,
//   validateRequest,
//   verificationController.rejectVerification
// );

// // Property management
// router.get('/properties',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   adminController.getAllProperties
// );

// router.get('/properties/pending',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   adminController.getPendingProperties
// );

// router.post('/properties/:propertyId/approve',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   adminController.approveProperty
// );

// router.post('/properties/:propertyId/reject',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   adminValidation.validatePropertyRejection,
//   validateRequest,
//   adminController.rejectProperty
// );

// router.delete('/properties/:propertyId',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   adminController.deleteProperty
// );

// // Boundary dispute management
// router.get('/boundary-disputes',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   boundaryDisputeController.getAllDisputes
// );

// router.get('/boundary-disputes/:disputeId',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   boundaryDisputeController.getDisputeDetails
// );

// router.post('/boundary-disputes/:disputeId/resolve',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   adminValidation.validateDisputeResolution,
//   validateRequest,
//   boundaryDisputeController.resolveDispute
// );

// router.post('/boundary-disputes/:disputeId/escalate',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   boundaryDisputeController.escalateDispute
// );

// // Duplicate property management
// router.get('/duplicates',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   duplicateController.getAllDuplicates
// );

// router.get('/duplicates/:duplicateId',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   duplicateController.getDuplicateDetails
// );

// router.post('/duplicates/:duplicateId/merge',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   adminValidation.validateDuplicateMerge,
//   validateRequest,
//   duplicateController.mergeDuplicates
// );

// router.post('/duplicates/:duplicateId/dismiss',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   duplicateController.dismissDuplicate
// );

// // Marking job oversight
// router.get('/marking-jobs',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   markingOversightController.getAllMarkingJobs
// );

// router.get('/marking-jobs/flagged',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   markingOversightController.getFlaggedJobs
// );

// router.get('/marking-jobs/:jobId',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   markingOversightController.getMarkingJobDetails
// );

// router.post('/marking-jobs/:jobId/flag',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   oversightValidation.validateJobFlag,
//   validateRequest,
//   markingOversightController.flagMarkingJob
// );

// router.post('/marking-jobs/:jobId/investigate',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   markingOversightController.investigateJob
// );

// // Agent management
// router.get('/agents',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   markingOversightController.getAllAgents
// );

// router.get('/agents/:agentId/performance',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   markingOversightController.getAgentPerformance
// );

// router.post('/agents/:agentId/suspend',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   oversightValidation.validateAgentSuspension,
//   validateRequest,
//   markingOversightController.suspendAgent
// );

// router.post('/agents/:agentId/reinstate',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   markingOversightController.reinstateAgent
// );

// // Support ticket management
// router.get('/support-tickets',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   supportController.getAllTickets
// );

// router.get('/support-tickets/:ticketId',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   supportController.getTicketDetails
// );

// router.post('/support-tickets/:ticketId/assign',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   adminValidation.validateTicketAssignment,
//   validateRequest,
//   supportController.assignTicket
// );

// router.post('/support-tickets/:ticketId/respond',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   adminValidation.validateTicketResponse,
//   validateRequest,
//   supportController.respondToTicket
// );

// router.post('/support-tickets/:ticketId/close',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   supportController.closeTicket
// );

// // Analytics and reports
// router.get('/analytics/dashboard',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   analyticsController.getDashboardAnalytics
// );

// router.get('/analytics/users',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   analyticsController.getUserAnalytics
// );

// router.get('/analytics/properties',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   analyticsController.getPropertyAnalytics
// );

// router.get('/analytics/payments',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   analyticsController.getPaymentAnalytics
// );

// router.get('/analytics/marking-jobs',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   analyticsController.getMarkingJobAnalytics
// );

// // System configuration
// router.get('/config',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   adminController.getSystemConfig
// );

// router.put('/config',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   adminValidation.validateSystemConfig,
//   validateRequest,
//   adminController.updateSystemConfig
// );

// // Audit logs
// router.get('/audit-logs',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   adminController.getAuditLogs
// );

// router.get('/audit-logs/:logId',
//   authenticateToken,
//   adminAuth.verifyAdmin,
//   adminController.getAuditLogDetails
// );

export default router;