// backend/payment-service/src/types/markingPayment.ts

export interface MarkingPaymentRequest {
  propertyId: string;
  markingJobId: string;
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions?: string;
  preferredTime?: string;
  urgencyLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

export interface MarkingPaymentResponse {
  paymentId: string;
  markingJobId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  flutterwaveRef?: string;
  paymentLink?: string;
  expiresAt: string;
}

export interface FlutterwaveMarkingPaymentData {
  tx_ref: string;
  amount: number;
  currency: string;
  customer: {
    email: string;
    phonenumber: string;
    name: string;
  };
  customizations: {
    title: string;
    description: string;
    logo: string;
  };
  redirect_url: string;
  meta: {
    markingJobId: string;
    propertyId: string;
    urgencyLevel: string;
  };
}

export interface MarkingFeeCalculation {
  baseFee: number;
  urgencyMultiplier: number;
  distanceFee: number;
  totalFee: number;
  currency: string;
}

export interface MarkingPaymentWebhookPayload {
  event: 'charge.completed' | 'charge.failed';
  data: {
    id: string;
    tx_ref: string;
    flw_ref: string;
    status: 'successful' | 'failed' | 'cancelled';
    amount: number;
    currency: string;
    customer: {
      id: string;
      email: string;
      phone_number: string;
      name: string;
    };
    meta: {
      markingJobId: string;
      propertyId: string;
      urgencyLevel: string;
    };
  };
}

export interface MarkingPaymentConfirmation {
  markingJobId: string;
  paymentId: string;
  status: 'CONFIRMED' | 'FAILED';
  transactionId: string;
  paidAt: string;
  amount: number;
  currency: string;
}

export interface MarkingRefundRequest {
  paymentId: string;
  markingJobId: string;
  reason: string;
  refundAmount?: number;
}

export interface MarkingRefundResponse {
  refundId: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  refundAmount: number;
  currency: string;
  processedAt?: string;
  failureReason?: string;
}