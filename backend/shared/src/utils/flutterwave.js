"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPaymentMethodSupported = exports.getSupportedBanks = exports.validateWebhookPayload = exports.generatePaymentMetadata = exports.calculateFees = exports.validateAmount = exports.mapFlutterwaveStatus = exports.retryWithBackoff = exports.processRefund = exports.createVirtualAccount = exports.verifyTransaction = exports.initializePayment = exports.verifyWebhookSignature = exports.decryptPaymentData = exports.encryptPaymentData = exports.generateTxRef = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const flutterwave_1 = require("../config/flutterwave");
const payment_1 = require("../types/payment");
// Create axios instance with default config
const flutterwaveApi = axios_1.default.create({
    baseURL: flutterwave_1.flutterwaveConfig.FLUTTERWAVE_BASE_URL,
    timeout: flutterwave_1.PAYMENT_CONFIG.TIMEOUT,
    headers: (0, flutterwave_1.getFlutterwaveHeaders)(),
});
// Add request interceptor for logging
flutterwaveApi.interceptors.request.use((config) => {
    console.log(`[Flutterwave] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
}, (error) => {
    console.error('[Flutterwave] Request error:', error);
    return Promise.reject(error);
});
// Add response interceptor for error handling
flutterwaveApi.interceptors.response.use((response) => {
    console.log(`[Flutterwave] Response status: ${response.status}`);
    return response;
}, (error) => {
    console.error('[Flutterwave] Response error:', error.response?.data || error.message);
    return Promise.reject(error);
});
/**
 * Generate unique transaction reference
 */
const generateTxRef = (prefix = 'newcondo') => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`;
};
exports.generateTxRef = generateTxRef;
/**
 * Encrypt payment data using Flutterwave encryption key
 */
const encryptPaymentData = (data) => {
    const secretKey = flutterwave_1.flutterwaveConfig.FLUTTERWAVE_ENCRYPTION_KEY;
    const cipher = crypto_1.default.createCipheriv('des-ede3-ecb', secretKey, Buffer.alloc(0));
    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
};
exports.encryptPaymentData = encryptPaymentData;
/**
 * Decrypt payment data
 */
const decryptPaymentData = (encryptedData) => {
    const secretKey = flutterwave_1.flutterwaveConfig.FLUTTERWAVE_ENCRYPTION_KEY;
    const decipher = crypto_1.default.createDecipheriv('des-ede3-ecb', secretKey, Buffer.alloc(0));
    let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};
exports.decryptPaymentData = decryptPaymentData;
/**
 * Verify webhook signature
 */
const verifyWebhookSignature = (payload, signature) => {
    const expectedSignature = crypto_1.default
        .createHmac('sha256', flutterwave_1.flutterwaveConfig.FLUTTERWAVE_WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');
    return crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
};
exports.verifyWebhookSignature = verifyWebhookSignature;
/**
 * Initialize payment with Flutterwave
 */
const initializePayment = async (paymentData) => {
    try {
        const response = await flutterwaveApi.post(flutterwave_1.FLUTTERWAVE_ENDPOINTS.INITIATE_PAYMENT, paymentData);
        if (response.data.status !== 'success') {
            throw new Error(response.data.message || 'Payment initialization failed');
        }
        return response.data;
    }
    catch (error) {
        console.error('[Flutterwave] Payment initialization error:', error);
        throw new payment_1.FlutterwaveError({
            error: true,
            message: error.response?.data?.message || error.message || 'Payment initialization failed',
            code: error.response?.data?.code,
            data: error.response?.data,
        });
    }
};
exports.initializePayment = initializePayment;
/**
 * Verify transaction with Flutterwave
 */
const verifyTransaction = async (transactionId) => {
    try {
        const endpoint = flutterwave_1.FLUTTERWAVE_ENDPOINTS.VERIFY_TRANSACTION.replace('{id}', transactionId);
        const response = await flutterwaveApi.get(endpoint);
        if (response.data.status !== 'success') {
            throw new Error(response.data.message || 'Transaction verification failed');
        }
        return response.data;
    }
    catch (error) {
        console.error('[Flutterwave] Transaction verification error:', error);
        throw new payment_1.FlutterwaveError({
            error: true,
            message: error.response?.data?.message || error.message || 'Transaction verification failed',
            code: error.response?.data?.code,
            data: error.response?.data,
        });
    }
};
exports.verifyTransaction = verifyTransaction;
/**
 * Create virtual account
 */
const createVirtualAccount = async (accountData) => {
    try {
        const response = await flutterwaveApi.post(flutterwave_1.FLUTTERWAVE_ENDPOINTS.CREATE_VIRTUAL_ACCOUNT, accountData);
        if (response.data.status !== 'success') {
            throw new Error(response.data.message || 'Virtual account creation failed');
        }
        return response.data;
    }
    catch (error) {
        console.error('[Flutterwave] Virtual account creation error:', error);
        throw new payment_1.FlutterwaveError({
            error: true,
            message: error.response?.data?.message || error.message || 'Virtual account creation failed',
            code: error.response?.data?.code,
            data: error.response?.data,
        });
    }
};
exports.createVirtualAccount = createVirtualAccount;
/**
 * Process refund
 */
const processRefund = async (transactionId, refundData) => {
    try {
        const endpoint = flutterwave_1.FLUTTERWAVE_ENDPOINTS.REFUND_TRANSACTION.replace('{id}', transactionId);
        const response = await flutterwaveApi.post(endpoint, refundData);
        if (response.data.status !== 'success') {
            throw new Error(response.data.message || 'Refund processing failed');
        }
        return response.data;
    }
    catch (error) {
        console.error('[Flutterwave] Refund processing error:', error);
        throw new payment_1.FlutterwaveError({
            error: true,
            message: error.response?.data?.message || error.message || 'Refund processing failed',
            code: error.response?.data?.code,
            data: error.response?.data,
        });
    }
};
exports.processRefund = processRefund;
/**
 * Retry mechanism with exponential backoff
 */
const retryWithBackoff = async (fn, maxRetries = 3, initialDelay = 1000) => {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            if (attempt === maxRetries) {
                break;
            }
            // Don't retry for certain errors
            if (error.response?.status === 400 || error.response?.status === 401) {
                throw error;
            }
            const delay = initialDelay * Math.pow(2, attempt);
            console.log(`[Flutterwave] Retry attempt ${attempt + 1} after ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw lastError;
};
exports.retryWithBackoff = retryWithBackoff;
/**
 * Get payment status from Flutterwave status
 */
const mapFlutterwaveStatus = (flutterwaveStatus) => {
    const statusMap = {
        'pending': 'PENDING',
        'successful': 'SUCCESS',
        'failed': 'FAILED',
        'cancelled': 'CANCELLED',
        'abandoned': 'FAILED',
    };
    return statusMap[flutterwaveStatus.toLowerCase()] || 'PENDING';
};
exports.mapFlutterwaveStatus = mapFlutterwaveStatus;
/**
 * Validate payment amount
 */
const validateAmount = (amount, currency = 'NGN') => {
    if (amount <= 0)
        return false;
    // Minimum amounts by currency
    const minimumAmounts = {
        'NGN': 100, // 1 NGN
        'USD': 1, // 1 USD
        'GBP': 1, // 1 GBP
        'EUR': 1, // 1 EUR
    };
    const minimum = minimumAmounts[currency] || 100;
    return amount >= minimum;
};
exports.validateAmount = validateAmount;
/**
 * Format amount for display
 */
const formatAmount = (amount, currency = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};
/**
 * Calculate fees
 */
const calculateFees = (amount, currency = 'NGN') => {
    let fee = 0;
    if (currency === 'NGN') {
        // Flutterwave NGN fees (as of 2024)
        if (amount <= 2500) {
            fee = amount * 0.014; // 1.4%
        }
        else {
            fee = Math.min(amount * 0.014, 2000); // 1.4% capped at ₦2000
        }
    }
    else {
        // International fees (approximate)
        fee = amount * 0.039; // 3.9%
    }
    return {
        amount,
        fee: Math.round(fee * 100) / 100, // Round to 2 decimal places
        total: Math.round((amount + fee) * 100) / 100,
    };
};
exports.calculateFees = calculateFees;
/**
 * Generate payment metadata
 */
const generatePaymentMetadata = (data) => {
    return {
        ...data,
        platform: 'newcondo',
        timestamp: new Date().toISOString(),
        version: '1.0',
    };
};
exports.generatePaymentMetadata = generatePaymentMetadata;
/**
 * Validate webhook payload
 */
const validateWebhookPayload = (payload) => {
    return (payload &&
        typeof payload.event === 'string' &&
        payload.data &&
        typeof payload.data.id === 'number' &&
        typeof payload.data.tx_ref === 'string' &&
        typeof payload.data.status === 'string');
};
exports.validateWebhookPayload = validateWebhookPayload;
/**
 * Get supported banks
 */
const getSupportedBanks = async (country = 'NG') => {
    try {
        const response = await flutterwaveApi.get(`${flutterwave_1.FLUTTERWAVE_ENDPOINTS.BANKS}/${country}`);
        return response.data.data || [];
    }
    catch (error) {
        console.error('[Flutterwave] Error fetching banks:', error);
        return [];
    }
};
exports.getSupportedBanks = getSupportedBanks;
/**
 * Check if payment method is supported
 */
const isPaymentMethodSupported = (method, currency = 'NGN') => {
    const supportedMethods = {
        'NGN': ['card', 'banktransfer', 'ussd', 'account', 'mobilemoneyghana'],
        'USD': ['card', 'banktransfer'],
        'GBP': ['card', 'banktransfer'],
        'EUR': ['card', 'banktransfer'],
    };
    return supportedMethods[currency]?.includes(method) || false;
};
exports.isPaymentMethodSupported = isPaymentMethodSupported;
exports.default = {
    initializePayment: exports.initializePayment,
    verifyTransaction: exports.verifyTransaction,
    createVirtualAccount: exports.createVirtualAccount,
    processRefund: exports.processRefund,
    retryWithBackoff: exports.retryWithBackoff,
    generateTxRef: exports.generateTxRef,
    encryptPaymentData: exports.encryptPaymentData,
    decryptPaymentData: exports.decryptPaymentData,
    verifyWebhookSignature: exports.verifyWebhookSignature,
    mapFlutterwaveStatus: exports.mapFlutterwaveStatus,
    validateAmount: exports.validateAmount,
    formatAmount,
    calculateFees: exports.calculateFees,
    generatePaymentMetadata: exports.generatePaymentMetadata,
    validateWebhookPayload: exports.validateWebhookPayload,
    getSupportedBanks: exports.getSupportedBanks,
    isPaymentMethodSupported: exports.isPaymentMethodSupported,
};
//# sourceMappingURL=flutterwave.js.map