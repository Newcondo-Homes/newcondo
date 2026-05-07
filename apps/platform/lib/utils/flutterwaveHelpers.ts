import { PaymentFormData } from './paymentValidation';

interface FlutterwaveResponse {
  status: string;
  transaction_id?: string;
  tx_ref: string;
  [key: string]: unknown;
}

interface PaymentResult {
  success: boolean;
  data?: unknown;
  error?: string;
}


// Flutterwave configuration
export const FLUTTERWAVE_CONFIG = {
  publicKey: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY!,
  apiUrl: process.env.NODE_ENV === 'production' 
    ? 'https://api.flutterwave.com/v3' 
    : 'https://ravesandboxapi.flutterwave.com/v3',
  redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payments/callback`,
  currencies: ['NGN', 'USD', 'GHS', 'KES', 'UGX'],
  paymentMethods: ['card', 'account', 'ussd', 'mobile_money', 'bank_transfer'],
};

// Payment payload interfaces
export interface FlutterwavePaymentPayload {
  tx_ref: string;
  amount: number;
  currency: string;
  redirect_url: string;
  payment_options: string;
  customer: {
    email: string;
    phone_number: string;
    name: string;
  };
  customizations: {
    title: string;
    description: string;
    logo: string;
  };
  meta?: {
    propertyId?: string;
    unitId?: string;
    markingJobId?: string;
    paymentType?: string;
    userId?: string;
  };
}

export interface FlutterwaveVerifyResponse {
  status: string;
  message: string;
  data: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    device_fingerprint: string;
    amount: number;
    currency: string;
    charged_amount: number;
    app_fee: number;
    merchant_fee: number;
    processor_response: string;
    auth_model: string;
    ip: string;
    narration: string;
    status: string;
    payment_type: string;
    created_at: string;
    account_id: number;
    customer: {
      id: number;
      name: string;
      phone_number: string;
      email: string;
      created_at: string;
    };
    card?: {
      first_6digits: string;
      last_4digits: string;
      issuer: string;
      country: string;
      type: string;
      expiry: string;
    };
  };
}

// Generate transaction reference
export function generateTransactionRef(prefix: string = 'NCD'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}_${timestamp}_${random}`;
}

// Create payment payload
export function createPaymentPayload(
  formData: PaymentFormData & {
    propertyId?: string;
    unitId?: string;
    markingJobId?: string;
    paymentType?: string;
    userId?: string;
    description?: string;
  }
): FlutterwavePaymentPayload {
  const txRef = generateTransactionRef();
  
  return {
    tx_ref: txRef,
    amount: formData.amount,
    currency: formData.currency,
    redirect_url: FLUTTERWAVE_CONFIG.redirectUrl,
    payment_options: getPaymentOptions(formData.paymentMethod),
    customer: {
      email: formData.email,
      phone_number: formData.phone,
      name: formData.fullName,
    },
    customizations: {
      title: 'NewCondo Payment',
      description: formData.description || 'Property rental payment',
      logo: `${process.env.NEXT_PUBLIC_APP_URL}/images/logo.png`,
    },
    meta: {
      propertyId: formData.propertyId,
      unitId: formData.unitId,
      markingJobId: formData.markingJobId,
      paymentType: formData.paymentType,
      userId: formData.userId,
    },
  };
}

// Get payment options string for Flutterwave
function getPaymentOptions(method: string): string {
  const methodMap = {
    card: 'card',
    bank_transfer: 'account',
    ussd: 'ussd',
    mobile_money: 'mobilemoney',
  };
  
  return methodMap[method as keyof typeof methodMap] || 'card';
}

