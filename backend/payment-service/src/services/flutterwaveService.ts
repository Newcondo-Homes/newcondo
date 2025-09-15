import axios, { AxiosInstance, AxiosResponse } from 'axios';
import crypto from 'crypto';

interface FlutterwaveCustomer {
  email: string;
  phonenumber?: string;
  name: string;
}

interface FlutterwaveCustomizations {
  title: string;
  description?: string;
  logo?: string;
}

interface FlutterwavePaymentData {
  tx_ref: string;
  amount: number;
  currency: string;
  redirect_url: string;
  customer: FlutterwaveCustomer;
  customizations?: FlutterwaveCustomizations;
  meta?: Record<string, any>;
  payment_options?: string;
}

interface FlutterwaveInitResponse {
  status: string;
  message: string;
  data: {
    link: string;
  };
  tx_ref: string;
  link: string;
}

interface FlutterwaveVerifyResponse {
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
      token: string;
      expiry: string;
    };
  };
}

interface RefundData {
  amount: number;
  comments?: string;
}

interface FlutterwaveRefundResponse {
  status: string;
  message: string;
  data: {
    id: number;
    account_id: number;
    tx_id: number;
    flw_ref: string;
    wallet_id: number;
    amount_refunded: number;
    status: string;
    destination: string;
    meta: any;
    created_at: string;
  };
}

interface VirtualAccountData {
  email: string;
  is_permanent?: boolean;
  bvn?: string;
  tx_ref: string;
  phonenumber?: string;
  firstname?: string;
  lastname?: string;
  narration?: string;
}

interface FlutterwaveVirtualAccountResponse {
  status: string;
  message: string;
  data: {
    response_code: string;
    response_message: string;
    flw_ref: string;
    account_number: string;
    frequency: string;
    bank_name: string;
    created_at: string;
    expiry_date: string;
    note: string;
    amount: number;
  };
}

export class FlutterwaveService {
  private client: AxiosInstance;
  private secretKey: string;
  private publicKey: string;
  private baseURL: string;
  private webhookHash: string;

