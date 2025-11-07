import { apiClient } from './client';

export interface UserFilters {
  role?: string;
  verificationStatus?: string;
  searchQuery?: string;
  dateFrom?: Date;
  dateTo?: Date;
  isPremium?: boolean;
  isB2BCustomer?: boolean;
}

export interface User {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  userType: string | null;
  verificationStatus: string;
  isPremium: boolean;
  isB2BCustomer: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  propertiesCount?: number;
  transactionsCount?: number;
  totalRevenue?: number;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  verifiedUsers: number;
  pendingVerifications: number;
  premiumUsers: number;
  b2bCustomers: number;
  usersByRole: Array<{ role: string; count: number }>;
  userGrowth: number;
  churnRate: number;
}

export interface UserActivity {
  logins: Array<{ timestamp: Date; ipAddress: string; device: string }>;
  properties: Array<{ id: string; title: string; action: string; timestamp: Date }>;
  transactions: Array<{ id: string; amount: number; status: string; timestamp: Date }>;
  events: Array<{ type: string; description: string; timestamp: Date }>;
}

export interface UserUpdateData {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  verificationStatus?: string;
  isPremium?: boolean;
  isB2BCustomer?: boolean;
}

// Get users with pagination and filters
export async function getUsers(
  filters?: UserFilters,
  page: number = 1,
  pageSize: number = 20
): Promise<{ users: User[]; total: number; page: number; pageSize: number }> {
  const response = await apiClient.get('/admin/users', {
    params: {
      ...filters,
      dateFrom: filters?.dateFrom?.toISOString(),
      dateTo: filters?.dateTo?.toISOString(),
      page,
      pageSize,
    },
  });
  return response.data;
}

// Get user by ID
export async function getUserById(userId: string): Promise<User> {
  const response = await apiClient.get(`/admin/users/${userId}`);
  return response.data;
}

// Get user statistics
export async function getUserStats(): Promise<UserStats> {
  const response = await apiClient.get('/admin/users/stats');
  return response.data;
}

// Get user activity
export async function getUserActivity(userId: string, dateRange?: DateRange): Promise<UserActivity> {
  const response = await apiClient.get(`/admin/users/${userId}/activity`, {
    params: dateRange
      ? {
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString(),
        }
      : undefined,
  });
  return response.data;
}

// Update user
export async function updateUser(userId: string, data: UserUpdateData): Promise<User> {
  const response = await apiClient.patch(`/admin/users/${userId}`, data);
  return response.data;
}

// Suspend user
export async function suspendUser(userId: string, reason: string): Promise<{ message: string }> {
  const response = await apiClient.post(`/admin/users/${userId}/suspend`, { reason });
  return response.data;
}

// Unsuspend user
export async function unsuspendUser(userId: string): Promise<{ message: string }> {
  const response = await apiClient.post(`/admin/users/${userId}/unsuspend`);
  return response.data;
}

// Delete user
export async function deleteUser(userId: string): Promise<{ message: string }> {
  const response = await apiClient.delete(`/admin/users/${userId}`);
  return response.data;
}

// Verify user
export async function verifyUser(userId: string): Promise<User> {
  const response = await apiClient.post(`/admin/users/${userId}/verify`);
  return response.data;
}

// Reject verification
export async function rejectVerification(userId: string, reason: string): Promise<User> {
  const response = await apiClient.post(`/admin/users/${userId}/reject-verification`, { reason });
  return response.data;
}

// Bulk update users
export async function bulkUpdateUsers(
  userIds: string[],
  data: Partial<UserUpdateData>
): Promise<{ updated: number; message: string }> {
  const response = await apiClient.patch('/admin/users/bulk-update', {
    userIds,
    data,
  });
  return response.data;
}

// Export users
export async function exportUsers(filters?: UserFilters, format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
  const response = await apiClient.get('/admin/users/export', {
    params: {
      ...filters,
      dateFrom: filters?.dateFrom?.toISOString(),
      dateTo: filters?.dateTo?.toISOString(),
      format,
    },
    responseType: 'blob',
  });
  return response.data;
}

// Get user verification documents
export async function getUserDocuments(userId: string): Promise<any[]> {
  const response = await apiClient.get(`/admin/users/${userId}/documents`);
  return response.data;
}

// Search users
export async function searchUsers(query: string, limit: number = 10): Promise<User[]> {
  const response = await apiClient.get('/admin/users/search', {
    params: { query, limit },
  });
  return response.data;
}

type DateRange = { startDate: Date; endDate: Date };