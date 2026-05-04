'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui/';
import { Button } from '@newcondo/ui/';
import { Badge } from '@newcondo/ui/';
import { Input } from '@newcondo/ui/';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@newcondo/ui/';
import { Calendar, CalendarDays, Download, Search, Filter, ArrowUpDown, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format } from 'date-fns';

interface VirtualAccountTransaction {
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

interface VirtualAccountTransactionsProps {
  accountId?: string;
  transactions?: VirtualAccountTransaction[];
  isLoading?: boolean;
  onExport?: (filters: TransactionFilters) => void;
  onRefresh?: () => void;
}

interface TransactionFilters {
  dateFrom?: string;
  dateTo?: string;
  type?: 'CREDIT' | 'DEBIT' | 'ALL';
  category?: string;
  status?: string;
  searchTerm?: string;
}

const VirtualAccountTransactions: React.FC<VirtualAccountTransactionsProps> = ({
  transactions = [],
  isLoading = false,
  onExport,
  onRefresh
}) => {
  const [filters, setFilters] = useState<TransactionFilters>({
    type: 'ALL',
    category: '',
    status: '',
    searchTerm: '',
    dateFrom: '',
    dateTo: ''
  });
  const [sortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    const filtered = transactions.filter(transaction => {
      const matchesSearch = !filters.searchTerm || 
        transaction.description.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        transaction.reference.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        transaction.metadata?.propertyTitle?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        transaction.metadata?.tenantName?.toLowerCase().includes(filters.searchTerm.toLowerCase());

      const matchesType = filters.type === 'ALL' || transaction.type === filters.type;
      const matchesCategory = !filters.category || transaction.category === filters.category;
      const matchesStatus = !filters.status || transaction.status === filters.status;

      const transactionDate = new Date(transaction.createdAt);
      const matchesDateFrom = !filters.dateFrom || transactionDate >= new Date(filters.dateFrom);
      const matchesDateTo = !filters.dateTo || transactionDate <= new Date(filters.dateTo);

      return matchesSearch && matchesType && matchesCategory && matchesStatus && matchesDateFrom && matchesDateTo;
    });

    // Sort transactions
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'amount') {
        comparison = a.amount - b.amount;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [transactions, filters, sortBy, sortOrder]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalCredits = filteredTransactions
      .filter(t => t.type === 'CREDIT' && t.status === 'SUCCESS')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalDebits = filteredTransactions
      .filter(t => t.type === 'DEBIT' && t.status === 'SUCCESS')
      .reduce((sum, t) => sum + t.amount, 0);

    const pendingAmount = filteredTransactions
      .filter(t => t.status === 'PENDING')
      .reduce((sum, t) => sum + (t.type === 'CREDIT' ? t.amount : -t.amount), 0);

    return {
      totalCredits,
      totalDebits,
      netFlow: totalCredits - totalDebits,
      pendingAmount,
      transactionCount: filteredTransactions.length
    };
  }, [filteredTransactions]);

  const getTransactionIcon = (type: 'CREDIT' | 'DEBIT') => {
    return type === 'CREDIT' ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'FAILED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryLabel = (category: string) => {
    const categoryLabels: Record<string, string> = {
      'RENT_PAYMENT': 'Rent Payment',
      'DEPOSIT': 'Deposit',
      'COMMISSION': 'Commission',
      'REFUND': 'Refund',
      'MARKING_FEE': 'Marking Fee',
      'WITHDRAWAL': 'Withdrawal',
      'OTHER': 'Other'
    };
    return categoryLabels[category] || category;
  };

  const handleExport = () => {
    if (onExport) {
      onExport(filters);
    }
  };

  const clearFilters = () => {
    setFilters({
      type: 'ALL',
      category: '',
      status: '',
      searchTerm: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Credits</p>
                <p className="text-lg font-semibold text-green-600">
                  ₦{summaryStats.totalCredits.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Debits</p>
                <p className="text-lg font-semibold text-red-600">
                  ₦{summaryStats.totalDebits.toLocaleString()}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Net Flow</p>
                <p className={`text-lg font-semibold ${summaryStats.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₦{summaryStats.netFlow.toLocaleString()}
                </p>
              </div>
              <Minus className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Transactions</p>
                <p className="text-lg font-semibold">
                  {summaryStats.transactionCount}
                </p>
              </div>
              <CalendarDays className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                View and filter your virtual account transactions
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRefresh}
                disabled={isLoading}
              >
                Refresh
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExport}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search transactions..."
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                className="pl-10"
              />
            </div>

            <Select
              value={filters.type}
              onValueChange={(value) => setFilters(prev => ({ ...prev, type: value as 'CREDIT' | 'DEBIT' | 'ALL' }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Transaction Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="CREDIT">Credits</SelectItem>
                <SelectItem value="DEBIT">Debits</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.category}
              onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                <SelectItem value="RENT_PAYMENT">Rent Payment</SelectItem>
                <SelectItem value="DEPOSIT">Deposit</SelectItem>
                <SelectItem value="COMMISSION">Commission</SelectItem>
                <SelectItem value="REFUND">Refund</SelectItem>
                <SelectItem value="MARKING_FEE">Marking Fee</SelectItem>
                <SelectItem value="WITHDRAWAL">Withdrawal</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="SUCCESS">Success</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Clear
            </Button>

            <Button
              variant="outline"
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="flex items-center gap-2"
            >
              <ArrowUpDown className="h-4 w-4" />
              Sort {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>

          {/* Transactions List */}
          <div className="space-y-3">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 font-medium">No transactions found</p>
                <p className="text-sm text-gray-400">
                  {transactions.length === 0 
                    ? "No transactions have been processed yet"
                    : "Try adjusting your filters to see more results"
                  }
                </p>
              </div>
            ) : (
              filteredTransactions.map((transaction) => (
                <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="mt-1">
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">
                              {transaction.description}
                            </h4>
                            <Badge 
                              variant="outline"
                              className={getStatusColor(transaction.status)}
                            >
                              {transaction.status}
                            </Badge>
                            <Badge variant="outline">
                              {getCategoryLabel(transaction.category)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500">
                            Ref: {transaction.reference}
                          </p>
                          {transaction.metadata?.propertyTitle && (
                            <p className="text-sm text-gray-500">
                              Property: {transaction.metadata.propertyTitle}
                            </p>
                          )}
                          {transaction.metadata?.tenantName && (
                            <p className="text-sm text-gray-500">
                              Tenant: {transaction.metadata.tenantName}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {format(new Date(transaction.createdAt), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'CREDIT' ? '+' : '-'}₦{transaction.amount.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          Balance: ₦{transaction.balanceAfter.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Load More / Pagination could go here */}
          {filteredTransactions.length > 0 && (
            <div className="flex justify-center mt-6">
              <Button variant="outline">
                Load More Transactions
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VirtualAccountTransactions;