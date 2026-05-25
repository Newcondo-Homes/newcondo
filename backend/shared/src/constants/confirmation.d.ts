/**
 * Payment confirmation period constants
 *
 * Confirmation Period: 24 hours from payment
 * During this period:
 * - Renter can verify property and confirm/dispute
 * - Funds are held in virtual accounts
 * - Platform service fee is non-refundable
 * After period ends:
 * - If confirmed/no action: Commission distributed automatically
 * - If disputed: Admin review process begins
 */
/**
 * Confirmation period duration in milliseconds
 * @constant 24 hours = 86,400,000 ms
 */
export declare const CONFIRMATION_PERIOD_MS: number;
/**
 * Confirmation period in hours (for display)
 */
export declare const CONFIRMATION_PERIOD_HOURS = 24;
/**
 * Confirmation period in days (for display)
 */
export declare const CONFIRMATION_PERIOD_DAYS = 1;
/**
 * Grace period after confirmation deadline (in hours)
 * Additional time before automatic confirmation
 */
export declare const GRACE_PERIOD_HOURS = 2;
/**
 * Grace period in milliseconds
 */
export declare const GRACE_PERIOD_MS: number;
/**
 * Warning period before confirmation deadline (in hours)
 * When to send reminder notifications
 */
export declare const WARNING_PERIOD_HOURS = 6;
/**
 * Warning period in milliseconds
 */
export declare const WARNING_PERIOD_MS: number;
/**
 * Payment statuses during confirmation period
 */
export declare const CONFIRMATION_STATUS: {
    readonly PENDING_CONFIRMATION: "PENDING_CONFIRMATION";
    readonly CONFIRMED: "CONFIRMED";
    readonly DISPUTED: "DISPUTED";
    readonly AUTO_CONFIRMED: "AUTO_CONFIRMED";
    readonly REFUNDED: "REFUNDED";
    readonly RELEASED: "RELEASED";
};
/**
 * Actions renters can take during confirmation period
 */
export declare const RENTER_ACTIONS: {
    readonly CONFIRM: "CONFIRM";
    readonly DISPUTE: "DISPUTE";
    readonly REQUEST_REFUND: "REQUEST_REFUND";
    readonly UPLOAD_VERIFICATION: "UPLOAD_VERIFICATION";
};
/**
 * Dispute reasons
 */
export declare const DISPUTE_REASONS: {
    readonly PROPERTY_NOT_AS_DESCRIBED: "PROPERTY_NOT_AS_DESCRIBED";
    readonly PROPERTY_UNAVAILABLE: "PROPERTY_UNAVAILABLE";
    readonly FRAUD_SUSPECTED: "FRAUD_SUSPECTED";
    readonly OWNER_CANCELLED: "OWNER_CANCELLED";
    readonly DUPLICATE_BOOKING: "DUPLICATE_BOOKING";
    readonly SAFETY_CONCERNS: "SAFETY_CONCERNS";
    readonly LOCATION_MISMATCH: "LOCATION_MISMATCH";
    readonly CONDITION_ISSUES: "CONDITION_ISSUES";
    readonly OTHER: "OTHER";
};
/**
 * Notification triggers during confirmation period
 */
export declare const CONFIRMATION_NOTIFICATION_TRIGGERS: {
    readonly PAYMENT_RECEIVED: "PAYMENT_RECEIVED";
    readonly CONFIRMATION_REMINDER: "CONFIRMATION_REMINDER";
    readonly CONFIRMATION_WARNING: "CONFIRMATION_WARNING";
    readonly CONFIRMATION_DEADLINE: "CONFIRMATION_DEADLINE";
    readonly AUTO_CONFIRMED: "AUTO_CONFIRMED";
    readonly CONFIRMED_BY_RENTER: "CONFIRMED_BY_RENTER";
    readonly DISPUTED: "DISPUTED";
    readonly REFUND_PROCESSED: "REFUND_PROCESSED";
    readonly COMMISSION_RELEASED: "COMMISSION_RELEASED";
};
/**
 * Notification timing schedule
 */
export declare const NOTIFICATION_SCHEDULE: {
    readonly PAYMENT_RECEIVED: 0;
    readonly FIRST_REMINDER: 12;
    readonly FINAL_REMINDER: 6;
    readonly URGENT_REMINDER: 2;
    readonly CONFIRMATION_SUCCESS: 0;
    readonly COMMISSION_DISTRIBUTION: 1;
};
/**
 * Required verification items from renter
 */
