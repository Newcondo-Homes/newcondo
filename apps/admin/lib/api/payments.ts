import { ApiResponse, PaginatedResponse } from '@newcondo/db/types';

export interface PaymentFilters {
  status?: string;
  paymentType?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface PaymentSummary {
  totalPayments: number;
  totalAmount: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  refundedAmount: number;
  averagePaymentAmount: number;
}

export interface PaymentDetails {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  rentalId: string | null;
  markingJobId: string | null;
  amount: number;
  currency: string;
  paymentType: string;
  status: string;
  paymentMethod: string | null;
  flutterwaveRef: string | null;
  transactionId: string | null;
  agentCommission: number | null;
  platformFee: number | null;
  ownerAmount: number | null;
  confirmationPeriodEnd: string | null;
  isReleased: boolean;
  releasedAt: string | null;
  description: string | null;
  failureReason: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Related data
  property?: {
    id: string;
    title: string;
    address: string;
  };
  rental?: {
    id: string;
    startDate: string;
    endDate: string | null;
    monthlyRent: number;
  };
}

export interface RefundRequest {
  paymentId: string;
  reason: string;
  amount?: number; // Optional partial refund
  adminNotes?: string;
}

export interface TransactionMetrics {
  period: string;
  totalVolume: number;
  transactionCount: number;
  successRate: number;
  averageAmount: number;
}

class AdminPaymentsAPI {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3001';
  }

  setAuthToken(token: string) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: 'An error occurred',
      }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Get paginated payment list with filters
  async getPayments(
    page = 1,
    limit = 20,
    filters: PaymentFilters = {}
  ): Promise<PaginatedResponse<PaymentDetails>> {
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    // Add filters to search params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });

    const response = await this.request<PaginatedResponse<PaymentDetails>>(
      `/admin/payments?${searchParams.toString()}`
    );

    return response.data;
  }

  // Get payment details by ID
  async getPaymentById(paymentId: string): Promise<PaymentDetails> {
    const response = await this.request<PaymentDetails>(`/admin/payments/${paymentId}`);
    return response.data;
  }

  // Get payment summary statistics
  async getPaymentSummary(
    dateFrom?: string,
    dateTo?: string
  ): Promise<PaymentSummary> {
    const searchParams = new URLSearchParams();
    if (dateFrom) searchParams.append('dateFrom', dateFrom);
    if (dateTo) searchParams.append('dateTo', dateTo);

    const response = await this.request<PaymentSummary>(
      `/admin/payments/summary?${searchParams.toString()}`
    );
    return response.data;
  }

  // Process refund
  async processRefund(refundData: RefundRequest): Promise<{ success: boolean; refundId: string }> {
    const response = await this.request<{ success: boolean; refundId: string }>(
      '/admin/payments/refund',
      {
        method: 'POST',
        body: JSON.stringify(refundData),
      }
    );
    return response.data;
  }

  // Release held payment
  async releasePayment(
    paymentId: string,
    adminNotes?: string
  ): Promise<{ success: boolean }> {
    const response = await this.request<{ success: boolean }>(
      `/admin/payments/${paymentId}/release`,
      {
        method: 'POST',
        body: JSON.stringify({ adminNotes }),
      }
    );
    return response.data;
  }

  // Get transaction metrics for dashboard
  async getTransactionMetrics(
    period: 'daily' | 'weekly' | 'monthly' = 'daily',
    days = 30
  ): Promise<TransactionMetrics[]> {
    const searchParams = new URLSearchParams({
      period,
      days: days.toString(),
    });

    const response = await this.request<TransactionMetrics[]>(
      `/admin/payments/metrics?${searchParams.toString()}`
    );
    return response.data;
  }

  // Get failed payment details for investigation
  async getFailedPayments(
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<PaymentDetails>> {
    const response = await this.request<PaginatedResponse<PaymentDetails>>(
      `/admin/payments/failed?page=${page}&limit=${limit}`
    );
    return response.data;
  }

  // Retry failed payment
  async retryPayment(paymentId: string): Promise<{ success: boolean; newPaymentId: string }> {
    const response = await this.request<{ success: boolean; newPaymentId: string }>(
      `/admin/payments/${paymentId}/retry`,
      {
        method: 'POST',
      }
    );
    return response.data;
  }

  // Get payment logs for debugging
  async getPaymentLogs(
    paymentId: string
  ): Promise<Array<{
    id: string;
    timestamp: string;
    level: string;
    message: string;
    metadata?: Record<string, any>;
  }>> {
    const response = await this.request<Array<{
      id: string;
      timestamp: string;
      level: string;
      message: string;
      metadata?: Record<string, any>;
    }>>(`/admin/payments/${paymentId}/logs`);
    return response.data;
  }

  // Reconcile payments with Flutterwave
  async reconcilePayments(
    dateFrom: string,
    dateTo: string
  ): Promise<{
    matched: number;
    unmatched: number;
    discrepancies: Array<{
      paymentId: string;
      flutterwaveRef: string;
      issue: string;
    }>;
  }> {
    const response = await this.request<{
      matched: number;
      unmatched: number;
      discrepancies: Array<{
        paymentId: string;
        flutterwaveRef: string;
        issue: string;
      }>;
    }>('/admin/payments/reconcile', {
      method: 'POST',
      body: JSON.stringify({ dateFrom, dateTo }),
    });
    return response.data;
  }

  // Export payment data
  async exportPayments(
    filters: PaymentFilters & { format: 'csv' | 'excel' }
  ): Promise<Blob> {
    const searchParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });

    const response = await fetch(
      `${this.baseURL}/admin/payments/export?${searchParams.toString()}`,
      {
        headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
      }
    );

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }

    return response.blob();
  }

  // Get payment trends for analytics
  async getPaymentTrends(
    period: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<Array<{
    period: string;
    totalAmount: number;
    transactionCount: number;
    successRate: number;
    averageAmount: number;
    refundRate: number;
  }>> {
    const response = await this.request<Array<{
      period: string;
      totalAmount: number;
      transactionCount: number;
      successRate: number;
      averageAmount: number;
      refundRate: number;
    }>>(`/admin/payments/trends?period=${period}`);
    return response.data;
  }
}

