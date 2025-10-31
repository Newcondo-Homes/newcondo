// apps/admin/src/lib/validations/admin.ts

import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// ============================================
// apps/admin/src/lib/validations/verification.ts

import { z } from 'zod';

export const approveDocumentSchema = z.object({
  documentId: z.string().cuid(),
  notes: z.string().optional()
});

export const rejectDocumentSchema = z.object({
  documentId: z.string().cuid(),
  reason: z.string().min(10, 'Rejection reason must be at least 10 characters')
});

export const bulkApproveSchema = z.object({
  documentIds: z.array(z.string().cuid()).min(1, 'Select at least one document')
});

export type ApproveDocumentInput = z.infer<typeof approveDocumentSchema>;
export type RejectDocumentInput = z.infer<typeof rejectDocumentSchema>;

// ============================================
// apps/admin/src/lib/validations/propertyApproval.ts

import { z } from 'zod';

export const approvePropertySchema = z.object({
  propertyId: z.string().cuid(),
  notes: z.string().optional()
});

export const rejectPropertySchema = z.object({
  propertyId: z.string().cuid(),
  reason: z.string().min(20, 'Rejection reason must be at least 20 characters')
});

export const verifyBoundarySchema = z.object({
  propertyId: z.string().cuid(),
  verified: z.boolean()
});

export type ApprovePropertyInput = z.infer<typeof approvePropertySchema>;
export type RejectPropertyInput = z.infer<typeof rejectPropertySchema>;

// ============================================
// apps/admin/src/lib/validations/dispute.ts

import { z } from 'zod';

export const resolveDisputeSchema = z.object({
  disputeId: z.string().cuid(),
  resolution: z.string().min(20, 'Resolution must be at least 20 characters'),
  actionTaken: z.enum([
    'APPROVED_ORIGINAL',
    'APPROVED_DISPUTED',
    'REQUIRED_REMARKING',
    'MERGED_PROPERTIES',
    'OTHER'
  ])
});

export const mergePropertiesSchema = z.object({
  propertyIds: z.array(z.string().cuid()).min(2, 'Select at least 2 properties'),
  primaryPropertyId: z.string().cuid()
});

export type ResolveDisputeInput = z.infer<typeof resolveDisputeSchema>;

// ============================================
// apps/admin/src/lib/validations/markingJob.ts

import { z } from 'zod';

export const reviewJobSchema = z.object({
  jobId: z.string().cuid(),
  approved: z.boolean(),
  qualityScore: z.number().min(1).max(5).optional(),
  feedback: z.string().optional()
});

export const assignJobSchema = z.object({
  jobId: z.string().cuid(),
  agentId: z.string().cuid()
});

export type ReviewJobInput = z.infer<typeof reviewJobSchema>;

// ============================================
// apps/admin/src/lib/validations/support.ts

import { z } from 'zod';

export const respondToTicketSchema = z.object({
  ticketId: z.string().cuid(),
  response: z.string().min(10, 'Response must be at least 10 characters'),
  internal: z.boolean().optional()
});

export const resolveTicketSchema = z.object({
  ticketId: z.string().cuid(),
  resolution: z.string().min(20, 'Resolution must be at least 20 characters')
});

export type RespondToTicketInput = z.infer<typeof respondToTicketSchema>;
export type ResolveTicketInput = z.infer<typeof resolveTicketSchema>;

// ============================================
// apps/admin/src/lib/validations/index.ts

export * from './admin';
export * from './verification';
export * from './propertyApproval';
export * from './dispute';
export * from './markingJob';
export * from './support';

// ============================================
// apps/admin/src/lib/constants/routes.ts

export const ADMIN_ROUTES = {
  // Auth
  LOGIN: '/login',
  
  // Dashboard
  DASHBOARD: '/dashboard',
  
  // User Management
  USERS: '/users',
  USER_DETAILS: (id: string) => `/users/${id}`,
  
  // Verifications
  VERIFICATIONS: '/verifications',
  VERIFICATION_DETAILS: (id: string) => `/verifications/${id}`,
  
  // Properties
  PROPERTIES: '/properties',
  PROPERTY_DETAILS: (id: string) => `/properties/${id}`,
  
  // Disputes
  DISPUTES: '/disputes',
  DISPUTE_DETAILS: (id: string) => `/disputes/${id}`,
  
  // Marking Jobs
  MARKING_JOBS: '/marking-jobs',
  MARKING_JOB_DETAILS: (id: string) => `/marking-jobs/${id}`,
  
  // Payments
  PAYMENTS: '/payments',
  PAYMENT_DETAILS: (id: string) => `/payments/${id}`,
  VIRTUAL_ACCOUNTS: '/virtual-accounts',
  
  // Support
  SUPPORT: '/support',
  TICKET_DETAILS: (id: string) => `/support/${id}`,
  
  // Analytics
  ANALYTICS: '/analytics',
  
  // Settings
  SETTINGS: '/settings',
  PROFILE: '/profile'
} as const;

