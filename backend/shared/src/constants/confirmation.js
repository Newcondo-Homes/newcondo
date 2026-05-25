"use strict";
// backend/shared/src/constants/confirmation.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.RELEASE_SETTINGS = exports.getConfirmationStage = exports.CONFIRMATION_STAGES = exports.calculatePlatformFees = exports.PLATFORM_FEE = exports.REFUND_SETTINGS = exports.ADMIN_REVIEW = exports.VERIFICATION_REQUIREMENTS = exports.NOTIFICATION_SCHEDULE = exports.CONFIRMATION_NOTIFICATION_TRIGGERS = exports.DISPUTE_REASONS = exports.RENTER_ACTIONS = exports.CONFIRMATION_STATUS = exports.WARNING_PERIOD_MS = exports.WARNING_PERIOD_HOURS = exports.GRACE_PERIOD_MS = exports.GRACE_PERIOD_HOURS = exports.CONFIRMATION_PERIOD_DAYS = exports.CONFIRMATION_PERIOD_HOURS = exports.CONFIRMATION_PERIOD_MS = void 0;
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
exports.CONFIRMATION_PERIOD_MS = 24 * 60 * 60 * 1000;
/**
 * Confirmation period in hours (for display)
 */
exports.CONFIRMATION_PERIOD_HOURS = 24;
/**
 * Confirmation period in days (for display)
 */
exports.CONFIRMATION_PERIOD_DAYS = 1;
/**
 * Grace period after confirmation deadline (in hours)
 * Additional time before automatic confirmation
 */
exports.GRACE_PERIOD_HOURS = 2;
/**
 * Grace period in milliseconds
 */
exports.GRACE_PERIOD_MS = exports.GRACE_PERIOD_HOURS * 60 * 60 * 1000;
/**
 * Warning period before confirmation deadline (in hours)
 * When to send reminder notifications
 */
exports.WARNING_PERIOD_HOURS = 6;
/**
 * Warning period in milliseconds
 */
exports.WARNING_PERIOD_MS = exports.WARNING_PERIOD_HOURS * 60 * 60 * 1000;
/**
 * Payment statuses during confirmation period
 */
exports.CONFIRMATION_STATUS = {
    PENDING_CONFIRMATION: 'PENDING_CONFIRMATION',
    CONFIRMED: 'CONFIRMED',
    DISPUTED: 'DISPUTED',
    AUTO_CONFIRMED: 'AUTO_CONFIRMED',
    REFUNDED: 'REFUNDED',
    RELEASED: 'RELEASED'
};
/**
 * Actions renters can take during confirmation period
 */
exports.RENTER_ACTIONS = {
    CONFIRM: 'CONFIRM',
    DISPUTE: 'DISPUTE',
    REQUEST_REFUND: 'REQUEST_REFUND',
    UPLOAD_VERIFICATION: 'UPLOAD_VERIFICATION'
};
/**
 * Dispute reasons
 */
exports.DISPUTE_REASONS = {
    PROPERTY_NOT_AS_DESCRIBED: 'PROPERTY_NOT_AS_DESCRIBED',
    PROPERTY_UNAVAILABLE: 'PROPERTY_UNAVAILABLE',
    FRAUD_SUSPECTED: 'FRAUD_SUSPECTED',
    OWNER_CANCELLED: 'OWNER_CANCELLED',
    DUPLICATE_BOOKING: 'DUPLICATE_BOOKING',
    SAFETY_CONCERNS: 'SAFETY_CONCERNS',
    LOCATION_MISMATCH: 'LOCATION_MISMATCH',
    CONDITION_ISSUES: 'CONDITION_ISSUES',
    OTHER: 'OTHER'
};
/**
 * Notification triggers during confirmation period
 */
exports.CONFIRMATION_NOTIFICATION_TRIGGERS = {
    PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
    CONFIRMATION_REMINDER: 'CONFIRMATION_REMINDER',
    CONFIRMATION_WARNING: 'CONFIRMATION_WARNING',
    CONFIRMATION_DEADLINE: 'CONFIRMATION_DEADLINE',
    AUTO_CONFIRMED: 'AUTO_CONFIRMED',
    CONFIRMED_BY_RENTER: 'CONFIRMED_BY_RENTER',
    DISPUTED: 'DISPUTED',
    REFUND_PROCESSED: 'REFUND_PROCESSED',
    COMMISSION_RELEASED: 'COMMISSION_RELEASED'
};
/**
 * Notification timing schedule
 */
exports.NOTIFICATION_SCHEDULE = {
    // Immediate notifications
    PAYMENT_RECEIVED: 0, // Send immediately after payment
    // Reminder notifications (hours before deadline)
    FIRST_REMINDER: 12, // 12 hours after payment (12h remaining)
    FINAL_REMINDER: 6, // 18 hours after payment (6h remaining)
    URGENT_REMINDER: 2, // 22 hours after payment (2h remaining)
    // Post-confirmation notifications
    CONFIRMATION_SUCCESS: 0, // Immediate
    COMMISSION_DISTRIBUTION: 1 // 1 hour after auto-confirmation
};
/**
 * Required verification items from renter
 */
exports.VERIFICATION_REQUIREMENTS = {
    MIN_IMAGES: 3,
    MAX_IMAGES: 10,
    MIN_NOTES_LENGTH: 10,
    MAX_NOTES_LENGTH: 500,
    REQUIRED_CHECKS: [
        'PROPERTY_ACCESSIBLE',
        'MATCHES_LISTING',
        'OWNER_PRESENT'
    ]
};
/**
 * Admin review settings for disputed payments
 */