export declare const VERIFICATION_REQUIREMENTS: {
    readonly MIN_IMAGES: 3;
    readonly MAX_IMAGES: 10;
    readonly MIN_NOTES_LENGTH: 10;
    readonly MAX_NOTES_LENGTH: 500;
    readonly REQUIRED_CHECKS: readonly ["PROPERTY_ACCESSIBLE", "MATCHES_LISTING", "OWNER_PRESENT"];
};
/**
 * Admin review settings for disputed payments
 */
export declare const ADMIN_REVIEW: {
    readonly MAX_REVIEW_DAYS: 7;
    readonly AUTO_REFUND_THRESHOLD: 3;
    readonly PRIORITY_REVIEW_AMOUNT: 500000;
    readonly ESCALATION_HOURS: 48;
};
/**
 * Refund processing settings
 */
export declare const REFUND_SETTINGS: {
    readonly PROCESSING_TIME_HOURS: 24;
    readonly MAX_PROCESSING_TIME_HOURS: 72;
    readonly PLATFORM_FEE_REFUNDABLE: false;
    readonly TRANSACTION_FEE_REFUNDABLE: false;
    readonly PARTIAL_REFUND_ALLOWED: true;
    readonly MIN_REFUND_PERCENTAGE: 50;
    readonly FULL_REFUND_SCENARIOS: readonly ["PROPERTY_UNAVAILABLE", "FRAUD_SUSPECTED", "OWNER_CANCELLED", "DUPLICATE_BOOKING"];
};
/**
 * Platform fee settings
 */
export declare const PLATFORM_FEE: {
    readonly BASE_RATE: 0.02;
    readonly MINIMUM_FEE: 200;
    readonly MAXIMUM_FEE: 5000;
    readonly TRANSACTION_FEE_RATE: 0.014;
    readonly TRANSACTION_FEE_CAP: 2000;
    readonly REFUND_FEE_RATE: 0.014;
    readonly SERVICE_CHARGE_MULTIPLIER: 2;
    readonly IS_REFUNDABLE: false;
    readonly DESCRIPTION: "Platform service fee (non-refundable) + Transaction processing fee";
};
/**
 * Calculate platform fees
 */
export declare const calculatePlatformFees: {
    /**
     * Calculate base platform fee
     */
    baseFee(rentAmount: number): number;
    /**
     * Calculate Flutterwave transaction fee
     */
    transactionFee(amount: number): number;
    /**
     * Calculate total service charge (covers potential refund fees)
     */
    serviceCharge(rentAmount: number): number;
    /**
     * Calculate total platform fees
     */
    total(rentAmount: number): number;
    /**
     * Calculate total amount renter pays (rent + fees)
     */
    totalRenterPayment(rentAmount: number): number;
};
/**
 * Confirmation period stages
 */
export declare const CONFIRMATION_STAGES: {
    readonly ACTIVE: {
        readonly status: "ACTIVE";
        readonly description: "Renter can confirm or dispute";
        readonly allowConfirmation: true;
        readonly allowDispute: true;
    };
    readonly WARNING: {
        readonly status: "WARNING";
        readonly description: "Less than 6 hours remaining";
        readonly allowConfirmation: true;
        readonly allowDispute: true;
    };
    readonly GRACE: {
        readonly status: "GRACE";
        readonly description: "Grace period - final chance to dispute";
        readonly allowConfirmation: true;
        readonly allowDispute: true;
    };
    readonly EXPIRED: {
        readonly status: "EXPIRED";
        readonly description: "Auto-confirmation triggered";
        readonly allowConfirmation: false;
        readonly allowDispute: false;
    };
};
/**
 * Helper to determine current stage
 */
export declare const getConfirmationStage: (confirmationDeadline: Date) => keyof typeof CONFIRMATION_STAGES;
/**
 * Commission release settings
 */
export declare const RELEASE_SETTINGS: {
    readonly AUTO_RELEASE_DELAY_MS: number;
    readonly BATCH_RELEASE_ENABLED: true;
    readonly BATCH_INTERVAL_MINUTES: 15;
    readonly MAX_RETRY_ATTEMPTS: 3;
    readonly RETRY_DELAY_MINUTES: 5;
};
//# sourceMappingURL=confirmation.d.ts.map