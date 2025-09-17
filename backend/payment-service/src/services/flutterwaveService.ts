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


// backend/payment-service/src/services/flutterwaveService.ts
// import axios, { AxiosInstance, AxiosError } from 'axios';
// import { PaymentStatus, PaymentType } from '@newcondo/db';
// import { logger } from '../../../shared/src/utils/logger';
// import { ApiError } from '../../../shared/src/utils/response';

// export interface FlutterwaveConfig {
//   publicKey: string;
//   secretKey: string;
//   baseUrl: string;
//   webhookHash: string;
// }

// export interface FlutterwavePaymentRequest {
//   amount: number;
//   currency: string;
//   email: string;
//   txRef: string;
//   redirectUrl: string;
//   customerId: string;
//   customerName: string;
//   customerPhone?: string;
//   paymentType: PaymentType;
//   metadata?: Record<string, any>;
// }

// export interface FlutterwavePaymentResponse {
//   status: string;
//   message: string;
//   data: {
//     id: number;
//     link: string;
//     amount: number;
//     currency: string;
//     tx_ref: string;
//     redirect_url: string;
//     customer: {
//       id: string;
//       name: string;
//       email: string;
//     };
//   };
// }

// export interface FlutterwaveVerificationResponse {
//   status: string;
//   message: string;
//   data: {
//     id: number;
//     tx_ref: string;
//     flw_ref: string;
//     device_fingerprint: string;
//     amount: number;
//     currency: string;
//     charged_amount: number;
//     app_fee: number;
//     merchant_fee: number;
//     processor_response: string;
//     auth_model: string;
//     ip: string;
//     narration: string;
//     status: string;
//     payment_type: string;
//     created_at: string;
//     account_id: number;
//     customer: {
//       id: number;
//       name: string;
//       phone_number: string;
//       email: string;
//       created_at: string;
//     };
//     card?: {
//       first_6digits: string;
//       last_4digits: string;
//       issuer: string;
//       country: string;
//       type: string;
//       expiry: string;
//     };
//     meta?: Record<string, any>;
//   };
// }

// export interface FlutterwaveWebhookPayload {
//   event: string;
//   data: {
//     id: number;
//     tx_ref: string;
//     flw_ref: string;
//     amount: number;
//     currency: string;
//     status: string;
//     customer: {
//       name: string;
//       email: string;
//     };
//     created_at: string;
//   };
// }

// export interface FlutterwaveRefundRequest {
//   id: string;
//   amount: number;
// }

// export interface FlutterwaveRefundResponse {
//   status: string;
//   message: string;
//   data: {
//     id: number;
//     account_id: number;
//     tx_id: number;
//     flw_ref: string;
//     wallet_id: number;
//     amount_refunded: number;
//     status: string;
//     destination: string;
//     meta: any;
//     created_at: string;
//   };
// }

// export class FlutterwaveService {
//   private config: FlutterwaveConfig;
//   private httpClient: AxiosInstance;

//   constructor() {
//     this.config = {
//       publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY!,
//       secretKey: process.env.FLUTTERWAVE_SECRET_KEY!,
//       baseUrl: process.env.FLUTTERWAVE_BASE_URL || 'https://api.flutterwave.com/v3',
//       webhookHash: process.env.FLUTTERWAVE_WEBHOOK_HASH!
//     };

//     if (!this.config.secretKey || !this.config.publicKey) {
//       throw new Error('Flutterwave credentials not configured');
//     }

//     this.httpClient = axios.create({
//       baseURL: this.config.baseUrl,
//       headers: {
//         'Authorization': `Bearer ${this.config.secretKey}`,
//         'Content-Type': 'application/json'
//       },
//       timeout: 30000
//     });

//     this.setupInterceptors();
//   }

//   async initializePayment(request: FlutterwavePaymentRequest): Promise<FlutterwavePaymentResponse> {
//     try {
//       logger.info('Initializing Flutterwave payment', { 
//         txRef: request.txRef, 
//         amount: request.amount 
//       });

//       const payload = {
//         tx_ref: request.txRef,
//         amount: request.amount,
//         currency: request.currency,
//         redirect_url: request.redirectUrl,
//         customer: {
//           email: request.email,
//           name: request.customerName,
//           phonenumber: request.customerPhone
//         },
//         customizations: {
//           title: 'NewCondo Payment',
//           description: this.getPaymentDescription(request.paymentType),
//           logo: process.env.COMPANY_LOGO_URL || ''
//         },
//         meta: {
//           consumer_id: request.customerId,
//           payment_type: request.paymentType,
//           ...request.metadata
//         },
//         payment_options: 'card,banktransfer,ussd,account',
//         payment_plan: null
//       };

