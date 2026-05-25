"use strict";
/**
 * Enhanced Notification Utilities
 * Location: backend/shared/src/utils/notification.ts
 *
 * Comprehensive notification system for queue management, marking jobs, and real-time updates
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.notification = exports.PaymentNotificationTemplates = exports.ConfirmationNotificationTemplates = exports.QueueNotificationTemplates = exports.NotificationBuilder = exports.NotificationPriority = void 0;
exports.determineChannelsForNotification = determineChannelsForNotification;
exports.shouldSendNotification = shouldSendNotification;
exports.createBatchNotification = createBatchNotification;
var NotificationType;
(function (NotificationType) {
    // Queue System
    NotificationType["QUEUE_POSITION_UPDATE"] = "QUEUE_POSITION_UPDATE";
    NotificationType["QUEUE_JOINED"] = "QUEUE_JOINED";
    NotificationType["QUEUE_LEFT"] = "QUEUE_LEFT";
    NotificationType["QUEUE_REASSIGNED"] = "QUEUE_REASSIGNED";
    // Time Slot Management
    NotificationType["TIME_SLOT_ASSIGNED"] = "TIME_SLOT_ASSIGNED";
    NotificationType["TIME_SLOT_WARNING"] = "TIME_SLOT_WARNING";
    NotificationType["TIME_SLOT_EXPIRED"] = "TIME_SLOT_EXPIRED";
    NotificationType["TIME_SLOT_EXTENDED"] = "TIME_SLOT_EXTENDED";
    // Marking Job Updates
    NotificationType["MARKING_JOB_CREATED"] = "MARKING_JOB_CREATED";
    NotificationType["MARKING_JOB_AVAILABLE"] = "MARKING_JOB_AVAILABLE";
    NotificationType["MARKING_JOB_ASSIGNED"] = "MARKING_JOB_ASSIGNED";
    NotificationType["MARKING_JOB_STARTED"] = "MARKING_JOB_STARTED";
    NotificationType["MARKING_JOB_COMPLETED"] = "MARKING_JOB_COMPLETED";
    NotificationType["MARKING_JOB_CANCELLED"] = "MARKING_JOB_CANCELLED";
    // Confirmation System
    NotificationType["CONFIRMATION_REQUIRED"] = "CONFIRMATION_REQUIRED";
    NotificationType["CONFIRMATION_REMINDER"] = "CONFIRMATION_REMINDER";
    NotificationType["CONFIRMATION_DEADLINE_APPROACHING"] = "CONFIRMATION_DEADLINE_APPROACHING";
    NotificationType["CONFIRMATION_DEADLINE_PASSED"] = "CONFIRMATION_DEADLINE_PASSED";
    // Payment Events
    NotificationType["PAYMENT_RECEIVED"] = "PAYMENT_RECEIVED";
    NotificationType["PAYMENT_RELEASED"] = "PAYMENT_RELEASED";
    NotificationType["PARTIAL_PAYMENT_RELEASED"] = "PARTIAL_PAYMENT_RELEASED";
    // Agent Performance
    NotificationType["AGENT_RATING_UPDATED"] = "AGENT_RATING_UPDATED";
    NotificationType["AGENT_MILESTONE_ACHIEVED"] = "AGENT_MILESTONE_ACHIEVED";
    // System Alerts
    NotificationType["SYSTEM_MAINTENANCE"] = "SYSTEM_MAINTENANCE";
    NotificationType["URGENT_ACTION_REQUIRED"] = "URGENT_ACTION_REQUIRED";
})(NotificationType || (NotificationType = {}));
var NotificationChannel;
(function (NotificationChannel) {
    NotificationChannel["EMAIL"] = "EMAIL";
    NotificationChannel["SMS"] = "SMS";
    NotificationChannel["PUSH"] = "PUSH";
    NotificationChannel["IN_APP"] = "IN_APP";
    NotificationChannel["WEBHOOK"] = "WEBHOOK";
})(NotificationChannel || (NotificationChannel = {}));
var NotificationPriority;
(function (NotificationPriority) {
    NotificationPriority["LOW"] = "LOW";
    NotificationPriority["MEDIUM"] = "MEDIUM";
    NotificationPriority["HIGH"] = "HIGH";
    NotificationPriority["URGENT"] = "URGENT";
    NotificationPriority["CRITICAL"] = "CRITICAL";
})(NotificationPriority || (exports.NotificationPriority = NotificationPriority = {}));
/**
 * Notification Builder Class
 */
