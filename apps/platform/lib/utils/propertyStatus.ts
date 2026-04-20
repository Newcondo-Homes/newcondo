import {
  CheckCircle,
  Clock,
  XCircle,
  Edit,
  Home,
  AlertCircle,
  Ban,
  type LucideIcon,
} from "lucide-react";

/**
 * Property Status Types
 */
export type PropertyStatus =
  | "DRAFT"
  | "PENDING"
  | "PUBLISHED"
  | "RENTED"
  | "UNAVAILABLE";

export type AdminApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export type PropertyStructure = "SINGLE_UNIT" | "MULTI_FAMILY";

export type UnitStatus = "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" | "RESERVED";

/**
 * Status Configuration Interface
 */
interface StatusConfig {
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  icon: LucideIcon;
  canEdit: boolean;
  canPublish: boolean;
  canRent: boolean;
  isActive: boolean;
}

/**
 * Property Status Configurations
 */
export const PROPERTY_STATUS_CONFIG: Record<PropertyStatus, StatusConfig> = {
  DRAFT: {
    label: "Draft",
    description: "Property is being edited and not yet submitted",
    color: "gray",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-500/20",
    textColor: "text-gray-700",
    icon: Edit,
    canEdit: true,
    canPublish: false,
    canRent: false,
    isActive: false,
  },
  PENDING: {
    label: "Pending",
    description: "Property is awaiting admin approval",
    color: "yellow",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20",
    textColor: "text-yellow-700",
    icon: Clock,
    canEdit: false,
    canPublish: false,
    canRent: false,
    isActive: false,
  },
  PUBLISHED: {
    label: "Published",
    description: "Property is live and available for rent",
    color: "green",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    textColor: "text-green-700",
    icon: CheckCircle,
    canEdit: true,
    canPublish: true,
    canRent: true,
    isActive: true,
  },
  RENTED: {
    label: "Rented",
    description: "Property is currently rented out",
    color: "purple",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    textColor: "text-purple-700",
    icon: Home,
    canEdit: false,
    canPublish: false,
    canRent: false,
    isActive: false,
  },
  UNAVAILABLE: {
    label: "Unavailable",
    description: "Property is temporarily unavailable",
    color: "red",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    textColor: "text-red-700",
    icon: Ban,
    canEdit: true,
    canPublish: false,
    canRent: false,
    isActive: false,
  },
};

/**
 * Admin Approval Status Configurations
 */
export const ADMIN_APPROVAL_CONFIG: Record<
  AdminApprovalStatus,
  Omit<StatusConfig, "canEdit" | "canPublish" | "canRent" | "isActive">
> = {
  PENDING: {
    label: "Pending Review",
    description: "Awaiting admin approval",
    color: "yellow",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20",
    textColor: "text-yellow-700",
    icon: Clock,
  },
  APPROVED: {
    label: "Approved",
    description: "Approved by admin",
    color: "green",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    textColor: "text-green-700",
    icon: CheckCircle,
  },
  REJECTED: {
    label: "Rejected",
    description: "Rejected by admin",
    color: "red",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    textColor: "text-red-700",
    icon: XCircle,
  },
};

/**
 * Unit Status Configurations
 */
export const UNIT_STATUS_CONFIG: Record <
  UnitStatus,
  Omit<StatusConfig, "canEdit" | "canPublish" | "canRent">
> = {
  AVAILABLE: {
    label: "Available",
    description: "Unit is ready for rent",
    color: "green",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    textColor: "text-green-700",
    icon: CheckCircle,
    isActive: true,
  },
  OCCUPIED: {
    label: "Occupied",
    description: "Unit is currently rented",
    color: "purple",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    textColor: "text-purple-700",
    icon: Home,
    isActive: false,
  },
  MAINTENANCE: {
    label: "Maintenance",
    description: "Unit is under maintenance",
    color: "orange",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
    textColor: "text-orange-700",
    icon: AlertCircle,
    isActive: false,
  },
  RESERVED: {
    label: "Reserved",
    description: "Unit is reserved/payment pending",
    color: "blue",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    textColor: "text-blue-700",
    icon: Clock,
    isActive: false,
  },
};

/**
 * Get status configuration
 */
export function getPropertyStatusConfig(status: PropertyStatus): StatusConfig {
  return PROPERTY_STATUS_CONFIG[status];
}

export function getAdminApprovalConfig(status: AdminApprovalStatus) {
  return ADMIN_APPROVAL_CONFIG[status];
}

export function getUnitStatusConfig(status: UnitStatus) {
  return UNIT_STATUS_CONFIG[status];
}

/**
 * Status badge class generator
 */
