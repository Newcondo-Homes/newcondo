'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@newcondo/ui/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@newcondo/ui/components/ui/form';
import { Input } from '@newcondo/ui/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@newcondo/ui/components/ui/select';
import { Separator } from '@newcondo/ui/components/ui/separator';
import { Badge } from '@newcondo/ui/components/ui/badge';
import { AlertCircle, CreditCard, Loader2, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@newcondo/ui/components/ui/alert';
import { usePayments } from '@/hooks/usePayments';
import { PaymentMethods } from './PaymentMethods';
import { formatCurrency } from '@/lib/utils/format';

const paymentSchema = z.object({
  amount: z.number().min(1, 'Amount must be greater than 0'),
  paymentMethod: z.string().min(1, 'Please select a payment method'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(11, 'Please enter a valid phone number'),
  fullName: z.string().min(2, 'Please enter your full name'),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentFormProps {
  propertyId?: string;
  unitId?: string;
  rentalId?: string;
  markingJobId?: string;
  paymentType: 'RENT' | 'DEPOSIT' | 'PROPERTY_MARKING';
  amount: number;
  currency?: string;
  description?: string;
  onSuccess?: (paymentData: any) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export function PaymentForm({
  propertyId,
  unitId,
  rentalId,
  markingJobId,
  paymentType,
  amount,
  currency = 'NGN',
  description,
  onSuccess,
  onError,
  disabled = false,
}: PaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const { initiatePayment, isLoading } = usePayments();

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount,
      paymentMethod: '',
      email: '',
      phone: '',
      fullName: '',
    },
  });

  const onSubmit = async (data: PaymentFormData) => {
    if (disabled || isProcessing) return;

    setIsProcessing(true);
    
    try {
      const paymentData = {
        ...data,
        propertyId,
        unitId,
        rentalId,
        markingJobId,
        paymentType,
        currency,
        description,
      };

      const result = await initiatePayment(paymentData);
      
      if (result.success) {
        onSuccess?.(result.data);
      } else {
        onError?.(result.error || 'Payment initiation failed');
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMethodSelect = (method: string) => {
    setSelectedMethod(method);
    form.setValue('paymentMethod', method);
  };

  const getPaymentTitle = () => {
    switch (paymentType) {
      case 'RENT':
        return 'Pay Rent';
      case 'DEPOSIT':
        return 'Pay Deposit';
      case 'PROPERTY_MARKING':
        return 'Pay Marking Fee';
      default:
        return 'Make Payment';
    }
  };

  const getPaymentDescription = () => {
    switch (paymentType) {
      case 'RENT':
        return 'Secure your rental with our encrypted payment system';
      case 'DEPOSIT':
        return 'Pay your security deposit to confirm the rental';
      case 'PROPERTY_MARKING':
        return 'Pay for professional property boundary marking service';
      default:
        return 'Complete your payment securely';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {getPaymentTitle()}
          </CardTitle>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Secure
          </Badge>
        </div>
        <CardDescription>
          {getPaymentDescription()}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Payment Summary */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Payment Amount:</span>
            <span className="text-lg font-bold">
              {formatCurrency(amount, currency)}
            </span>
          </div>
          {description && (
            <div className="flex justify-between items-start">
              <span className="text-sm text-muted-foreground">Description:</span>
              <span className="text-sm text-right max-w-xs">{description}</span>
            </div>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Payment Method Selection */}
            <div className="space-y-3">
              <FormLabel>Select Payment Method</FormLabel>
              <PaymentMethods
                selectedMethod={selectedMethod}
                onMethodSelect={handleMethodSelect}
                amount={amount}
                currency={currency}
              />
              {form.formState.errors.paymentMethod && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.paymentMethod.message}
                </p>
              )}
            </div>

            <Separator />

            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Customer Information</h3>
              
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your full name"
                        {...field}
                        disabled={disabled || isProcessing}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="your@email.com"
                          {...field}
                          disabled={disabled || isProcessing}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input 
                          type="tel"
                          placeholder="08012345678"
                          {...field}
                          disabled={disabled || isProcessing}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Security Notice */}
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Your payment is secured with 256-bit SSL encryption and processed by Flutterwave.
                Your card details are never stored on our servers.
              </AlertDescription>
            </Alert>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={disabled || isProcessing || isLoading || !selectedMethod}
            >
              {(isProcessing || isLoading) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isProcessing ? 'Processing Payment...' : `Pay ${formatCurrency(amount, currency)}`}
            </Button>

            {/* Terms */}
            <p className="text-xs text-muted-foreground text-center">
              By clicking "Pay {formatCurrency(amount, currency)}", you agree to our{' '}
              <a href="/terms" className="underline hover:no-underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="underline hover:no-underline">
                Privacy Policy
              </a>
              .
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}