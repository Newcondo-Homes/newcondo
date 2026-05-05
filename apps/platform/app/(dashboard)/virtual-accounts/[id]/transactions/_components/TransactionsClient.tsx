'use client';

import { useState } from 'react';
import VirtualAccountTransactions from '@/components/virtual-accounts/VirtualAccountTransactions';

interface TransactionFilters {
  dateFrom?: string;
  dateTo?: string;
  type?: 'CREDIT' | 'DEBIT' | 'ALL';
  category?: string;
  status?: string;
  searchTerm?: string;
}

// the type below was gotten from this code apps\platform\components\virtual-accounts\VirtualAccountTransactions.tsx
interface Transaction {
  id: string;
  accountId: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  currency: string;
  description: string;
  reference: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  category: 'RENT_PAYMENT' | 'DEPOSIT' | 'COMMISSION' | 'REFUND' | 'MARKING_FEE' | 'WITHDRAWAL' | 'OTHER';
  metadata?: {
    propertyId?: string;
    propertyTitle?: string;
    tenantName?: string;
    agentName?: string;
    markingJobId?: string;
  };
  balanceAfter: number;
  createdAt: string;
  processedAt?: string;
}

interface TransactionsClientProps {
  accountId: string;
  transactions: Transaction[];
}

export function TransactionsClient({ accountId, transactions }: TransactionsClientProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (filters: TransactionFilters) => {
    try {
      setIsExporting(true);

      const params = new URLSearchParams(
        Object.entries(filters)
          .filter(([, v]) => v !== undefined && v !== '' && v !== 'ALL')
          .map(([k, v]) => [k, String(v)])
      );

      const response = await fetch(
        `/api/virtual-accounts/${accountId}/export?${params}`,
        { method: 'GET' }
      );

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `transactions-${accountId}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <VirtualAccountTransactions
      accountId={accountId}
      transactions={transactions}
      onExport={handleExport}
      onRefresh={handleRefresh}
      isLoading={isExporting}
    />
  );
}