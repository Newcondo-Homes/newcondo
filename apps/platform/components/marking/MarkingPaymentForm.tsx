'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Button } from '@newcondo/ui/components/button';
import { Label } from '@newcondo/ui/components/label';
import { RadioGroup, RadioGroupItem } from '@newcondo/ui/components/radio-group';
import { Checkbox } from '@newcondo/ui/components/checkbox';
import { Alert, AlertDescription } from '@newcondo/ui/components/alert';
import { CreditCard, Wallet, AlertCircle, Shield, Info } from 'lucide-react';
import { Separator } from '@newcondo/ui/components/separator';
import { CompensationBreakdown } from './CompensationBreakdown';

interface MarkingPaymentFormProps {
  jobId: string;
  markingFee: number;
  currency?: string;
  onPaymentInitiate: (method: PaymentMethod) => Promise<void>;
  isLoading?: boolean;
}

type PaymentMethod = 'CARD' | 'BANK_TRANSFER' | 'VIRTUAL_ACCOUNT';

export default function MarkingPaymentForm({
  jobId,
  markingFee,
  currency = 'NGN',
  onPaymentInitiate,
  isLoading = false,
}: MarkingPaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CARD');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    // Validation
    const newErrors: string[] = [];
    if (!agreedToTerms) {
      newErrors.push('You must agree to the terms and conditions');
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await onPaymentInitiate(paymentMethod);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Payment failed']);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment for Property Marking
          </CardTitle>
          <CardDescription>
            Secure payment for professional property marking service
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Fee Breakdown */}
          {/* <CompensationBreakdown
            totalFee={markingFee}
            agentCompensation={markingFee * 0.25}
            platformFee={markingFee * 0.75}
            currency={currency}
          /> */}

          <CompensationBreakdown
            markingType="agent_network"
            isPropertyOwner={true}
            userRole="OWNER"
          />
          <Separator />

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Payment Method</Label>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                <RadioGroupItem value="CARD" id="card" />
                <Label htmlFor="card" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Card Payment</p>
                      <p className="text-sm text-muted-foreground">
                        Pay with debit or credit card
                      </p>
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                <RadioGroupItem value="BANK_TRANSFER" id="bank" />
                <Label htmlFor="bank" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Bank Transfer</p>
                      <p className="text-sm text-muted-foreground">
                        Transfer to provided account details
                      </p>
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                <RadioGroupItem value="VIRTUAL_ACCOUNT" id="virtual" />
                <Label htmlFor="virtual" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Virtual Account</p>
                      <p className="text-sm text-muted-foreground">
                        Use your Newcondo virtual account
                      </p>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Payment Information */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2 text-sm">
                <p className="font-medium">Payment Process:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>₦1,000 will be sent to the agent upon marking</li>
                  <li>Remaining balance released after you verify the marking</li>
                  <li>You have 2-3 days to verify the completed marking</li>
                  <li>Secure payment processing via Flutterwave</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          {/* Security Notice */}
          <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
            <Shield className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Secure Payment</p>
              <p className="text-xs text-muted-foreground">
                Your payment information is encrypted and processed securely through Flutterwave.
              </p>
            </div>
          </div>

          {/* Terms Agreement */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                I agree to the terms and conditions
              </label>
              <p className="text-sm text-muted-foreground">
                I understand the payment structure and verification process for the property marking service.{' '}
                <a href="/terms/marking-service" className="text-primary hover:underline">
                  Read full terms
                </a>
              </p>
            </div>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isLoading || !agreedToTerms}
          >
            {isLoading ? 'Processing...' : `Pay ${formatCurrency(markingFee)}`}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            By proceeding, you authorize Newcondo to charge your selected payment method
          </p>
        </CardFooter>
      </Card>
    </form>
  );
}