export const adminPaymentsAPI = new AdminPaymentsAPI();

















// /**
//  * Payments API Client
//  * Handles payment monitoring, transaction management, and commission tracking
//  */

// import { apiClient } from './client';

// export interface PaymentTransaction {
//   id: string;
//   userId: string;
//   rentalId?: string;
//   markingJobId?: string;
//   amount: number;
//   currency: string;
//   paymentType: 'RENT' | 'DEPOSIT' | 'AGENT_COMMISSION' | 'PREMIUM_UPGRADE' | 'PROPERTY_MARKING';
//   status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'HELD' | 'RELEASED';
//   paymentMethod?: string;
//   flutterwaveRef?: string;
//   transactionId?: string;
//   agentCommission?: number;
//   platformFee?: number;
//   ownerAmount?: number;
//   confirmationPeriodEnd?: string;
//   isReleased: boolean;
//   releasedAt?: string;
//   description?: string;
//   failureReason?: string;
//   paidAt?: string;
//   user: {
//     id: string;
//     name: string;
//     email: string;
//     phone?: string;
//   };
//   rental?: {
//     id: string;
//     property: {
//       id: string;
//       title: string;
//       address: string;
//     };
//     isConfirmed: boolean;
//   };
//   createdAt: string;
//   updatedAt: string;
// }

// export interface PaymentStats {
//   totalTransactions: number;
//   totalVolume: number;
//   successfulPayments: number;
//   failedPayments: number;
//   pendingPayments: number;
//   refundedPayments: number;
//   heldPayments: number;
//   avgTransactionValue: number;
//   totalCommissions: number;
//   totalPlatformFees: number;
//   paymentsByType: Record<string, number>;
//   revenueByMonth: Array<{ month: string; revenue: number }>;
// }

// export interface RefundPaymentPayload {
//   paymentId: string;
//   reason: string;
//   refundAmount?: number; // partial refund
//   notifyUser?: boolean;
// }

// export interface ReleasePaymentPayload {
//   paymentId: string;
//   notes?: string;
//   overrideConfirmation?: boolean; // for emergency releases
// }

// export interface CommissionBreakdown {
//   paymentId: string;
//   totalAmount: number;
//   agentCommission: number;
//   platformFee: number;
//   ownerAmount: number;
//   breakdown: {
//     agentPercentage: number;
//     platformPercentage: number;
//     ownerPercentage: number;
//   };
// }

// /**
//  * Get all payment transactions
//  */
// export async function getPaymentTransactions(params?: {
//   page?: number;
//   limit?: number;
//   status?: string;
//   paymentType?: string;
//   userId?: string;
//   startDate?: string;
//   endDate?: string;
//   search?: string;
// }) {
//   const response = await apiClient.get<{
//     payments: PaymentTransaction[];
//     total: number;
//     page: number;
//     totalPages: number;
//   }>('/admin/payments', { params });
//   return response.data;
// }

// /**
//  * Get payment statistics
//  */
// export async function getPaymentStats(params?: {
//   startDate?: string;
//   endDate?: string;
// }) {
//   const response = await apiClient.get<PaymentStats>('/admin/payments/stats', { params });
//   return response.data;
// }

// /**
//  * Get single payment details
//  */
// export async function getPaymentDetails(paymentId: string) {
//   const response = await apiClient.get<PaymentTransaction>(`/admin/payments/${paymentId}`);
//   return response.data;
// }

// /**
//  * Get payments pending confirmation
//  */
// export async function getPendingConfirmationPayments(params?: {
//   page?: number;
//   limit?: number;
// }) {
//   const response = await apiClient.get<{
//     payments: PaymentTransaction[];
//     total: number;
//     page: number;
//     totalPages: number;
//   }>('/admin/payments/pending-confirmation', { params });
//   return response.data;
// }

