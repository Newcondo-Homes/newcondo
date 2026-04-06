import { apiClient } from './client';
import type {
  WithdrawalRequest,
  WithdrawalResponse,
  WithdrawalStatusResponse,
  BankAccountResponse
} from '@/types/api';

export const withdrawalsApi = {
  /**
   * Initiate a withdrawal request
   */
  createWithdrawal: async (data: WithdrawalRequest): Promise<WithdrawalResponse> => {
    const response = await apiClient.post('/api/withdrawals', data);
    return response.data as WithdrawalResponse;
  },

  /**
   * Get withdrawal status
   */
  getWithdrawalStatus: async (withdrawalId: string): Promise<WithdrawalStatusResponse> => {
    const response = await apiClient.get(`/api/withdrawals/${withdrawalId}`);
    return response.data as WithdrawalStatusResponse;
  },

  /**
   * Get withdrawal history
   */
  getWithdrawalHistory: async (params?: {
    page?: number;
    limit?: number;
    status?: 'pending' | 'processing' | 'completed' | 'failed';
  }): Promise<{
    withdrawals: WithdrawalStatusResponse[];
    total: number;
    page: number;
    limit: number;
  }> => {
    const response = await apiClient.get('/api/withdrawals/history', { params });
    return response.data as {
      withdrawals: WithdrawalStatusResponse[];
      total: number;
      page: number;
      limit: number;
    };
  },

  /**
   * Get saved bank accounts
   */
  getBankAccounts: async (): Promise<BankAccountResponse[]> => {
    const response = await apiClient.get('/api/withdrawals/bank-accounts');
    return response.data as BankAccountResponse[];
  },

  /**
   * Add a new bank account
   */
  addBankAccount: async (data: {
    accountNumber: string;
    bankCode: string;
    accountName?: string;
  }): Promise<BankAccountResponse> => {
    const response = await apiClient.post('/api/withdrawals/bank-accounts', data);
    return response.data as BankAccountResponse;
  },

  /**
   * Verify bank account details
   */
  verifyBankAccount: async (data: {
    accountNumber: string;
    bankCode: string;
  }): Promise<{
    accountName: string;
    accountNumber: string;
    bankName: string;
  }> => {
    const response = await apiClient.post('/api/withdrawals/verify-account', data);
    return response.data as {
      accountName: string;
      accountNumber: string;
      bankName: string;
    };
  },

  /**
   * Delete a bank account
   */
  deleteBankAccount: async (accountId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/api/withdrawals/bank-accounts/${accountId}`);
    return response.data as { success: boolean };
  },

  /**
   * Set up automatic withdrawal
   */
  setAutomaticWithdrawal: async (data: {
    enabled: boolean;
    bankAccountId: string;
    frequency?: 'immediate' | 'daily' | 'weekly' | 'monthly';
    minimumAmount?: number;
  }): Promise<{ success: boolean }> => {
    const response = await apiClient.post('/api/withdrawals/automatic', data);
    return response.data as { success: boolean };
  },

  /**
   * Get automatic withdrawal settings
   */
  getAutomaticWithdrawalSettings: async (): Promise<{
    enabled: boolean;
    bankAccountId?: string;
    frequency?: string;
    minimumAmount?: number;
  }> => {
    const response = await apiClient.get('/api/withdrawals/automatic');
    return response.data as {
      enabled: boolean;
      bankAccountId?: string;
      frequency?: string;
      minimumAmount?: number;
    };
  },

  /**
   * Cancel a pending withdrawal
   */
  cancelWithdrawal: async (withdrawalId: string): Promise<WithdrawalResponse> => {
    const response = await apiClient.post(`/api/withdrawals/${withdrawalId}/cancel`);
    return response.data as WithdrawalResponse;
  },

  /**
   * Get available withdrawal amount (excluding locked funds)
   */
  getAvailableAmount: async (): Promise<{
    availableAmount: number;
    lockedAmount: number;
    totalBalance: number;
  }> => {
    const response = await apiClient.get('/api/withdrawals/available-amount');
    return response.data as {
      availableAmount: number;
      lockedAmount: number;
      totalBalance: number;
    };
  }
};