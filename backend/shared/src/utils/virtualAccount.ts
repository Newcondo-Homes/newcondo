import crypto from 'crypto';
import { 
  VirtualAccountData,
  CreateVirtualAccountRequest,
  VirtualAccountBalance,
  VirtualAccountReconciliation,
  VirtualAccountServiceError,
  HeldFunds
} from '../types/virtualAccount';
import { VIRTUAL_ACCOUNT_CONSTANTS, VirtualAccountType } from '../constants/virtualAccount';

export class VirtualAccountUtils {
  /**
   * Generate account name based on user data and account type
   */
  static generateAccountName(
    userName: string,
    accountType: VirtualAccountType,
    customSuffix?: string
  ): string {
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
    const accountName = `${prefix}${VIRTUAL_ACCOUNT_CONSTANTS.NAMING.SEPARATOR}${cleanName}${VIRTUAL_ACCOUNT_CONSTANTS.NAMING.SEPARATOR}${suffix}`;
    
    // Truncate if too long
    return accountName.length > 40 
      ? accountName.substring(0, 37) + '...'
      : accountName;
  }

  /**
   * Get account prefix based on type
   */
  private static getAccountPrefix(accountType: VirtualAccountType): string {
    switch (accountType) {
      case VIRTUAL_ACCOUNT_CONSTANTS.ACCOUNT_TYPES.PROPERTY_OWNER:
        return VIRTUAL_ACCOUNT_CONSTANTS.NAMING.OWNER_PREFIX;
      case VIRTUAL_ACCOUNT_CONSTANTS.ACCOUNT_TYPES.AGENT:
        return VIRTUAL_ACCOUNT_CONSTANTS.NAMING.AGENT_PREFIX;
      case VIRTUAL_ACCOUNT_CONSTANTS.ACCOUNT_TYPES.MARKING_SERVICE:
        return VIRTUAL_ACCOUNT_CONSTANTS.NAMING.MARKING_PREFIX;
      default:
        return 'NC-USR';
    }
  }