class NotificationBuilder {
    constructor() {
        this.payload = {
            channels: [],
            recipients: [],
            priority: NotificationPriority.MEDIUM,
        };
    }
    withType(type) {
        this.payload.type = type;
        return this;
    }
    withPriority(priority) {
        this.payload.priority = priority;
        return this;
    }
    withRecipient(recipient) {
        this.payload.recipients = [...(this.payload.recipients || []), recipient];
        return this;
    }
    withRecipients(recipients) {
        this.payload.recipients = recipients;
        return this;
    }
    withChannel(channel) {
        this.payload.channels = [...(this.payload.channels || []), channel];
        return this;
    }
    withChannels(channels) {
        this.payload.channels = channels;
        return this;
    }
    withTitle(title) {
        this.payload.title = title;
        return this;
    }
    withMessage(message) {
        this.payload.message = message;
        return this;
    }
    withData(data) {
        this.payload.data = data;
        return this;
    }
    withAction(url, label) {
        this.payload.actionUrl = url;
        this.payload.actionLabel = label;
        return this;
    }
    withImage(imageUrl) {
        this.payload.imageUrl = imageUrl;
        return this;
    }
    scheduleFor(date) {
        this.payload.sendAt = date;
        return this;
    }
    expiresAt(date) {
        this.payload.expiresAt = date;
        return this;
    }
    build() {
        if (!this.payload.type) {
            throw new Error('Notification type is required');
        }
        if (!this.payload.title || !this.payload.message) {
            throw new Error('Title and message are required');
        }
        if (!this.payload.recipients || this.payload.recipients.length === 0) {
            throw new Error('At least one recipient is required');
        }
        return this.payload;
    }
}
exports.NotificationBuilder = NotificationBuilder;
/**
 * Queue Notification Templates
 */
