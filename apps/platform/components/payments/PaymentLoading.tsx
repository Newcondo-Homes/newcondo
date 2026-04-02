'use client';

import { Card, CardContent } from "@newcondo/ui/components/card";
import { LoadingSpinner } from "../shared/feedback/LoadingSpinner";
import { CreditCard, Clock, Shield } from "lucide-react";

interface PaymentLoadingProps {
  stage?: 'initializing' | 'processing' | 'verifying' | 'completing';
  amount?: number;
  currency?: string;
  paymentMethod?: string;
}

const LOADING_STAGES = {
  initializing: {
    title: 'Initializing Payment',
    description: 'Setting up your payment...',
    icon: CreditCard,
  },
  processing: {
    title: 'Processing Payment',
    description: 'Your payment is being processed...',
    icon: Clock,
  },
  verifying: {
    title: 'Verifying Payment',
    description: 'Confirming payment with bank...',
    icon: Shield,
  },
  completing: {
    title: 'Completing Transaction',
    description: 'Finalizing your payment...',
    icon: CreditCard,
  },
};

export function PaymentLoading({ 
  stage = 'processing',
  amount,
  currency = 'NGN',
  paymentMethod = 'Card'
}: PaymentLoadingProps) {
  const stageConfig = LOADING_STAGES[stage];
  const IconComponent = stageConfig.icon;

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            {/* Loading Animation */}
            <div className="relative">
              <div className="flex justify-center">
                <div className="relative">
                  <LoadingSpinner size="lg" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <IconComponent className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {stageConfig.title}
              </h3>
              <p className="text-sm text-gray-600">
                {stageConfig.description}
              </p>
            </div>

            {/* Payment Details */}
            {amount && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">
                    {formatAmount(amount, currency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium">{paymentMethod}</span>
                </div>
              </div>
            )}

            {/* Progress Indicator */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Progress</span>
                <span>
                  {stage === 'initializing' && '25%'}
                  {stage === 'processing' && '50%'}
                  {stage === 'verifying' && '75%'}
                  {stage === 'completing' && '90%'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{
                    width: 
                      stage === 'initializing' ? '25%' :
                      stage === 'processing' ? '50%' :
                      stage === 'verifying' ? '75%' :
                      stage === 'completing' ? '90%' : '0%'
                  }}
                />
              </div>
            </div>

            {/* Security Notice */}
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
              <Shield className="h-3 w-3" />
              <span>Secured by Flutterwave</span>
            </div>

            {/* Warning */}
            <p className="text-xs text-amber-600 bg-amber-50 rounded p-2">
              Please do not close this window or navigate away during payment processing
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PaymentLoading;