export function getStatusBadgeClasses(status: PropertyStatus): string {
  const config = PROPERTY_STATUS_CONFIG[status];
  return `${config.bgColor} ${config.textColor} ${config.borderColor}`;
}

export function getApprovalBadgeClasses(status: AdminApprovalStatus): string {
  const config = ADMIN_APPROVAL_CONFIG[status];
  return `${config.bgColor} ${config.textColor} ${config.borderColor}`;
}

export function getUnitBadgeClasses(status: UnitStatus): string {
  const config = UNIT_STATUS_CONFIG[status];
  return `${config.bgColor} ${config.textColor} ${config.borderColor}`;
}

/**
 * Check if property can be edited
 */
export function canEditProperty(
  status: PropertyStatus,
  approvalStatus: AdminApprovalStatus
): boolean {
  const statusConfig = PROPERTY_STATUS_CONFIG[status];
  return statusConfig.canEdit && approvalStatus !== "PENDING";
}

/**
 * Check if property can be published
 */
export function canPublishProperty(
  status: PropertyStatus,
  approvalStatus: AdminApprovalStatus
): boolean {
  return (
    status === "DRAFT" ||
    (status === "PUBLISHED" && approvalStatus === "APPROVED")
  );
}

/**
 * Check if property can be rented
 */
export function canRentProperty(
  status: PropertyStatus,
  approvalStatus: AdminApprovalStatus,
  isAvailable: boolean
): boolean {
  const statusConfig = PROPERTY_STATUS_CONFIG[status];
  return (
    statusConfig.canRent && approvalStatus === "APPROVED" && isAvailable
  );
}

/**
 * Check if property is active
 */
export function isPropertyActive(
  status: PropertyStatus,
  approvalStatus: AdminApprovalStatus
): boolean {
  const statusConfig = PROPERTY_STATUS_CONFIG[status];
  return statusConfig.isActive && approvalStatus === "APPROVED";
}

/**
 * Get next possible statuses
 */
export function getNextPossibleStatuses(
  currentStatus: PropertyStatus,
  approvalStatus: AdminApprovalStatus
): PropertyStatus[] {
  const nextStatuses: PropertyStatus[] = [];

  switch (currentStatus) {
    case "DRAFT":
      if (approvalStatus === "APPROVED" || approvalStatus === "PENDING") {
        nextStatuses.push("PENDING", "PUBLISHED");
      }
      break;

    case "PENDING":
      // Admin changes to PUBLISHED or REJECTED (back to DRAFT)
      nextStatuses.push("DRAFT");
      break;

    case "PUBLISHED":
      nextStatuses.push("UNAVAILABLE", "RENTED");
      break;

    case "RENTED":
      nextStatuses.push("PUBLISHED", "UNAVAILABLE");
      break;

    case "UNAVAILABLE":
      nextStatuses.push("PUBLISHED");
      break;
  }

  return nextStatuses;
}

/**
 * Get status transition message
 */
export function getStatusTransitionMessage(
  from: PropertyStatus,
  to: PropertyStatus
): string {
  const transitions: Record<string, string> = {
    "DRAFT->PENDING": "Property submitted for review",
    "DRAFT->PUBLISHED": "Property published successfully",
    "PENDING->PUBLISHED": "Property approved and published",
    "PENDING->DRAFT": "Property returned to draft",
    "PUBLISHED->RENTED": "Property marked as rented",
    "PUBLISHED->UNAVAILABLE": "Property marked as unavailable",
    "RENTED->PUBLISHED": "Property available again",
    "RENTED->UNAVAILABLE": "Property marked as unavailable",
    "UNAVAILABLE->PUBLISHED": "Property made available",
  };

  return transitions[`${from}->${to}`] || "Status updated";
}

/**
 * Validate status transition
 */
export function isValidStatusTransition(
  from: PropertyStatus,
  to: PropertyStatus,
  approvalStatus: AdminApprovalStatus
): { valid: boolean; reason?: string } {
  const possibleStatuses = getNextPossibleStatuses(from, approvalStatus);

  if (!possibleStatuses.includes(to)) {
    return {
      valid: false,
      reason: `Cannot transition from ${from} to ${to}`,
    };
  }

  // Additional checks
  if (to === "PUBLISHED" && approvalStatus !== "APPROVED") {
    return {
      valid: false,
      reason: "Property must be approved before publishing",
    };
  }

  return { valid: true };
}

/**
 * Get property availability status
 */