// ============================================
// apps/admin/src/lib/constants/roles.ts

export const USER_ROLES = {
  OWNER: 'OWNER',
  AGENT: 'AGENT',
  RENTER: 'RENTER',
  ADMIN: 'ADMIN'
} as const;

export const ADMIN_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  OPERATIONS_ADMIN: 'OPERATIONS_ADMIN',
  FINANCE_ADMIN: 'FINANCE_ADMIN',
  SUPPORT_ADMIN: 'SUPPORT_ADMIN',
  QUALITY_ADMIN: 'QUALITY_ADMIN'
} as const;

// ============================================
// apps/admin/src/lib/constants/status.ts

export const VERIFICATION_STATUS = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED'
} as const;

export const DOCUMENT_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED'
} as const;

export const PROPERTY_STATUS = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  PUBLISHED: 'PUBLISHED',
  RENTED: 'RENTED',
  UNAVAILABLE: 'UNAVAILABLE'
} as const;

export const APPROVAL_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
  HELD: 'HELD',
  RELEASED: 'RELEASED'
} as const;

export const TICKET_STATUS = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED'
} as const;

export const MARKING_JOB_STATUS = {
  QUEUED: 'QUEUED',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED'
} as const;

// ============================================
// apps/admin/src/lib/constants/permissions.ts

export const PERMISSIONS = {
  // User Management
  VIEW_USERS: 'VIEW_USERS',
  VERIFY_USERS: 'VERIFY_USERS',
  SUSPEND_USERS: 'SUSPEND_USERS',
  DELETE_USERS: 'DELETE_USERS',
  
  // Property Management
  VIEW_PROPERTIES: 'VIEW_PROPERTIES',
  APPROVE_PROPERTIES: 'APPROVE_PROPERTIES',
  REJECT_PROPERTIES: 'REJECT_PROPERTIES',
  DELETE_PROPERTIES: 'DELETE_PROPERTIES',
  RESOLVE_DUPLICATES: 'RESOLVE_DUPLICATES',
  
  // Payment Management
  VIEW_PAYMENTS: 'VIEW_PAYMENTS',
  PROCESS_REFUNDS: 'PROCESS_REFUNDS',
  MANAGE_VIRTUAL_ACCOUNTS: 'MANAGE_VIRTUAL_ACCOUNTS',
  VIEW_FINANCIAL_REPORTS: 'VIEW_FINANCIAL_REPORTS',
  
  // Marking Job Oversight
  VIEW_MARKING_JOBS: 'VIEW_MARKING_JOBS',
  ASSIGN_MARKING_JOBS: 'ASSIGN_MARKING_JOBS',
  REVIEW_MARKING_JOBS: 'REVIEW_MARKING_JOBS',
  SUSPEND_AGENTS: 'SUSPEND_AGENTS',
  
  // Support & Disputes
  VIEW_SUPPORT_TICKETS: 'VIEW_SUPPORT_TICKETS',
  RESOLVE_SUPPORT_TICKETS: 'RESOLVE_SUPPORT_TICKETS',
  RESOLVE_BOUNDARY_DISPUTES: 'RESOLVE_BOUNDARY_DISPUTES',
  
  // Analytics & Reporting
  VIEW_ANALYTICS: 'VIEW_ANALYTICS',
  EXPORT_DATA: 'EXPORT_DATA',
  GENERATE_REPORTS: 'GENERATE_REPORTS',
  
  // System Administration
  MANAGE_ADMINS: 'MANAGE_ADMINS',
  CONFIGURE_SYSTEM: 'CONFIGURE_SYSTEM',
  VIEW_AUDIT_LOGS: 'VIEW_AUDIT_LOGS'
} as const;

// ============================================
// apps/admin/src/lib/constants/filters.ts

