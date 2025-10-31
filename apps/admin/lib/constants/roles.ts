// apps/admin/src/lib/constants/roles.ts

/**
 * Admin Role and Permission Constants
 */

export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  SUPPORT = 'SUPPORT',
}

export enum Permission {
  // User Management
  VIEW_USERS = 'VIEW_USERS',
  EDIT_USERS = 'EDIT_USERS',
  SUSPEND_USERS = 'SUSPEND_USERS',
  DELETE_USERS = 'DELETE_USERS',
  VERIFY_USERS = 'VERIFY_USERS',

  // Property Management
  VIEW_PROPERTIES = 'VIEW_PROPERTIES',
  APPROVE_PROPERTIES = 'APPROVE_PROPERTIES',
  REJECT_PROPERTIES = 'REJECT_PROPERTIES',
  DELETE_PROPERTIES = 'DELETE_PROPERTIES',
  RESOLVE_BOUNDARY_DISPUTES = 'RESOLVE_BOUNDARY_DISPUTES',
  RESOLVE_DUPLICATES = 'RESOLVE_DUPLICATES',

  // Document Verification
  VIEW_DOCUMENTS = 'VIEW_DOCUMENTS',
  VERIFY_DOCUMENTS = 'VERIFY_DOCUMENTS',
  REJECT_DOCUMENTS = 'REJECT_DOCUMENTS',

  // Payment Management
  VIEW_PAYMENTS = 'VIEW_PAYMENTS',
  PROCESS_REFUNDS = 'PROCESS_REFUNDS',
  RELEASE_PAYMENTS = 'RELEASE_PAYMENTS',
  VIEW_VIRTUAL_ACCOUNTS = 'VIEW_VIRTUAL_ACCOUNTS',
  MANAGE_VIRTUAL_ACCOUNTS = 'MANAGE_VIRTUAL_ACCOUNTS',

  // Marking Jobs
  VIEW_MARKING_JOBS = 'VIEW_MARKING_JOBS',
  MANAGE_MARKING_QUEUE = 'MANAGE_MARKING_QUEUE',
  REASSIGN_MARKING_JOBS = 'REASSIGN_MARKING_JOBS',
  CANCEL_MARKING_JOBS = 'CANCEL_MARKING_JOBS',
  QUALITY_CHECK_MARKING = 'QUALITY_CHECK_MARKING',

  // Support
  VIEW_SUPPORT_TICKETS = 'VIEW_SUPPORT_TICKETS',
  RESPOND_TO_TICKETS = 'RESPOND_TO_TICKETS',
  RESOLVE_TICKETS = 'RESOLVE_TICKETS',
  CLOSE_TICKETS = 'CLOSE_TICKETS',

  // Analytics
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',
  EXPORT_REPORTS = 'EXPORT_REPORTS',
  VIEW_REVENUE = 'VIEW_REVENUE',

  // System Management
  MANAGE_ADMINS = 'MANAGE_ADMINS',
  MANAGE_SETTINGS = 'MANAGE_SETTINGS',
  VIEW_SYSTEM_LOGS = 'VIEW_SYSTEM_LOGS',
  MANAGE_FEATURE_FLAGS = 'MANAGE_FEATURE_FLAGS',
}

/**
 * Role-based permissions mapping
 */
export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  [AdminRole.SUPER_ADMIN]: Object.values(Permission), // All permissions

  [AdminRole.ADMIN]: [
    // User Management
    Permission.VIEW_USERS,
    Permission.EDIT_USERS,
    Permission.SUSPEND_USERS,
    Permission.VERIFY_USERS,

    // Property Management
    Permission.VIEW_PROPERTIES,
    Permission.APPROVE_PROPERTIES,
    Permission.REJECT_PROPERTIES,
    Permission.RESOLVE_BOUNDARY_DISPUTES,
    Permission.RESOLVE_DUPLICATES,

    // Document Verification
    Permission.VIEW_DOCUMENTS,
    Permission.VERIFY_DOCUMENTS,
    Permission.REJECT_DOCUMENTS,

    // Payment Management
    Permission.VIEW_PAYMENTS,
    Permission.PROCESS_REFUNDS,
    Permission.RELEASE_PAYMENTS,
    Permission.VIEW_VIRTUAL_ACCOUNTS,

    // Marking Jobs
    Permission.VIEW_MARKING_JOBS,
    Permission.MANAGE_MARKING_QUEUE,
    Permission.REASSIGN_MARKING_JOBS,
    Permission.QUALITY_CHECK_MARKING,

    // Support
    Permission.VIEW_SUPPORT_TICKETS,
    Permission.RESPOND_TO_TICKETS,
    Permission.RESOLVE_TICKETS,
    Permission.CLOSE_TICKETS,

    // Analytics
    Permission.VIEW_ANALYTICS,
    Permission.EXPORT_REPORTS,
    Permission.VIEW_REVENUE,

    // System Management
    Permission.VIEW_SYSTEM_LOGS,
  ],

  [AdminRole.MODERATOR]: [
    // User Management
    Permission.VIEW_USERS,
    Permission.VERIFY_USERS,

    // Property Management
    Permission.VIEW_PROPERTIES,
    Permission.APPROVE_PROPERTIES,
    Permission.REJECT_PROPERTIES,

    // Document Verification
    Permission.VIEW_DOCUMENTS,
    Permission.VERIFY_DOCUMENTS,
    Permission.REJECT_DOCUMENTS,

    // Payment Management
    Permission.VIEW_PAYMENTS,

    // Marking Jobs
    Permission.VIEW_MARKING_JOBS,
    Permission.QUALITY_CHECK_MARKING,

    // Support
    Permission.VIEW_SUPPORT_TICKETS,
    Permission.RESPOND_TO_TICKETS,

    // Analytics
    Permission.VIEW_ANALYTICS,
  ],

  [AdminRole.SUPPORT]: [
    // User Management
    Permission.VIEW_USERS,

    // Property Management
    Permission.VIEW_PROPERTIES,

    // Document Verification
    Permission.VIEW_DOCUMENTS,

    // Payment Management
    Permission.VIEW_PAYMENTS,

    // Support
    Permission.VIEW_SUPPORT_TICKETS,
    Permission.RESPOND_TO_TICKETS,
    Permission.RESOLVE_TICKETS,
    Permission.CLOSE_TICKETS,

    // Analytics
    Permission.VIEW_ANALYTICS,
  ],
};

