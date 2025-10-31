// apps/admin/src/lib/constants/permissions.ts

import { AdminRole, Permission } from './roles';

/**
 * Permission Groups for better organization
 */
export const PERMISSION_GROUPS = {
  USER_MANAGEMENT: {
    label: 'User Management',
    permissions: [
      Permission.VIEW_USERS,
      Permission.EDIT_USERS,
      Permission.SUSPEND_USERS,
      Permission.DELETE_USERS,
      Permission.VERIFY_USERS,
    ],
  },
  PROPERTY_MANAGEMENT: {
    label: 'Property Management',
    permissions: [
      Permission.VIEW_PROPERTIES,
      Permission.APPROVE_PROPERTIES,
      Permission.REJECT_PROPERTIES,
      Permission.DELETE_PROPERTIES,
      Permission.RESOLVE_BOUNDARY_DISPUTES,
      Permission.RESOLVE_DUPLICATES,
    ],
  },
  DOCUMENT_VERIFICATION: {
    label: 'Document Verification',
    permissions: [
      Permission.VIEW_DOCUMENTS,
      Permission.VERIFY_DOCUMENTS,
      Permission.REJECT_DOCUMENTS,
    ],
  },
  PAYMENT_MANAGEMENT: {
    label: 'Payment Management',
    permissions: [
      Permission.VIEW_PAYMENTS,
      Permission.PROCESS_REFUNDS,
      Permission.RELEASE_PAYMENTS,
      Permission.VIEW_VIRTUAL_ACCOUNTS,
      Permission.MANAGE_VIRTUAL_ACCOUNTS,
    ],
  },
  MARKING_JOBS: {
    label: 'Property Marking',
    permissions: [
      Permission.VIEW_MARKING_JOBS,
      Permission.MANAGE_MARKING_QUEUE,
      Permission.REASSIGN_MARKING_JOBS,
      Permission.CANCEL_MARKING_JOBS,
      Permission.QUALITY_CHECK_MARKING,
    ],
  },
  SUPPORT: {
    label: 'Support',
    permissions: [
      Permission.VIEW_SUPPORT_TICKETS,
      Permission.RESPOND_TO_TICKETS,
      Permission.RESOLVE_TICKETS,
      Permission.CLOSE_TICKETS,
    ],
  },
  ANALYTICS: {
    label: 'Analytics & Reports',
    permissions: [
      Permission.VIEW_ANALYTICS,
      Permission.EXPORT_REPORTS,
      Permission.VIEW_REVENUE,
    ],
  },
  SYSTEM_MANAGEMENT: {
    label: 'System Management',
    permissions: [
      Permission.MANAGE_ADMINS,
      Permission.MANAGE_SETTINGS,
      Permission.VIEW_SYSTEM_LOGS,
      Permission.MANAGE_FEATURE_FLAGS,
    ],
  },
} as const;

/**
 * Permission Labels
 */
export const PERMISSION_LABELS: Record<Permission, string> = {
  // User Management
  [Permission.VIEW_USERS]: 'View Users',
  [Permission.EDIT_USERS]: 'Edit Users',
  [Permission.SUSPEND_USERS]: 'Suspend Users',
  [Permission.DELETE_USERS]: 'Delete Users',
  [Permission.VERIFY_USERS]: 'Verify Users',

  // Property Management
  [Permission.VIEW_PROPERTIES]: 'View Properties',
  [Permission.APPROVE_PROPERTIES]: 'Approve Properties',
  [Permission.REJECT_PROPERTIES]: 'Reject Properties',
  [Permission.DELETE_PROPERTIES]: 'Delete Properties',
  [Permission.RESOLVE_BOUNDARY_DISPUTES]: 'Resolve Boundary Disputes',
  [Permission.RESOLVE_DUPLICATES]: 'Resolve Duplicate Listings',

  // Document Verification
  [Permission.VIEW_DOCUMENTS]: 'View Documents',
  [Permission.VERIFY_DOCUMENTS]: 'Verify Documents',
  [Permission.REJECT_DOCUMENTS]: 'Reject Documents',

  // Payment Management
  [Permission.VIEW_PAYMENTS]: 'View Payments',
  [Permission.PROCESS_REFUNDS]: 'Process Refunds',
  [Permission.RELEASE_PAYMENTS]: 'Release Held Payments',
  [Permission.VIEW_VIRTUAL_ACCOUNTS]: 'View Virtual Accounts',
  [Permission.MANAGE_VIRTUAL_ACCOUNTS]: 'Manage Virtual Accounts',

  // Marking Jobs
  [Permission.VIEW_MARKING_JOBS]: 'View Marking Jobs',
  [Permission.MANAGE_MARKING_QUEUE]: 'Manage Agent Queue',
  [Permission.REASSIGN_MARKING_JOBS]: 'Reassign Marking Jobs',
  [Permission.CANCEL_MARKING_JOBS]: 'Cancel Marking Jobs',
  [Permission.QUALITY_CHECK_MARKING]: 'Quality Check Markings',

  // Support
  [Permission.VIEW_SUPPORT_TICKETS]: 'View Support Tickets',
  [Permission.RESPOND_TO_TICKETS]: 'Respond to Tickets',
  [Permission.RESOLVE_TICKETS]: 'Resolve Tickets',
  [Permission.CLOSE_TICKETS]: 'Close Tickets',

  // Analytics
  [Permission.VIEW_ANALYTICS]: 'View Analytics',
  [Permission.EXPORT_REPORTS]: 'Export Reports',
  [Permission.VIEW_REVENUE]: 'View Revenue Data',

  // System Management
  [Permission.MANAGE_ADMINS]: 'Manage Administrators',
  [Permission.MANAGE_SETTINGS]: 'Manage Settings',
  [Permission.VIEW_SYSTEM_LOGS]: 'View System Logs',
  [Permission.MANAGE_FEATURE_FLAGS]: 'Manage Feature Flags',
};

