// apps/platform/components/payments/CheckoutForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Lock, AlertCircle } from 'lucide-react';
import { PaymentLockStatus } from './PaymentLockStatus';
import { ConflictWarning } from './ConflictWarning';
import Link from 'next/link';

interface CheckoutFormProps {
  propertyId: string;
  unitId?: string;
  amount: number;
  currency?: string;
}

interface LockResponse {
  success: boolean;
  lockId?: string;
  expiresAt?: string;
  conflict?: {
    hasConflict: boolean;
    message: string;
  };
}

export default function CheckoutForm({
  propertyId,
  unitId,
  amount,
  currency = 'NGN',
}: CheckoutFormProps) {
  const router = useRouter();
  const [isAcquiringLock, setIsAcquiringLock] = useState(false);
  const [lockAcquired, setLockAcquired] = useState(false);
  const [lockId, setLockId] = useState<string | null>(null);
  const [lockExpiresAt, setLockExpiresAt] = useState<string | null>(null);
  const [conflict, setConflict] = useState<{ hasConflict: boolean; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Acquire payment lock
  const acquireLock = async () => {
    setIsAcquiringLock(true);
    setError(null);
    setConflict(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/lock/acquire`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          propertyId,
          unitId,
        }),
      });

      const data: LockResponse = await response.json();

      if (data.success && data.lockId) {
        setLockAcquired(true);
        setLockId(data.lockId);
        setLockExpiresAt(data.expiresAt || null);
      } else if (data.conflict?.hasConflict) {
        setConflict(data.conflict);
      } else {
        throw new Error('Failed to acquire payment lock');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to acquire payment lock');
    } finally {
      setIsAcquiringLock(false);
    }
  };

  // Release lock on unmount or when user leaves
  useEffect(() => {
    return () => {
      if (lockId) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/lock/release`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ lockId }),
          keepalive: true,
        }).catch(() => {
          // Silent fail on unmount
        });
      }
    };
  }, [lockId]);

  // Process payment
  const handlePayment = async () => {
    if (!lockAcquired || !lockId) {
      setError('Payment lock not acquired');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          propertyId,
          unitId,
          amount,
          lockId,
          paymentType: 'RENT',
        }),
      });

      const data = await response.json();

      if (data.success && data.paymentLink) {
        // Redirect to Flutterwave payment page
        window.location.href = data.paymentLink;
      } else {
        throw new Error(data.message || 'Failed to initiate payment');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment initiation failed');
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CreditCard className="h-6 w-6" />
          Secure Checkout
        </h2>
        <p className="text-gray-600 mt-1">Complete your property booking</p>
      </div>

      {/* Conflict Warning */}
      {conflict?.hasConflict && (
        // <ConflictWarning
        //   message={conflict.message}
        //   onRetry={acquireLock}
        //   onCancel={() => router.back()}
        // />
        <ConflictWarning
          type="PAYMENT_IN_PROGRESS"
          severity="warning"
          details={{ lockedUntil: undefined }}
          onAction={acquireLock}
          onDismiss={() => router.back()}
        />
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Payment Error</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Payment Summary */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="flex justify-between text-gray-700">
          <span>Monthly Rent</span>
          <span className="font-medium">{formatPrice(amount)}</span>
        </div>
        <div className="flex justify-between text-gray-700">
          <span>Service Fee</span>
          <span className="font-medium">₦0</span>
        </div>
        <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-900">
          <span>Total Amount</span>
          <span>{formatPrice(amount)}</span>
        </div>
      </div>

      {/* Lock Status */}
      {lockAcquired && lockExpiresAt && (
        // <PaymentLockStatus lockId={lockId!} expiresAt={lockExpiresAt} />
        <PaymentLockStatus
          isLocked={true}
          isCurrentUser={true}
          lockExpiry={new Date(lockExpiresAt)}
        />
      )}

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <Lock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="text-blue-900 font-medium">Secure Payment</p>
          <p className="text-blue-800 mt-1">
            Your payment is protected by our double-booking prevention system. Once you acquire a
            payment lock, the property is reserved for you for 15 minutes.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {!lockAcquired ? (
          <button
            onClick={acquireLock}
            disabled={isAcquiringLock}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isAcquiringLock ? (
              <>
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Acquiring Lock...
              </>
            ) : (
              <>
                <Lock className="h-5 w-5" />
                Secure Property & Continue
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5" />
                Proceed to Payment
              </>
            )}
          </button>
        )}

        <button
          onClick={() => router.back()}
          disabled={isProcessing || isAcquiringLock}
          className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>

      {/* Terms */}
      <p className="text-xs text-gray-600 text-center">
        By proceeding, you agree to our{' '}
        <Link href="/terms" className="text-blue-600 hover:underline">
          Terms of Service
        </Link>{' '}'
        and{' '}
        <Link href="/privacy" className="text-blue-600 hover:underline">
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}