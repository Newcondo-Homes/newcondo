import { z } from 'zod';

// Environment validation schema
const FlutterwaveConfigSchema = z.object({
  FLUTTERWAVE_PUBLIC_KEY: z.string().min(1, 'Flutterwave public key is required'),
  FLUTTERWAVE_SECRET_KEY: z.string().min(1, 'Flutterwave secret key is required'),
  FLUTTERWAVE_ENCRYPTION_KEY: z.string().min(1, 'Flutterwave encryption key is required'),
  FLUTTERWAVE_WEBHOOK_SECRET: z.string().min(1, 'Flutterwave webhook secret is required'),
  FLUTTERWAVE_BASE_URL: z.string().url().default('https://api.flutterwave.com/v3'),
  FRONTEND_URL: z.string().url(),
  WEBHOOK_URL: z.string().url(),
});

type FlutterwaveConfig = z.infer<typeof FlutterwaveConfigSchema>;

// Validate environment variables
const validateConfig = (): FlutterwaveConfig => {
  try {
    return FlutterwaveConfigSchema.parse({
      FLUTTERWAVE_PUBLIC_KEY: process.env.FLUTTERWAVE_PUBLIC_KEY,
      FLUTTERWAVE_SECRET_KEY: process.env.FLUTTERWAVE_SECRET_KEY,
      FLUTTERWAVE_ENCRYPTION_KEY: process.env.FLUTTERWAVE_ENCRYPTION_KEY,
      FLUTTERWAVE_WEBHOOK_SECRET: process.env.FLUTTERWAVE_WEBHOOK_SECRET,
      FLUTTERWAVE_BASE_URL: process.env.FLUTTERWAVE_BASE_URL,
      FRONTEND_URL: process.env.FRONTEND_URL,
      WEBHOOK_URL: process.env.WEBHOOK_URL,
    });
  } catch (error) {
    console.error('Flutterwave configuration validation failed:', error);
    throw new Error('Invalid Flutterwave configuration');
  }
};

// Export validated configuration
export const flutterwaveConfig = validateConfig();

// Flutterwave API endpoints
export const FLUTTERWAVE_ENDPOINTS = {
  INITIATE_PAYMENT: '/payments',
  VERIFY_TRANSACTION: '/transactions/{id}/verify',
  REFUND_TRANSACTION: '/transactions/{id}/refund',
  CREATE_VIRTUAL_ACCOUNT: '/virtual-account-numbers',
  LIST_TRANSACTIONS: '/transactions',
  WEBHOOK_VERIFY: '/webhooks/verify',
  BANKS: '/banks',
  TRANSFER: '/transfers',
} as const;

// Payment configuration constants
export const PAYMENT_CONFIG = {
  CURRENCY: 'NGN',
  REDIRECT_URL: `${flutterwaveConfig.FRONTEND_URL}/payments/callback`,
  WEBHOOK_URL: `${flutterwaveConfig.WEBHOOK_URL}/api/webhooks/flutterwave`,
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// Virtual account configuration
export const VIRTUAL_ACCOUNT_CONFIG = {
  PROVIDER: 'wema-bank',
  FREQUENCY: 1, // One-time virtual account
  DURATION: 365, // 365 days validity
  IS_PERMANENT: true,
} as const;

// Payment status mapping
export const FLUTTERWAVE_STATUS_MAP = {
  'pending': 'PENDING',
  'successful': 'SUCCESS',
  'failed': 'FAILED',
  'cancelled': 'CANCELLED',
  'abandoned': 'FAILED',
} as const;

// Error codes
export const FLUTTERWAVE_ERROR_CODES = {
  INSUFFICIENT_FUNDS: 'RR-19',
  TRANSACTION_NOT_FOUND: 'RR-50',
  INVALID_CARD: 'RR-30',
  EXPIRED_CARD: 'RR-31',
  DECLINED_BY_BANK: 'RR-32',
  NETWORK_ERROR: 'RR-99',
} as const;

// Headers for API requests
export const getFlutterwaveHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${flutterwaveConfig.FLUTTERWAVE_SECRET_KEY}`,
});

// Test mode check
export const isTestMode = () => {
  return flutterwaveConfig.FLUTTERWAVE_PUBLIC_KEY.startsWith('FLWPUBK_TEST');
};

export default flutterwaveConfig;