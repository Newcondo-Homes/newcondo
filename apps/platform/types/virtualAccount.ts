// apps/platform/types/virtualAccount.ts

export interface VirtualAccount {
  id: string;
  accountNumber: string;
  accountName: string;
  bankCode: string;
  userId: string;
  propertyId?: string;
  balance: number;
  currency: string;
  isActive: boolean;
  flutterwaveAccountId?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  property?: {
    id: string;
    title: string;
    address: string;
  };
}

export interface VirtualAccountBalance {
  accountId: string;
  balance: number;
  currency: string;
  lastUpdated: string;
  pendingTransactions: number;
  availableBalance: number;
}

export interface VirtualAccountTransaction {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  reference: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface VirtualAccountStatement {
  accountId: string;
  period: {
    startDate: string;
    endDate: string;
  };
  openingBalance: number;
  closingBalance: number;
  totalCredits: number;
  totalDebits: number;
  transactionCount: number;
  transactions: VirtualAccountTransaction[];
  generatedAt: string;
}

export interface FundTransfer {
  id?: string;
  fromAccountId: string;
  toAccountId?: string;
  toAccountNumber?: string;
  toBankCode?: string;
  amount: number;
  currency: string;
  description: string;
  transferType: TransferType;
  status?: TransferStatus;
  reference?: string;
  metadata?: Record<string, any>;
}

export interface AccountReconciliation {
  id: string;
  accountId: string;
  period: {
    startDate: string;
    endDate: string;
  };
  systemBalance: number;
  actualBalance: number;
  discrepancy: number;
  status: ReconciliationStatus;
  reconciliationItems: ReconciliationItem[];
  resolvedBy?: string;
  resolvedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReconciliationItem {
  id: string;
  transactionId?: string;
  description: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT' | 'ADJUSTMENT';
  status: 'MATCHED' | 'UNMATCHED' | 'DISPUTED';
  notes?: string;
}

// Enums
export enum TransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT',
  RENT_PAYMENT = 'RENT_PAYMENT',
  MARKING_FEE = 'MARKING_FEE',
  COMMISSION = 'COMMISSION',
  REFUND = 'REFUND',
  WITHDRAWAL = 'WITHDRAWAL',
  DEPOSIT = 'DEPOSIT'
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  PROCESSING = 'PROCESSING'
}

export enum TransferType {
  INTERNAL = 'INTERNAL', // Between virtual accounts within the platform
  EXTERNAL = 'EXTERNAL', // To external bank accounts
  WITHDRAWAL = 'WITHDRAWAL', // To user's personal account
  DEPOSIT = 'DEPOSIT' // From external source to virtual account
}

export enum TransferStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum ReconciliationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  RECONCILED = 'RECONCILED',
  DISPUTED = 'DISPUTED',
  REQUIRES_ATTENTION = 'REQUIRES_ATTENTION'
}

// API Request/Response Types
export interface CreateVirtualAccountRequest {
  userId: string;
  propertyId?: string;
  accountName: string;
}

export interface CreateVirtualAccountResponse {
  success: boolean;
  data: VirtualAccount;
  message: string;
}

export interface GetVirtualAccountsResponse {
  success: boolean;
  data: VirtualAccount[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GetVirtualAccountBalanceResponse {
  success: boolean;
  data: VirtualAccountBalance;
}

export interface GetVirtualAccountStatementResponse {
  success: boolean;
  data: VirtualAccountStatement;
}

export interface InitiateFundTransferRequest {
  fromAccountId: string;
  toAccountId?: string;
  toAccountNumber?: string;
  toBankCode?: string;
  amount: number;
  currency: string;
  description: string;
  transferType: TransferType;
  pin?: string; // Transaction PIN for security
}

export interface InitiateFundTransferResponse {
  success: boolean;
  data: {
    transferId: string;
    reference: string;
    status: TransferStatus;
    estimatedCompletionTime?: string;
  };
  message: string;
}

export interface ReconcileAccountRequest {
  accountId: string;
  period: {
    startDate: string;
    endDate: string;
  };
  actualBalance: number;
  reconciliationItems?: Partial<ReconciliationItem>[];
  notes?: string;
}

export interface ReconcileAccountResponse {
  success: boolean;
  data: AccountReconciliation;
  message: string;
}

// Filter and Search Types
export interface VirtualAccountFilters {
  userId?: string;
  propertyId?: string;
  isActive?: boolean;
  minBalance?: number;
  maxBalance?: number;
  currency?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface TransactionFilters {
  accountId?: string;
  type?: TransactionType;
  status?: TransactionStatus;
  minAmount?: number;
  maxAmount?: number;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

// UI Component Props
export interface VirtualAccountCardProps {
  account: VirtualAccount;
  showBalance?: boolean;
  onSelect?: (account: VirtualAccount) => void;
  actions?: React.ReactNode;
}

export interface TransactionListProps {
  transactions: VirtualAccountTransaction[];
  loading?: boolean;
  onTransactionClick?: (transaction: VirtualAccountTransaction) => void;
  showAccountInfo?: boolean;
}

export interface FundTransferFormData {
  fromAccountId: string;
  transferType: TransferType;
  toAccountId?: string;
  toAccountNumber?: string;
  toBankCode?: string;
  amount: string;
  description: string;
  pin?: string;
}

export interface ReconciliationFormData {
  accountId: string;
  startDate: string;
  endDate: string;
  actualBalance: string;
  notes?: string;
  reconciliationItems: {
    description: string;
    amount: string;
    type: 'CREDIT' | 'DEBIT' | 'ADJUSTMENT';
    notes?: string;
  }[];
}