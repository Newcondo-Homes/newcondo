/**
 * Marking Payment API Client
 * Location: apps/platform/lib/api/markingPayment.ts
 * 
 * Handles all API calls related to property marking payments
 */

import { client } from './client';

// Payment Types
export interface InitiateMarkingPaymentData {
  propertyId: string;
  markingJobId: string;
  amount: number;
  paymentMethod: 'card' | 'bank_transfer' | 'virtual_account';
  callbackUrl?: string;
  metadata?: Record<string, any>;
}

export interface InitiateMarkingPaymentResponse {
  success: boolean;
  data: {
    paymentId: string;
    paymentUrl?: string; // For card payments
    virtualAccountDetails?: {
      accountNumber: string;
      accountName: string;
      bankCode: string;
      bankName: string;
    };
    amount: number;
    currency: string;
    expiresAt: string;
    reference: string;
  };
  message: string;
}

export interface VerifyPaymentData {
  paymentId: string;
  transactionId?: string;
  flutterwaveRef?: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  data: {
    paymentId: string;
    status: 'SUCCESS' | 'PENDING' | 'FAILED';
    amount: number;
    currency: string;
    paidAt?: string;
    markingJobId: string;
    propertyId: string;
  };
  message: string;
}

export interface PaymentStatusResponse {
  success: boolean;
  data: {
    paymentId: string;
    status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
    amount: number;
    currency: string;
    paymentType: 'PROPERTY_MARKING';
    createdAt: string;
    paidAt?: string;
    failureReason?: string;
  };
  message: string;
}

export interface MarkingJobPaymentHistoryResponse {
  success: boolean;
  data: {
    payments: Array<{
      id: string;
      amount: number;
      currency: string;
      status: string;
      paymentMethod?: string;
      createdAt: string;
      paidAt?: string;
      description?: string;
    }>;
    total: number;
    page: number;
    pageSize: number;
  };
  message: string;
}

export interface AgentEarningsResponse {
  success: boolean;
  data: {
    totalEarnings: number;
    availableBalance: number;
    pendingBalance: number;
    completedJobs: number;
    earnings: Array<{
      markingJobId: string;
      propertyTitle: string;
      amount: number;
      status: 'PENDING' | 'RELEASED' | 'HELD';
      earnedAt: string;
      releasedAt?: string;
    }>;
  };
  message: string;
}

export interface WithdrawEarningsData {
  amount: number;
  bankAccountNumber: string;
  bankCode: string;
  accountName: string;
}

export interface WithdrawEarningsResponse {
  success: boolean;
  data: {
    withdrawalId: string;
    amount: number;
    status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
    reference: string;
  };
  message: string;
}

export interface PaymentSummaryResponse {
  success: boolean;
  data: {
    totalPaid: number;
    totalPending: number;
    totalFailed: number;
    currency: string;
    lastPayment?: {
      id: string;
      amount: number;
      status: string;
      paidAt: string;
    };
  };
  message: string;
}

/**
 * Initiate marking payment
 * Creates a payment record and returns payment details
 */
export async function initiateMarkingPayment(
  data: InitiateMarkingPaymentData
): Promise<InitiateMarkingPaymentResponse> {
  return client.post('/api/payments/marking/initiate', data);
}

/**
 * Verify marking payment status
 * Called after payment completion to verify transaction
 */
export async function verifyMarkingPayment(
  data: VerifyPaymentData
): Promise<VerifyPaymentResponse> {
  return client.post('/api/payments/marking/verify', data);
}

/**
 * Get payment status by payment ID
 */
export async function getPaymentStatus(
  paymentId: string
): Promise<PaymentStatusResponse> {
  return client.get(`/api/payments/marking/${paymentId}/status`);
}

/**
 * Get payment history for marking jobs
 */
export async function getMarkingPaymentHistory(
  params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<MarkingJobPaymentHistoryResponse> {
  const queryParams = new URLSearchParams();
  
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
  if (params?.status) queryParams.append('status', params.status);
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);

  const query = queryParams.toString();
  return client.get(`/api/payments/marking/history${query ? `?${query}` : ''}`);
}

/**
 * Get agent earnings from marking jobs
 */
export async function getAgentEarnings(): Promise<AgentEarningsResponse> {
  return client.get('/api/payments/marking/agent/earnings');
}

/**
 * Request withdrawal of agent earnings
 */
export async function withdrawAgentEarnings(
  data: WithdrawEarningsData
): Promise<WithdrawEarningsResponse> {
  return client.post('/api/payments/marking/agent/withdraw', data);
}

/**
 * Get payment summary for user
 */
export async function getMarkingPaymentSummary(): Promise<PaymentSummaryResponse> {
  return client.get('/api/payments/marking/summary');
}

/**
 * Cancel pending payment
 */
export async function cancelMarkingPayment(
  paymentId: string
): Promise<{ success: boolean; message: string }> {
  return client.post(`/api/payments/marking/${paymentId}/cancel`);
}

/**
 * Request refund for marking payment
 */
export async function requestMarkingPaymentRefund(
  paymentId: string,
  reason: string
): Promise<{ success: boolean; message: string }> {
  return client.post(`/api/payments/marking/${paymentId}/refund`, { reason });
}

/**
 * Get virtual account details for marking payments
 */
export async function getMarkingVirtualAccount(
  userId: string
): Promise<{
  success: boolean;
  data: {
    accountNumber: string;
    accountName: string;
    bankCode: string;
    bankName: string;
    balance: number;
  };
  message: string;
}> {
  return client.get(`/api/payments/marking/virtual-account/${userId}`);
}

/**
 * Webhook handler for payment status updates
 * This should be called by the payment service webhook
 */
export async function handlePaymentWebhook(
  webhookData: any
): Promise<{ success: boolean; message: string }> {
  return client.post('/api/payments/marking/webhook', webhookData);
}

/**
 * Get payment receipt
 */
export async function getPaymentReceipt(
  paymentId: string
): Promise<{
  success: boolean;
  data: {
    receiptUrl: string;
    paymentDetails: {
      id: string;
      amount: number;
      currency: string;
      paidAt: string;
      reference: string;
      description: string;
    };
  };
  message: string;
}> {
  return client.get(`/api/payments/marking/${paymentId}/receipt`);
}

/**
 * Check if user has pending marking payments
 */
export async function hasPendingMarkingPayments(): Promise<{
  success: boolean;
  data: {
    hasPending: boolean;
    count: number;
    pendingPayments: Array<{
      id: string;
      markingJobId: string;
      amount: number;
      createdAt: string;
    }>;
  };
  message: string;
}> {
  return client.get('/api/payments/marking/pending/check');
}

/**
 * Get payment statistics for admin
 */
export async function getMarkingPaymentStats(
  params?: {
    startDate?: string;
    endDate?: string;
  }
): Promise<{
  success: boolean;
  data: {
    totalRevenue: number;
    totalPayments: number;
    successfulPayments: number;
    failedPayments: number;
    averagePaymentAmount: number;
    agentEarningsPaid: number;
    platformEarnings: number;
  };
  message: string;
}> {
  const queryParams = new URLSearchParams();
  
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);

  const query = queryParams.toString();
  return client.get(`/api/payments/marking/stats${query ? `?${query}` : ''}`);
}