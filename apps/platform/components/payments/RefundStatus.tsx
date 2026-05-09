'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@newcondo/ui/components/alert';
import { Button } from '@newcondo/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Badge } from '@newcondo/ui/components/badge';
import { formatCurrency } from '@/lib/utils/format';
import { paymentsApi } from '@/lib/api/payments';


interface RefundStatusProps {
  rentalId: string;
  paymentId: string;
}

interface RefundDetails {
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  amount: number;
  currency: string;
  requestedAt: string;
  processedAt?: string;
  failureReason?: string;
  estimatedCompletionTime?: string;
  refundMethod: string;
  transactionId?: string;
}

export function RefundStatus({ paymentId }: RefundStatusProps) {
  const [showDetails, setShowDetails] = useState(false);

  const { data: refund, isLoading, error } = useQuery({
    queryKey: ['refund-status', paymentId],
    queryFn: () => paymentsApi.getRefundStatus(paymentId),
    refetchInterval: (query) => {
      const data = query.state.data;
      // Poll every 10 seconds if pending or processing
      if (data?.status === 'PENDING' || data?.status === 'PROCESSING') {
        return 10000;
      }
      return false;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2">
            <Clock className="h-5 w-5 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading refund status...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !refund) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Unable to load refund status. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  const getStatusConfig = (status: RefundDetails['status']): {
  icon: typeof Clock;
  color: string;
  bgColor: string;
  badge: 'default' | 'secondary' | 'destructive' | 'outline';
  title: string;
  description: string;
} => {
    switch (status) {
      case 'PENDING':
        return {
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          badge: 'secondary',
          title: 'Refund Pending',
          description: 'Your refund request is being reviewed.',
        };
      case 'PROCESSING':
        return {
          icon: Clock,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          badge: 'default',
          title: 'Refund Processing',
          description: 'Your refund is being processed.',
        };
      case 'COMPLETED':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          badge: 'default',
          title: 'Refund Completed',
          description: 'Your refund has been processed successfully.',
        };
      case 'FAILED':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          badge: 'destructive',
          title: 'Refund Failed',
          description: 'There was an issue processing your refund.',
        };
    }
  };

  const config = getStatusConfig(refund.status);
  const StatusIcon = config.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Refund Status</span>
          <Badge variant={config.badge}>{refund.status}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`flex items-start space-x-3 p-4 rounded-lg ${config.bgColor}`}>
          <StatusIcon className={`h-5 w-5 mt-0.5 ${config.color}`} />
          <div className="flex-1">
            <h4 className={`font-medium ${config.color}`}>{config.title}</h4>
            <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Refund Amount</span>
            <span className="font-semibold">
              {formatCurrency(refund.amount, refund.currency)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Requested On</span>
            <span className="text-sm">
              {new Date(refund.requestedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {refund.processedAt && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Processed On</span>
              <span className="text-sm">
                {new Date(refund.processedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}

          {refund.estimatedCompletionTime && refund.status === 'PROCESSING' && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Estimated Completion</span>
              <span className="text-sm">
                {new Date(refund.estimatedCompletionTime).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Refund Method</span>
            <span className="text-sm capitalize">{refund.refundMethod}</span>
          </div>
        </div>

        {refund.failureReason && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Refund Failed</AlertTitle>
            <AlertDescription>{refund.failureReason}</AlertDescription>
          </Alert>
        )}

        {refund.transactionId && (
          <div className="pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full"
            >
              {showDetails ? 'Hide' : 'Show'} Transaction Details
            </Button>
            {showDetails && (
              <div className="mt-2 p-3 bg-muted rounded-md">
                <p className="text-xs text-muted-foreground">Transaction ID</p>
                <p className="text-sm font-mono mt-1 break-all">{refund.transactionId}</p>
              </div>
            )}
          </div>
        )}

        {refund.status === 'PROCESSING' && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertTitle>Processing Time</AlertTitle>
            <AlertDescription>
              Refunds typically take 3-5 business days to reflect in your account.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}