  /**
   * Generate random suffix for account names
   */
  private static generateRandomSuffix(): string {
    const length = VIRTUAL_ACCOUNT_CONSTANTS.NAMING.RANDOM_SUFFIX_LENGTH;
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
  static generateTransactionReference(prefix = 'NC-TXN'): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Validate transaction amount
   */
  static validateTransactionAmount(amount: number): { valid: boolean; error?: string } {
    if (amount < VIRTUAL_ACCOUNT_CONSTANTS.TRANSACTION.MINIMUM_AMOUNT) {
      return {
        valid: false,
        error: `Amount must be at least ₦${VIRTUAL_ACCOUNT_CONSTANTS.TRANSACTION.MINIMUM_AMOUNT}`
      };
    }

    if (amount > VIRTUAL_ACCOUNT_CONSTANTS.TRANSACTION.MAXIMUM_SINGLE_AMOUNT) {
      return {
        valid: false,
        error: `Amount cannot exceed ₦${VIRTUAL_ACCOUNT_CONSTANTS.TRANSACTION.MAXIMUM_SINGLE_AMOUNT.toLocaleString()}`
      };
    }

    return { valid: true };
  }

  /**
   * Check if account has sufficient balance
   */
  static hasSufficientBalance(accountBalance: number, requestedAmount: number): boolean {
    return accountBalance >= requestedAmount;
  }

  /**
   * Calculate available balance (excluding held funds)
   */
  static calculateAvailableBalance(totalBalance: number, heldFunds: HeldFunds[]): number {
    const totalHeld = heldFunds
      .filter(fund => fund.status === 'HELD')
      .reduce((sum, fund) => sum + fund.amount, 0);

    return Math.max(0, totalBalance - totalHeld);
  }

  /**
   * Format currency amount for display
   */
  static formatCurrency(amount: number, currency = 'NGN'): string {
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
  static parseCurrencyAmount(amountString: string): number {
    // Remove currency symbols and commas
    const cleaned = amountString.replace(/[₦,\s]/g, '');
    const amount = parseFloat(cleaned);
    
    if (isNaN(amount)) {
      throw new VirtualAccountServiceError(
        'Invalid amount format',
        'INVALID_AMOUNT_FORMAT',
        400
      );
    }

    return amount;
  }

  /**
   * Generate webhook signature
   */
  static generateWebhookSignature(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateWebhookSignature(payload, secret);
    
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Calculate reconciliation discrepancy
   */
  static calculateReconciliationDiscrepancy(
    platformBalance: number,
    flutterwaveBalance: number
  ): { discrepancy: number; percentageDiscrepancy: number; status: 'MATCHED' | 'DISCREPANCY' } {
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
  static generateStatementData(
    accountData: VirtualAccountData,
    transactions: any[],
    fromDate: Date,
    toDate: Date
  ) {
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




// backend/shared/src/utils/virtualAccount.ts

// import { Decimal } from '@prisma/client/runtime/library';

// /**
//  * Virtual account types for different users
//  */
// export type VirtualAccountType = 'PROPERTY_OWNER' | 'LISTING_AGENT' | 'SUB_AGENT' | 'PLATFORM';

// /**
//  * Generate virtual account name based on user type and info
//  */
// export function generateVirtualAccountName(params: {
//   userType: VirtualAccountType;
//   userName?: string;
//   propertyId?: string;
// }): string {
//   const { userType, userName, propertyId } = params;
  
//   switch (userType) {
//     case 'PROPERTY_OWNER':
//       return `NEWCONDO-OWNER-${userName || 'USER'}`.toUpperCase().substring(0, 50);
    
//     case 'LISTING_AGENT':
//       return `NEWCONDO-AGENT-${userName || 'USER'}`.toUpperCase().substring(0, 50);
    
//     case 'SUB_AGENT':
//       return `NEWCONDO-SUBAGENT-${userName || 'USER'}`.toUpperCase().substring(0, 50);
    
//     case 'PLATFORM':
//       return 'NEWCONDO-PLATFORM';
    
//     default:
//       return 'NEWCONDO-USER';
//   }
// }

// /**
//  * Validate virtual account number format
//  * Flutterwave virtual accounts are typically 10 digits
//  */
// export function isValidAccountNumber(accountNumber: string): boolean {
//   // Remove any spaces or dashes
//   const cleaned = accountNumber.replace(/[\s-]/g, '');
  
//   // Check if it's numeric and has valid length (typically 10 digits for Nigerian banks)
//   return /^\d{10}$/.test(cleaned);
// }

// /**
//  * Format account number for display (adds spacing)
//  */
// export function formatAccountNumber(accountNumber: string): string {
//   const cleaned = accountNumber.replace(/[\s-]/g, '');
  
//   // Format as XXX-XXX-XXXX for 10-digit accounts
//   if (cleaned.length === 10) {
//     return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
//   }
  
//   return accountNumber;
// }

// /**
//  * Calculate virtual account balance after transaction
//  */
// export function calculateBalanceAfterTransaction(
//   currentBalance: Decimal | number,
//   transactionAmount: Decimal | number,
//   transactionType: 'CREDIT' | 'DEBIT'
// ): Decimal {
//   const balance = typeof currentBalance === 'number' 
//     ? new Decimal(currentBalance) 
//     : currentBalance;
  
//   const amount = typeof transactionAmount === 'number' 
//     ? new Decimal(transactionAmount) 
//     : transactionAmount;
  
//   if (transactionType === 'CREDIT') {
//     return balance.add(amount).toDecimalPlaces(2);
//   } else {
//     return balance.sub(amount).toDecimalPlaces(2);
//   }
// }

// /**
//  * Check if virtual account has sufficient balance for withdrawal
//  */
// export function hasSufficientBalance(
//   currentBalance: Decimal | number,
//   withdrawalAmount: Decimal | number
// ): { sufficient: boolean; shortfall?: Decimal } {
//   const balance = typeof currentBalance === 'number' 
//     ? new Decimal(currentBalance) 
//     : currentBalance;
  
//   const amount = typeof withdrawalAmount === 'number' 
//     ? new Decimal(withdrawalAmount) 
//     : withdrawalAmount;
  
//   if (balance.greaterThanOrEqualTo(amount)) {
//     return { sufficient: true };
//   }
  
//   const shortfall = amount.sub(balance).toDecimalPlaces(2);
//   return { sufficient: false, shortfall };
// }

// /**
//  * Validate virtual account for payment hold
//  */
// export function validateVirtualAccountForHold(params: {
//   accountNumber: string;
//   isActive: boolean;
//   userId: string;
// }): { isValid: boolean; errors: string[] } {
//   const errors: string[] = [];
//   const { accountNumber, isActive, userId } = params;
  
//   if (!accountNumber) {
//     errors.push('Virtual account number is required');
//   } else if (!isValidAccountNumber(accountNumber)) {
//     errors.push('Invalid virtual account number format');
//   }
  
//   if (!isActive) {
//     errors.push('Virtual account is not active');
//   }
  
//   if (!userId) {
//     errors.push('User ID is required');
//   }
  
//   return {
//     isValid: errors.length === 0,
//     errors,
//   };
// }

// /**
//  * Create virtual account transaction reference
//  */
// export function generateTransactionReference(params: {
//   accountType: VirtualAccountType;
//   transactionType: 'HOLD' | 'RELEASE' | 'REFUND';
//   paymentId: string;
// }): string {
//   const { accountType, transactionType, paymentId } = params;
//   const timestamp = Date.now();
  
//   return `NEWCONDO-${accountType}-${transactionType}-${paymentId.slice(-8)}-${timestamp}`;
// }

// /**
//  * Parse virtual account transaction reference
//  */
// export function parseTransactionReference(reference: string): {
//   platform: string;
//   accountType: string;
//   transactionType: string;
//   paymentIdPart: string;
//   timestamp: string;
// } | null {
//   const parts = reference.split('-');
  
//   if (parts.length !== 5 || parts[0] !== 'NEWCONDO') {
//     return null;
//   }
  
//   return {
//     platform: parts[0],
//     accountType: parts[1],
//     transactionType: parts[2],
//     paymentIdPart: parts[3],
//     timestamp: parts[4],
//   };
// }

// /**
//  * Get virtual account holder type from user role
//  */
// export function getAccountHolderType(role: string): VirtualAccountType {
//   switch (role.toUpperCase()) {
//     case 'OWNER':
//       return 'PROPERTY_OWNER';
    
//     case 'AGENT':
//       return 'LISTING_AGENT';
    
//     case 'ADMIN':
//       return 'PLATFORM';
    
//     default:
//       return 'PROPERTY_OWNER';
//   }
// }

// /**
//  * Determine which virtual account should hold payment
//  */
// export function determinePaymentHoldingAccount(params: {
//   propertyOwnerId: string;
//   listingAgentId?: string;
//   isOwnerListing: boolean;
// }): { accountOwnerId: string; accountType: VirtualAccountType } {
//   const { propertyOwnerId, listingAgentId, isOwnerListing } = params;
  
//   // If property is listed by agent, hold in agent's account
//   if (!isOwnerListing && listingAgentId) {
//     return {
//       accountOwnerId: listingAgentId,
//       accountType: 'LISTING_AGENT',
//     };
//   }
  
//   // Otherwise hold in property owner's account
//   return {
//     accountOwnerId: propertyOwnerId,
//     accountType: 'PROPERTY_OWNER',
//   };
// }

// /**
//  * Calculate total amount to be held in virtual account
//  */
// export function calculateHoldAmount(params: {
//   rentAmount: Decimal | number;
//   serviceFee: Decimal | number;
// }): Decimal {
//   const rent = typeof params.rentAmount === 'number' 
//     ? new Decimal(params.rentAmount) 
//     : params.rentAmount;
  
//   const fee = typeof params.serviceFee === 'number' 
//     ? new Decimal(params.serviceFee) 
//     : params.serviceFee;
  
//   // Total amount includes rent + service fee
//   return rent.add(fee).toDecimalPlaces(2);
// }

// /**
//  * Validate virtual account transaction
//  */
// export function validateVirtualAccountTransaction(params: {
//   accountId: string;
//   amount: Decimal | number;
//   transactionType: 'CREDIT' | 'DEBIT';
//   currentBalance: Decimal | number;
// }): { isValid: boolean; errors: string[] } {
//   const errors: string[] = [];
//   const { accountId, amount, transactionType, currentBalance } = params;
  
//   if (!accountId) {
//     errors.push('Account ID is required');
//   }
  
//   const amountDecimal = typeof amount === 'number' ? new Decimal(amount) : amount;
  
//   if (amountDecimal.lessThanOrEqualTo(0)) {
//     errors.push('Transaction amount must be greater than zero');
//   }
  
//   if (transactionType === 'DEBIT') {
//     const { sufficient, shortfall } = hasSufficientBalance(currentBalance, amount);
//     if (!sufficient) {
//       errors.push(`Insufficient balance. Shortfall: NGN ${shortfall?.toFixed(2)}`);
//     }
//   }
  
//   return {
//     isValid: errors.length === 0,
//     errors,
//   };
// }

// /**
//  * Format currency amount for display
//  */
// export function formatCurrency(
//   amount: Decimal | number,
//   currency: string = 'NGN'
// ): string {
//   const amountNum = typeof amount === 'number' ? amount : amount.toNumber();
  
//   return new Intl.NumberFormat('en-NG', {
//     style: 'currency',
//     currency: currency,
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   }).format(amountNum);
// }