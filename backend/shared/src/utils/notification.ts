/**
 * Enhanced Notification Utilities
 * Location: backend/shared/src/utils/notification.ts
 * 
 * Comprehensive notification system for queue management, marking jobs, and real-time updates
 */

export enum NotificationType {
  // Queue System
  QUEUE_POSITION_UPDATE = 'QUEUE_POSITION_UPDATE',
  QUEUE_JOINED = 'QUEUE_JOINED',
  QUEUE_LEFT = 'QUEUE_LEFT',
  QUEUE_REASSIGNED = 'QUEUE_REASSIGNED',
  
  // Time Slot Management
  TIME_SLOT_ASSIGNED = 'TIME_SLOT_ASSIGNED',
  TIME_SLOT_WARNING = 'TIME_SLOT_WARNING',
  TIME_SLOT_EXPIRED = 'TIME_SLOT_EXPIRED',
  TIME_SLOT_EXTENDED = 'TIME_SLOT_EXTENDED',
  
  // Marking Job Updates
  MARKING_JOB_CREATED = 'MARKING_JOB_CREATED',
  MARKING_JOB_AVAILABLE = 'MARKING_JOB_AVAILABLE',
  MARKING_JOB_ASSIGNED = 'MARKING_JOB_ASSIGNED',
  MARKING_JOB_STARTED = 'MARKING_JOB_STARTED',
  MARKING_JOB_COMPLETED = 'MARKING_JOB_COMPLETED',
  MARKING_JOB_CANCELLED = 'MARKING_JOB_CANCELLED',
  
  // Confirmation System
  CONFIRMATION_REQUIRED = 'CONFIRMATION_REQUIRED',
  CONFIRMATION_REMINDER = 'CONFIRMATION_REMINDER',
  CONFIRMATION_DEADLINE_APPROACHING = 'CONFIRMATION_DEADLINE_APPROACHING',
  CONFIRMATION_DEADLINE_PASSED = 'CONFIRMATION_DEADLINE_PASSED',
  
  // Payment Events
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_RELEASED = 'PAYMENT_RELEASED',
  PARTIAL_PAYMENT_RELEASED = 'PARTIAL_PAYMENT_RELEASED',
  
  // Agent Performance
  AGENT_RATING_UPDATED = 'AGENT_RATING_UPDATED',
  AGENT_MILESTONE_ACHIEVED = 'AGENT_MILESTONE_ACHIEVED',
  
  // System Alerts
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
  URGENT_ACTION_REQUIRED = 'URGENT_ACTION_REQUIRED',
}

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
  WEBHOOK = 'WEBHOOK',
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
  CRITICAL = 'CRITICAL',
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
  
  // Content
  title: string;
  message: string;
  data?: Record<string, any>;
  
  // Metadata
  actionUrl?: string;
  actionLabel?: string;
  imageUrl?: string;
  category?: string;
  
  // Scheduling
  sendAt?: Date;
  expiresAt?: Date;
  
  // Tracking
  batchId?: string;
  correlationId?: string;
}

export interface QueueNotificationData {
  queuePosition: number;
  totalInQueue: number;
  estimatedWaitTime: number; // minutes
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
export class NotificationBuilder {
  private payload: Partial<NotificationPayload> = {
    channels: [],
    recipients: [],
    priority: NotificationPriority.MEDIUM,
  };

  withType(type: NotificationType): this {
    this.payload.type = type;
    return this;
  }

  withPriority(priority: NotificationPriority): this {
    this.payload.priority = priority;
    return this;
  }

  withRecipient(recipient: NotificationRecipient): this {
    this.payload.recipients = [...(this.payload.recipients || []), recipient];
    return this;
  }

  withRecipients(recipients: NotificationRecipient[]): this {
    this.payload.recipients = recipients;
    return this;
  }

  withChannel(channel: NotificationChannel): this {
    this.payload.channels = [...(this.payload.channels || []), channel];
    return this;
  }

  withChannels(channels: NotificationChannel[]): this {
    this.payload.channels = channels;
    return this;
  }

  withTitle(title: string): this {
    this.payload.title = title;
    return this;
  }

  withMessage(message: string): this {
    this.payload.message = message;
    return this;
  }

  withData(data: Record<string, any>): this {
    this.payload.data = data;
    return this;
  }

  withAction(url: string, label: string): this {
    this.payload.actionUrl = url;
    this.payload.actionLabel = label;
    return this;
  }

  withImage(imageUrl: string): this {
    this.payload.imageUrl = imageUrl;
    return this;
  }

