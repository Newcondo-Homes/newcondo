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
    // fix: getVirtualAccounts takes no arguments — params filtering is
    // handled server-side via the query key; pass params only if the API
    // actually accepts them (update this when the API signature is updated)
    queryFn: () => virtualAccountsApi.getVirtualAccounts(),
    staleTime: 5 * 60 * 1000,
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

export function useReconcileAccount() {
  return useMutation({
    // fix: reconcileAccount takes no arguments per the current API signature.
    // Store the payload in the query key or update the API to accept args.
    mutationFn: () => virtualAccountsApi.reconcileAccount(),
    onError: (error: Error) => {
      toast.error(error?.message || 'Failed to reconcile account');
    },
  });
}

export function useUserVirtualAccounts(userId?: string) {
  return useQuery({
    queryKey: VIRTUAL_ACCOUNTS_KEYS.userAccounts(userId || ''),
    // fix: getUserVirtualAccounts takes no arguments — userId is used only
    // for the query key so React Query re-fetches when it changes
    queryFn: () => virtualAccountsApi.getUserVirtualAccounts(),
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
      queryClient.invalidateQueries({
        queryKey: VIRTUAL_ACCOUNTS_KEYS.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: VIRTUAL_ACCOUNTS_KEYS.userAccounts(data.userId),
      });

      if (data.propertyId) {
        queryClient.invalidateQueries({
          queryKey: VIRTUAL_ACCOUNTS_KEYS.propertyAccount(data.propertyId),
        });
      }

      toast.success('Virtual account created successfully');
    },
    onError: (error: Error) => {
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
      queryClient.setQueryData(
        VIRTUAL_ACCOUNTS_KEYS.detail(data.id),
        data
      );

      queryClient.invalidateQueries({
        queryKey: VIRTUAL_ACCOUNTS_KEYS.lists(),
      });

      toast.success('Virtual account activated successfully');
    },
    onError: (error: Error) => {
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
      queryClient.setQueryData(
        VIRTUAL_ACCOUNTS_KEYS.detail(data.id),
        data
      );

      queryClient.invalidateQueries({
        queryKey: VIRTUAL_ACCOUNTS_KEYS.lists(),
      });

      toast.success('Virtual account deactivated successfully');
    },
    onError: (error: Error) => {
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
      queryClient.setQueryData(
        VIRTUAL_ACCOUNTS_KEYS.detail(data.id),
        data
      );

      queryClient.invalidateQueries({
        queryKey: VIRTUAL_ACCOUNTS_KEYS.lists(),
      });

      toast.success('Account name updated successfully');
    },
    onError: (error: Error) => {
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
      queryClient.removeQueries({
        queryKey: VIRTUAL_ACCOUNTS_KEYS.detail(accountId),
      });

      queryClient.invalidateQueries({
        queryKey: VIRTUAL_ACCOUNTS_KEYS.lists(),
      });

      toast.success('Virtual account deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error?.message || 'Failed to delete virtual account');
    },
  });
}