export declare const VIRTUAL_ACCOUNT_CONSTANTS: {
    readonly NAMING: {
        readonly OWNER_PREFIX: "NC-OWN";
        readonly AGENT_PREFIX: "NC-AGT";
        readonly MARKING_PREFIX: "NC-MRK";
        readonly SEPARATOR: "-";
        readonly RANDOM_SUFFIX_LENGTH: 6;
    };
    readonly BALANCE: {
        readonly MINIMUM: 0;
        readonly MAXIMUM: 50000000;
        readonly CURRENCY: "NGN";
    };
    readonly TRANSACTION: {
        readonly MINIMUM_AMOUNT: 100;
        readonly MAXIMUM_SINGLE_AMOUNT: 10000000;
        readonly DAILY_LIMIT: 20000000;
        readonly MONTHLY_LIMIT: 100000000;
    };
    readonly STATUS: {
        readonly ACTIVE: "ACTIVE";
        readonly SUSPENDED: "SUSPENDED";
        readonly CLOSED: "CLOSED";
        readonly PENDING: "PENDING";
    };
    readonly ACCOUNT_TYPES: {
        readonly PROPERTY_OWNER: "PROPERTY_OWNER";
        readonly AGENT: "AGENT";
        readonly MARKING_SERVICE: "MARKING_SERVICE";
    };
    readonly FLUTTERWAVE: {
        readonly BANK_CODE: "044";
        readonly CURRENCY: "NGN";
        readonly COUNTRY: "NG";
        readonly BVN_REQUIRED: false;
    };
    readonly RECONCILIATION: {
        readonly BATCH_SIZE: 100;
        readonly RETRY_ATTEMPTS: 3;
        readonly RETRY_DELAY_MS: 5000;
    };
    readonly HOLDING_PERIODS: {
        readonly RENT_PAYMENT: 7;
        readonly MARKING_PAYMENT: 1;
        readonly DISPUTE_HOLD: 14;
    };
    readonly WEBHOOK_EVENTS: {
        readonly ACCOUNT_CREATED: "account.created";
        readonly PAYMENT_RECEIVED: "payment.received";
        readonly PAYMENT_SENT: "payment.sent";
        readonly BALANCE_UPDATED: "balance.updated";
        readonly ACCOUNT_SUSPENDED: "account.suspended";
        readonly ACCOUNT_REACTIVATED: "account.reactivated";
    };
    readonly ERROR_CODES: {
        readonly ACCOUNT_NOT_FOUND: "VA_ACCOUNT_NOT_FOUND";
        readonly INSUFFICIENT_BALANCE: "VA_INSUFFICIENT_BALANCE";
        readonly ACCOUNT_SUSPENDED: "VA_ACCOUNT_SUSPENDED";
        readonly TRANSACTION_LIMIT_EXCEEDED: "VA_TRANSACTION_LIMIT_EXCEEDED";
        readonly INVALID_ACCOUNT_TYPE: "VA_INVALID_ACCOUNT_TYPE";
        readonly DUPLICATE_ACCOUNT: "VA_DUPLICATE_ACCOUNT";
        readonly FLUTTERWAVE_ERROR: "VA_FLUTTERWAVE_ERROR";
        readonly RECONCILIATION_FAILED: "VA_RECONCILIATION_FAILED";
    };
    readonly SUCCESS_MESSAGES: {
        readonly ACCOUNT_CREATED: "Virtual account created successfully";
        readonly PAYMENT_PROCESSED: "Payment processed successfully";
        readonly BALANCE_UPDATED: "Account balance updated successfully";
        readonly ACCOUNT_RECONCILED: "Account reconciliation completed";
        readonly FUNDS_HELD: "Funds held successfully";
        readonly FUNDS_RELEASED: "Funds released successfully";
    };
};
export type VirtualAccountType = typeof VIRTUAL_ACCOUNT_CONSTANTS.ACCOUNT_TYPES[keyof typeof VIRTUAL_ACCOUNT_CONSTANTS.ACCOUNT_TYPES];
export type VirtualAccountStatus = typeof VIRTUAL_ACCOUNT_CONSTANTS.STATUS[keyof typeof VIRTUAL_ACCOUNT_CONSTANTS.STATUS];
export type VirtualAccountErrorCode = typeof VIRTUAL_ACCOUNT_CONSTANTS.ERROR_CODES[keyof typeof VIRTUAL_ACCOUNT_CONSTANTS.ERROR_CODES];
export type VirtualAccountWebhookEvent = typeof VIRTUAL_ACCOUNT_CONSTANTS.WEBHOOK_EVENTS[keyof typeof VIRTUAL_ACCOUNT_CONSTANTS.WEBHOOK_EVENTS];
//# sourceMappingURL=virtualAccount.d.ts.map