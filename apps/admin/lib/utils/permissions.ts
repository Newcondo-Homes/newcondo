// apps/admin/src/lib/utils/permissions.ts

import { 
  AdminRole, 
  Permission, 
  ROLE_PERMISSIONS,
  hasPermission as checkPermission,
  hasAnyPermission as checkAnyPermission,
  hasAllPermissions as checkAllPermissions,
} from '../constants/roles';
import { ACTION_PERMISSIONS } from '../constants/permissions';

/**
 * Permission check utilities for admin dashboard
 */

/**
 * Check if the current admin has a specific permission
 */
export const can = (
  adminRole: AdminRole | string,
  permission: Permission
): boolean => {
  const role = adminRole as AdminRole;
  return checkPermission(role, permission);
};

/**
 * Check if the current admin has any of the specified permissions
 */
export const canAny = (
  adminRole: AdminRole | string,
  permissions: Permission[]
): boolean => {
  const role = adminRole as AdminRole;
  return checkAnyPermission(role, permissions);
};

/**
 * Check if the current admin has all of the specified permissions
 */
export const canAll = (
  adminRole: AdminRole | string,
  permissions: Permission[]
): boolean => {
  const role = adminRole as AdminRole;
  return checkAllPermissions(role, permissions);
};

/**
 * Check if admin can perform a specific action
 */
export const canPerform = (
  adminRole: AdminRole | string,
  action: keyof typeof ACTION_PERMISSIONS
): boolean => {
  const role = adminRole as AdminRole;
  const permissions = ROLE_PERMISSIONS[role] || [];
  const requiredPermissions = ACTION_PERMISSIONS[action];
  
  return requiredPermissions.some(permission => permissions.includes(permission));
};

/**
 * Get all permissions for an admin role
 */
