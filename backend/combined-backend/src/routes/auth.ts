// src/routes/auth.ts
import { Router } from "express";
import type { Router as ExpressRouter } from "express";
// Import auth service controllers
import { authController } from "@newcondo/auth-service";
import { otpController } from "@newcondo/auth-service";
import { profileController } from "@newcondo/auth-service";
import { verificationController } from "@newcondo/auth-service";
import { authMiddleware } from "@newcondo/backend-shared";

// Import auth validation middleware
import { authValidation } from "@newcondo/auth-service";
import { verificationValidation } from "@newcondo/auth-service";
import { getOnboardingState } from "@newcondo/auth-service";

// Import shared middleware
import { auth } from "@newcondo/backend-shared";
// import { validation } from '@newcondo/backend-shared/middleware/validation';

const router: ExpressRouter = Router();

// Auth routes

// test auth route
router.get("/test", (req, res) => {
  console.log('Test ping is successfull')
  res.json({
    success: true,
    message: "Auth router is working!",
    timestamp: new Date().toISOString(),
  });
});

// main auth routes
router.post("/register", authValidation.register, authController.register);
router.post("/login", authValidation.login, authController.login);
router.post("/logout", auth, authController.logout);
router.post("/refresh-token", authController.refreshToken);
router.post(
  "/forgot-password",
  authValidation.forgotPassword,
  authController.forgotPassword
);
router.post(
  "/reset-password",
  authValidation.resetPassword,
  authController.resetPassword
);

// OTP routes
router.post("/send-otp", authValidation.sendOtp, otpController.sendOTP);
router.post("/verify-otp", authValidation.verifyOtp, otpController.verifyOTP);
router.post("/resend-otp", authValidation.resendOtp, otpController.resendOTP);
 router.post("/ensure-otp", authMiddleware, otpController.ensureOtp.bind(otpController));
// onboarding state
router.get("/onboarding-state", authMiddleware, async (req, res, next) => {
  try {
    res.json({ success: true, data: await getOnboardingState(req.user!.id) });
  } catch (e) { next(e); }
});

// change email
router.patch("/change-email", authMiddleware, authController.changeEmail.bind(authController));

// Profile routes
router.get("/profile", auth, profileController.getProfile);
router.put(
  "/profile",
  auth,
  authValidation.updateProfile,
  profileController.updateProfile
);
// router.patch("/profile/avatar", auth, profileController.updateAvatar);
router.delete("/profile", auth, profileController.deleteProfile);

// Email verification routes
router.post(
  "/verify-email",
  authValidation.verifyEmail,
  authController.verifyEmail
);
router.post("/resend-verification", auth, authController.resendVerification);

// GET /auth/email-exists?email=...
// PUBLIC — no auth required. Returns only existence, nothing else.
// Rate-limited to prevent email enumeration abuse.
router.get('/email-exists', authController.checkEmailExists.bind(authController));

// Phone verification routes
router.post(
  "/verify-phone",
  auth,
  authValidation.verifyPhone,
  authController.verifyPhone
);
router.post(
  "/resend-phone-verification",
  auth,
  authController.resendPhoneVerification
);

// Document verification routes
router.post(
  "/verification/upload-documents",
  auth,
  verificationValidation.uploadDocuments,
  verificationController.uploadDocuments
);
router.get(
  "/verification/status",
  auth,
  verificationController.getVerificationStatus
);
router.put(
  "/verification/resubmit",
  auth,
  verificationValidation.resubmitDocuments,
  verificationController.resubmitDocument
);

// Account security routes
router.post(
  "/change-password",
  auth,
  authValidation.changePassword,
  authController.changePassword
);
router.post("/enable-2fa", auth, authController.enableTwoFactor);
router.post("/disable-2fa", auth, authController.disableTwoFactor);
router.post(
  "/verify-2fa",
  auth,
  authValidation.verify2FA,
  authController.verifyTwoFactor
);

// Session management
router.get("/sessions", auth, authController.getSessions);
router.delete("/sessions/:sessionId", auth, authController.terminateSession);
router.delete("/sessions", auth, authController.terminateAllSessions);

export { router as authRouter };