  scheduleFor(date: Date): this {
    this.payload.sendAt = date;
    return this;
  }

  expiresAt(date: Date): this {
    this.payload.expiresAt = date;
    return this;
  }

  build(): NotificationPayload {
    if (!this.payload.type) {
      throw new Error('Notification type is required');
    }
    if (!this.payload.title || !this.payload.message) {
      throw new Error('Title and message are required');
    }
    if (!this.payload.recipients || this.payload.recipients.length === 0) {
      throw new Error('At least one recipient is required');
    }

    return this.payload as NotificationPayload;
  }
}

/**
 * Queue Notification Templates
 */
export class QueueNotificationTemplates {
  static queueJoined(data: QueueNotificationData): Partial<NotificationPayload> {
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

  static queuePositionUpdate(data: QueueNotificationData): Partial<NotificationPayload> {
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

  static jobAssigned(data: TimeSlotNotificationData): Partial<NotificationPayload> {
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

  static timeSlotWarning(data: TimeSlotNotificationData): Partial<NotificationPayload> {
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

  static timeSlotExpired(markingJobId: string, propertyAddress: string): Partial<NotificationPayload> {
    return {
      type: NotificationType.TIME_SLOT_EXPIRED,
      priority: NotificationPriority.HIGH,
      title: 'Time Slot Expired ⏰',
      message: `Your time slot for ${propertyAddress} has expired. The job has been reassigned.`,
      data: { markingJobId },
    };
  }

  static jobAvailable(data: QueueNotificationData, agentProximityKm: number): Partial<NotificationPayload> {
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

/**
 * Confirmation Notification Templates
 */
export class ConfirmationNotificationTemplates {
  static confirmationRequired(data: ConfirmationNotificationData): Partial<NotificationPayload> {
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

  static confirmationReminder(data: ConfirmationNotificationData): Partial<NotificationPayload> {
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

  static confirmationDeadlineApproaching(data: ConfirmationNotificationData): Partial<NotificationPayload> {
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

  static confirmationDeadlinePassed(
    markingJobId: string,
    propertyAddress: string,
    partialPayment: number
  ): Partial<NotificationPayload> {
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

/**
 * Payment Notification Templates
 */
export class PaymentNotificationTemplates {
  static paymentReceived(
    userId: string,
    amount: number,
    markingJobId: string,
    type: 'full' | 'partial'
  ): Partial<NotificationPayload> {
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

  static paymentReleased(
    amount: number,
    markingJobId: string,
    propertyAddress: string
  ): Partial<NotificationPayload> {
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

/**
 * Helper Functions
 */
export function determineChannelsForNotification(
  type: NotificationType,
  priority: NotificationPriority,
  userPreferences?: NotificationPreferences
): NotificationChannel[] {
  // Default channels based on priority
  const defaultChannels: NotificationChannel[] = [];

  switch (priority) {
    case NotificationPriority.CRITICAL:
    case NotificationPriority.URGENT:
      defaultChannels.push(
        NotificationChannel.PUSH,
        NotificationChannel.SMS,
        NotificationChannel.EMAIL,
        NotificationChannel.IN_APP
      );
      break;
    case NotificationPriority.HIGH:
      defaultChannels.push(
        NotificationChannel.PUSH,
        NotificationChannel.EMAIL,
        NotificationChannel.IN_APP
      );
      break;
    case NotificationPriority.MEDIUM:
      defaultChannels.push(
        NotificationChannel.PUSH,
        NotificationChannel.IN_APP
      );
      break;
    case NotificationPriority.LOW:
      defaultChannels.push(NotificationChannel.IN_APP);
      break;
  }

  // Override with user preferences if available
  if (userPreferences?.channels?.[type]) {
    return userPreferences.channels[type]!;
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

export function shouldSendNotification(
  type: NotificationType,
  userPreferences?: NotificationPreferences
): boolean {
  if (!userPreferences) return true;

  // Check if user has explicitly disabled this notification type
  const channels = userPreferences.channels?.[type];
  if (channels && channels.length === 0) return false;

  return true;
}

/**
 * Batch Notification Helper
 */
export function createBatchNotification(
  recipients: NotificationRecipient[],
  template: Partial<NotificationPayload>
): NotificationPayload[] {
  const batchId = `batch_${Date.now()}`;
  
  return recipients.map(recipient => ({
    ...template,
    recipients: [recipient],
    channels: determineChannelsForNotification(
      template.type!,
      template.priority!,
      recipient.preferences
    ),
    batchId,
  } as NotificationPayload));
}

// Export singleton builder
export const notification = () => new NotificationBuilder();