/**
 * Permission Descriptions
 */
export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  // User Management
  [Permission.VIEW_USERS]: 'View user profiles and information',
  [Permission.EDIT_USERS]: 'Edit user details and settings',
  [Permission.SUSPEND_USERS]: 'Suspend or activate user accounts',
  [Permission.DELETE_USERS]: 'Permanently delete user accounts',
  [Permission.VERIFY_USERS]: 'Verify user identity documents',

  // Property Management
  [Permission.VIEW_PROPERTIES]: 'View property listings and details',
  [Permission.APPROVE_PROPERTIES]: 'Approve pending property listings',
  [Permission.REJECT_PROPERTIES]: 'Reject property listings',
  [Permission.DELETE_PROPERTIES]: 'Delete property listings',
  [Permission.RESOLVE_BOUNDARY_DISPUTES]: 'Resolve property boundary disputes',
  [Permission.RESOLVE_DUPLICATES]: 'Resolve duplicate property reports',

  // Document Verification
  [Permission.VIEW_DOCUMENTS]: 'View uploaded documents',
  [Permission.VERIFY_DOCUMENTS]: 'Approve verification documents',
  [Permission.REJECT_DOCUMENTS]: 'Reject verification documents',

  // Payment Management
  [Permission.VIEW_PAYMENTS]: 'View payment transactions',
  [Permission.PROCESS_REFUNDS]: 'Process payment refunds',
  [Permission.RELEASE_PAYMENTS]: 'Release held payments to recipients',
  [Permission.VIEW_VIRTUAL_ACCOUNTS]: 'View virtual account information',
  [Permission.MANAGE_VIRTUAL_ACCOUNTS]: 'Create and manage virtual accounts',

  // Marking Jobs
  [Permission.VIEW_MARKING_JOBS]: 'View property marking jobs',
  [Permission.MANAGE_MARKING_QUEUE]: 'Manage agent marking queue',
  [Permission.REASSIGN_MARKING_JOBS]: 'Reassign jobs to different agents',
  [Permission.CANCEL_MARKING_JOBS]: 'Cancel marking jobs',
  [Permission.QUALITY_CHECK_MARKING]: 'Review and approve completed markings',

  // Support
  [Permission.VIEW_SUPPORT_TICKETS]: 'View support tickets',
  [Permission.RESPOND_TO_TICKETS]: 'Respond to support tickets',
  [Permission.RESOLVE_TICKETS]: 'Mark tickets as resolved',
  [Permission.CLOSE_TICKETS]: 'Close support tickets',

  // Analytics
  [Permission.VIEW_ANALYTICS]: 'View platform analytics and metrics',
  [Permission.EXPORT_REPORTS]: 'Export analytics reports',
  [Permission.VIEW_REVENUE]: 'View revenue and financial data',

  // System Management
  [Permission.MANAGE_ADMINS]: 'Add, edit, and remove administrators',
  [Permission.MANAGE_SETTINGS]: 'Modify system settings',
  [Permission.VIEW_SYSTEM_LOGS]: 'View system activity logs',
  [Permission.MANAGE_FEATURE_FLAGS]: 'Enable/disable feature flags',
};

