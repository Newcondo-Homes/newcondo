// backend/combined-app/src/routes/notifications.ts
import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';

// Import notification service controllers
import {
  emailController,
  smsController,
  pushController
} from '../../../notification-service/src/controllers';

// Import notification service middleware
import { notificationValidation } from '../../../notification-service/src/middleware/notificationValidation';

// Import shared middleware
import { authMiddleware } from '../../../shared/src/middleware/auth';
import { validationMiddleware } from '../../../shared/src/middleware/validation';

const router = Router();

// Email Notification Routes
router.post(
  '/email/send',
  authMiddleware,
  notificationValidation.sendEmail,
  validationMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await emailController.sendEmail(req, res);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/email/verification',
  notificationValidation.sendVerificationEmail,
  validationMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await emailController.sendVerificationEmail(req, res);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/email/payment-confirmation',
  authMiddleware,
  notificationValidation.sendPaymentConfirmation,
  validationMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await emailController.sendPaymentConfirmation(req, res);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/email/marking-assignment',
  authMiddleware,
  notificationValidation.sendMarkingAssignment,
  validationMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await emailController.sendMarkingAssignment(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// SMS Notification Routes
router.post(
  '/sms/send',
  authMiddleware,
  notificationValidation.sendSMS,
  validationMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await smsController.sendSMS(req, res);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/sms/otp',
  notificationValidation.sendOTP,
  validationMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await smsController.sendOTP(req, res);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/sms/booking-reminder',
  authMiddleware,
  notificationValidation.sendBookingReminder,
  validationMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await smsController.sendBookingReminder(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Push Notification Routes
router.post(
  '/push/send',
  authMiddleware,
  notificationValidation.sendPushNotification,
  validationMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await pushController.sendPushNotification(req, res);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/push/subscribe',
  authMiddleware,
  notificationValidation.subscribeToPush,
  validationMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await pushController.subscribeToPush(req, res);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/push/unsubscribe',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await pushController.unsubscribeFromPush(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Notification Preferences Routes
router.get(
  '/preferences',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await emailController.getNotificationPreferences(req, res);
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/preferences',
  authMiddleware,
  notificationValidation.updatePreferences,
  validationMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await emailController.updateNotificationPreferences(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Notification History Routes
router.get(
  '/history',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await emailController.getNotificationHistory(req, res);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/templates',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await emailController.getNotificationTemplates(req, res);
    } catch (error) {
      next(error);
    }
  }
);

export default router;