export const SORT_OPTIONS = {
  DATE_DESC: { label: 'Newest First', value: 'createdAt:desc' },
  DATE_ASC: { label: 'Oldest First', value: 'createdAt:asc' },
  NAME_ASC: { label: 'Name A-Z', value: 'name:asc' },
  NAME_DESC: { label: 'Name Z-A', value: 'name:desc' },
  AMOUNT_DESC: { label: 'Highest Amount', value: 'amount:desc' },
  AMOUNT_ASC: { label: 'Lowest Amount', value: 'amount:asc' }
} as const;

export const PAGE_SIZES = [10, 20, 50, 100] as const;

export const DATE_RANGES = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  LAST_7_DAYS: 'last_7_days',
  LAST_30_DAYS: 'last_30_days',
  THIS_MONTH: 'this_month',
  LAST_MONTH: 'last_month',
  CUSTOM: 'custom'
} as const;

// ============================================
// apps/admin/src/lib/constants/index.ts

export * from './routes';
export * from './roles';
export * from './status';
export * from './permissions';
export * from './filters';

// ============================================
// apps/admin/src/lib/utils/format.ts

export const formatCurrency = (amount: number, currency = 'NGN'): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

export const formatDate = (date: Date | string, includeTime = true): string => {
  const d = new Date(date);
  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    ...(includeTime && { timeStyle: 'short' })
  }).format(d);
};

export const formatRelativeTime = (date: Date | string): string => {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(d, false);
};

export const formatNumber = (num: number, decimals = 0): string => {
  return new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
};

export const formatPercentage = (value: number, decimals = 1): string => {
  return `${formatNumber(value, decimals)}%`;
};

// ============================================
// apps/admin/src/lib/utils/permissions.ts

import { PERMISSIONS } from '../constants/permissions';

export const can = (
  userPermissions: string[],
  requiredPermission: string
): boolean => {
  return userPermissions.includes(requiredPermission);
};

export const canAny = (
  userPermissions: string[],
  requiredPermissions: string[]
): boolean => {
  return requiredPermissions.some(p => userPermissions.includes(p));
};

export const canAll = (
  userPermissions: string[],
  requiredPermissions: string[]
): boolean => {
  return requiredPermissions.every(p => userPermissions.includes(p));
};

// ============================================
// apps/admin/src/lib/utils/helpers.ts

export const truncate = (str: string, length: number): string => {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
};

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// ============================================
// apps/admin/src/lib/utils/dateUtils.ts

export const getDateRange = (range: string) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (range) {
    case 'today':
      return { startDate: today, endDate: now };
    
    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { startDate: yesterday, endDate: today };
    
    case 'last_7_days':
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return { startDate: weekAgo, endDate: now };
    
    case 'last_30_days':
      const monthAgo = new Date(today);
      monthAgo.setDate(monthAgo.getDate() - 30);
      return { startDate: monthAgo, endDate: now };
    
    case 'this_month':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: monthStart, endDate: now };
    
    case 'last_month':
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: lastMonthStart, endDate: lastMonthEnd };
    
    default:
      return { startDate: today, endDate: now };
  }
};

export const isValidDate = (date: any): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};

// ============================================
// apps/admin/src/lib/utils/exportUtils.ts

export const convertToCSV = (data: any[], columns: string[]): string => {
  const headers = columns.join(',');
  const rows = data.map(item =>
    columns.map(col => {
      const value = item[col];
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',')
  );
  return [headers, ...rows].join('\n');
};

// ============================================
// apps/admin/src/lib/utils/chartUtils.ts

export const generateChartColors = (count: number): string[] => {
  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
  ];
  
  if (count <= colors.length) {
    return colors.slice(0, count);
  }
  
  // Generate additional colors if needed
  const additional = [];
  for (let i = 0; i < count - colors.length; i++) {
    const hue = (i * 360 / (count - colors.length)) % 360;
    additional.push(`hsl(${hue}, 70%, 60%)`);
  }
  
  return [...colors, ...additional];
};

export const formatChartData = (
  data: any[],
  xKey: string,
  yKey: string
): Array<{ x: any; y: any }> => {
  return data.map(item => ({
    x: item[xKey],
    y: item[yKey]
  }));
};

// ============================================
// apps/admin/src/lib/utils/index.ts

export * from './format';
export * from './permissions';
export * from './helpers';
export * from './dateUtils';
export * from './exportUtils';
export * from './chartUtils';