/**
 * Action-based permission checks
 */
export const ACTION_PERMISSIONS = {
  // User actions
  'users:view': [Permission.VIEW_USERS],
  'users:edit': [Permission.EDIT_USERS],
  'users:suspend': [Permission.SUSPEND_USERS],
  'users:delete': [Permission.DELETE_USERS],
  'users:verify': [Permission.VERIFY_USERS],

  // Property actions
  'properties:view': [Permission.VIEW_PROPERTIES],
  'properties:approve': [Permission.APPROVE_PROPERTIES],
  'properties:reject': [Permission.REJECT_PROPERTIES],
  'properties:delete': [Permission.DELETE_PROPERTIES],
  'properties:resolve-dispute': [Permission.RESOLVE_BOUNDARY_DISPUTES],
  'properties:resolve-duplicate': [Permission.RESOLVE_DUPLICATES],

  // Document actions
  'documents:view': [Permission.VIEW_DOCUMENTS],
  'documents:verify': [Permission.VERIFY_DOCUMENTS],
  'documents:reject': [Permission.REJECT_DOCUMENTS],

  // Payment actions
  'payments:view': [Permission.VIEW_PAYMENTS],
  'payments:refund': [Permission.PROCESS_REFUNDS],
  'payments:release': [Permission.RELEASE_PAYMENTS],
  'payments:view-accounts': [Permission.VIEW_VIRTUAL_ACCOUNTS],
  'payments:manage-accounts': [Permission.MANAGE_VIRTUAL_ACCOUNTS],

  // Marking job actions
  'marking:view': [Permission.VIEW_MARKING_JOBS],
  'marking:manage-queue': [Permission.MANAGE_MARKING_QUEUE],
  'marking:reassign': [Permission.REASSIGN_MARKING_JOBS],
  'marking:cancel': [Permission.CANCEL_MARKING_JOBS],
  'marking:quality-check': [Permission.QUALITY_CHECK_MARKING],

  // Support actions
  'support:view': [Permission.VIEW_SUPPORT_TICKETS],
  'support:respond': [Permission.RESPOND_TO_TICKETS],
  'support:resolve': [Permission.RESOLVE_TICKETS],
  'support:close': [Permission.CLOSE_TICKETS],

  // Analytics actions
  'analytics:view': [Permission.VIEW_ANALYTICS],
  'analytics:export': [Permission.EXPORT_REPORTS],
  'analytics:view-revenue': [Permission.VIEW_REVENUE],

  // System actions
  'system:manage-admins': [Permission.MANAGE_ADMINS],
  'system:manage-settings': [Permission.MANAGE_SETTINGS],
  'system:view-logs': [Permission.VIEW_SYSTEM_LOGS],
  'system:manage-flags': [Permission.MANAGE_FEATURE_FLAGS],
} as const;

/**
 * Check if admin has permission for a specific action
 */
export const canPerformAction = (
  adminRole: AdminRole,
  action: keyof typeof ACTION_PERMISSIONS,
  rolePermissions: Permission[]
): boolean => {
  const requiredPermissions = ACTION_PERMISSIONS[action];
  return requiredPermissions.some(permission => 
    rolePermissions.includes(permission)
  );
};

/**
 * Get all available actions for a role
 */
export const getAvailableActions = (
  adminRole: AdminRole,
  rolePermissions: Permission[]
): string[] => {
  return Object.keys(ACTION_PERMISSIONS).filter(action => 
    canPerformAction(adminRole, action as keyof typeof ACTION_PERMISSIONS, rolePermissions)
  );
};

/**
 * Permission validation rules
 */
export const PERMISSION_RULES = {
  // Minimum permissions required for basic admin access
  MINIMUM_PERMISSIONS: [
    Permission.VIEW_USERS,
    Permission.VIEW_PROPERTIES,
    Permission.VIEW_SUPPORT_TICKETS,
  ],

  // Critical permissions that require extra confirmation
  CRITICAL_PERMISSIONS: [
    Permission.DELETE_USERS,
    Permission.DELETE_PROPERTIES,
    Permission.MANAGE_ADMINS,
    Permission.MANAGE_SETTINGS,
  ],

  // Permissions that can be delegated
  DELEGATABLE_PERMISSIONS: [
    Permission.VIEW_USERS,
    Permission.VIEW_PROPERTIES,
    Permission.VIEW_DOCUMENTS,
    Permission.VIEW_PAYMENTS,
    Permission.VIEW_SUPPORT_TICKETS,
    Permission.RESPOND_TO_TICKETS,
  ],
} as const;