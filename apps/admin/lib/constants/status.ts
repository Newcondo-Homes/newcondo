// apps/admin/src/lib/constants/status.ts

/**
 * Status Constants for Admin Dashboard
 */

// User Verification Status
export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  [VerificationStatus.PENDING]: 'Pending',
  [VerificationStatus.VERIFIED]: 'Verified',
  [VerificationStatus.REJECTED]: 'Rejected',
};

export const VERIFICATION_STATUS_COLORS: Record<VerificationStatus, string> = {
  [VerificationStatus.PENDING]: 'yellow',
  [VerificationStatus.VERIFIED]: 'green',
  [VerificationStatus.REJECTED]: 'red',
};

// Property Status
export enum PropertyStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED',
  RENTED = 'RENTED',
  UNAVAILABLE = 'UNAVAILABLE',
}

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
  [PropertyStatus.DRAFT]: 'Draft',
  [PropertyStatus.PENDING]: 'Pending',
  [PropertyStatus.PUBLISHED]: 'Published',
  [PropertyStatus.RENTED]: 'Rented',
  [PropertyStatus.UNAVAILABLE]: 'Unavailable',
};

export const PROPERTY_STATUS_COLORS: Record<PropertyStatus, string> = {
  [PropertyStatus.DRAFT]: 'gray',
  [PropertyStatus.PENDING]: 'yellow',
  [PropertyStatus.PUBLISHED]: 'green',
  [PropertyStatus.RENTED]: 'blue',
  [PropertyStatus.UNAVAILABLE]: 'red',
};

// Admin Approval Status
export enum AdminApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export const ADMIN_APPROVAL_STATUS_LABELS: Record<AdminApprovalStatus, string> = {
  [AdminApprovalStatus.PENDING]: 'Pending Review',
  [AdminApprovalStatus.APPROVED]: 'Approved',
  [AdminApprovalStatus.REJECTED]: 'Rejected',
};

export const ADMIN_APPROVAL_STATUS_COLORS: Record<AdminApprovalStatus, string> = {
  [AdminApprovalStatus.PENDING]: 'yellow',
  [AdminApprovalStatus.APPROVED]: 'green',
  [AdminApprovalStatus.REJECTED]: 'red',
};

// Document Status
export enum DocumentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  [DocumentStatus.PENDING]: 'Pending',
  [DocumentStatus.APPROVED]: 'Approved',
  [DocumentStatus.REJECTED]: 'Rejected',
  [DocumentStatus.EXPIRED]: 'Expired',
};

export const DOCUMENT_STATUS_COLORS: Record<DocumentStatus, string> = {
  [DocumentStatus.PENDING]: 'yellow',
  [DocumentStatus.APPROVED]: 'green',
  [DocumentStatus.REJECTED]: 'red',
  [DocumentStatus.EXPIRED]: 'gray',
};

// Payment Status
export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  HELD = 'HELD',
  RELEASED = 'RELEASED',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'Pending',
  [PaymentStatus.SUCCESS]: 'Success',
  [PaymentStatus.FAILED]: 'Failed',
  [PaymentStatus.CANCELLED]: 'Cancelled',
  [PaymentStatus.REFUNDED]: 'Refunded',
  [PaymentStatus.HELD]: 'Held',
  [PaymentStatus.RELEASED]: 'Released',
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'yellow',
  [PaymentStatus.SUCCESS]: 'green',
  [PaymentStatus.FAILED]: 'red',
  [PaymentStatus.CANCELLED]: 'gray',
  [PaymentStatus.REFUNDED]: 'orange',
  [PaymentStatus.HELD]: 'blue',
  [PaymentStatus.RELEASED]: 'green',
};

// Marking Job Status
export enum MarkingJobStatus {
  QUEUED = 'QUEUED',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export const MARKING_JOB_STATUS_LABELS: Record<MarkingJobStatus, string> = {
  [MarkingJobStatus.QUEUED]: 'Queued',
  [MarkingJobStatus.ASSIGNED]: 'Assigned',
  [MarkingJobStatus.IN_PROGRESS]: 'In Progress',
  [MarkingJobStatus.COMPLETED]: 'Completed',
  [MarkingJobStatus.CANCELLED]: 'Cancelled',
  [MarkingJobStatus.EXPIRED]: 'Expired',
};

export const MARKING_JOB_STATUS_COLORS: Record<MarkingJobStatus, string> = {
  [MarkingJobStatus.QUEUED]: 'yellow',
  [MarkingJobStatus.ASSIGNED]: 'blue',
  [MarkingJobStatus.IN_PROGRESS]: 'purple',
  [MarkingJobStatus.COMPLETED]: 'green',
  [MarkingJobStatus.CANCELLED]: 'red',
  [MarkingJobStatus.EXPIRED]: 'gray',
};

// Support Ticket Status
export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  [TicketStatus.OPEN]: 'Open',
  [TicketStatus.IN_PROGRESS]: 'In Progress',
  [TicketStatus.RESOLVED]: 'Resolved',
  [TicketStatus.CLOSED]: 'Closed',
};

export const TICKET_STATUS_COLORS: Record<TicketStatus, string> = {
  [TicketStatus.OPEN]: 'red',
  [TicketStatus.IN_PROGRESS]: 'yellow',
  [TicketStatus.RESOLVED]: 'green',
  [TicketStatus.CLOSED]: 'gray',
};

// Support Ticket Priority
export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  [TicketPriority.LOW]: 'Low',
  [TicketPriority.MEDIUM]: 'Medium',
  [TicketPriority.HIGH]: 'High',
  [TicketPriority.URGENT]: 'Urgent',
};

