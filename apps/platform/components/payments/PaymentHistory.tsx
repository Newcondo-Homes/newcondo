'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@newcondo/ui/components/table';
import { Badge } from '@newcondo/ui/components/badge';
import { Button } from '@newcondo/ui/components/button';
import { Input } from '@newcondo/ui/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@newcondo/ui/components/select';
import { Skeleton } from '@newcondo/ui/components/skeleton';
import { Calendar } from '@newcondo/ui/components/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@newcondo/ui/components/popover';
import type { DateRange } from 'react-day-picker';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@newcondo/ui/components/dropdown-menu';
import {
  CalendarIcon,
  Download,
  Eye,
  Filter,
  MoreHorizontal,
  Receipt,
  RefreshCw,
  Search,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { usePayments, usePaymentReceipt, usePaymentHistory } from '@/hooks/usePayments';
import { PaymentStatus } from './PaymentStatus';
import { PaymentReceipt } from './PaymentReceipt';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import type { Payment } from '@/types/payment';
import type { PaymentWithRental, PaymentRetryRequest } from '@/types/payment';

interface PaymentHistoryProps {
  userId?: string;
  limit?: number;
  showFilters?: boolean;
  showExport?: boolean;
}

export function PaymentHistory({
  userId,
  limit,
  showFilters = true,
  showExport = true
}: PaymentHistoryProps) {
  const [payments, setPayments] = useState<PaymentWithRental[]>([]);
  const { downloadReceipt } = usePaymentReceipt();
  const [filteredPayments, setFilteredPayments] = useState<PaymentWithRental[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithRental | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  // const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  // const [dateRange, setDateRange] = useState<{
  //   from?: Date;
  //   to?: Date;
  // }>({});
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  // const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  const { retryPayment } = usePayments();

  const { data: historyData, isLoading, refetch: loadPaymentHistory } = usePaymentHistory({ userId, limit });

  useEffect(() => {
    loadPaymentHistory();
  }, [userId]);

  useEffect(() => {
    applyFilters();
  }, [payments, searchQuery, statusFilter, typeFilter, dateRange]);

  useEffect(() => {
    if (historyData) setPayments(historyData.data ?? []);
  }, [historyData]);


  const applyFilters = () => {
    let filtered = [...payments];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(payment =>
        payment.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.transactionId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.rental?.property.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(payment => payment.paymentType === typeFilter);
    }

    // Date range filter
    if (dateRange.from || dateRange.to) {
      filtered = filtered.filter(payment => {
        const paymentDate = new Date(payment.createdAt);
        if (dateRange.from && paymentDate < dateRange.from) return false;
        if (dateRange.to && paymentDate > dateRange.to) return false;
        return true;
      });
    }

    setFilteredPayments(filtered);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
    setDateRange({ from: undefined, to: undefined });
  };

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'RENT': return 'Rent Payment';
      case 'DEPOSIT': return 'Deposit';
      case 'PROPERTY_MARKING': return 'Marking Fee';
      case 'AGENT_COMMISSION': return 'Commission';
      case 'PREMIUM_UPGRADE': return 'Premium';
      default: return type;
    }
  };

  const handleViewReceipt = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowReceipt(true);
  };

  const handleDownloadReceipt = async (paymentId: string) => {
    try {
      await downloadReceipt(paymentId);
    } catch (error) {
      console.error('Failed to download receipt:', error);
    }
  };

  const handleRetryPayment = async (paymentId: string) => {
    try {
      await retryPayment({ paymentId, data: {} as PaymentRetryRequest });
      await loadPaymentHistory(); // Refresh the list
    } catch (error) {
      console.error('Failed to retry payment:', error);
    }
  };

  const exportPayments = () => {
    const csvData = filteredPayments.map(payment => ({
      'Transaction ID': payment.transactionId || payment.id,
      'Date': formatDate(payment.createdAt),
      'Description': payment.description || getPaymentTypeLabel(payment.paymentType),
      'Amount': formatCurrency(payment.amount, payment.currency),
      'Status': payment.status,
      'Payment Method': payment.paymentMethod || 'N/A',
      'Property': payment.rental?.property.title || 'N/A',
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                View and manage your payment transactions
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadPaymentHistory()}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              {showExport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportPayments}
                  disabled={filteredPayments.length === 0}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="space-y-4">
              {/* Search and Filter Toggle */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search payments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                  className={cn(
                    showFiltersPanel && "bg-muted"
                  )}
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Filters
                </Button>
              </div>

              {/* Expanded Filters */}
              {showFiltersPanel && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/50">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="SUCCESS">Success</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="FAILED">Failed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      <SelectItem value="REFUNDED">Refunded</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="RENT">Rent</SelectItem>
                      <SelectItem value="DEPOSIT">Deposit</SelectItem>
                      <SelectItem value="PROPERTY_MARKING">Marking Fee</SelectItem>
                    </SelectContent>
                  </Select>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from ? (
                          dateRange.to ? (
                            `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d")}`
                          ) : (
                            format(dateRange.from, "MMM d, yyyy")
                          )
                        ) : (
                          "Date Range"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange.from}
                        selected={dateRange}
                        onSelect={(range) => setDateRange(range ?? { from: undefined, to: undefined })}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="justify-start"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No payments found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {payments.length === 0
                  ? "You haven't made any payments yet."
                  : "No payments match your current filters."
                }
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {getPaymentTypeLabel(payment.paymentType)}
                          </div>
                          {payment.transactionId && (
                            <div className="text-xs text-muted-foreground">
                              {payment.transactionId}
                            </div>
                          )}
                          {payment.description && (
                            <div className="text-sm text-muted-foreground">
                              {payment.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {payment.rental?.property ? (
                          <div className="space-y-1">
                            <div className="font-medium">
                              {payment.rental.property.title}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {payment.rental.property.address}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatCurrency(payment.amount, payment.currency)}
                        </div>
                        {payment.paymentMethod && (
                          <div className="text-xs text-muted-foreground capitalize">
                            {payment.paymentMethod.replace('_', ' ')}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <PaymentStatus status={payment.status} />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>{formatDate(payment.createdAt)}</div>
                          {payment.paidAt && payment.paidAt !== payment.createdAt && (
                            <div className="text-xs text-muted-foreground">
                              Paid: {formatDate(payment.paidAt)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleViewReceipt(payment)}
                              disabled={payment.status !== 'SUCCESS'}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Receipt
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDownloadReceipt(payment.id)}
                              disabled={payment.status !== 'SUCCESS'}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download Receipt
                            </DropdownMenuItem>
                            {payment.status === 'FAILED' && (
                              <DropdownMenuItem
                                onClick={() => handleRetryPayment(payment.id)}
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Retry Payment
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Receipt Modal */}
      {showReceipt && selectedPayment && (
        <PaymentReceipt
          payment={selectedPayment}
          isOpen={showReceipt}
          onClose={() => {
            setShowReceipt(false);
            setSelectedPayment(null);
          }}
        />
      )}
    </>
  );
}