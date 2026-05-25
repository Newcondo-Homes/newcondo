"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VIRTUAL_ACCOUNT_CONSTANTS = void 0;
exports.VIRTUAL_ACCOUNT_CONSTANTS = {
    // Account naming patterns
    NAMING: {
        OWNER_PREFIX: 'NC-OWN',
        AGENT_PREFIX: 'NC-AGT',
        MARKING_PREFIX: 'NC-MRK',
        SEPARATOR: '-',
        RANDOM_SUFFIX_LENGTH: 6,
    },
    // Balance limits
    BALANCE: {
        MINIMUM: 0,
        MAXIMUM: 50000000, // 50M NGN
        CURRENCY: 'NGN',
    },
    // Transaction limits
    TRANSACTION: {
        MINIMUM_AMOUNT: 100, // 1 NGN
        MAXIMUM_SINGLE_AMOUNT: 10000000, // 10M NGN
        DAILY_LIMIT: 20000000, // 20M NGN
        MONTHLY_LIMIT: 100000000, // 100M NGN
    },
    // Account status
    STATUS: {
        ACTIVE: 'ACTIVE',
        SUSPENDED: 'SUSPENDED',
        CLOSED: 'CLOSED',
        PENDING: 'PENDING',
    },
    // Account types
    ACCOUNT_TYPES: {
        PROPERTY_OWNER: 'PROPERTY_OWNER',
        AGENT: 'AGENT',
        MARKING_SERVICE: 'MARKING_SERVICE',
    },
    // Flutterwave specific
    FLUTTERWAVE: {
        BANK_CODE: '044', // Default bank code for virtual accounts
        CURRENCY: 'NGN',
        COUNTRY: 'NG',
        BVN_REQUIRED: false,
    },
    // Account reconciliation
    RECONCILIATION: {
        BATCH_SIZE: 100,
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY_MS: 5000,
    },
    // Fund holding periods
    HOLDING_PERIODS: {
        RENT_PAYMENT: 7, // 7 days holding period for rent payments
        MARKING_PAYMENT: 1, // 1 day for marking service payments
        DISPUTE_HOLD: 14, // 14 days for disputed transactions
    },
    // Webhook events
    WEBHOOK_EVENTS: {
        ACCOUNT_CREATED: 'account.created',
        PAYMENT_RECEIVED: 'payment.received',
        PAYMENT_SENT: 'payment.sent',
        BALANCE_UPDATED: 'balance.updated',
        ACCOUNT_SUSPENDED: 'account.suspended',
        ACCOUNT_REACTIVATED: 'account.reactivated',
    },
    // Error codes
    ERROR_CODES: {
        ACCOUNT_NOT_FOUND: 'VA_ACCOUNT_NOT_FOUND',
        INSUFFICIENT_BALANCE: 'VA_INSUFFICIENT_BALANCE',
        ACCOUNT_SUSPENDED: 'VA_ACCOUNT_SUSPENDED',
        TRANSACTION_LIMIT_EXCEEDED: 'VA_TRANSACTION_LIMIT_EXCEEDED',
        INVALID_ACCOUNT_TYPE: 'VA_INVALID_ACCOUNT_TYPE',
        DUPLICATE_ACCOUNT: 'VA_DUPLICATE_ACCOUNT',
        FLUTTERWAVE_ERROR: 'VA_FLUTTERWAVE_ERROR',
        RECONCILIATION_FAILED: 'VA_RECONCILIATION_FAILED',
    },
    // Success messages
    SUCCESS_MESSAGES: {
        ACCOUNT_CREATED: 'Virtual account created successfully',
        PAYMENT_PROCESSED: 'Payment processed successfully',
        BALANCE_UPDATED: 'Account balance updated successfully',
        ACCOUNT_RECONCILED: 'Account reconciliation completed',
        FUNDS_HELD: 'Funds held successfully',
        FUNDS_RELEASED: 'Funds released successfully',
    },
};
//# sourceMappingURL=virtualAccount.js.map