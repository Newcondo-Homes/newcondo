// backend/shared/src/types/auth.ts
import type { User} from '@newcondo/db'

export type OTPType = 'EMAIL_VERIFICATION' | 'LOGIN' | 'PASSWORD_RESET'

export interface OTPVerificationRequest {
  identifier: string // email or phone
  code: string       // 6-digit OTP code
  type: OTPType      // type of OTP verification
}

export interface OTPResendRequest {
  identifier: string // email or phone
  type: OTPType      // type of OTP to resend
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  userType: UserType
  phone?: string
}

export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export interface AuthResponse<T=any> {
  user?: User;
  token?: string;
  refreshToken?: string;
  expiresAt?: string;
  success: boolean;
  data?: T;
  error?: string;
  requiresOTP?: boolean
  requiresVerification?: boolean 
  message?: string;
}

export interface UserData {
  id: string
  email: string
  firstName: string
  lastName: string
  userType: UserType
  phone?: string
  emailVerified: boolean
  phoneVerified: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export type UserType = 'RENTER' | 'AGENT' | 'PROPERTY_OWNER' | 'PROPERTY_MANAGER'

export interface JWTPayload {
  userId: string
  email: string
  userType: UserType
  iat?: number
  exp?: number
}

// OTP Storage interface for Redis/Database
export interface OTPRecord {
  id: string
  identifier: string // email or phone
  code: string       // hashed OTP code
  type: OTPType
  attempts: number
  maxAttempts: number
  expiresAt: Date
  createdAt: Date
  isUsed: boolean
}

// Password reset token interface
export interface PasswordResetToken {
  id: string
  userId: string
  token: string
  expiresAt: Date
  createdAt: Date
  isUsed: boolean
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}