// Initialize Flutterwave payment
export function initializeFlutterwavePayment(
  payload: FlutterwavePaymentPayload,
  onSuccess: (data: FlutterwaveResponse) => void,
  onError: (error: FlutterwaveResponse) => void,
  onClose: () => void
) {
  if (typeof window === 'undefined') {
    throw new Error('Flutterwave can only be initialized in the browser');
  }

  // @ts-ignore - FlutterwaveCheckout is loaded from CDN
  if (!window.FlutterwaveCheckout) {
    throw new Error('Flutterwave checkout script not loaded');
  }

  // @ts-ignore
  window.FlutterwaveCheckout({
    public_key: FLUTTERWAVE_CONFIG.publicKey,
    tx_ref: payload.tx_ref,
    amount: payload.amount,
    currency: payload.currency,
    payment_options: payload.payment_options,
    redirect_url: payload.redirect_url,
    customer: payload.customer,
    customizations: payload.customizations,
    meta: payload.meta,
    callback: (response: any) => {
      if (response.status === 'successful') {
        onSuccess(response);
      } else {
        onError(response);
      }
    },
    onclose: onClose,
  });
}

// Verify payment with backend
export async function verifyPayment(
  transactionId: string,
  txRef: string
): Promise<PaymentResult> {
  try {
    const response = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transaction_id: transactionId,
        tx_ref: txRef,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Payment verification failed',
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch  {
    return {
      success: false,
      error: 'Network error during payment verification',
    };
  }
}

// Format currency amount
export function formatCurrency(amount: number, currency: string = 'NGN'): string {
  const currencyMap = {
    NGN: { symbol: '₦', locale: 'en-NG' },
    USD: { symbol: '$', locale: 'en-US' },
    GHS: { symbol: 'GH₵', locale: 'en-GH' },
    KES: { symbol: 'KSh', locale: 'en-KE' },
    UGX: { symbol: 'USh', locale: 'en-UG' },
  };

  const config = currencyMap[currency as keyof typeof currencyMap];
  
  if (config) {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: currency === 'UGX' ? 0 : 2,
    }).format(amount);
  }

  return `${currency} ${amount.toLocaleString()}`;
}

// Get payment status color
export function getPaymentStatusColor(status: string): string {
  const statusColors = {
    SUCCESS: 'text-green-600 bg-green-100',
    PENDING: 'text-yellow-600 bg-yellow-100',
    FAILED: 'text-red-600 bg-red-100',
    CANCELLED: 'text-gray-600 bg-gray-100',
    REFUNDED: 'text-blue-600 bg-blue-100',
    HELD: 'text-orange-600 bg-orange-100',
    RELEASED: 'text-green-600 bg-green-100',
  };

  return statusColors[status as keyof typeof statusColors] || 'text-gray-600 bg-gray-100';
}

// Get payment method icon
export function getPaymentMethodIcon(method: string): string {
  const iconMap = {
    card: '💳',
    bank_transfer: '🏦',
    ussd: '📱',
    mobile_money: '📲',
  };

  return iconMap[method as keyof typeof iconMap] || '💳';
}

// Retry payment logic
export async function retryPayment(
  originalTxRef: string,
  payload: FlutterwavePaymentPayload
): Promise<PaymentResult> {
  try {
    // Generate new transaction reference for retry
    const newTxRef = generateTransactionRef('RETRY');
    const retryPayload = {
      ...payload,
      tx_ref: newTxRef,
      meta: {
        ...payload.meta,
        originalTxRef,
        isRetry: true,
      },
    };

    const response = await fetch('/api/payments/retry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(retryPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Payment retry failed',
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch {
    return {
      success: false,
      error: 'Network error during payment retry',
    };
  }
}

// Handle webhook verification
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean>  {
  const encoder = new TextEncoder();
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  );

  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return signature === expectedSignature;
}

// Extract payment method from Flutterwave response
export function extractPaymentMethod(flwResponse: FlutterwaveVerifyResponse): string {
  const paymentType = flwResponse.data.payment_type.toLowerCase();
  
  if (paymentType.includes('card')) return 'card';
  if (paymentType.includes('account') || paymentType.includes('bank')) return 'bank_transfer';
  if (paymentType.includes('ussd')) return 'ussd';
  if (paymentType.includes('mobile')) return 'mobile_money';
  
  return 'unknown';
}