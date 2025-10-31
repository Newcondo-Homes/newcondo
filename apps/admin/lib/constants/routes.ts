// apps/admin/src/lib/constants/routes.ts

/**
 * Admin Dashboard Route Constants
 * Centralized route definitions for the admin dashboard
 */

export const ADMIN_ROUTES = {
  // Authentication
  AUTH: {
    LOGIN: '/login',
    LOGOUT: '/logout',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
  },

  // Dashboard
  DASHBOARD: {
    HOME: '/dashboard',
    OVERVIEW: '/dashboard',
  },

  // User Management
  USERS: {
    LIST: '/users',
    DETAILS: (id: string) => `/users/${id}`,
    VERIFICATION: '/users/verification',
    VERIFICATION_DETAILS: (id: string) => `/users/verification/${id}`,
    EDIT: (id: string) => `/users/${id}/edit`,
    SUSPEND: (id: string) => `/users/${id}/suspend`,
    ACTIVATE: (id: string) => `/users/${id}/activate`,
  },

  // Property Management
  PROPERTIES: {
    LIST: '/properties',
    PENDING: '/properties/pending',
    APPROVED: '/properties/approved',
    REJECTED: '/properties/rejected',
    DETAILS: (id: string) => `/properties/${id}`,
    APPROVE: (id: string) => `/properties/${id}/approve`,
    REJECT: (id: string) => `/properties/${id}/reject`,
    BOUNDARY_DISPUTES: '/properties/boundary-disputes',
    BOUNDARY_DISPUTE_DETAILS: (id: string) => `/properties/boundary-disputes/${id}`,
    DUPLICATES: '/properties/duplicates',
    DUPLICATE_DETAILS: (id: string) => `/properties/duplicates/${id}`,
  },

  // Property Marking Management
  MARKING: {
    JOBS: '/marking/jobs',
    JOB_DETAILS: (id: string) => `/marking/jobs/${id}`,
    QUEUE: '/marking/queue',
    AGENTS: '/marking/agents',
    AGENT_DETAILS: (id: string) => `/marking/agents/${id}`,
    OVERSIGHT: '/marking/oversight',
    QUALITY_CONTROL: '/marking/quality-control',
    ASSIGNMENTS: '/marking/assignments',
  },

  // Document Verification
  VERIFICATIONS: {
    PENDING: '/verifications',
    DOCUMENTS: '/verifications/documents',
    DOCUMENT_DETAILS: (userId: string, docId: string) => 
      `/verifications/documents/${userId}/${docId}`,
    USER_DOCUMENTS: (userId: string) => `/verifications/documents/${userId}`,
    APPROVE: (docId: string) => `/verifications/documents/${docId}/approve`,
    REJECT: (docId: string) => `/verifications/documents/${docId}/reject`,
  },

  // Payment Management
  PAYMENTS: {
    LIST: '/payments',
    TRANSACTIONS: '/payments/transactions',
    TRANSACTION_DETAILS: (id: string) => `/payments/transactions/${id}`,
    PENDING_CONFIRMATIONS: '/payments/pending-confirmations',
    REFUNDS: '/payments/refunds',
    VIRTUAL_ACCOUNTS: '/payments/virtual-accounts',
    VIRTUAL_ACCOUNT_DETAILS: (id: string) => `/payments/virtual-accounts/${id}`,
    MARKING_PAYMENTS: '/payments/marking',
  },

  // Analytics
  ANALYTICS: {
    OVERVIEW: '/analytics',
    USERS: '/analytics/users',
    PROPERTIES: '/analytics/properties',
    PAYMENTS: '/analytics/payments',
    MARKING_JOBS: '/analytics/marking-jobs',
    REVENUE: '/analytics/revenue',
    REPORTS: '/analytics/reports',
  },

  // Support Management
  SUPPORT: {
    TICKETS: '/support',
    TICKET_DETAILS: (id: string) => `/support/${id}`,
    OPEN: '/support/open',
    IN_PROGRESS: '/support/in-progress',
    RESOLVED: '/support/resolved',
  },

  // System Settings
  SETTINGS: {
    GENERAL: '/settings',
    ADMINS: '/settings/admins',
    PERMISSIONS: '/settings/permissions',
    FEATURE_FLAGS: '/settings/feature-flags',
    SYSTEM_LOGS: '/settings/system-logs',
  },
} as const;

/**
 * API Route Constants
 */
