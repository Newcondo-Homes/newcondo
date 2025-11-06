import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUserManagementStore } from '@/store/userManagementStore';
import {
  getUsers,
  getUserById,
  updateUser,
  suspendUser,
  unsuspendUser,
  deleteUser,
  verifyUser,
  rejectVerification,
  getUserActivity,
  getUserStats,
  bulkUpdateUsers,
  exportUsers,
} from '@/lib/api/userManagement';
import type { UserFilters, UserUpdateData } from '@/types/user';
import { toast } from 'sonner';

export function useUserManagement(filters?: UserFilters, page: number = 1, pageSize: number = 20) {
  const { setUsers, setLoading, setError, setTotalCount } = useUserManagementStore();

  // Fetch users with pagination
  const usersQuery = useQuery({
    queryKey: ['users', filters, page, pageSize],
    queryFn: () => getUsers(filters, page, pageSize),
    onSuccess: (data) => {
      setUsers(data.users);
      setTotalCount(data.total);
      setLoading(false);
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Failed to fetch users');
      setLoading(false);
    },
  });

  // User statistics
  const statsQuery = useQuery({
    queryKey: ['users', 'stats'],
    queryFn: getUserStats,
    staleTime: 300000, // 5 minutes
  });

  return {
    users: usersQuery.data?.users || [],
    total: usersQuery.data?.total || 0,
    stats: statsQuery.data,
    isLoading: usersQuery.isLoading,
    isError: usersQuery.isError,
    refetch: usersQuery.refetch,
  };
}

export function useUser(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUserById(userId),
    enabled: !!userId,
  });
}

export function useUserActivity(userId: string, dateRange?: DateRange) {
  return useQuery({
    queryKey: ['user', userId, 'activity', dateRange],
    queryFn: () => getUserActivity(userId, dateRange),
    enabled: !!userId,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UserUpdateData }) =>
      updateUser(userId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['user', variables.userId]);
      queryClient.invalidateQueries(['users']);
      toast.success('User updated successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update user');
    },
  });
}

export function useSuspendUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      suspendUser(userId, reason),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['user', variables.userId]);
      queryClient.invalidateQueries(['users']);
      toast.success('User suspended successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to suspend user');
    },
  });
}

export function useUnsuspendUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => unsuspendUser(userId),
    onSuccess: (data, userId) => {
      queryClient.invalidateQueries(['user', userId]);
      queryClient.invalidateQueries(['users']);
      toast.success('User unsuspended successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to unsuspend user');
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('User deleted successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete user');
    },
  });
}

export function useVerifyUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => verifyUser(userId),
    onSuccess: (data, userId) => {
      queryClient.invalidateQueries(['user', userId]);
      queryClient.invalidateQueries(['users']);
      toast.success('User verified successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to verify user');
    },
  });
}

export function useRejectVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      rejectVerification(userId, reason),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['user', variables.userId]);
      queryClient.invalidateQueries(['users']);
      toast.success('Verification rejected');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to reject verification');
    },
  });
}

export function useBulkUpdateUsers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userIds, data }: { userIds: string[]; data: Partial<UserUpdateData> }) =>
      bulkUpdateUsers(userIds, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('Users updated successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update users');
    },
  });
}

export function useExportUsers() {
  return useMutation({
    mutationFn: ({ filters, format }: { filters?: UserFilters; format: 'csv' | 'excel' }) =>
      exportUsers(filters, format),
    onSuccess: (data, variables) => {
      toast.success(`Users exported as ${variables.format.toUpperCase()}`);
      
      // Trigger download
      const blob = new Blob([data], {
        type: variables.format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${Date.now()}.${variables.format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to export users');
    },
  });
}