import { Decimal } from '@newcondo/db';

export interface PaymentRelease {
  paymentId: string;
  rentalId: string;
  confirmationPeriodEnd: Date;
  releaseDate: Date;
  isReleased: boolean;
  releasedAt?: Date;
  status: ReleaseStatus;
}

export enum ReleaseStatus {
  HELD = 'HELD',
  SCHEDULED = 'SCHEDULED',
  RELEASING = 'RELEASING',
  RELEASED = 'RELEASED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export interface ReleaseSchedule {
  paymentId: string;
  scheduledReleaseDate: Date;
  autoRelease: boolean;
  notificationsEnabled: boolean;
}

export interface ReleaseExecution {
  paymentId: string;
  executionStartedAt: Date;
  executionCompletedAt?: Date;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  transactions: ReleaseTransaction[];
  failureReason?: string;
}

export interface ReleaseTransaction {
  transactionId: string;
  recipientId: string;
  recipientType: 'OWNER' | 'LISTING_AGENT' | 'SUB_AGENT' | 'PLATFORM';
  virtualAccountId: string;
  amount: Decimal;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  flutterwaveReference?: string;
  executedAt?: Date;
  failureReason?: string;
}

export interface AutoTransferConfig {
  userId: string;
  virtualAccountId: string;
  isEnabled: boolean;
  transferMode: 'IMMEDIATE' | 'SCHEDULED';
  scheduledInterval?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  scheduledDay?: number; // Day of week/month
  destinationBankAccount: BankAccountDetails;
}

export interface BankAccountDetails {
  accountNumber: string;
  accountName: string;
  bankCode: string;
  bankName: string;
}

export interface ReleaseNotification {
  type: 'RELEASE_SCHEDULED' | 'RELEASE_COMPLETED' | 'RELEASE_FAILED' | 'FUNDS_AVAILABLE';
  recipientId: string;
  paymentId: string;
  amount: Decimal;
  virtualAccountId: string;
  message: string;
  metadata: Record<string, any>;
}

export interface WithdrawalRequest {
  userId: string;
  virtualAccountId: string;
  amount: Decimal;
  destinationAccount: BankAccountDetails;
  requestedAt: Date;
}

export interface WithdrawalResponse {
  success: boolean;
  withdrawalId: string;
  amount: Decimal;
  fee: Decimal;
  netAmount: Decimal;
  estimatedArrival: Date;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  message: string;
}