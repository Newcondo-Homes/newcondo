// backend/payment-service/src/types/payment.ts

export interface CreatePaymentRequest {
  amount: number;
  currency: string;
  description?: string;
  paymentType: 'RENT' | 'DEPOSIT' | 'PROPERTY_MARKING' | 'PREMIUM_UPGRADE';
  rentalId?: string;
  markingJobId?: string;
  propertyId?: string;
  unitId?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  id: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  amount: number;
  currency: string;
  paymentUrl?: string;
  flutterwaveRef?: string;
  transactionId?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface PaymentStatusUpdate {
  status: 'SUCCESS' | 'FAILED' | 'CANCELLED';
  transactionId: string;
  flutterwaveRef: string;
  paidAt?: Date;
  failureReason?: string;
  metadata?: Record<string, any>;
}

export interface PaymentRefund {
  paymentId: string;
  amount?: number; // Partial refund if specified
  reason: string;
  metadata?: Record<string, any>;
}

export interface PaymentHistory {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paymentType: string;
  description?: string;
  propertyTitle?: string;
  unitNumber?: string;
  paidAt?: Date;
  createdAt: Date;
  receipt?: {
    id: string;
    url: string;
  };
}

export interface PaymentLock {
  id: string;
  propertyId: string;
  unitId?: string;
  userId: string;
  expiresAt: Date;
  paymentIntentId: string;
  isActive: boolean;
}

export interface PaymentMethodResponse {
  id: string;
  type: 'card' | 'bank' | 'ussd' | 'qr' | 'mobilemoney';
  name: string;
  isEnabled: boolean;
  metadata?: Record<string, any>;
}

// Commission and fee calculation
export interface PaymentCommission {
  totalAmount: number;
  platformFee: number;
  agentCommission?: number;
  ownerAmount: number;
  processingFee: number;
  breakdown: {
    platformFeeRate: number;
    agentCommissionRate?: number;
    processingFeeRate: number;
  };
}

export interface PaymentReceipt {
  id: string;
  paymentId: string;
  receiptNumber: string;
  url: string;
  generatedAt: Date;
}

export interface PaymentStats {
  totalPayments: number;
  totalAmount: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  averageAmount: number;
  paymentsByType: Record<string, number>;
  monthlyStats: {
    month: string;
    totalAmount: number;
    paymentCount: number;
  }[];
}