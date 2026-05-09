// apps/platform/lib/constants/propertyStatus.ts

/**
 * Property Status Constants
 * Status definitions and mappings for properties and units
 */

// Property statuses from Prisma schema
export const PROPERTY_STATUS = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  PUBLISHED: 'PUBLISHED',
  RENTED: 'RENTED',
  UNAVAILABLE: 'UNAVAILABLE',
} as const;

export type PropertyStatus = typeof PROPERTY_STATUS[keyof typeof PROPERTY_STATUS];

// Property status labels
export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
  [PROPERTY_STATUS.DRAFT]: 'Draft',
  [PROPERTY_STATUS.PENDING]: 'Pending Approval',
  [PROPERTY_STATUS.PUBLISHED]: 'Published',
  [PROPERTY_STATUS.RENTED]: 'Rented',
  [PROPERTY_STATUS.UNAVAILABLE]: 'Unavailable',
};

// Property status descriptions
export const PROPERTY_STATUS_DESCRIPTIONS: Record<PropertyStatus, string> = {
  [PROPERTY_STATUS.DRAFT]: 'Property is being created and not yet submitted',
  [PROPERTY_STATUS.PENDING]: 'Property is awaiting admin approval',
  [PROPERTY_STATUS.PUBLISHED]: 'Property is live and available for rent',
  [PROPERTY_STATUS.RENTED]: 'Property has been rented out',
  [PROPERTY_STATUS.UNAVAILABLE]: 'Property is not available for rent',
};

// Property status colors for UI
export const PROPERTY_STATUS_COLORS: Record<PropertyStatus, string> = {
  [PROPERTY_STATUS.DRAFT]: 'bg-gray-100 text-gray-800',
  [PROPERTY_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
  [PROPERTY_STATUS.PUBLISHED]: 'bg-green-100 text-green-800',
  [PROPERTY_STATUS.RENTED]: 'bg-blue-100 text-blue-800',
  [PROPERTY_STATUS.UNAVAILABLE]: 'bg-red-100 text-red-800',
};

// Admin approval statuses
export const ADMIN_APPROVAL_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type AdminApprovalStatus = typeof ADMIN_APPROVAL_STATUS[keyof typeof ADMIN_APPROVAL_STATUS];

// Admin approval labels
export const ADMIN_APPROVAL_LABELS: Record<AdminApprovalStatus, string> = {
  [ADMIN_APPROVAL_STATUS.PENDING]: 'Pending Review',
  [ADMIN_APPROVAL_STATUS.APPROVED]: 'Approved',
  [ADMIN_APPROVAL_STATUS.REJECTED]: 'Rejected',
};

// Admin approval colors
export const ADMIN_APPROVAL_COLORS: Record<AdminApprovalStatus, string> = {
  [ADMIN_APPROVAL_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
  [ADMIN_APPROVAL_STATUS.APPROVED]: 'bg-green-100 text-green-800',
  [ADMIN_APPROVAL_STATUS.REJECTED]: 'bg-red-100 text-red-800',
};

// Unit statuses for multi-family properties
export const UNIT_STATUS = {
  AVAILABLE: 'AVAILABLE',
  OCCUPIED: 'OCCUPIED',
  MAINTENANCE: 'MAINTENANCE',
  RESERVED: 'RESERVED',
} as const;

export type UnitStatus = typeof UNIT_STATUS[keyof typeof UNIT_STATUS];

// Unit status labels
export const UNIT_STATUS_LABELS: Record<UnitStatus, string> = {
  [UNIT_STATUS.AVAILABLE]: 'Available',
  [UNIT_STATUS.OCCUPIED]: 'Occupied',
  [UNIT_STATUS.MAINTENANCE]: 'Under Maintenance',
  [UNIT_STATUS.RESERVED]: 'Reserved',
};

// Unit status colors
export const UNIT_STATUS_COLORS: Record<UnitStatus, string> = {
  [UNIT_STATUS.AVAILABLE]: 'bg-green-100 text-green-800',
  [UNIT_STATUS.OCCUPIED]: 'bg-blue-100 text-blue-800',
  [UNIT_STATUS.MAINTENANCE]: 'bg-orange-100 text-orange-800',
  [UNIT_STATUS.RESERVED]: 'bg-purple-100 text-purple-800',
};

// Rental statuses
export const RENTAL_STATUS = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  TERMINATED: 'TERMINATED',
  PENDING_CONFIRMATION: 'PENDING_CONFIRMATION',
} as const;

export type RentalStatus = typeof RENTAL_STATUS[keyof typeof RENTAL_STATUS];

// Rental status labels
export const RENTAL_STATUS_LABELS: Record<RentalStatus, string> = {
  [RENTAL_STATUS.ACTIVE]: 'Active',
  [RENTAL_STATUS.EXPIRED]: 'Expired',
  [RENTAL_STATUS.TERMINATED]: 'Terminated',
  [RENTAL_STATUS.PENDING_CONFIRMATION]: 'Pending Confirmation',
};

// Rental status colors
export const RENTAL_STATUS_COLORS: Record<RentalStatus, string> = {
  [RENTAL_STATUS.ACTIVE]: 'bg-green-100 text-green-800',
  [RENTAL_STATUS.EXPIRED]: 'bg-gray-100 text-gray-800',
  [RENTAL_STATUS.TERMINATED]: 'bg-red-100 text-red-800',
  [RENTAL_STATUS.PENDING_CONFIRMATION]: 'bg-yellow-100 text-yellow-800',
};

// Payment statuses
export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
  HELD: 'HELD',
  RELEASED: 'RELEASED',
} as const;

