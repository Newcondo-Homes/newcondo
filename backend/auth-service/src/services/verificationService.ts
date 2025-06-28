import { prisma } from "@newcondo/db";
import { OTPType } from "@newcondo/db";
import { otpService } from "./otpService";
import { sendVerificationEmail } from "../../../shared/src/utils/email";
// import { AuthError } from '../types/auth';

class VerificationService {
  async sendEmailVerification(userId: string, email: string) {
    try {
      // Check if user exists and email is not already verified
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AuthError("User not found", "USER_NOT_FOUND", 404);
      }

      if (user.emailVerified) {
        throw new AuthError(
          "Email is already verified",
          "EMAIL_ALREADY_VERIFIED",
          400
        );
      }

      // Generate and send OTP
      const otp = await otpService.generate_OTP(
        email,
        OTPType.EMAIL_VERIFICATION
      );

      if (!otp.success) {
        throw new Error(
          otp.message || "OTP verification failed. Please check your code."
        );
      }
      // Send email with OTP
      const emailSent = await sendVerificationEmail(
        email,
        otp.otpCode!,
        user.name || "User"
      );

      if (!emailSent) {
        throw new AuthError(
          "Failed to send verification email",
          "EMAIL_SEND_FAILED",
          500
        );
      }

      return {
        sentTo: email,
        expiresIn: Math.floor((otp.expiresAt!.getTime() - Date.now()) / 1000),
      };
    } catch (error: any) {
      console.error("Send email verification error:", error);
      throw error instanceof AuthError
        ? error
        : new AuthError(
            "Failed to send email verification",
            "VERIFICATION_SEND_FAILED",
            500
          );
    }
  }

  async verifyEmail(userId: string, email: string, code: string) {
    try {
      // Verify OTP
      const isValidOTP = await otpService.verifyOTP(
        email,
        code,
        OTPType.EMAIL_VERIFICATION
      );

      if (!isValidOTP) {
        throw new AuthError(
          "Invalid or expired verification code",
          "INVALID_OTP",
          400
        );
      }

      // Update user's email verification status
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          emailVerified: new Date(),
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          verificationStatus: true,
          emailVerified: true,
          phoneVerified: true,
          image: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Log verification event
      await prisma.eventLog.create({
        data: {
          userId,
          type: "EMAIL_VERIFIED",
          metadata: {
            email,
            verifiedAt: new Date(),
          },
        },
      });

      return {
        verifiedAt: updatedUser.emailVerified,
        user: {
          ...updatedUser,
          isEmailVerified: !!updatedUser.emailVerified,
          isPhoneVerified: !!updatedUser.phoneVerified,
        },
      };
    } catch (error: any) {
      console.error("Email verification error:", error);
      throw error instanceof AuthError
        ? error
        : new AuthError(
            "Email verification failed",
            "EMAIL_VERIFICATION_FAILED",
            500
          );
    }
  }

  async resendEmailVerification(userId: string, email: string) {
    try {
      // Check for recent verification attempts
      const recentOTP = await prisma.oTPCode.findFirst({
        where: {
          identifier: email,
          type: OTPType.EMAIL_VERIFICATION,
          createdAt: {
            gte: new Date(Date.now() - 2 * 60 * 1000), // Within last 2 minutes
          },
        },
        orderBy: { createdAt: "desc" },
      });

      if (recentOTP) {
        const nextResendTime = new Date(
          recentOTP.createdAt.getTime() + 2 * 60 * 1000
        );
        throw new AuthError(
          "Please wait before requesting another verification code",
          "RESEND_TOO_SOON",
          429
        );
      }

      // Send new verification
      const result = await this.sendEmailVerification(userId, email);

      return {
        ...result,
        canResendAt: new Date(Date.now() + 2 * 60 * 1000),
      };
    } catch (error: any) {
      console.error("Resend email verification error:", error);
      throw error instanceof AuthError
        ? error
        : new AuthError(
            "Failed to resend verification email",
            "VERIFICATION_RESEND_FAILED",
            500
          );
    }
  }

  async getVerificationStatus(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          emailVerified: true,
          phoneVerified: true,
          verificationStatus: true,
          verifiedAt: true,
        },
      });

      if (!user) {
        throw new AuthError("User not found", "USER_NOT_FOUND", 404);
      }

      return {
        emailVerified: !!user.emailVerified,
        phoneVerified: !!user.phoneVerified,
        verificationStatus: user.verificationStatus,
        verifiedAt: user.verifiedAt,
        emailVerifiedAt: user.emailVerified,
        phoneVerifiedAt: user.phoneVerified,
      };
    } catch (error: any) {
      console.error("Get verification status error:", error);
      throw error instanceof AuthError
        ? error
        : new AuthError(
            "Failed to get verification status",
            "VERIFICATION_STATUS_FAILED",
            500
          );
    }
  }
}

// Custom error class
class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export const verificationService = new VerificationService();
