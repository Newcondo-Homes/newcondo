import { Router } from 'express';
import { verificationController } from '../controllers/verificationController';
import { authMiddleware } from '../middleware/authMiddleware';
import { otpLimiter } from '../middleware/rateLimiter';
import { verificationValidation } from '../validations/verificationValidation';

const router = Router();

// Send email verification OTP
router.post('/send-email-verification', 
  otpLimiter,
  authMiddleware,
  verificationValidation.sendEmailVerification,
);

// Verify email with OTP
router.post('/verify-email',
  authMiddleware,
  verificationValidation.verifyEmail,
  verificationController.verifyEmail
);

// Resend email verification
router.post('/resend-email-verification',
  otpLimiter,
  authMiddleware,
  verificationController.resendEmailVerification
);

// Check verification status
router.get('/status',
  authMiddleware,
  verificationController.getVerificationStatus
);

export { router as verificationRoutes };