export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];

// Payment status labels
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PAYMENT_STATUS.PENDING]: 'Pending',
  [PAYMENT_STATUS.SUCCESS]: 'Success',
  [PAYMENT_STATUS.FAILED]: 'Failed',
  [PAYMENT_STATUS.CANCELLED]: 'Cancelled',
  [PAYMENT_STATUS.REFUNDED]: 'Refunded',
  [PAYMENT_STATUS.HELD]: 'Held',
  [PAYMENT_STATUS.RELEASED]: 'Released',
};

// Payment status colors
export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  [PAYMENT_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
  [PAYMENT_STATUS.SUCCESS]: 'bg-green-100 text-green-800',
  [PAYMENT_STATUS.FAILED]: 'bg-red-100 text-red-800',
  [PAYMENT_STATUS.CANCELLED]: 'bg-gray-100 text-gray-800',
  [PAYMENT_STATUS.REFUNDED]: 'bg-orange-100 text-orange-800',
  [PAYMENT_STATUS.HELD]: 'bg-blue-100 text-blue-800',
  [PAYMENT_STATUS.RELEASED]: 'bg-purple-100 text-purple-800',
};

// Property structure types
export const PROPERTY_STRUCTURE = {
  SINGLE_UNIT: 'SINGLE_UNIT',
  MULTI_FAMILY: 'MULTI_FAMILY',
} as const;

export type PropertyStructure = typeof PROPERTY_STRUCTURE[keyof typeof PROPERTY_STRUCTURE];

// Property structure labels
export const PROPERTY_STRUCTURE_LABELS: Record<PropertyStructure, string> = {
  [PROPERTY_STRUCTURE.SINGLE_UNIT]: 'Single Unit',
  [PROPERTY_STRUCTURE.MULTI_FAMILY]: 'Multi-Family Building',
};

// Verification statuses
export const VERIFICATION_STATUS = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
} as const;

export type VerificationStatus = typeof VERIFICATION_STATUS[keyof typeof VERIFICATION_STATUS];

// Verification status labels
export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  [VERIFICATION_STATUS.PENDING]: 'Pending Verification',
  [VERIFICATION_STATUS.VERIFIED]: 'Verified',
  [VERIFICATION_STATUS.REJECTED]: 'Rejected',
};

// Verification status colors
export const VERIFICATION_STATUS_COLORS: Record<VerificationStatus, string> = {
  [VERIFICATION_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
  [VERIFICATION_STATUS.VERIFIED]: 'bg-green-100 text-green-800',
  [VERIFICATION_STATUS.REJECTED]: 'bg-red-100 text-red-800',
};

// Helper function to check if property can be edited
export const canEditProperty = (status: PropertyStatus): boolean => {
  const editableStatuses: PropertyStatus[] = [
    PROPERTY_STATUS.DRAFT,
    PROPERTY_STATUS.UNAVAILABLE,
  ];
  return editableStatuses.includes(status);
};

// Helper function to check if property can be published
export const canPublishProperty = (
  status: PropertyStatus,
  approvalStatus: AdminApprovalStatus,
  boundaryVerified: boolean
): boolean => {
  return (
    status === PROPERTY_STATUS.DRAFT &&
    approvalStatus === ADMIN_APPROVAL_STATUS.APPROVED &&
    boundaryVerified
  );
};

// Helper function to check if property is rentable
export const isPropertyRentable = (status: PropertyStatus): boolean => {
  return status === PROPERTY_STATUS.PUBLISHED;
};

// Export all constants
const propertyStatusConstants = {
  PROPERTY_STATUS,
  PROPERTY_STATUS_LABELS,
  PROPERTY_STATUS_DESCRIPTIONS,
  PROPERTY_STATUS_COLORS,
  ADMIN_APPROVAL_STATUS,
  ADMIN_APPROVAL_LABELS,
  ADMIN_APPROVAL_COLORS,
  UNIT_STATUS,
  UNIT_STATUS_LABELS,
  UNIT_STATUS_COLORS,
  RENTAL_STATUS,
  RENTAL_STATUS_LABELS,
  RENTAL_STATUS_COLORS,
  PAYMENT_STATUS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  PROPERTY_STRUCTURE,
  PROPERTY_STRUCTURE_LABELS,
  VERIFICATION_STATUS,
  VERIFICATION_STATUS_LABELS,
  VERIFICATION_STATUS_COLORS,
  canEditProperty,
  canPublishProperty,
  isPropertyRentable,
};

export default propertyStatusConstants;