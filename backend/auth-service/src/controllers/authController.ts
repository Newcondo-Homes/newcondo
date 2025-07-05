import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@newcondo/db";
import { Role } from "@newcondo/db";
import { sendResponse, ApiResponse } from "../../../shared/src/utils/response";
import { generateOTP } from "../../../shared/src/utils/otp";
import { sendEmail } from "../../../shared/src/utils/email";
import { AuthService } from "../services/authService";
import type { AuthenticatedRequest } from "../types/auth";

class AuthController {
  private authService = new AuthService();

  async register(req: Request, res: Response): Promise<any> {
    try {
      const { email, password, name, role, phone } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email }, ...(phone ? [{ phone }] : [])],
        },
      });

      if (existingUser) {
        return sendResponse(res, 400, "User already exists", null);
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name: name || null,
          phone: phone || null,
          role: (role as Role) || Role.RENTER,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true,
          phoneVerified: true,
          verificationStatus: true,
          createdAt: true,
        },
      });

      // Generate and send email verification OTP
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await prisma.oTPCode.create({
        data: {
          identifier: email,
          code: otp,
          type: "EMAIL_VERIFICATION",
          expiresAt,
        },
      });

      // Send verification email
      await sendEmail({
        to: email,
        subject: "Verify your NewCondo account",
        html: `
          <h2>Welcome to NewCondo!</h2>
          <p>Your verification code is: <strong>${otp}</strong></p>
          <p>This code will expire in 10 minutes.</p>
        `,
      });

      // Log user registration event
      await prisma.eventLog.create({
        data: {
          userId: user.id,
          type: "USER_REGISTERED",
          metadata: { role: user.role },
        },
      });

      return sendResponse(
        res,
        201,
        "User registered successfully. Please check your email for verification code.",
        {
          user,
          requiresVerification: true,
        }
      );
    } catch (error) {
      console.error("Registration error:", error);
      sendResponse(res, 500, "Internal server error", null);
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const MAX_ATTEMPTS = 5;
      const LOCKOUT_TIME = 30 * 60 * 1000; // 30 minutes

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
      const lockoutKey = `lockout:${email}`;
      // In production, use Redis for this

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
      await sendEmail({
        to: email,
        subject: "Reset your NewCondo password",
        html: `
          <h2>Password Reset Request</h2>
          <p>Your password reset code is: <strong>${otp}</strong></p>
          <p>This code will expire in 15 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `,
      });

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
