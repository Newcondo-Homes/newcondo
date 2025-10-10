// backend/notification-service/src/types/markingNotification.ts

export interface ProximityNotificationPayload {
  markingJobId: string;
  propertyDetails: {
    address: string;
    city: string;
    state: string;
    propertyType: string;
  };
  compensation: number;
  propertyCoordinates: {
    lat: number;
    lng: number;
  };
  maxDistanceKm?: number;
  urgencyLevel?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

export interface ProximitySearchResult {
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isPremium: boolean;
  distance: number; // in kilometers
  reliabilityScore: number;
  completionRate: number;
}

export interface BroadcastResult {
  success: boolean;
  notifiedCount: number;
  failedCount: number;
  agents: Array<{
    userId: string;
    name: string;
    email: string;
    phone: string | null;
    success: boolean;
    error?: string;
  }>;
  message: string;
}

export interface MarkingJobCreatedPayload {
  markingJobId: string;
  propertyOwnerId: string;
  propertyOwnerName: string;
  propertyOwnerEmail: string;
  propertyOwnerPhone: string | null;
  propertyDetails: {
    address: string;
    city: string;
    state: string;
    propertyType: string;
  };
  markingFee: number;
  markingMethod: 'SELF' | 'KNOWN_PERSON' | 'NEWCONDO_AGENT' | 'PLATFORM_BROADCAST';
  contactPerson?: {
    name: string;
    phone: string;
  };
  accessInstructions?: string;
  preferredTime?: Date;
}

export interface MarkingJobAssignedPayload {
  markingJobId: string;
  agentId: string;
  agentName: string;
  agentEmail: string;
  agentPhone: string | null;
  propertyOwnerId: string;
  propertyOwnerName: string;
  propertyOwnerEmail: string;
  propertyDetails: {
    address: string;
    city: string;
    state: string;
  };
  contactPerson: {
    name: string;
    phone: string;
  };
  accessInstructions?: string;
  compensation: number;
  timeSlotExpiry: Date;
  queuePosition?: number;
}

export interface MarkingJobCompletedPayload {
  markingJobId: string;
  agentId: string;
  agentName: string;
  propertyOwnerId: string;
  propertyOwnerName: string;
  propertyOwnerEmail: string;
  propertyOwnerPhone: string | null;
  propertyDetails: {
    address: string;
    city: string;
    state: string;
  };
  completionImages: string[];
  completionNotes?: string;
  completedAt: Date;
  initialCompensation: number;
  verificationDeadline: Date;
}

export interface MarkingVerificationReminderPayload {
  markingJobId: string;
  propertyOwnerId: string;
  propertyOwnerName: string;
  propertyOwnerEmail: string;
  propertyOwnerPhone: string | null;
  propertyDetails: {
    address: string;
    city: string;
    state: string;
  };
  agentName: string;
  completedAt: Date;
  verificationDeadline: Date;
  hoursRemaining: number;
  completionImages: string[];
}

export interface MarkingCompensationReleasedPayload {
  markingJobId: string;
  agentId: string;
  agentName: string;
  agentEmail: string;
  agentPhone: string | null;
  propertyDetails: {
    address: string;
    city: string;
    state: string;
  };
  compensationAmount: number;
  releasedAt: Date;
  isPartialPayment: boolean;
  paymentNumber?: number;
  totalPayments?: number;
  remainingBalance?: number;
}

export interface MarkingJobExpiredPayload {
  markingJobId: string;
  agentId: string;
  agentName: string;
  agentEmail: string;
  agentPhone: string | null;
  propertyOwnerId: string;
  propertyOwnerEmail: string;
  propertyDetails: {
    address: string;
    city: string;
    state: string;
  };
  expiredAt: Date;
  reason: 'TIME_SLOT_EXPIRED' | 'VERIFICATION_DEADLINE_PASSED' | 'JOB_CANCELLED';
  compensation?: number;
  nextInQueue?: {
    agentId: string;
    queuePosition: number;
  };
}

export interface ShareableLinkInvitePayload {
  markingJobId: string;
  propertyOwnerId: string;
  propertyOwnerName: string;
  markerName?: string;
  markerPhone?: string;
  propertyDetails: {
    address: string;
    city: string;
    state: string;
  };
  shareableLink: string;
  accessInstructions?: string;
  contactPerson: {
    name: string;
    phone: string;
  };
}

export interface NotificationTemplate {
  subject: string;
  htmlContent: string;
  textContent: string;
  smsContent?: string;
}

export interface NotificationMetadata {
  markingJobId: string;
  recipientId: string;
  notificationType: MarkingNotificationType;
  sentAt: Date;
  deliveryStatus: 'SENT' | 'DELIVERED' | 'FAILED';
  channels: ('EMAIL' | 'SMS' | 'PUSH')[];
}

export enum MarkingNotificationType {
  JOB_CREATED = 'JOB_CREATED',
  JOB_ASSIGNED = 'JOB_ASSIGNED',
  JOB_BROADCAST = 'JOB_BROADCAST',
  JOB_COMPLETED = 'JOB_COMPLETED',
  VERIFICATION_REMINDER = 'VERIFICATION_REMINDER',
  COMPENSATION_RELEASED = 'COMPENSATION_RELEASED',
  JOB_EXPIRED = 'JOB_EXPIRED',
  SHAREABLE_LINK_INVITE = 'SHAREABLE_LINK_INVITE',
  NEXT_IN_QUEUE = 'NEXT_IN_QUEUE',
  PAYMENT_CONFIRMATION = 'PAYMENT_CONFIRMATION',
}

export interface MarkingNotificationConfig {
  enableEmail: boolean;
  enableSMS: boolean;
  enablePush: boolean;
  proximityRadiusKm: number;
  maxBroadcastRecipients: number;
  reminderIntervalHours: number;
  verificationWindowDays: number;
}