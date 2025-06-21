import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma, User, UserRole, VerificationStatus, Role } from "@newcondo/db";
import {
  generateOTP,
  verifyOTP,
  generateOTPHash,
} from "../../../shared/src/utils/otp";
import { sendEmail } from "../../../shared/src/utils/email";
import { sendSMS } from "../../../shared/src/utils/sms";
import {
  RegisterUserData,
  LoginUserData,
  AuthResponse,
  OTPVerificationData,
  PasswordResetData,
  RefreshTokenData,
  UserSession,
} from "../types/auth";

interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
}

export class AuthService {
  private readonly JWT_SECRET: string;
  private readonly JWT_REFRESH_SECRET: string;
  private readonly JWT_EXPIRES_IN: string;
  private readonly JWT_REFRESH_EXPIRES_IN: string;
  private readonly OTP_EXPIRES_IN: number;
  private readonly MAX_LOGIN_ATTEMPTS: number;
  private readonly LOCKOUT_DURATION: number;

  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET!;
    this.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
    this.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
    this.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
    this.OTP_EXPIRES_IN = parseInt(process.env.OTP_EXPIRES_IN || "300000"); // 5 minutes
    this.MAX_LOGIN_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS || "5");
    this.LOCKOUT_DURATION = parseInt(process.env.LOCKOUT_DURATION || "900000"); // 15 minutes
  }

  async createUser(userData: {
    email: string;
    password: string;
    name?: string;
    role?: Role;
    phone?: string;
  }) {
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(userData.password, saltRounds);

    return await prisma.user.create({
      data: {
        email: userData.email,
        passwordHash,
        name: userData.name || null,
        phone: userData.phone || null,
        role: userData.role || Role.RENTER,
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
  }

  async registerUser(userData: RegisterUserData): Promise<AuthResponse> {
    const { email, phone, password, firstName, lastName, role } = userData;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, ...(phone ? [{ phone }] : [])],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new Error("User with this email already exists");
      }
      if (existingUser.phone === phone) {
        throw new Error("User with this phone number already exists");
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate email OTP
    const emailOTP = generateOTP();
    const emailOTPHash = generateOTPHash(emailOTP);
    const emailOTPExpiry = new Date(Date.now() + this.OTP_EXPIRES_IN);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        emailOTP: emailOTPHash,
        emailOTPExpiry,
        emailVerified: false,
        phoneVerified: false,
        verificationStatus: VerificationStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Send email OTP
    await this.sendEmailOTP(email, emailOTP, firstName);

    // Generate tokens
    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      isEmailVerified: user.emailVerified,
      isPhoneVerified: user.phoneVerified,
    });

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        verificationStatus: user.verificationStatus,
        createdAt: user.createdAt,
      },
      tokens,
      requiresEmailVerification: true,
      requiresPhoneVerification: !!phone,
    };
  }

  async loginUser(loginData: LoginUserData): Promise<AuthResponse> {
    const { email, password } = loginData;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Check if account is locked
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const lockoutTime = Math.ceil(
        (user.lockoutUntil.getTime() - Date.now()) / 60000
      );
      throw new Error(`Account locked. Try again in ${lockoutTime} minutes`);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      await this.handleFailedLogin(user.id);
      throw new Error("Invalid credentials");
    }

    // Reset failed login attempts on successful login
    if (user.failedLoginAttempts > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockoutUntil: null,
        },
      });
    }

    // Generate tokens
    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      isEmailVerified: user.emailVerified,
      isPhoneVerified: user.phoneVerified,
    });

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        verificationStatus: user.verificationStatus,
        createdAt: user.createdAt,
      },
      tokens,
      requiresEmailVerification: !user.emailVerified,
      requiresPhoneVerification: !!user.phone && !user.phoneVerified,
    };
  }

  async verifyEmailOTP(
    verificationData: OTPVerificationData
  ): Promise<{ success: boolean; message: string }> {
    const { email, otp } = verificationData;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.emailVerified) {
      return { success: true, message: "Email already verified" };
    }

    if (!user.emailOTP || !user.emailOTPExpiry) {
      throw new Error("No OTP found. Please request a new OTP");
    }

    if (user.emailOTPExpiry < new Date()) {
      throw new Error("OTP has expired. Please request a new OTP");
    }

    const isOTPValid = verifyOTP(otp, user.emailOTP);
    if (!isOTPValid) {
      throw new Error("Invalid OTP");
    }

    // Update user as email verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailOTP: null,
        emailOTPExpiry: null,
        verificationStatus:
          user.phoneVerified || !user.phone
            ? VerificationStatus.VERIFIED
            : VerificationStatus.PENDING,
      },
    });

    return { success: true, message: "Email verified successfully" };
  }

  async resendEmailOTP(
    email: string
  ): Promise<{ success: boolean; message: string }> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.emailVerified) {
      return { success: true, message: "Email already verified" };
    }

    // Generate new OTP
    const emailOTP = generateOTP();
    const emailOTPHash = generateOTPHash(emailOTP);
    const emailOTPExpiry = new Date(Date.now() + this.OTP_EXPIRES_IN);

    // Update user with new OTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailOTP: emailOTPHash,
        emailOTPExpiry,
      },
    });

    // Send email OTP
    await this.sendEmailOTP(email, emailOTP, user.firstName);

    return { success: true, message: "OTP sent successfully" };
  }

  async requestPasswordReset(
    email: string
  ): Promise<{ success: boolean; message: string }> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists or not
      return {
        success: true,
        message: "If the email exists, a reset link has been sent",
      };
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user.id, email: user.email, type: "password_reset" },
      this.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Store reset token
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpiry: resetTokenExpiry,
      },
    });

    // Send reset email
    await this.sendPasswordResetEmail(user.email, resetToken, user.firstName);

    return {
      success: true,
      message: "If the email exists, a reset link has been sent",
    };
  }

  async resetPassword(
    resetData: PasswordResetData
  ): Promise<{ success: boolean; message: string }> {
    const { token, newPassword } = resetData;

    // Verify reset token
    let payload: any;
    try {
      payload = jwt.verify(token, this.JWT_SECRET);
    } catch (error) {
      throw new Error("Invalid or expired reset token");
    }

    if (payload.type !== "password_reset") {
      throw new Error("Invalid token type");
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (
      !user ||
      user.passwordResetToken !== token ||
      !user.passwordResetExpiry ||
      user.passwordResetExpiry < new Date()
    ) {
      throw new Error("Invalid or expired reset token");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiry: null,
        failedLoginAttempts: 0, // Reset failed attempts
        lockoutUntil: null,
      },
    });

    // Invalidate all existing sessions
    await prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    });

    return { success: true, message: "Password reset successfully" };
  }

  async refreshToken(
    refreshData: RefreshTokenData
  ): Promise<{ tokens: { accessToken: string; refreshToken: string } }> {
    const { refreshToken } = refreshData;

    // Verify refresh token
    let payload: any;
    try {
      payload = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET);
    } catch (error) {
      throw new Error("Invalid refresh token");
    }

    // Check if refresh token exists in database
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        token: refreshToken,
        userId: payload.userId,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!storedToken) {
      throw new Error("Invalid refresh token");
    }

    // Generate new tokens
    const tokens = this.generateTokens({
      userId: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
      isEmailVerified: storedToken.user.emailVerified,
      isPhoneVerified: storedToken.user.phoneVerified,
    });

    // Update refresh token in database
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: {
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return { tokens };
  }

  async logoutUser(
    userId: string,
    refreshToken?: string
  ): Promise<{ success: boolean; message: string }> {
    if (refreshToken) {
      // Remove specific refresh token
      await prisma.refreshToken.deleteMany({
        where: {
          userId,
          token: refreshToken,
        },
      });
    } else {
      // Remove all refresh tokens for user (logout from all devices)
      await prisma.refreshToken.deleteMany({
        where: { userId },
      });
    }

    return { success: true, message: "Logged out successfully" };
  }

  async getUserSession(userId: string): Promise<UserSession | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      verificationStatus: user.verificationStatus,
      createdAt: user.createdAt,
    };
  }

  private generateTokens(payload: TokenPayload): {
    accessToken: string;
    refreshToken: string;
  } {
    const accessToken = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    });

    const refreshToken = jwt.sign(
      { userId: payload.userId },
      this.JWT_REFRESH_SECRET,
      { expiresIn: this.JWT_REFRESH_EXPIRES_IN }
    );

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(
    userId: string,
    refreshToken: string
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });
  }

  private async handleFailedLogin(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return;

    const failedAttempts = (user.failedLoginAttempts || 0) + 1;
    const updateData: any = {
      failedLoginAttempts: failedAttempts,
    };

    if (failedAttempts >= this.MAX_LOGIN_ATTEMPTS) {
      updateData.lockoutUntil = new Date(Date.now() + this.LOCKOUT_DURATION);
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  private async sendEmailOTP(
    email: string,
    otp: string,
    firstName: string
  ): Promise<void> {
    const subject = "Verify Your Email - NewCondo";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Email Verification</h2>
        <p>Hi ${firstName},</p>
        <p>Thank you for registering with NewCondo. Please use the following OTP to verify your email address:</p>
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This OTP will expire in 5 minutes.</p>
        <p>If you didn't create an account with NewCondo, please ignore this email.</p>
        <p>Best regards,<br>The NewCondo Team</p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject,
      html,
    });
  }

  private async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    firstName: string
  ): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const subject = "Reset Your Password - NewCondo";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hi ${firstName},</p>
        <p>You requested to reset your password for your NewCondo account. Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #6c757d;">${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, please ignore this email.</p>
        <p>Best regards,<br>The NewCondo Team</p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject,
      html,
    });
  }

  async validateUser(email: string, password: string) {
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
      },
    });

    if (!user || !user.passwordHash) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return null;
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updatePassword(userId: string, newPassword: string) {
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    return await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }
}


export const authService = new AuthService();