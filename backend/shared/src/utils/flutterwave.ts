import axios, { AxiosResponse } from 'axios';
import crypto from 'crypto';
import { flutterwaveConfig, getFlutterwaveHeaders, FLUTTERWAVE_ENDPOINTS, PAYMENT_CONFIG } from '../config/flutterwave';
import {
  FlutterwavePaymentRequest,
  FlutterwavePaymentResponse,
  FlutterwaveVerificationResponse,
  FlutterwaveWebhookPayload,
  FlutterwaveError,
  VirtualAccountRequest,
  VirtualAccountResponse,
  RefundRequest,
  RefundResponse,
} from '../types/payment';

// Create axios instance with default config
const flutterwaveApi = axios.create({
  baseURL: flutterwaveConfig.FLUTTERWAVE_BASE_URL,
  timeout: PAYMENT_CONFIG.TIMEOUT,
  headers: getFlutterwaveHeaders(),
});

// Add request interceptor for logging
flutterwaveApi.interceptors.request.use(
  (config) => {
    console.log(`[Flutterwave] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[Flutterwave] Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
flutterwaveApi.interceptors.response.use(
  (response) => {
    console.log(`[Flutterwave] Response status: ${response.status}`);
    return response;
  },
  (error) => {
    console.error('[Flutterwave] Response error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/**
 * Generate unique transaction reference
 */
export const generateTxRef = (prefix = 'newcondo'): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
};

/**
 * Encrypt payment data using Flutterwave encryption key
 */
export const encryptPaymentData = (data: string): string => {
  const cipher = crypto.createCipher('des-ede3-ecb', flutterwaveConfig.FLUTTERWAVE_ENCRYPTION_KEY);
  let encrypted = cipher.update(data, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
};

/**
 * Decrypt payment data
 */
export const decryptPaymentData = (encryptedData: string): string => {
  const decipher = crypto.createDecipher('des-ede3-ecb', flutterwaveConfig.FLUTTERWAVE_ENCRYPTION_KEY);
  let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

/**
 * Verify webhook signature
 */
export const verifyWebhookSignature = (payload: string, signature: string): boolean => {
  const expectedSignature = crypto
    .createHmac('sha256', flutterwaveConfig.FLUTTERWAVE_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};

/**
 * Initialize payment with Flutterwave
 */
export const initializePayment = async (
  paymentData: FlutterwavePaymentRequest
): Promise<FlutterwavePaymentResponse> => {
  try {
    const response: AxiosResponse<FlutterwavePaymentResponse> = await flutterwaveApi.post(
      FLUTTERWAVE_ENDPOINTS.INITIATE_PAYMENT,
      paymentData
    );

    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Payment initialization failed');
    }

    return response.data;
  } catch (error: any) {
    console.error('[Flutterwave] Payment initialization error:', error);
    throw new FlutterwaveError({
      error: true,
      message: error.response?.data?.message || error.message || 'Payment initialization failed',
      code: error.response?.data?.code,
      data: error.response?.data,
    });
  }
};

/**
 * Verify transaction with Flutterwave
 */
export const verifyTransaction = async (
  transactionId: string
): Promise<FlutterwaveVerificationResponse> => {
  try {
    const endpoint = FLUTTERWAVE_ENDPOINTS.VERIFY_TRANSACTION.replace('{id}', transactionId);
    const response: AxiosResponse<FlutterwaveVerificationResponse> = await flutterwaveApi.get(endpoint);

    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Transaction verification failed');
    }

    return response.data;
  } catch (error: any) {
    console.error('[Flutterwave] Transaction verification error:', error);
    throw new FlutterwaveError({
      error: true,
      message: error.response?.data?.message || error.message || 'Transaction verification failed',
      code: error.response?.data?.code,
      data: error.response?.data,
    });
  }
};

/**
 * Create virtual account
 */
export const createVirtualAccount = async (
  accountData: VirtualAccountRequest
): Promise<VirtualAccountResponse> => {
  try {
    const response: AxiosResponse<VirtualAccountResponse> = await flutterwaveApi.post(
      FLUTTERWAVE_ENDPOINTS.CREATE_VIRTUAL_ACCOUNT,
      accountData
    );

    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Virtual account creation failed');
    }

    return response.data;
  } catch (error: any) {
    console.error('[Flutterwave] Virtual account creation error:', error);
    throw new FlutterwaveError({
      error: true,
      message: error.response?.data?.message || error.message || 'Virtual account creation failed',
      code: error.response?.data?.code,
      data: error.response?.data,
    });
  }
};

/**
 * Process refund
 */
export const processRefund = async (
  transactionId: string,
  refundData: RefundRequest
): Promise<RefundResponse> => {
  try {
    const endpoint = FLUTTERWAVE_ENDPOINTS.REFUND_TRANSACTION.replace('{id}', transactionId);
    const response: AxiosResponse<RefundResponse> = await flutterwaveApi.post(
      endpoint,
      refundData
    );

    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Refund processing failed');
    }

    return response.data;
  } catch (error: any) {
    console.error('[Flutterwave] Refund processing error:', error);
    throw new FlutterwaveError({
      error: true,
      message: error.response?.data?.message || error.message || 'Refund processing failed',
      code: error.response?.data?.code,
      data: error.response?.data,
    });
  }
};

/**
 * Retry mechanism with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      if (attempt === maxRetries) {
        break;
      }

      // Don't retry for certain errors
      if (error.response?.status === 400 || error.response?.status === 401) {
        throw error;
      }

      const delay = initialDelay * Math.pow(2, attempt);
      console.log(`[Flutterwave] Retry attempt ${attempt + 1} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
};

/**
 * Get payment status from Flutterwave status
 */
export const mapFlutterwaveStatus = (flutterwaveStatus: string): string => {
  const statusMap: Record<string, string> = {
    'pending': 'PENDING',
    'successful': 'SUCCESS',
    'failed': 'FAILED',
    'cancelled': 'CANCELLED',
    'abandoned': 'FAILED',
  };

  return statusMap[flutterwaveStatus.toLowerCase()] || 'PENDING';
};

/**
 * Validate payment amount
 */
export const validateAmount = (amount: number, currency: string = 'NGN'): boolean => {
  if (amount <= 0) return false;
  
  // Minimum amounts by currency
  const minimumAmounts: Record<string, number> = {
    'NGN': 100, // 1 NGN
    'USD': 1,   // 1 USD
    'GBP': 1,   // 1 GBP
    'EUR': 1,   // 1 EUR
  };

  const minimum = minimumAmounts[currency] || 100;
  return amount >= minimum;
};

/**
 * Format amount for display
 */
export const formatAmount = (amount: number, currency: string = 'NGN'): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Calculate fees
 */
export const calculateFees = (amount: number, currency: string = 'NGN'): {
  amount: number;
  fee: number;
  total: number;
} => {
  let fee = 0;
  
  if (currency === 'NGN') {
    // Flutterwave NGN fees (as of 2024)
    if (amount <= 2500) {
      fee = amount * 0.014; // 1.4%
    } else {
      fee = Math.min(amount * 0.014, 2000); // 1.4% capped at ₦2000
    }
  } else {
    // International fees (approximate)
    fee = amount * 0.039; // 3.9%
  }

  return {
    amount,
    fee: Math.round(fee * 100) / 100, // Round to 2 decimal places
    total: Math.round((amount + fee) * 100) / 100,
  };
};

/**
 * Generate payment metadata
 */
export const generatePaymentMetadata = (data: Record<string, any>): Record<string, any> => {
  return {
    ...data,
    platform: 'newcondo',
    timestamp: new Date().toISOString(),
    version: '1.0',
  };
};

/**
 * Validate webhook payload
 */
export const validateWebhookPayload = (payload: any): payload is FlutterwaveWebhookPayload => {
  return (
    payload &&
    typeof payload.event === 'string' &&
    payload.data &&
    typeof payload.data.id === 'number' &&
    typeof payload.data.tx_ref === 'string' &&
    typeof payload.data.status === 'string'
  );
};

/**
 * Get supported banks
 */
export const getSupportedBanks = async (country: string = 'NG'): Promise<any[]> => {
  try {
    const response = await flutterwaveApi.get(`${FLUTTERWAVE_ENDPOINTS.BANKS}/${country}`);
    return response.data.data || [];
  } catch (error: any) {
    console.error('[Flutterwave] Error fetching banks:', error);
    return [];
  }
};

/**
 * Check if payment method is supported
 */
export const isPaymentMethodSupported = (method: string, currency: string = 'NGN'): boolean => {
  const supportedMethods: Record<string, string[]> = {
    'NGN': ['card', 'banktransfer', 'ussd', 'account', 'mobilemoneyghana'],
    'USD': ['card', 'banktransfer'],
    'GBP': ['card', 'banktransfer'],
    'EUR': ['card', 'banktransfer'],
  };

  return supportedMethods[currency]?.includes(method) || false;
};

export default {
  initializePayment,
  verifyTransaction,
  createVirtualAccount,
  processRefund,
  retryWithBackoff,
  generateTxRef,
  encryptPaymentData,
  decryptPaymentData,
  verifyWebhookSignature,
  mapFlutterwaveStatus,
  validateAmount,
  formatAmount,
  calculateFees,
  generatePaymentMetadata,
  validateWebhookPayload,
  getSupportedBanks,
  isPaymentMethodSupported,
};

import crypto from 'crypto';
import { 
  FlutterwaveVirtualAccountRequest,
  FlutterwaveVirtualAccountResponse,
  FlutterwaveWebhookData,
  VirtualAccountServiceError
} from '../types/virtualAccount';
import { VIRTUAL_ACCOUNT_CONSTANTS } from '../constants/virtualAccount';

export class FlutterwaveService {
  private baseUrl: string;
  private secretKey: string;
  private publicKey: string;
  private webhookSecret: string;

  constructor() {
    this.baseUrl = process.env.FLUTTERWAVE_BASE_URL || 'https://api.flutterwave.com/v3';
    this.secretKey = process.env.FLUTTERWAVE_SECRET_KEY || '';
    this.publicKey = process.env.FLUTTERWAVE_PUBLIC_KEY || '';
    this.webhookSecret = process.env.FLUTTERWAVE_WEBHOOK_SECRET || '';

    if (!this.secretKey || !this.publicKey) {
      throw new Error('Flutterwave API keys are required');
    }
  }

  /**
   * Create a virtual account with Flutterwave
   */
  async createVirtualAccount(request: FlutterwaveVirtualAccountRequest): Promise<FlutterwaveVirtualAccountResponse> {
    try {
      const payload = {
        email: request.email,
        bvn: request.bvn,
        tx_ref: request.tx_ref,
        narration: request.narration || 'NewCondo Virtual Account',
        is_permanent: request.is_permanent !== false, // Default to permanent
      };

      const response = await this.makeRequest('/virtual-account-numbers', 'POST', payload);
      
      if (response.status !== 'success') {
        throw new VirtualAccountServiceError(
          response.message || 'Failed to create virtual account',
          VIRTUAL_ACCOUNT_CONSTANTS.ERROR_CODES.FLUTTERWAVE_ERROR,
          400,
          response
        );
      }

      return response as FlutterwaveVirtualAccountResponse;
    } catch (error) {
      if (error instanceof VirtualAccountServiceError) {
        throw error;
      }
      
      throw new VirtualAccountServiceError(
        'Failed to create virtual account with Flutterwave',
        VIRTUAL_ACCOUNT_CONSTANTS.ERROR_CODES.FLUTTERWAVE_ERROR,
        500,
        { originalError: error }
      );
    }
  }

  /**
   * Get virtual account details
   */
  async getVirtualAccount(accountReference: string): Promise<any> {
    try {
      const response = await this.makeRequest(
        `/virtual-account-numbers/${accountReference}`,
        'GET'
      );

      if (response.status !== 'success') {
        throw new VirtualAccountServiceError(
          'Virtual account not found',
          VIRTUAL_ACCOUNT_CONSTANTS.ERROR_CODES.ACCOUNT_NOT_FOUND,
          404,
          response
        );
      }

      return response.data;
    } catch (error) {
      if (error instanceof VirtualAccountServiceError) {
        throw error;
      }
      
      throw new VirtualAccountServiceError(
        'Failed to fetch virtual account details',
        VIRTUAL_ACCOUNT_CONSTANTS.ERROR_CODES.FLUTTERWAVE_ERROR,
        500,
        { originalError: error }
      );
    }
  }

  /**
   * Get virtual account balance
   */
  async getAccountBalance(accountReference: string): Promise<{ balance: number; currency: string }> {
    try {
      const response = await this.makeRequest(
        `/virtual-account-numbers/${accountReference}/balance`,
        'GET'
      );

      if (response.status !== 'success') {
        throw new VirtualAccountServiceError(
          'Failed to fetch account balance',
          VIRTUAL_ACCOUNT_CONSTANTS.ERROR_CODES.FLUTTERWAVE_ERROR,
          400,
          response
        );
      }

      return {
        balance: parseFloat(response.data.balance || '0'),
        currency: response.data.currency || 'NGN'
      };
    } catch (error) {
      if (error instanceof VirtualAccountServiceError) {
        throw error;
      }
      
      throw new VirtualAccountServiceError(
        'Failed to fetch account balance',
        VIRTUAL_ACCOUNT_CONSTANTS.ERROR_CODES.FLUTTERWAVE_ERROR,
        500,
        { originalError: error }
      );
    }
  }

  /**
   * Get account transactions
   */
  async getAccountTransactions(
    accountReference: string,
    fromDate?: Date,
    toDate?: Date,
    page = 1,
    limit = 50
  ): Promise<any> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: Math.min(limit, 100).toString(), // Max 100 per page
      });

      if (fromDate) {
        params.append('from', fromDate.toISOString().split('T')[0]);
      }
      if (toDate) {
        params.append('to', toDate.toISOString().split('T')[0]);
      }

      const response = await this.makeRequest(
        `/virtual-account-numbers/${accountReference}/transactions?${params.toString()}`,
        'GET'
      );

      if (response.status !== 'success') {
        throw new VirtualAccountServiceError(
          'Failed to fetch account transactions',
          VIRTUAL_ACCOUNT_CONSTANTS.ERROR_CODES.FLUTTERWAVE_ERROR,
          400,
          response
        );
      }

      return response.data;
    } catch (error) {
      if (error instanceof VirtualAccountServiceError) {
        throw error;
      }
      
      throw new VirtualAccountServiceError(
        'Failed to fetch account transactions',
        VIRTUAL_ACCOUNT_CONSTANTS.ERROR_CODES.FLUTTERWAVE_ERROR,
        500,
        { originalError: error }
      );
    }
  }

  /**
   * Transfer funds from virtual account
   */
  async transferFunds(payload: {
    account_bank: string;
    account_number: string;
    amount: number;
    currency?: string;
    reference: string;
    narration?: string;
    debit_currency?: string;
  }): Promise<any> {
    try {
      const transferPayload = {
        ...payload,
        currency: payload.currency || 'NGN',
        debit_currency: payload.debit_currency || 'NGN',
      };

      const response = await this.makeRequest('/transfers', 'POST', transferPayload);
      
      if (response.status !== 'success') {
        throw new VirtualAccountServiceError(
          response.message || 'Transfer failed',
          VIRTUAL_ACCOUNT_CONSTANTS.ERROR_CODES.FLUTTERWAVE_ERROR,
          400,
          response
        );
      }

      return response.data;
    } catch (error) {
      if (error instanceof VirtualAccountServiceError) {
        throw error;
      }
      
      throw new VirtualAccountServiceError(
        'Failed to process transfer',
        VIRTUAL_ACCOUNT_CONSTANTS.ERROR_CODES.FLUTTERWAVE_ERROR,
        500,
        { originalError: error }
      );
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.webhookSecret) {
      throw new Error('Webhook secret is required for signature verification');
    }

    const computedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(computedSignature)
    );
  }

  /**
   * Process webhook data
   */
  processWebhookData(payload: string, signature: string): FlutterwaveWebhookData {
    if (!this.verifyWebhookSignature(payload, signature)) {
      throw new VirtualAccountServiceError(
        'Invalid webhook signature',
        'INVALID_WEBHOOK_SIGNATURE',
        401
      );
    }

    try {
      const data = JSON.parse(payload);
      return data as FlutterwaveWebhookData;
    } catch (error) {
      throw new VirtualAccountServiceError(
        'Invalid webhook payload',
        'INVALID_WEBHOOK_PAYLOAD',
        400,
        { originalError: error }
      );
    }
  }

  /**
   * Generate transaction reference
   */
  generateTransactionReference(prefix = 'NC'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Validate account number format
   */
  validateAccountNumber(accountNumber: string): boolean {
    // Nigerian account numbers are typically 10 digits
    const accountRegex = /^\d{10}$/;
    return accountRegex.test(accountNumber);
  }

  /**
   * Format currency amount
   */
  formatAmount(amount: number, currency = 'NGN'): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Make HTTP request to Flutterwave API
   */
  private async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', data?: any): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const config: RequestInit = {
      method,
      headers,
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);
      const responseData = await response.json();

      if (!response.ok) {
        throw new VirtualAccountServiceError(
          responseData.message || `HTTP ${response.status}`,
          VIRTUAL_ACCOUNT_CONSTANTS.ERROR_CODES.FLUTTERWAVE_ERROR,
          response.status,
          responseData
        );
      }

      return responseData;
    } catch (error) {
      if (error instanceof VirtualAccountServiceError) {
        throw error;
      }

      // Network or parsing errors
      throw new VirtualAccountServiceError(
        'Network error or invalid response',
        VIRTUAL_ACCOUNT_CONSTANTS.ERROR_CODES.FLUTTERWAVE_ERROR,
        500,
        { originalError: error }
      );
    }
  }

  /**
   * Health check for Flutterwave service
   */
  async healthCheck(): Promise<{ status: string; timestamp: Date }> {
    try {
      // Simple API call to check if service is responsive
      await this.makeRequest('/banks/NG', 'GET');
      return {
        status: 'healthy',
        timestamp: new Date()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date()
      };
    }
  }
}

// Export singleton instance
export const flutterwaveService = new FlutterwaveService();