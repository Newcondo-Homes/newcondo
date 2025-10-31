// apps/admin/src/components/payments/TransactionTable.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Filter,
  Download,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

interface Transaction {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  currency: string;
  paymentType: string;
  status: string;
  paymentMethod?: string;
  flutterwaveRef?: string;
  transactionId?: string;
  description?: string;
  createdAt: string;
  paidAt?: string;
}

interface TransactionTableProps {
  onViewDetails: (transactionId: string) => void;
}

export default function TransactionTable({ onViewDetails }: TransactionTableProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, statusFilter, typeFilter, searchTerm]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
        ...(typeFilter !== 'ALL' && { type: typeFilter }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/admin/payments?${params}`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      
      const data = await response.json();
      setTransactions(data.transactions || []);
      setTotalPages(data.totalPages || 1);
      setTotalTransactions(data.total || 0);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
        ...(typeFilter !== 'ALL' && { type: typeFilter }),
        ...(searchTerm && { search: searchTerm }),
        export: 'csv',
      });

      const response = await fetch(`/api/admin/payments/export?${params}`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; className: string }> = {
      SUCCESS: { variant: 'default', className: 'bg-green-500' },
      PENDING: { variant: 'secondary', className: 'bg-yellow-500' },
      FAILED: { variant: 'destructive', className: 'bg-red-500' },
      CANCELLED: { variant: 'outline', className: 'text-gray-500' },
      REFUNDED: { variant: 'outline', className: 'text-purple-500' },
      HELD: { variant: 'secondary', className: 'bg-blue-500' },
      RELEASED: { variant: 'default', className: 'bg-emerald-500' },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    return <Badge className={config.className}>{status}</Badge>;
  };

  const getPaymentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      RENT: 'bg-blue-100 text-blue-800',
      DEPOSIT: 'bg-purple-100 text-purple-800',
      AGENT_COMMISSION: 'bg-green-100 text-green-800',
      PREMIUM_UPGRADE: 'bg-yellow-100 text-yellow-800',
      PROPERTY_MARKING: 'bg-orange-100 text-orange-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency || 'NGN',
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Transactions</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              {totalTransactions} total transactions
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchTransactions}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by user, email, or transaction ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="SUCCESS">Success</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
                <SelectItem value="HELD">Held</SelectItem>
                <SelectItem value="RELEASED">Released</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="RENT">Rent</SelectItem>
                <SelectItem value="DEPOSIT">Deposit</SelectItem>
                <SelectItem value="AGENT_COMMISSION">Agent Commission</SelectItem>
                <SelectItem value="PREMIUM_UPGRADE">Premium Upgrade</SelectItem>
                <SelectItem value="PROPERTY_MARKING">Property Marking</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                    </TableCell>
                  </TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="font-mono text-sm">
                          {transaction.transactionId || transaction.id.slice(0, 8)}
                        </div>
                        {transaction.flutterwaveRef && (
                          <div className="text-xs text-gray-500 mt-1">
                            FW: {transaction.flutterwaveRef.slice(0, 10)}...
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{transaction.userName}</p>
                          <p className="text-sm text-gray-500">{transaction.userEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPaymentTypeColor(transaction.paymentType)} variant="secondary">
                          {transaction.paymentType.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">
                          {formatAmount(transaction.amount, transaction.currency)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(transaction.status)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {transaction.paymentMethod || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(transaction.createdAt).toLocaleTimeString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewDetails(transaction.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}