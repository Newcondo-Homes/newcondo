// packages/auth/src/types.ts
import { Role, VerificationStatus, UserType } from "@newcondo/db";

declare module "next-auth" {
  interface User {
    id: string;
    email?: string | null | undefined;
    name?: string | null;
    role: Role;
    image?: string | null;
    phone?: string | null;
    verificationStatus: VerificationStatus;
    isAvailableForMarking?: boolean;
    userType?: UserType | null;
    accessToken?: string;
    refreshToken?: string;
  }

  interface Session {
    accessToken?: string;
    refreshToken?: string;
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: Role;
      phone?: string | null;
      verificationStatus: VerificationStatus;
      isAvailableForMarking?: boolean;
      userType?: UserType | null;
      // Add any other specific fields you need on the client-side session.
      // E.g., if you want the referralCode or companyName directly
      referralCode?: string;
      companyName?: string | null;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    id?: string; // The user's ID
    email?: string;
    name?: string | null;
    picture?: string | null;
    role: Role;
    phone?: string | null;
    verificationStatus: VerificationStatus;
    isAvailableForMarking?: boolean;
    userType?: UserType | null;

    // Tokens
    accessToken?: string;
    refreshToken?: string;

    // Any other data you want to carry through the token lifecycle
    referralCode?: string;
    companyName?: string | null;
  }
}

export interface AuthError {
  type: string;
  message: string;
  field?: string;
}

export interface LoginCredentials {
  email?: string;
  password?: string;
  phone?: string;
  otpCode?: string;
  loginType: "email" | "phone" | "otp";
}

export interface RegisterData {
  name: string;
  email?: string;
  phone?: string;
  password?: string;
  role: Role;
  registrationType: "email" | "phone";
}

export interface OTPRequest {
  identifier: string; // email or phone
  type: "email" | "phone";
  purpose: "login" | "registration" | "password_reset";
}

export interface PasswordResetRequest {
  email: string;
  token?: string;
  newPassword?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: AuthError;
  user?: {
    id: string;
    email: string;
    name?: string | null;
    role: Role;
    image?: string | null;
    phone?: string | null;
    verificationStatus: VerificationStatus;
  };
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface OTPVerification {
  identifier: string; // email or phone
  otpCode: string;
  type: "email" | "phone";
  purpose: "login" | "registration" | "password_reset";
}

export { Role, VerificationStatus, UserType };
