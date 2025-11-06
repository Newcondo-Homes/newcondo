import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTransactionStore } from '@/store/transactionStore';
import {
  getTransactions,
  getTransactionById,
  getTransactionStats,
  refundTransaction,
  retryTransaction,
  exportTransactions,
  getFailedTransactions,
  getPendingTransactions,
  reconcileTransactions,
} from '@/lib/api/transactions';
import type { TransactionFilters, DateRange } from '@/types/transaction';
import { toast } from 'sonner';

export function useTransactions(filters?: TransactionFilters, page: number = 1, pageSize: number = 20) {
  const { setTransactions, setLoading, setError, setTotalCount } = useTransactionStore();

  const transactionsQuery = useQuery({
    queryKey: ['transactions', filters, page, pageSize],
    queryFn: () => getTransactions(filters, page, pageSize),
    onSuccess: (data) => {
      setTransactions(data.transactions);
      setTotalCount(data.total);
      setLoading(false);
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Failed to fetch transactions');
      setLoading(false);
    },
  });

  const statsQuery = useQuery({
    queryKey: ['transactions', 'stats', filters],
    queryFn: () => getTransactionStats(filters),
  });

  return {
    transactions: transactionsQuery.data?.transactions || [],
    total: transactionsQuery.data?.total || 0,
    stats: statsQuery.data,
    isLoading: transactionsQuery.isLoading,
    isError: transactionsQuery.isError,
    refetch: transactionsQuery.refetch,
  };
}

export function useTransaction(transactionId: string) {
  return useQuery({
    queryKey: ['transaction', transactionId],
    queryFn: () => getTransactionById(transactionId),
    enabled: !!transactionId,
  });
}

export function useFailedTransactions(dateRange?: DateRange) {
  return useQuery({
    queryKey: ['transactions', 'failed', dateRange],
    queryFn: () => getFailedTransactions(dateRange),
  });
}

export function usePendingTransactions() {
  return useQuery({
    queryKey: ['transactions', 'pending'],
    queryFn: getPendingTransactions,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useRefundTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ transactionId, reason }: { transactionId: string; reason: string }) =>
      refundTransaction(transactionId, reason),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['transaction', variables.transactionId]);
      queryClient.invalidateQueries(['transactions']);
      toast.success('Transaction refunded successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to refund transaction');
    },
  });
}

export function useRetryTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transactionId: string) => retryTransaction(transactionId),
    onSuccess: (data, transactionId) => {
      queryClient.invalidateQueries(['transaction', transactionId]);
      queryClient.invalidateQueries(['transactions']);
      toast.success('Transaction retry initiated');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to retry transaction');
    },
  });
}

export function useReconcileTransactions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dateRange: DateRange) => reconcileTransactions(dateRange),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['transactions']);
      toast.success(`Reconciled ${data.reconciledCount} transactions`);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to reconcile transactions');
    },
  });
}

export function useExportTransactions() {
  return useMutation({
    mutationFn: ({
      filters,
      format,
    }: {
      filters?: TransactionFilters;
      format: 'csv' | 'excel' | 'pdf';
    }) => exportTransactions(filters, format),
    onSuccess: (data, variables) => {
      toast.success(`Transactions exported as ${variables.format.toUpperCase()}`);
      
      // Trigger download
      const mimeTypes = {
        csv: 'text/csv',
        excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        pdf: 'application/pdf',
      };
      
      const blob = new Blob([data], { type: mimeTypes[variables.format] });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-${Date.now()}.${variables.format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to export transactions');
    },
  });
}