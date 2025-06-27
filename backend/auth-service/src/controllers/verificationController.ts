import { Request, Response } from "express";
import { verificationService } from "../services/verificationService";
// import { AuthenticatedRequest } from "../types/auth";

class VerificationController {
  async sendEmailVerification(req: Request, res: Response) {
    try {
      const { user } = req;

      if (!user) return;

      if (user?.emailVerified) {
        return res.status(400).json({
          success: false,
          message: "Email is already verified",
          code: "EMAIL_ALREADY_VERIFIED",
        });
      }

      const result = await verificationService.sendEmailVerification(
        user.id,
        user.email
      );

      res.status(200).json({
        success: true,
        message: "Verification code sent to your email",
        data: {
          sentTo: user.email,
          expiresIn: result.expiresIn,
        },
      });
    } catch (error: any) {
      console.error("Send email verification error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to send verification email",
        code: error.code || "VERIFICATION_SEND_FAILED",
      });
    }
  }

  async verifyEmail(req: Request, res: Response) {
    try {
      const { code } = req.body;
      const { user } = req;

      if (!user) return;

      if (user?.emailVerified) {
        return res.status(400).json({
          success: false,
          message: "Email is already verified",
          code: "EMAIL_ALREADY_VERIFIED",
        });
      }

      const result = await verificationService.verifyEmail(
        user.id,
        user.email,
        code
      );

      res.status(200).json({
        success: true,
        message: "Email verified successfully",
        data: {
          verifiedAt: result.verifiedAt,
          user: result.user,
        },
      });
    } catch (error: any) {
      console.error("Email verification error:", error);
      res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || "Email verification failed",
        code: error.code || "EMAIL_VERIFICATION_FAILED",
      });
    }
  }

  async resendEmailVerification(req: Request, res: Response) {
    try {
      const { user } = req;

      if (!user) return;

      if (user.emailVerified) {
        return res.status(400).json({
          success: false,
          message: "Email is already verified",
          code: "EMAIL_ALREADY_VERIFIED",
        });
      }

      const result = await verificationService.resendEmailVerification(
        user.id,
        user.email
      );

      res.status(200).json({
        success: true,
        message: "Verification code resent to your email",
        data: {
          sentTo: user.email,
          expiresIn: result.expiresIn,
          canResendAt: result.canResendAt,
        },
      });
    } catch (error: any) {
      console.error("Resend email verification error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to resend verification email",
        code: error.code || "VERIFICATION_RESEND_FAILED",
      });
    }
  }

  async getVerificationStatus(req: Request, res: Response) {
    try {
      const { user } = req;
      if (!user) {
        res.status(500).json({
          success: false,
          message: "User does not exist",
        });
        return;
      }

      const status = await verificationService.getVerificationStatus(user.id);

      res.status(200).json({
        success: true,
        message: "Verification status retrieved",
        data: status,
      });
    } catch (error: any) {
      console.error("Get verification status error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to get verification status",
        code: error.code || "VERIFICATION_STATUS_FAILED",
      });
    }
  }
}

export const verificationController = new VerificationController();
