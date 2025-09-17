// backend/payment-service/src/types/virtualAccount.ts

export interface CreateVirtualAccountRequest {
  userId: string;
  propertyId?: string;
  accountName: string;
  email: string;
  phoneNumber?: string;
  bvn?: string;
  isPermanent?: boolean;
  narration?: string;
}

export interface VirtualAccountResponse {
  id: string;
  accountNumber: string;
  accountName: string;
  bankCode: string;
  bankName: string;
  userId: string;
  propertyId?: string;
  balance: number;
  currency: string;
  isActive: boolean;
  flutterwaveAccountId?: string;
  expiryDate?: Date;
  createdAt: Date;
}

export interface VirtualAccountBalance {
  accountId: string;
  balance: number;
  currency: string;
  lastUpdated: Date;
  pendingCredits: number;
  availableBalance: number;
}

export interface VirtualAccountTransaction {
  id: string;
  accountId: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  currency: string;
  reference: string;
  description: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  balanceBefore: number;
  balanceAfter: number;
  metadata?: Record<string, any>;
  processedAt?: Date;
  createdAt: Date;
}

export interface VirtualAccountStatement {
  accountId: string;
  accountNumber: string;
  accountName: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  openingBalance: number;
  closingBalance: number;
  totalCredits: number;
  totalDebits: number;
  transactionCount: number;
  transactions: VirtualAccountTransaction[];
  generatedAt: Date;
}

export interface VirtualAccountWebhook {
  event: 'account.credit' | 'account.debit' | 'account.created' | 'account.updated';
  data: {
    accountNumber: string;
    amount?: number;
    currency?: string;
    reference?: string;
    narration?: string;
    transactionDate?: string;
    balanceBefore?: number;
    balanceAfter?: number;
  };
}

export interface VirtualAccountSettings {
  id: string;
  userId: string;
  autoCreateForProperties: boolean;
  defaultNarration: string;
  notificationEnabled: boolean;
  notificationThreshold: number; // Minimum amount to trigger notification
  maxDailyCredit: number;
  maxMonthlyCredit: number;
  allowInternationalCredits: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VirtualAccountValidation {
  accountNumber: string;
  bankCode: string;
  isValid: boolean;
  accountName?: string;
  accountStatus?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  message?: string;
}

export interface BulkVirtualAccountCreation {
  requests: CreateVirtualAccountRequest[];
  batchId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  totalCount: number;
  successCount: number;
  failedCount: number;
  results: {
    success: VirtualAccountResponse[];
    failed: {
      request: CreateVirtualAccountRequest;
      error: string;
    }[];
  };
  createdAt: Date;
  completedAt?: Date;
}

export interface VirtualAccountTransfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency: string;
  reference: string;
  description: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  fee: number;
  exchangeRate?: number;
  metadata?: Record<string, any>;
  initiatedBy: string;
  approvedBy?: string;
  processedAt?: Date;
  createdAt: Date;
}

export interface VirtualAccountLimits {
  dailyCreditLimit: number;
  dailyDebitLimit: number;
  monthlyCreditLimit: number;
  monthlyDebitLimit: number;
  singleTransactionLimit: number;
  minimumBalance: number;
  maximumBalance: number;
}

export interface VirtualAccountNotification {
  id: string;
  accountId: string;
  type: 'CREDIT' | 'DEBIT' | 'LOW_BALANCE' | 'LIMIT_EXCEEDED' | 'ACCOUNT_SUSPENDED';
  title: string;
  message: string;
  amount?: number;
  currentBalance: number;
  isRead: boolean;
  channels: ('EMAIL' | 'SMS' | 'PUSH')[];
  sentAt?: Date;
  createdAt: Date;
}