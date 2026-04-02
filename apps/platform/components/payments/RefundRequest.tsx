'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Button } from '@newcondo/ui/components/button';
import { Input } from '@newcondo/ui/components/input';
import { Label } from '@newcondo/ui/components/label';
import { Textarea } from '@newcondo/ui/components/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@newcondo/ui/components/select';
import { Badge } from '@newcondo/ui/components/badge';
import { Alert, AlertDescription } from '@newcondo/ui/components/alert';
import { toast } from '@newcondo/ui';
import { AlertCircle, CreditCard, Calendar, User, FileText } from 'lucide-react';
import { Payment } from '@/types/api';

interface RefundRequestProps {
  payment: Payment;
  onRefundRequested?: (refundId: string) => void;
  onClose?: () => void;
}

interface RefundFormData {
  reason: string;
  customReason?: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  amount: number;
}

const REFUND_REASONS = [
  { value: 'property_unavailable', label: 'Property became unavailable' },
  { value: 'double_booking', label: 'Double booking occurred' },
  { value: 'property_mismatch', label: 'Property differs from listing' },
  { value: 'payment_error', label: 'Payment was made in error' },
  { value: 'rental_cancelled', label: 'Rental agreement cancelled' },
  { value: 'other', label: 'Other (please specify)' }
];

export default function RefundRequest({ payment, onRefundRequested, onClose }: RefundRequestProps) {
  const [formData, setFormData] = useState<RefundFormData>({
    reason: '',
    customReason: '',
    accountName: '',
    accountNumber: '',
    bankName: '',
    amount: Number(payment.amount)
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof RefundFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.reason) {
      newErrors.reason = 'Please select a refund reason';
    }

    if (formData.reason === 'other' && !formData.customReason?.trim()) {
      newErrors.customReason = 'Please specify the reason for refund';
    }

    if (!formData.accountName.trim()) {
      newErrors.accountName = 'Account name is required';
    }

    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
    } else if (!/^\d{10}$/.test(formData.accountNumber)) {
      newErrors.accountNumber = 'Account number must be 10 digits';
    }

    if (!formData.bankName.trim()) {
      newErrors.bankName = 'Bank name is required';
    }

    if (formData.amount <= 0 || formData.amount > Number(payment.amount)) {
      newErrors.amount = `Amount must be between ₦1 and ₦${payment.amount}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/payments/refund-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: payment.id,
          reason: formData.reason === 'other' ? formData.customReason : formData.reason,
          refundDetails: {
            accountName: formData.accountName,
            accountNumber: formData.accountNumber,
            bankName: formData.bankName,
            amount: formData.amount
          }
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit refund request');
      }

      const result = await response.json();
      
      toast.success("Refund Request Submitted", {
        description: "Your refund request has been submitted successfully. We'll review it within 24-48 hours.",
      });

      onRefundRequested?.(result.refundId);
      onClose?.();
    } catch (error) {
      toast.success("Submission Failed", {
        description: error instanceof Error ? error.message : "Failed to submit refund request",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      SUCCESS: 'default',
      PENDING: 'secondary',
      FAILED: 'destructive',
      REFUNDED: 'outline'
    };
    
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Request Refund
        </CardTitle>
        <CardDescription>
          Submit a refund request for your payment. All refund requests are reviewed by our team.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Payment Details */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
          <h3 className="font-medium">Payment Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Amount:</span>
              <span className="font-medium">{formatCurrency(Number(payment.amount))}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Date:</span>
              <span className="font-medium">{new Date(payment.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Status:</span>
              {getPaymentStatusBadge(payment.status)}
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Type:</span>
              <span className="font-medium capitalize">{payment.paymentType.toLowerCase()}</span>
            </div>
          </div>
        </div>

        {/* Refund Request Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Refund Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Refund *</Label>
            <Select 
              value={formData.reason} 
              onValueChange={(value) => handleInputChange('reason', value)}
            >
              <SelectTrigger className={errors.reason ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REFUND_REASONS.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.reason && (
              <p className="text-sm text-red-600">{errors.reason}</p>
            )}
          </div>

          {/* Custom Reason */}
          {formData.reason === 'other' && (
            <div className="space-y-2">
              <Label htmlFor="customReason">Please specify the reason *</Label>
              <Textarea
                id="customReason"
                value={formData.customReason || ''}
                onChange={(e) => handleInputChange('customReason', e.target.value)}
                placeholder="Please provide details about your refund request..."
                className={errors.customReason ? 'border-red-500' : ''}
              />
              {errors.customReason && (
                <p className="text-sm text-red-600">{errors.customReason}</p>
              )}
            </div>
          )}

          {/* Refund Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Refund Amount *</Label>
            <Input
              id="amount"
              type="number"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
              min="1"
              max={Number(payment.amount)}
              step="0.01"
              className={errors.amount ? 'border-red-500' : ''}
            />
            {errors.amount && (
              <p className="text-sm text-red-600">{errors.amount}</p>
            )}
            <p className="text-sm text-gray-600">
              Maximum refundable amount: {formatCurrency(Number(payment.amount))}
            </p>
          </div>

          {/* Bank Details */}
          <div className="space-y-4">
            <h3 className="font-medium">Bank Details for Refund</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accountName">Account Name *</Label>
                <Input
                  id="accountName"
                  value={formData.accountName}
                  onChange={(e) => handleInputChange('accountName', e.target.value)}
                  placeholder="Enter account name"
                  className={errors.accountName ? 'border-red-500' : ''}
                />
                {errors.accountName && (
                  <p className="text-sm text-red-600">{errors.accountName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number *</Label>
                <Input
                  id="accountNumber"
                  value={formData.accountNumber}
                  onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                  placeholder="Enter 10-digit account number"
                  maxLength={10}
                  className={errors.accountNumber ? 'border-red-500' : ''}
                />
                {errors.accountNumber && (
                  <p className="text-sm text-red-600">{errors.accountNumber}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="bankName">Bank Name *</Label>
                <Input
                  id="bankName"
                  value={formData.bankName}
                  onChange={(e) => handleInputChange('bankName', e.target.value)}
                  placeholder="Enter bank name"
                  className={errors.bankName ? 'border-red-500' : ''}
                />
                {errors.bankName && (
                  <p className="text-sm text-red-600">{errors.bankName}</p>
                )}
              </div>
            </div>
          </div>

          {/* Warning Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Refund requests are reviewed within 24-48 hours. 
              Processing may take 3-5 business days once approved. Please ensure your bank details are correct.
            </AlertDescription>
          </Alert>
        </form>
      </CardContent>

      <CardFooter className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Refund Request'}
        </Button>
      </CardFooter>
    </Card>
  );
}