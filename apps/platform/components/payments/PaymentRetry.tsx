'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Button } from '@newcondo/ui/components/button';
import { Badge } from '@newcondo/ui/components/badge';
import { Alert, AlertDescription } from '@newcondo/ui/components/alert';
import { Progress } from '@newcondo/ui/components/progress';
import { toast } from '@newcondo/ui';
import {
  RefreshCw,
  AlertTriangle,
  Clock,
  CreditCard,
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign
} from 'lucide-react';
import { Payment } from '@/types/payment';

interface PaymentRetryProps {
  payment: Payment;
  maxRetries?: number;
  retryDelay?: number; // seconds between retries
  onSuccess?: (payment: Payment) => void;
  onFailure?: (error: string) => void;
  onMaxRetriesReached?: () => void;
}

interface RetryAttempt {
  attemptNumber: number;
  timestamp: Date;
  status: 'pending' | 'success' | 'failed';
  error?: string;
  transactionId?: string;
}

export default function PaymentRetry({
  payment,
  maxRetries = 3,
  retryDelay = 30,
  onSuccess,
  onFailure,
  onMaxRetriesReached
}: PaymentRetryProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [retryAttempts, setRetryAttempts] = useState<RetryAttempt[]>([]);
  const [countdown, setCountdown] = useState(0);
  const [canRetry, setCanRetry] = useState(true);
  const [lastRetryTime, setLastRetryTime] = useState<Date | null>(null);

  // Countdown timer for retry delay
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Check if payment can be retried
  useEffect(() => {
    const canRetryPayment = payment.status === 'FAILED' &&
      currentAttempt < maxRetries
    setCanRetry(canRetryPayment);
  }, [payment.status, currentAttempt, maxRetries]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const getPaymentStatusColor = (status: string) => {
    const colors = {
      SUCCESS: 'text-green-600',
      FAILED: 'text-red-600',
      PENDING: 'text-yellow-600',
      CANCELLED: 'text-gray-600'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600';
  };

  const getPaymentStatusIcon = (status: string) => {
    const icons = {
      SUCCESS: CheckCircle,
      FAILED: XCircle,
      PENDING: Clock,
      CANCELLED: XCircle
    };
    const Icon = icons[status as keyof typeof icons] || Clock;
    return <Icon className="w-4 h-4" />;
  };

  const handleRetryPayment = async () => {
    if (!canRetry || isRetrying || countdown > 0) return;

    const attemptNumber = currentAttempt + 1;
    setIsRetrying(true);
    setCurrentAttempt(attemptNumber);

    // Add new attempt to history
    const newAttempt: RetryAttempt = {
      attemptNumber,
      timestamp: new Date(),
      status: 'pending'
    };
    setRetryAttempts(prev => [...prev, newAttempt]);

    try {
      const response = await fetch('/api/payments/retry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: payment.id,
          attemptNumber
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Payment retry failed');
      }

      const result = await response.json();

      // Update attempt status
      setRetryAttempts(prev =>
        prev.map(attempt =>
          attempt.attemptNumber === attemptNumber
            ? {
              ...attempt,
              status: 'success',
              transactionId: result.transactionId
            }
            : attempt
        )
      );

      toast.success("Payment Successful!", {
        description: "Your payment has been processed successfully.",
      });

      onSuccess?.(result.payment);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment retry failed';

      // Update attempt status
      setRetryAttempts(prev =>
        prev.map(attempt =>
          attempt.attemptNumber === attemptNumber
            ? { ...attempt, status: 'failed', error: errorMessage }
            : attempt
        )
      );

      if (attemptNumber >= maxRetries) {
        toast.error("Maximum Retries Reached", {
          description: "Unable to process payment after multiple attempts. Please try a different payment method.",
        });
        onMaxRetriesReached?.();
      } else {
        toast.error("Payment Failed", {
          description: `Attempt ${attemptNumber} failed. You can retry in ${retryDelay} seconds.`,
        });
        setCountdown(retryDelay);
      }

      onFailure?.(errorMessage);
    } finally {
      setIsRetrying(false);
      setLastRetryTime(new Date());
    }
  };

  const getRetryButtonText = () => {
    if (isRetrying) return 'Processing...';
    if (countdown > 0) return `Retry in ${countdown}s`;
    if (currentAttempt >= maxRetries) return 'Max Retries Reached';
    return currentAttempt === 0 ? 'Retry Payment' : `Retry Payment (${currentAttempt}/${maxRetries})`;
  };

  const progressPercentage = Math.min((currentAttempt / maxRetries) * 100, 100);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className={`w-5 h-5 ${isRetrying ? 'animate-spin' : ''}`} />
          Payment Retry
        </CardTitle>
        <CardDescription>
          Retry your failed payment. You can attempt up to {maxRetries} times.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Original Payment Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-3">Payment Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Amount:</span>
              <span className="font-medium">{formatCurrency(Number(payment.amount))}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Original Date:</span>
              <span className="font-medium">{new Date(payment.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              {getPaymentStatusIcon(payment.status)}
              <span className="text-gray-600">Status:</span>
              <Badge variant="destructive">{payment.status}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Type:</span>
              <span className="font-medium capitalize">{payment.paymentType.toLowerCase()}</span>
            </div>
          </div>

          {payment.failureReason && (
            <div className="mt-3 p-3 bg-red-50 rounded border-l-4 border-red-200">
              <p className="text-sm text-red-700">
                <strong>Failure Reason:</strong> {payment.failureReason}
              </p>
            </div>
          )}
        </div>

        {/* Retry Progress */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Retry Progress</h3>
            <span className="text-sm text-gray-600">
              {currentAttempt} of {maxRetries} attempts
            </span>
          </div>
          <Progress value={progressPercentage} className="w-full" />
        </div>

        {/* Retry Attempts History */}
        {retryAttempts.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium">Retry Attempts</h3>
            <div className="space-y-2">
              {retryAttempts.map((attempt, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">Attempt {attempt.attemptNumber}</Badge>
                    <span className="text-sm text-gray-600">
                      {attempt.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {attempt.status === 'pending' && <Clock className="w-4 h-4 text-yellow-500" />}
                    {attempt.status === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
                    {attempt.status === 'failed' && <XCircle className="w-4 h-4 text-red-500" />}
                    <Badge
                      variant={
                        attempt.status === 'success' ? 'default' :
                          attempt.status === 'failed' ? 'destructive' : 'secondary'
                      }
                    >
                      {attempt.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alerts */}
        {!canRetry && currentAttempt >= maxRetries && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Maximum retry attempts reached. Please contact support or try a different payment method.
            </AlertDescription>
          </Alert>
        )}

        {canRetry && countdown > 0 && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Please wait {countdown} seconds before attempting another payment retry.
            </AlertDescription>
          </Alert>
        )}

        {canRetry && countdown === 0 && !isRetrying && (
          <Alert>
            <RefreshCw className="h-4 w-4" />
            <AlertDescription>
              Ready to retry payment. Click the button below to attempt payment again.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter className="flex gap-3">
        <Button
          onClick={handleRetryPayment}
          disabled={!canRetry || isRetrying || countdown > 0}
          className="flex-1"
        >
          {isRetrying && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
          {getRetryButtonText()}
        </Button>

        {currentAttempt >= maxRetries && (
          <Button variant="outline" asChild>
            <a href="/payments/methods">Try Different Method</a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}