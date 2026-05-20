import { Request, Response } from "express";
import { prisma } from "@newcondo/db";
import { sendResponse } from "@newcondo/backend-shared";
import { generateOTP } from "@newcondo/backend-shared";
import { sendEmail } from "@newcondo/backend-shared";
import type { AuthenticatedRequest } from "../types/auth";
// import { otpService } from '../services/otpService';

class OTPController {
  async sendOTP(req: Request, res: Response) {
    try {
      const { identifier, type } = req.body; // identifier can be email

      // const result = await otpService.sendOtp({
      //   email,
      //   phone,
      //   type,
      // });

      // Generate OTP
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Delete any existing OTP for this identifier and type
      await prisma.oTPCode.deleteMany({
        where: {
          identifier,
          type,
        },
      });

      // Create new OTP
      await prisma.oTPCode.create({
        data: {
          identifier,
          code: otp,
          type,
          expiresAt,
        },
      });

      // Send OTP based on type
      if (type === "EMAIL_VERIFICATION" || type === "LOGIN") {
        await sendEmail({
          to: identifier,
          subject: "Your NewCondo verification code",
          html: `
            <h2>Verification Code</h2>
            <p>Your verification code is: <strong>${otp}</strong></p>
            <p>This code will expire in 10 minutes.</p>
          `,
        });
      }

      sendResponse(res, 200, "OTP sent successfully", {
        message: "Please check your email for the verification code",
        expiresIn: 600, // 10 minutes in seconds
      });
    } catch (error) {
      console.error("Send OTP error:", error);
      sendResponse(res, 500, "Failed to send OTP", null);
    }
  }

  async verifyOTP(req: Request, res: Response) {
    try {
      const { identifier, code, type } = req.body;

      // const { email, phone, code, type } = req.body;

      // const result = await otpService.verifyOtp({
      //   email,
      //   phone,
      //   code,
      //   type,
      // });

      // Find and verify OTP
      const otpRecord = await prisma.oTPCode.findFirst({
        where: {
          identifier,
          code,
          type,
          verified: false,
          expiresAt: { gt: new Date() },
          attempts: { lt: 3 }, // Max 3 attempts
        },
      });

      if (!otpRecord) {
        // Increment attempts if record exists
        await prisma.oTPCode.updateMany({
          where: {
            identifier,
            type,
            verified: false,
          },
          data: {
            attempts: { increment: 1 },
          },
        });

        return sendResponse(res, 400, "Invalid or expired OTP", null);
      }

      // Mark OTP as verified
      await prisma.oTPCode.update({
        where: { id: otpRecord.id },
        data: { verified: true },
      });

      // Update user verification status based on OTP type
      if (type === "EMAIL_VERIFICATION") {
        await prisma.user.update({
          where: { email: identifier },
          data: {
            emailVerified: new Date(),
          },
        });
      }

      // Log verification event
      const user = await prisma.user.findUnique({
        where: { email: identifier },
      });

      if (user) {
        await prisma.eventLog.create({
          data: {
            userId: user.id,
            type: "OTP_VERIFIED",
            metadata: { otpType: type },
          },
        });
      }

      sendResponse(res, 200, "OTP verified successfully", {
        verified: true,
        type,
      });
    } catch (error) {
      console.error("Verify OTP error:", error);
      sendResponse(res, 500, "Failed to verify OTP", null);
    }
  }

