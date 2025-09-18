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