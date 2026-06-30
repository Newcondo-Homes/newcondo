// apps/platform/lib/api/flutterwave.ts
import { env } from '@/lib/env';
import type {
  FlutterwaveResponse,
  FlutterwaveConfig,
  FlutterwaveCustomer,
  FlutterwaveCustomization,
  PaymentCallback
} from '@/types/payment';

declare global {
  interface Window {
    FlutterwaveCheckout: ((config: FlutterwaveConfig) => void) | undefined;
    closePaymentModal?: () => void;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────
// TODO: put flutterwaves types in a seperate type folder
export interface InitPaymentOptions {
  amount: number;
  currency: string;
  reference: string;
  customer: FlutterwaveCustomer;
  customization?: FlutterwaveCustomization;
  paymentOptions?: string[];
  redirectUrl?: string;
  meta?: Record<string, unknown>;
  /**
   * Flutterwave payment-plan ID — set this to charge the saved card on a
   * RECURRING schedule (e.g. monthly subscription). Omit for a one-off charge.
   */
  paymentPlan?: string | number;
  onSuccess: PaymentCallback;
  onCancel?: () => void;
  onError?: (response: FlutterwaveResponse) => void;
}

export type PaymentStatusColor =
  | 'text-green-600'
  | 'text-red-600'
  | 'text-yellow-600'
  | 'text-gray-600'
  | 'text-gray-500';

export type PaymentStatusBadge = 'success' | 'error' | 'warning' | 'secondary';


// ─── Script loader (singleton promise) ───────────────────────────────────────

let scriptPromise: Promise<void> | null = null;

function loadFlutterwaveScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    if (window.FlutterwaveCheckout) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null; // allow retry on next call
      reject(new Error('Failed to load Flutterwave checkout script'));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
}


class FlutterwaveClient {
  private readonly publicKey: string;
  private baseUrl: string;

  constructor() {
    this.publicKey = env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY;
    this.baseUrl = 'https://api.flutterwave.com/v3';
  }

  /**
   * Initialize Flutterwave payment popup
   * Loads the checkout script on first call, then reuses it.
   */
  async initializePayment(options: InitPaymentOptions): Promise<void> {
    await loadFlutterwaveScript();

    if (!window.FlutterwaveCheckout) {
      throw new Error('FlutterwaveCheckout is not available after script load');
    }


    const config: FlutterwaveConfig = {
      public_key: this.publicKey,
      tx_ref: options.reference,
      amount: options.amount,
      currency: options.currency,
      // → recurring billing when a plan id is supplied (monthly subscription).
      payment_plan: options.paymentPlan,
      customer: options.customer,
      customizations: options.customization || {
        title: 'NewCondo Payment',
        description: 'Property rental payment',
        logo: "https://drive.google.com/uc?id=1CRhfvMvQS-121fKvLueM4TJDIWx6Azr6"
      },
      payment_options: options.paymentOptions?.join(',') || 'card,banktransfer,ussd',
      redirect_url: options.redirectUrl,
      meta: options.meta,
      callback: (response: FlutterwaveResponse) => {
        if (response.status === 'successful') {
          options.onSuccess(response);
        } else {
          options.onError?.(response);
        }
      },
      onclose: () => {
        options.onCancel?.();
      }
    };

    window.FlutterwaveCheckout(config);
  }

  /**
   * Generate payment reference
   * Format: <PREFIX>_<timestamp>_<6-digit random>
   */
  generateReference(prefix = 'NEWCONDO'): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000).toString()
      .padStart(6, '0');
    return `${prefix}_${timestamp}_${random}`;
  }


   /**
   * Format a numeric amount as a localised currency string.
   */
  formatAmount(amount: number, currency = 'NGN'): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  }


  /**
   * Validate payment amount
   * Validate that an amount is within Flutterwave-accepted bounds.
   */
  validateAmount(amount: number, currency = 'NGN'): {
    isValid: boolean;
    message?: string;
  } {
    const minAmounts: Record<string, number> = {
      'NGN': 100, // ₦1.00
      'USD': 1,   // $1.00
      'GHS': 5,   // ₵5.00
      'KES': 100  // KSh100
    };

    const minAmount = minAmounts[currency] ?? 100;

    if (amount < minAmount) {
      return {
        isValid: false,
        message: `Minimum amount is ${this.formatAmount(minAmount, currency)}`
      };
    }

    if (amount > 50_000_000) { // 50M NGN limit
      return {
        isValid: false,
        message: 'Amount exceeds maximum transaction limit'
      };
    }

    return { isValid: true };
  }



    /**
   * Get payment status color for UI
   */
  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'successful':
      case 'success':
        return 'text-green-600';
      case 'failed':
      case 'error':
        return 'text-red-600';
      case 'pending':
        return 'text-yellow-600';
      case 'cancelled':
        return 'text-gray-600';
      default:
        return 'text-gray-500';
    }
  }



  /**
   * Get payment status badge variant
   */
  getStatusBadge(status: string): 'success' | 'error' | 'warning' | 'secondary' {
    switch (status.toLowerCase()) {
      case 'successful':
      case 'success':
        return 'success';
      case 'failed':
      case 'error':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'secondary';
    }
  }

}

// Export singleton instance
export const flutterwaveClient = new FlutterwaveClient();

// Export utility functions
export const formatNaira = (amount: number): string => {
  return flutterwaveClient.formatAmount(amount, 'NGN');
};

export const generatePaymentReference = (prefix?: string): string => {
  return flutterwaveClient.generateReference(prefix);
};

export const validatePaymentAmount = (amount: number, currency?: string) => {
  return flutterwaveClient.validateAmount(amount, currency);
};
