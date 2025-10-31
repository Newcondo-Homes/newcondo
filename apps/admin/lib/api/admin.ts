// apps/admin/src/lib/api/admin.ts

import { get, post, del } from './client';
import { ApiResponse } from './client';

interface LoginCredentials {
  email: string;
  password: string;
}

interface AdminProfile {
  id: string;
  name: string | null;
  email: string;
  role: string;
  permissions: string[];
  createdAt: string;
  lastLogin?: string;
}

interface AdminStatistics {
  totalUsers: number;
  pendingVerifications: number;
  pendingProperties: number;
  activeMarkingJobs: number;
  openSupportTickets: number;
  totalRevenue: number;
  revenueThisMonth: number;
}

interface AuditLog {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  description: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
  admin: {
    id: string;
    name: string | null;
    email: string;
  };
}

/**
 * Admin API methods
 */
export const adminApi = {
  /**
   * Admin authentication
   */
  login: async (credentials: LoginCredentials): Promise<ApiResponse<{
    admin: AdminProfile;
    token: string;
  }>> => {
    return post('/auth/login', credentials);
  },

  logout: async (): Promise<ApiResponse> => {
    return post('/auth/logout');
  },

  getProfile: async (): Promise<ApiResponse<AdminProfile>> => {
    return get('/profile');
  },

  updateProfile: async (data: Partial<AdminProfile>): Promise<ApiResponse<AdminProfile>> => {
    return post('/profile', data);
  },

  changePassword: async (
    currentPassword: string,
    newPassword: string
  ): Promise<ApiResponse> => {
    return post('/profile/change-password', {
      currentPassword,
      newPassword
    });
  },

  /**
   * Dashboard statistics
   */
  getDashboardStats: async (
    dateRange?: { startDate: string; endDate: string }
  ): Promise<ApiResponse<AdminStatistics>> => {
    return get('/dashboard/stats', {
      params: dateRange
    });
  },

  /**
   * Audit logs
   */
  getAuditLogs: async (filters?: {
    page?: number;
    limit?: number;
    action?: string;
    targetType?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<{
    logs: AuditLog[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>> => {
    return get('/audit-logs', { params: filters });
  },

  getResourceAuditLogs: async (
    targetType: string,
    targetId: string
  ): Promise<ApiResponse<AuditLog[]>> => {
    return get(`/audit-logs/${targetType}/${targetId}`);
  },

  /**
   * Admin management (super admin only)
   */
  getAllAdmins: async (): Promise<ApiResponse<AdminProfile[]>> => {
    return get('/admins');
  },

  createAdmin: async (data: {
    email: string;
    name: string;
    password: string;
    permissions: string[];
  }): Promise<ApiResponse<AdminProfile>> => {
    return post('/admins', data);
  },

  updateAdminPermissions: async (
    adminId: string,
    permissions: string[]
  ): Promise<ApiResponse> => {
    return post(`/admins/${adminId}/permissions`, { permissions });
  },

  deleteAdmin: async (adminId: string): Promise<ApiResponse> => {
    return del(`/admins/${adminId}`);
  },

  /**
   * System configuration
   */
  getSystemConfig: async (): Promise<ApiResponse<Record<string, any>>> => {
    return get('/config');
  },

  updateSystemConfig: async (
    config: Record<string, any>
  ): Promise<ApiResponse> => {
    return post('/config', config);
  },

  /**
   * Notifications
   */
  getNotifications: async (filters?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }): Promise<ApiResponse<{
    notifications: any[];
    unreadCount: number;
    pagination: any;
  }>> => {
    return get('/notifications', { params: filters });
  },

  markNotificationAsRead: async (notificationId: string): Promise<ApiResponse> => {
    return post(`/notifications/${notificationId}/read`);
  },

  markAllNotificationsAsRead: async (): Promise<ApiResponse> => {
    return post('/notifications/read-all');
  }
};

export default adminApi;