"use strict";
/**
 * Payment release types for the Payment Confirmation & Release System
 * Location: backend/shared/src/types/paymentRelease.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentReleaseError = exports.PaymentReleaseErrorType = exports.NotificationChannel = exports.NotificationType = exports.JobStatus = exports.TransferStatus = exports.ReleaseScheduleStatus = exports.PaymentHoldStatus = exports.PAYMENT_HOLD_PERIOD_MS = exports.PAYMENT_HOLD_PERIOD_HOURS = void 0;
/**
 * Payment hold period (24 hours in milliseconds)
 */
exports.PAYMENT_HOLD_PERIOD_HOURS = 24;
exports.PAYMENT_HOLD_PERIOD_MS = exports.PAYMENT_HOLD_PERIOD_HOURS * 60 * 60 * 1000;
/**
 * Payment hold status
 */
var PaymentHoldStatus;
(function (PaymentHoldStatus) {
    PaymentHoldStatus["HELD"] = "HELD";
    PaymentHoldStatus["PENDING_RELEASE"] = "PENDING_RELEASE";
    PaymentHoldStatus["RELEASED"] = "RELEASED";
    PaymentHoldStatus["REFUNDED"] = "REFUNDED";
    PaymentHoldStatus["DISPUTED"] = "DISPUTED";
    PaymentHoldStatus["CANCELLED"] = "CANCELLED";
})(PaymentHoldStatus || (exports.PaymentHoldStatus = PaymentHoldStatus = {}));
/**
 * Release schedule status
 */
var ReleaseScheduleStatus;
(function (ReleaseScheduleStatus) {
    ReleaseScheduleStatus["SCHEDULED"] = "SCHEDULED";
    ReleaseScheduleStatus["PROCESSING"] = "PROCESSING";
    ReleaseScheduleStatus["COMPLETED"] = "COMPLETED";
    ReleaseScheduleStatus["FAILED"] = "FAILED";
    ReleaseScheduleStatus["CANCELLED"] = "CANCELLED";
})(ReleaseScheduleStatus || (exports.ReleaseScheduleStatus = ReleaseScheduleStatus = {}));
/**
 * Transfer status
 */
var TransferStatus;
(function (TransferStatus) {
    TransferStatus["PENDING"] = "PENDING";
    TransferStatus["PROCESSING"] = "PROCESSING";
    TransferStatus["COMPLETED"] = "COMPLETED";
    TransferStatus["FAILED"] = "FAILED";
})(TransferStatus || (exports.TransferStatus = TransferStatus = {}));
/**
 * Job status
 */
var JobStatus;
(function (JobStatus) {
    JobStatus["SCHEDULED"] = "SCHEDULED";
    JobStatus["RUNNING"] = "RUNNING";
    JobStatus["COMPLETED"] = "COMPLETED";
    JobStatus["FAILED"] = "FAILED";
    JobStatus["CANCELLED"] = "CANCELLED";
})(JobStatus || (exports.JobStatus = JobStatus = {}));
/**
 * Notification type
 */
var NotificationType;
(function (NotificationType) {
    NotificationType["PAYMENT_HELD"] = "PAYMENT_HELD";
    NotificationType["CONFIRMATION_REMINDER"] = "CONFIRMATION_REMINDER";
    NotificationType["PAYMENT_RELEASED"] = "PAYMENT_RELEASED";
    NotificationType["PAYMENT_REFUNDED"] = "PAYMENT_REFUNDED";
    NotificationType["COMMISSION_RECEIVED"] = "COMMISSION_RECEIVED";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
/**
 * Notification channel
 */
var NotificationChannel;
(function (NotificationChannel) {
    NotificationChannel["EMAIL"] = "EMAIL";
    NotificationChannel["SMS"] = "SMS";
    NotificationChannel["PUSH"] = "PUSH";
    NotificationChannel["IN_APP"] = "IN_APP";
})(NotificationChannel || (exports.NotificationChannel = NotificationChannel = {}));
/**
 * Error types for payment release operations
 */
var PaymentReleaseErrorType;
(function (PaymentReleaseErrorType) {
    PaymentReleaseErrorType["PAYMENT_HOLD_NOT_FOUND"] = "PAYMENT_HOLD_NOT_FOUND";
    PaymentReleaseErrorType["INVALID_STATUS"] = "INVALID_STATUS";
    PaymentReleaseErrorType["HOLD_PERIOD_NOT_ELAPSED"] = "HOLD_PERIOD_NOT_ELAPSED";
    PaymentReleaseErrorType["ALREADY_RELEASED"] = "ALREADY_RELEASED";
    PaymentReleaseErrorType["ALREADY_REFUNDED"] = "ALREADY_REFUNDED";
    PaymentReleaseErrorType["VIRTUAL_ACCOUNT_ERROR"] = "VIRTUAL_ACCOUNT_ERROR";
    PaymentReleaseErrorType["INSUFFICIENT_BALANCE"] = "INSUFFICIENT_BALANCE";
    PaymentReleaseErrorType["TRANSFER_FAILED"] = "TRANSFER_FAILED";
    PaymentReleaseErrorType["COMMISSION_CALCULATION_FAILED"] = "COMMISSION_CALCULATION_FAILED";
    PaymentReleaseErrorType["UNAUTHORIZED"] = "UNAUTHORIZED";
})(PaymentReleaseErrorType || (exports.PaymentReleaseErrorType = PaymentReleaseErrorType = {}));
/**
 * Payment release error
 */
class PaymentReleaseError extends Error {
    constructor(type, message, details) {
        super(message);
        this.type = type;
        this.details = details;
        this.name = 'PaymentReleaseError';
    }
}
exports.PaymentReleaseError = PaymentReleaseError;
//# sourceMappingURL=paymentRelease.js.map