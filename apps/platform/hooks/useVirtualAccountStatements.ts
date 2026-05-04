// apps/platform/hooks/useVirtualAccountStatements.ts
'use client'

import { useQuery, useMutation } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import {
  fetchAccountStatements,
  exportAccountStatement,
} from '@/lib/api/virtualAccounts';
import { useAuth } from './useAuth';

export interface StatementTransaction {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  currency: string;
  description: string;
  reference: string;
  balanceAfter: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  source: string; // 'RENT_PAYMENT' | 'COMMISSION' | 'WITHDRAWAL' | 'TRANSFER'
  metadata?: {
    propertyId?: string;
    propertyTitle?: string;
    tenantName?: string;
    paymentId?: string;
    [key: string]: unknown;
  };
  createdAt: string;
}

export interface StatementPeriod {
  startDate: string;
  endDate: string;
  totalCredits: number;
  totalDebits: number;
  netAmount: number;
  transactionCount: number;
  openingBalance: number;
  closingBalance: number;
}

export interface StatementFilters {
  startDate?: string;
  endDate?: string;
  type?: 'CREDIT' | 'DEBIT' | 'ALL';
  source?: string;
  minAmount?: number;
  maxAmount?: number;
  status?: 'PENDING' | 'SUCCESS' | 'FAILED' | 'ALL';
  page?: number;
  limit?: number;
}

export interface StatementResponse {
  transactions: StatementTransaction[];
  period: StatementPeriod;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const useVirtualAccountStatements = (propertyId?: string) => {
  const { user } = useAuth();

  const [filters, setFilters] = useState<StatementFilters>({
    type: 'ALL',
    status: 'ALL',
    page: 1,
    limit: 20,
  });

  // Get statements query
  const {
    data: statementData,
    isLoading: isStatementsLoading,
    error: statementsError,
    refetch: refetchStatements,
  } = useQuery({
    queryKey: ['virtualAccountStatements', user?.id, propertyId, filters],
    queryFn: async () => {

      const result = await fetchAccountStatements({
        accountId: propertyId!,
        page: filters.page,
        limit: filters.limit,
        type: filters.type !== 'ALL' ? filters.type : undefined,
        status: filters.status !== 'ALL' ? filters.status : undefined,
        startDate: filters.startDate,
        endDate: filters.endDate,
      })

      return {
        ...result,
        pagination: {
          ...result.pagination,
          hasNext: result.pagination.page < result.pagination.totalPages,
          hasPrev: result.pagination.page > 1
        }
      }

    },
    enabled: !!user?.id && !!propertyId,
    staleTime: 30000, // 30 seconds

  });

  // Generate statement PDF mutation
  const generatePDFMutation = useMutation({
    mutationFn: (params: {
      startDate: string;
      endDate: string;
      propertyId?: string;
      format?: 'PDF' | 'CSV' | 'EXCEL';
    }) => exportAccountStatement({
      accountId: params.propertyId!,
      startDate: params.startDate,
      endDate: params.endDate,
      format: params.format === 'PDF' ? 'pdf' : 'csv', // exportAccountStatement only accepts 'pdf' | 'csv'
    }),
    onSuccess: (data) => {
      // Download the file
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = 'statement'
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Statement downloaded successfully');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to generate statement');
    },
  });

  // Email statement mutation
  const emailStatementMutation = useMutation({
    mutationFn: (params: {
      email: string;
      startDate: string;
      endDate: string;
      propertyId?: string;
      format?: 'PDF' | 'CSV' | 'EXCEL';
    }) => {
      // TODO: replace with real API call e.g. emailAccountStatement(params) once added to virtualAccounts.ts
      return Promise.reject(new Error('Email statement not yet implemented'));
    },
    onSuccess: () => {
      toast.success('Statement sent to your email');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to generate statement');
    },
  });

