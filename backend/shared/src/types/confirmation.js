"use strict";
/**
 * Confirmation period types for the Payment Confirmation & Release System
 * Location: backend/shared/src/types/confirmation.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisputeResolutionAction = exports.ConfirmationError = exports.ConfirmationErrorType = exports.OwnerNotificationType = exports.ConfirmationJobStatus = exports.ReminderAction = exports.ReminderStatus = exports.ConfirmationNotificationChannel = exports.ReminderType = exports.PreferredResolution = exports.DisputeCategory = exports.DEFAULT_VERIFICATION_CHECKLIST = exports.DisputeStatus = exports.ConfirmationMethod = exports.ConfirmationStatus = exports.CONFIRMATION_REMINDER_SCHEDULE = void 0;
// import { CONFIRMATION_PERIOD_HOURS } from 'src/constants';
/**
 * Confirmation period duration (24 hours)
 */
// export const CONFIRMATION_PERIOD_MS = CONFIRMATION_PERIOD_HOURS * 60 * 60 * 1000;
/**
 * Reminder schedule for confirmation reminders
 */
exports.CONFIRMATION_REMINDER_SCHEDULE = {
    FIRST_REMINDER_HOURS: 12, // 12 hours after payment
    SECOND_REMINDER_HOURS: 20, // 20 hours after payment
    FINAL_REMINDER_HOURS: 23, // 1 hour before deadline
};
/**
 * Confirmation status
 */
var ConfirmationStatus;
(function (ConfirmationStatus) {
    ConfirmationStatus["PENDING"] = "PENDING";
    ConfirmationStatus["CONFIRMED"] = "CONFIRMED";
    ConfirmationStatus["AUTO_CONFIRMED"] = "AUTO_CONFIRMED";
    ConfirmationStatus["DISPUTED"] = "DISPUTED";
    ConfirmationStatus["CANCELLED"] = "CANCELLED";
})(ConfirmationStatus || (exports.ConfirmationStatus = ConfirmationStatus = {}));
/**
 * Confirmation method
 */
var ConfirmationMethod;
(function (ConfirmationMethod) {
    ConfirmationMethod["MANUAL"] = "MANUAL";
    ConfirmationMethod["AUTO"] = "AUTO";
    ConfirmationMethod["ADMIN_OVERRIDE"] = "ADMIN_OVERRIDE";
})(ConfirmationMethod || (exports.ConfirmationMethod = ConfirmationMethod = {}));
/**
 * Dispute status
 */
var DisputeStatus;
(function (DisputeStatus) {
    DisputeStatus["PENDING"] = "PENDING";
    DisputeStatus["UNDER_REVIEW"] = "UNDER_REVIEW";
    DisputeStatus["RESOLVED_REFUND"] = "RESOLVED_REFUND";
    DisputeStatus["RESOLVED_NO_REFUND"] = "RESOLVED_NO_REFUND";
    DisputeStatus["ESCALATED"] = "ESCALATED";
})(DisputeStatus || (exports.DisputeStatus = DisputeStatus = {}));
/**
 * Default verification checklist
 */
exports.DEFAULT_VERIFICATION_CHECKLIST = [
    {
        id: 'property_viewed',
        label: 'I have physically viewed this property',
        description: 'Confirm that you have visited and inspected the property in person',
        isRequired: true,
    },
    {
        id: 'property_available',
        label: 'I confirm the property is available and as described',
        description: 'The property matches the listing and is ready for occupancy',
        isRequired: true,
    },
    {
        id: 'terms_accepted',
        label: 'I accept the rental terms and conditions',
        description: 'I have read and agree to the rental agreement terms',
        isRequired: true,
    },
    {
        id: 'refund_policy',
        label: 'I understand the refund and confirmation policy',
        description: 'I understand that I have 24 hours to confirm or dispute this payment, and service fees are non-refundable',
        isRequired: true,
    },
];
/**
 * Dispute category
 */
var DisputeCategory;
(function (DisputeCategory) {
    DisputeCategory["PROPERTY_UNAVAILABLE"] = "PROPERTY_UNAVAILABLE";
    DisputeCategory["NOT_AS_DESCRIBED"] = "NOT_AS_DESCRIBED";
    DisputeCategory["CONDITION_ISSUES"] = "CONDITION_ISSUES";
    DisputeCategory["LOCATION_ISSUES"] = "LOCATION_ISSUES";
    DisputeCategory["SAFETY_CONCERNS"] = "SAFETY_CONCERNS";
    DisputeCategory["LANDLORD_UNRESPONSIVE"] = "LANDLORD_UNRESPONSIVE";
    DisputeCategory["FRAUDULENT_LISTING"] = "FRAUDULENT_LISTING";
    DisputeCategory["OTHER"] = "OTHER";
})(DisputeCategory || (exports.DisputeCategory = DisputeCategory = {}));
/**
 * Preferred resolution
 */
var PreferredResolution;
(function (PreferredResolution) {
    PreferredResolution["FULL_REFUND"] = "FULL_REFUND";
    PreferredResolution["PARTIAL_REFUND"] = "PARTIAL_REFUND";
    PreferredResolution["ALTERNATIVE_PROPERTY"] = "ALTERNATIVE_PROPERTY";
    PreferredResolution["REPAIR_OR_FIX"] = "REPAIR_OR_FIX";
})(PreferredResolution || (exports.PreferredResolution = PreferredResolution = {}));
/**
 * Reminder type
 */
