import express from 'express';
import { queueNotificationController } from '../controllers/queueNotificationController';
import { auth } from '../../../shared/src/middleware/auth';
import { validateRequest } from '../../../shared/src/middleware/validation';
import { body } from 'express-validator';

const router = express.Router();

// Validation middleware
const newJobAlertValidation = [
  body('markingJobId').isString().notEmpty(),
  body('propertyId').isString().notEmpty(),
  body('location').isObject(),
  body('fee').isNumeric(),
  body('urgencyLevel').isIn(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
  body('agentIds').isArray().notEmpty(),
];

const queuePositionUpdateValidation = [
  body('agentId').isString().notEmpty(),
  body('markingJobId').isString().notEmpty(),
  body('queuePosition').isInt({ min: 1 }),
  body('estimatedTime').optional().isISO8601(),
];

const timeSlotExpiryValidation = [
  body('agentId').isString().notEmpty(),
  body('markingJobId').isString().notEmpty(),
  body('remainingMinutes').isInt({ min: 0 }),
];

const jobAssignmentValidation = [
  body('agentId').isString().notEmpty(),
  body('markingJobId').isString().notEmpty(),
  body('propertyAddress').isString().notEmpty(),
  body('contactPerson').isObject(),
  body('timeSlotExpiry').isISO8601(),
];

const jobClaimValidation = [
  body('ownerId').isString().notEmpty(),
  body('markingJobId').isString().notEmpty(),
  body('agentName').isString().notEmpty(),
  body('estimatedCompletion').isISO8601(),
];

const compensationValidation = [
  body('agentId').isString().notEmpty(),
  body('markingJobId').isString().notEmpty(),
  body('compensationAmount').isNumeric(),
  body('reason').isString().notEmpty(),
];

// Routes
router.post(
  '/new-job-alert',
  auth,
  newJobAlertValidation,
  validateRequest,
  queueNotificationController.sendNewJobAlert
);

router.post(
  '/queue-position-update',
  auth,
  queuePositionUpdateValidation,
  validateRequest,
  queueNotificationController.sendQueuePositionUpdate
);

router.post(
  '/time-slot-expiry-warning',
  auth,
  timeSlotExpiryValidation,
  validateRequest,
  queueNotificationController.sendTimeSlotExpiryWarning
);

router.post(
  '/job-assignment',
  auth,
  jobAssignmentValidation,
  validateRequest,
  queueNotificationController.sendJobAssignmentConfirmation
);

router.post(
  '/job-claim',
  auth,
  jobClaimValidation,
  validateRequest,
  queueNotificationController.sendJobClaimNotification
);

router.post(
  '/compensation',
  auth,
  compensationValidation,
  validateRequest,
  queueNotificationController.sendTimeExpiredCompensation
);

router.post(
  '/bulk',
  auth,
  body('notifications').isArray().notEmpty(),
  validateRequest,
  queueNotificationController.sendBulkNotifications
);

router.post(
  '/queue-released',
  auth,
  body('agentIds').isArray().notEmpty(),
  body('markingJobId').isString().notEmpty(),
  body('reason').isString().notEmpty(),
  validateRequest,
  queueNotificationController.sendQueueReleasedNotification
);

export default router;