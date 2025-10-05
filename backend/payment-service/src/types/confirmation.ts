import { PaymentStatus } from '@newcondo/db';

export interface ConfirmationRequest {
  rentalId: string;
  userId: string;
  isConfirmed: boolean;
  notes?: string;
}

export interface DisputeRequest {
  rentalId: string;
  userId: string;
  reason: string;
  evidenceUrls?: string[];
}

export interface ConfirmationResponse {
  success: boolean;
  rentalId: string;
  isConfirmed: boolean;
  message: string;
  refundInitiated?: boolean;
}

export interface DisputeResponse {
  success: boolean;
  rentalId: string;
  disputeId: string;
  message: string;
  expectedResolutionTime: string;
}

export interface ConfirmationStatus {
  rentalId: string;
  paymentId: string;
  isConfirmed: boolean;
  confirmationDeadline: Date;
  hoursRemaining: number;
  canConfirm: boolean;
  canDispute: boolean;
  status: 'PENDING' | 'CONFIRMED' | 'DISPUTED' | 'EXPIRED';
}

export interface ConfirmationDeadlineCheck {
  rentalId: string;
  paymentId: string;
  confirmationDeadline: Date;
  isExpired: boolean;
  shouldAutoConfirm: boolean;
}