export const TICKET_PRIORITY_COLORS: Record<TicketPriority, string> = {
  [TicketPriority.LOW]: 'gray',
  [TicketPriority.MEDIUM]: 'blue',
  [TicketPriority.HIGH]: 'orange',
  [TicketPriority.URGENT]: 'red',
};

// Duplicate Status
export enum DuplicateStatus {
  PENDING = 'PENDING',
  CONFIRMED_DUPLICATE = 'CONFIRMED_DUPLICATE',
  NOT_DUPLICATE = 'NOT_DUPLICATE',
  RESOLVED = 'RESOLVED',
}

export const DUPLICATE_STATUS_LABELS: Record<DuplicateStatus, string> = {
  [DuplicateStatus.PENDING]: 'Pending',
  [DuplicateStatus.CONFIRMED_DUPLICATE]: 'Confirmed Duplicate',
  [DuplicateStatus.NOT_DUPLICATE]: 'Not Duplicate',
  [DuplicateStatus.RESOLVED]: 'Resolved',
};

export const DUPLICATE_STATUS_COLORS: Record<DuplicateStatus, string> = {
  [DuplicateStatus.PENDING]: 'yellow',
  [DuplicateStatus.CONFIRMED_DUPLICATE]: 'red',
  [DuplicateStatus.NOT_DUPLICATE]: 'green',
  [DuplicateStatus.RESOLVED]: 'blue',
};

// Rental Status
export enum RentalStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED',
  PENDING_CONFIRMATION = 'PENDING_CONFIRMATION',
}

export const RENTAL_STATUS_LABELS: Record<RentalStatus, string> = {
  [RentalStatus.ACTIVE]: 'Active',
  [RentalStatus.EXPIRED]: 'Expired',
  [RentalStatus.TERMINATED]: 'Terminated',
  [RentalStatus.PENDING_CONFIRMATION]: 'Pending Confirmation',
};

export const RENTAL_STATUS_COLORS: Record<RentalStatus, string> = {
  [RentalStatus.ACTIVE]: 'green',
  [RentalStatus.EXPIRED]: 'gray',
  [RentalStatus.TERMINATED]: 'red',
  [RentalStatus.PENDING_CONFIRMATION]: 'yellow',
};

// Unit Status
export enum UnitStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  MAINTENANCE = 'MAINTENANCE',
  RESERVED = 'RESERVED',
}

export const UNIT_STATUS_LABELS: Record<UnitStatus, string> = {
  [UnitStatus.AVAILABLE]: 'Available',
  [UnitStatus.OCCUPIED]: 'Occupied',
  [UnitStatus.MAINTENANCE]: 'Maintenance',
  [UnitStatus.RESERVED]: 'Reserved',
};

export const UNIT_STATUS_COLORS: Record<UnitStatus, string> = {
  [UnitStatus.AVAILABLE]: 'green',
  [UnitStatus.OCCUPIED]: 'blue',
  [UnitStatus.MAINTENANCE]: 'orange',
  [UnitStatus.RESERVED]: 'yellow',
};

// Urgency Level
export enum UrgencyLevel {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export const URGENCY_LEVEL_LABELS: Record<UrgencyLevel, string> = {
  [UrgencyLevel.LOW]: 'Low',
  [UrgencyLevel.NORMAL]: 'Normal',
  [UrgencyLevel.HIGH]: 'High',
  [UrgencyLevel.URGENT]: 'Urgent',
};

export const URGENCY_LEVEL_COLORS: Record<UrgencyLevel, string> = {
  [UrgencyLevel.LOW]: 'gray',
  [UrgencyLevel.NORMAL]: 'blue',
  [UrgencyLevel.HIGH]: 'orange',
  [UrgencyLevel.URGENT]: 'red',
};

/**
 * Helper function to get status badge variant
 */
export const getStatusVariant = (
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  const color = getStatusColor(status);
  
  switch (color) {
    case 'green':
      return 'default';
    case 'red':
      return 'destructive';
    case 'yellow':
    case 'orange':
      return 'secondary';
    default:
      return 'outline';
  }
};

/**
 * Helper function to get status color
 */
export const getStatusColor = (status: string): string => {
  // Try all status color mappings
  const allColorMappings = {
    ...VERIFICATION_STATUS_COLORS,
    ...PROPERTY_STATUS_COLORS,
    ...ADMIN_APPROVAL_STATUS_COLORS,
    ...DOCUMENT_STATUS_COLORS,
    ...PAYMENT_STATUS_COLORS,
    ...MARKING_JOB_STATUS_COLORS,
    ...TICKET_STATUS_COLORS,
    ...DUPLICATE_STATUS_COLORS,
    ...RENTAL_STATUS_COLORS,
    ...UNIT_STATUS_COLORS,
  };

  return allColorMappings[status as keyof typeof allColorMappings] || 'gray';
};

/**
 * Helper function to get status label
 */
export const getStatusLabel = (status: string): string => {
  // Try all status label mappings
  const allLabelMappings = {
    ...VERIFICATION_STATUS_LABELS,
    ...PROPERTY_STATUS_LABELS,
    ...ADMIN_APPROVAL_STATUS_LABELS,
    ...DOCUMENT_STATUS_LABELS,
    ...PAYMENT_STATUS_LABELS,
    ...MARKING_JOB_STATUS_LABELS,
    ...TICKET_STATUS_LABELS,
    ...DUPLICATE_STATUS_LABELS,
    ...RENTAL_STATUS_LABELS,
    ...UNIT_STATUS_LABELS,
  };

  return allLabelMappings[status as keyof typeof allLabelMappings] || status;
};