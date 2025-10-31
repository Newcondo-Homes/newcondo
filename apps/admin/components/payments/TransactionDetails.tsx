// apps/admin/src/components/payments/TransactionDetails.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  DollarSign,
  User,
  Calendar,
  CreditCard,
  FileText,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Download,
} from 'lucide-react';
import PaymentStatusBadge from './PaymentStatusBadge';
import CommissionBreakdown from './CommissionBreakdown';
import PaymentTimeline from './PaymentTimeline';

interface TransactionDetails {
  id: string;
  userId: string;
  user: {
    name: string;
    email: string;
    phone?: string;
  };
  rentalId?: string;
  rental?: {
    id: string;
    propertyId: string;
    propertyTitle: string;
    propertyAddress: string;
  };
  markingJobId?: string;
  markingJob?: {
    id: string;
    propertyAddress: string;
    agentName?: string;
  };
  amount: number;
  currency: string;
  paymentType: string;
  status: string;
  paymentMethod?: string;
  flutterwaveRef?: string;
  transactionId?: string;
  agentCommission?: number;
  platformFee?: number;
  ownerAmount?: number;
  confirmationPeriodEnd?: string;
  isReleased: boolean;
  releasedAt?: string;
  description?: string;
  failureReason?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface TransactionDetailsProps {
  transactionId: string;
  onRefund?: (transactionId: string) => void;
  onRelease?: (transactionId: string) => void;
}

export default function TransactionDetails({
  transactionId,
  onRefund,
  onRelease,
}: TransactionDetailsProps) {
  const [transaction, setTransaction] = useState<TransactionDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactionDetails();
  }, [transactionId]);

  const fetchTransactionDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/payments/${transactionId}`);
      if (!response.ok) throw new Error('Failed to fetch transaction details');
      
      const data = await response.json();
      setTransaction(data.transaction);
    } catch (error) {
      console.error('Error fetching transaction details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async () => {
    try {
      const response = await fetch(`/api/admin/payments/${transactionId}/receipt`);
      if (!response.ok) throw new Error('Failed to download receipt');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${transactionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency || 'NGN',
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!transaction) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-gray-500">
            Transaction not found
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transaction Details</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                ID: {transaction.transactionId || transaction.id}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownloadReceipt}>
                <Download className="h-4 w-4 mr-2" />
                Receipt
              </Button>
              <Button variant="outline" size="sm" onClick={fetchTransactionDetails}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Status and Amount */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <PaymentStatusBadge status={transaction.status} />
              </div>
              {transaction.failureReason && (
                <div className="flex items-start gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                  <span>{transaction.failureReason}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Amount</span>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {formatAmount(transaction.amount, transaction.currency)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {transaction.currency}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Payment Type</p>
                  <Badge className="mt-1" variant="secondary">
                    {transaction.paymentType.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="font-medium mt-1">
                    {transaction.paymentMethod || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Payment Date</p>
                  <p className="font-medium mt-1">
                    {transaction.paidAt
                      ? new Date(transaction.paidAt).toLocaleString()
                      : 'Not paid yet'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {transaction.flutterwaveRef && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Flutterwave Reference</p>
                  <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                    {transaction.flutterwaveRef}
                  </p>
                </div>
              )}

              {transaction.transactionId && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Transaction ID</p>
                  <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                    {transaction.transactionId}
                  </p>
                </div>
              )}

              {transaction.description && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Description</p>
                  <p className="text-sm">{transaction.description}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">User Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-gray-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium">{transaction.user.name}</p>
              <p className="text-sm text-gray-600">{transaction.user.email}</p>
              {transaction.user.phone && (
                <p className="text-sm text-gray-600">{transaction.user.phone}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Property/Job Information */}
      {(transaction.rental || transaction.markingJob) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {transaction.rental ? 'Rental Information' : 'Marking Job Information'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transaction.rental && (
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">Property</p>
                  <p className="font-medium">{transaction.rental.propertyTitle}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="text-sm">{transaction.rental.propertyAddress}</p>
                </div>
              </div>
            )}

            {transaction.markingJob && (
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">Property Address</p>
                  <p className="text-sm">{transaction.markingJob.propertyAddress}</p>
                </div>
                {transaction.markingJob.agentName && (
                  <div>
                    <p className="text-sm text-gray-600">Assigned Agent</p>
                    <p className="font-medium">{transaction.markingJob.agentName}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Commission Breakdown */}
      {(transaction.agentCommission || transaction.platformFee || transaction.ownerAmount) && (
        <CommissionBreakdown
          totalAmount={transaction.amount}
          agentCommission={transaction.agentCommission}
          platformFee={transaction.platformFee}
          ownerAmount={transaction.ownerAmount}
          currency={transaction.currency}
        />
      )}

      {/* Payment Timeline */}
      <PaymentTimeline transactionId={transaction.id} />

      {/* Admin Actions */}
      {(onRefund || onRelease) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Admin Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {onRefund && transaction.status === 'SUCCESS' && (
                <Button
                  variant="destructive"
                  onClick={() => onRefund(transaction.id)}
                >
                  Issue Refund
                </Button>
              )}
              {onRelease && transaction.status === 'HELD' && !transaction.isReleased && (
                <Button
                  variant="default"
                  onClick={() => onRelease(transaction.id)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Release Payment
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}