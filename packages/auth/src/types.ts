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
  }

  interface Session {
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

declare module "next-auth/jwt" {
  interface JWT {
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