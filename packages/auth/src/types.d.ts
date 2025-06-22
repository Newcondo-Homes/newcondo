// packages/auth/src/types.ts
import { Role, VerificationStatus } from "@newcondo/db"

declare module "next-auth" {
    interface User {
    id: string
    email: string
    name?: string | null
    role: Role
    image?: string | null
    phone?: string | null
    verificationStatus: VerificationStatus
    accessToken?: string
    refreshToken?: string
  }

 interface Session {
    accessToken?: string
    refreshToken?: string
    user: {
      id: string
      email: string
      name?: string | null
      role: Role
      image?: string | null
      phone?: string | null
      verificationStatus: VerificationStatus
    }
  }
}

declare module  "@auth/core/jwt" {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    role: Role
    verificationStatus: VerificationStatus
    phone?: string | null
  }
}


export interface AuthError {
  type: string
  message: string
  field?: string
}

export interface LoginCredentials {
  email?: string
  password?: string
  phone?: string
  otpCode?: string
  loginType: "email" | "phone" | "otp"
}

export interface RegisterData {
  name: string
  email?: string
  phone?: string
  password?: string
  role: Role
  registrationType: "email" | "phone"
}

export interface OTPRequest {
  identifier: string // email or phone
  type: "email" | "phone"
  purpose: "login" | "registration" | "password_reset"
}

export interface PasswordResetRequest {
  email: string
  token?: string
  newPassword?: string
}

export interface AuthResponse {
  success: boolean
  message: string
  data?: any
  error?: AuthError
  user?: {
    id: string
    email: string
    name?: string | null
    role: Role
    image?: string | null
    phone?: string | null
    verificationStatus: VerificationStatus
  }
  tokens?: {
    accessToken: string
    refreshToken: string
  }
}

export interface OTPVerification {
  identifier: string // email or phone
  otpCode: string
  type: "email" | "phone"
  purpose: "login" | "registration" | "password_reset"
} 

export { Role, VerificationStatus }