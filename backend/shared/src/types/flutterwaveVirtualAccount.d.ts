export interface FlutterwaveVirtualAccountRequest {
    email: string;
    is_permanent?: boolean;
    bvn?: string;
    tx_ref: string;
    phonenumber?: string;
    firstname?: string;
    lastname?: string;
    narration?: string;
}
export interface FlutterwaveVirtualAccountResponse {
    status: string;
    message: string;
    data: {
        response_code: string;
        response_message: string;
        flw_ref: string;
        order_ref: string;
        account_number: string;
        frequency: string;
        bank_name: string;
        created_at: string;
        expiry_date: string;
        note: string;
        amount?: number;
    };
}
export interface FlutterwaveVirtualAccountBalanceResponse {
    status: string;
    message: string;
    data: {
        available_balance: number;
        ledger_balance: number;
        currency: string;
    };
}
export interface FlutterwaveVirtualAccountTransaction {
    id: number;
    txn_ref: string;
    flw_ref: string;
    amount: number;
    currency: string;
    payment_type: string;
    status: string;
    created_at: string;
    account_number: string;
    bank_name: string;
    sender_name: string;
    narration: string;
}
export interface FlutterwaveVirtualAccountTransactionsResponse {
    status: string;
    message: string;
    data: FlutterwaveVirtualAccountTransaction[];
    meta: {
        page_info: {
            current_page: number;
            page_count: number;
            total: number;
            total_pages: number;
        };
    };
}
export interface VirtualAccountCreationData {
    userId: string;
    propertyId?: string;
    accountType: 'OWNER' | 'AGENT' | 'MARKING';
    ownerName: string;
    email: string;
    phone?: string;
}
export interface VirtualAccountBalanceData {
    accountNumber: string;
    availableBalance: number;
    ledgerBalance: number;
    currency: string;
    lastUpdated: Date;
}
export interface VirtualAccountConfig {
    bankCode: string;
    bankName: string;
    isActive: boolean;
    maxBalance?: number;
    minBalance?: number;
    allowedTransactionTypes: string[];
}
//# sourceMappingURL=flutterwaveVirtualAccount.d.ts.map