export const getPermissions = (adminRole: AdminRole | string): Permission[] => {
  const role = adminRole as AdminRole;
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Check if admin is super admin
 */
export const isSuperAdmin = (adminRole: AdminRole | string): boolean => {
  return adminRole === AdminRole.SUPER_ADMIN;
};

/**
 * Check if admin is at least admin level
 */
export const isAdmin = (adminRole: AdminRole | string): boolean => {
  return adminRole === AdminRole.SUPER_ADMIN || adminRole === AdminRole.ADMIN;
};

/**
 * Check if admin is moderator or higher
 */
export const isModerator = (adminRole: AdminRole | string): boolean => {
  return adminRole === AdminRole.SUPER_ADMIN || 
         adminRole === AdminRole.ADMIN || 
         adminRole === AdminRole.MODERATOR;
};

/**
 * User Management Permissions
 */
export const canViewUsers = (role: AdminRole | string) => 
  can(role, Permission.VIEW_USERS);

export const canEditUsers = (role: AdminRole | string) => 
  can(role, Permission.EDIT_USERS);

export const canSuspendUsers = (role: AdminRole | string) => 
  can(role, Permission.SUSPEND_USERS);

export const canDeleteUsers = (role: AdminRole | string) => 
  can(role, Permission.DELETE_USERS);

export const canVerifyUsers = (role: AdminRole | string) => 
  can(role, Permission.VERIFY_USERS);

/**
 * Property Management Permissions
 */
export const canViewProperties = (role: AdminRole | string) => 
  can(role, Permission.VIEW_PROPERTIES);

export const canApproveProperties = (role: AdminRole | string) => 
  can(role, Permission.APPROVE_PROPERTIES);

export const canRejectProperties = (role: AdminRole | string) => 
  can(role, Permission.REJECT_PROPERTIES);

export const canDeleteProperties = (role: AdminRole | string) => 
  can(role, Permission.DELETE_PROPERTIES);

export const canResolveBoundaryDisputes = (role: AdminRole | string) => 
  can(role, Permission.RESOLVE_BOUNDARY_DISPUTES);

export const canResolveDuplicates = (role: AdminRole | string) => 
  can(role, Permission.RESOLVE_DUPLICATES);

/**
 * Document Verification Permissions
 */
export const canViewDocuments = (role: AdminRole | string) => 
  can(role, Permission.VIEW_DOCUMENTS);

export const canVerifyDocuments = (role: AdminRole | string) => 
  can(role, Permission.VERIFY_DOCUMENTS);

export const canRejectDocuments = (role: AdminRole | string) => 
  can(role, Permission.REJECT_DOCUMENTS);

/**
 * Payment Management Permissions
 */
export const canViewPayments = (role: AdminRole | string) => 
  can(role, Permission.VIEW_PAYMENTS);

export const canProcessRefunds = (role: AdminRole | string) => 
  can(role, Permission.PROCESS_REFUNDS);

export const canReleasePayments = (role: AdminRole | string) => 
  can(role, Permission.RELEASE_PAYMENTS);

export const canViewVirtualAccounts = (role: AdminRole | string) => 
  can(role, Permission.VIEW_VIRTUAL_ACCOUNTS);

export const canManageVirtualAccounts = (role: AdminRole | string) => 
  can(role, Permission.MANAGE_VIRTUAL_ACCOUNTS);

/**
 * Marking Job Permissions
 */
export const canViewMarkingJobs = (role: AdminRole | string) => 
  can(role, Permission.VIEW_MARKING_JOBS);

export const canManageMarkingQueue = (role: AdminRole | string) => 
  can(role, Permission.MANAGE_MARKING_QUEUE);

export const canReassignMarkingJobs = (role: AdminRole | string) => 
  can(role, Permission.REASSIGN_MARKING_JOBS);

export const canCancelMarkingJobs = (role: AdminRole | string) => 
  can(role, Permission.CANCEL_MARKING_JOBS);

export const canQualityCheckMarking = (role: AdminRole | string) => 
  can(role, Permission.QUALITY_CHECK_MARKING);

/**
 * Support Permissions
 */
export const canViewSupportTickets = (role: AdminRole | string) => 
  can(role, Permission.VIEW_SUPPORT_TICKETS);

export const canRespondToTickets = (role: AdminRole | string) => 
  can(role, Permission.RESPOND_TO_TICKETS);

export const canResolveTickets = (role: AdminRole | string) => 
  can(role, Permission.RESOLVE_TICKETS);

export const canCloseTickets = (role: AdminRole | string) => 
  can(role, Permission.CLOSE_TICKETS);

/**
 * Analytics Permissions
 */
export const canViewAnalytics = (role: AdminRole | string) => 
  can(role, Permission.VIEW_ANALYTICS);

export const canExportReports = (role: AdminRole | string) => 
  can(role, Permission.EXPORT_REPORTS);

export const canViewRevenue = (role: AdminRole | string) => 
  can(role, Permission.VIEW_REVENUE);

/**
 * System Management Permissions
 */
export const canManageAdmins = (role: AdminRole | string) => 
  can(role, Permission.MANAGE_ADMINS);

export const canManageSettings = (role: AdminRole | string) => 
  can(role, Permission.MANAGE_SETTINGS);

export const canViewSystemLogs = (role: AdminRole | string) => 
  can(role, Permission.VIEW_SYSTEM_LOGS);

export const canManageFeatureFlags = (role: AdminRole | string) => 
  can(role, Permission.MANAGE_FEATURE_FLAGS);

/**
 * Compound permission checks
 */
export const canManageUsers = (role: AdminRole | string): boolean => {
  return canAny(role, [
    Permission.EDIT_USERS,
    Permission.SUSPEND_USERS,
    Permission.VERIFY_USERS,
  ]);
};

export const canManageProperties = (role: AdminRole | string): boolean => {
  return canAny(role, [
    Permission.APPROVE_PROPERTIES,
    Permission.REJECT_PROPERTIES,
    Permission.DELETE_PROPERTIES,
  ]);
};

export const canManageDocuments = (role: AdminRole | string): boolean => {
  return canAny(role, [
    Permission.VERIFY_DOCUMENTS,
    Permission.REJECT_DOCUMENTS,
  ]);
};

export const canManagePayments = (role: AdminRole | string): boolean => {
  return canAny(role, [
    Permission.PROCESS_REFUNDS,
    Permission.RELEASE_PAYMENTS,
    Permission.MANAGE_VIRTUAL_ACCOUNTS,
  ]);
};

export const canManageSupport = (role: AdminRole | string): boolean => {
  return canAny(role, [
    Permission.RESPOND_TO_TICKETS,
    Permission.RESOLVE_TICKETS,
    Permission.CLOSE_TICKETS,
  ]);
};

/**
 * Check if admin can access a specific route
 */
export const canAccessRoute = (
  adminRole: AdminRole | string,
  route: string
): boolean => {
  const role = adminRole as AdminRole;
  const routePermissionMap: Record<string, Permission[]> = {
    '/users': [Permission.VIEW_USERS],
    '/properties': [Permission.VIEW_PROPERTIES],
    '/verifications': [Permission.VIEW_DOCUMENTS],
    '/payments': [Permission.VIEW_PAYMENTS],
    '/marking': [Permission.VIEW_MARKING_JOBS],
    '/support': [Permission.VIEW_SUPPORT_TICKETS],
    '/analytics': [Permission.VIEW_ANALYTICS],
    '/settings': [Permission.MANAGE_SETTINGS, Permission.VIEW_SYSTEM_LOGS],
  };

  const requiredPermissions = routePermissionMap[route];
  if (!requiredPermissions) return true; // No specific permissions required

  return canAny(role, requiredPermissions);
};

/**
 * Get disabled reason for an action
 */
export const getDisabledReason = (
  adminRole: AdminRole | string,
  permission: Permission
): string | null => {
  if (can(adminRole, permission)) {
    return null;
  }

  return `You don't have permission to perform this action. Required permission: ${permission}`;
};

/**
 * Permission guard - throws error if permission check fails
 */
export const requirePermission = (
  adminRole: AdminRole | string,
  permission: Permission
): void => {
  if (!can(adminRole, permission)) {
    throw new Error(`Insufficient permissions. Required: ${permission}`);
  }
};

/**
 * Multiple permission guard
 */
export const requireAnyPermission = (
  adminRole: AdminRole | string,
  permissions: Permission[]
): void => {
  if (!canAny(adminRole, permissions)) {
    throw new Error(`Insufficient permissions. Required one of: ${permissions.join(', ')}`);
  }
};

/**
 * Check if action requires confirmation based on permission criticality
 */
export const requiresConfirmation = (permission: Permission): boolean => {
  const criticalPermissions = [
    Permission.DELETE_USERS,
    Permission.DELETE_PROPERTIES,
    Permission.PROCESS_REFUNDS,
    Permission.CANCEL_MARKING_JOBS,
    Permission.MANAGE_ADMINS,
  ];

  return criticalPermissions.includes(permission);
};