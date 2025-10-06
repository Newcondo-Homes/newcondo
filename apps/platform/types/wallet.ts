// Virtual account and wallet types
export interface VirtualAccount {
  id: string;
  accountNumber: string;
  accountName: string;
  bankCode: string;
  bankName: string;
  userId: string;
  propertyId?: string;
  
  // Account details
  balance: number;
  currency: string;
  isActive: boolean;
  
  // Flutterwave integration
  flutterwaveAccountId?: string;
  
  // Metadata
  accountType: VirtualAccountType;
  description?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export enum VirtualAccountType {
  USER = 'USER', // Individual user account (agent, owner, renter)
  PROPERTY = 'PROPERTY', // Property-specific account
  ADMIN = 'ADMIN', // Newcondo platform account
  ESCROW = 'ESCROW', // Temporary holding account
}

export interface WalletBalance {
  available: number;
  held: number;
  pending: number;
  total: number;
  currency: string;
  lastUpdated: Date;
}

export interface WalletTransaction {
  id: string;
  virtualAccountId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  
  // Transaction details
  status: TransactionStatus;
  description: string;
  reference: string;
  
  // Related entities
  paymentId?: string;
  rentalId?: string;
  userId?: string;
  propertyId?: string;
  
  // Balances
  balanceBefore: number;
  balanceAfter: number;
  
  // Metadata
  metadata?: Record<string, any>;
  
  createdAt: Date;
  completedAt?: Date;
}

export enum TransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
  HOLD = 'HOLD',
  RELEASE = 'RELEASE',
  REFUND = 'REFUND',
  COMMISSION = 'COMMISSION',
  WITHDRAWAL = 'WITHDRAWAL',
  TRANSFER = 'TRANSFER',
  FEE = 'FEE',
  REVERSAL = 'REVERSAL',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REVERSED = 'REVERSED',
}

export interface HeldFunds {
  id: string;
  virtualAccountId: string;
  amount: number;
  currency: string;
  
  // Hold details
  reason: HoldReason;
  paymentId: string;
  rentalId: string;
  
  // Timeline
  heldAt: Date;
  releaseDate: Date;
  releasedAt?: Date;
  
  // Status
  status: 'HELD' | 'RELEASED' | 'REFUNDED';
  
  metadata?: Record<string, any>;
}

export enum HoldReason {
  PAYMENT_CONFIRMATION = 'PAYMENT_CONFIRMATION',
  DISPUTE_RESOLUTION = 'DISPUTE_RESOLUTION',
  VERIFICATION_PENDING = 'VERIFICATION_PENDING',
  FRAUD_CHECK = 'FRAUD_CHECK',
  ADMIN_HOLD = 'ADMIN_HOLD',
}

export interface WithdrawalRequest {
  id: string;
  virtualAccountId: string;
  amount: number;
  currency: string;
  
  // Destination
  bankCode: string;
  accountNumber: string;
  accountName: string;
  
  // Status
  status: WithdrawalStatus;
  requestedAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  
  // Reference
  reference: string;
  flutterwaveReference?: string;
  
  // Fees
  withdrawalFee: number;
  netAmount: number;
  
  failureReason?: string;
}

export enum WithdrawalStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface AutoTransferSettings {
  id: string;
  virtualAccountId: string;
  isEnabled: boolean;
  
  // Transfer configuration
  transferMode: TransferMode;
  minimumBalance?: number;
  scheduleType?: ScheduleType;
  scheduleValue?: string; // e.g., "MONDAY" or "15" for day of month
  
  // Destination
  bankCode: string;
  accountNumber: string;
  accountName: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export enum TransferMode {
  IMMEDIATE = 'IMMEDIATE', // Transfer as soon as funds are released
  SCHEDULED = 'SCHEDULED', // Transfer on a schedule
  MANUAL = 'MANUAL', // Require manual withdrawal
}

export enum ScheduleType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export interface WalletStatement {
  virtualAccountId: string;
  startDate: Date;
  endDate: Date;
  
  // Summary
  openingBalance: number;
  closingBalance: number;
  totalCredits: number;
  totalDebits: number;
  totalHeld: number;
  totalReleased: number;
  
  // Transactions
  transactions: WalletTransaction[];
  
  // Metadata
  generatedAt: Date;
  currency: string;
}

// API Request/Response types
export interface CreateVirtualAccountRequest {
  userId: string;
  propertyId?: string;
  accountType: VirtualAccountType;
}

export interface CreateVirtualAccountResponse {
  success: boolean;
  virtualAccount: VirtualAccount;
  message: string;
}

export interface WithdrawFundsRequest {
  virtualAccountId: string;
  amount: number;
  bankCode: string;
  accountNumber: string;
  accountName: string;
}

export interface WithdrawFundsResponse {
  success: boolean;
  withdrawalRequest: WithdrawalRequest;
  message: string;
}

export interface UpdateAutoTransferRequest {
  virtualAccountId: string;
  settings: Partial<AutoTransferSettings>;
}

export interface UpdateAutoTransferResponse {
  success: boolean;
  settings: AutoTransferSettings;
  message: string;
}

export interface GetWalletBalanceResponse {
  success: boolean;
  balance: WalletBalance;
  virtualAccount: VirtualAccount;
}

export interface GetTransactionHistoryRequest {
  virtualAccountId: string;
  startDate?: Date;
  endDate?: Date;
  type?: TransactionType;
  status?: TransactionStatus;
  limit?: number;
  offset?: number;
}

export interface GetTransactionHistoryResponse {
  success: boolean;
  transactions: WalletTransaction[];
  total: number;
  hasMore: boolean;
}