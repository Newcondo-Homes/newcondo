export declare const flutterwaveConfig: {
    FRONTEND_URL: string;
    FLUTTERWAVE_PUBLIC_KEY: string;
    FLUTTERWAVE_SECRET_KEY: string;
    FLUTTERWAVE_ENCRYPTION_KEY: string;
    FLUTTERWAVE_WEBHOOK_SECRET: string;
    FLUTTERWAVE_BASE_URL: string;
    WEBHOOK_URL: string;
};
export declare const FLUTTERWAVE_ENDPOINTS: {
    readonly INITIATE_PAYMENT: "/payments";
    readonly VERIFY_TRANSACTION: "/transactions/{id}/verify";
    readonly REFUND_TRANSACTION: "/transactions/{id}/refund";
    readonly CREATE_VIRTUAL_ACCOUNT: "/virtual-account-numbers";
    readonly LIST_TRANSACTIONS: "/transactions";
    readonly WEBHOOK_VERIFY: "/webhooks/verify";
    readonly BANKS: "/banks";
    readonly TRANSFER: "/transfers";
};
export declare const PAYMENT_CONFIG: {
    readonly CURRENCY: "NGN";
    readonly REDIRECT_URL: `${string}/payments/callback`;
    readonly WEBHOOK_URL: `${string}/api/webhooks/flutterwave`;
    readonly TIMEOUT: 30000;
    readonly RETRY_ATTEMPTS: 3;
    readonly RETRY_DELAY: 1000;
};
export declare const VIRTUAL_ACCOUNT_CONFIG: {
    readonly PROVIDER: "wema-bank";
    readonly FREQUENCY: 1;
    readonly DURATION: 365;
    readonly IS_PERMANENT: true;
};
export declare const FLUTTERWAVE_STATUS_MAP: {
    readonly pending: "PENDING";
    readonly successful: "SUCCESS";
    readonly failed: "FAILED";
    readonly cancelled: "CANCELLED";
    readonly abandoned: "FAILED";
};
export declare const FLUTTERWAVE_ERROR_CODES: {
    readonly INSUFFICIENT_FUNDS: "RR-19";
    readonly TRANSACTION_NOT_FOUND: "RR-50";
    readonly INVALID_CARD: "RR-30";
    readonly EXPIRED_CARD: "RR-31";
    readonly DECLINED_BY_BANK: "RR-32";
    readonly NETWORK_ERROR: "RR-99";
};
export declare const getFlutterwaveHeaders: () => {
    'Content-Type': string;
    Authorization: string;
};
export declare const isTestMode: () => boolean;
export default flutterwaveConfig;
//# sourceMappingURL=flutterwave.d.ts.map