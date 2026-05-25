"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentUtils = exports.PaymentStatusManager = exports.PaymentValidator = void 0;
const db_1 = require("@newcondo/db");
// import {
//   BasePayment,
//   PaymentError,
//   ReceiptData,
//   PaymentEventPayload,
//   TransactionFilter,
// } from '../types/payment';
/**
 * Payment validation utilities
 */
class PaymentValidator {
    static validateAmount(amount, currency = 'NGN') {
        if (typeof amount !== 'number' || amount <= 0)
            return false;
        const minimumAmounts = {
            'NGN': 100,
            'USD': 1,
            'GBP': 1,
            'EUR': 1,
        };
        return amount >= (minimumAmounts[currency] || 100);
    }
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    static validatePhoneNumber(phone) {
        // Nigerian phone number validation
        const phoneRegex = /^(\+234|234|0)?[789][01]\d{8}$/;
        return phoneRegex.test(phone.replace(/\s+/g, ''));
    }
    static validateCurrency(currency) {
        const supportedCurrencies = ['NGN', 'USD', 'GBP', 'EUR'];
        return supportedCurrencies.includes(currency);
    }
    static validatePaymentType(paymentType) {
        return Object.values(db_1.PaymentType).includes(paymentType);
    }
}
exports.PaymentValidator = PaymentValidator;
/**
 * Payment status utilities
 */
class PaymentStatusManager {
    static isTerminal(status) {
        return this.TERMINAL_STATUSES.includes(status);
    }
    static isProcessing(status) {
        return this.PROCESSING_STATUSES.includes(status);
    }
    static canTransitionTo(from, to) {
        if (this.isTerminal(from))
            return false;
        const allowedTransitions = {
            [db_1.PaymentStatus.PENDING]: [db_1.PaymentStatus.SUCCESS, db_1.PaymentStatus.FAILED, db_1.PaymentStatus.CANCELLED, db_1.PaymentStatus.HELD],
            [db_1.PaymentStatus.HELD]: [db_1.PaymentStatus.SUCCESS, db_1.PaymentStatus.FAILED, db_1.PaymentStatus.REFUNDED, db_1.PaymentStatus.RELEASED],
            [db_1.PaymentStatus.SUCCESS]: [db_1.PaymentStatus.REFUNDED],
            [db_1.PaymentStatus.FAILED]: [],
            [db_1.PaymentStatus.CANCELLED]: [],
            [db_1.PaymentStatus.REFUNDED]: [],
            [db_1.PaymentStatus.RELEASED]: [db_1.PaymentStatus.REFUNDED],
        };
        return allowedTransitions[from]?.includes(to) ?? false;
    }
}
exports.PaymentStatusManager = PaymentStatusManager;
PaymentStatusManager.TERMINAL_STATUSES = [
    db_1.PaymentStatus.SUCCESS,
    db_1.PaymentStatus.FAILED,
    db_1.PaymentStatus.CANCELLED,
    db_1.PaymentStatus.REFUNDED,
];
PaymentStatusManager.PROCESSING_STATUSES = [
    db_1.PaymentStatus.PENDING,
    db_1.PaymentStatus.HELD,
];
/**
 * Payment formatting and helper utilities
 */
class PaymentUtils {
    static formatAmount(amount, currency = 'NGN') {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    }
    static generateReceiptNumber(prefix = 'NC') {
        const now = new Date();
        const timestamp = now.getTime().toString().slice(-8); // Last 8 digits of timestamp
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `${prefix}-${now.getFullYear()}${now.getMonth() + 1}${now.getDate()}-${timestamp}-${random}`;
    }
    static generateTransactionRef(userId, type) {
        const timestamp = Date.now().toString();
        const sanitizedUserId = userId.replace(/[^a-zA-Z0-9]/g, '').slice(-8);
        const typePrefix = type.slice(0, 3).toUpperCase();
        return `${typePrefix}-${sanitizedUserId}-${timestamp}`;
    }
}
exports.PaymentUtils = PaymentUtils;
//# sourceMappingURL=payment.js.map