// apps/admin/src/components/payments/RefundForm.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, DollarSign, CheckCircle } from 'lucide-react';

interface RefundFormProps {
  transactionId: string;
  originalAmount: number;
  currency: string;
  onSubmit: (data: {
    amount: number;
    reason: string;
    notes?: string;
  }) => Promise<void>;
  onCancel: () => void;
}

export default function RefundForm({
  transactionId,
  originalAmount,
  currency,
  onSubmit,
  onCancel,
}: RefundFormProps) {
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [amount, setAmount] = useState(originalAmount.toString());
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refundReasons = [
    { value: 'DUPLICATE_PAYMENT', label: 'Duplicate Payment' },
    { value: 'CANCELLED_BOOKING', label: 'Cancelled Booking' },
    { value: 'SERVICE_NOT_DELIVERED', label: 'Service Not Delivered' },
    { value: 'CUSTOMER_REQUEST', label: 'Customer Request' },
    { value: 'TECHNICAL_ERROR', label: 'Technical Error' },
    { value: 'FRAUDULENT_TRANSACTION', label: 'Fraudulent Transaction' },
    { value: 'QUALITY_ISSUE', label: 'Quality Issue' },
    { value: 'OTHER', label: 'Other' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    const refundAmount = parseFloat(amount);
    if (isNaN(refundAmount) || refundAmount <= 0) {
      setError('Please enter a valid refund amount');
      return;
    }

    if (refundAmount > originalAmount) {
      setError('Refund amount cannot exceed the original transaction amount');
      return;
    }

    if (!reason) {
      setError('Please select a refund reason');
      return;
    }

    if (reason === 'OTHER' && !notes.trim()) {
      setError('Please provide additional details for "Other" reason');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        amount: refundAmount,
        reason,
        notes,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process refund');
    } finally {
      setSubmitting(false);
    }
  };

  const formatAmount = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency || 'NGN',
    }).format(value);
  };

  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          Issue Refund
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Original Amount Display */}
          <Alert>
            <DollarSign className="h-4 w-4" />
            <AlertDescription>
              Original Transaction Amount: <strong>{formatAmount(originalAmount)}</strong>
            </AlertDescription>
          </Alert>

          {/* Refund Type */}
          <div className="space-y-2">
            <Label>Refund Type *</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="refundType"
                  value="full"
                  checked={refundType === 'full'}
                  onChange={(e) => {
                    setRefundType('full');
                    setAmount(originalAmount.toString());
                  }}
                  className="h-4 w-4"
                />
                <span className="text-sm">Full Refund</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="refundType"
                  value="partial"
                  checked={refundType === 'partial'}
                  onChange={(e) => {
                    setRefundType('partial');
                    setAmount('');
                  }}
                  className="h-4 w-4"
                />
                <span className="text-sm">Partial Refund</span>
              </label>
            </div>
          </div>

          {/* Refund Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Refund Amount ({currency}) *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                max={originalAmount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={refundType === 'full' || submitting}
                className="pl-10"
                placeholder="Enter refund amount"
              />
            </div>
            <p className="text-xs text-gray-500">
              Maximum: {formatAmount(originalAmount)}
            </p>
          </div>

          {/* Refund Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Refund Reason *</Label>
            <Select value={reason} onValueChange={setReason} disabled={submitting}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {refundReasons.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              Additional Notes {reason === 'OTHER' && '*'}
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={submitting}
              placeholder="Provide additional context for the refund..."
              rows={4}
            />
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Confirmation Warning */}
          <Alert className="border-yellow-500 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Warning:</strong> This action cannot be undone. The refund will be processed
              immediately to the customer's original payment method.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={submitting}
            >
              {submitting ? 'Processing...' : `Refund ${formatAmount(parseFloat(amount) || 0)}`}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}