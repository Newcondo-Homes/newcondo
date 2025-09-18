'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@newcondo/ui/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@newcondo/ui/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@newcondo/ui/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@newcondo/ui/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@newcondo/ui/components/ui/select';
import { Button } from '@newcondo/ui/components/ui/button';
import { Input } from '@newcondo/ui/components/ui/input';
import { Textarea } from '@newcondo/ui/components/ui/textarea';
import { Badge } from '@newcondo/ui/components/ui/badge';
import { Alert, AlertDescription } from '@newcondo/ui/components/ui/alert';
import { Loader2, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { paymentsApi } from '../../../lib/api/payments';

// Types
interface Payment {
  id: string;
  userId: string;
  rentalId?: string;
  markingJobId?: string;
  amount: number;
  currency: string;
  paymentType: string;
  status: string;
  paymentMethod?: string;
  flutterwaveRef?: string;
  transactionId?: string;
  description?: string;
  failureReason?: string;
  paidAt?: string;
  createdAt: string;
  user: {
    name?: string;
    email: string;
  };
  rental?: {
    property: {
      title: string;
    };
  };
}

interface RefundRequest {
  id: string;
  paymentId: string;
  amount: number;
  reason: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  requestedBy: string;
  processedBy?: string;
  createdAt: string;
  processedAt?: string;
  payment: Payment;
}

// Validation schemas
const refundSchema = z.object({
  amount: z.number().min(1, 'Amount must be greater than 0'),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  notifyUser: z.boolean().default(true),
});

const bulkRefundSchema = z.object({
  paymentIds: z.array(z.string()).min(1, 'Select at least one payment'),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

type RefundFormData = z.infer<typeof refundSchema>;
type BulkRefundFormData = z.infer<typeof bulkRefundSchema>;

export default function RefundManager() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [showBulkRefundDialog, setShowBulkRefundDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filter, setFilter] = useState('all');

  const refundForm = useForm<RefundFormData>({
    resolver: zodResolver(refundSchema),
    defaultValues: {
      notifyUser: true,
    },
  });

  const bulkRefundForm = useForm<BulkRefundFormData>({
    resolver: zodResolver(bulkRefundSchema),
  });

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [paymentsData, refundsData] = await Promise.all([
        paymentsApi.getRefundablePayments(),
        paymentsApi.getRefundRequests(),
      ]);
      setPayments(paymentsData);
      setRefundRequests(refundsData);
    } catch (error) {
      toast.error('Failed to fetch refund data');
      console.error('Error fetching refund data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter payments
  const filteredPayments = payments.filter((payment) => {
    if (filter === 'all') return true;
    if (filter === 'rent') return payment.paymentType === 'RENT';
    if (filter === 'deposit') return payment.paymentType === 'DEPOSIT';
    if (filter === 'marking') return payment.paymentType === 'PROPERTY_MARKING';
    return true;
  });

  // Handle single refund
  const handleRefund = async (data: RefundFormData) => {
    if (!selectedPayment) return;

    try {
      setIsProcessing(true);
      await paymentsApi.processRefund(selectedPayment.id, {
        amount: data.amount,
        reason: data.reason,
        notifyUser: data.notifyUser,
      });

      toast.success('Refund processed successfully');
      setShowRefundDialog(false);
      setSelectedPayment(null);
      refundForm.reset();
      fetchData();
    } catch (error) {
      toast.error('Failed to process refund');
      console.error('Error processing refund:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle bulk refund
  const handleBulkRefund = async (data: BulkRefundFormData) => {
    try {
      setIsProcessing(true);
      await paymentsApi.processBulkRefund({
        paymentIds: selectedPayments,
        reason: data.reason,
      });

      toast.success(`${selectedPayments.length} refunds processed successfully`);
      setShowBulkRefundDialog(false);
      setSelectedPayments([]);
      bulkRefundForm.reset();
      fetchData();
    } catch (error) {
      toast.error('Failed to process bulk refunds');
      console.error('Error processing bulk refunds:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle payment selection
  const togglePaymentSelection = (paymentId: string) => {
    setSelectedPayments((prev) =>
      prev.includes(paymentId)
        ? prev.filter((id) => id !== paymentId)
        : [...prev, paymentId]
    );
  };

  // Retry failed refund
  const retryRefund = async (refundId: string) => {
    try {
      await paymentsApi.retryRefund(refundId);
      toast.success('Refund retry initiated');
      fetchData();
    } catch (error) {
      toast.error('Failed to retry refund');
      console.error('Error retrying refund:', error);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency || 'NGN',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      SUCCESS: { variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      FAILED: { variant: 'destructive' as const, color: 'bg-red-100 text-red-800' },
      PENDING: { variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' },
      REFUNDED: { variant: 'outline' as const, color: 'bg-blue-100 text-blue-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    return (
      <Badge variant={config.variant} className={config.color}>
        {status}
      </Badge>
    );
  };

  const getRefundStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { variant: 'secondary' as const, icon: AlertCircle },
      PROCESSING: { variant: 'default' as const, icon: Loader2 },
      COMPLETED: { variant: 'default' as const, icon: CheckCircle2, color: 'bg-green-100 text-green-800' },
      FAILED: { variant: 'destructive' as const, icon: AlertCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.color || ''}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Refund Manager</h1>
          <p className="text-muted-foreground">
            Process refunds and manage refund requests
          </p>
        </div>
        <div className="flex gap-2">
          {selectedPayments.length > 0 && (
            <Button
              onClick={() => setShowBulkRefundDialog(true)}
              variant="outline"
            >
              Bulk Refund ({selectedPayments.length})
            </Button>
          )}
          <Button onClick={fetchData} variant="outline" size="icon">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="rent">Rent Payments</SelectItem>
            <SelectItem value="deposit">Deposits</SelectItem>
            <SelectItem value="marking">Property Marking</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Refundable</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatAmount(
                filteredPayments.reduce((sum, p) => sum + p.amount, 0),
                'NGN'
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Refunds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {refundRequests.filter((r) => r.status === 'PENDING').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {refundRequests.filter((r) => r.status === 'PROCESSING').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Failed Refunds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {refundRequests.filter((r) => r.status === 'FAILED').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Refundable Payments</CardTitle>
          <CardDescription>
            Select payments to process refunds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    onChange={(e) =>
                      setSelectedPayments(
                        e.target.checked
                          ? filteredPayments.map((p) => p.id)
                          : []
                      )
                    }
                    checked={
                      filteredPayments.length > 0 &&
                      selectedPayments.length === filteredPayments.length
                    }
                  />
                </TableHead>
                <TableHead>Transaction</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedPayments.includes(payment.id)}
                      onChange={() => togglePaymentSelection(payment.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{payment.transactionId}</div>
                      <div className="text-sm text-muted-foreground">
                        {payment.flutterwaveRef}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{payment.user.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {payment.user.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatAmount(payment.amount, payment.currency)}
                  </TableCell>
                  <TableCell>{payment.paymentType}</TableCell>
                  <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  <TableCell>
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedPayment(payment);
                        refundForm.setValue('amount', payment.amount);
                        setShowRefundDialog(true);
                      }}
                    >
                      Refund
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Refund Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Refund Requests</CardTitle>
          <CardDescription>
            Track the status of processed refunds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request ID</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {refundRequests.slice(0, 10).map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-mono text-sm">
                    {request.id.slice(-8)}
                  </TableCell>
                  <TableCell>{request.payment.transactionId}</TableCell>
                  <TableCell>{request.payment.user.email}</TableCell>
                  <TableCell>
                    {formatAmount(request.amount, request.payment.currency)}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {request.reason}
                  </TableCell>
                  <TableCell>{getRefundStatusBadge(request.status)}</TableCell>
                  <TableCell>
                    {new Date(request.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {request.status === 'FAILED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => retryRefund(request.id)}
                      >
                        Retry
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Single Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Process a refund for the selected payment
            </DialogDescription>
          </DialogHeader>

          <Form {...refundForm}>
            <form onSubmit={refundForm.handleSubmit(handleRefund)} className="space-y-4">
              {selectedPayment && (
                <Alert>
                  <AlertDescription>
                    <strong>Payment:</strong> {selectedPayment.transactionId} <br />
                    <strong>Customer:</strong> {selectedPayment.user.email} <br />
                    <strong>Original Amount:</strong> {formatAmount(selectedPayment.amount, selectedPayment.currency)}
                  </AlertDescription>
                </Alert>
              )}

              <FormField
                control={refundForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Refund Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum refundable: {selectedPayment && formatAmount(selectedPayment.amount, selectedPayment.currency)}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={refundForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Refund Reason</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explain the reason for this refund..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={refundForm.control}
                name="notifyUser"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Notify Customer</FormLabel>
                      <FormDescription>
                        Send email notification to the customer about this refund
                      </FormDescription>
                    </div>
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRefundDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isProcessing}>
                  {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Process Refund
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Bulk Refund Dialog */}
      <Dialog open={showBulkRefundDialog} onOpenChange={setShowBulkRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Refund</DialogTitle>
            <DialogDescription>
              Process refunds for {selectedPayments.length} selected payments
            </DialogDescription>
          </DialogHeader>

          <Form {...bulkRefundForm}>
            <form onSubmit={bulkRefundForm.handleSubmit(handleBulkRefund)} className="space-y-4">
              <Alert>
                <AlertDescription>
                  <strong>Selected Payments:</strong> {selectedPayments.length} <br />
                  <strong>Total Amount:</strong> {formatAmount(
                    payments
                      .filter(p => selectedPayments.includes(p.id))
                      .reduce((sum, p) => sum + p.amount, 0),
                    'NGN'
                  )}
                </AlertDescription>
              </Alert>

              <FormField
                control={bulkRefundForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Refund Reason</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explain the reason for these bulk refunds..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowBulkRefundDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isProcessing}>
                  {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Process {selectedPayments.length} Refunds
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}