"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VirtualAccountUtils = void 0;
const crypto_1 = __importDefault(require("crypto"));
const virtualAccount_1 = require("../types/virtualAccount");
const virtualAccount_2 = require("../constants/virtualAccount");
class VirtualAccountUtils {
    /**
     * Generate account name based on user data and account type
     */
    static generateAccountName(userName, accountType, customSuffix) {
        // Clean and format the user name
        const cleanName = userName
            .replace(/[^a-zA-Z\s]/g, '') // Remove special characters
            .replace(/\s+/g, ' ') // Normalize spaces
            .trim()
            .toUpperCase();
        // Get appropriate prefix based on account type
        const prefix = this.getAccountPrefix(accountType);
        // Generate or use custom suffix
        const suffix = customSuffix || this.generateRandomSuffix();
        // Construct account name (max 40 characters for most banks)
        const accountName = `${prefix}${virtualAccount_2.VIRTUAL_ACCOUNT_CONSTANTS.NAMING.SEPARATOR}${cleanName}${virtualAccount_2.VIRTUAL_ACCOUNT_CONSTANTS.NAMING.SEPARATOR}${suffix}`;
        // Truncate if too long
        return accountName.length > 40
            ? accountName.substring(0, 37) + '...'
            : accountName;
    }
    /**
     * Get account prefix based on type
     */
    static getAccountPrefix(accountType) {
        switch (accountType) {
            case virtualAccount_2.VIRTUAL_ACCOUNT_CONSTANTS.ACCOUNT_TYPES.PROPERTY_OWNER:
                return virtualAccount_2.VIRTUAL_ACCOUNT_CONSTANTS.NAMING.OWNER_PREFIX;
            case virtualAccount_2.VIRTUAL_ACCOUNT_CONSTANTS.ACCOUNT_TYPES.AGENT:
                return virtualAccount_2.VIRTUAL_ACCOUNT_CONSTANTS.NAMING.AGENT_PREFIX;
            case virtualAccount_2.VIRTUAL_ACCOUNT_CONSTANTS.ACCOUNT_TYPES.MARKING_SERVICE:
                return virtualAccount_2.VIRTUAL_ACCOUNT_CONSTANTS.NAMING.MARKING_PREFIX;
            default:
                return 'NC-USR';
        }
    }
    /**
     * Generate random suffix for account names
     */
    static generateRandomSuffix() {
        const length = virtualAccount_2.VIRTUAL_ACCOUNT_CONSTANTS.NAMING.RANDOM_SUFFIX_LENGTH;
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    /**
     * Generate unique transaction reference
     */
    static generateTransactionReference(prefix = 'NC-TXN') {
        const timestamp = Date.now();
        const random = crypto_1.default.randomBytes(4).toString('hex').toUpperCase();
        return `${prefix}-${timestamp}-${random}`;
    }
    /**
     * Validate transaction amount
     */
    static validateTransactionAmount(amount) {
        if (amount < virtualAccount_2.VIRTUAL_ACCOUNT_CONSTANTS.TRANSACTION.MINIMUM_AMOUNT) {
            return {
                valid: false,
                error: `Amount must be at least ₦${virtualAccount_2.VIRTUAL_ACCOUNT_CONSTANTS.TRANSACTION.MINIMUM_AMOUNT}`
            };
        }
        if (amount > virtualAccount_2.VIRTUAL_ACCOUNT_CONSTANTS.TRANSACTION.MAXIMUM_SINGLE_AMOUNT) {
            return {
                valid: false,
                error: `Amount cannot exceed ₦${virtualAccount_2.VIRTUAL_ACCOUNT_CONSTANTS.TRANSACTION.MAXIMUM_SINGLE_AMOUNT.toLocaleString()}`
            };
        }
        return { valid: true };
    }
    /**
     * Check if account has sufficient balance
     */
    static hasSufficientBalance(accountBalance, requestedAmount) {
        return accountBalance >= requestedAmount;
    }
    /**
     * Calculate available balance (excluding held funds)
     */
    static calculateAvailableBalance(totalBalance, heldFunds) {
        const totalHeld = heldFunds
            .filter(fund => fund.status === 'HELD')
            .reduce((sum, fund) => sum + fund.amount, 0);
        return Math.max(0, totalBalance - totalHeld);
    }
    /**
     * Format currency amount for display
     */
    static formatCurrency(amount, currency = 'NGN') {
        const formatter = new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        return formatter.format(amount);
    }
    /**
     * Parse currency amount from string
     */
    static parseCurrencyAmount(amountString) {
        // Remove currency symbols and commas
        const cleaned = amountString.replace(/[₦,\s]/g, '');
        const amount = parseFloat(cleaned);
        if (isNaN(amount)) {
            throw new virtualAccount_1.VirtualAccountServiceError('Invalid amount format', 'INVALID_AMOUNT_FORMAT', 400);
        }
        return amount;
    }
    /**
     * Generate webhook signature
     */
    static generateWebhookSignature(payload, secret) {
        return crypto_1.default
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');
    }
    /**
     * Verify webhook signature
     */
    static verifyWebhookSignature(payload, signature, secret) {
        const expectedSignature = this.generateWebhookSignature(payload, secret);
        try {
            return crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Calculate reconciliation discrepancy
     */
    static calculateReconciliationDiscrepancy(platformBalance, flutterwaveBalance) {
        const discrepancy = Math.abs(platformBalance - flutterwaveBalance);
        const percentageDiscrepancy = flutterwaveBalance === 0 ? 0 : (discrepancy / flutterwaveBalance) * 100;
        // Consider matched if discrepancy is less than 1 kobo (0.01)
        const status = discrepancy < 0.01 ? 'MATCHED' : 'DISCREPANCY';
        return {
            discrepancy,
            percentageDiscrepancy: Math.round(percentageDiscrepancy * 100) / 100,
            status
        };
    }
    /**
     * Generate account statement data
     */
    static generateStatementData(accountData, transactions, fromDate, toDate) {
        // Calculate the opening balance based on transactions that occurred before the start date
        const openingBalance = transactions
            .filter(t => new Date(t.transactionDate) < fromDate)
            .filter(t => t.status === 'SUCCESS')
            .reduce((sum, t) => {
            if (t.type === 'CREDIT') {
                return sum + t.amount;
            }
            if (t.type === 'DEBIT') {
                return sum - t.amount;
            }
            return sum;
        }, 0);
        // Filter transactions for the specified date range
        const periodTransactions = transactions
            .filter(t => new Date(t.transactionDate) >= fromDate && new Date(t.transactionDate) <= toDate);
        // Separate credits and debits for the period
        const credits = periodTransactions.filter(t => t.type === 'CREDIT' && t.status === 'SUCCESS');
        const debits = periodTransactions.filter(t => t.type === 'DEBIT' && t.status === 'SUCCESS');
        // Sum up the total amounts for the period
        const totalCredits = credits.reduce((sum, t) => sum + t.amount, 0);
        const totalDebits = debits.reduce((sum, t) => sum + t.amount, 0);
        // Calculate the closing balance
        const closingBalance = openingBalance + totalCredits - totalDebits;
        return {
            account: accountData,
            period: {
                from: fromDate,
                to: toDate,
            },
            summary: {
                openingBalance,
                closingBalance,
                totalCredits,
                totalDebits,
            },
            transactions: periodTransactions,
        };
    }
}
exports.VirtualAccountUtils = VirtualAccountUtils;
//# sourceMappingURL=virtualAccount.js.map