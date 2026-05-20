import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { verificationController } from "../controllers/verificationController";
import { authMiddleware } from "@newcondo/backend-shared";
import { otpLimiter, rateLimiter } from "../middleware/rateLimiter";
import { verificationValidation } from "../validations/verificationValidation";

const router: ExpressRouter = Router();

// Send email verification OTP
router.post(
  "/send-email-verification",
  otpLimiter,
  authMiddleware,
  verificationValidation.sendEmailVerification,
  verificationController.sendEmailVerification
);

// Verify email with OTP
router.post(
  "/verify-email",
  authMiddleware,
  verificationValidation.verifyEmail,
  verificationController.verifyEmail
);

// Resend email verification
router.post(
  "/resend-email-verification",
  otpLimiter,
  authMiddleware,
  verificationController.resendEmailVerification
);

// Check verification status
router.get(
  "/status",
  authMiddleware,
  verificationController.getVerificationStatus
);

// User verification routes
router.post(
  "/upload",
  rateLimiter(10, 15), // 10 requests per 15 minutes
  verificationController.uploadDocuments
);

router.get("/documents", verificationController.getUserDocuments);

router.get("/status", verificationController.getVerificationStatus);

router.delete("/documents/:documentId", verificationController.deleteDocument);

router.put(
  "/documents/:documentId/resubmit",
  rateLimiter(5, 15), // 5 resubmissions per 15 minutes
  verificationController.resubmitDocument
);

// Admin verification routes
router.get(
  "/admin/pending",
  rateLimiter(100, 15), // Higher limit for admins
  verificationController.getPendingVerifications
);

router.put(
  "/admin/status",
  rateLimiter(50, 15), // Higher limit for admins
  verificationController.updateVerificationStatus
);

router.get(
  "/admin/user/:userId",
  verificationController.getUserVerificationDetails
);
export { router as verificationRoutes };
