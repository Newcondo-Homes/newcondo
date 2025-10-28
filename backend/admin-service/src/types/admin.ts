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
  VIEW_USERS = 'VIEW_USERS',
  MANAGE_USERS = 'MANAGE_USERS',
  VIEW_PROPERTIES = 'VIEW_PROPERTIES',
  APPROVE_PROPERTIES = 'APPROVE_PROPERTIES',
  VIEW_PAYMENTS = 'VIEW_PAYMENTS',
  MANAGE_PAYMENTS = 'MANAGE_PAYMENTS',
  VIEW_VERIFICATIONS = 'VIEW_VERIFICATIONS',
  APPROVE_VERIFICATIONS = 'APPROVE_VERIFICATIONS',
  MANAGE_DISPUTES = 'MANAGE_DISPUTES',
  MANAGE_MARKING_JOBS = 'MANAGE_MARKING_JOBS',
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',
  MANAGE_SUPPORT = 'MANAGE_SUPPORT',
  MANAGE_AGENTS = 'MANAGE_AGENTS',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

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