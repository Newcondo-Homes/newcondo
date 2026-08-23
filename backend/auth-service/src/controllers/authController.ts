import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@newcondo/db";
import { Role } from "@newcondo/db";
import { sendResponse } from "@newcondo/backend-shared";
import { generateOTP } from "@newcondo/backend-shared";
import { sendEmail } from "@newcondo/backend-shared";

// note: this new brandedemail( sendBrandedEmail ) does not throw an error, in the future see if
// you can make it throw an error in events of failure
import { sendBrandedEmail, EmailTemplates, OTP } from "@newcondo/backend-shared";
import { AuthService } from "../services/authService";
import type { AuthenticatedRequest } from "../types/auth";

class AuthController {
  private authService = new AuthService();

  async register(req: Request, res: Response): Promise<any> {
    try {
      const { email: rawEmail, password, name, userType, phone } = req.body;
      const email = String(rawEmail ?? "").trim().toLowerCase();

      if (!email || !password) {
        return sendResponse(res, 400, "Email and password are required", null);
      }

      // Look up by email and phone separately: we can safely reuse an unverified
      // row that matches on EMAIL, but a phone collision with a different email
      // is someone else's account and must be refused.
      const [byEmail, byPhone] = await Promise.all([
        prisma.user.findUnique({ where: { email } }),
        phone ? prisma.user.findFirst({ where: { phone } }) : Promise.resolve(null),
      ]);

      if (byEmail?.emailVerified) {
        // A real, verified account. The onboarding flow reads this and sends them
        // to /login rather than trying to register again.
        return res.status(400).json({
          error: "Email is already registered and verified.",
          code: "EMAIL_VERIFIED_EXISTS",
        });
      }

      if (byPhone && byPhone.email !== email) {
        return res.status(400).json({
          error: "That phone number is already on another account.",
          code: "PHONE_TAKEN",
        });
      }

      const assignedRole = userType ? (userType as Role) : "RENTER";
      const passwordHash = await bcrypt.hash(password, 12);

      // Reuse the unverified stub instead of creating a duplicate. This is the
      // resume path: same person, same email, possibly a different role or phone
      // than their first abandoned attempt — so all three are refreshed.
      const user = byEmail
        ? await prisma.user.update({
          where: { id: byEmail.id },
          data: {
            passwordHash,
            name: name || byEmail.name,
            phone: phone || byEmail.phone,
            role: assignedRole,
          },
          select: {
            id: true, email: true, name: true, role: true, phone: true,
            emailVerified: true, phoneVerified: true, verificationStatus: true, createdAt: true,
          },
        })
        : await prisma.user.create({
          data: {
            email,
            passwordHash,
            name: name || null,
            phone: phone || null,
            role: assignedRole,
          },
          select: {
            id: true, email: true, name: true, role: true, phone: true,
            emailVerified: true, phoneVerified: true, verificationStatus: true, createdAt: true,
          },
        });

      // Issue the verification code. upsert on identifier_type refreshes an
      // existing code and resets attempts, so a returning user isn't locked out
      // by failed tries from a previous attempt.
      const otp = generateOTP(OTP.length);
      const expiresAt = new Date(Date.now() + OTP.expiryMinutes * 60 * 1000);

      await prisma.oTPCode.upsert({
        where: { identifier_type: { identifier: email, type: "EMAIL_VERIFICATION" } },
        update: { code: otp, expiresAt, verified: false, attempts: 0 },
        create: { identifier: email, code: otp, type: "EMAIL_VERIFICATION", expiresAt },
      });

      // ONE email, branded, and it is the newest thing in their inbox.
      // No welcome mail here — that now fires on subscription activation.
      const sent = (await sendBrandedEmail(
        email,
        EmailTemplates.otp({
          code: otp,
          purpose: "verify your email",
          expiresMinutes: OTP.expiryMinutes,
        })
      ))as { success?: boolean } | void;

      await prisma.eventLog.create({
        data: {
          userId: user.id,
          type: byEmail ? "USER_REGISTRATION_RESUMED" : "USER_REGISTERED",
          metadata: { role: user.role },
        },
      });

      return sendResponse(
        res,
        201,
        "Account created. Check your email for the verification code.",
        {
          user,
          requiresVerification: true,
          // False when the transport failed. The client surfaces this instead of
          // leaving the user waiting for a code that was never sent.
          emailSent: sent?.success !== false,
          resumed: !!byEmail,
          expiresIn: OTP.expiryMinutes * 60,
        }
      );
    } catch (error) {
      console.error("Registration error:", error);
      return sendResponse(res, 500, "Internal server error", null);
    }
  }


  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      // const MAX_ATTEMPTS = 5;
      // const LOCKOUT_TIME = 30 * 60 * 1000; // 30 minutes

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          passwordHash: true,
          role: true,
          emailVerified: true,
          verificationStatus: true,
          image: true,
        },
      });

      if (!user || !user.passwordHash) {
        return sendResponse(res, 401, "Invalid credentials", null);
      }

      // Check for account lockout (implement with Redis or database)
      // TODO: In production, use Redis for this. also see if you can make nextauth to use the backend login so you can unlock
      // complex logic
      // const lockoutKey = `lockout:${email}`;

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

      if (!isPasswordValid) {
        return sendResponse(res, 401, "Invalid credentials", null);
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
      );

      // Log successful login
      await prisma.eventLog.create({
        data: {
          userId: user.id,
          type: "USER_LOGIN",
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
        },
      });

      const { passwordHash, ...userWithoutPassword } = user;

      sendResponse(res, 200, "Login successful", {
        user: userWithoutPassword,
        token,
        expiresIn: "7d",
      });
    } catch (error) {
      console.error("Login error:", error);
      sendResponse(res, 500, "Internal server error", null);
    }
  }

  async logout(req: AuthenticatedRequest | Request, res: Response) {
    try {
      const { user } = req;
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
          code: "NOT_AUTHENTICATED",
        });
      }

      // await authService.logout(user.id);

      res.status(200).json({
        success: true,
        message: "Logout successful",
      });
    } catch (error: any) {
      console.error("Logout error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Logout failed",
        code: error.code || "LOGOUT_FAILED",
      });
    }
  }

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Don't reveal if email exists
        return sendResponse(
          res,
          200,
          "If your email is registered, you will receive a password reset code.",
          null
        );
      }

      // Generate reset OTP
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Delete any existing password reset codes
      await prisma.oTPCode.deleteMany({
        where: {
          identifier: email,
          type: "PASSWORD_RESET",
        },
      });

      await prisma.oTPCode.create({
        data: {
          identifier: email,
          code: otp,
          type: "PASSWORD_RESET",
          expiresAt,
        },
      });

      // Send reset email
      // await sendEmail({
      //   to: email,
      //   subject: "Reset your NewCondo password",
      //   html: `
      //     <h2>Password Reset Request</h2>
      //     <p>Your password reset code is: <strong>${otp}</strong></p>
      //     <p>This code will expire in 15 minutes.</p>
      //     <p>If you didn't request this, please ignore this email.</p>
      //   `,
      // });

      await sendBrandedEmail(
        user.email,
        EmailTemplates.passwordReset({
          name: user.name ?? undefined,
          // OTP-based flow: prefill the form with email + code (15-min expiry).
          resetUrl: `${process.env.FRONTEND_URL}/reset-password?email=${encodeURIComponent(email)}&code=${otp}`,
        })
      );

      //  Check FRONTEND_URL has no trailing slash and uses http:// in development
      //  (your agent-invite link showed `https://localhost:3000`, which won't open).
      sendResponse(
        res,
        200,
        "If your email is registered, you will receive a password reset code.",
        null
      );
    } catch (error) {
      console.error("Forgot password error:", error);
      sendResponse(res, 500, "Internal server error", null);
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const { email, otp, newPassword } = req.body;

      // Verify OTP
      const otpRecord = await prisma.oTPCode.findFirst({
        where: {
          identifier: email,
          code: otp,
          type: "PASSWORD_RESET",
          verified: false,
          expiresAt: { gt: new Date() },
        },
      });

      if (!otpRecord) {
        return sendResponse(res, 400, "Invalid or expired reset code", null);
      }

      // Hash new password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update user password
      await prisma.user.update({
        where: { email },
        data: { passwordHash },
      });

      // Mark OTP as used
      await prisma.oTPCode.update({
        where: { id: otpRecord.id },
        data: { verified: true },
      });

      // Log password reset
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        await prisma.eventLog.create({
          data: {
            userId: user.id,
            type: "PASSWORD_RESET",
            ipAddress: req.ip,
          },
        });
      }

      sendResponse(res, 200, "Password reset successfully", null);
    } catch (error) {
      console.error("Reset password error:", error);
      sendResponse(res, 500, "Internal server error", null);
    }
  }

  async checkEmailExists(req: Request, res: Response): Promise<any> {
    try {
      const email = (req.query.email as string | undefined)?.trim().toLowerCase();

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ exists: false, error: "Invalid email" });
      }

      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          emailVerified: true,
          subscription: {
            select: {
              status: true,
            },
          },
        },
      });

      // Fails open — if anything is wrong, we return false so a genuine
      // new signup is never blocked. The onboarding flow handles the rest.
      if (!user) {
        return res.status(200).json({ exists: false });
      }

      // User exists but never verified their email AND has no active subscription
      // → treat as a ghost/abandoned registration → allow re-onboarding
      const hasVerifiedEmail = !!user.emailVerified;
      const hasActiveSubscription =
        user.subscription !== null &&
        [
          "ACTIVE",
          "FREE_ACTIVE",
          "PAST_DUE",
          "CANCELLED",
          "PAUSED",
          "SUSPENDED",
        ].includes(user.subscription?.status ?? "");

      // Only block re-registration if they're a real, verified user
      // OR they have a subscription (paid or free — they went through onboarding)
      const isRealUser = hasVerifiedEmail || hasActiveSubscription;

      return res.status(200).json({ exists: isRealUser });
    } catch (error) {
      console.error("checkEmailExists error:", error);
      // Fail open — never block a signup due to a lookup error
      return res.status(200).json({ exists: false });
    }
  }

  async changeEmail(req: Request, res: Response): Promise<any> {
    try {
      const userId = req.user!.id;
      const email = String(req.body?.email ?? "").trim().toLowerCase();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return sendResponse(res, 400, "Enter a valid email address", null);
      }

      const me = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, emailVerified: true, subscription: { select: { status: true } } },
      });
      if (!me) return sendResponse(res, 404, "Account not found", null);

      // Once the address is verified it is an identity, not a form field: it is
      // what password reset and payment receipts key off. Changing it then is a
      // settings-page operation with re-verification of the CURRENT address
      // first, not a mid-onboarding correction. Refuse here.
      if (me.emailVerified) {
        return sendResponse(
          res,
          409,
          "Your email is already verified. Change it from your account settings.",
          null
        );
      }

      if (email === me.email) {
        // Nothing to change — but re-issue so a "Save & send code" tap that was
        // really just a resend still does the useful thing.
        const otp = generateOTP(OTP.length);
        await prisma.oTPCode.upsert({
          where: { identifier_type: { identifier: email, type: "EMAIL_VERIFICATION" } },
          update: { code: otp, expiresAt: new Date(Date.now() + OTP.expiryMinutes * 60 * 1000), verified: false, attempts: 0 },
          create: { identifier: email, code: otp, type: "EMAIL_VERIFICATION", expiresAt: new Date(Date.now() + OTP.expiryMinutes * 60 * 1000) },
        });
        const resent = (await sendBrandedEmail(
          email,
          EmailTemplates.otp({ code: otp, purpose: "verify your email", expiresMinutes: OTP.expiryMinutes })
        )) as { success?: boolean } | void;
        return sendResponse(res, 200, "Verification code sent", { email, emailSent: resent?.success !== false });
      }

      // Is the new address already someone's real account?
      const taken = await prisma.user.findUnique({
        where: { email },
        select: { id: true, emailVerified: true, subscription: { select: { status: true } } },
      });
      if (taken && taken.id !== userId && (taken.emailVerified || taken.subscription)) {
        return sendResponse(res, 409, "That email is already registered. Sign in instead.", null);
      }
      // An unverified, unsubscribed row on the target address is a ghost (the same
      // rule checkEmailExists applies). Remove it so the unique index is free —
      // it represents an abandoned attempt, not a person with an account.
      if (taken && taken.id !== userId) {
        await prisma.$transaction([
          prisma.oTPCode.deleteMany({ where: { identifier: email } }),
          prisma.user.delete({ where: { id: taken.id } }),
        ]);
      }

      const otp = generateOTP(OTP.length);
      const expiresAt = new Date(Date.now() + OTP.expiryMinutes * 60 * 1000);
      const oldEmail = me.email;

      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          // emailVerified is already null (guarded above), but set it explicitly:
          // this is the line that must never be dropped in a future refactor.
          data: { email, emailVerified: null },
        }),
        // Invalidate anything still redeemable against the old address.
        prisma.oTPCode.deleteMany({ where: { identifier: oldEmail } }),
        prisma.oTPCode.upsert({
          where: { identifier_type: { identifier: email, type: "EMAIL_VERIFICATION" } },
          update: { code: otp, expiresAt, verified: false, attempts: 0 },
          create: { identifier: email, code: otp, type: "EMAIL_VERIFICATION", expiresAt },
        }),
        prisma.eventLog.create({
          data: { userId, type: "ONBOARDING_EMAIL_CHANGED", metadata: { from: oldEmail, to: email } },
        }),
      ]);

      const sent = (await sendBrandedEmail(
        email,
        EmailTemplates.otp({ code: otp, purpose: "verify your email", expiresMinutes: OTP.expiryMinutes })
      )) as { success?: boolean } | void;

      return sendResponse(res, 200, "Email updated. Check your inbox for the new code.", {
        email,
        emailSent: sent?.success !== false,
      });
    } catch (error) {
      console.error("changeEmail error:", error);
      return sendResponse(res, 500, "Internal server error", null);
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return sendResponse(res, 401, "Refresh token required", null);
      }

      // Verify refresh token
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET!
      ) as any;

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true,
          verificationStatus: true,
        },
      });

      if (!user) {
        return sendResponse(res, 401, "Invalid refresh token", null);
      }

      // Generate new access token
      const newToken = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
      );

      sendResponse(res, 200, "Token refreshed successfully", {
        token: newToken,
        user,
      });
    } catch (error) {
      console.error("Refresh token error:", error);
      sendResponse(res, 401, "Invalid refresh token", null);
    }
  }

  async verifyEmail(req: Request, res: Response) {
    try {
      const { token, code } = req.body;

      // const result = await authService.verifyEmail(token, code);

      // remove the "let result = null" below as its just a placeholder
      let result = null;

      res.status(200).json({
        success: true,
        message: "Email verified successfully",
        data: result,
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

  async resendVerification(req: AuthenticatedRequest | Request, res: Response) {
    try {
      const { user } = req;
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
          code: "NOT_AUTHENTICATED",
        });
      }

      // const result = await authService.resendVerification(user.id);

      // remove the "let result = null" below as its just a placeholder
      let result = null;

      res.status(200).json({
        success: true,
        message: "Verification email sent successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Resend verification error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to resend verification",
        code: error.code || "RESEND_VERIFICATION_FAILED",
      });
    }
  }

  async verifyPhone(req: AuthenticatedRequest | Request, res: Response) {
    try {
      const { user } = req;
      const { code } = req.body;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
          code: "NOT_AUTHENTICATED",
        });
      }

      // const result = await authService.verifyPhone(user.id, code);
      // remove the "let result = null" below as its just a placeholder
      let result = null;

      res.status(200).json({
        success: true,
        message: "Phone verified successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Phone verification error:", error);
      res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || "Phone verification failed",
        code: error.code || "PHONE_VERIFICATION_FAILED",
      });
    }
  }

  async resendPhoneVerification(
    req: AuthenticatedRequest | Request,
    res: Response
  ) {
    try {
      const { user } = req;
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
          code: "NOT_AUTHENTICATED",
        });
      }

      // const result = await authService.resendPhoneVerification(user.id);

      // remove the "let result = null" below as its just a placeholder
      let result = null;

      res.status(200).json({
        success: true,
        message: "Phone verification code sent successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Resend phone verification error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to resend phone verification",
        code: error.code || "RESEND_PHONE_VERIFICATION_FAILED",
      });
    }
  }

  async changePassword(req: AuthenticatedRequest | Request, res: Response) {
    try {
      const { user } = req;
      const { currentPassword, newPassword } = req.body;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
          code: "NOT_AUTHENTICATED",
        });
      }

      // await authService.changePassword(user.id, currentPassword, newPassword);

      res.status(200).json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error: any) {
      console.error("Change password error:", error);
      res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || "Password change failed",
        code: error.code || "CHANGE_PASSWORD_FAILED",
      });
    }
  }

  async enableTwoFactor(req: AuthenticatedRequest | Request, res: Response) {
    try {
      const { user } = req;
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
          code: "NOT_AUTHENTICATED",
        });
      }

      // const result = await authService.enableTwoFactor(user.id);

      // remove the "let result = null" below as its just a placeholder
      let result = null;

      res.status(200).json({
        success: true,
        message: "Two-factor authentication enabled successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Enable 2FA error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to enable two-factor authentication",
        code: error.code || "ENABLE_2FA_FAILED",
      });
    }
  }

  async disableTwoFactor(req: AuthenticatedRequest | Request, res: Response) {
    try {
      const { user } = req;
      const { password } = req.body;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
          code: "NOT_AUTHENTICATED",
        });
      }

      // await authService.disableTwoFactor(user.id, password);

      res.status(200).json({
        success: true,
        message: "Two-factor authentication disabled successfully",
      });
    } catch (error: any) {
      console.error("Disable 2FA error:", error);
      res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || "Failed to disable two-factor authentication",
        code: error.code || "DISABLE_2FA_FAILED",
      });
    }
  }

  async verifyTwoFactor(req: AuthenticatedRequest | Request, res: Response) {
    try {
      const { user } = req;
      const { code } = req.body;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
          code: "NOT_AUTHENTICATED",
        });
      }

      // const result = await authService.verifyTwoFactor(user.id, code);

      // remove the "let result = null" below as its just a placeholder
      let result = null;

      res.status(200).json({
        success: true,
        message: "Two-factor authentication verified successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Verify 2FA error:", error);
      res.status(error.statusCode || 400).json({
        success: false,
        message:
          error.message || "Two-factor authentication verification failed",
        code: error.code || "VERIFY_2FA_FAILED",
      });
    }
  }

  async getSessions(req: AuthenticatedRequest | Request, res: Response) {
    try {
      const { user } = req;
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
          code: "NOT_AUTHENTICATED",
        });
      }

      // const sessions = await authService.getSessions(user.id);

      // remove the "let sessions = null" below - its just a placeholder
      let sessions = null;

      res.status(200).json({
        success: true,
        message: "Sessions retrieved successfully",
        data: sessions,
      });
    } catch (error: any) {
      console.error("Get sessions error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to retrieve sessions",
        code: error.code || "GET_SESSIONS_FAILED",
      });
    }
  }

  async terminateSession(req: AuthenticatedRequest | Request, res: Response) {
    try {
      const { user } = req;
      const { sessionId } = req.params;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
          code: "NOT_AUTHENTICATED",
        });
      }

      // await authService.terminateSession(user.id, sessionId);

      res.status(200).json({
        success: true,
        message: "Session terminated successfully",
      });
    } catch (error: any) {
      console.error("Terminate session error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to terminate session",
        code: error.code || "TERMINATE_SESSION_FAILED",
      });
    }
  }

  async terminateAllSessions(
    req: AuthenticatedRequest | Request,
    res: Response
  ) {
    try {
      const { user } = req;
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
          code: "NOT_AUTHENTICATED",
        });
      }

      // await authService.terminateAllSessions(user.id);

      res.status(200).json({
        success: true,
        message: "All sessions terminated successfully",
      });
    } catch (error: any) {
      console.error("Terminate all sessions error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to terminate all sessions",
        code: error.code || "TERMINATE_ALL_SESSIONS_FAILED",
      });
    }
  }
}

export const authController = new AuthController();
