import bcrypt from "bcryptjs";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { prisma, VerificationStatus, Role } from "@newcondo/db";
import { generateOTP, verifyOTP } from "../../../shared/src/utils/otp";
import { sendEmail } from "../../../shared/src/utils/email";
import { StringValue } from "ms";

// import { sendSMS } from "../../../shared/src/utils/sms";
import {
  RegisterUserData,
  LoginUserData,
  AuthResponse,
  OTPType,
  OTPVerificationData,
  PasswordResetData,
  RefreshTokenData,
  UserSession,
} from "../types/auth";

interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
  emailVerified: boolean;
  phoneVerified: boolean;
}

export class AuthService {
  private readonly JWT_SECRET: Secret;
  private readonly JWT_REFRESH_SECRET: Secret;
  private readonly JWT_EXPIRES_IN: StringValue;
  private readonly JWT_REFRESH_EXPIRES_IN: StringValue;
  private readonly OTP_EXPIRES_IN: number;
  private readonly MAX_LOGIN_ATTEMPTS: number;
  private readonly LOCKOUT_DURATION: number;

  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET!;
    this.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
    if (!this.JWT_SECRET || !this.JWT_REFRESH_SECRET) {
      throw new Error("JWT secrets are not configured");
    }
    this.JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN! || "1h") as StringValue;
    this.JWT_REFRESH_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRES_IN! ||
      "7d") as StringValue;
    this.OTP_EXPIRES_IN = parseInt(process.env.OTP_EXPIRES_IN! || "300000"); // 5 minutes
    this.MAX_LOGIN_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS! || "5");
    this.LOCKOUT_DURATION = parseInt(process.env.LOCKOUT_DURATION! || "900000"); // 15 minutes
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

    // save user name with firstName and lastName together and in this other
    const name = firstName + lastName;

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        passwordHash: hashedPassword,
        name,
        role,
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
      emailVerified: !!user.emailVerified,
      phoneVerified: !!user.phoneVerified,
    });

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      success: true,
      message:
        "User registered successfully. Please verify you email to continue",
      data: {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          name: name,
          role: user.role,
          emailVerified: !!user.emailVerified,
          phoneVerified: !!user.phoneVerified,
          verificationStatus: user.verificationStatus,
          createdAt: user.createdAt,
          image: user.image || null,
          updatedAt: user.updatedAt,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
      requiresOTP: true,
      otpSentTo: email,
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

    // TODO: Create feature to be able to lock accounts
    // Check if account is locked
    // if (user.lockoutUntil && user.lockoutUntil > new Date()) {
    //   const lockoutTime = Math.ceil(
    //     (user.lockoutUntil.getTime() - Date.now()) / 60000
    //   );
    //   throw new Error(`Account locked. Try again in ${lockoutTime} minutes`);
    // }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash!);

    if (!isPasswordValid) {
      // await this.handleFailedLogin(user.id);
      throw new Error("Invalid credentials");
    }

    // TODO: Create feature to be able monitor login attempts
    // Reset failed login attempts on successful login
    // if (user.failedLoginAttempts > 0) {
    //   await prisma.user.update({
    //     where: { id: user.id },
    //     data: {
    //       failedLoginAttempts: 0,
    //       lockoutUntil: null,
    //     },
    //   });
    // }

    // Generate tokens
    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      emailVerified: !!user.emailVerified,
      phoneVerified: !!user.phoneVerified,
    });

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    // TODO: Create feature to be able record lastlogin by user
    // Update last login
    // await prisma.user.update({
    //   where: { id: user.id },
    //   data: { lastLoginAt: new Date() },
    // });

    return {
      success: true,
      message: "User Login is successfull.",
      data: {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          role: user.role,
          emailVerified: !!user.emailVerified,
          phoneVerified: !!user.phoneVerified,
          verificationStatus: user.verificationStatus,
          createdAt: user.createdAt,
          image: user.image || null,
          updatedAt: user.updatedAt,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
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

    const isOTPValid = verifyOTP(email!, otp, OTPType.EMAIL_VERIFICATION);
    if (!isOTPValid) {
      throw new Error("Invalid OTP");
    }

    // Update user as email verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verificationStatus:
          !!user.phoneVerified || !!user.phone
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

    // create expiration time for the otp
    const emailOTPExpiry = new Date(Date.now() + this.OTP_EXPIRES_IN);

    // // Update to new OTP
    await prisma.oTPCode.upsert({
      where: {
        identifier_type: {
          identifier: email,
          type: OTPType.EMAIL_VERIFICATION,
        },
      },
      create: {
        identifier: email,
        code: emailOTP,
        type: OTPType.EMAIL_VERIFICATION,
        expiresAt: emailOTPExpiry,
        attempts: 0,
        verified: false,
        maxAttempts: 3,
      },
      update: {
        // Data to update if a matching record IS found
        code: emailOTP,
        expiresAt: emailOTPExpiry,
        attempts: 0,
        verified: false,
      },
    });

    // I put "!"  because I am certain that a registered user must have a name
    const firstName = user.name!.trim().split(" ")[0];

    // Send email OTP
    await this.sendEmailOTP(email, emailOTP, firstName);

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
      console.warn(`Password reset requested for non-existent email: ${email}`);
      return {
        success: true,
        message: "If the email exists, a reset link has been sent",
      };
    }

    // Generate reset token
    const length: number = 32;

    const resetToken = crypto.randomBytes(length).toString("hex");

    // Store reset token
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    try {
      await prisma.oTPCode.upsert({
        where: {
          identifier_type: {
            identifier: email,
            type: OTPType.PASSWORD_RESET,
          },
        },
        create: {
          identifier: email,
          code: resetToken,
          type: OTPType.PASSWORD_RESET,
          expiresAt: resetTokenExpiry,
          attempts: 0,
          verified: false,
          maxAttempts: 3,
        },
        update: {
          code: resetToken,
          expiresAt: resetTokenExpiry,
          attempts: 0,
          verified: false,
        },
      });

      const firstName = user.name!.trim().split(" ")[0];

      // Send the password reset email
      await this.sendPasswordResetEmail(email, resetToken, firstName);

      return {
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent.",
      };
    } catch (error) {
      console.error("Error requesting password reset:", error);
      return {
        success: false,
        message: "An error occurred. Please try again later.",
      };
    }
  }

  async resetPassword(
    resetData: PasswordResetData
  ): Promise<{ success: boolean; message: string }> {
    const { token, newPassword } = resetData;

    // Basic validation for new password (add more robust rules as needed)
    if (!newPassword || newPassword.length < 8) {
      throw new Error("New password must be at least 8 characters long.");
    }

    // Verify reset token
    let payload: any;
    try {
      const otpCodeRecord = await prisma.oTPCode.findUnique({
        where: {
          identifier_type: {
            identifier: resetData.email,
            type: OTPType.PASSWORD_RESET, // Ensure it's for password reset
          },
        },
      });

      //Validate the OTPCode record
      if (
        !otpCodeRecord ||
        otpCodeRecord.expiresAt < new Date() ||
        otpCodeRecord.verified
      ) {
        throw new Error("Invalid or expired password reset token.");
      }

      // Find the user associated with this OTPCode
      const user = await prisma.user.findUnique({
        where: { email: otpCodeRecord.identifier },
      });

      if (!user) {
        // Mark the token as used if the user somehow disappeared or email changed.
        await prisma.oTPCode.update({
          where: { id: otpCodeRecord.id },
          data: { verified: true },
        });
        throw new Error("User not found for this reset token."); // Still generic for security
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password and invalidate the OTPCode in a transaction
      await prisma.$transaction([
        // Update user's password and reset login related counters
        prisma.user.update({
          where: { id: user.id },
          data: {
            passwordHash: hashedPassword,
          },
        }),

        // Mark the specific OTPCode as verified (used) to prevent replay attacks
        prisma.oTPCode.update({
          where: { id: otpCodeRecord.id },
          data: { verified: true },
        }),
        // Invalidate all existing refresh tokens (sessions) for the user for security
        prisma.session.deleteMany({
          where: { userId: user.id },
        }),
      ]);

      return { success: true, message: "Password reset successfully" };
    } catch (error) {
      throw new Error("Invalid or expired reset token");
    }
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
      emailVerified: !!storedToken.user.emailVerified,
      phoneVerified: !!storedToken.user.phoneVerified,
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
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      verificationStatus: user.verificationStatus,
      createdAt: user.createdAt,
    };
  }

  public generateTokens(payload: TokenPayload): {
    accessToken: string;
    refreshToken: string;
  } {
    const options: SignOptions = {
      expiresIn: this.JWT_EXPIRES_IN,
      algorithm: "HS256",
    };

    const accessToken = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    });

    const refreshToken = jwt.sign(
      { userId: payload.userId },
      this.JWT_REFRESH_SECRET,
      options
    );

    return { accessToken, refreshToken };
  }

  public async storeRefreshToken(
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

  // private async handleFailedLogin(userId: string): Promise<void> {
  //   const user = await prisma.user.findUnique({
  //     where: { id: userId },
  //   });

  //   if (!user) return;

  //   const failedAttempts = (user.failedLoginAttempts || 0) + 1;
  //   const updateData: any = {
  //     failedLoginAttempts: failedAttempts,
  //   };

  //   if (failedAttempts >= this.MAX_LOGIN_ATTEMPTS) {
  //     updateData.lockoutUntil = new Date(Date.now() + this.LOCKOUT_DURATION);
  //   }

  //   await prisma.user.update({
  //     where: { id: userId },
  //     data: updateData,
  //   });
  // }

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

  // async updatePassword(userId: string, newPassword: string) {
  //   const saltRounds = 12;
  //   const passwordHash = await bcrypt.hash(newPassword, saltRounds);

  //   return await prisma.user.update({
  //     where: { id: userId },
  //     data: { passwordHash },
  //   });
  // }
}

export const authService = new AuthService();
