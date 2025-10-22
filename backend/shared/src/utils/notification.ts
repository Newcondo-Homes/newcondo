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












// /**
//  * Notification Helper Functions
//  * Handles notification formatting and delivery coordination
//  */

// export interface NotificationPayload {
//   recipient: {
//     id: string;
//     email?: string;
//     phone?: string;
//     name?: string;
//   };
//   type: NotificationType;
//   channel: NotificationChannel[];
//   data: Record<string, any>;
//   priority?: NotificationPriority;
//   scheduledFor?: Date;
// }

// export enum NotificationType {
//   // Marking Job Notifications
//   MARKING_JOB_CREATED = 'MARKING_JOB_CREATED',
//   MARKING_JOB_ASSIGNED = 'MARKING_JOB_ASSIGNED',
//   MARKING_JOB_AVAILABLE = 'MARKING_JOB_AVAILABLE',
//   MARKING_JOB_COMPLETED = 'MARKING_JOB_COMPLETED',
//   MARKING_JOB_CONFIRMED = 'MARKING_JOB_CONFIRMED',
//   MARKING_JOB_EXPIRED = 'MARKING_JOB_EXPIRED',
//   MARKING_JOB_CANCELLED = 'MARKING_JOB_CANCELLED',
//   MARKING_TIME_SLOT_EXPIRING = 'MARKING_TIME_SLOT_EXPIRING',
//   MARKING_CONFIRMATION_REMINDER = 'MARKING_CONFIRMATION_REMINDER',
//   MARKING_PARTIAL_PAYMENT = 'MARKING_PARTIAL_PAYMENT',
//   MARKING_FULL_PAYMENT = 'MARKING_FULL_PAYMENT',

//   // Queue Notifications
//   QUEUE_POSITION_UPDATED = 'QUEUE_POSITION_UPDATED',
//   QUEUE_YOUR_TURN = 'QUEUE_YOUR_TURN',
//   QUEUE_REMOVED = 'QUEUE_REMOVED',

//   // Payment Notifications
//   PAYMENT_INITIATED = 'PAYMENT_INITIATED',
//   PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
//   PAYMENT_FAILED = 'PAYMENT_FAILED',

//   // Property Notifications
//   PROPERTY_APPROVED = 'PROPERTY_APPROVED',
//   PROPERTY_REJECTED = 'PROPERTY_REJECTED',

//   // Verification Notifications
//   VERIFICATION_APPROVED = 'VERIFICATION_APPROVED',
//   VERIFICATION_REJECTED = 'VERIFICATION_REJECTED',
// }

// export enum NotificationChannel {
//   EMAIL = 'EMAIL',
//   SMS = 'SMS',
//   PUSH = 'PUSH',
//   IN_APP = 'IN_APP',
// }

// export enum NotificationPriority {
//   LOW = 'LOW',
//   NORMAL = 'NORMAL',
//   HIGH = 'HIGH',
//   URGENT = 'URGENT',
// }

// /**
//  * Create a notification payload for marking job created
//  */
// export const createMarkingJobCreatedNotification = (
//   recipient: NotificationPayload['recipient'],
//   jobData: {
//     propertyAddress: string;
//     markingFee: number;
//     estimatedCompletion: string;
//   }
// ): NotificationPayload => {
//   return {
//     recipient,
//     type: NotificationType.MARKING_JOB_CREATED,
//     channel: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
//     priority: NotificationPriority.NORMAL,
//     data: {
//       propertyAddress: jobData.propertyAddress,
//       markingFee: jobData.markingFee,
//       estimatedCompletion: jobData.estimatedCompletion,
//     },
//   };
// };

// /**
//  * Create a notification payload for marking job assigned
//  */
// export const createMarkingJobAssignedNotification = (
//   recipient: NotificationPayload['recipient'],
//   jobData: {
//     propertyAddress: string;
//     timeSlotExpiry: string;
//     contactPerson: string;
//     contactPhone: string;
//     commission: number;
//   }
// ): NotificationPayload => {
//   return {
//     recipient,
//     type: NotificationType.MARKING_JOB_ASSIGNED,
//     channel: [NotificationChannel.EMAIL, NotificationChannel.SMS, NotificationChannel.PUSH],
//     priority: NotificationPriority.HIGH,
//     data: jobData,
//   };
// };

// /**
//  * Create a notification payload for marking job available to agents
//  */
// export const createMarkingJobAvailableNotification = (
//   recipient: NotificationPayload['recipient'],
//   jobData: {
//     propertyAddress: string;
//     city: string;
//     state: string;
//     commission: number;
//     distance?: string;
//   }
// ): NotificationPayload => {
//   return {
//     recipient,
//     type: NotificationType.MARKING_JOB_AVAILABLE,
//     channel: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
//     priority: NotificationPriority.NORMAL,
//     data: jobData,
//   };
// };

