export interface EmailTemplate {
    to: string;
    subject: string;
    html: string;
    text?: string;
}
export interface AccountUnlockedEmail {
    to: string;
    name: string;
    unlockedBy: "administrator" | "automatic";
}
export interface PasswordResetEmail {
    to: string;
    name: string | null;
    resetUrl?: string | null;
}
export interface AccountLockedEmail {
    to: string;
    name: string;
    lockedUntil: Date;
    unlockTime: string;
}
export declare const sendEmail: (template: EmailTemplate) => Promise<{
    success: boolean;
    data: import("mailgun.js/Types").MessagesSendResult;
    error?: undefined;
} | {
    success: boolean;
    error: unknown;
    data?: undefined;
}>;
export declare const sendWelcomeEmail: (email: string, name: string) => Promise<{
    success: boolean;
    data: import("mailgun.js/Types").MessagesSendResult;
    error?: undefined;
} | {
    success: boolean;
    error: unknown;
    data?: undefined;
}>;
export declare const sendPasswordResetEmail: (data: PasswordResetEmail) => Promise<{
    success: boolean;
    data: import("mailgun.js/Types").MessagesSendResult;
    error?: undefined;
} | {
    success: boolean;
    error: unknown;
    data?: undefined;
}>;
export declare const sendPasswordChangeConfirmation: (data: PasswordResetEmail) => Promise<{
    success: boolean;
    data: import("mailgun.js/Types").MessagesSendResult;
    error?: undefined;
} | {
    success: boolean;
    error: unknown;
    data?: undefined;
}>;
export declare const sendAccountLockedEmail: (data: AccountLockedEmail) => Promise<{
    success: boolean;
    data: import("mailgun.js/Types").MessagesSendResult;
    error?: undefined;
} | {
    success: boolean;
    error: unknown;
    data?: undefined;
}>;
export declare const sendAccountUnlockedEmail: (data: AccountUnlockedEmail) => Promise<{
    success: boolean;
    data: import("mailgun.js/Types").MessagesSendResult;
    error?: undefined;
} | {
    success: boolean;
    error: unknown;
    data?: undefined;
}>;
export declare const sendBulkEmail: (templates: EmailTemplate[]) => Promise<{
    success: boolean;
    sent: number;
    failed: number;
    total: number;
    error?: undefined;
} | {
    success: boolean;
    error: unknown;
    sent?: undefined;
    failed?: undefined;
    total?: undefined;
}>;
export declare const sendTemplatedEmail: (to: string, templateName: string, variables: Record<string, string>) => Promise<{
    success: boolean;
    data: import("mailgun.js/Types").MessagesSendResult;
    error?: undefined;
} | {
    success: boolean;
    error: unknown;
    data?: undefined;
}>;
export declare const sendVerificationEmail: (email: string, otpCode: string, name: string) => Promise<{
    success: boolean;
    data: import("mailgun.js/Types").MessagesSendResult;
    error?: undefined;
} | {
    success: boolean;
    error: unknown;
    data?: undefined;
}>;
export declare const generateOTPEmailHTML: (otp: string, type: string, expire: number) => string;
export declare const generateOTPEmailText: (otp: string, type: string, expire: number) => string;
export declare const isValidEmail: (email: string) => boolean;
export declare const getEmailStatus: (messageId: string) => Promise<{
    success: boolean;
    events: import("mailgun.js/Types").DomainEvent[];
    error?: undefined;
} | {
    success: boolean;
    error: unknown;
    events?: undefined;
}>;
//# sourceMappingURL=email.d.ts.map