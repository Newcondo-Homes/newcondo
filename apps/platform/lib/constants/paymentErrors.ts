// apps/platform/lib/constants/paymentErrors.ts

export const PAYMENT_ERROR_CODES = {
  // General & Client-side errors
  VALIDATION_ERROR: 'PAYMENT_001',
  NETWORK_ERROR: 'PAYMENT_002',
  UNSUPPORTED_METHOD: 'PAYMENT_003',
  PAYMENT_INTENT_NOT_FOUND: 'PAYMENT_004',
  PAYMENT_ALREADY_SUCCEEDED: 'PAYMENT_005',
  PAYMENT_CANCELLED: 'PAYMENT_006',
  
  // Provider-specific errors (e.g., Stripe, Flutterwave)
  PROVIDER_DECLINED: 'PAYMENT_101', // Card declined, insufficient funds, etc.
  PROVIDER_AUTHENTICATION_FAILED: 'PAYMENT_102', // 3D Secure failure
  PROVIDER_INSUFFICIENT_FUNDS: 'PAYMENT_103',
  PROVIDER_CARD_EXPIRED: 'PAYMENT_104',
  PROVIDER_CVC_INCORRECT: 'PAYMENT_105',
  PROVIDER_LOST_CARD: 'PAYMENT_106',
  PROVIDER_STOLEN_CARD: 'PAYMENT_107',
  PROVIDER_SUSPECTED_FRAUD: 'PAYMENT_108',
  PROVIDER_RATE_LIMIT_EXCEEDED: 'PAYMENT_109',
  
  // Backend/API errors
  SERVER_ERROR: 'PAYMENT_500',
  PROVIDER_API_ERROR: 'PAYMENT_501',
  ACCOUNT_CREATION_FAILED: 'PAYMENT_502',
  
  // User errors
  USER_ACTION_REQUIRED: 'PAYMENT_601',
};

export const PAYMENT_ERROR_MESSAGES: Record<string, { title: string; message: string }> = {
  // General
  [PAYMENT_ERROR_CODES.VALIDATION_ERROR]: {
    title: 'Invalid Input',
    message: 'The payment details provided are not valid. Please check and try again.',
  },
  [PAYMENT_ERROR_CODES.NETWORK_ERROR]: {
    title: 'Network Error',
    message: 'Could not connect to the payment service. Please check your internet connection.',
  },
  [PAYMENT_ERROR_CODES.UNSUPPORTED_METHOD]: {
    title: 'Unsupported Method',
    message: 'The selected payment method is not supported at this time.',
  },
  [PAYMENT_ERROR_CODES.PAYMENT_INTENT_NOT_FOUND]: {
    title: 'Payment Not Found',
    message: 'The payment session has expired or could not be found. Please start a new payment.',
  },
  [PAYMENT_ERROR_CODES.PAYMENT_ALREADY_SUCCEEDED]: {
    title: 'Payment Already Processed',
    message: 'This payment has already been successfully completed.',
  },
  [PAYMENT_ERROR_CODES.PAYMENT_CANCELLED]: {
    title: 'Payment Cancelled',
    message: 'The payment was cancelled by the user.',
  },
  
  // Provider
  [PAYMENT_ERROR_CODES.PROVIDER_DECLINED]: {
    title: 'Payment Declined',
    message: 'Your payment was declined by the bank. Please try a different card or method.',
  },
  [PAYMENT_ERROR_CODES.PROVIDER_AUTHENTICATION_FAILED]: {
    title: 'Authentication Failed',
    message: 'Your bank could not verify your identity. Please try again or use a different method.',
  },
  [PAYMENT_ERROR_CODES.PROVIDER_INSUFFICIENT_FUNDS]: {
    title: 'Insufficient Funds',
    message: 'Your card has insufficient funds to complete this transaction.',
  },
  [PAYMENT_ERROR_CODES.PROVIDER_CARD_EXPIRED]: {
    title: 'Card Expired',
    message: 'The card you are using has expired. Please update your card details.',
  },
  [PAYMENT_ERROR_CODES.PROVIDER_CVC_INCORRECT]: {
    title: 'CVC Incorrect',
    message: 'The CVC code you entered is incorrect. Please check the back of your card.',
  },
  [PAYMENT_ERROR_CODES.PROVIDER_LOST_CARD]: {
    title: 'Lost Card',
    message: 'The card has been reported as lost. Please contact your bank.',
  },
  [PAYMENT_ERROR_CODES.PROVIDER_STOLEN_CARD]: {
    title: 'Stolen Card',
    message: 'The card has been reported as stolen. Please contact your bank.',
  },
  [PAYMENT_ERROR_CODES.PROVIDER_SUSPECTED_FRAUD]: {
    title: 'Fraud Alert',
    message: 'This transaction has been flagged as suspicious. Please contact your bank.',
  },
  [PAYMENT_ERROR_CODES.PROVIDER_RATE_LIMIT_EXCEEDED]: {
    title: 'Too Many Attempts',
    message: 'You have made too many payment attempts. Please try again later.',
  },
  
  // Backend/API
  [PAYMENT_ERROR_CODES.SERVER_ERROR]: {
    title: 'Internal Server Error',
    message: 'An unexpected error occurred on our end. Please try again shortly.',
  },
  [PAYMENT_ERROR_CODES.PROVIDER_API_ERROR]: {
    title: 'Payment Provider Error',
    message: 'An error occurred with our payment provider. We are investigating this issue.',
  },
  [PAYMENT_ERROR_CODES.ACCOUNT_CREATION_FAILED]: {
    title: 'Account Creation Failed',
    message: 'We were unable to create the virtual account at this time. Please try again.',
  },

  // User errors
  [PAYMENT_ERROR_CODES.USER_ACTION_REQUIRED]: {
    title: 'Action Required',
    message: 'Please complete the required authentication step to finalize your payment.',
  },
};

export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  DELAY_INCREMENT: 5000, // 5 seconds
};

export function getPaymentErrorMessage(code: string): { title: string; message: string } {
  return PAYMENT_ERROR_MESSAGES[code] || PAYMENT_ERROR_MESSAGES[PAYMENT_ERROR_CODES.SERVER_ERROR];
}

export function isRetryableError(code: string): boolean {
  const nonRetryableCodes = new Set([
    PAYMENT_ERROR_CODES.VALIDATION_ERROR,
    PAYMENT_ERROR_CODES.PAYMENT_ALREADY_SUCCEEDED,
    PAYMENT_ERROR_CODES.PAYMENT_CANCELLED,
    PAYMENT_ERROR_CODES.UNSUPPORTED_METHOD,
    PAYMENT_ERROR_CODES.PROVIDER_INSUFFICIENT_FUNDS,
    PAYMENT_ERROR_CODES.PROVIDER_CARD_EXPIRED,
    PAYMENT_ERROR_CODES.PROVIDER_CVC_INCORRECT,
    PAYMENT_ERROR_CODES.PROVIDER_LOST_CARD,
    PAYMENT_ERROR_CODES.PROVIDER_STOLEN_CARD,
    PAYMENT_ERROR_CODES.USER_ACTION_REQUIRED,
  ]);
  
  return !nonRetryableCodes.has(code);
}

export function getRetryDelay(retryCount: number): number {
  return retryCount * RETRY_CONFIG.DELAY_INCREMENT;
}