// /**
//  * Create a notification payload for marking job completed
//  */
// export const createMarkingJobCompletedNotification = (
//   recipient: NotificationPayload['recipient'],
//   jobData: {
//     propertyAddress: string;
//     agentName: string;
//     confirmationDeadline: string;
//     partialPayment: number;
//   }
// ): NotificationPayload => {
//   return {
//     recipient,
//     type: NotificationType.MARKING_JOB_COMPLETED,
//     channel: [NotificationChannel.EMAIL, NotificationChannel.SMS, NotificationChannel.IN_APP],
//     priority: NotificationPriority.HIGH,
//     data: jobData,
//   };
// };

// /**
//  * Create a notification payload for marking job confirmed
//  */
// export const createMarkingJobConfirmedNotification = (
//   recipient: NotificationPayload['recipient'],
//   jobData: {
//     propertyAddress: string;
//     totalPayment: number;
//     remainingPayment: number;
//   }
// ): NotificationPayload => {
//   return {
//     recipient,
//     type: NotificationType.MARKING_JOB_CONFIRMED,
//     channel: [NotificationChannel.EMAIL, NotificationChannel.SMS, NotificationChannel.IN_APP],
//     priority: NotificationPriority.NORMAL,
//     data: jobData,
//   };
// };

// /**
//  * Create a notification payload for time slot expiring
//  */
// export const createTimeSlotExpiringNotification = (
//   recipient: NotificationPayload['recipient'],
//   jobData: {
//     propertyAddress: string;
//     timeRemaining: string;
//   }
// ): NotificationPayload => {
//   return {
//     recipient,
//     type: NotificationType.MARKING_TIME_SLOT_EXPIRING,
//     channel: [NotificationChannel.SMS, NotificationChannel.PUSH],
//     priority: NotificationPriority.URGENT,
//     data: jobData,
//   };
// };

// /**
//  * Create a notification payload for confirmation reminder
//  */
// export const createConfirmationReminderNotification = (
//   recipient: NotificationPayload['recipient'],
//   jobData: {
//     propertyAddress: string;
//     hoursRemaining: number;
//   }
// ): NotificationPayload => {
//   return {
//     recipient,
//     type: NotificationType.MARKING_CONFIRMATION_REMINDER,
//     channel: [NotificationChannel.EMAIL, NotificationChannel.SMS],
//     priority: NotificationPriority.HIGH,
//     data: jobData,
//   };
// };

// /**
//  * Create a notification payload for partial payment
//  */
// export const createPartialPaymentNotification = (
//   recipient: NotificationPayload['recipient'],
//   jobData: {
//     propertyAddress: string;
//     amount: number;
//     reason: string;
//   }
// ): NotificationPayload => {
//   return {
//     recipient,
//     type: NotificationType.MARKING_PARTIAL_PAYMENT,
//     channel: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
//     priority: NotificationPriority.NORMAL,
//     data: jobData,
//   };
// };

// /**
//  * Create a notification payload for full payment
//  */
// export const createFullPaymentNotification = (
//   recipient: NotificationPayload['recipient'],
//   jobData: {
//     propertyAddress: string;
//     amount: number;
//   }
// ): NotificationPayload => {
//   return {
//     recipient,
//     type: NotificationType.MARKING_FULL_PAYMENT,
//     channel: [NotificationChannel.EMAIL, NotificationChannel.SMS, NotificationChannel.IN_APP],
//     priority: NotificationPriority.NORMAL,
//     data: jobData,
//   };
// };

// /**
//  * Create a notification payload for queue position update
//  */
// export const createQueuePositionNotification = (
//   recipient: NotificationPayload['recipient'],
//   queueData: {
//     propertyAddress: string;
//     position: number;
//     estimatedWait: string;
//   }
// ): NotificationPayload => {
//   return {
//     recipient,
//     type: NotificationType.QUEUE_POSITION_UPDATED,
//     channel: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
//     priority: NotificationPriority.NORMAL,
//     data: queueData,
//   };
// };

// /**
//  * Create a notification payload for queue your turn
//  */
// export const createQueueYourTurnNotification = (
//   recipient: NotificationPayload['recipient'],
//   queueData: {
//     propertyAddress: string;
//     timeSlotExpiry: string;
//     contactPerson: string;
//     contactPhone: string;
//   }
// ): NotificationPayload => {
//   return {
//     recipient,
//     type: NotificationType.QUEUE_YOUR_TURN,
//     channel: [NotificationChannel.EMAIL, NotificationChannel.SMS, NotificationChannel.PUSH],
//     priority: NotificationPriority.URGENT,
//     data: queueData,
//   };
// };

// /**
//  * Format currency for display in notifications
//  */
// export const formatCurrency = (amount: number, currency: string = 'NGN'): string => {
//   return new Intl.NumberFormat('en-NG', {
//     style: 'currency',
//     currency: currency,
//   }).format(amount);
// };

