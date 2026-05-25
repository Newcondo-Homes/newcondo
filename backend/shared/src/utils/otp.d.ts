export declare const generateOTP: (length?: number) => string;
export declare const generateSecureCode: (length?: number) => string;
export declare const createOTP: (identifier: string, type: "EMAIL_VERIFICATION" | "PHONE_VERIFICATION" | "PASSWORD_RESET" | "LOGIN", expiresInMinutes?: number) => Promise<{
    code: string;
    expiresAt: Date;
    id: string;
}>;
export declare const verifyOTP: (identifier: string, code: string, type: "EMAIL_VERIFICATION" | "PHONE_VERIFICATION" | "PASSWORD_RESET" | "LOGIN") => Promise<{
    success: boolean;
    message: string;
    attemptsLeft?: never;
} | {
    success: boolean;
    message: string;
    attemptsLeft: number;
}>;
export declare const cleanupExpiredOTPs: () => Promise<number>;
//# sourceMappingURL=otp.d.ts.map