export const API_ROUTES = {
  BASE_URL: process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:4004/api/v1',

  // Admin Auth
  AUTH: {
    LOGIN: '/admin/auth/login',
    LOGOUT: '/admin/auth/logout',
    REFRESH: '/admin/auth/refresh',
    VERIFY: '/admin/auth/verify',
  },

  // User Management
  USERS: {
    LIST: '/admin/users',
    DETAILS: (id: string) => `/admin/users/${id}`,
    VERIFY: (id: string) => `/admin/users/${id}/verify`,
    REJECT: (id: string) => `/admin/users/${id}/reject`,
    SUSPEND: (id: string) => `/admin/users/${id}/suspend`,
    ACTIVATE: (id: string) => `/admin/users/${id}/activate`,
    STATS: '/admin/users/stats',
  },

  // Property Management
  PROPERTIES: {
    LIST: '/admin/properties',
    DETAILS: (id: string) => `/admin/properties/${id}`,
    APPROVE: (id: string) => `/admin/properties/${id}/approve`,
    REJECT: (id: string) => `/admin/properties/${id}/reject`,
    STATS: '/admin/properties/stats',
    BOUNDARY_DISPUTES: '/admin/properties/boundary-disputes',
    RESOLVE_DISPUTE: (id: string) => `/admin/properties/boundary-disputes/${id}/resolve`,
    DUPLICATES: '/admin/properties/duplicates',
    RESOLVE_DUPLICATE: (id: string) => `/admin/properties/duplicates/${id}/resolve`,
  },

  // Document Verification
  DOCUMENTS: {
    LIST: '/admin/documents',
    DETAILS: (id: string) => `/admin/documents/${id}`,
    APPROVE: (id: string) => `/admin/documents/${id}/approve`,
    REJECT: (id: string) => `/admin/documents/${id}/reject`,
    USER_DOCUMENTS: (userId: string) => `/admin/documents/user/${userId}`,
  },

  // Marking Jobs
  MARKING: {
    JOBS: '/admin/marking/jobs',
    JOB_DETAILS: (id: string) => `/admin/marking/jobs/${id}`,
    QUEUE: '/admin/marking/queue',
    AGENTS: '/admin/marking/agents',
    AGENT_DETAILS: (id: string) => `/admin/marking/agents/${id}`,
    REASSIGN: (jobId: string) => `/admin/marking/jobs/${jobId}/reassign`,
    CANCEL: (jobId: string) => `/admin/marking/jobs/${jobId}/cancel`,
    QUALITY_CHECK: (jobId: string) => `/admin/marking/jobs/${jobId}/quality-check`,
  },

  // Payments
  PAYMENTS: {
    LIST: '/admin/payments',
    DETAILS: (id: string) => `/admin/payments/${id}`,
    REFUND: (id: string) => `/admin/payments/${id}/refund`,
    RELEASE: (id: string) => `/admin/payments/${id}/release`,
    STATS: '/admin/payments/stats',
    VIRTUAL_ACCOUNTS: '/admin/payments/virtual-accounts',
  },

  // Analytics
  ANALYTICS: {
    DASHBOARD: '/admin/analytics/dashboard',
    USERS: '/admin/analytics/users',
    PROPERTIES: '/admin/analytics/properties',
    PAYMENTS: '/admin/analytics/payments',
    MARKING: '/admin/analytics/marking',
    REPORTS: '/admin/analytics/reports',
    EXPORT: '/admin/analytics/export',
  },

  // Support
  SUPPORT: {
    TICKETS: '/admin/support/tickets',
    TICKET_DETAILS: (id: string) => `/admin/support/tickets/${id}`,
    RESPOND: (id: string) => `/admin/support/tickets/${id}/respond`,
    RESOLVE: (id: string) => `/admin/support/tickets/${id}/resolve`,
    CLOSE: (id: string) => `/admin/support/tickets/${id}/close`,
  },
} as const;

/**
 * Route Helpers
 */
export const getRouteTitle = (pathname: string): string => {
  const routeTitles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/users': 'Users',
    '/users/verification': 'User Verification',
    '/properties': 'Properties',
    '/properties/pending': 'Pending Properties',
    '/properties/boundary-disputes': 'Boundary Disputes',
    '/properties/duplicates': 'Duplicate Properties',
    '/marking/jobs': 'Marking Jobs',
    '/marking/queue': 'Agent Queue',
    '/marking/agents': 'Marking Agents',
    '/marking/oversight': 'Marking Oversight',
    '/verifications': 'Document Verification',
    '/payments': 'Payments',
    '/payments/transactions': 'Transactions',
    '/payments/virtual-accounts': 'Virtual Accounts',
    '/analytics': 'Analytics',
    '/support': 'Support Tickets',
    '/settings': 'Settings',
  };

  return routeTitles[pathname] || 'Admin Dashboard';
};

/**
 * Check if route requires admin authentication
 */
export const isProtectedRoute = (pathname: string): boolean => {
  return !pathname.startsWith('/login') && 
         !pathname.startsWith('/forgot-password') &&
         !pathname.startsWith('/reset-password');
};

/**
 * Get breadcrumb items for a given pathname
 */
export const getBreadcrumbs = (pathname: string): Array<{ label: string; href: string }> => {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: Array<{ label: string; href: string }> = [
    { label: 'Dashboard', href: '/dashboard' },
  ];

  let currentPath = '';
  segments.forEach((segment, index) => {
    if (segment === 'dashboard') return; // Skip dashboard as it's already added

    currentPath += `/${segment}`;
    const label = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    breadcrumbs.push({
      label,
      href: currentPath,
    });
  });

  return breadcrumbs;
};