import { Request, Response } from "express";
import { prisma } from "@newcondo/db";
import { sendResponse } from "@newcondo/backend-shared";
import { generateOTP } from "@newcondo/backend-shared";

// note: this new brandedemail( sendBrandedEmail ) does not throw an error, in the future see if
// you can make it throw an error in events of failure
import { sendBrandedEmail, EmailTemplates, OTP } from "@newcondo/backend-shared";
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

/**
 * Facebook may return no email. Prisma requires User.email, so the provider
 * writes fb_<id>@placeholder.newcondo to let the row be created at all; the
 * onboarding details step then collects a real address.
 *
 * MUST match PLACEHOLDER_EMAIL_DOMAIN in packages/auth/auth.full.ts.
 */
const PLACEHOLDER_EMAIL_DOMAIN = "placeholder.newcondo";
const isPlaceholderEmail = (email?: string | null): boolean =>
  !!email && email.endsWith(`@${PLACEHOLDER_EMAIL_DOMAIN}`);

/**
 * Mint + send an EMAIL_VERIFICATION code. Shared by ensureOtp and the
 * resendOTP fallback so the two cannot drift apart.
 *
 * Uses deleteMany + create (not upsert) to match the proven pattern in this
 * file — it does not depend on a compound unique index existing on
 * (identifier, type).
 *
 * Returns whether the transport actually accepted the mail: sendBrandedEmail
 * swallows failures, so without checking this we would claim success while the
 * user stares at an empty inbox.
 */
