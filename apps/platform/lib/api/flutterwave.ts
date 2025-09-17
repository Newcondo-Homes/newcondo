// apps/platform/lib/api/flutterwave.ts
import { env } from '@/lib/env';
import type {
  FlutterwavePaymentData,
  FlutterwaveResponse,
  FlutterwaveConfig,
  FlutterwaveCustomer,
  FlutterwaveCustomization,
  PaymentCallback
} from '@/types/payment';

declare global {
  interface Window {
    FlutterwaveCheckout: (config: FlutterwaveConfig) => void;
  }
}

class FlutterwaveClient {
  private publicKey: string;
  private baseUrl: string;

  constructor() {
    this.publicKey = env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY;
    this.baseUrl = 'https://api.flutterwave.com/v3';
  }

  /**
   * Initialize Flutterwave payment popup
   */
  initializePayment(config: {
    amount: number;
    currency: string;
    reference: string;
    customer: FlutterwaveCustomer;
    customization?: FlutterwaveCustomization;
    onSuccess: PaymentCallback;
    onCancel?: () => void;
    onError?: (error: any) => void;
    paymentOptions?: string[];
    redirectUrl?: string;
    meta?: Record<string, any>;
  }): void {
    const flutterwaveConfig: FlutterwaveConfig = {
      public_key: this.publicKey,
      tx_ref: config.reference,
      amount: config.amount,
      currency: config.currency,
      customer: config.customer,
      customizations: config.customization || {
        title: 'NewCondo Payment',
        description: 'Property rental payment',
        logo: `${window.location.origin}/images/logos/logo.png`
      },
      payment_options: config.paymentOptions?.join(',') || 'card,banktransfer,ussd',
      redirect_url: config.redirectUrl,
      meta: config.meta,
      callback: (response: FlutterwaveResponse) => {
        if (response.status === 'successful') {
          config.onSuccess(response);
        } else {
          config.onError?.(response);
        }
      },
      onclose: () => {
        config.onCancel?.();
      }
    };

    // Load Flutterwave script if not already loaded
    if (!window.FlutterwaveCheckout) {
      this.loadFlutterwaveScript(() => {
        window.FlutterwaveCheckout(flutterwaveConfig);
      });
    } else {
      window.FlutterwaveCheckout(flutterwaveConfig);
    }
  }

  /**
   * Generate payment reference
   */
  generateReference(prefix = 'NEWCONDO'): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Verify payment transaction
   */
  async verifyTransaction(transactionId: string): Promise<{
    status: string;
    data: any;
    message: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/transactions/${transactionId}/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${env.FLUTTERWAVE_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error verifying transaction:', error);
      throw error;
    }
  }

  /**
   * Create virtual account
   */
  async createVirtualAccount(data: {
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    bankCode?: string;
    duration?: number;
    frequency?: number;
  }): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/virtual-account-numbers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.FLUTTERWAVE_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: data.email,
          is_permanent: true,
          bvn: null,
          tx_ref: this.generateReference('VA'),
          firstname: data.firstName,
          lastname: data.lastName,
          phonenumber: data.phoneNumber,
          narration: 'NewCondo Virtual Account',
          bank_code: data.bankCode || '044', // Default to Access Bank
          duration: data.duration,
          frequency: data.frequency
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating virtual account:', error);
      throw error;
    }
  }

  /**
   * Get supported banks
   */
  async getSupportedBanks(country = 'NG'): Promise<Array<{
    id: number;
    code: string;
    name: string;
  }>> {
    try {
      const response = await fetch(`${this.baseUrl}/banks/${country}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${env.FLUTTERWAVE_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching banks:', error);
      return [];
    }
  }

  /**
   * Initiate refund
   */
  async initiateRefund(transactionId: string, amount?: number): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/transactions/${transactionId}/refund`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.FLUTTERWAVE_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: amount
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error initiating refund:', error);
      throw error;
    }
  }

  /**
   * Get transaction fees
   */
  async getTransactionFee(amount: number, currency = 'NGN'): Promise<{
    charge_amount: number;
    fee: number;
    merchant_fee: number;
    flutterwave_fee: number;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/transactions/fee`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${env.FLUTTERWAVE_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error getting transaction fee:', error);
      throw error;
    }
  }

  /**
   * Load Flutterwave script dynamically
   */
  private loadFlutterwaveScript(callback: () => void): void {
    const script = document.createElement('script');
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.async = true;
    script.onload = callback;
    script.onerror = () => {
      console.error('Failed to load Flutterwave script');
    };
    document.head.appendChild(script);
  }

  /**
   * Format amount for display
   */
  formatAmount(amount: number, currency = 'NGN'): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Validate payment amount
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

    const minAmount = minAmounts[currency] || 100;

    if (amount < minAmount) {
      return {
        isValid: false,
        message: `Minimum amount is ${this.formatAmount(minAmount, currency)}`
      };
    }

    if (amount > 50000000) { // 50M NGN limit
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