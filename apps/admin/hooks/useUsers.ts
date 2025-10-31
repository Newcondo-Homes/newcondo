// apps/admin/src/hooks/useUsers.ts

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users';
import { useUserStore } from '@/store/userStore';
import { VerificationStatus, Role } from '@newcondo/db';

interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: Role;
  verificationStatus?: VerificationStatus;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const useUsers = (filters?: UserFilters) => {
  const queryClient = useQueryClient();
  const { setSelectedUser } = useUserStore();
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch paginated users
   */
  const {
    data: usersData,
    isLoading,
    isFetching,
    refetch
  } = useQuery({
    queryKey: ['users', filters],
    queryFn: () => usersApi.getUsers(filters),
    staleTime: 30000, // 30 seconds
  });

  /**
   * Fetch single user details
   */
  const useUserDetails = (userId: string) => {
    return useQuery({
      queryKey: ['user', userId],
      queryFn: () => usersApi.getUserById(userId),
      enabled: !!userId,
      staleTime: 60000, // 1 minute
    });
  };

  /**
   * Verify user mutation
   */
  const verifyUserMutation = useMutation({
    mutationFn: ({ 
      userId, 
      status, 
      rejectionReason 
    }: { 
      userId: string; 
      status: VerificationStatus; 
      rejectionReason?: string;
    }) => usersApi.verifyUser(userId, status, rejectionReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to verify user');
    }
  });

  /**
   * Suspend user mutation
   */
  const suspendUserMutation = useMutation({
    mutationFn: ({ 
      userId, 
      reason, 
      duration 
    }: { 
      userId: string; 
      reason: string; 
      duration?: number;
    }) => usersApi.suspendUser(userId, reason, duration),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to suspend user');
    }
  });

  /**
   * Delete user mutation
   */
  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => usersApi.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  });

  /**
   * Update user role mutation
   */
  const updateUserRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: Role }) => 
      usersApi.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to update user role');
    }
  });

  /**
   * Verify user
   */
  const verifyUser = useCallback(async (
    userId: string,
    status: VerificationStatus,
    rejectionReason?: string
  ) => {
    setError(null);
    return verifyUserMutation.mutateAsync({ userId, status, rejectionReason });
  }, [verifyUserMutation]);

  /**
   * Suspend user
   */
  const suspendUser = useCallback(async (
    userId: string,
    reason: string,
    duration?: number
  ) => {
    setError(null);
    return suspendUserMutation.mutateAsync({ userId, reason, duration });
  }, [suspendUserMutation]);

  /**
   * Delete user
   */
  const deleteUser = useCallback(async (userId: string) => {
    setError(null);
    return deleteUserMutation.mutateAsync(userId);
  }, [deleteUserMutation]);

  /**
   * Update user role
   */
  const updateUserRole = useCallback(async (userId: string, role: Role) => {
    setError(null);
    return updateUserRoleMutation.mutateAsync({ userId, role });
  }, [updateUserRoleMutation]);

  /**
   * Export users data
   */
  const exportUsers = useCallback(async (filters?: UserFilters) => {
    setError(null);
    try {
      const blob = await usersApi.exportUsers(filters);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `users-export-${new Date().toISOString()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to export users';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  return {
    // Data
    users: usersData?.data?.users || [],
    pagination: usersData?.data?.pagination,
    statistics: usersData?.data?.statistics,
    
    // Loading states
    isLoading,
    isFetching,
    
    // Mutations loading states
    isVerifying: verifyUserMutation.isPending,
    isSuspending: suspendUserMutation.isPending,
    isDeleting: deleteUserMutation.isPending,
    isUpdatingRole: updateUserRoleMutation.isPending,
    
    // Actions
    verifyUser,
    suspendUser,
    deleteUser,
    updateUserRole,
    exportUsers,
    refetch,
    
    // User details hook
    useUserDetails,
    
    // State
    error,
    clearError: () => setError(null)
  };
};