// backend/auth-service/src/types/auth.ts

import { Role, VerificationStatus, OTPType } from "@newcondo/db";

export { OTPType };

export interface RegisterUserData {
  email: string;
  phone?: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Role;
  // Optional additional fields
  dateOfBirth?: Date;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  referralCode?: string; // If user was referred
}

// Login User Data
export interface LoginUserData {
  email: string;
  password: string;
  rememberMe?: boolean; // Optional flag for longer token expiry
}

// OTP Verification Data
export interface OTPVerificationData {
  email?: string;
  phone?: string;
  otp: string;
  type?: 'EMAIL_VERIFICATION' | 'PHONE_VERIFICATION' | 'PASSWORD_RESET' | 'LOGIN';
}

// Refresh Token Data
export interface RefreshTokenData {
  refreshToken: string;
}

// User Session Data
export interface UserSession {
  id: string;
  email: string;
  phone: string | null;
  name: string | null;
  role: Role;
  emailVerified: Date | null;
  phoneVerified: Date | null;
  verificationStatus: VerificationStatus;
  createdAt: Date;
  // Additional optional fields that might be useful in session
  image?: string | null;
  isPremium?: boolean;
  isAvailableForMarking?: boolean; // For agents
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
  role: Role;
  termsAccepted: boolean;
  marketingOptIn?: boolean;
  referralCode?: string;
  deviceFingerprint?: string;
}

export interface PasswordResetData {
  email: string;      // The user's email, which is the OTPCode 'identifier'
  token: string;      // This will be the `code` from your OTPCode model
  newPassword: string;
}

export interface LoginRequest {
  email?: string;
  phone?: string;
  password: string;
  rememberMe?: boolean;
  deviceFingerprint?: string;
}

export interface OTPRequest {
  identifier: string; // email or phone
  type:
    | "EMAIL_VERIFICATION"
    | "PHONE_VERIFICATION"
    | "PASSWORD_RESET"
    | "LOGIN";
}

export interface VerifyOTPRequest {
  identifier: string;
  code: string;
  type:
    | "EMAIL_VERIFICATION"
    | "PHONE_VERIFICATION"
    | "PASSWORD_RESET"
    | "LOGIN";
}

export interface PasswordResetRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: SafeUser;
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
    tokenType?: string;
  };
  requiresOTP?: boolean;
  otpSentTo?: string;
  errors?: Record<string, string[]>;
}

export interface SafeUser {
  id: string;
  name?: string | null;
  email: string;
  phone: string | null;
  role: Role;
  verificationStatus: VerificationStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionData {
  userId: string;
  email: string;
  role: Role;
  sessionId: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

// export interface SessionData {
//   userId: string;
//   email: string;
//   role: Role;
//   verificationStatus: VerificationStatus;
//   deviceFingerprint?: string;
//   issuedAt: number;
//   expiresAt: number;
// }
export interface LoginAttempt {
  email: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  timestamp: Date;
}

// export interface LoginAttempt {
//   identifier: string;
//   ipAddress: string;
//   userAgent: string;
//   success: boolean;
//   timestamp: Date;
//   failureReason?: string;
//   deviceFingerprint?: string;
// }

export interface AccountLockout {
  email: string;
  attempts: number;
  lockedUntil?: Date;
  lastAttempt: Date;
}

// export interface AccountLockout {
//   identifier: string;
//   lockedAt: Date;
//   lockoutExpiry: Date;
//   attemptCount: number;
//   reason: 'FAILED_ATTEMPTS' | 'SUSPICIOUS_ACTIVITY' | 'ADMIN_ACTION';
// }

// JWT payload interface
export interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
  sessionId: string;
  iat: number;
  exp: number;
}

// export interface JWTPayload {
//   userId: string;
//   email: string;
//   role: Role;
//   sessionId: string;
//   iat: number;
//   exp: number;
//   type: 'access' | 'refresh';
// }

// Auth request/response types

export interface OTPRequest {
  identifier: string; // email or phone
  type:
    | "EMAIL_VERIFICATION"
    | "PHONE_VERIFICATION"
    | "LOGIN"
    | "PASSWORD_RESET";
  purpose?: string;
}

export interface OTPVerifyRequest {
  identifier: string;
  code: string;
  type:
    | "EMAIL_VERIFICATION"
    | "PHONE_VERIFICATION"
    | "LOGIN"
    | "PASSWORD_RESET";
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
  deviceFingerprint?: string;
}

// Social auth types
export interface SocialAuthRequest {
  provider: "google" | "facebook";
  accessToken: string;
  role?: Role;
  referralCode?: string;
}

export interface SocialUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
  emailVerified: boolean;
}

// Validation schemas interfaces
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface AuthError extends Error {
  code: string;
  statusCode: number;
  details?: any;
}

// Request with authenticated user
export interface AuthenticatedRequest extends Request {
  user: SafeUser;
  sessionId: string;
  deviceFingerprint?: string;
}

// Password policy interface
export interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventCommonPasswords: boolean;
  preventReuse: number; // number of previous passwords to check
}

// Account status interface
export interface AccountStatus {
  isActive: boolean;
  isLocked: boolean;
  lockoutReason?: string;
  lockoutExpiry?: Date;
  mustChangePassword: boolean;
  lastLoginAt?: Date;
  failedLoginAttempts: number;
}
