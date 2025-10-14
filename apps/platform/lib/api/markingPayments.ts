// apps/platform/lib/api/markingPayments.ts
import { apiClient } from './client';

export interface InitiateMarkingPaymentRequest {
  markingJobId: string;
  amount: number;
  paymentMethod?: 'card' | 'bank_transfer' | 'ussd';
}

export interface InitiateMarkingPaymentResponse {
  paymentId: string;
  paymentLink?: string;
  flutterwaveRef: string;
  amount: number;
  currency: string;
  status: string;
  expiresAt: string;
}

export interface VerifyMarkingPaymentResponse {
  success: boolean;
  payment: {
    id: string;
    status: string;
    amount: number;
    paidAt?: string;
  };
  markingJob: {
    id: string;
    status: string;
    paymentStatus: string;
  };
}

export interface MarkingPaymentHistory {
  id: string;
  markingJobId: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod?: string;
  paidAt?: string;
  createdAt: string;
  property: {
    id: string;
    title: string;
    address: string;
  };
}

export interface AgentEarningsBreakdown {
  totalEarnings: number;
  availableBalance: number;
  pendingBalance: number;
  completedJobs: number;
  payments: Array<{
    jobId: string;
    amount: number;
    status: 'PENDING' | 'AVAILABLE' | 'WITHDRAWN';
    earnedAt: string;
    releasedAt?: string;
  }>;
}

/**
 * Initiate payment for property marking job
 */
export async function initiateMarkingPayment(
  data: InitiateMarkingPaymentRequest
): Promise<InitiateMarkingPaymentResponse> {
  const response = await apiClient.post('/api/marking-payments/initiate', data);
  return response.data;
}

/**
 * Verify marking payment after Flutterwave redirect
 */
export async function verifyMarkingPayment(
  paymentId: string,
  transactionId?: string
): Promise<VerifyMarkingPaymentResponse> {
  const response = await apiClient.get(`/api/marking-payments/verify/${paymentId}`, {
    params: { transactionId },
  });
  return response.data;
}

/**
 * Get marking payment history for user
 */
export async function getMarkingPaymentHistory(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{
  payments: MarkingPaymentHistory[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const response = await apiClient.get('/api/marking-payments/history', { params });
  return response.data;
}

/**
 * Get single marking payment details
 */
export async function getMarkingPaymentDetails(
  paymentId: string
): Promise<MarkingPaymentHistory> {
  const response = await apiClient.get(`/api/marking-payments/${paymentId}`);
  return response.data;
}

/**
 * Get agent earnings breakdown
 */
export async function getAgentEarnings(): Promise<AgentEarningsBreakdown> {
  const response = await apiClient.get('/api/marking-payments/agent-earnings');
  return response.data;
}

/**
 * Release agent compensation (after job confirmation)
 * This is typically called internally by the system, but included for admin override
 */
export async function releaseAgentCompensation(
  jobId: string
): Promise<{ success: boolean; message: string; amount: number }> {
  const response = await apiClient.post(`/api/marking-payments/release/${jobId}`);
  return response.data;
}

/**
 * Process partial payment to agent (timeout compensation)
 */
export async function processPartialPayment(
  jobId: string
): Promise<{ success: boolean; message: string; amount: number }> {
  const response = await apiClient.post(`/api/marking-payments/partial/${jobId}`);
  return response.data;
}

/**
 * Request withdrawal of agent earnings
 */
export async function requestWithdrawal(data: {
  amount: number;
  accountNumber: string;
  bankCode: string;
}): Promise<{
  success: boolean;
  message: string;
  withdrawalId: string;
  estimatedTime: string;
}> {
  const response = await apiClient.post('/api/marking-payments/withdraw', data);
  return response.data;
}

/**
 * Get withdrawal history for agent
 */
export async function getWithdrawalHistory(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{
  withdrawals: Array<{
    id: string;
    amount: number;
    status: string;
    accountNumber: string;
    bankCode: string;
    requestedAt: string;
    processedAt?: string;
  }>;
  total: number;
  page: number;
  totalPages: number;
}> {
  const response = await apiClient.get('/api/marking-payments/withdrawals', { params });
  return response.data;
}

/**
 * Calculate marking job cost
 */
export async function calculateMarkingCost(params: {
  markingChoice: 'SELF' | 'NEWCONDO_ADMIN' | 'KNOWN_PERSON' | 'ASSIGN_AGENTS';
  urgencyLevel?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}): Promise<{
  baseFee: number;
  urgencyMultiplier: number;
  totalCost: number;
  agentShare: number;
  platformShare: number;
  breakdown: {
    description: string;
    amount: number;
  }[];
}> {
  const response = await apiClient.get('/api/marking-payments/calculate-cost', { params });
  return response.data;
}