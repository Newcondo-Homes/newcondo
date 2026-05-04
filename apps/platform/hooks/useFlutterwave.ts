// apps/platform/hooks/useFlutterwave.ts
'use client'

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@newcondo/ui';
import { flutterwaveClient, generatePaymentReference, validatePaymentAmount } from '@/lib/api/flutterwave';
import { usePayments } from '@/hooks/usePayments';
import { useAuthStore } from '@/store/authStore';
import type {
  FlutterwaveCustomer,
  FlutterwaveCustomization,
  FlutterwaveResponse,
} from '@/types/payment';

interface UseFlutterwaveConfig {
  amount: number;
  currency?: string;
  description?: string;
  propertyId?: string;
  rentalId?: string;
  markingJobId?: string;
  redirectUrl?: string;
  onSuccess?: (response: FlutterwaveResponse) => void;
  onError?: (error: any) => void;
  onCancel?: () => void;
}

export const useFlutterwave = (config: UseFlutterwaveConfig) => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { initiatePayment, confirmPayment, isCreatingPayment, isConfirmingPayment } = usePayments();

  const [isInitializing, setIsInitializing] = useState(false);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const [flutterwaveLoaded, setFlutterwaveLoaded] = useState(false);

  // Check if Flutterwave script is loaded
  useEffect(() => {
    const checkFlutterwaveScript = () => {
      if (window.FlutterwaveCheckout) {
        setFlutterwaveLoaded(true);
      }
    };

    checkFlutterwaveScript();

    // Check periodically if not loaded
    const interval = setInterval(() => {
      if (!flutterwaveLoaded && window.FlutterwaveCheckout) {
        setFlutterwaveLoaded(true);
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [flutterwaveLoaded]);

  // Create payment and get reference
  const createPaymentRecord = useCallback(async () => {
    if (!user || !user.id || isCreatingPayment) {
      toast.error('Error', {
        description: 'User not authenticated or payment is already being created.',
      });
      return;
    }

    if (!validatePaymentAmount(config.amount)) {
      toast.error('Validation Error', {
        description: 'Invalid payment amount.',
      });
      return;
    }

    setIsInitializing(true);
    try {
      const paymentRef = generatePaymentReference(user.id);
      setPaymentReference(paymentRef);

      const paymentType = config.rentalId ? 'RENTAL' : config.markingJobId ? 'PROPERTY_MARKING' : 'GENERAL';

      await initiatePayment({
        userId: user.id,
        amount: config.amount,
        currency: config.currency || 'NGN',
        description: config.description || 'NewCondo Payment',
        txRef: paymentRef,
        paymentType,
        rentalId: config.rentalId,
        markingJobId: config.markingJobId,
      });



    } catch (error) {
      console.error('Failed to create payment record:', error);
      toast.error('Payment Error', {
        description: 'Failed to initialize payment. Please try again.',
      });
      setIsInitializing(false);
      if (config.onError) {
        config.onError(error);
      }
    }
  }, [user, config, isCreatingPayment, initiatePayment, toast]);

  // Handle payment success callback from Flutterwave
  const handlePaymentSuccess = useCallback(async (response: FlutterwaveResponse, paymentId: string) => {
    if (response.status === 'successful' && response.transaction_id) {
      try {
        const confirmResult = await confirmPayment({
          paymentId,
          data: {
            flutterwaveRef: response.transaction_id,
            txRef: response.tx_ref,
          },
        });

        if (confirmResult.success) {
          toast.success('Payment Confirmed', {
            description: 'Your payment was successful and confirmed.',
          });
          if (config.onSuccess) {
            config.onSuccess(response);
          }
        } else {
          toast.error('Payment Verification Failed', {
            description: confirmResult.message || 'Payment was successful but could not be verified.',
          });
          if (config.onError) {
            config.onError(new Error(confirmResult.message));
          }
        }
      } catch (error) {
        console.error('Payment confirmation error:', error);
        toast.error('Payment Error', {
          description: 'An error occurred while confirming your payment.',
        });
        if (config.onError) {
          config.onError(error);
        }
      }
    } else {
      toast.error('Payment Failed', {
        description: 'Your payment was not successful. Please try again.',
      });
      if (config.onError) {
        config.onError(new Error('Payment failed on Flutterwave.'));
      }
    }
  }, [confirmPayment, toast, config]);

  // Handle payment cancellation
  const handlePaymentCancel = useCallback(() => {
    toast.error('Payment Canceled', {
      description: 'You have canceled the payment process.',
    });
    if (config.onCancel) {
      config.onCancel();
    }
  }, [toast, config]);

  // Main payment initiation function
  const initializePayment = useCallback(async () => {
    if (!flutterwaveLoaded) {
      toast.error('Error', {
        description: 'Payment gateway not loaded. Please try refreshing the page.',
      });
      return;
    }

    if (!user || !user.id || !user.email) {
      toast.error('Authentication Error', {
        description: 'You must be logged in to make a payment.',
      });
      router.push('/login');
      return;
    }

    setIsInitializing(true);

    // Create payment record and get a reference
    const paymentRecordResponse = await initiatePayment({
      userId: user.id,
      amount: config.amount,
      currency: config.currency || 'NGN',
      description: config.description || 'NewCondo Payment',
      paymentType: config.rentalId ? 'RENTAL' : config.markingJobId ? 'PROPERTY_MARKING' : 'GENERAL',
      rentalId: config.rentalId,
      markingJobId: config.markingJobId,
    });

    if (!paymentRecordResponse || !paymentRecordResponse.success) {
      toast.error('Payment Error', {
        description: paymentRecordResponse?.message || 'Failed to initialize payment on the backend.',
      });
      setIsInitializing(false);
      return;
    }

    const txRef = paymentRecordResponse.data?.flutterwaveRef;
    const paymentId = paymentRecordResponse.data?.id;

    if (!txRef || !paymentId) {
      toast.error('Payment Error', {
        description: 'Failed to get payment reference. Please try again.',
      });
      setIsInitializing(false);
      return;
    }

    const customer: FlutterwaveCustomer = {
      email: user.email,
      name: user.name || 'User',
      phone: user.phone || undefined,
    };

    const customization: FlutterwaveCustomization = {
      title: 'NewCondo Payment',
      description: config.description || 'Payment for NewCondo service',
      logo: 'https://st2.depositphotos.com/4403291/7418/v/450/depositphotos_74189661-stock-illustration-shopping-cart-icon-large-bag.jpg',
    };

    const paymentData = {
      public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY ?? '',
      tx_ref: txRef,
      amount: config.amount,
      currency: config.currency || 'NGN',
      payment_options: 'card,banktransfer,ussd',
      customer,
      customizations: customization,
      callback: (response: FlutterwaveResponse) => {
        setIsInitializing(false);
        if (response.status === 'successful') {
          handlePaymentSuccess(response, paymentId!);
        } else {
          handlePaymentCancel();
        }
      },
      onClose: () => {
        setIsInitializing(false);
        handlePaymentCancel();
      },
      ...config.redirectUrl && {
        redirect_url: `${config.redirectUrl}?paymentId=${paymentId}&txRef=${txRef}`,
      }
    };

    if (!window.FlutterwaveCheckout) {
      toast.error('Error', {
        description: 'Payment gateway not loaded. Please refresh the page.',
      });
      setIsInitializing(false);
      return;
    }

    window.FlutterwaveCheckout(paymentData);

    setIsInitializing(false);

  }, [
    flutterwaveLoaded,
    user,
    config,
    router,
    toast,
    initiatePayment,
    handlePaymentSuccess,
    handlePaymentCancel,
  ]);

  return {
    initializePayment,
    isInitializing: isInitializing || isCreatingPayment,
    isConfirming: isConfirmingPayment,
    paymentReference,
    flutterwaveLoaded,
  };
};