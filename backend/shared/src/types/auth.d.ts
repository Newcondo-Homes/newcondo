import type { User, Role } from '@newcondo/db';
export type { Role };
export type OTPType = 'EMAIL_VERIFICATION' | 'LOGIN' | 'PASSWORD_RESET';
export type UserType = 'RENTER' | 'AGENT' | 'PROPERTY_OWNER' | 'PROPERTY_MANAGER';
export interface OTPVerificationRequest {
    identifier: string;
    code: string;
    type: OTPType;
}
export interface OTPResendRequest {
    identifier: string;
    type: OTPType;
}
export interface RegisterRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    userType: UserType;
    phone?: string;
}
export interface LoginRequest {
    email: string;
    password: string;
    rememberMe?: boolean;
}
export interface AuthResponse<T = any> {
    user?: User;
    token?: string;
    refreshToken?: string;
    expiresAt?: string;
    success: boolean;
    data?: T;
    error?: string;
    requiresOTP?: boolean;
    requiresVerification?: boolean;
    message?: string;
}
export interface UserData {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    userType: UserType;
    phone?: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface JWTPayload {
    userId: string;
    email: string;
    userType: UserType;
    iat?: number;
    exp?: number;
}
export interface OTPRecord {
    id: string;
    identifier: string;
    code: string;
    type: OTPType;
    attempts: number;
    maxAttempts: number;
    expiresAt: Date;
    createdAt: Date;
    isUsed: boolean;
}
export interface PasswordResetToken {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
    isUsed: boolean;
}
export declare enum VerificationStatus {
    PENDING = "PENDING",
    VERIFIED = "VERIFIED",
    REJECTED = "REJECTED"
}
//# sourceMappingURL=auth.d.ts.map