// /**
//  * Get held payments (awaiting release)
//  */
// export async function getHeldPayments(params?: {
//   page?: number;
//   limit?: number;
// }) {
//   const response = await apiClient.get<{
//     payments: PaymentTransaction[];
//     total: number;
//     page: number;
//     totalPages: number;
//   }>('/admin/payments/held', { params });
//   return response.data;
// }

// /**
//  * Refund payment
//  */
// export async function refundPayment(payload: RefundPaymentPayload) {
//   const response = await apiClient.post<{
//     success: boolean;
//     message: string;
//     refundId: string;
//   }>('/admin/payments/refund', payload);
//   return response.data;
// }

// /**
//  * Release held payment
//  */
// export async function releasePayment(payload: ReleasePaymentPayload) {
//   const response = await apiClient.post<{
//     success: boolean;
//     message: string;
//     payment: PaymentTransaction;
//   }>('/admin/payments/release', payload);
//   return response.data;
// }

// /**
//  * Get commission breakdown for payment
//  */
// export async function getCommissionBreakdown(paymentId: string) {
//   const response = await apiClient.get<CommissionBreakdown>(
//     `/admin/payments/${paymentId}/commission`
//   );
//   return response.data;
// }

// /**
//  * Get failed payments
//  */
// export async function getFailedPayments(params?: {
//   page?: number;
//   limit?: number;
//   startDate?: string;
//   endDate?: string;
// }) {
//   const response = await apiClient.get<{
//     payments: PaymentTransaction[];
//     total: number;
//     page: number;
//     totalPages: number;
//   }>('/admin/payments/failed', { params });
//   return response.data;
// }

// /**
//  * Retry failed payment
//  */
// export async function retryFailedPayment(paymentId: string, notes?: string) {
//   const response = await apiClient.post<{
//     success: boolean;
//     message: string;
//   }>(`/admin/payments/${paymentId}/retry`, { notes });
//   return response.data;
// }

// /**
//  * Get payment timeline/history
//  */
// export async function getPaymentHistory(paymentId: string) {
//   const response = await apiClient.get<{
//     history: Array<{
//       id: string;
//       action: string;
//       performedBy?: string;
//       performedAt: string;
//       details: any;
//     }>;
//   }>(`/admin/payments/${paymentId}/history`);
//   return response.data;
// }

// /**
//  * Get user payment history
//  */
// export async function getUserPaymentHistory(userId: string, params?: {
//   page?: number;
//   limit?: number;
// }) {
//   const response = await apiClient.get<{
//     payments: PaymentTransaction[];
//     total: number;
//     totalSpent: number;
//   }>(`/admin/payments/users/${userId}`, { params });
//   return response.data;
// }

// /**
//  * Manually mark payment as successful (emergency override)
//  */
// export async function manuallyConfirmPayment(paymentId: string, reason: string) {
//   const response = await apiClient.post<{
//     success: boolean;
//     message: string;
//   }>(`/admin/payments/${paymentId}/manual-confirm`, { reason });
//   return response.data;
// }

// /**
//  * Get revenue report
//  */
// export async function getRevenueReport(params: {
//   startDate: string;
//   endDate: string;
//   groupBy?: 'day' | 'week' | 'month';
// }) {
//   const response = await apiClient.get<{
//     totalRevenue: number;
//     platformFees: number;
//     agentCommissions: number;
//     ownerPayouts: number;
//     breakdown: Array<{
//       period: string;
//       revenue: number;
//       fees: number;
//       commissions: number;
//     }>;
//   }>('/admin/payments/revenue-report', { params });
//   return response.data;
// }

// /**
//  * Export payment transactions
//  */
// export async function exportPayments(params: {
//   startDate?: string;
//   endDate?: string;
//   status?: string;
//   format?: 'csv' | 'xlsx' | 'pdf';
// }) {
//   const response = await apiClient.get<Blob>('/admin/payments/export', {
//     params,
//     responseType: 'blob',
//   });
//   return response.data;
// }

// /**
//  * Get suspicious transactions
//  */
// export async function getSuspiciousTransactions(params?: {
//   page?: number;
//   limit?: number;
// }) {
//   const response = await apiClient.get<{
//     payments: PaymentTransaction[];
//     total: number;
//     reasons: string[];
//   }>('/admin/payments/suspicious', { params });
//   return response.data;
// }

// /**
//  * Flag transaction for review
//  */
// export async function flagTransaction(
//   paymentId: string,
//   reason: string,
//   severity: 'LOW' | 'MEDIUM' | 'HIGH'
// ) {
//   const response = await apiClient.post<{
//     success: boolean;
//     message: string;
//   }>(`/admin/payments/${paymentId}/flag`, { reason, severity });
//   return response.data;
// }