//       const response = await this.httpClient.post<FlutterwavePaymentResponse>(
//         '/payments',
//         payload
//       );

//       if (response.data.status !== 'success') {
//         throw new ApiError(400, `Flutterwave payment initialization failed: ${response.data.message}`);
//       }

//       logger.info('Flutterwave payment initialized successfully', { 
//         txRef: request.txRef,
//         paymentId: response.data.data.id 
//       });

//       return response.data;
//     } catch (error) {
//       logger.error('Failed to initialize Flutterwave payment', { 
//         error: this.formatError(error), 
//         txRef: request.txRef 
//       });
      
//       if (error instanceof ApiError) {
//         throw error;
//       }
      
//       throw new ApiError(500, 'Payment initialization failed');
//     }
//   }

//   async verifyTransaction(transactionId: string): Promise<{
//     status: PaymentStatus;
//     transactionId: string;
//     amount: number;
//     currency: string;
//     paidAt?: Date;
//     failureReason?: string;
//     metadata?: Record<string, any>;
//   }> {
//     try {
//       logger.info('Verifying Flutterwave transaction', { transactionId });

//       const response = await this.httpClient.get<FlutterwaveVerificationResponse>(
//         `/transactions/${transactionId}/verify`
//       );

//       if (response.data.status !== 'success') {
//         throw new ApiError(400, `Transaction verification failed: ${response.data.message}`);
//       }

//       const transaction = response.data.data;
//       const status = this.mapFlutterwaveStatus(transaction.status);

//       logger.info('Transaction verification completed', { 
//         transactionId, 
//         status: transaction.status,
//         mappedStatus: status 
//       });

//       return {
//         status,
//         transactionId: transaction.tx_ref,
//         amount: transaction.amount,
//         currency: transaction.currency,
//         paidAt: status === PaymentStatus.SUCCESS ? new Date(transaction.created_at) : undefined,
//         failureReason: status === PaymentStatus.FAILED ? transaction.processor_response : undefined,
//         metadata: {
//           flwRef: transaction.flw_ref,
//           processorResponse: transaction.processor_response,
//           paymentType: transaction.payment_type,
//           card: transaction.card,
//           ...transaction.meta
//         }
//       };
//     } catch (error) {
//       logger.error('Failed to verify transaction', { 
//         error: this.formatError(error), 
//         transactionId 
//       });
      
//       if (error instanceof ApiError) {
//         throw error;
//       }
      
//       throw new ApiError(500, 'Transaction verification failed');
//     }
//   }

//   async processRefund(transactionId: string, amount: number): Promise<FlutterwaveRefundResponse> {
//     try {
//       logger.info('Processing Flutterwave refund', { transactionId, amount });

//       const payload: FlutterwaveRefundRequest = {
//         id: transactionId,
//         amount
//       };

//       const response = await this.httpClient.post<FlutterwaveRefundResponse>(
//         '/transactions/refund',
//         payload
//       );

//       if (response.data.status !== 'success') {
//         throw new ApiError(400, `Refund failed: ${response.data.message}`);
//       }

//       logger.info('Refund processed successfully', { 
//         transactionId, 
//         refundId: response.data.data.id 
//       });

//       return response.data;
//     } catch (error) {
//       logger.error('Failed to process refund', { 
//         error: this.formatError(error), 
//         transactionId 
//       });
      
//       if (error instanceof ApiError) {
//         throw error;
//       }
      
//       throw new ApiError(500, 'Refund processing failed');
//     }
//   }

//   async validateWebhook(payload: string, signature: string): Promise<boolean> {
//     try {
//       const crypto = require('crypto');
//       const hash = crypto
//         .createHmac('sha256', this.config.webhookHash)
//         .update(payload, 'utf8')
//         .digest('hex');

//       return hash === signature;
//     } catch (error) {
//       logger.error('Failed to validate webhook signature', { error });
//       return false;
//     }
//   }

//   async processWebhook(payload: FlutterwaveWebhookPayload): Promise<{
//     txRef: string;
//     status: PaymentStatus;
//     amount: number;
//     currency: string;
//   }> {
//     try {
//       logger.info('Processing Flutterwave webhook', { 
//         event: payload.event,
//         txRef: payload.data.tx_ref 
//       });

//       const status = this.mapFlutterwaveStatus(payload.data.status);

