'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@newcondo/ui/';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@newcondo/ui/';
import { Badge } from '@newcondo/ui/';
import { Button } from '@newcondo/ui/';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@newcondo/ui/';
import { Input } from '@newcondo/ui/';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  Download,
  Search,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@newcondo/ui/lib/utils';

export interface Transaction {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  currency: string;
  description: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  reference: string;
  createdAt: Date;
  metadata?: {
    propertyTitle?: string;
    renterId?: string;
    renterName?: string;
    commission?: number;
    platformFee?: number;
  };
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  isLoading?: boolean;
  onExport?: () => void;
}

const STATUS_COLORS = {
  SUCCESS: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  FAILED: 'bg-red-100 text-red-800',
};

export function TransactionHistory({
  transactions,
  isLoading,
  onExport,
}: TransactionHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.reference.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      filterType === 'ALL' || transaction.type === filterType;

    const matchesStatus =
      filterStatus === 'ALL' || transaction.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              View all your wallet transactions
            </CardDescription>
          </div>
          {onExport && (
            <Button onClick={onExport} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by description or reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="CREDIT">Credit</SelectItem>
              <SelectItem value="DEBIT">Debit</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="SUCCESS">Success</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Transactions Table */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
              <p className="mt-2 text-sm text-gray-500">Loading transactions...</p>
            </div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">No transactions found</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(transaction.createdAt), 'MMM dd, yyyy')}
                      <br />
                      <span className="text-xs text-gray-500">
                        {format(new Date(transaction.createdAt), 'hh:mm a')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {transaction.type === 'CREDIT' ? (
                          <ArrowDownCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <ArrowUpCircle className="h-5 w-5 text-red-600" />
                        )}
                        <span
                          className={cn(
                            'font-medium',
                            transaction.type === 'CREDIT'
                              ? 'text-green-600'
                              : 'text-red-600'
                          )}
                        >
                          {transaction.type}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        {transaction.metadata?.propertyTitle && (
                          <p className="text-xs text-gray-500">
                            {transaction.metadata.propertyTitle}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {transaction.reference}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          'font-semibold',
                          transaction.type === 'CREDIT'
                            ? 'text-green-600'
                            : 'text-red-600'
                        )}
                      >
                        {transaction.type === 'CREDIT' ? '+' : '-'}
                        {formatCurrency(transaction.amount, transaction.currency)}
                      </span>
                      {transaction.metadata?.commission && (
                        <p className="text-xs text-gray-500">
                          Commission: {formatCurrency(transaction.metadata.commission, transaction.currency)}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={STATUS_COLORS[transaction.status]}
                      >
                        {transaction.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}