  async resendOTP(req: Request, res: Response) {
    try {
      const { identifier, type } = req.body;

      // const { email, phone, type } = req.body;

      // const result = await otpService.resendOtp({
      //   email,
      //   phone,
      //   type,
      // });

      // Check if we can resend (not too frequent)
      const recentOTP = await prisma.oTPCode.findFirst({
        where: {
          identifier,
          type,
          createdAt: { gt: new Date(Date.now() - 2 * 60 * 1000) }, // 2 minutes ago
        },
      });

      if (recentOTP) {
        return sendResponse(
          res,
          429,
          "Please wait before requesting another code",
          null
        );
      }

      // Generate new OTP
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Delete existing OTPs
      await prisma.oTPCode.deleteMany({
        where: {
          identifier,
          type,
        },
      });

      // Create new OTP
      await prisma.oTPCode.create({
        data: {
          identifier,
          code: otp,
          type,
          expiresAt,
        },
      });

      // Send new OTP
      if (type === "EMAIL_VERIFICATION" || type === "LOGIN") {
        await sendEmail({
          to: identifier,
          subject: "Your NewCondo verification code (Resent)",
          html: `
            <h2>Verification Code</h2>
            <p>Your new verification code is: <strong>${otp}</strong></p>
            <p>This code will expire in 10 minutes.</p>
          `,
        });
      }

      sendResponse(res, 200, "New OTP sent successfully", {
        message: "Please check your email for the new verification code",
      });
    } catch (error) {
      console.error("Resend OTP error:", error);
      sendResponse(res, 500, "Failed to resend OTP", null);
    }
  }

  async getOtpStatus(req: Request, res: Response) {
    try {
      const { email, phone, type } = req.query;

      // const status = await otpService.getOtpStatus({
      //   email: email as string,
      //   phone: phone as string,
      //   type: type as string,
      // });

      let status = undefined;

      res.status(200).json({
        success: true,
        message: "OTP status retrieved successfully",
        data: status,
      });
    } catch (error: any) {
      console.error("Get OTP status error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to retrieve OTP status",
        code: error.code || "OTP_STATUS_FAILED",
      });
    }
  }

  async validateOtpToken(req: Request, res: Response) {
    try {
      const { token } = req.body;

      // const result = await otpService.validateOtpToken(token);

      // remove the "let result = null" below as its just a placeholder
      let result = null;

      res.status(200).json({
        success: true,
        message: "OTP token validated successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Validate OTP token error:", error);
      res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || "OTP token validation failed",
        code: error.code || "OTP_TOKEN_VALIDATION_FAILED",
      });
    }
  }

  async clearExpiredOtps(req: Request, res: Response) {
    try {
      // const result = await otpService.clearExpiredOtps();

      // remove the "let result = null" below as its just a placeholder
      let result = { clearedCount: "ye" };

      res.status(200).json({
        success: true,
        message: "Expired OTPs cleared successfully",
        data: {
          clearedCount: result.clearedCount,
        },
      });
    } catch (error: any) {
      console.error("Clear expired OTPs error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to clear expired OTPs",
        code: error.code || "CLEAR_EXPIRED_OTPS_FAILED",
      });
    }
  }

  async sendPhoneOtp(req: AuthenticatedRequest, res: Response) {
    try {
      const { user } = req;
      const { phone } = req.body;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
          code: "NOT_AUTHENTICATED",
        });
      }

      // const result = await otpService.sendPhoneOtp(user.id, phone);

      // remove the "let result = null" below as its just a placeholder
      let result = { expiresIn: "today" };

      res.status(200).json({
        success: true,
        message: "Phone OTP sent successfully",
        data: {
          sentTo: phone,
          expiresIn: result.expiresIn,
        },
      });
    } catch (error: any) {
      console.error("Send phone OTP error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to send phone OTP",
        code: error.code || "PHONE_OTP_SEND_FAILED",
      });
    }
  }

  async verifyPhoneOtp(req: AuthenticatedRequest, res: Response) {
    try {
      const { user } = req;
      const { phone, code } = req.body;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
          code: "NOT_AUTHENTICATED",
        });
      }

      // const result = await otpService.verifyPhoneOtp(user.id, phone, code);

      // remove the "let result = null" below as its just a placeholder
      let result = null;

      res.status(200).json({
        success: true,
        message: "Phone OTP verified successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Verify phone OTP error:", error);
      res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || "Phone OTP verification failed",
        code: error.code || "PHONE_OTP_VERIFICATION_FAILED",
      });
    }
  }
}

// export { OTPController as otpController };

export const otpController = new OTPController();
