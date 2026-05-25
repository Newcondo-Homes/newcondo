"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTestMode = exports.getFlutterwaveHeaders = exports.FLUTTERWAVE_ERROR_CODES = exports.FLUTTERWAVE_STATUS_MAP = exports.VIRTUAL_ACCOUNT_CONFIG = exports.PAYMENT_CONFIG = exports.FLUTTERWAVE_ENDPOINTS = exports.flutterwaveConfig = void 0;
const zod_1 = require("zod");
// Environment validation schema
const FlutterwaveConfigSchema = zod_1.z.object({
    FLUTTERWAVE_PUBLIC_KEY: zod_1.z.string().min(1, 'Flutterwave public key is required'),
    FLUTTERWAVE_SECRET_KEY: zod_1.z.string().min(1, 'Flutterwave secret key is required'),
    FLUTTERWAVE_ENCRYPTION_KEY: zod_1.z.string().min(1, 'Flutterwave encryption key is required'),
    FLUTTERWAVE_WEBHOOK_SECRET: zod_1.z.string().min(1, 'Flutterwave webhook secret is required'),
    FLUTTERWAVE_BASE_URL: zod_1.z.string().url().default('https://api.flutterwave.com/v3'),
    FRONTEND_URL: zod_1.z.string().url(),
    WEBHOOK_URL: zod_1.z.string().url(),
});
// Validate environment variables
const validateConfig = () => {
    try {
        return FlutterwaveConfigSchema.parse({
            FLUTTERWAVE_PUBLIC_KEY: process.env.FLUTTERWAVE_PUBLIC_KEY,
            FLUTTERWAVE_SECRET_KEY: process.env.FLUTTERWAVE_SECRET_KEY,
            FLUTTERWAVE_ENCRYPTION_KEY: process.env.FLUTTERWAVE_ENCRYPTION_KEY,
            FLUTTERWAVE_WEBHOOK_SECRET: process.env.FLUTTERWAVE_WEBHOOK_SECRET,
            FLUTTERWAVE_BASE_URL: process.env.FLUTTERWAVE_BASE_URL,
            FRONTEND_URL: process.env.FRONTEND_URL,
            WEBHOOK_URL: process.env.WEBHOOK_URL,
        });
    }
    catch (error) {
        console.error('Flutterwave configuration validation failed:', error);
        throw new Error('Invalid Flutterwave configuration');
    }
};
// Export validated configuration
exports.flutterwaveConfig = validateConfig();
// Flutterwave API endpoints
exports.FLUTTERWAVE_ENDPOINTS = {
    INITIATE_PAYMENT: '/payments',
    VERIFY_TRANSACTION: '/transactions/{id}/verify',
    REFUND_TRANSACTION: '/transactions/{id}/refund',
    CREATE_VIRTUAL_ACCOUNT: '/virtual-account-numbers',
    LIST_TRANSACTIONS: '/transactions',
    WEBHOOK_VERIFY: '/webhooks/verify',
    BANKS: '/banks',
    TRANSFER: '/transfers',
};
// Payment configuration constants
exports.PAYMENT_CONFIG = {
    CURRENCY: 'NGN',
    REDIRECT_URL: `${exports.flutterwaveConfig.FRONTEND_URL}/payments/callback`,
    WEBHOOK_URL: `${exports.flutterwaveConfig.WEBHOOK_URL}/api/webhooks/flutterwave`,
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 second
};
// Virtual account configuration
exports.VIRTUAL_ACCOUNT_CONFIG = {
    PROVIDER: 'wema-bank',
    FREQUENCY: 1, // One-time virtual account
    DURATION: 365, // 365 days validity
    IS_PERMANENT: true,
};
// Payment status mapping
exports.FLUTTERWAVE_STATUS_MAP = {
    'pending': 'PENDING',
    'successful': 'SUCCESS',
    'failed': 'FAILED',
    'cancelled': 'CANCELLED',
    'abandoned': 'FAILED',
};
// Error codes
exports.FLUTTERWAVE_ERROR_CODES = {
    INSUFFICIENT_FUNDS: 'RR-19',
    TRANSACTION_NOT_FOUND: 'RR-50',
    INVALID_CARD: 'RR-30',
    EXPIRED_CARD: 'RR-31',
    DECLINED_BY_BANK: 'RR-32',
    NETWORK_ERROR: 'RR-99',
};
// Headers for API requests
const getFlutterwaveHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${exports.flutterwaveConfig.FLUTTERWAVE_SECRET_KEY}`,
});
exports.getFlutterwaveHeaders = getFlutterwaveHeaders;
// Test mode check
const isTestMode = () => {
    return exports.flutterwaveConfig.FLUTTERWAVE_PUBLIC_KEY.startsWith('FLWPUBK_TEST');
};
exports.isTestMode = isTestMode;
exports.default = exports.flutterwaveConfig;
//# sourceMappingURL=flutterwave.js.map