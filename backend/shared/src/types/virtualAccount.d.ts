import { VirtualAccountType } from '../constants/virtualAccount';
import { Decimal } from '@newcondo/db';
export interface VirtualAccountData {
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
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateVirtualAccountRequest {
    userId: string;
    propertyId?: string;
    accountType: VirtualAccountType;
    customNameSuffix?: string;
}
export interface CreateVirtualAccountResponse {
    success: boolean;
    data?: VirtualAccountData;
    error?: string;
    flutterwaveResponse?: any;
}
export interface VirtualAccountBalance {
    virtualAccountId: string;
    userId: string;
    balance: Decimal;
    accountNumber: string;
    currency: string;
    lastUpdated: Date;
    pendingTransactions?: number;
    heldBalance: Decimal;
    availableBalance?: Decimal;
}
export interface VirtualAccountTransaction {
    id: string;
    accountNumber: string;
    balance: number;
    txnRef: string;
    amount: number;
    currency: string;
    type: 'CREDIT' | 'DEBIT';
    status?: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REVERSED';
    reference: string;
    senderName?: string;
    description?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    processedAt?: Date;
}
export interface VirtualAccountStatement {
    accountNumber: string;
    accountName: string;
    fromDate: Date;
    toDate: Date;
    openingBalance: number;
    closingBalance: number;
    totalCredits: number;
    totalDebits: number;
    transactionCount: number;
    transactions: VirtualAccountTransaction[];
}
export interface VirtualAccountReconciliation {
    accountNumber: string;
    reconciliationDate: Date;
    platformBalance: number;
    flutterwaveBalance: number;
    discrepancy: number;
    status: 'MATCHED' | 'DISCREPANCY' | 'PENDING' | 'RESOLVED';
    notes?: string;
    resolvedAt?: Date;
    resolvedBy?: string;
}
export interface FundHoldingRequest {
    accountNumber: string;
    amount: number;
    holdingPeriodDays: number;
    reason: string;
    relatedTransactionId?: string;
    metadata?: Record<string, any>;
}
export interface FundHoldingResponse {
    success: boolean;
    holdingId?: string;
    releaseDate?: Date;
    error?: string;
}
export interface HeldFunds {
    id: string;
    accountNumber: string;
    amount: number;
    currency: string;
    holdingReason: string;
    holdingStartDate: Date;
    scheduledReleaseDate: Date;
    actualReleaseDate?: Date;
    status: 'HELD' | 'RELEASED' | 'CANCELLED';
    relatedTransactionId?: string;
    metadata?: Record<string, any>;
}
export interface VirtualAccountWebhook {
    event: string;
    data: {
        account_number: string;
        amount?: number;
        currency?: string;
        reference?: string;
        status?: string;
        metadata?: Record<string, any>;
        timestamp: string;
    };
    signature: string;
}
export interface VirtualAccountMetrics {
    totalAccounts: number;
    activeAccounts: number;
    suspendedAccounts: number;
    totalBalance: number;
    totalTransactionsToday: number;
    totalVolumeToday: number;
    averageAccountBalance: number;
    reconciliationStatus: {
        matched: number;
        discrepancies: number;
        pending: number;
    };
}
export interface BulkAccountOperation {
    operation: 'SUSPEND' | 'REACTIVATE' | 'UPDATE_LIMITS' | 'RECONCILE';
    accountNumbers: string[];
    parameters?: Record<string, any>;
}
export interface BulkOperationResult {
    success: boolean;
    processed: number;
    failed: number;
    results: Array<{
        accountNumber: string;
        success: boolean;
        error?: string;
    }>;
}
export interface FlutterwaveWebhookData {
    event: string;
    data: {
        id: number;
        txRef: string;
        orderRef?: string;
        flwRef: string;
        currency: string;
        amount: number;
        charged_amount: number;
        status: string;
        payment_type: string;
        created_at: string;
        account_id: number;
        customer: {
            id: number;
            phone_number?: string;
            name: string;
            email: string;
            created_at: string;
        };
        entity: {
            account_number: string;
            bank_name: string;
        };
    };
}
export interface VirtualAccountError extends Error {
    code: string;
    statusCode?: number;
    details?: Record<string, any>;
}
export declare class VirtualAccountServiceError extends Error implements VirtualAccountError {
    code: string;
    statusCode?: number;
    details?: Record<string, any>;
    constructor(message: string, code: string, statusCode?: number, details?: Record<string, any>);
}
//# sourceMappingURL=virtualAccount.d.ts.map