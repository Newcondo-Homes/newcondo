// apps/platform/components/commissions/TransactionHistory.tsx
'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/DataTable';
import { Badge } from '@newcondo/ui/components/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@newcondo/ui/components/dropdown-menu';
import {
  ArrowUpRight,
  ArrowDownLeft,
  MoreHorizontal,
  Download,
  Eye,
} from 'lucide-react';

type TransactionType = 'COMMISSION' | 'WITHDRAWAL' | 'REFUND' | 'ADJUSTMENT';
type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  description: string;
  propertyTitle?: string;
  reference: string;
  createdAt: Date;
  completedAt?: Date;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  currency?: string;
  onViewDetails?: (transaction: Transaction) => void;
  onDownloadReceipt?: (transactionId: string) => void;
}

export function TransactionHistory({
  transactions,
  currency = 'NGN',
  onViewDetails,
  onDownloadReceipt,
}: TransactionHistoryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case 'COMMISSION':
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      case 'WITHDRAWAL':
        return <ArrowUpRight className="h-4 w-4 text-blue-500" />;
      case 'REFUND':
        return <ArrowDownLeft className="h-4 w-4 text-orange-500" />;
      case 'ADJUSTMENT':
        return <ArrowDownLeft className="h-4 w-4 text-purple-500" />;
    }
  };

  const getTypeBadge = (type: TransactionType) => {
    switch (type) {
      case 'COMMISSION':
        return <Badge className="bg-green-500">Commission</Badge>;
      case 'WITHDRAWAL':
        return <Badge className="bg-blue-500">Withdrawal</Badge>;
      case 'REFUND':
        return <Badge className="bg-orange-500">Refund</Badge>;
      case 'ADJUSTMENT':
        return <Badge className="bg-purple-500">Adjustment</Badge>;
    }
  };

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'PENDING':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
            Pending
          </Badge>
        );
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>;
      case 'CANCELLED':
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700">
            Cancelled
          </Badge>
        );
    }
  };

  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {getTypeIcon(row.original.type)}
          {getTypeBadge(row.original.type)}
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.description}</div>
          {row.original.propertyTitle && (
            <div className="text-sm text-muted-foreground">
              Property: {row.original.propertyTitle}
            </div>
          )}
          <div className="text-xs text-muted-foreground mt-1">
            Ref: {row.original.reference}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => {
        const isIncoming =
          row.original.type === 'COMMISSION' ||
          row.original.type === 'REFUND' ||
          row.original.type === 'ADJUSTMENT';
        return (
          <span
            className={`font-semibold ${
              isIncoming ? 'text-green-600' : 'text-blue-600'
            }`}
          >
            {isIncoming ? '+' : '-'}
            {formatCurrency(row.original.amount)}
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => (
        <div>
          <div className="text-sm">{formatDate(row.original.createdAt)}</div>
          {row.original.completedAt && row.original.status === 'COMPLETED' && (
            <div className="text-xs text-muted-foreground">
              Completed: {formatDate(row.original.completedAt)}
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onViewDetails && (
              <DropdownMenuItem onClick={() => onViewDetails(row.original)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
            )}
            {onDownloadReceipt &&
              row.original.status === 'COMPLETED' &&
              (row.original.type === 'COMMISSION' ||
                row.original.type === 'WITHDRAWAL') && (
                <DropdownMenuItem
                  onClick={() => onDownloadReceipt(row.original.id)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Receipt
                </DropdownMenuItem>
              )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={transactions}
      searchKey="description"
      searchPlaceholder="Search transactions..."
    />
  );
}