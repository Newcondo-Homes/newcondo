// src/routes/auth.ts
import { Router } from 'express';

// Import auth service controllers
import { authController } from '@newcondo/auth-service/controllers';
import { otpController } from '@newcondo/auth-service/controllers';
import { profileController } from '@newcondo/auth-service/controllers';
import { verificationController } from '@newcondo/auth-service/controllers';

// Import auth service middleware
import { authValidation } from '@newcondo/auth-service/validations';
import { verificationValidation } from '@auth-service/middleware/verificationValidation';

// Import shared middleware
import { auth } from '@shared/middleware/auth';
import { validation } from '@shared/middleware/validation';

const router = Router();

// Auth routes
router.post('/register', authValidation.registerSchema, authController.register);
router.post('/login', authValidation.login, authController.login);
router.post('/logout', auth, authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authValidation.forgotPassword, authController.forgotPassword);
router.post('/reset-password', authValidation.resetPassword, authController.resetPassword);

// OTP routes
router.post('/send-otp', authValidation.sendOtp, otpController.sendOtp);
router.post('/verify-otp', authValidation.verifyOtp, otpController.verifyOtp);
router.post('/resend-otp', authValidation.resendOtp, otpController.resendOtp);

// Profile routes
router.get('/profile', auth, profileController.getProfile);
router.put('/profile', auth, authValidation.updateProfile, profileController.updateProfile);
router.patch('/profile/avatar', auth, profileController.updateAvatar);
router.delete('/profile', auth, profileController.deleteProfile);

// Email verification routes
router.post('/verify-email', authValidation.verifyEmail, authController.verifyEmail);
router.post('/resend-verification', auth, authController.resendVerification);

// Phone verification routes
router.post('/verify-phone', auth, authValidation.verifyPhone, authController.verifyPhone);
router.post('/resend-phone-verification', auth, authController.resendPhoneVerification);

// Document verification routes
router.post('/verification/upload-documents', 
  auth, 
  verificationValidation.uploadDocuments, 
  verificationController.uploadDocuments
);
router.get('/verification/status', auth, verificationController.getVerificationStatus);
router.put('/verification/resubmit', 
  auth, 
  verificationValidation.resubmitDocuments, 
  verificationController.resubmitDocuments
);

// Account security routes
router.post('/change-password', 
  auth, 
  authValidation.changePassword, 
  authController.changePassword
);
router.post('/enable-2fa', auth, authController.enableTwoFactor);
router.post('/disable-2fa', auth, authController.disableTwoFactor);
router.post('/verify-2fa', auth, authValidation.verify2FA, authController.verifyTwoFactor);

// Session management
router.get('/sessions', auth, authController.getSessions);
router.delete('/sessions/:sessionId', auth, authController.terminateSession);
router.delete('/sessions', auth, authController.terminateAllSessions);

export { router as authRouter };