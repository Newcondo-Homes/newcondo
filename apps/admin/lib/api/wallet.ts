import { apiClient } from './client';

export interface WalletStats {
  totalBalance: number;
  availableBalance: number;
  pendingBalance: number;
  totalRevenue: number;
  totalCommissions: number;
  totalWithdrawals: number;
}

export interface Transaction {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  category: 'PLATFORM_FEE' | 'SERVICE_FEE' | 'COMMISSION' | 'WITHDRAWAL' | 'REFUND';
  amount: number;
  balance: number;
  description: string;
  reference: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  createdAt: string;
}

export interface VirtualAccountInfo {
  accountNumber: string;
  accountName: string;
  bankName: string;
  balance: number;
  isActive: boolean;
}

export interface RevenueBreakdown {
  date: string;
  platformFees: number;
  serviceFees: number;
  totalRevenue: number;
}

export interface CommissionBreakdown {
  date: string;
  agentCommissions: number;
  subAgentCommissions: number;
  totalCommissions: number;
}

export const walletApi = {
  // Get wallet statistics
  getStats: async (): Promise<WalletStats> => {
    const response = await apiClient.get('/admin/wallet/stats');
    return response.data;
  },

  // Get virtual account info
  getVirtualAccount: async (): Promise<VirtualAccountInfo> => {
    const response = await apiClient.get('/admin/wallet/virtual-account');
    return response.data;
  },

  // Get transaction history
  getTransactions: async (params?: {
    type?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    transactions: Transaction[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    const response = await apiClient.get('/admin/wallet/transactions', { params });
    return response.data;
  },

  // Get revenue breakdown
  getRevenueBreakdown: async (params: {
    startDate: string;
    endDate: string;
    interval?: 'day' | 'week' | 'month';
  }): Promise<RevenueBreakdown[]> => {
    const response = await apiClient.get('/admin/wallet/revenue-breakdown', { params });
    return response.data;
  },

  // Get commission breakdown
  getCommissionBreakdown: async (params: {
    startDate: string;
    endDate: string;
    interval?: 'day' | 'week' | 'month';
  }): Promise<CommissionBreakdown[]> => {
    const response = await apiClient.get('/admin/wallet/commission-breakdown', { params });
    return response.data;
  },

  // Export transactions
  exportTransactions: async (params: {
    startDate: string;
    endDate: string;
    format: 'csv' | 'excel' | 'pdf';
  }): Promise<Blob> => {
    const response = await apiClient.get('/admin/wallet/export', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },
};