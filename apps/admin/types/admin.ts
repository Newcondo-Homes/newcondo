/**
 * Admin Dashboard - Admin Types
 * Location: apps/admin/src/types/admin.ts
 */

export enum AdminRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  MODERATOR = "MODERATOR",
  SUPPORT = "SUPPORT",
}

export enum AdminPermission {
  // User Management
  MANAGE_USERS = "MANAGE_USERS",
  VERIFY_USERS = "VERIFY_USERS",
  SUSPEND_USERS = "SUSPEND_USERS",
  DELETE_USERS = "DELETE_USERS",

  // Property Management
  APPROVE_PROPERTIES = "APPROVE_PROPERTIES",
  REJECT_PROPERTIES = "REJECT_PROPERTIES",
  DELETE_PROPERTIES = "DELETE_PROPERTIES",
  MANAGE_BOUNDARIES = "MANAGE_BOUNDARIES",

  // Payment Management
  VIEW_PAYMENTS = "VIEW_PAYMENTS",
  PROCESS_REFUNDS = "PROCESS_REFUNDS",
  MANAGE_VIRTUAL_ACCOUNTS = "MANAGE_VIRTUAL_ACCOUNTS",

  // Dispute Resolution
  RESOLVE_BOUNDARY_DISPUTES = "RESOLVE_BOUNDARY_DISPUTES",
  RESOLVE_DUPLICATE_DISPUTES = "RESOLVE_DUPLICATE_DISPUTES",

  // Marking Jobs
  OVERSEE_MARKING_JOBS = "OVERSEE_MARKING_JOBS",
  ASSIGN_MARKING_JOBS = "ASSIGN_MARKING_JOBS",
  MANAGE_AGENT_QUEUE = "MANAGE_AGENT_QUEUE",

  // Support
  MANAGE_TICKETS = "MANAGE_TICKETS",
  RESPOND_TO_TICKETS = "RESPOND_TO_TICKETS",

  // Analytics & Reports
  VIEW_ANALYTICS = "VIEW_ANALYTICS",
  GENERATE_REPORTS = "GENERATE_REPORTS",

  // System
  MANAGE_FEATURE_FLAGS = "MANAGE_FEATURE_FLAGS",
  VIEW_LOGS = "VIEW_LOGS",
}

export interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: AdminRole;
  permissions: AdminPermission[];
  image: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminSession {
  admin: AdminUser;
  token: string;
  expiresAt: Date;
}

export interface AdminActivity {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetType: string;
  targetId: string;
  description: string | null;
  metadata: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface AdminStats {
  totalUsers: number;
  pendingVerifications: number;
  pendingProperties: number;
  activeRentals: number;
  totalRevenue: number;
  openTickets: number;
  pendingMarkingJobs: number;
  boundaryDisputes: number;
}

export interface AdminFilters {
  search?: string;
  status?: string;
  role?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface AdminActionLog {
  id: string;
  adminId: string;
  action: AdminActionType;
  targetType: string;
  targetId: string;
  description: string | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
}

export enum AdminActionType {
  USER_VERIFIED = "USER_VERIFIED",
  USER_REJECTED = "USER_REJECTED",
  USER_SUSPENDED = "USER_SUSPENDED",
  PROPERTY_APPROVED = "PROPERTY_APPROVED",
  PROPERTY_REJECTED = "PROPERTY_REJECTED",
  PROPERTY_DELETED = "PROPERTY_DELETED",
  PAYMENT_REFUNDED = "PAYMENT_REFUNDED",
  DUPLICATE_RESOLVED = "DUPLICATE_RESOLVED",
  BOUNDARY_DISPUTE_RESOLVED = "BOUNDARY_DISPUTE_RESOLVED",
  TICKET_RESOLVED = "TICKET_RESOLVED",
  AGENT_SUSPENDED = "AGENT_SUSPENDED",
  MARKING_JOB_ASSIGNED = "MARKING_JOB_ASSIGNED",
  MARKING_JOB_COMPLETED = "MARKING_JOB_COMPLETED",
}