/**
 * User roles from the platform (non-admin)
 */
export enum UserRole {
  OWNER = 'OWNER',
  AGENT = 'AGENT',
  RENTER = 'RENTER',
  ADMIN = 'ADMIN',
}

/**
 * User type classifications
 */
export enum UserType {
  LANDLORD = 'LANDLORD',
  PROPERTY_MANAGER = 'PROPERTY_MANAGER',
  AGENT = 'AGENT',
  RENTER = 'RENTER',
  ADMIN = 'ADMIN',
}

/**
 * Role display names
 */
export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  [AdminRole.SUPER_ADMIN]: 'Super Admin',
  [AdminRole.ADMIN]: 'Admin',
  [AdminRole.MODERATOR]: 'Moderator',
  [AdminRole.SUPPORT]: 'Support',
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.OWNER]: 'Property Owner',
  [UserRole.AGENT]: 'Agent',
  [UserRole.RENTER]: 'Renter',
  [UserRole.ADMIN]: 'Admin',
};

export const USER_TYPE_LABELS: Record<UserType, string> = {
  [UserType.LANDLORD]: 'Landlord',
  [UserType.PROPERTY_MANAGER]: 'Property Manager',
  [UserType.AGENT]: 'Agent',
  [UserType.RENTER]: 'Renter',
  [UserType.ADMIN]: 'Admin',
};

/**
 * Permission helper functions
 */
export const hasPermission = (
  adminRole: AdminRole,
  permission: Permission
): boolean => {
  return ROLE_PERMISSIONS[adminRole]?.includes(permission) ?? false;
};

export const hasAnyPermission = (
  adminRole: AdminRole,
  permissions: Permission[]
): boolean => {
  return permissions.some(permission => hasPermission(adminRole, permission));
};

export const hasAllPermissions = (
  adminRole: AdminRole,
  permissions: Permission[]
): boolean => {
  return permissions.every(permission => hasPermission(adminRole, permission));
};

/**
 * Get all permissions for a role
 */
export const getRolePermissions = (adminRole: AdminRole): Permission[] => {
  return ROLE_PERMISSIONS[adminRole] || [];
};

/**
 * Check if a role can access a specific resource
 */
export const canAccessResource = (
  adminRole: AdminRole,
  resource: 'users' | 'properties' | 'documents' | 'payments' | 'marking' | 'support' | 'analytics' | 'settings'
): boolean => {
  const resourcePermissions: Record<typeof resource, Permission[]> = {
    users: [Permission.VIEW_USERS, Permission.EDIT_USERS, Permission.VERIFY_USERS],
    properties: [Permission.VIEW_PROPERTIES, Permission.APPROVE_PROPERTIES],
    documents: [Permission.VIEW_DOCUMENTS, Permission.VERIFY_DOCUMENTS],
    payments: [Permission.VIEW_PAYMENTS, Permission.PROCESS_REFUNDS],
    marking: [Permission.VIEW_MARKING_JOBS, Permission.MANAGE_MARKING_QUEUE],
    support: [Permission.VIEW_SUPPORT_TICKETS, Permission.RESPOND_TO_TICKETS],
    analytics: [Permission.VIEW_ANALYTICS, Permission.EXPORT_REPORTS],
    settings: [Permission.MANAGE_SETTINGS, Permission.VIEW_SYSTEM_LOGS],
  };

  return hasAnyPermission(adminRole, resourcePermissions[resource]);
};