  // Filter handlers
  const updateFilters = useCallback((newFilters: Partial<StatementFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: newFilters.page || 1, // Reset to first page when filtering
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      type: 'ALL',
      status: 'ALL',
      page: 1,
      limit: 20,
    });
  }, []);

  const setDateRange = useCallback((startDate: string, endDate: string) => {
    updateFilters({ startDate, endDate });
  }, [updateFilters]);

  const setTransactionType = useCallback((type: 'CREDIT' | 'DEBIT' | 'ALL') => {
    updateFilters({ type });
  }, [updateFilters]);

  const setAmountRange = useCallback((minAmount?: number, maxAmount?: number) => {
    updateFilters({ minAmount, maxAmount });
  }, [updateFilters]);

  // Pagination handlers
  const goToPage = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  const nextPage = useCallback(() => {
    if (statementData?.pagination.hasNext) {
      goToPage(filters.page! + 1);
    }
  }, [statementData?.pagination.hasNext, filters.page, goToPage]);

  const prevPage = useCallback(() => {
    if (statementData?.pagination.hasPrev) {
      goToPage(filters.page! - 1);
    }
  }, [statementData?.pagination.hasPrev, filters.page, goToPage]);

  // Statement generation handlers
  const generateStatement = useCallback((params: {
    startDate: string;
    endDate: string;
    format?: 'PDF' | 'CSV' | 'EXCEL';
  }) => {
    generatePDFMutation.mutate({
      ...params,
      propertyId,
    });
  }, [generatePDFMutation, propertyId]);

  const emailStatement = useCallback((params: {
    email: string;
    startDate: string;
    endDate: string;
    format?: 'PDF' | 'CSV' | 'EXCEL';
  }) => {
    emailStatementMutation.mutate({
      ...params,
      propertyId,
    });
  }, [emailStatementMutation, propertyId]);

  // Helper functions
  const formatAmount = useCallback((amount: number, currency = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  }, []);

  const formatTransactionType = useCallback((type: 'CREDIT' | 'DEBIT') => {
    return type === 'CREDIT' ? 'Credit' : 'Debit';
  }, []);

  const getTransactionIcon = useCallback((transaction: StatementTransaction) => {
    switch (transaction.source) {
      case 'RENT_PAYMENT':
        return 'home';
      case 'COMMISSION':
        return 'percent';
      case 'WITHDRAWAL':
        return 'arrow-up';
      case 'TRANSFER':
        return 'arrow-right';
      default:
        return transaction.type === 'CREDIT' ? 'plus' : 'minus';
    }
  }, []);

  const getTransactionColor = useCallback((transaction: StatementTransaction) => {
    if (transaction.status === 'FAILED') return 'red';
    if (transaction.status === 'PENDING') return 'yellow';
    return transaction.type === 'CREDIT' ? 'green' : 'red';
  }, []);

  // Quick date presets
  const getQuickDateRanges = useCallback(() => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last90Days = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);

    return {
      'This Month': {
        startDate: startOfMonth.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
      },
      'Last Month': {
        startDate: startOfLastMonth.toISOString().split('T')[0],
        endDate: endOfLastMonth.toISOString().split('T')[0],
      },
      'Last 30 Days': {
        startDate: last30Days.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
      },
      'Last 90 Days': {
        startDate: last90Days.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
      },
    };
  }, []);

  return {
    // Data
    statements: statementData?.data ?? [],
    transactions: statementData?.data?.[0]?.transactions ?? [],
    pagination: statementData?.pagination,

    // Loading states
    isStatementsLoading,
    isGeneratingStatement: generatePDFMutation.isPending,
    isEmailingStatement: emailStatementMutation.isPending,

    // Error states
    statementsError,
    generateError: generatePDFMutation.error,
    emailError: emailStatementMutation.error,

    // Filter state
    filters,

    // Filter actions
    updateFilters,
    resetFilters,
    setDateRange,
    setTransactionType,
    setAmountRange,

    // Pagination actions
    goToPage,
    nextPage,
    prevPage,

    // Statement actions
    generateStatement,
    emailStatement,
    refetchStatements,

    // Helpers
    formatAmount,
    formatTransactionType,
    getTransactionIcon,
    getTransactionColor,
    getQuickDateRanges,

    // Computed values
    hasStatements: (statementData?.data.length || 0) > 0,
    totalTransactions: statementData?.pagination?.total || 0,
    currentPage: filters.page || 1,
    totalPages: statementData?.pagination?.totalPages || 1,
    hasFiltersApplied: !!(filters.startDate || filters.endDate ||
      filters.type !== 'ALL' || filters.status !== 'ALL' ||
      filters.minAmount || filters.maxAmount || filters.source),
  };
};