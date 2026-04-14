// apps/platform/lib/api/paymentStatus.ts
import { apiClient } from './client';

export interface PaymentStatusData {
  id: string;
  status: string;
  amount: number;
  currency: string;
  isReleased: boolean;
  releasedAt?: string;
  confirmationPeriodEnd?: string;
  agentCommission?: number;
  platformFee?: number;
  ownerAmount?: number;
  canRequestRefund: boolean;
  refundDeadline?: string;
}

export interface PaymentReleaseSchedule {
  paymentId: string;
  scheduledReleaseDate: string;
  daysRemaining: number;
  hoursRemaining: number;
  isInConfirmationPeriod: boolean;
  canBeReleased: boolean;
  releaseBlockedReason?: string;
}

export const getPaymentStatus = async (paymentId: string): Promise<PaymentStatusData> => {
  const response = await apiClient.get<PaymentStatusData>(`/payments/${paymentId}/status`);
  return response.data as PaymentStatusData;
};

export const getPaymentReleaseSchedule = async (paymentId: string): Promise<PaymentReleaseSchedule> => {
  const response = await apiClient.get<PaymentReleaseSchedule>(`/payments/${paymentId}/release-schedule`);
  return response.data as PaymentReleaseSchedule;
};