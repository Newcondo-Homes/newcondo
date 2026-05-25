/**
 * Enhanced Notification Utilities
 * Location: backend/shared/src/utils/notification.ts
 *
 * Comprehensive notification system for queue management, marking jobs, and real-time updates
 */
declare enum NotificationType {
    QUEUE_POSITION_UPDATE = "QUEUE_POSITION_UPDATE",
    QUEUE_JOINED = "QUEUE_JOINED",
    QUEUE_LEFT = "QUEUE_LEFT",
    QUEUE_REASSIGNED = "QUEUE_REASSIGNED",
    TIME_SLOT_ASSIGNED = "TIME_SLOT_ASSIGNED",
    TIME_SLOT_WARNING = "TIME_SLOT_WARNING",
    TIME_SLOT_EXPIRED = "TIME_SLOT_EXPIRED",
    TIME_SLOT_EXTENDED = "TIME_SLOT_EXTENDED",
    MARKING_JOB_CREATED = "MARKING_JOB_CREATED",
    MARKING_JOB_AVAILABLE = "MARKING_JOB_AVAILABLE",
    MARKING_JOB_ASSIGNED = "MARKING_JOB_ASSIGNED",
    MARKING_JOB_STARTED = "MARKING_JOB_STARTED",
    MARKING_JOB_COMPLETED = "MARKING_JOB_COMPLETED",
    MARKING_JOB_CANCELLED = "MARKING_JOB_CANCELLED",
    CONFIRMATION_REQUIRED = "CONFIRMATION_REQUIRED",
    CONFIRMATION_REMINDER = "CONFIRMATION_REMINDER",
    CONFIRMATION_DEADLINE_APPROACHING = "CONFIRMATION_DEADLINE_APPROACHING",
    CONFIRMATION_DEADLINE_PASSED = "CONFIRMATION_DEADLINE_PASSED",
    PAYMENT_RECEIVED = "PAYMENT_RECEIVED",
    PAYMENT_RELEASED = "PAYMENT_RELEASED",
    PARTIAL_PAYMENT_RELEASED = "PARTIAL_PAYMENT_RELEASED",
    AGENT_RATING_UPDATED = "AGENT_RATING_UPDATED",
    AGENT_MILESTONE_ACHIEVED = "AGENT_MILESTONE_ACHIEVED",
    SYSTEM_MAINTENANCE = "SYSTEM_MAINTENANCE",
    URGENT_ACTION_REQUIRED = "URGENT_ACTION_REQUIRED"
}
declare enum NotificationChannel {
    EMAIL = "EMAIL",
    SMS = "SMS",
    PUSH = "PUSH",
    IN_APP = "IN_APP",
    WEBHOOK = "WEBHOOK"
}
export declare enum NotificationPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    URGENT = "URGENT",
    CRITICAL = "CRITICAL"
}
export interface NotificationRecipient {
    userId: string;
    email?: string;
    phone?: string;
    pushTokens?: string[];
    preferences?: NotificationPreferences;
}
export interface NotificationPreferences {
    email: boolean;
    sms: boolean;
    push: boolean;
    inApp: boolean;
    channels?: {
        [key in NotificationType]?: NotificationChannel[];
    };
}
export interface NotificationPayload {
    type: NotificationType;
    priority: NotificationPriority;
    recipients: NotificationRecipient[];
    channels: NotificationChannel[];
    title: string;
    message: string;
    data?: Record<string, any>;
    actionUrl?: string;
    actionLabel?: string;
    imageUrl?: string;
    category?: string;
    sendAt?: Date;
    expiresAt?: Date;
    batchId?: string;
    correlationId?: string;
}
export interface QueueNotificationData {
    queuePosition: number;
    totalInQueue: number;
    estimatedWaitTime: number;
    markingJobId: string;
    propertyAddress: string;
    markingFee: number;
}
export interface TimeSlotNotificationData {
    expiresAt: Date;
    remainingMinutes: number;
    markingJobId: string;
    propertyAddress: string;
    contactPerson: string;
    contactPhone: string;
}
export interface ConfirmationNotificationData {
    confirmationDeadline: Date;
    remainingHours: number;
    markingJobId: string;
    propertyAddress: string;
    agentName: string;
    agentPhone: string;
    completionImages: string[];
}
/**
 * Notification Builder Class
 */
export declare class NotificationBuilder {
    private payload;
    withType(type: NotificationType): this;
    withPriority(priority: NotificationPriority): this;
    withRecipient(recipient: NotificationRecipient): this;
    withRecipients(recipients: NotificationRecipient[]): this;
    withChannel(channel: NotificationChannel): this;
    withChannels(channels: NotificationChannel[]): this;
    withTitle(title: string): this;
    withMessage(message: string): this;
    withData(data: Record<string, any>): this;
    withAction(url: string, label: string): this;
    withImage(imageUrl: string): this;
    scheduleFor(date: Date): this;
    expiresAt(date: Date): this;
    build(): NotificationPayload;
}
/**
 * Queue Notification Templates
 */
export declare class QueueNotificationTemplates {
    static queueJoined(data: QueueNotificationData): Partial<NotificationPayload>;
    static queuePositionUpdate(data: QueueNotificationData): Partial<NotificationPayload>;
    static jobAssigned(data: TimeSlotNotificationData): Partial<NotificationPayload>;
    static timeSlotWarning(data: TimeSlotNotificationData): Partial<NotificationPayload>;
    static timeSlotExpired(markingJobId: string, propertyAddress: string): Partial<NotificationPayload>;
    static jobAvailable(data: QueueNotificationData, agentProximityKm: number): Partial<NotificationPayload>;
}
/**
 * Confirmation Notification Templates
 */
export declare class ConfirmationNotificationTemplates {
    static confirmationRequired(data: ConfirmationNotificationData): Partial<NotificationPayload>;
    static confirmationReminder(data: ConfirmationNotificationData): Partial<NotificationPayload>;
    static confirmationDeadlineApproaching(data: ConfirmationNotificationData): Partial<NotificationPayload>;
    static confirmationDeadlinePassed(markingJobId: string, propertyAddress: string, partialPayment: number): Partial<NotificationPayload>;
}
/**
 * Payment Notification Templates
 */
export declare class PaymentNotificationTemplates {
    static paymentReceived(userId: string, amount: number, markingJobId: string, type: 'full' | 'partial'): Partial<NotificationPayload>;
    static paymentReleased(amount: number, markingJobId: string, propertyAddress: string): Partial<NotificationPayload>;
}
/**
 * Helper Functions
 */
export declare function determineChannelsForNotification(type: NotificationType, priority: NotificationPriority, userPreferences?: NotificationPreferences): NotificationChannel[];
export declare function shouldSendNotification(type: NotificationType, userPreferences?: NotificationPreferences): boolean;
/**
 * Batch Notification Helper
 */
export declare function createBatchNotification(recipients: NotificationRecipient[], template: Partial<NotificationPayload>): NotificationPayload[];
export declare const notification: () => NotificationBuilder;
export {};
//# sourceMappingURL=notification.d.ts.map