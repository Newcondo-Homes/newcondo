// backend/admin-service/src/types/admin.ts

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN';
  permissions: AdminPermission[];
  createdAt: Date;
}

export enum AdminPermission {
  // User management
  VIEW_USERS = 'VIEW_USERS',
  VERIFY_USERS = 'VERIFY_USERS',
  SUSPEND_USERS = 'SUSPEND_USERS',
  DELETE_USERS = 'DELETE_USERS',
  
  // Property management
  VIEW_PROPERTIES = 'VIEW_PROPERTIES',
  APPROVE_PROPERTIES = 'APPROVE_PROPERTIES',
  REJECT_PROPERTIES = 'REJECT_PROPERTIES',
  DELETE_PROPERTIES = 'DELETE_PROPERTIES',
  RESOLVE_DUPLICATES = 'RESOLVE_DUPLICATES',
  MANAGE_DISPUTES = 'MANAGE_DISPUTES',
  
  // Payment management
  VIEW_PAYMENTS = 'VIEW_PAYMENTS',
  PROCESS_REFUNDS = 'PROCESS_REFUNDS',
  MANAGE_VIRTUAL_ACCOUNTS = 'MANAGE_VIRTUAL_ACCOUNTS',
  VIEW_FINANCIAL_REPORTS = 'VIEW_FINANCIAL_REPORTS',
  
  // Marking job oversight
  VIEW_MARKING_JOBS = 'VIEW_MARKING_JOBS',
  ASSIGN_MARKING_JOBS = 'ASSIGN_MARKING_JOBS',
  REVIEW_MARKING_JOBS = 'REVIEW_MARKING_JOBS',
  SUSPEND_AGENTS = 'SUSPEND_AGENTS',
  
  // Support & disputes
  VIEW_SUPPORT_TICKETS = 'VIEW_SUPPORT_TICKETS',
  RESOLVE_SUPPORT_TICKETS = 'RESOLVE_SUPPORT_TICKETS',
  RESOLVE_BOUNDARY_DISPUTES = 'RESOLVE_BOUNDARY_DISPUTES',
  
  // Analytics & reporting
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',
  EXPORT_DATA = 'EXPORT_DATA',
  GENERATE_REPORTS = 'GENERATE_REPORTS',
  // agents
  MANAGE_AGENTS = 'MANAGE_AGENTS',
  SUPER_ADMIN = 'SUPER_ADMIN',

  // System administration
  MANAGE_ADMINS = 'MANAGE_ADMINS',
  CONFIGURE_SYSTEM = 'CONFIGURE_SYSTEM',
  VIEW_AUDIT_LOGS = 'VIEW_AUDIT_LOGS'
}

// export enum AdminPermission {
//   VIEW_USERS = 'VIEW_USERS',
//   MANAGE_USERS = 'MANAGE_USERS',
//   VIEW_PROPERTIES = 'VIEW_PROPERTIES',
//   APPROVE_PROPERTIES = 'APPROVE_PROPERTIES',
//   VIEW_PAYMENTS = 'VIEW_PAYMENTS',
//   MANAGE_PAYMENTS = 'MANAGE_PAYMENTS',
//   VIEW_VERIFICATIONS = 'VIEW_VERIFICATIONS',
//   APPROVE_VERIFICATIONS = 'APPROVE_VERIFICATIONS',
//   MANAGE_DISPUTES = 'MANAGE_DISPUTES',
//   MANAGE_MARKING_JOBS = 'MANAGE_MARKING_JOBS',
//   VIEW_ANALYTICS = 'VIEW_ANALYTICS',
//   MANAGE_SUPPORT = 'MANAGE_SUPPORT',
//   MANAGE_AGENTS = 'MANAGE_AGENTS',
//   SUPER_ADMIN = 'SUPER_ADMIN',
// }

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  token: string;
  refreshToken: string;
  admin: AdminUser;
}

export interface AdminDashboardStats {
  pendingVerifications: number;
  pendingProperties: number;
  pendingMarkingJobs: number;
  activeSupportTickets: number;
  todayTransactions: number;
  todayRevenue: number;
  activeUsers: number;
  activeProperties: number;
}

export interface AdminNotification {
  id: string;
  type: AdminNotificationType;
  title: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  isRead: boolean;
  actionUrl?: string;
  createdAt: Date;
}

export enum AdminNotificationType {
  NEW_USER_REGISTRATION = 'NEW_USER_REGISTRATION',
  VERIFICATION_PENDING = 'VERIFICATION_PENDING',
  PROPERTY_PENDING_APPROVAL = 'PROPERTY_PENDING_APPROVAL',
  MARKING_JOB_CREATED = 'MARKING_JOB_CREATED',
  DISPUTE_RAISED = 'DISPUTE_RAISED',
  SUPPORT_TICKET_CREATED = 'SUPPORT_TICKET_CREATED',
  PAYMENT_ISSUE = 'PAYMENT_ISSUE',
  AGENT_REPORTED = 'AGENT_REPORTED',
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminFilterParams {
  search?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  category?: string;
}