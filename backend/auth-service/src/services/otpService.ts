import { prisma, OTPType } from "@newcondo/db";
import crypto from "crypto";

// export type OTPType = 'EMAIL_VERIFICATION' | 'PHONE_VERIFICATION' | 'PASSWORD_RESET' | 'LOGIN_VERIFICATION';

class OtpService {
  private readonly OTP_EXPIRY_MINUTES = 10; // OTP expires in 10 minutes
  private readonly OTP_LENGTH = 6;

  /**
   * Generate a random OTP code
   */
  private generateOTP(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Generate and store OTP for a given identifier (email/phone)
   */
  async generate_OTP(
    identifier: string,
    type: OTPType
  ): Promise<{
    success: boolean;
    otpCode?: string;
    message: string;
    expiresAt?: Date;
  }> {
    try {
      const otpCode = this.generateOTP();
      const expiresAt = new Date(
        Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000
      );

      // Delete any existing OTP for this identifier and type
      await prisma.oTPCode.deleteMany({
        where: {
          identifier,
          type,
        },
      });

      // Create new OTP record
      await prisma.oTPCode.create({
        data: {
          identifier,
          code: otpCode,
          type,
          expiresAt,
          verified: false,
        },
      });

      return {
        success: true,
        otpCode,
        message: "OTP generated successfully",
        expiresAt,
      };
    } catch (error) {
      console.error("Generate OTP error:", error);
      return {
        success: false,
        message: "Failed to generate OTP",
      };
    }
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(
    identifier: string,
    otpCode: string,
    type: OTPType
  ): Promise<boolean> {
    try {
      const otpRecord = await prisma.oTPCode.findFirst({
        where: {
          identifier,
          code: otpCode,
          type,
          verified: false,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (!otpRecord) {
        return false;
      }

      // Mark OTP as verified
      await prisma.oTPCode.update({
        where: { id: otpRecord.id },
        data: { verified: true },
      });

      return true;
    } catch (error) {
      console.error("Verify OTP error:", error);
      return false;
    }
  }

  /**
   * Check if OTP exists and is valid (without verifying it)
   */
  async isOTPValid(
    identifier: string,
    otpCode: string,
    type: OTPType
  ): Promise<boolean> {
    try {
      const otpRecord = await prisma.oTPCode.findFirst({
        where: {
          identifier,
          code: otpCode,
          type,
          verified: false,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      return !!otpRecord;
    } catch (error) {
      console.error("Check OTP validity error:", error);
      return false;
    }
  }

  /**
   * Resend OTP (generate new one and invalidate old ones)
   */
  async resendOTP(
    identifier: string,
    type: OTPType
  ): Promise<{ success: boolean; otpCode?: string; message: string }> {
    try {
      // Check if there's a recent OTP (within 1 minute) to prevent spam
      const recentOTP = await prisma.oTPCode.findFirst({
        where: {
          identifier,
          type,
          createdAt: {
            gt: new Date(Date.now() - 60 * 1000), // 1 minute ago
          },
        },
      });

      if (recentOTP) {
        return {
          success: false,
          message: "Please wait before requesting a new OTP",
        };
      }

      return await this.generate_OTP(identifier, type);
    } catch (error) {
      console.error("Resend OTP error:", error);
      return {
        success: false,
        message: "Failed to resend OTP",
      };
    }
  }

  /**
   * Clean up expired OTPs (should be called periodically)
   */
  async cleanupExpiredOTPs(): Promise<void> {
    try {
      await prisma.oTPCode.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });
    } catch (error) {
      console.error("Cleanup expired OTPs error:", error);
    }
  }

  /**
   * Get OTP attempts count for rate limiting
   */
  async getOTPAttempts(
    identifier: string,
    type: OTPType,
    timeWindowMinutes: number = 60
  ): Promise<number> {
    try {
      const attempts = await prisma.oTPCode.count({
        where: {
          identifier,
          type,
          createdAt: {
            gt: new Date(Date.now() - timeWindowMinutes * 60 * 1000),
          },
        },
      });

      return attempts;
    } catch (error) {
      console.error("Get OTP attempts error:", error);
      return 0;
    }
  }

  /**
   * Invalidate all OTPs for a given identifier and type
   */
  async invalidateOTPs(identifier: string, type: OTPType): Promise<void> {
    try {
      await prisma.oTPCode.updateMany({
        where: {
          identifier,
          type,
          verified: false,
        },
        data: {
          verified: true, // Mark as verified to invalidate
        },
      });
    } catch (error) {
      console.error("Invalidate OTPs error:", error);
    }
  }
}

export const otpService = new OtpService();
