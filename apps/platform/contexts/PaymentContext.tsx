// apps/platform/lib/constants/paymentErrors.ts
// TODO: what is paymentcontext or context used for?

export const PAYMENT_ERROR_CODES = {
  // Flutterwave specific errors
  INSUFFICIENT_FUNDS: 'insufficient_funds',
  INVALID_CARD: 'invalid_card',
  CARD_EXPIRED: 'card_expired',
  INCORRECT_PIN: 'incorrect_pin',
  TRANSACTION_DECLINED: 'transaction_declined',
  NETWORK_ERROR: 'network_error',
  GATEWAY_TIMEOUT: 'gateway_timeout',
  
  // Bank transfer errors
  BANK_UNAVAILABLE: 'bank_unavailable',
  TRANSFER_LIMIT_EXCEEDED: 'transfer_limit_exceeded',
  INVALID_ACCOUNT: 'invalid_account',
  
  // General payment errors
  PAYMENT_ALREADY_PROCESSED: 'payment_already_processed',
  PROPERTY_NOT_AVAILABLE: 'property_not_available',
  PAYMENT_EXPIRED: 'payment_expired',
  INVALID_AMOUNT: 'invalid_amount',
  USER_NOT_VERIFIED: 'user_not_verified',
  
  // System errors
  SERVER_ERROR: 'server_error',
  DATABASE_ERROR: 'database_error',
  THIRD_PARTY_ERROR: 'third_party_error',
  VALIDATION_ERROR: 'validation_error',
  
  // Retry errors
  MAX_RETRIES_EXCEEDED: 'max_retries_exceeded',
  RETRY_TIMEOUT: 'retry_timeout',
} as const;

export const PAYMENT_ERROR_MESSAGES = {
  [PAYMENT_ERROR_CODES.INSUFFICIENT_FUNDS]: {
    title: 'Insufficient Funds',
    message: 'Your account does not have enough funds to complete this transaction. Please top up your account and try again.',
    action: 'Try Different Card',
    severity: 'error' as const,
  },
  
  [PAYMENT_ERROR_CODES.INVALID_CARD]: {
    title: 'Invalid Card Details',
    message: 'The card details you entered are invalid. Please check your card number, expiry date, and CVV.',
    action: 'Update Card Details',
    severity: 'error' as const,
  },
  
  [PAYMENT_ERROR_CODES.CARD_EXPIRED]: {
    title: 'Card Expired',
    message: 'Your card has expired. Please use a different card or update your card details.',
    action: 'Use Different Card',
    severity: 'error' as const,
  },
  
  [PAYMENT_ERROR_CODES.INCORRECT_PIN]: {
    title: 'Incorrect PIN',
    message: 'The PIN you entered is incorrect. Please try again with the correct PIN.',
    action: 'Retry Payment',
    severity: 'warning' as const,
  },
  
  [PAYMENT_ERROR_CODES.TRANSACTION_DECLINED]: {
    title: 'Transaction Declined',
    message: 'Your bank has declined this transaction. Please contact your bank or try a different payment method.',
    action: 'Contact Bank',
    severity: 'error' as const,
  },
  
  [PAYMENT_ERROR_CODES.NETWORK_ERROR]: {
    title: 'Network Error',
    message: 'There was a network error while processing your payment. Please check your connection and try again.',
    action: 'Retry Payment',
    severity: 'warning' as const,
  },
  
  [PAYMENT_ERROR_CODES.GATEWAY_TIMEOUT]: {
    title: 'Payment Gateway Timeout',
    message: 'The payment gateway timed out. Your payment may still be processing. Please wait before trying again.',
    action: 'Check Status',
    severity: 'warning' as const,
  },
  
  [PAYMENT_ERROR_CODES.BANK_UNAVAILABLE]: {
    title: 'Bank Service Unavailable',
    message: 'Your bank\'s service is currently unavailable. Please try again later or use a different payment method.',
    action: 'Try Later',
    severity: 'warning' as const,
  },
  
  [PAYMENT_ERROR_CODES.TRANSFER_LIMIT_EXCEEDED]: {
    title: 'Transfer Limit Exceeded',
    message: 'You have exceeded your daily transfer limit. Please try again tomorrow or contact your bank.',
    action: 'Contact Bank',
    severity: 'error' as const,
  },
  
  [PAYMENT_ERROR_CODES.INVALID_ACCOUNT]: {
    title: 'Invalid Account',
    message: 'The account details provided are invalid. Please check and try again.',
    action: 'Update Account',
    severity: 'error' as const,
  },
  
  [PAYMENT_ERROR_CODES.PAYMENT_ALREADY_PROCESSED]: {
    title: 'Payment Already Processed',
    message: 'This payment has already been processed. Please check your payment history.',
    action: 'View History',
    severity: 'info' as const,
  },
  
  [PAYMENT_ERROR_CODES.PROPERTY_NOT_AVAILABLE]: {
    title: 'Property Not Available',
    message: 'This property is no longer available for rent. Please browse other properties.',
    action: 'Browse Properties',
    severity: 'error' as const,
  },
  
  [PAYMENT_ERROR_CODES.PAYMENT_EXPIRED]: {
    title: 'Payment Session Expired',
    message: 'Your payment session has expired. Please start the payment process again.',
    action: 'Restart Payment',
    severity: 'warning' as const,
  },
  
  [PAYMENT_ERROR_CODES.INVALID_AMOUNT]: {
    title: 'Invalid Amount',
    message: 'The payment amount is invalid. Please contact support if this issue persists.',
    action: 'Contact Support',
    severity: 'error' as const,
  },
  
  [PAYMENT_ERROR_CODES.USER_NOT_VERIFIED]: {
    title: 'Account Not Verified',
    message: 'Your account needs to be verified before you can make payments. Please complete the verification process.',
    action: 'Verify Account',
    severity: 'warning' as const,
  },
  
  [PAYMENT_ERROR_CODES.SERVER_ERROR]: {
    title: 'Server Error',
    message: 'There was an error on our servers. Please try again later or contact support.',
    action: 'Try Again',
    severity: 'error' as const,
  },
  
  [PAYMENT_ERROR_CODES.DATABASE_ERROR]: {
    title: 'Database Error',
    message: 'There was a database error while processing your request. Please try again later.',
    action: 'Try Again',
    severity: 'error' as const,
  },
  
  [PAYMENT_ERROR_CODES.THIRD_PARTY_ERROR]: {
    title: 'Payment Service Error',
    message: 'There was an error with our payment service provider. Please try again later.',
    action: 'Try Again',
    severity: 'error' as const,
  },
  
  [PAYMENT_ERROR_CODES.VALIDATION_ERROR]: {
    title: 'Validation Error',
    message: 'There was a validation error with your payment details. Please check and try again.',
    action: 'Check Details',
    severity: 'error' as const,
  },
  
  [PAYMENT_ERROR_CODES.MAX_RETRIES_EXCEEDED]: {
    title: 'Maximum Retries Exceeded',
    message: 'You have exceeded the maximum number of retry attempts. Please try again after some time.',
    action: 'Wait and Retry',
    severity: 'error' as const,
  },
  
  [PAYMENT_ERROR_CODES.RETRY_TIMEOUT]: {
    title: 'Retry Timeout',
    message: 'The retry period has timed out. Please start the payment process again.',
    action: 'Start Over',
    severity: 'warning' as const,
  },
} as const;

