'use client';

import React from 'react';
import { AlertCircle, RefreshCw, CreditCard, ArrowLeft } from 'lucide-react';
import { Button } from '@newcondo/ui';

interface PaymentErrorProps {
  error: {
    code?: string;
    message?: string;
    type?: 'NETWORK' | 'VALIDATION' | 'PAYMENT_GATEWAY' | 'INSUFFICIENT_FUNDS' | 'CARD_DECLINED' | 'EXPIRED_CARD' | 'GENERAL';
    transactionRef?: string;
    timestamp?: Date;
    retryable?: boolean;
  };
  onRetry?: () => void;
  onGoBack?: () => void;
  showRetry?: boolean;
  showGoBack?: boolean;
  className?: string;
}

const PaymentError: React.FC<PaymentErrorProps> = ({
  error,
  onRetry,
  onGoBack,
  showRetry = true,
  showGoBack = true,
  className = '',
}) => {
  const getErrorTitle = () => {
    switch (error.type) {
      case 'NETWORK':
        return 'Connection Problem';
      case 'VALIDATION':
        return 'Invalid Payment Information';
      case 'PAYMENT_GATEWAY':
        return 'Payment Service Error';
      case 'INSUFFICIENT_FUNDS':
        return 'Insufficient Funds';
      case 'CARD_DECLINED':
        return 'Card Declined';
      case 'EXPIRED_CARD':
        return 'Card Expired';
      default:
        return 'Payment Failed';
    }
  };

  const getErrorMessage = () => {
    if (error.message) return error.message;
    
    switch (error.type) {
      case 'NETWORK':
        return 'Unable to connect to payment service. Please check your internet connection and try again.';
      case 'VALIDATION':
        return 'Please check your payment details and ensure all required fields are filled correctly.';
      case 'PAYMENT_GATEWAY':
        return 'There was an issue processing your payment. Our payment service is temporarily unavailable.';
      case 'INSUFFICIENT_FUNDS':
        return 'Your account does not have sufficient funds to complete this transaction.';
      case 'CARD_DECLINED':
        return 'Your card was declined by your bank. Please try a different card or contact your bank.';
      case 'EXPIRED_CARD':
        return 'The card you are trying to use has expired. Please use a valid card.';
      default:
        return 'An unexpected error occurred while processing your payment. Please try again.';
    }
  };

  const getSuggestions = () => {
    switch (error.type) {
      case 'NETWORK':
        return [
          'Check your internet connection',
          'Try refreshing the page',
          'Contact your internet service provider if the problem persists',
        ];
      case 'VALIDATION':
        return [
          'Verify your card number is correct',
          'Check the expiration date',
          'Ensure the CVV is correct',
          'Confirm your billing address matches your card',
        ];
      case 'PAYMENT_GATEWAY':
        return [
          'Wait a few minutes and try again',
          'Try using a different payment method',
          'Contact support if the issue continues',
        ];
      case 'INSUFFICIENT_FUNDS':
        return [
          'Check your account balance',
          'Try using a different card',
          'Contact your bank for assistance',
        ];
      case 'CARD_DECLINED':
        return [
          'Contact your bank to authorize the transaction',
          'Try using a different card',
          'Ensure your card is activated for online payments',
        ];
      case 'EXPIRED_CARD':
        return [
          'Use an active, non-expired card',
          'Contact your bank for a replacement card',
          'Try using a different payment method',
        ];
      default:
        return [
          'Try refreshing the page',
          'Use a different payment method',
          'Contact support if the problem persists',
        ];
    }
  };

  const getErrorColor = () => {
    switch (error.type) {
      case 'NETWORK':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'INSUFFICIENT_FUNDS':
      case 'CARD_DECLINED':
      case 'EXPIRED_CARD':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'PAYMENT_GATEWAY':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const canRetry = error.retryable !== false && showRetry && onRetry;

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      <div className={`border rounded-lg p-6 ${getErrorColor()}`}>
        <div className="flex items-center mb-4">
          <AlertCircle className="w-8 h-8 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold">{getErrorTitle()}</h3>
            {error.code && (
              <p className="text-sm opacity-75">Error Code: {error.code}</p>
            )}
          </div>
        </div>
        
        <p className="mb-4 leading-relaxed">{getErrorMessage()}</p>
        
        <div className="mb-6">
          <h4 className="font-medium mb-2">What you can do:</h4>
          <ul className="space-y-1">
            {getSuggestions().map((suggestion, index) => (
              <li key={index} className="text-sm flex items-start">
                <span className="w-1.5 h-1.5 bg-current rounded-full mt-2 mr-2 flex-shrink-0" />
                {suggestion}
              </li>
            ))}
          </ul>
        </div>

        {error.transactionRef && (
          <div className="mb-4 p-3 bg-white bg-opacity-50 rounded border">
            <p className="text-sm">
              <span className="font-medium">Transaction Reference:</span>
              <br />
              <span className="font-mono text-xs">{error.transactionRef}</span>
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          {canRetry && (
            <Button
              onClick={onRetry}
              variant="default"
              className="flex items-center justify-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
          
          {showGoBack && onGoBack && (
            <Button
              onClick={onGoBack}
              variant="outline"
              className="flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-current border-opacity-20">
          <p className="text-xs opacity-75">
            Need help? Contact our support team with the transaction reference above.
            {error.timestamp && (
              <span className="block mt-1">
                Error occurred: {error.timestamp.toLocaleString()}
              </span>
            )}
          </p>
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <div className="flex items-center justify-center text-sm text-gray-500">
          <CreditCard className="w-4 h-4 mr-2" />
          Secured payment processing
        </div>
      </div>
    </div>
  );
};

export default PaymentError;