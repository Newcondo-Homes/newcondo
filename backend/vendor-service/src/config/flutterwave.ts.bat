// backend/payment-service/src/config/flutterwave.ts

export interface FlutterwaveConfig {
  publicKey: string;
  secretKey: string;
  encryptionKey: string;
  baseUrl: string;
  webhookSecretHash: string;
  environment: 'sandbox' | 'production';
}

export const flutterwaveConfig: FlutterwaveConfig = {
  publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY || '',
  secretKey: process.env.FLUTTERWAVE_SECRET_KEY || '',
  encryptionKey: process.env.FLUTTERWAVE_ENCRYPTION_KEY || '',
  baseUrl: process.env.FLUTTERWAVE_ENV === 'production' 
    ? 'https://api.flutterwave.com/v3' 
    : 'https://api.flutterwave.com/v3',
  webhookSecretHash: process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH || '',
  environment: (process.env.FLUTTERWAVE_ENV as 'sandbox' | 'production') || 'sandbox'
};

// Validate configuration on startup
export const validateFlutterwaveConfig = (): void => {
  const requiredFields: (keyof FlutterwaveConfig)[] = [
    'publicKey',
    'secretKey',
    'encryptionKey',
    'webhookSecretHash'
  ];

  const missingFields = requiredFields.filter(
    field => !flutterwaveConfig[field]
  );

  if (missingFields.length > 0) {
    throw new Error(
      `Missing required Flutterwave configuration: ${missingFields.join(', ')}`
    );
  }
};

// Payment limits and constraints
export const PAYMENT_LIMITS = {
  MIN_AMOUNT: 100, // 1 NGN minimum
  MAX_AMOUNT: 500000000, // 5M NGN maximum
  SUPPORTED_CURRENCIES: ['NGN', 'USD', 'GBP', 'EUR'],
  DEFAULT_CURRENCY: 'NGN'
} as const;

// Payment timeout settings
export const PAYMENT_TIMEOUTS = {
  PAYMENT_LOCK_DURATION: 30 * 60 * 1000, // 30 minutes
  CONFIRMATION_PERIOD: 7 * 24 * 60 * 60 * 1000, // 7 days
  WEBHOOK_TIMEOUT: 30 * 1000, // 30 seconds
  API_TIMEOUT: 60 * 1000 // 1 minute
} as const;