export function getPropertyAvailability(
  status: PropertyStatus,
  approvalStatus: AdminApprovalStatus,
  isAvailable: boolean,
  structure: PropertyStructure,
  availableUnits?: number
): {
  isAvailable: boolean;
  reason?: string;
  availableUnits?: number;
} {
  // Check approval status
  if (approvalStatus !== "APPROVED") {
    return {
      isAvailable: false,
      reason: "Property not yet approved",
    };
  }

  // Check property status
  if (status === "RENTED") {
    return {
      isAvailable: false,
      reason: "Property is currently rented",
    };
  }

  if (status === "UNAVAILABLE") {
    return {
      isAvailable: false,
      reason: "Property is marked as unavailable",
    };
  }

  if (status !== "PUBLISHED") {
    return {
      isAvailable: false,
      reason: `Property is ${status.toLowerCase()}`,
    };
  }

  // Check multi-family units
  if (structure === "MULTI_FAMILY") {
    if (!availableUnits || availableUnits === 0) {
      return {
        isAvailable: false,
        reason: "No units available",
        availableUnits: 0,
      };
    }

    return {
      isAvailable: true,
      availableUnits,
    };
  }

  // Single unit property
  return {
    isAvailable: isAvailable && status === "PUBLISHED",
    reason: !isAvailable ? "Property is not available" : undefined,
  };
}

/**
 * Get property status summary
 */
export function getPropertyStatusSummary(
  status: PropertyStatus,
  approvalStatus: AdminApprovalStatus,
  isAvailable: boolean
): {
  status: string;
  color: string;
  canEdit: boolean;
  canRent: boolean;
  isPublic: boolean;
} {
  const statusConfig = PROPERTY_STATUS_CONFIG[status];
  const approvalConfig = ADMIN_APPROVAL_CONFIG[approvalStatus];

  return {
    status: `${statusConfig.label} (${approvalConfig.label})`,
    color: statusConfig.color,
    canEdit: canEditProperty(status, approvalStatus),
    canRent: canRentProperty(status, approvalStatus, isAvailable),
    isPublic: isPropertyActive(status, approvalStatus),
  };
}

/**
 * Format status for display
 */
export function formatPropertyStatus(status: PropertyStatus): string {
  return PROPERTY_STATUS_CONFIG[status].label;
}

export function formatApprovalStatus(status: AdminApprovalStatus): string {
  return ADMIN_APPROVAL_CONFIG[status].label;
}

export function formatUnitStatus(status: UnitStatus): string {
  return UNIT_STATUS_CONFIG[status].label;
}

/**
 * Get status icon component
 */
export function getStatusIcon(status: PropertyStatus): LucideIcon {
  return PROPERTY_STATUS_CONFIG[status].icon;
}

export function getApprovalIcon(status: AdminApprovalStatus): LucideIcon {
  return ADMIN_APPROVAL_CONFIG[status].icon;
}

export function getUnitIcon(status: UnitStatus): LucideIcon {
  return UNIT_STATUS_CONFIG[status].icon;
}

/**
 * Filter properties by status
 */
export function filterPropertiesByStatus<T extends { status: PropertyStatus }>(
  properties: T[],
  statusFilter: PropertyStatus | "all"
): T[] {
  if (statusFilter === "all") {
    return properties;
  }

  return properties.filter((property) => property.status === statusFilter);
}

/**
 * Group properties by status
 */
export function groupPropertiesByStatus<T extends { status: PropertyStatus }>(
  properties: T[]
): Record<PropertyStatus, T[]> {
  const grouped = {
    DRAFT: [],
    PENDING: [],
    PUBLISHED: [],
    RENTED: [],
    UNAVAILABLE: [],
  } as Record<PropertyStatus, T[]>;

  properties.forEach((property) => {
    grouped[property.status].push(property);
  });

  return grouped;
}

/**
 * Calculate property status statistics
 */
export function calculatePropertyStats<T extends { status: PropertyStatus }>(
  properties: T[]
): Record<PropertyStatus | "total", number> {
  const stats = {
    total: properties.length,
    DRAFT: 0,
    PENDING: 0,
    PUBLISHED: 0,
    RENTED: 0,
    UNAVAILABLE: 0,
  };

  properties.forEach((property) => {
    stats[property.status]++;
  });

  return stats;
}

/**
 * Sort properties by status priority
 */
export function sortByStatusPriority<T extends { status: PropertyStatus }>(
  properties: T[]
): T[] {
  const priorityOrder: PropertyStatus[] = [
    "PENDING",
    "PUBLISHED",
    "DRAFT",
    "RENTED",
    "UNAVAILABLE",
  ];

  return [...properties].sort((a, b) => {
    return (
      priorityOrder.indexOf(a.status) - priorityOrder.indexOf(b.status)
    );
  });
}