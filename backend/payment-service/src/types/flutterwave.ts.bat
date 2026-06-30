// backend/payment-service/src/types/flutterwave.ts

// Standard Flutterwave Payment Request
export interface FlutterwavePaymentRequest {
  tx_ref: string;
  amount: number;
  currency: string;
  redirect_url: string;
  customer: {
    email: string;
    phonenumber?: string;
    name: string;
  };
  customizations?: {
    title?: string;
    description?: string;
    logo?: string;
  };
  configurations?: {
    session_duration?: number;
    max_retry_attempt?: number;
  };
  payment_options?: string;
  meta?: Record<string, any>;
}

// Flutterwave Payment Response
export interface FlutterwavePaymentResponse {
  status: string;
  message: string;
  data: {
    link: string;
  };
}

// Transaction Verification Response
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
    customer: {
      id: number;
      name: string;
      phone_number: string;
      email: string;
      created_at: string;
    };
  };
}

// Webhook Event Types
export interface FlutterwaveWebhookEvent {
  event: string;
  data: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    amount: number;
    currency: string;
    charged_amount: number;
    status: string;
    payment_type: string;
    created_at: string;
    customer: {
      id: number;
      name: string;
      email: string;
      phone_number: string;
    };
  };
}

// Virtual Account Creation Request
export interface CreateVirtualAccountRequest {
  email: string;
  is_permanent: boolean;
  bvn?: string;
  phonenumber?: string;
  firstname?: string;
  lastname?: string;
  narration?: string;
}

// Virtual Account Response
export interface VirtualAccountResponse {
  status: string;
  message: string;
  data: {
    response_code: string;
    response_message: string;
    flw_ref: string;
    account_number: string;
    frequency: string;
    bank_name: string;
    created_at: string;
    expiry_date: string;
    note: string;
    amount: number;
  };
}

// Refund Request
export interface FlutterwaveRefundRequest {
  id: string; // Transaction ID
  amount?: number;
}

// Refund Response
export interface FlutterwaveRefundResponse {
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
    meta: {
      source: string;
    };
    created_at: string;
  };
}

// Bank Transfer Request
export interface BankTransferRequest {
  account_bank: string;
  account_number: string;
  amount: number;
  narration: string;
  currency: string;
  reference: string;
  callback_url?: string;
  debit_currency?: string;
}

// Bank Transfer Response
export interface BankTransferResponse {
  status: string;
  message: string;
  data: {
    id: number;
    account_number: string;
    bank_code: string;
    full_name: string;
    created_at: string;
    currency: string;
    debit_currency: string;
    amount: number;
    fee: number;
    status: string;
    reference: string;
    meta: any;
    narration: string;
    complete_message: string;
    requires_approval: number;
    is_approved: number;
    bank_name: string;
  };
}

// Bill Payment Request
export interface BillPaymentRequest {
  country: string;
  customer: string;
  amount: number;
  recurrence: string;
  type: string;
  reference: string;
}

// Error Response
export interface FlutterwaveErrorResponse {
  status: string;
  message: string;
  data?: any;
}

// Payment Method Types
export type FlutterwavePaymentMethod = 
  | 'card'
  | 'account'
  | 'ussd'
  | 'qr'
  | 'mobilemoney'
  | 'banktransfer';

// Transaction Status Types
export type FlutterwaveTransactionStatus = 
  | 'successful'
  | 'failed'
  | 'cancelled'
  | 'pending';

// Currency Types
export type FlutterwaveCurrency = 
  | 'NGN'
  | 'USD'
  | 'GBP'
  | 'EUR'
  | 'KES'
  | 'GHS'
  | 'ZAR';

// API Response Wrapper
export interface FlutterwaveApiResponse<T> {
  status: string;
  message: string;
  data: T;
}