class QueueNotificationTemplates {
    static queueJoined(data) {
        return {
            type: NotificationType.QUEUE_JOINED,
            priority: NotificationPriority.MEDIUM,
            title: 'You\'re in the Queue! 🎯',
            message: `You're #${data.queuePosition} in line for marking ${data.propertyAddress}. Estimated wait: ${data.estimatedWaitTime} minutes.`,
            data: {
                queuePosition: data.queuePosition,
                totalInQueue: data.totalInQueue,
                markingJobId: data.markingJobId,
            },
        };
    }
    static queuePositionUpdate(data) {
        return {
            type: NotificationType.QUEUE_POSITION_UPDATE,
            priority: NotificationPriority.MEDIUM,
            title: 'Queue Update 📊',
            message: `You've moved to position #${data.queuePosition}. You're getting closer!`,
            data: {
                queuePosition: data.queuePosition,
                totalInQueue: data.totalInQueue,
                markingJobId: data.markingJobId,
            },
        };
    }
    static jobAssigned(data) {
        return {
            type: NotificationType.MARKING_JOB_ASSIGNED,
            priority: NotificationPriority.HIGH,
            title: 'Job Assigned! 🎉',
            message: `You have 3 hours to mark ${data.propertyAddress}. Contact: ${data.contactPerson} (${data.contactPhone})`,
            data: {
                markingJobId: data.markingJobId,
                expiresAt: data.expiresAt,
                contactPerson: data.contactPerson,
                contactPhone: data.contactPhone,
            },
            actionUrl: `/marking-jobs/${data.markingJobId}`,
            actionLabel: 'View Details',
        };
    }
    static timeSlotWarning(data) {
        const urgency = data.remainingMinutes <= 15 ? '⚠️ URGENT' : '⏰';
        return {
            type: NotificationType.TIME_SLOT_WARNING,
            priority: data.remainingMinutes <= 15 ? NotificationPriority.CRITICAL : NotificationPriority.HIGH,
            title: `${urgency} Time Running Out!`,
            message: `Only ${data.remainingMinutes} minutes left to complete marking job at ${data.propertyAddress}`,
            data: {
                markingJobId: data.markingJobId,
                remainingMinutes: data.remainingMinutes,
                expiresAt: data.expiresAt,
            },
            actionUrl: `/marking-jobs/${data.markingJobId}`,
            actionLabel: 'Complete Now',
        };
    }
    static timeSlotExpired(markingJobId, propertyAddress) {
        return {
            type: NotificationType.TIME_SLOT_EXPIRED,
            priority: NotificationPriority.HIGH,
            title: 'Time Slot Expired ⏰',
            message: `Your time slot for ${propertyAddress} has expired. The job has been reassigned.`,
            data: { markingJobId },
        };
    }
    static jobAvailable(data, agentProximityKm) {
        return {
            type: NotificationType.MARKING_JOB_AVAILABLE,
            priority: NotificationPriority.HIGH,
            title: 'New Marking Job Available! 💼',
            message: `Property at ${data.propertyAddress} (${agentProximityKm.toFixed(1)}km away). Fee: ₦${data.markingFee.toLocaleString()}`,
            data: {
                markingJobId: data.markingJobId,
                propertyAddress: data.propertyAddress,
                markingFee: data.markingFee,
                proximityKm: agentProximityKm,
            },
            actionUrl: `/marking-jobs/${data.markingJobId}/accept`,
            actionLabel: 'Accept Job',
        };
    }
}
exports.QueueNotificationTemplates = QueueNotificationTemplates;
/**
 * Confirmation Notification Templates
 */
class ConfirmationNotificationTemplates {
    static confirmationRequired(data) {
        return {
            type: NotificationType.CONFIRMATION_REQUIRED,
            priority: NotificationPriority.HIGH,
            title: 'Property Marking Completed! ✅',
            message: `Agent ${data.agentName} has marked ${data.propertyAddress}. Please confirm within ${data.remainingHours} hours.`,
            data: {
                markingJobId: data.markingJobId,
                confirmationDeadline: data.confirmationDeadline,
                agentName: data.agentName,
                agentPhone: data.agentPhone,
                completionImages: data.completionImages,
            },
            actionUrl: `/marking-jobs/${data.markingJobId}/confirm`,
            actionLabel: 'Review & Confirm',
        };
    }
    static confirmationReminder(data) {
        return {
            type: NotificationType.CONFIRMATION_REMINDER,
            priority: NotificationPriority.HIGH,
            title: 'Reminder: Confirm Property Marking 🔔',
            message: `You have ${data.remainingHours} hours left to confirm marking for ${data.propertyAddress}`,
            data: {
                markingJobId: data.markingJobId,
                remainingHours: data.remainingHours,
                confirmationDeadline: data.confirmationDeadline,
            },
            actionUrl: `/marking-jobs/${data.markingJobId}/confirm`,
            actionLabel: 'Confirm Now',
        };
    }
    static confirmationDeadlineApproaching(data) {
        return {
            type: NotificationType.CONFIRMATION_DEADLINE_APPROACHING,
            priority: NotificationPriority.CRITICAL,
            title: '⚠️ URGENT: Confirm Property Marking',
            message: `Only ${data.remainingHours} hours to confirm! Partial payment will be released to agent if you don't respond.`,
            data: {
                markingJobId: data.markingJobId,
                remainingHours: data.remainingHours,
            },
            actionUrl: `/marking-jobs/${data.markingJobId}/confirm`,
            actionLabel: 'Confirm Now',
        };
    }
    static confirmationDeadlinePassed(markingJobId, propertyAddress, partialPayment) {
        return {
            type: NotificationType.CONFIRMATION_DEADLINE_PASSED,
            priority: NotificationPriority.HIGH,
            title: 'Confirmation Deadline Passed',
            message: `Partial payment of ₦${partialPayment.toLocaleString()} released to agent for ${propertyAddress}. Property requires new marking job.`,
            data: {
                markingJobId,
                partialPayment,
            },
        };
    }
}
exports.ConfirmationNotificationTemplates = ConfirmationNotificationTemplates;
/**
 * Payment Notification Templates
 */
