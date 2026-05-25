import { FlutterwavePaymentRequest, FlutterwavePaymentResponse, FlutterwaveVerificationResponse, FlutterwaveWebhookPayload, VirtualAccountRequest, VirtualAccountResponse, PaymentRefundRequest, RefundResponse } from '../types/payment';
/**
 * Generate unique transaction reference
 */
export declare const generateTxRef: (prefix?: string) => string;
/**
 * Encrypt payment data using Flutterwave encryption key
 */
export declare const encryptPaymentData: (data: string) => string;
/**
 * Decrypt payment data
 */
export declare const decryptPaymentData: (encryptedData: string) => string;
/**
 * Verify webhook signature
 */
export declare const verifyWebhookSignature: (payload: string, signature: string) => boolean;
/**
 * Initialize payment with Flutterwave
 */
export declare const initializePayment: (paymentData: FlutterwavePaymentRequest) => Promise<FlutterwavePaymentResponse>;
/**
 * Verify transaction with Flutterwave
 */
export declare const verifyTransaction: (transactionId: string) => Promise<FlutterwaveVerificationResponse>;
/**
 * Create virtual account
 */
export declare const createVirtualAccount: (accountData: VirtualAccountRequest) => Promise<VirtualAccountResponse>;
/**
 * Process refund
 */
export declare const processRefund: (transactionId: string, refundData: PaymentRefundRequest) => Promise<RefundResponse>;
/**
 * Retry mechanism with exponential backoff
 */
export declare const retryWithBackoff: <T>(fn: () => Promise<T>, maxRetries?: number, initialDelay?: number) => Promise<T>;
/**
 * Get payment status from Flutterwave status
 */
export declare const mapFlutterwaveStatus: (flutterwaveStatus: string) => string;
/**
 * Validate payment amount
 */
export declare const validateAmount: (amount: number, currency?: string) => boolean;
/**
 * Calculate fees
 */
export declare const calculateFees: (amount: number, currency?: string) => {
    amount: number;
    fee: number;
    total: number;
};
/**
 * Generate payment metadata
 */
export declare const generatePaymentMetadata: (data: Record<string, any>) => Record<string, any>;
/**
 * Validate webhook payload
 */
export declare const validateWebhookPayload: (payload: any) => payload is FlutterwaveWebhookPayload;
/**
 * Get supported banks
 */
export declare const getSupportedBanks: (country?: string) => Promise<any[]>;
/**
 * Check if payment method is supported
 */
export declare const isPaymentMethodSupported: (method: string, currency?: string) => boolean;
declare const _default: {
    initializePayment: (paymentData: FlutterwavePaymentRequest) => Promise<FlutterwavePaymentResponse>;
    verifyTransaction: (transactionId: string) => Promise<FlutterwaveVerificationResponse>;
    createVirtualAccount: (accountData: VirtualAccountRequest) => Promise<VirtualAccountResponse>;
    processRefund: (transactionId: string, refundData: PaymentRefundRequest) => Promise<RefundResponse>;
    retryWithBackoff: <T>(fn: () => Promise<T>, maxRetries?: number, initialDelay?: number) => Promise<T>;
    generateTxRef: (prefix?: string) => string;
    encryptPaymentData: (data: string) => string;
    decryptPaymentData: (encryptedData: string) => string;
    verifyWebhookSignature: (payload: string, signature: string) => boolean;
    mapFlutterwaveStatus: (flutterwaveStatus: string) => string;
    validateAmount: (amount: number, currency?: string) => boolean;
    formatAmount: (amount: number, currency?: string) => string;
    calculateFees: (amount: number, currency?: string) => {
        amount: number;
        fee: number;
        total: number;
    };
    generatePaymentMetadata: (data: Record<string, any>) => Record<string, any>;
    validateWebhookPayload: (payload: any) => payload is FlutterwaveWebhookPayload;
    getSupportedBanks: (country?: string) => Promise<any[]>;
    isPaymentMethodSupported: (method: string, currency?: string) => boolean;
};
export default _default;
//# sourceMappingURL=flutterwave.d.ts.map