  constructor() {
    this.secretKey = process.env.FLUTTERWAVE_SECRET_KEY!;
    this.publicKey = process.env.FLUTTERWAVE_PUBLIC_KEY!;
    this.baseURL = process.env.FLUTTERWAVE_BASE_URL || 'https://api.flutterwave.com/v3';
    this.webhookHash = process.env.FLUTTERWAVE_WEBHOOK_HASH!;

    if (!this.secretKey || !this.publicKey) {
      throw new Error('Flutterwave keys are not configured');
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`Flutterwave API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('Flutterwave API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging and error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log(`Flutterwave API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('Flutterwave API Response Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
        });
        return Promise.reject(error);
      }
    );
  }

  async initializePayment(paymentData: FlutterwavePaymentData): Promise<FlutterwaveInitResponse> {
    try {
      const payload = {
        ...paymentData,
        payment_options: paymentData.payment_options || 'card,banktransfer,ussd',
      };

      const response: AxiosResponse<FlutterwaveInitResponse> = await this.client.post(
        '/payments',
        payload
      );

      if (response.data.status !== 'success') {
        throw new Error(`Payment initialization failed: ${response.data.message}`);
      }

      return {
        ...response.data,
        tx_ref: paymentData.tx_ref,
        link: response.data.data.link,
      };
    } catch (error) {
      console.error('Error initializing payment:', error);
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message;
        throw new Error(`Flutterwave payment initialization failed: ${errorMessage}`);
      }
      throw error;
    }
  }

  async verifyTransaction(transactionId: string): Promise<{
    success: boolean;
    data?: FlutterwaveVerifyResponse['data'];
    message?: string;
  }> {
    try {
      const response: AxiosResponse<FlutterwaveVerifyResponse> = await this.client.get(
        `/transactions/${transactionId}/verify`
      );

      if (response.data.status !== 'success') {
        return {
          success: false,
          message: response.data.message,
        };
      }

      const transaction = response.data.data;

      // Additional verification checks
      if (transaction.status !== 'successful') {
        return {
          success: false,
          message: 'Transaction was not successful',
          data: transaction,
        };
      }

      return {
        success: true,
        data: transaction,
      };
    } catch (error) {
      console.error('Error verifying transaction:', error);
      return {
        success: false,
        message: 'Transaction verification failed',
      };
    }
  }

  async verifyWebhookSignature(payload: string, signature: string): Promise<boolean> {
    try {
      const computedSignature = crypto
        .createHmac('sha256', this.webhookHash)
        .update(payload)
        .digest('hex');

      return computedSignature === signature;
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  async refundTransaction(transactionId: string, refundData: RefundData): Promise<{
    success: boolean;
    data?: FlutterwaveRefundResponse['data'];
    message?: string;
  }> {
    try {
      const response: AxiosResponse<FlutterwaveRefundResponse> = await this.client.post(
        `/transactions/${transactionId}/refund`,
        refundData
      );

      if (response.data.status !== 'success') {
        return {
          success: false,
          message: response.data.message,
        };
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Error processing refund:', error);
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          message: error.response?.data?.message || 'Refund processing failed',
        };
      }
      return {
        success: false,
        message: 'Refund processing failed',
      };
    }
  }

  async createVirtualAccount(accountData: VirtualAccountData): Promise<{
    success: boolean;
    data?: FlutterwaveVirtualAccountResponse['data'];
    message?: string;
  }> {
    try {
      const payload = {
        ...accountData,
        is_permanent: accountData.is_permanent ?? true,
      };

      const response: AxiosResponse<FlutterwaveVirtualAccountResponse> = await this.client.post(
        '/virtual-account-numbers',
        payload
      );

      if (response.data.status !== 'success') {
        return {
          success: false,
          message: response.data.message,
        };
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Error creating virtual account:', error);
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          message: error.response?.data?.message || 'Virtual account creation failed',
        };
      }
      return {
        success: false,
        message: 'Virtual account creation failed',
      };
    }
  }

  async getBanks(country: string = 'NG'): Promise<{
    success: boolean;
    data?: Array<{
      id: number;
      code: string;
      name: string;
    }>;
    message?: string;
  }> {
    try {
      const response = await this.client.get(`/banks/${country}`);

      if (response.data.status !== 'success') {
        return {
          success: false,
          message: response.data.message,
        };
      }

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Error fetching banks:', error);
      return {
        success: false,
        message: 'Failed to fetch banks',
      };
    }
  }

  async validateBankAccount(accountNumber: string, bankCode: string): Promise<{
    success: boolean;
    data?: {
      account_number: string;
      account_name: string;
    };
    message?: string;
  }> {
    try {
      const response = await this.client.post('/accounts/resolve', {
        account_number: accountNumber,
        account_bank: bankCode,
      });

      if (response.data.status !== 'success') {
        return {
          success: false,
          message: response.data.message,
        };
      }

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Error validating bank account:', error);
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          message: error.response?.data?.message || 'Bank account validation failed',
        };
      }
      return {
        success: false,
        message: 'Bank account validation failed',
      };
    }
  }

  async getTransactionFee(amount: number, currency: string = 'NGN'): Promise<{
    success: boolean;
    data?: {
      fee: number;
      currency: string;
    };
    message?: string;
  }> {
    try {
      const response = await this.client.get('/transactions/fee', {
        params: {
          amount,
          currency,
          type: 'card', // Default to card fees
        },
      });

      if (response.data.status !== 'success') {
        return {
          success: false,
          message: response.data.message,
        };
      }

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Error fetching transaction fee:', error);
      return {
        success: false,
        message: 'Failed to fetch transaction fee',
      };
    }
  }

  async getBalance(): Promise<{
    success: boolean;
    data?: Array<{
      currency: string;
      available_balance: number;
      ledger_balance: number;
    }>;
    message?: string;
  }> {
    try {
      const response = await this.client.get('/balances');

      if (response.data.status !== 'success') {
        return {
          success: false,
          message: response.data.message,
        };
      }

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Error fetching balance:', error);
      return {
        success: false,
        message: 'Failed to fetch balance',
      };
    }
  }

  generateTransactionReference(prefix: string = 'newcondo'): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    return `${prefix}_${timestamp}_${randomString}`;
  }

  formatAmount(amount: number): number {
    // Ensure amount is positive and has maximum 2 decimal places
    return Math.max(0, Math.round(amount * 100) / 100);
  }

  async testConnection(): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      await this.getBalance();
      return {
        success: true,
        message: 'Flutterwave connection successful',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Flutterwave connection failed',
      };
    }
  }
}

export const flutterwaveService = new FlutterwaveService();