async function issueEmailVerificationCode(identifier: string): Promise<boolean> {
  const otp = generateOTP(OTP.length);
  const expiresAt = new Date(Date.now() + OTP.expiryMinutes * 60 * 1000);

  await prisma.oTPCode.deleteMany({
    where: { identifier, type: OTPType.EMAIL_VERIFICATION },
  });
  await prisma.oTPCode.create({
    data: { identifier, code: otp, type: OTPType.EMAIL_VERIFICATION, expiresAt },
  });

  const sent = (await sendBrandedEmail(
    identifier,
    EmailTemplates.otp({
      code: otp,
      purpose: "verify your email",
      expiresMinutes: OTP.expiryMinutes,
    })
  )) as { success?: boolean } | void;

  return sent?.success !== false;
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
          createdAt: { gt: new Date(Date.now() - OTP.resendCooldownSeconds * 1000) },
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

      const otp = generateOTP(OTP.length);
      const expiresAt = new Date(Date.now() + OTP.expiryMinutes * 60 * 1000);

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
        await sendBrandedEmail(
          identifier,
          EmailTemplates.otp({
            code: otp,
            // Shows in the email as "…to verify your email" / "…to sign in",
            // so one template serves both flows.
            purpose: type === "LOGIN" ? "sign in" : "verify your email",
            expiresMinutes: OTP.expiryMinutes,
          })
        );
      }

      sendResponse(res, 200, "OTP sent successfully", {
        message: "Please check your email for the verification code",
        expiresIn: OTP.expiryMinutes * 60,
      });
    } catch (error) {
      console.error("Send OTP error:", error);
      sendResponse(res, 500, "Failed to send OTP", null);
    }
  }

  /**
   * POST /api/v1/auth/ensure-otp   (authMiddleware)
   *
   * Guarantees a live EMAIL_VERIFICATION code exists for the CALLER'S OWN
   * address, without disturbing one already in flight.
   *
   * WHY THIS EXISTS: only /auth/register writes the OTPCode row, and OAuth
   * users never call it — the NextAuth Prisma adapter creates their User row
   * directly. So a Google/Facebook signup reached the verify step with no code
   * ever minted: the panel showed a code field for a code nobody sent, and
   * resendOTP refused because it required an existing row.
   *
   * WHY IDEMPOTENT RATHER THAN A PLAIN SEND: the client calls this on every
   * entry into the verify step, and that step remounts for reasons the user
   * never intended (refresh, tab restore, returning to a backgrounded tab). A
   * plain send would mint a new code each time and invalidate the one already
   * in the inbox — the exact failure the register-before-OTP design exists to
   * prevent. So:
   *
   *   live unexpired, unredeemed code → touch nothing, { minted: false }
   *   missing / expired / spent       → mint, send, { minted: true }
   *
   * Scoped to req.user's own email on purpose. Taking the address from the body
   * would make this a way to spray verification mail at arbitrary addresses.
   *
   * Typed as `Request`, not `AuthenticatedRequest`: Express's RequestHandler
   * passes a Request whose `user` is OPTIONAL, so a handler demanding the
   * required-`user` shape is not assignable and the route call fails to
   * compile. The `if (!user)` guard below narrows it instead — which is also
   * the honest shape, since nothing at the type level proves authMiddleware ran.
   */
  async ensureOtp(req: Request, res: Response) {
    try {
      const user = req.user;
      if (!user) {
        return sendResponse(res, 401, "User not authenticated", null);
      }

      const me = await prisma.user.findUnique({
        where: { id: user.id },
        select: { email: true, emailVerified: true },
      });
      if (!me?.email) {
        return sendResponse(res, 400, "No email address on this account", null);
      }

      // A Facebook signup that returned no email carries a synthetic address.
      // Mailing it would bounce (the domain does not exist) and, worse, the
      // failure would look like a transport problem rather than what it is:
      // we have not asked this person for their email yet. The onboarding
      // details step collects one first.
      if (isPlaceholderEmail(me.email)) {
        return sendResponse(
          res,
          400,
          "Add your email address before we can verify it.",
          { minted: false, needsEmail: true }
        );
      }

      // Already proven — nothing to verify. 200 keeps the client simple: a race
      // between verifying and this call is not an error.
      if (me.emailVerified) {
        return sendResponse(res, 200, "Email already verified", {
          minted: false,
          verified: true,
        });
      }

      const identifier = me.email.toLowerCase();

      // A code only counts as live if it exists, has not expired, AND has not
      // already been redeemed — `verified: true` rows are spent and must not
      // block a fresh mint.
      const live = await prisma.oTPCode.findFirst({
        where: {
          identifier,
          type: OTPType.EMAIL_VERIFICATION,
          verified: false,
          expiresAt: { gt: new Date() },
        },
        select: { id: true },
      });

      if (live) {
        return sendResponse(res, 200, "A code is already on its way", {
          minted: false,
        });
      }

      const sent = await issueEmailVerificationCode(identifier);

      if (!sent) {
        return sendResponse(res, 502, "We couldn't send the code. Please try again.", {
          minted: true,
          sent: false,
        });
      }

      return sendResponse(res, 200, "Verification code sent", {
        minted: true,
        sent: true,
        expiresIn: OTP.expiryMinutes * 60,
      });
    } catch (error) {
      console.error("Ensure OTP error:", error);
      return sendResponse(res, 500, "Failed to send verification code", null);
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
   * Resend OTP — normally requires a prior sendOTP call.
   * Works for both pre-registration and post-registration flows.
   * No user existence check for the same reason as sendOTP.
   */
  async resendOTP(req: Request, res: Response) {
    try {
      const { identifier, type } = req.body;

      if (!identifier || !type) {
        return sendResponse(res, 400, "identifier and type are required", null);
      }

      const existingOTP = await prisma.oTPCode.findFirst({
        where: { identifier, type },
      });

      if (!existingOTP) {
        // No row yet. For EMAIL_VERIFICATION this is the NORMAL state of an
        // OAuth signup — Google/Facebook users never call /auth/register, which
        // is what writes the row — so issue the first code instead of refusing.
        //
        // The old response ("No verification was initiated for this email.
        // Please start again.") was impossible advice for those users: no
        // earlier step would ever mint the code, so Resend could never succeed
        // and the account was permanently stuck. This also self-heals accounts
        // created before the ensure-otp fix landed.
        //
        // Other types still require an initiated flow. PASSWORD_RESET
        // especially must NOT be mintable here, or this becomes an
        // unauthenticated way to send reset codes to arbitrary addresses.
        if (type !== "EMAIL_VERIFICATION") {
          return sendResponse(
            res,
            400,
            "No verification was initiated for this email. Please start again.",
            null
          );
        }

        const firstSent = await issueEmailVerificationCode(identifier);
        return sendResponse(res, firstSent ? 200 : 502,
          firstSent
            ? "Verification code sent"
            : "We couldn't send the code. Please try again.",
          { emailSent: firstSent, expiresIn: OTP.expiryMinutes * 60 }
        );
      }

      // Rate limit — prevent resend spam within the cooldown window.
      // NOTE: /auth/register writes its OTP row directly, so a user who taps
      // Resend within 60s of registering correctly lands here. The panel shows
      // that as a countdown rather than an error — working as intended.
      const recentOTP = await prisma.oTPCode.findFirst({
        where: {
          identifier,
          type,
          createdAt: { gt: new Date(Date.now() - OTP.resendCooldownSeconds * 1000) },
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

      const otp = generateOTP(OTP.length);
      const expiresAt = new Date(Date.now() + OTP.expiryMinutes * 60 * 1000);

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
        await sendBrandedEmail(
          identifier,
          EmailTemplates.otp({
            code: otp,
            purpose: type === "LOGIN" ? "sign in" : "verify your email",
            expiresMinutes: OTP.expiryMinutes,
          })
        );
      }

      sendResponse(res, 200, "New OTP sent successfully", {
        message: "Please check your email for the new verification code",
        expiresIn: OTP.expiryMinutes * 60,
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
          createdAt: { gt: new Date(Date.now() - OTP.resendCooldownSeconds * 1000) },
        },
      });

      if (recentOTP) {
        return res.status(429).json({
          success: false,
          message: "Please wait 1 minute before requesting another code",
          code: "RATE_LIMITED",
        });
      }

      const otp = generateOTP(OTP.length);
      const expiresAt = new Date(Date.now() + OTP.expiryMinutes * 60 * 1000);

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
          expiresIn: OTP.expiryMinutes * 60,
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