exports.ADMIN_REVIEW = {
    MAX_REVIEW_DAYS: 7, // Maximum days for admin to review dispute
    AUTO_REFUND_THRESHOLD: 3, // Auto-refund after 3 days if no admin action
    PRIORITY_REVIEW_AMOUNT: 500000, // NGN - High-value disputes get priority
    ESCALATION_HOURS: 48 // Escalate to senior admin after 48 hours
};
/**
 * Refund processing settings
 */
exports.REFUND_SETTINGS = {
    PROCESSING_TIME_HOURS: 24, // Expected refund processing time
    MAX_PROCESSING_TIME_HOURS: 72, // Maximum time before escalation
    PLATFORM_FEE_REFUNDABLE: false, // Platform fee is non-refundable
    TRANSACTION_FEE_REFUNDABLE: false, // Flutterwave fees non-refundable
    PARTIAL_REFUND_ALLOWED: true, // Allow partial refunds for disputes
    MIN_REFUND_PERCENTAGE: 50, // Minimum 50% refund in disputes
    FULL_REFUND_SCENARIOS: [
        'PROPERTY_UNAVAILABLE',
        'FRAUD_SUSPECTED',
        'OWNER_CANCELLED',
        'DUPLICATE_BOOKING'
    ]
};
/**
 * Platform fee settings
 */
exports.PLATFORM_FEE = {
    // Base platform fee (percentage of rent)
    BASE_RATE: 0.02, // 2% of rent amount
    // Minimum platform fee in NGN
    MINIMUM_FEE: 200,
    // Maximum platform fee in NGN (cap)
    MAXIMUM_FEE: 5000,
    // Transaction fees (from Flutterwave)
    TRANSACTION_FEE_RATE: 0.014, // 1.4%
    TRANSACTION_FEE_CAP: 2000, // 2000 NGN cap
    // Refund transaction fee (charged on refunds)
    REFUND_FEE_RATE: 0.014, // 1.4%
    // Total service charge multiplier (covers both ways)
    SERVICE_CHARGE_MULTIPLIER: 2, // Double the transaction fee
    // Fee refundability
    IS_REFUNDABLE: false,
    // Description for renter
    DESCRIPTION: 'Platform service fee (non-refundable) + Transaction processing fee'
};
/**
 * Calculate platform fees
 */
exports.calculatePlatformFees = {
    /**
     * Calculate base platform fee
     */
    baseFee(rentAmount) {
        const fee = rentAmount * exports.PLATFORM_FEE.BASE_RATE;
        return Math.max(Math.min(fee, exports.PLATFORM_FEE.MAXIMUM_FEE), exports.PLATFORM_FEE.MINIMUM_FEE);
    },
    /**
     * Calculate Flutterwave transaction fee
     */
    transactionFee(amount) {
        const fee = amount * exports.PLATFORM_FEE.TRANSACTION_FEE_RATE;
        return Math.min(fee, exports.PLATFORM_FEE.TRANSACTION_FEE_CAP);
    },
    /**
     * Calculate total service charge (covers potential refund fees)
     */
    serviceCharge(rentAmount) {
        const txFee = this.transactionFee(rentAmount);
        return txFee * exports.PLATFORM_FEE.SERVICE_CHARGE_MULTIPLIER;
    },
    /**
     * Calculate total platform fees
     */
    total(rentAmount) {
        return this.baseFee(rentAmount) + this.serviceCharge(rentAmount);
    },
    /**
     * Calculate total amount renter pays (rent + fees)
     */
    totalRenterPayment(rentAmount) {
        return rentAmount + this.total(rentAmount);
    }
};
/**
 * Confirmation period stages
 */
exports.CONFIRMATION_STAGES = {
    ACTIVE: {
        status: 'ACTIVE',
        description: 'Renter can confirm or dispute',
        allowConfirmation: true,
        allowDispute: true
    },
    WARNING: {
        status: 'WARNING',
        description: 'Less than 6 hours remaining',
        allowConfirmation: true,
        allowDispute: true
    },
    GRACE: {
        status: 'GRACE',
        description: 'Grace period - final chance to dispute',
        allowConfirmation: true,
        allowDispute: true
    },
    EXPIRED: {
        status: 'EXPIRED',
        description: 'Auto-confirmation triggered',
        allowConfirmation: false,
        allowDispute: false
    }
};
/**
 * Helper to determine current stage
 */
const getConfirmationStage = (confirmationDeadline) => {
    const now = new Date();
    const timeRemaining = confirmationDeadline.getTime() - now.getTime();
    if (timeRemaining < 0) {
        return 'EXPIRED';
    }
    else if (timeRemaining < exports.GRACE_PERIOD_MS) {
        return 'GRACE';
    }
    else if (timeRemaining < exports.WARNING_PERIOD_MS) {
        return 'WARNING';
    }
    else {
        return 'ACTIVE';
    }
};
exports.getConfirmationStage = getConfirmationStage;
/**
 * Commission release settings
 */
exports.RELEASE_SETTINGS = {
    AUTO_RELEASE_DELAY_MS: 60 * 60 * 1000, // 1 hour after confirmation
    BATCH_RELEASE_ENABLED: true, // Process releases in batches
    BATCH_INTERVAL_MINUTES: 15, // Run batch every 15 minutes
    MAX_RETRY_ATTEMPTS: 3, // Retry failed releases 3 times
    RETRY_DELAY_MINUTES: 5 // Wait 5 minutes between retries
};
//# sourceMappingURL=confirmation.js.map