import { PaymentType, PaymentStatus } from '@newcondo/db';
import {
  BasePayment,
  PaymentError,
  ReceiptData,
  PaymentEventPayload,
  TransactionFilter,
} from '../types/payment';

/**
 * Payment validation utilities
 */
export class PaymentValidator {
  static validateAmount(amount: number, currency: string = 'NGN'): boolean {
    if (typeof amount !== 'number' || amount <= 0) return false;
    
    const minimumAmounts: Record<string, number> = {
      'NGN': 100,
      'USD': 1,
      'GBP': 1,
      'EUR': 1,
    };

    return amount >= (minimumAmounts[currency] || 100);
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePhoneNumber(phone: string): boolean {
    // Nigerian phone number validation
    const phoneRegex = /^(\+234|234|0)?[789][01]\d{8}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  }

  static validateCurrency(currency: string): boolean {
    const supportedCurrencies = ['NGN', 'USD', 'GBP', 'EUR'];
    return supportedCurrencies.includes(currency);
  }

  static validatePaymentType(paymentType: string): boolean {
    return Object.values(PaymentType).includes(paymentType as PaymentType);
  }
}

/**
 * Payment status utilities
 */
export class PaymentStatusManager {
  private static readonly TERMINAL_STATUSES: PaymentStatus[] = [
    PaymentStatus.SUCCESS,
    PaymentStatus.FAILED,
    PaymentStatus.CANCELLED,
    PaymentStatus.REFUNDED,
  ];

  private static readonly PROCESSING_STATUSES: PaymentStatus[] = [
    PaymentStatus.PENDING,
    PaymentStatus.HELD,
  ];

  static isTerminal(status: PaymentStatus): boolean {
    return this.TERMINAL_STATUSES.includes(status);
  }

  static isProcessing(status: PaymentStatus): boolean {
    return this.PROCESSING_STATUSES.includes(status);
  }

  static canTransitionTo(from: PaymentStatus, to: PaymentStatus): boolean {
    if (this.isTerminal(from)) return false;

    const allowedTransitions: Record<PaymentStatus, PaymentStatus[]> = {
      [PaymentStatus.PENDING]: [PaymentStatus.SUCCESS, PaymentStatus.FAILED, PaymentStatus.CANCELLED, PaymentStatus.HELD],
      [PaymentStatus.HELD]: [PaymentStatus.SUCCESS, PaymentStatus.FAILED, PaymentStatus.REFUNDED, PaymentStatus.RELEASED],
      [PaymentStatus.SUCCESS]: [PaymentStatus.REFUNDED],
      [PaymentStatus.FAILED]: [],
      [PaymentStatus.CANCELLED]: [],
      [PaymentStatus.REFUNDED]: [],
      [PaymentStatus.RELEASED]: [PaymentStatus.REFUNDED],
    };

    return allowedTransitions[from]?.includes(to) ?? false;
  }
}

/**
 * Payment formatting and helper utilities
 */
export class PaymentUtils {
  static formatAmount(amount: number, currency: string = 'NGN'): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  static generateReceiptNumber(prefix: string = 'NC'): string {
    const now = new Date();
    const timestamp = now.getTime().toString().slice(-8); // Last 8 digits of timestamp
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${now.getFullYear()}${now.getMonth() + 1}${now.getDate()}-${timestamp}-${random}`;
  }

  static generateTransactionRef(userId: string, type: PaymentType): string {
    const timestamp = Date.now().toString();
    const sanitizedUserId = userId.replace(/[^a-zA-Z0-9]/g, '').slice(-8);
    const typePrefix = type.slice(0, 3).toUpperCase();
    return `${typePrefix}-${sanitizedUserId}-${timestamp}`;
  }
}