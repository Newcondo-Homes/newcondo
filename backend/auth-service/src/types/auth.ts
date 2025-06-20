// backend/auth-service/src/types/auth.ts

import { Role } from '@newcondo/db';

export interface RegisterRequest {
  name?: string;
  email: string;
  phone?: string;
  password: string;
  role: Role;
  referralCode?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface OTPRequest {
  identifier: string; // email or phone
  type: 'EMAIL_VERIFICATION' | 'PHONE_VERIFICATION' | 'PASSWORD_RESET' | 'LOGIN';
}

export interface VerifyOTPRequest {
  identifier: string;
  code: string;
  type: 'EMAIL_VERIFICATION' | 'PHONE_VERIFICATION' | 'PASSWORD_RESET' | 'LOGIN';
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
    user?: {
      id: string;
      name?: string;
      email: string;
      phone?: string;
      role: Role;
      emailVerified?: Date;
      phoneVerified?: Date;
      verificationStatus: string;
    };
    token?: string;
    expiresAt?: Date;
  };
  errors?: Record<string, string[]>;
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

export interface LoginAttempt {
  email: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  timestamp: Date;
}

export interface AccountLockout {
  email: string;
  attempts: number;
  lockedUntil?: Date;
  lastAttempt: Date;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
  sessionId: string;
  iat: number;
  exp: number;
}