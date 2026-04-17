// apps/platform/lib/api/payments.ts
import { apiClient } from './client';
import type {
  Payment,
  PaymentCreateRequest,
  PaymentConfirmRequest,
  PaymentHistoryParams,
  PaymentRefundRequest,
  PaymentRetryRequest,
  VirtualAccountRequest,
  RefundDetails
} from '@/types/payment';
import type { ApiResponse, PaginatedResponse } from '@/types/api';

export const paymentsApi = {
  // Create a new payment
  createPayment: async (data: PaymentCreateRequest): Promise<ApiResponse<Payment>> => {
    const response = await apiClient.post('/api/payments', data);
    return response.data as ApiResponse<Payment>;
  },

  // Confirm a payment (after successful Flutterwave callback)
  confirmPayment: async (paymentId: string, data: PaymentConfirmRequest): Promise<ApiResponse<Payment>> => {
    const response = await apiClient.patch(`/api/payments/${paymentId}/confirm`, data);
    return response.data as ApiResponse<Payment>;
  },

  // Get payment by ID
  getPayment: async (paymentId: string): Promise<ApiResponse<Payment>> => {
    const response = await apiClient.get(`/api/payments/${paymentId}`);
    return response.data as ApiResponse<Payment>;
  },

  getRefundStatus: async (paymentId: string): Promise<RefundDetails> => {
    const response = await apiClient.get(`/api/payments/${paymentId}/refund-status`);
    return response.data as RefundDetails;
  },

  // Get payment history for user
  getPaymentHistory: async (params?: PaymentHistoryParams): Promise<ApiResponse<PaginatedResponse<Payment>>> => {
    const searchParams = new URLSearchParams();

    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.status) searchParams.append('status', params.status);
    if (params?.paymentType) searchParams.append('paymentType', params.paymentType);
    if (params?.fromDate) searchParams.append('fromDate', params.fromDate);
    if (params?.toDate) searchParams.append('toDate', params.toDate);

    const response = await apiClient.get(`/api/payments/history?${searchParams.toString()}`);
    return response.data as ApiResponse<PaginatedResponse<Payment>>;
  },

  // Cancel a pending payment
  cancelPayment: async (paymentId: string): Promise<ApiResponse<Payment>> => {
    const response = await apiClient.patch(`/api/payments/${paymentId}/cancel`);
    return response.data as ApiResponse<Payment>;
  },

  // Request refund for a payment
  refundPayment: async (paymentId: string, data: PaymentRefundRequest): Promise<ApiResponse<Payment>> => {
    const response = await apiClient.post(`/api/payments/${paymentId}/refund`, data);
    return response.data as ApiResponse<Payment>;
  },

  // Retry a failed payment
  retryPayment: async (paymentId: string, data: PaymentRetryRequest): Promise<ApiResponse<Payment>> => {
    const response = await apiClient.post(`/api/payments/${paymentId}/retry`, data);
    return response.data as ApiResponse<Payment>;
  },

  // Get payment receipt
  getPaymentReceipt: async (paymentId: string): Promise<Blob> => {
    const response = await apiClient.get(`/api/payments/${paymentId}/receipt`, {
      responseType: 'blob'
    });
    return response.data as Blob ;
  },

  // Virtual Account Management
  createVirtualAccount: async (data: VirtualAccountRequest): Promise<ApiResponse<{ accountNumber: string; accountName: string; bankCode: string }>> => {
    const response = await apiClient.post('/api/payments/virtual-accounts', data);
    return response.data as ApiResponse<{ accountNumber: string; accountName: string; bankCode: string }>;
  },

  // Get user's virtual accounts
  getVirtualAccounts: async (): Promise<ApiResponse<Array<{
    id: string;
    accountNumber: string;
    accountName: string;
    bankCode: string;
    balance: number;
    propertyId?: string;
  }>>> => {
    const response = await apiClient.get('/api/payments/virtual-accounts');
    return response.data as ApiResponse<Array<{
    id: string;
    accountNumber: string;
    accountName: string;
    bankCode: string;
    balance: number;
    propertyId?: string;
  }>>;
  },

  // Release payment after confirmation period
  releasePayment: async (paymentId: string): Promise<ApiResponse<Payment>> => {
    const response = await apiClient.post(`/api/payments/${paymentId}/release`);
    return response.data as ApiResponse<Payment>;
  },

  // Get payment analytics (for property owners)
  getPaymentAnalytics: async (propertyId?: string): Promise<ApiResponse<{
    totalEarnings: number;
    monthlyEarnings: number;
    pendingPayments: number;
    completedPayments: number;
    refundedPayments: number;
  }>> => {
    const params = propertyId ? `?propertyId=${propertyId}` : '';
    const response = await apiClient.get(`/api/payments/analytics${params}`);
    return response.data as ApiResponse<{
    totalEarnings: number;
    monthlyEarnings: number;
    pendingPayments: number;
    completedPayments: number;
    refundedPayments: number;
  }>;
  },

  // Verify payment status with Flutterwave
  verifyPaymentStatus: async (transactionId: string): Promise<ApiResponse<{
    status: string;
    amount: number;
    currency: string;
    flutterwaveStatus: string;
  }>> => {
    const response = await apiClient.get(`/api/payments/verify/${transactionId}`);
    return response.data as ApiResponse<{
    status: string;
    amount: number;
    currency: string;
    flutterwaveStatus: string;
  }>;
  }
};