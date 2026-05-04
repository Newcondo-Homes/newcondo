'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query';
import  api  from '@/lib/api/client';

import {
  getPaymentStatus,
  getPaymentReleaseSchedule,
  type PaymentStatusData,
  type PaymentReleaseSchedule,
} from '@/lib/api/paymentStatus';




export function usePaymentStatus(paymentId?: string) {
  const queryClient = useQueryClient();

  // Fetch payment status
  const {
    data: paymentStatus,
    isLoading,
    error,
    refetch,
  } = useQuery<PaymentStatusData | null>({
    queryKey: ['payment-status', paymentId],
    queryFn: async () => (paymentId ? getPaymentStatus(paymentId) : null),
    enabled: !!paymentId,
    refetchInterval: (query) => {
      const data = query.state.data;

      // Refetch more frequently if payment is in confirmation period
      if (data?.confirmationPeriodEnd) {
        const deadline = new Date(data.confirmationPeriodEnd);
        const now = new Date();
        if (deadline > now) {
          return 15000; // Refetch every 15 seconds during confirmation period
        }
      }
      return 60000; // Otherwise refetch every minute
    },
  });

  // Fetch payment release schedule
  const {
    data: releaseSchedule,
    isLoading: isLoadingSchedule,
  } = useQuery<PaymentReleaseSchedule | null>({
    queryKey: ['payment-release-schedule', paymentId],
    queryFn: async () => (paymentId ? getPaymentReleaseSchedule(paymentId) : null),
    enabled: !!paymentId && !paymentStatus?.isReleased,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Calculate time remaining until release
  const getTimeUntilRelease = () => {
    if (!paymentStatus?.confirmationPeriodEnd) return null;
    
    const deadline = new Date(paymentStatus.confirmationPeriodEnd);
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    
    if (diff <= 0) {
      return { expired: true, canRelease: true };
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return {
      expired: false,
      canRelease: false,
      days,
      hours,
      minutes,
      seconds,
      totalMilliseconds: diff,
    };
  };

  // Check if payment is in confirmation period
  const isInConfirmationPeriod = () => {
    const timeRemaining = getTimeUntilRelease();
    return timeRemaining && !timeRemaining.expired;
  };

  // Check if payment can be released
  const canReleasePayment = () => {
    if (!paymentStatus) return false;
    if (paymentStatus.isReleased) return false;
    
    const timeRemaining = getTimeUntilRelease();
    return timeRemaining?.expired || timeRemaining?.canRelease || false;
  };

  // Get payment status color for UI
  const getStatusColor = () => {
    if (!paymentStatus) return 'gray';
    
    if (paymentStatus.isReleased) return 'green';
    if (isInConfirmationPeriod()) return 'yellow';
    if (paymentStatus.status === 'FAILED') return 'red';
    if (paymentStatus.status === 'PENDING') return 'blue';
    
    return 'gray';
  };

  // Get status display text
  const getStatusText = () => {
    if (!paymentStatus) return 'Unknown';
    
    if (paymentStatus.isReleased) return 'Released';
    if (isInConfirmationPeriod()) return 'In Confirmation Period';
    if (canReleasePayment()) return 'Ready for Release';
    
    return paymentStatus.status.replace('_', ' ');
  };

  // Format currency amount
  const formatAmount = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: paymentStatus?.currency || 'NGN',
    }).format(amount);
  };

  // Invalidate and refetch payment status
  const refreshStatus = () => {
    queryClient.invalidateQueries({ queryKey: ['payment-status', paymentId] });
    queryClient.invalidateQueries({ queryKey: ['payment-release-schedule', paymentId] });
  };

  return {
    // Data
    paymentStatus,
    releaseSchedule,
    
    // Loading states
    isLoading,
    isLoadingSchedule,
    
    // Error
    error,
    
    // Helpers
    getTimeUntilRelease,
    isInConfirmationPeriod: isInConfirmationPeriod(),
    canReleasePayment: canReleasePayment(),
    getStatusColor: getStatusColor(),
    getStatusText: getStatusText(),
    formatAmount,
    refreshStatus,
    refetch,
    
    // Formatted data
    formattedAmount: formatAmount(paymentStatus?.amount),
    formattedCommission: formatAmount(paymentStatus?.agentCommission),
    formattedPlatformFee: formatAmount(paymentStatus?.platformFee),
    formattedOwnerAmount: formatAmount(paymentStatus?.ownerAmount),
  };
}