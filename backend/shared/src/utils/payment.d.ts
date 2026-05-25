import { PaymentType, PaymentStatus } from '@newcondo/db';
/**
 * Payment validation utilities
 */
export declare class PaymentValidator {
    static validateAmount(amount: number, currency?: string): boolean;
    static validateEmail(email: string): boolean;
    static validatePhoneNumber(phone: string): boolean;
    static validateCurrency(currency: string): boolean;
    static validatePaymentType(paymentType: string): boolean;
}
/**
 * Payment status utilities
 */
export declare class PaymentStatusManager {
    private static readonly TERMINAL_STATUSES;
    private static readonly PROCESSING_STATUSES;
    static isTerminal(status: PaymentStatus): boolean;
    static isProcessing(status: PaymentStatus): boolean;
    static canTransitionTo(from: PaymentStatus, to: PaymentStatus): boolean;
}
/**
 * Payment formatting and helper utilities
 */
export declare class PaymentUtils {
    static formatAmount(amount: number, currency?: string): string;
    static generateReceiptNumber(prefix?: string): string;
    static generateTransactionRef(userId: string, type: PaymentType): string;
}
//# sourceMappingURL=payment.d.ts.map