import { VirtualAccountData, HeldFunds } from '../types/virtualAccount';
import { VirtualAccountType } from '../constants/virtualAccount';
export declare class VirtualAccountUtils {
    /**
     * Generate account name based on user data and account type
     */
    static generateAccountName(userName: string, accountType: VirtualAccountType, customSuffix?: string): string;
    /**
     * Get account prefix based on type
     */
    private static getAccountPrefix;
    /**
     * Generate random suffix for account names
     */
    private static generateRandomSuffix;
    /**
     * Generate unique transaction reference
     */
    static generateTransactionReference(prefix?: string): string;
    /**
     * Validate transaction amount
     */
    static validateTransactionAmount(amount: number): {
        valid: boolean;
        error?: string;
    };
    /**
     * Check if account has sufficient balance
     */
    static hasSufficientBalance(accountBalance: number, requestedAmount: number): boolean;
    /**
     * Calculate available balance (excluding held funds)
     */
    static calculateAvailableBalance(totalBalance: number, heldFunds: HeldFunds[]): number;
    /**
     * Format currency amount for display
     */
    static formatCurrency(amount: number, currency?: string): string;
    /**
     * Parse currency amount from string
     */
    static parseCurrencyAmount(amountString: string): number;
    /**
     * Generate webhook signature
     */
    static generateWebhookSignature(payload: string, secret: string): string;
    /**
     * Verify webhook signature
     */
    static verifyWebhookSignature(payload: string, signature: string, secret: string): boolean;
    /**
     * Calculate reconciliation discrepancy
     */
    static calculateReconciliationDiscrepancy(platformBalance: number, flutterwaveBalance: number): {
        discrepancy: number;
        percentageDiscrepancy: number;
        status: 'MATCHED' | 'DISCREPANCY';
    };
    /**
     * Generate account statement data
     */
    static generateStatementData(accountData: VirtualAccountData, transactions: any[], fromDate: Date, toDate: Date): {
        account: VirtualAccountData;
        period: {
            from: Date;
            to: Date;
        };
        summary: {
            openingBalance: any;
            closingBalance: number;
            totalCredits: any;
            totalDebits: any;
        };
        transactions: any[];
    };
}
//# sourceMappingURL=virtualAccount.d.ts.map