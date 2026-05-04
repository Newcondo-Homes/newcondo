// apps/platform/hooks/useVirtualAccounts.ts
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { virtualAccountsApi } from '@/lib/api/virtualAccounts';
import { toast } from 'sonner';
import type {
  CreateVirtualAccountRequest,
  VirtualAccountQueryParams
} from '@/types/virtualAccount';

export const VIRTUAL_ACCOUNTS_KEYS = {
  all: ['virtualAccounts'] as const,
  lists: () => [...VIRTUAL_ACCOUNTS_KEYS.all, 'list'] as const,
  list: (params: VirtualAccountQueryParams) =>
    [...VIRTUAL_ACCOUNTS_KEYS.lists(), params] as const,
  details: () => [...VIRTUAL_ACCOUNTS_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...VIRTUAL_ACCOUNTS_KEYS.details(), id] as const,
  userAccounts: (userId: string) =>
    [...VIRTUAL_ACCOUNTS_KEYS.all, 'user', userId] as const,
  propertyAccount: (propertyId: string) =>
    [...VIRTUAL_ACCOUNTS_KEYS.all, 'property', propertyId] as const,
};

export function useVirtualAccounts(params?: VirtualAccountQueryParams) {
  return useQuery({
    queryKey: VIRTUAL_ACCOUNTS_KEYS.list(params || {}),
    queryFn: () => virtualAccountsApi.getVirtualAccounts(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useVirtualAccount(accountId: string) {
  return useQuery({
    queryKey: VIRTUAL_ACCOUNTS_KEYS.detail(accountId),
    queryFn: () => virtualAccountsApi.getVirtualAccount(accountId),
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000,
  });
}

// Add to apps/platform/hooks/useVirtualAccounts.ts

export function useReconcileAccount() {
  return useMutation({
    mutationFn: (data: {
      accountId: string;
      startDate: string;
      endDate: string;
      manualBalance: number;
      statementBalance: number;
    }) => virtualAccountsApi.reconcileAccount(data),
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to reconcile account');
    },
  });
}

export function useUserVirtualAccounts(userId?: string) {
  return useQuery({
    queryKey: VIRTUAL_ACCOUNTS_KEYS.userAccounts(userId || ''),
    queryFn: () => virtualAccountsApi.getUserVirtualAccounts(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePropertyVirtualAccount(propertyId?: string) {
  return useQuery({
    queryKey: VIRTUAL_ACCOUNTS_KEYS.propertyAccount(propertyId || ''),
    queryFn: () => virtualAccountsApi.getPropertyVirtualAccount(propertyId!),
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateVirtualAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateVirtualAccountRequest) =>
      virtualAccountsApi.createVirtualAccount(data),
    onSuccess: (data) => {
      // Invalidate and refetch virtual accounts list
      queryClient.invalidateQueries({
        queryKey: VIRTUAL_ACCOUNTS_KEYS.lists()
      });

      // Invalidate user's virtual accounts
      queryClient.invalidateQueries({
        queryKey: VIRTUAL_ACCOUNTS_KEYS.userAccounts(data.userId)
      });

      // If property account, invalidate property account query
      if (data.propertyId) {
        queryClient.invalidateQueries({
          queryKey: VIRTUAL_ACCOUNTS_KEYS.propertyAccount(data.propertyId)
        });
      }

      toast.success('Virtual account created successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create virtual account');
    },
  });
}

export function useActivateVirtualAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (accountId: string) =>
      virtualAccountsApi.activateVirtualAccount(accountId),
    onSuccess: (data) => {
      // Update the specific account in cache
      queryClient.setQueryData(
        VIRTUAL_ACCOUNTS_KEYS.detail(data.id),
        data
      );

      // Invalidate lists to reflect status change
      queryClient.invalidateQueries({
        queryKey: VIRTUAL_ACCOUNTS_KEYS.lists()
      });

      toast.success('Virtual account activated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to activate virtual account');
    },
  });
}

export function useDeactivateVirtualAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (accountId: string) =>
      virtualAccountsApi.deactivateVirtualAccount(accountId),
    onSuccess: (data) => {
      // Update the specific account in cache
      queryClient.setQueryData(
        VIRTUAL_ACCOUNTS_KEYS.detail(data.id),
        data
      );

      // Invalidate lists to reflect status change
      queryClient.invalidateQueries({
        queryKey: VIRTUAL_ACCOUNTS_KEYS.lists()
      });

      toast.success('Virtual account deactivated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to deactivate virtual account');
    },
  });
}

export function useUpdateVirtualAccountName() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ accountId, name }: { accountId: string; name: string }) =>
      virtualAccountsApi.updateVirtualAccountName(accountId, name),
    onSuccess: (data) => {
      // Update the specific account in cache
      queryClient.setQueryData(
        VIRTUAL_ACCOUNTS_KEYS.detail(data.id),
        data
      );

      // Invalidate lists to reflect name change
      queryClient.invalidateQueries({
        queryKey: VIRTUAL_ACCOUNTS_KEYS.lists()
      });

      toast.success('Account name updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update account name');
    },
  });
}

export function useDeleteVirtualAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (accountId: string) =>
      virtualAccountsApi.deleteVirtualAccount(accountId),
    onSuccess: (_, accountId) => {
      // Remove the specific account from cache
      queryClient.removeQueries({
        queryKey: VIRTUAL_ACCOUNTS_KEYS.detail(accountId)
      });

      // Invalidate all lists to reflect deletion
      queryClient.invalidateQueries({
        queryKey: VIRTUAL_ACCOUNTS_KEYS.lists()
      });

      toast.success('Virtual account deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete virtual account');
    },
  });
}