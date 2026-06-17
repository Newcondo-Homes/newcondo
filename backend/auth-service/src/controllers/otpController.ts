import { Request, Response } from "express";
import { prisma } from "@newcondo/db";
import { sendResponse } from "@newcondo/backend-shared";
import { generateOTP } from "@newcondo/backend-shared";
import { sendEmail } from "@newcondo/backend-shared";
import type { AuthenticatedRequest } from "../types/auth";
import { OTPType } from "@newcondo/db";

// Validate and cast string to OTPType enum
function parseOTPType(type: unknown): OTPType | null {
  const valid: OTPType[] = [
    OTPType.EMAIL_VERIFICATION,
    OTPType.PHONE_VERIFICATION,
    OTPType.PASSWORD_RESET,
    OTPType.LOGIN,
  ];
  if (typeof type === "string" && valid.includes(type as OTPType)) {
    return type as OTPType;
  }
  return null;
}

class OTPController {
  /**
   * Send OTP — used for first-time sends, including pre-registration.
   * No user existence check since OTPs are created before the user record
   * exists in the registration flow.
   */
  async sendOTP(req: Request, res: Response) {
    try {
      const { identifier, type } = req.body;

      if (!identifier || !type) {
        return sendResponse(res, 400, "identifier and type are required", null);
      }

      // Rate limit — prevent spam, same email+type within 1 minute
      const recentOTP = await prisma.oTPCode.findFirst({
        where: {
          identifier,
          type,
          createdAt: { gt: new Date(Date.now() - 60 * 1000) },
        },
      });

      if (recentOTP) {
        return sendResponse(
          res,
          429,
          "Please wait 1 minute before requesting another code",
          null
        );
      }

      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Delete any existing OTP for this identifier+type before creating a new one
      await prisma.oTPCode.deleteMany({
        where: { identifier, type },
      });

      await prisma.oTPCode.create({
        data: {
          identifier,
          code: otp,
          type,
          expiresAt,
        },
      });

      if (type === "EMAIL_VERIFICATION" || type === "LOGIN") {
        await sendEmail({
          to: identifier,
          subject: "Your NewCondo verification code",
          html: `
            <h2>Verification Code</h2>
            <p>Your verification code is: <strong>${otp}</strong></p>
            <p>This code will expire in 10 minutes.</p>
            <p>If you did not request this code, please ignore this email.</p>
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

  /**
   * Verify OTP — works for all flows including pre-registration.
   * Checks code validity, expiry, and attempt limits.
   */
  async verifyOTP(req: Request, res: Response) {
    try {
      const { identifier, code, type } = req.body;

      if (!identifier || !code || !type) {
        return sendResponse(res, 400, "identifier, code, and type are required", null);
      }

      // Find the OTP record
      const otpRecord = await prisma.oTPCode.findFirst({
        where: {
          identifier,
          type,
          verified: false,
          expiresAt: { gt: new Date() },
        },
      });

      if (!otpRecord) {
        return sendResponse(res, 400, "OTP has expired or does not exist. Please request a new code.", null);
      }

      // Check if max attempts exceeded
      if (otpRecord.attempts >= otpRecord.maxAttempts) {
        return sendResponse(
          res,
          429,
          `Maximum attempts reached. Please request a new code.`,
          null
        );
      }

      // Check if the code matches
      if (otpRecord.code !== code) {
        // Increment attempts on wrong code
        await prisma.oTPCode.update({
          where: { id: otpRecord.id },
          data: { attempts: { increment: 1 } },
        });

        const remainingAttempts = otpRecord.maxAttempts - (otpRecord.attempts + 1);

        return sendResponse(
          res,
          400,
          remainingAttempts > 0
            ? `Invalid code. ${remainingAttempts} attempt${remainingAttempts === 1 ? "" : "s"} remaining.`
            : "Invalid code. No attempts remaining. Please request a new code.",
          null
        );
      }

      // Code is correct — mark as verified
      await prisma.oTPCode.update({
        where: { id: otpRecord.id },
        data: { verified: true },
      });

      // Update user email verification status only if the user exists
      // (they won't during pre-registration flow)
      if (type === "EMAIL_VERIFICATION") {
        const user = await prisma.user.findUnique({
          where: { email: identifier },
        });

        if (user) {
          await prisma.user.update({
            where: { email: identifier },
            data: { emailVerified: new Date() },
          });

          await prisma.eventLog.create({
            data: {
              userId: user.id,
              type: "OTP_VERIFIED",
              metadata: { otpType: type },
            },
          });
        }
        // If no user yet (pre-registration), verification is still successful —
        // the email will be marked verified when the user record is created.
      }

      if (type === "LOGIN") {
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

  /**
   * Resend OTP — requires a prior sendOTP call to have been made.
   * Works for both pre-registration and post-registration flows.
   * No user existence check for the same reason as sendOTP.
   */
  async resendOTP(req: Request, res: Response) {
    try {
      const { identifier, type } = req.body;

      if (!identifier || !type) {
        return sendResponse(res, 400, "identifier and type are required", null);
      }

      // Ensure sendOTP was called first — prevents resend without initial send
      const existingOTP = await prisma.oTPCode.findFirst({
        where: { identifier, type },
      });

      if (!existingOTP) {
        return sendResponse(
          res,
          400,
          "No verification was initiated for this email. Please start again.",
          null
        );
      }

      // Rate limit — prevent resend spam within 1 minute
      const recentOTP = await prisma.oTPCode.findFirst({
        where: {
          identifier,
          type,
          createdAt: { gt: new Date(Date.now() - 60 * 1000) },
        },
      });

      if (recentOTP) {
        return sendResponse(
          res,
          429,
          "Please wait 1 minute before requesting another code",
          null
        );
      }

      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Delete old OTP and create fresh one
      await prisma.oTPCode.deleteMany({
        where: { identifier, type },
      });

      await prisma.oTPCode.create({
        data: {
          identifier,
          code: otp,
          type,
          expiresAt,
        },
      });

      if (type === "EMAIL_VERIFICATION" || type === "LOGIN") {
        await sendEmail({
          to: identifier,
          subject: "Your NewCondo verification code (Resent)",
          html: `
            <h2>New Verification Code</h2>
            <p>Your new verification code is: <strong>${otp}</strong></p>
            <p>This code will expire in 10 minutes.</p>
            <p>If you did not request this code, please ignore this email.</p>
          `,
        });
      }

      sendResponse(res, 200, "New OTP sent successfully", {
        message: "Please check your email for the new verification code",
        expiresIn: 600,
      });
    } catch (error) {
      console.error("Resend OTP error:", error);
      sendResponse(res, 500, "Failed to resend OTP", null);
    }
  }

  /**
   * Get OTP status — returns current OTP state for an identifier+type.
   */
  async getOtpStatus(req: Request, res: Response) {
    try {
      const { identifier, type: rawType } = req.query;

      if (!identifier || !rawType) {
        return sendResponse(res, 400, "identifier and type are required", null);
      }

      const type = parseOTPType(rawType);
      
      if (!type) {
        return sendResponse(res, 400, `Invalid OTP type. Must be one of: ${Object.values(OTPType).join(", ")}`, null);
      }
      const otpRecord = await prisma.oTPCode.findFirst({
        where: {
          identifier: identifier as string,
          type,
        },
        select: {
          verified: true,
          expiresAt: true,
          attempts: true,
          maxAttempts: true,
          createdAt: true,
        },
      });

      if (!otpRecord) {
        return sendResponse(res, 404, "No OTP found for this identifier", null);
      }

      const isExpired = otpRecord.expiresAt < new Date();
      const isMaxAttemptsReached = otpRecord.attempts >= otpRecord.maxAttempts;

      sendResponse(res, 200, "OTP status retrieved successfully", {
        verified: otpRecord.verified,
        expired: isExpired,
        maxAttemptsReached: isMaxAttemptsReached,
        attemptsRemaining: Math.max(0, otpRecord.maxAttempts - otpRecord.attempts),
        expiresAt: otpRecord.expiresAt,
        createdAt: otpRecord.createdAt,
      });
    } catch (error) {
      console.error("Get OTP status error:", error);
      sendResponse(res, 500, "Failed to retrieve OTP status", null);
    }
  }

  /**
   * Clear expired OTPs — meant to be called by a cron job or admin endpoint.
   */
  async clearExpiredOtps(req: Request, res: Response) {
    try {
      const result = await prisma.oTPCode.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      });

      sendResponse(res, 200, "Expired OTPs cleared successfully", {
        clearedCount: result.count,
      });
    } catch (error) {
      console.error("Clear expired OTPs error:", error);
      sendResponse(res, 500, "Failed to clear expired OTPs", null);
    }
  }

  /**
   * Send phone OTP — authenticated route, user must be logged in.
   */
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

      if (!phone) {
        return res.status(400).json({
          success: false,
          message: "Phone number is required",
          code: "PHONE_REQUIRED",
        });
      }

      // Rate limit
      const recentOTP = await prisma.oTPCode.findFirst({
        where: {
          identifier: phone,
          type: "PHONE_VERIFICATION",
          createdAt: { gt: new Date(Date.now() - 60 * 1000) },
        },
      });

      if (recentOTP) {
        return res.status(429).json({
          success: false,
          message: "Please wait 1 minute before requesting another code",
          code: "RATE_LIMITED",
        });
      }

      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await prisma.oTPCode.deleteMany({
        where: { identifier: phone, type: "PHONE_VERIFICATION" },
      });

      await prisma.oTPCode.create({
        data: {
          identifier: phone,
          code: otp,
          type: "PHONE_VERIFICATION",
          expiresAt,
        },
      });

      // TODO: integrate SMS provider (Termii, Twilio, etc.) here
      // await sendSMS({ to: phone, message: `Your NewCondo code is: ${otp}` })

      res.status(200).json({
        success: true,
        message: "Phone OTP sent successfully",
        data: {
          sentTo: phone,
          expiresIn: 600,
        },
      });
    } catch (error) {
      console.error("Send phone OTP error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to send phone OTP",
        code: "PHONE_OTP_SEND_FAILED",
      });
    }
  }

  /**
   * Verify phone OTP — authenticated route.
   */
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

      if (!phone || !code) {
        return res.status(400).json({
          success: false,
          message: "Phone and code are required",
          code: "MISSING_FIELDS",
        });
      }

      const otpRecord = await prisma.oTPCode.findFirst({
        where: {
          identifier: phone,
          type: "PHONE_VERIFICATION",
          verified: false,
          expiresAt: { gt: new Date() },
        },
      });

      if (!otpRecord) {
        return res.status(400).json({
          success: false,
          message: "OTP has expired or does not exist. Please request a new code.",
          code: "OTP_INVALID",
        });
      }

      if (otpRecord.attempts >= otpRecord.maxAttempts) {
        return res.status(429).json({
          success: false,
          message: "Maximum attempts reached. Please request a new code.",
          code: "MAX_ATTEMPTS_REACHED",
        });
      }

      if (otpRecord.code !== code) {
        await prisma.oTPCode.update({
          where: { id: otpRecord.id },
          data: { attempts: { increment: 1 } },
        });

        const remainingAttempts = otpRecord.maxAttempts - (otpRecord.attempts + 1);

        return res.status(400).json({
          success: false,
          message: remainingAttempts > 0
            ? `Invalid code. ${remainingAttempts} attempt${remainingAttempts === 1 ? "" : "s"} remaining.`
            : "Invalid code. No attempts remaining. Please request a new code.",
          code: "OTP_INVALID",
        });
      }

      // Mark verified and update user phone
      await prisma.oTPCode.update({
        where: { id: otpRecord.id },
        data: { verified: true },
      });

      await prisma.user.update({
        where: { id: user.id },
        data: {
          phone,
          phoneVerified: new Date(),
        },
      });

      await prisma.eventLog.create({
        data: {
          userId: user.id,
          type: "PHONE_OTP_VERIFIED",
          metadata: { phone },
        },
      });

      res.status(200).json({
        success: true,
        message: "Phone verified successfully",
        data: { verified: true },
      });
    } catch (error) {
      console.error("Verify phone OTP error:", error);
      res.status(500).json({
        success: false,
        message: "Phone OTP verification failed",
        code: "PHONE_OTP_VERIFICATION_FAILED",
      });
    }
  }
}

export const otpController = new OTPController();