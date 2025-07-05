// backend/auth-service/src/services/emailOtpService.ts
import { prisma } from "@newcondo/db";
import { generateOTP } from "@newcondo/backend-shared/src/utils";
// import {
//   sendEmail,
//   generateOTPEmailHTML,
//   generateOTPEmailText,
// } from "../../../shared/src/utils/email";
import {
  sendEmail,
  generateOTPEmailHTML,
  generateOTPEmailText,
} from "@newcondo/backend-shared/src/utils";

// import { redis } from "../../../shared/src/config/redis";
import { redis } from "@newcondo/backend-shared/src/config/redis";


interface OTPVerificationResult {
  success: boolean;
  userId?: string;
  message: string;
}

interface OTPGenerationResult {
  success: boolean;
  message: string;
  expiresAt?: Date;
}

export class EmailOTPService {
  private static readonly OTP_EXPIRY_MINUTES = 10;
  private static readonly MAX_ATTEMPTS = 3;
  private static readonly COOLDOWN_MINUTES = 5;

  /**
   * Generate and send OTP via email
   */
  static async generateAndSendOTP(
    email: string,
    purpose: "REGISTRATION" | "LOGIN" | "PASSWORD_RESET"
  ): Promise<OTPGenerationResult> {
    try {
      // Check cooldown period
      const cooldownKey = `otp_cooldown:${email}`;
      const cooldownExpiry = await redis.get(cooldownKey);

      if (cooldownExpiry) {
        return {
          success: false,
          message: "Please wait before requesting another OTP",
        };
      }

      // Generate OTP
      const otp = generateOTP(6);
      const expiresAt = new Date(
        Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000
      );

      // Store OTP in Redis with expiry
      const otpKey = `otp:${email}:${purpose}`;
      await redis.setex(
        otpKey,
        this.OTP_EXPIRY_MINUTES * 60,
        JSON.stringify({
          otp,
          attempts: 0,
          createdAt: new Date(),
          expiresAt,
        })
      );

      // Send OTP via email
      await this.sendOTPEmail(email, otp, purpose);

      // Set cooldown period
      await redis.setex(cooldownKey, this.COOLDOWN_MINUTES * 60, "true");

      return {
        success: true,
        message: "OTP sent successfully",
        expiresAt,
      };
    } catch (error) {
      console.error("Error generating OTP:", error);
      return {
        success: false,
        message: "Failed to generate OTP",
      };
    }
  }

  /**
   * Verify OTP code
   */
  static async verifyOTP(
    email: string,
    otp: string,
    purpose: "REGISTRATION" | "LOGIN" | "PASSWORD_RESET"
  ): Promise<OTPVerificationResult> {
    try {
      const otpKey = `otp:${email}:${purpose}`;
      const storedData = await redis.get(otpKey);

      if (!storedData) {
        return {
          success: false,
          message: "OTP expired or not found",
        };
      }

      const { otp: storedOTP, attempts, expiresAt } = JSON.parse(storedData);

      // Check if OTP is expired
      if (new Date() > new Date(expiresAt)) {
        await redis.del(otpKey);
        return {
          success: false,
          message: "OTP has expired",
        };
      }

      // Check max attempts
      if (attempts >= this.MAX_ATTEMPTS) {
        await redis.del(otpKey);
        return {
          success: false,
          message: "Maximum attempts exceeded",
        };
      }

      // Verify OTP
      if (otp !== storedOTP) {
        // Increment attempts
        await redis.setex(
          otpKey,
          this.OTP_EXPIRY_MINUTES * 60,
          JSON.stringify({
            otp: storedOTP,
            attempts: attempts + 1,
            createdAt: new Date(),
            expiresAt,
          })
        );

        return {
          success: false,
          message: `Invalid OTP. ${this.MAX_ATTEMPTS - attempts - 1} attempts remaining`,
        };
      }

      // OTP is valid - remove from Redis
      await redis.del(otpKey);

      // Handle different purposes
      let userId: string | undefined;
      if (purpose === "REGISTRATION" || purpose === "LOGIN") {
        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true },
        });
        userId = user?.id;
      }

      return {
        success: true,
        userId,
        message: "OTP verified successfully",
      };
    } catch (error) {
      console.error("Error verifying OTP:", error);
      return {
        success: false,
        message: "Failed to verify OTP",
      };
    }
  }

  /**
   * Send OTP email based on purpose
   */
  private static async sendOTPEmail(
    email: string,
    otp: string,
    purpose: "REGISTRATION" | "LOGIN" | "PASSWORD_RESET"
  ): Promise<void> {
    const templates = {
      REGISTRATION: {
        subject: "Complete Your NewCondo Registration",
        template: "registration-otp",
      },
      LOGIN: {
        subject: "Your NewCondo Login Code",
        template: "login-otp",
      },
      PASSWORD_RESET: {
        subject: "Reset Your NewCondo Password",
        template: "password-reset-otp",
      },
    };

    const { subject, template } = templates[purpose];

    // Generate HTML and text content
    const html = generateOTPEmailHTML(otp, purpose, this.OTP_EXPIRY_MINUTES);
    const text = generateOTPEmailText(otp, purpose, this.OTP_EXPIRY_MINUTES);

    await sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  /**
   * Sends registration OTP
   * @param email : contains email the OTP will be sent to
   * @param otp : This is the OTP to be sent
   */
  public static async sendRegistrationOTP(
    email: string,
    otp: string
  ): Promise<void> {
    await this.sendOTPEmail(email, otp, "REGISTRATION");
  }

  /**
   * Sends login OTP
   * @param email : Email the OTP will be sent to
   * @param otp : The OTP to be sent
   */
  public static async sendLoginOTP(email: string, otp: string): Promise<void> {
    await this.sendOTPEmail(email, otp, "LOGIN");
  }

  /**
   * Sends password OTP
   * @param email : Email the OTP will be sent to
   * @param otp : The OTP to be sent
   */
  public static async sendPasswordResetOTP(
    email: string,
    otp: string
  ): Promise<void> {
    await this.sendOTPEmail(email, otp, "PASSWORD_RESET");
  }

  /**
   * Clean up expired OTPs (for scheduled cleanup)
   */
  static async cleanupExpiredOTPs(): Promise<void> {
    try {
      // This would be called by a scheduled job
      // Redis TTL will handle automatic cleanup, but we can implement
      // additional cleanup logic here if needed
      console.log("OTP cleanup completed");
    } catch (error) {
      console.error("Error during OTP cleanup:", error);
    }
  }

  /**
   * Get OTP status without revealing the actual OTP
   */
  static async getOTPStatus(
    email: string,
    purpose: "REGISTRATION" | "LOGIN" | "PASSWORD_RESET"
  ): Promise<{
    exists: boolean;
    attemptsRemaining?: number;
    expiresAt?: Date;
  }> {
    try {
      const otpKey = `otp:${email}:${purpose}`;
      const storedData = await redis.get(otpKey);

      if (!storedData) {
        return { exists: false };
      }

      const { attempts, expiresAt } = JSON.parse(storedData);

      return {
        exists: true,
        attemptsRemaining: this.MAX_ATTEMPTS - attempts,
        expiresAt: new Date(expiresAt),
      };
    } catch (error) {
      console.error("Error getting OTP status:", error);
      return { exists: false };
    }
  }
}
