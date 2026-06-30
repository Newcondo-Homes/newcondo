// Base payment types from Prisma schema
export type PaymentStatus = 
  | 'PENDING' 
  | 'SUCCESS' 
  | 'FAILED' 
  | 'CANCELLED' 
  | 'REFUNDED' 
  | 'HELD' 
  | 'RELEASED';

export type PaymentType = 
  | 'RENT' 
  | 'DEPOSIT' 
  | 'AGENT_COMMISSION' 
  | 'PREMIUM_UPGRADE' 
  | 'PROPERTY_MARKING';


export interface PaymentCreateRequest {
  amount: number;
  currency: string;
  paymentType: PaymentType;
  description?: string;
  
  // Context-specific IDs
  rentalId?: string;
  markingJobId?: string;
  propertyId?: string;
  unitId?: string;
  
  // Payer information
  payerName: string;
  payerEmail: string;
  payerPhone: string;
  
  // Payment preferences
  paymentMethod?: string;
  redirectUrl?: string;
  
  // Additional metadata
  metadata?: Record<string, any>;
}

export interface PaymentRefundRequest {
  reason: string;
  amount?: number; // Optional for partial refunds
  metadata?: Record<string, any>;
}

export interface PaymentHistoryParams {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
  paymentType?: PaymentType;
  fromDate?: string;
  toDate?: string;
}

export interface VirtualAccountRequest {
  accountName: string;
  propertyId?: string;
  currency?: string;
  metadata?: Record<string, any>;
}

export interface PaymentConfirmRequest {
  transactionId: string;
  flutterwaveRef: string;
  status: 'successful' | 'cancelled' | 'failed';
  amount?: number;
  currency?: string;
  paymentMethod?: string;
  metadata?: Record<string, any>;
}

// Core payment interface matching Prisma model
export interface Payment {
  id: string;
  userId: string;
  rentalId?: string | null;
  markingJobId?: string | null;
  amount: number;
  currency: string;
  paymentType: PaymentType;
  status: PaymentStatus;
  paymentMethod?: string | null;
  
  // Flutterwave integration
  flutterwaveRef?: string | null;
  transactionId?: string | null;
  
  // Commission split
  agentCommission?: number | null;
  platformFee?: number | null;
  ownerAmount?: number | null;
  
  // Payment confirmation system
  confirmationPeriodEnd?: Date | null;
  isReleased: boolean;
  releasedAt?: Date | null;
  
  // Metadata
  description?: string | null;
  failureReason?: string | null;
  paidAt?: Date | null;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentRetryRequest {
  paymentMethod?: string;
  metadata?: Record<string, any>;
}

export interface PaymentWithRental extends Payment {
  rental?: {
    id: string;
    property: {
      id: string;
      title: string;
      address: string;
    };
  } | null;
}

export interface FlutterwaveCustomer {
  email: string;
  name: string;
  phone?: string;
  phone_number?: string; // Flutterwave SDK uses phone_number
}

export interface FlutterwaveCustomization {
  title: string;
  description: string;
  logo?: string;
}

export type PaymentCallback = (response: FlutterwaveResponse) => void;

// Form data for creating payments
export interface PaymentForm {
  amount: number;
  currency: string;
  paymentType: PaymentType;
  description?: string;
  
  // Context-specific IDs
  rentalId?: string;
  markingJobId?: string;
  propertyId?: string;
  unitId?: string;
  
  // Payer information
  payerName: string;
  payerEmail: string;
  payerPhone: string;
  
  // Payment preferences
  paymentMethod?: string;
  redirectUrl?: string;
  