// /**
//  * Format date for display in notifications
//  */
// export const formatDate = (date: Date | string): string => {
//   const dateObj = typeof date === 'string' ? new Date(date) : date;
//   return new Intl.DateTimeFormat('en-NG', {
//     year: 'numeric',
//     month: 'long',
//     day: 'numeric',
//     hour: '2-digit',
//     minute: '2-digit',
//   }).format(dateObj);
// };

// /**
//  * Get notification subject based on type
//  */
// export const getNotificationSubject = (type: NotificationType): string => {
//   const subjects: Record<NotificationType, string> = {
//     [NotificationType.MARKING_JOB_CREATED]: 'Your Property Marking Job Has Been Created',
//     [NotificationType.MARKING_JOB_ASSIGNED]: 'New Property Marking Job Assigned to You',
//     [NotificationType.MARKING_JOB_AVAILABLE]: 'New Property Marking Job Available',
//     [NotificationType.MARKING_JOB_COMPLETED]: 'Property Marking Completed - Confirmation Required',
//     [NotificationType.MARKING_JOB_CONFIRMED]: 'Property Marking Confirmed - Payment Released',
//     [NotificationType.MARKING_JOB_EXPIRED]: 'Property Marking Job Expired',
//     [NotificationType.MARKING_JOB_CANCELLED]: 'Property Marking Job Cancelled',
//     [NotificationType.MARKING_TIME_SLOT_EXPIRING]: 'Urgent: Your Marking Time Slot is Expiring',
//     [NotificationType.MARKING_CONFIRMATION_REMINDER]: 'Reminder: Confirm Your Property Marking',
//     [NotificationType.MARKING_PARTIAL_PAYMENT]: 'Partial Payment Received',
//     [NotificationType.MARKING_FULL_PAYMENT]: 'Full Payment Received',
//     [NotificationType.QUEUE_POSITION_UPDATED]: 'Your Queue Position Updated',
//     [NotificationType.QUEUE_YOUR_TURN]: "It's Your Turn - Property Marking Job Available",
//     [NotificationType.QUEUE_REMOVED]: 'Removed from Marking Queue',
//     [NotificationType.PAYMENT_INITIATED]: 'Payment Initiated',
//     [NotificationType.PAYMENT_SUCCESS]: 'Payment Successful',
//     [NotificationType.PAYMENT_FAILED]: 'Payment Failed',
//     [NotificationType.PROPERTY_APPROVED]: 'Your Property Has Been Approved',
//     [NotificationType.PROPERTY_REJECTED]: 'Property Listing Rejected',
//     [NotificationType.VERIFICATION_APPROVED]: 'Account Verification Approved',
//     [NotificationType.VERIFICATION_REJECTED]: 'Account Verification Rejected',
//   };

//   return subjects[type] || 'Notification from Newcondo';
// };

// /**
//  * Validate notification payload
//  */
// export const validateNotificationPayload = (
//   payload: NotificationPayload
// ): { valid: boolean; errors: string[] } => {
//   const errors: string[] = [];

//   if (!payload.recipient?.id) {
//     errors.push('Recipient ID is required');
//   }

//   if (!payload.type) {
//     errors.push('Notification type is required');
//   }

//   if (!payload.channel || payload.channel.length === 0) {
//     errors.push('At least one notification channel is required');
//   }

//   // Validate channel-specific requirements
//   if (payload.channel.includes(NotificationChannel.EMAIL) && !payload.recipient.email) {
//     errors.push('Email address is required for email notifications');
//   }

//   if (payload.channel.includes(NotificationChannel.SMS) && !payload.recipient.phone) {
//     errors.push('Phone number is required for SMS notifications');
//   }

//   return {
//     valid: errors.length === 0,
//     errors,
//   };
// };

// /**
//  * Batch notifications by channel for efficient sending
//  */
// export const batchNotificationsByChannel = (
//   notifications: NotificationPayload[]
// ): Map<NotificationChannel, NotificationPayload[]> => {
//   const batches = new Map<NotificationChannel, NotificationPayload[]>();

//   notifications.forEach((notification) => {
//     notification.channel.forEach((channel) => {
//       if (!batches.has(channel)) {
//         batches.set(channel, []);
//       }
//       batches.get(channel)!.push(notification);
//     });
//   });

//   return batches;
// };

// export default {
//   createMarkingJobCreatedNotification,
//   createMarkingJobAssignedNotification,
//   createMarkingJobAvailableNotification,
//   createMarkingJobCompletedNotification,
//   createMarkingJobConfirmedNotification,
//   createTimeSlotExpiringNotification,
//   createConfirmationReminderNotification,
//   createPartialPaymentNotification,
//   createFullPaymentNotification,
//   createQueuePositionNotification,
//   createQueueYourTurnNotification,
//   formatCurrency,
//   formatDate,
//   getNotificationSubject,
//   validateNotificationPayload,
//   batchNotificationsByChannel,
// };