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

interface TransactionsClientProps {
  accountId: string;
  transactions: any[];
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

      // Trigger file download
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
    // Trigger a page refresh to re-fetch server data
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