//       return {
//         txRef: payload.data.tx_ref,
//         status,
//         amount: payload.data.amount,
//         currency: payload.data.currency
//       };
//     } catch (error) {
//       logger.error('Failed to process webhook', { error, payload });
//       throw new ApiError(500, 'Webhook processing failed');
//     }
//   }

//   async getTransactionHistory(
//     from?: Date,
//     to?: Date,
//     page: number = 1,
//     limit: number = 50
//   ): Promise<any> {
//     try {
//       const params: any = {
//         page,
//         limit: Math.min(limit, 100) // Flutterwave max limit
//       };

//       if (from) {
//         params.from = from.toISOString().split('T')[0];
//       }

//       if (to) {
//         params.to = to.toISOString().split('T')[0];
//       }

//       const response = await this.httpClient.get('/transactions', { params });

//       return response.data;
//     } catch (error) {
//       logger.error('Failed to get transaction history', { error });
//       throw new ApiError(500, 'Failed to retrieve transaction history');
//     }
//   }

//   async getBankList(country: string = 'NG'): Promise<any[]> {
//     try {
//       const response = await this.httpClient.get('/banks', {
//         params: { country }
//       });

//       return response.data.data || [];
//     } catch (error) {
//       logger.error('Failed to get bank list', { error, country });
//       return [];
//     }
//   }

//   async validateBankAccount(
//     accountNumber: string,
//     bankCode: string
//   ): Promise<{
//     isValid: boolean;
//     accountName?: string;
//   }> {
//     try {
//       const response = await this.httpClient.post('/accounts/resolve', {
//         account_number: accountNumber,
//         account_bank: bankCode
//       });

//       if (response.data.status === 'success') {
//         return {
//           isValid: true,
//           accountName: response.data.data.account_name
//         };
//       }

//       return { isValid: false };
//     } catch (error) {
//       logger.error('Bank account validation failed', { error, accountNumber, bankCode });
//       return { isValid: false };
//     }
//   }

//   private setupInterceptors(): void {
//     // Request interceptor
//     this.httpClient.interceptors.request.use(
//       (config) => {
//         logger.debug('Flutterwave API request', { 
//           method: config.method, 
//           url: config.url 
//         });
//         return config;
//       },
//       (error) => {
//         logger.error('Flutterwave request error', { error });
//         return Promise.reject(error);
//       }
//     );

//     // Response interceptor
//     this.httpClient.interceptors.response.use(
//       (response) => {
//         logger.debug('Flutterwave API response', { 
//           status: response.status,
//           url: response.config.url 
//         });
//         return response;
//       },
//       (error: AxiosError) => {
//         logger.error('Flutterwave response error', { 
//           status: error.response?.status,
//           data: error.response?.data,
//           url: error.config?.url 
//         });
//         return Promise.reject(error);
//       }
//     );
//   }

//   private mapFlutterwaveStatus(flutterwaveStatus: string): PaymentStatus {
//     const statusMap: Record<string, PaymentStatus> = {
//       'successful': PaymentStatus.SUCCESS,
//       'completed': PaymentStatus.SUCCESS,
//       'pending': PaymentStatus.PENDING,
//       'failed': PaymentStatus.FAILED,
//       'cancelled': PaymentStatus.CANCELLED,
//       'refunded': PaymentStatus.REFUNDED
//     };

//     return statusMap[flutterwaveStatus.toLowerCase()] || PaymentStatus.FAILED;
//   }

//   private getPaymentDescription(paymentType: PaymentType): string {
//     const descriptions = {
//       [PaymentType.RENT]: 'Property Rent Payment',
//       [PaymentType.DEPOSIT]: 'Security Deposit Payment',
//       [PaymentType.AGENT_COMMISSION]: 'Agent Commission Payment',
//       [PaymentType.PREMIUM_UPGRADE]: 'Premium Account Upgrade',
//       [PaymentType.PROPERTY_MARKING]: 'Property Boundary Marking Service'
//     };

//     return descriptions[paymentType] || 'Payment';
//   }

//   private formatError(error: any): string {
//     if (axios.isAxiosError(error)) {
//       return JSON.stringify({
//         message: error.message,
//         statusCode: error.response?.status,
//         data: error.response?.data,
//       });
//     }
//     if (error instanceof ApiError) {
//       return JSON.stringify({
//         message: error.message,
//         statusCode: error.statusCode,
//       });
//     }
//     if (error instanceof Error) {
//       return error.message;
//     }
//     return 'An unknown error occurred.';
//   }
// }