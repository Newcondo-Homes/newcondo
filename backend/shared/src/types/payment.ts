import { PaymentType, PaymentStatus } from '@newcondo/db';

// Base payment interfaces
export interface BasePayment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  paymentType: PaymentType;
  status: PaymentStatus;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Flutterwave-specific types
export interface FlutterwavePaymentRequest {
  tx_ref: string;
  amount: number;
  currency: string;
  redirect_url: string;
  payment_options?: string;
  customer: FlutterwaveCustomer;
  customizations?: FlutterwaveCustomization;
  meta?: Record<string, any>;
}

export interface FlutterwaveCustomer {
  email: string;
  phonenumber?: string;
  name: string;
}

export interface FlutterwaveCustomization {
  title: string;
  description?: string;
  logo?: string;
}

export interface FlutterwavePaymentResponse {
  status: string;
  message: string;
  data: {
    link: string;
    payment_id: string;
    hosted_link: string;
  };
}

export interface FlutterwaveVerificationResponse {
  status: string;
  message: string;
  data: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    device_fingerprint: string;
    amount: number;
    currency: string;
    charged_amount: number;
    app_fee: number;
    merchant_fee: number;
    processor_response: string;
    auth_model: string;
    ip: string;
    narration: string;
    status: string;
    payment_type: string;
    created_at: string;
    account_id: number;
    customer: FlutterwaveCustomer;
    card?: FlutterwaveCard;
    meta?: Record<string, any>;
  };
}

export interface FlutterwaveCard {
  first_6digits: string;
  last_4digits: string;
  issuer: string;
  country: string;
  type: string;
  token: string;
  expiry: string;
}

// Webhook types
export interface FlutterwaveWebhookPayload {
  event: string;
  data: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    amount: number;
    currency: string;
    status: string;
    payment_type: string;
    created_at: string;
    customer: FlutterwaveCustomer;
    meta?: Record<string, any>;
  };
  event_type: string;
}

// Virtual account types
export interface VirtualAccountRequest {
  email: string;
  bvn?: string;
  firstname: string;
  lastname: string;
  phonenumber?: string;
  narration?: string;
  is_permanent?: boolean;
  frequency?: number;
  duration?: number;
  tx_ref: string;
}

export interface VirtualAccountResponse {
  status: string;
  message: string;
  data: {
    account_number: string;
    bank_name: string;
    account_reference: string;
    account_status: string;
    created_at: string;
    currency: string;
    fee: number;
    frequency: number;
    order_ref: string;
    response_code: string;
    response_message: string;
  };
}

// Refund types
export interface RefundRequest {
  id: string;
  amount?: number;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface RefundResponse {
  status: string;
  message: string;
  data: {
    id: number;
    account_id: number;
    tx_id: number;
    flw_ref: string;
    wallet_id: number;
    amount_refunded: number;
    status: string;
    destination: string;
    meta: Record<string, any>;
    created_at: string;
  };
}

// Property locking types
export interface PropertyLock {
  propertyId: string;
  unitId?: string;
  userId: string;
  lockType: 'PAYMENT' | 'VIEWING' | 'BOOKING';
  expiresAt: Date;
  metadata?: Record<string, any>;
}

export interface LockRequest {
  propertyId: string;
  unitId?: string;
  lockType: PropertyLock['lockType'];
  duration: number; // in minutes
  metadata?: Record<string, any>;
}

export interface LockResponse {
  success: boolean;
  lock?: PropertyLock;
  error?: string;
}

// Payment retry types
export interface PaymentRetry {
  originalPaymentId: string;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: Date;
  lastError?: string;
}

export interface RetryRequest {
  paymentId: string;
  reason?: string;
  metadata?: Record<string, any>;
}

// Receipt types
export interface ReceiptData {
  paymentId: string;
  transactionId: string;
  amount: number;
  currency: string;
  paymentType: PaymentType;
  customerName: string;
  customerEmail: string;
  description: string;
  paidAt: Date;
  property?: {
    id: string;
    title: string;
    address: string;
  };
  unit?: {
    id: string;
    unitNumber: string;
  };
  metadata?: Record<string, any>;
}

export interface ReceiptOptions {
  format: 'PDF' | 'HTML' | 'JSON';
  template?: string;
  includeQR?: boolean;
  includeCompanyInfo?: boolean;
}

export interface GeneratedReceipt {
  receiptId: string;
  format: ReceiptOptions['format'];
  data: Buffer | string;
  url?: string;
  metadata?: Record<string, any>;
}

// Property marking payment types
export interface MarkingPaymentRequest {
  markingJobId: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  metadata?: Record<string, any>;
}

export interface MarkingPaymentResponse {
  paymentId: string;
  checkoutUrl: string;
  reference: string;
}

// Transaction history types
export interface TransactionFilter {
  userId?: string;
  status?: PaymentStatus;
  paymentType?: PaymentType;
  startDate?: Date;
  endDate?: Date;
  propertyId?: string;
  unitId?: string;
  limit?: number;
  offset?: number;
}

export interface TransactionHistory {
  transactions: BasePayment[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Error types
export interface PaymentError {
  code: string;
  message: string;
  details?: Record<string, any>;
  statusCode: number;
  retryable: boolean;
}

export interface FlutterwaveError {
  error: boolean;
  message: string;
  code?: string;
  data?: any;
}

// API response wrappers
export interface PaymentApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: PaymentError;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Configuration types
export interface PaymentConfig {
  flutterwave: {
    publicKey: string;
    secretKey: string;
    encryptionKey: string;
    baseUrl: string;
    timeout: number;
  };
  virtualAccount: {
    provider: string;
    frequency: number;
    duration: number;
    isPermanent: boolean;
  };
  retry: {
    maxAttempts: number;
    backoffMultiplier: number;
    initialDelay: number;
  };
  locks: {
    defaultDuration: number;
    maxDuration: number;
    cleanupInterval: number;
  };
}

// Event types for payment processing
export type PaymentEvent = 
  | 'payment.initiated'
  | 'payment.pending'
  | 'payment.success'
  | 'payment.failed'
  | 'payment.cancelled'
  | 'payment.refunded'
  | 'lock.acquired'
  | 'lock.released'
  | 'lock.expired'
  | 'receipt.generated'
  | 'retry.scheduled'
  | 'retry.exhausted';

export interface PaymentEventPayload {
  event: PaymentEvent;
  paymentId: string;
  userId: string;
  timestamp: Date;
  data: Record<string, any>;
}