// Payment status messages
export const PAYMENT_STATUS_MESSAGES = {
  PENDING: {
    title: 'Payment Pending',
    message: 'Your payment is being processed. This may take a few minutes.',
    color: 'yellow',
  },
  SUCCESS: {
    title: 'Payment Successful',
    message: 'Your payment has been processed successfully.',
    color: 'green',
  },
  FAILED: {
    title: 'Payment Failed',
    message: 'Your payment could not be processed. Please try again.',
    color: 'red',
  },
  CANCELLED: {
    title: 'Payment Cancelled',
    message: 'Your payment was cancelled. You can try again anytime.',
    color: 'gray',
  },
  REFUNDED: {
    title: 'Payment Refunded',
    message: 'Your payment has been refunded. It may take 3-5 business days to reflect.',
    color: 'blue',
  },
  HELD: {
    title: 'Payment On Hold',
    message: 'Your payment is on hold pending confirmation. You will be notified once confirmed.',
    color: 'orange',
  },
  RELEASED: {
    title: 'Payment Released',
    message: 'Your payment has been released to the property owner.',
    color: 'green',
  },
} as const;

// Retry configuration
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000, // 2 seconds
  BACKOFF_MULTIPLIER: 2, // Exponential backoff
  MAX_RETRY_DELAY: 30000, // 30 seconds max delay
  RETRY_TIMEOUT: 300000, // 5 minutes total timeout
} as const;

// Payment method specific errors
export const PAYMENT_METHOD_ERRORS = {
  CARD: [
    PAYMENT_ERROR_CODES.INVALID_CARD,
    PAYMENT_ERROR_CODES.CARD_EXPIRED,
    PAYMENT_ERROR_CODES.INSUFFICIENT_FUNDS,
    PAYMENT_ERROR_CODES.INCORRECT_PIN,
    PAYMENT_ERROR_CODES.TRANSACTION_DECLINED,
  ],
  BANK_TRANSFER: [
    PAYMENT_ERROR_CODES.BANK_UNAVAILABLE,
    PAYMENT_ERROR_CODES.TRANSFER_LIMIT_EXCEEDED,
    PAYMENT_ERROR_CODES.INVALID_ACCOUNT,
  ],
  USSD: [
    PAYMENT_ERROR_CODES.NETWORK_ERROR,
    PAYMENT_ERROR_CODES.GATEWAY_TIMEOUT,
  ],
} as const;

export type PaymentErrorCode = typeof PAYMENT_ERROR_CODES[keyof typeof PAYMENT_ERROR_CODES];
export type PaymentErrorMessage = typeof PAYMENT_ERROR_MESSAGES[PaymentErrorCode];
export type PaymentStatusMessage = typeof PAYMENT_STATUS_MESSAGES[keyof typeof PAYMENT_STATUS_MESSAGES];

// Helper function to get error message
export const getPaymentErrorMessage = (errorCode: string): PaymentErrorMessage => {
  const code = errorCode as PaymentErrorCode;
  return PAYMENT_ERROR_MESSAGES[code] || {
    title: 'Unknown Error',
    message: 'An unknown error occurred. Please try again or contact support.',
    action: 'Contact Support',
    severity: 'error' as const,
  };
};

// Helper function to check if error is retryable
export const isRetryableError = (errorCode: string): boolean => {
  const retryableErrors = [
    PAYMENT_ERROR_CODES.NETWORK_ERROR,
    PAYMENT_ERROR_CODES.GATEWAY_TIMEOUT,
    PAYMENT_ERROR_CODES.SERVER_ERROR,
    PAYMENT_ERROR_CODES.THIRD_PARTY_ERROR,
    PAYMENT_ERROR_CODES.INCORRECT_PIN,
  ];
  
  return retryableErrors.includes(errorCode as typeof retryableErrors[number]);
};

// Helper function to get retry delay
export const getRetryDelay = (attemptNumber: number): number => {
  const baseDelay = RETRY_CONFIG.RETRY_DELAY;
  const delay = baseDelay * Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, attemptNumber - 1);
  return Math.min(delay, RETRY_CONFIG.MAX_RETRY_DELAY);
};