  // Additional metadata
  metadata?: Record<string, any>;
}


// Refund details
export interface RefundDetails {
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  amount: number;
  currency: string;
  requestedAt: string;
  processedAt?: string;
  failureReason?: string;
  estimatedCompletionTime?: string;
  refundMethod: string;
  transactionId?: string;
}


// Flutterwave specific types
export interface FlutterwaveConfig {
  public_key: string;
  tx_ref: string;
  amount: number;
  currency: string;
  payment_options: string;
  payment_plan?: string | number;
  redirect_url?: string;
  customer: FlutterwaveCustomer; // ✅ use the interface instead of inline type
  customizations: FlutterwaveCustomization;
  meta?: Record<string, any>;
  callback?: PaymentCallback;
  onclose?: () => void;
}

export interface FlutterwaveResponse {
  status: 'successful' | 'cancelled' | 'failed';
  transaction_id?: string;
  tx_ref: string;
  flw_ref?: string;
  amount?: number;
  currency?: string;
  charged_amount?: number;
  app_fee?: number;
  merchant_fee?: number;
  processor_response?: string;
  auth_model?: string;
  ip?: string;
  narration?: string;
  payment_type?: string;
  account_id?: string;
  created_at?: string;
  customer?: {
    id: number;
    name: string;
    phone_number: string;
    email: string;
    created_at: string;
  };
  card?: {
    first_6digits: string;
    last_4digits: string;
    issuer: string;
    country: string;
    type: string;
    expiry: string;
  };
}

// Virtual Account types
export interface VirtualAccount {
  id: string;
  accountNumber: string;
  accountName: string;
  bankCode: string;
  userId: string;
  propertyId?: string | null;
  balance: number;
  currency: string;
  isActive: boolean;
  flutterwaveAccountId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface VirtualAccountForm {
  accountName: string;
  propertyId?: string;
  currency?: string;
}

// Payment history and analytics
export interface PaymentHistory {
  payments: Payment[];
  totalCount: number;
  totalAmount: number;
  totalPages: number;
  currentPage: number;
  stats: {
    successful: number;
    failed: number;
    pending: number;
    refunded: number;
    totalAmountPaid: number;
    totalAmountRefunded: number;
  };
}

export interface PaymentStats {
  totalPayments: number;
  totalAmountPaid: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  averagePaymentAmount: number;
  mostUsedPaymentMethod?: string;
  monthlyStats: {
    month: string;
    totalAmount: number;
    totalCount: number;
  }[];
}

// API response types
export interface PaymentApiResponse {
  success: boolean;
  data?: Payment;
  message?: string;
  error?: string;
}

export interface PaymentInitResponse {
  success: boolean;
  data?: {
    payment: Payment;
    paymentLink?: string;
    flutterwaveRef: string;
  };
  message?: string;
  error?: string;
}

export interface PaymentVerifyResponse {
  success: boolean;
  data?: {
    payment: Payment;
    verified: boolean;
  };
  message?: string;
  error?: string;
}

export interface VirtualAccountResponse {
  success: boolean;
  data?: VirtualAccount;
  message?: string;
  error?: string;
}

export interface PaymentHistoryResponse {
  success: boolean;
  data?: PaymentHistory;
  message?: string;
  error?: string;
}

// Payment method types
export type PaymentMethod = 
  | 'card' 
  | 'bank_transfer' 
  | 'ussd' 
  | 'qr' 
  | 'mobile_money' 
  | 'voucher' 
  | 'account';

export interface PaymentMethodOption {
  key: PaymentMethod;
  label: string;
  icon?: string;
  description?: string;
  isEnabled: boolean;
  fees?: {
    percentage?: number;
    fixed?: number;
  };
}

// Error types
export interface PaymentError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, any>;
}

export interface PaymentValidationError {
  field: string;
  message: string;
  code: string;
}

// Webhook types
export interface FlutterwaveWebhookPayload {
  event: string;
  'event.type': string;
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
    customer: {
      id: number;
      name: string;
      phone_number: string;
      email: string;
      created_at: string;
    };
    card?: {
      first_6digits: string;
      last_4digits: string;
      issuer: string;
      country: string;
      type: string;
      expiry: string;
    };
  };
}

// Rent payment specific types
export interface RentPaymentForm extends Omit<PaymentForm, 'paymentType'> {
  paymentType: 'RENT';
  rentalId: string;
  propertyTitle: string;
  unitNumber?: string;
  monthlyRent: number;
  landlordName: string;
}

// Property marking payment types
export interface MarkingPaymentForm extends Omit<PaymentForm, 'paymentType'> {
  paymentType: 'PROPERTY_MARKING';
  markingJobId: string;
  propertyAddress: string;
  markingFee: number;
  agentName?: string;
}

// Receipt types
export interface PaymentReceipt {
  id: string;
  paymentId: string;
  receiptNumber: string;
  amount: number;
  currency: string;
  paymentType: PaymentType;
  paymentMethod: string;
  paidAt: Date;
  
  // Payer details
  payerName: string;
  payerEmail: string;
  
  // Context details
  propertyTitle?: string;
  unitNumber?: string;
  landlordName?: string;
  
  // Transaction details
  transactionId: string;
  flutterwaveRef?: string;
  
  createdAt: Date;
}

// Filter and sorting types
export interface PaymentFilters {
  status?: PaymentStatus[];
  paymentType?: PaymentType[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  amountRange?: {
    min: number;
    max: number;
  };
  paymentMethod?: string[];
}

export interface PaymentSortOptions {
  field: keyof Payment;
  direction: 'asc' | 'desc';
}

export interface PaymentQueryParams {
  page?: number;
  limit?: number;
  filters?: PaymentFilters;
  sort?: PaymentSortOptions;
  search?: string;
}

// Commission calculation types
export interface CommissionCalculation {
  baseAmount: number;
  agentCommission: number;
  platformFee: number;
  ownerAmount: number;
  agentCommissionPercentage: number;
  platformFeePercentage: number;
}

// Payment confirmation types
export interface PaymentConfirmation {
  paymentId: string;
  confirmationDeadline: Date;
  isConfirmed: boolean;
  confirmedAt?: Date;
  daysRemaining: number;
}