var ReminderType;
(function (ReminderType) {
    ReminderType["FIRST_REMINDER"] = "FIRST_REMINDER";
    ReminderType["SECOND_REMINDER"] = "SECOND_REMINDER";
    ReminderType["FINAL_REMINDER"] = "FINAL_REMINDER";
    ReminderType["URGENT_REMINDER"] = "URGENT_REMINDER";
})(ReminderType || (exports.ReminderType = ReminderType = {}));
/**
 * Notification channel
 */
var ConfirmationNotificationChannel;
(function (ConfirmationNotificationChannel) {
    ConfirmationNotificationChannel["EMAIL"] = "EMAIL";
    ConfirmationNotificationChannel["SMS"] = "SMS";
    ConfirmationNotificationChannel["PUSH"] = "PUSH";
    ConfirmationNotificationChannel["IN_APP"] = "IN_APP";
})(ConfirmationNotificationChannel || (exports.ConfirmationNotificationChannel = ConfirmationNotificationChannel = {}));
/**
 * Reminder status
 */
var ReminderStatus;
(function (ReminderStatus) {
    ReminderStatus["SCHEDULED"] = "SCHEDULED";
    ReminderStatus["SENT"] = "SENT";
    ReminderStatus["DELIVERED"] = "DELIVERED";
    ReminderStatus["FAILED"] = "FAILED";
    ReminderStatus["CANCELLED"] = "CANCELLED";
})(ReminderStatus || (exports.ReminderStatus = ReminderStatus = {}));
/**
 * Reminder action
 */
var ReminderAction;
(function (ReminderAction) {
    ReminderAction["CONFIRMED"] = "CONFIRMED";
    ReminderAction["DISPUTED"] = "DISPUTED";
    ReminderAction["IGNORED"] = "IGNORED";
})(ReminderAction || (exports.ReminderAction = ReminderAction = {}));
/**
 * Job status
 */
var ConfirmationJobStatus;
(function (ConfirmationJobStatus) {
    ConfirmationJobStatus["SCHEDULED"] = "SCHEDULED";
    ConfirmationJobStatus["RUNNING"] = "RUNNING";
    ConfirmationJobStatus["COMPLETED"] = "COMPLETED";
    ConfirmationJobStatus["FAILED"] = "FAILED";
    ConfirmationJobStatus["CANCELLED"] = "CANCELLED";
})(ConfirmationJobStatus || (exports.ConfirmationJobStatus = ConfirmationJobStatus = {}));
/**
 * Owner notification type
 */
var OwnerNotificationType;
(function (OwnerNotificationType) {
    OwnerNotificationType["PAYMENT_RECEIVED"] = "PAYMENT_RECEIVED";
    OwnerNotificationType["CONFIRMATION_PENDING"] = "CONFIRMATION_PENDING";
    OwnerNotificationType["PROPERTY_CONFIRMED"] = "PROPERTY_CONFIRMED";
    OwnerNotificationType["PROPERTY_DISPUTED"] = "PROPERTY_DISPUTED";
    OwnerNotificationType["PAYMENT_RELEASED"] = "PAYMENT_RELEASED";
})(OwnerNotificationType || (exports.OwnerNotificationType = OwnerNotificationType = {}));
/**
 * Error types for confirmation operations
 */
var ConfirmationErrorType;
(function (ConfirmationErrorType) {
    ConfirmationErrorType["CONFIRMATION_NOT_FOUND"] = "CONFIRMATION_NOT_FOUND";
    ConfirmationErrorType["INVALID_STATUS"] = "INVALID_STATUS";
    ConfirmationErrorType["DEADLINE_EXPIRED"] = "DEADLINE_EXPIRED";
    ConfirmationErrorType["UNAUTHORIZED"] = "UNAUTHORIZED";
    ConfirmationErrorType["ALREADY_CONFIRMED"] = "ALREADY_CONFIRMED";
    ConfirmationErrorType["ALREADY_DISPUTED"] = "ALREADY_DISPUTED";
    ConfirmationErrorType["INVALID_DISPUTE_REASON"] = "INVALID_DISPUTE_REASON";
    ConfirmationErrorType["PRE_PAYMENT_NOT_VERIFIED"] = "PRE_PAYMENT_NOT_VERIFIED";
})(ConfirmationErrorType || (exports.ConfirmationErrorType = ConfirmationErrorType = {}));
/**
 * Confirmation error
 */
class ConfirmationError extends Error {
    constructor(type, message, details) {
        super(message);
        this.type = type;
        this.details = details;
        this.name = 'ConfirmationError';
    }
}
exports.ConfirmationError = ConfirmationError;
/**
 * Dispute resolution actions available to Admin
 */
var DisputeResolutionAction;
(function (DisputeResolutionAction) {
    DisputeResolutionAction["APPROVE_REFUND"] = "APPROVE_REFUND";
    DisputeResolutionAction["DENY_REFUND"] = "DENY_REFUND";
    DisputeResolutionAction["ESCALATE"] = "ESCALATE";
    DisputeResolutionAction["CONFIRM_PROPERTY"] = "CONFIRM_PROPERTY";
})(DisputeResolutionAction || (exports.DisputeResolutionAction = DisputeResolutionAction = {}));
//# sourceMappingURL=confirmation.js.map