class PaymentNotificationTemplates {
    static paymentReceived(userId, amount, markingJobId, type) {
        return {
            type: NotificationType.PAYMENT_RECEIVED,
            priority: NotificationPriority.MEDIUM,
            title: type === 'full' ? 'Payment Received! 💰' : 'Partial Payment Received',
            message: `₦${amount.toLocaleString()} has been credited to your account${type === 'partial' ? ' (held pending confirmation)' : ''}`,
            data: {
                amount,
                markingJobId,
                type,
            },
        };
    }
    static paymentReleased(amount, markingJobId, propertyAddress) {
        return {
            type: NotificationType.PAYMENT_RELEASED,
            priority: NotificationPriority.HIGH,
            title: 'Payment Released! 🎉',
            message: `₦${amount.toLocaleString()} released for completing ${propertyAddress}. Funds now available for withdrawal.`,
            data: {
                amount,
                markingJobId,
            },
            actionUrl: '/wallet',
            actionLabel: 'View Wallet',
        };
    }
}
exports.PaymentNotificationTemplates = PaymentNotificationTemplates;
/**
 * Helper Functions
 */
function determineChannelsForNotification(type, priority, userPreferences) {
    // Default channels based on priority
    const defaultChannels = [];
    switch (priority) {
        case NotificationPriority.CRITICAL:
        case NotificationPriority.URGENT:
            defaultChannels.push(NotificationChannel.PUSH, NotificationChannel.SMS, NotificationChannel.EMAIL, NotificationChannel.IN_APP);
            break;
        case NotificationPriority.HIGH:
            defaultChannels.push(NotificationChannel.PUSH, NotificationChannel.EMAIL, NotificationChannel.IN_APP);
            break;
        case NotificationPriority.MEDIUM:
            defaultChannels.push(NotificationChannel.PUSH, NotificationChannel.IN_APP);
            break;
        case NotificationPriority.LOW:
            defaultChannels.push(NotificationChannel.IN_APP);
            break;
    }
    // Override with user preferences if available
    if (userPreferences?.channels?.[type]) {
        return userPreferences.channels[type];
    }
    // Filter based on general preferences
    if (userPreferences) {
        return defaultChannels.filter(channel => {
            switch (channel) {
                case NotificationChannel.EMAIL:
                    return userPreferences.email !== false;
                case NotificationChannel.SMS:
                    return userPreferences.sms !== false;
                case NotificationChannel.PUSH:
                    return userPreferences.push !== false;
                case NotificationChannel.IN_APP:
                    return userPreferences.inApp !== false;
                default:
                    return true;
            }
        });
    }
    return defaultChannels;
}
function shouldSendNotification(type, userPreferences) {
    if (!userPreferences)
        return true;
    // Check if user has explicitly disabled this notification type
    const channels = userPreferences.channels?.[type];
    if (channels && channels.length === 0)
        return false;
    return true;
}
/**
 * Batch Notification Helper
 */
function createBatchNotification(recipients, template) {
    const batchId = `batch_${Date.now()}`;
    return recipients.map(recipient => ({
        ...template,
        recipients: [recipient],
        channels: determineChannelsForNotification(template.type, template.priority, recipient.preferences),
        batchId,
    }));
}
// Export singleton builder
const notification = () => new NotificationBuilder();
exports.notification = notification;
//# sourceMappingURL=notification.js.map