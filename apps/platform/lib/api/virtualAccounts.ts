// apps/platform/lib/api/virtualAccounts.ts
import { client } from './client'
import type {
  VirtualAccount,
  VirtualAccountBalance,
  VirtualAccountStatement,
  TransactionFilter,
  CreateVirtualAccountRequest,
  TransferFundsRequest,
  WithdrawFundsRequest,
  FundAccountRequest,
  StatementExport,
  TransactionDetails,
  AccountSummary,
  PaginatedResponse,
  ApiResponse
} from '@/types/api'

export const virtualAccountsApi = {
  // Get all virtual accounts for the authenticated user
  getUserAccounts: async (): Promise<VirtualAccount[]> => {
    const response = await client.get<ApiResponse<VirtualAccount[]>>('/virtual-accounts')
    return response.data.data
  },

  // Get virtual account by ID
  getAccount: async (accountId: string): Promise<VirtualAccount> => {
    const response = await client.get<ApiResponse<VirtualAccount>>(`/virtual-accounts/${accountId}`)
    return response.data.data
  },

  // Get virtual account for a specific property
  getPropertyAccount: async (propertyId: string): Promise<VirtualAccount | null> => {
    try {
      const response = await client.get<ApiResponse<VirtualAccount>>(`/virtual-accounts/property/${propertyId}`)
      return response.data.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null
      }
      throw error
    }
  },

  // Create new virtual account
  createAccount: async (data: CreateVirtualAccountRequest): Promise<VirtualAccount> => {
    const response = await client.post<ApiResponse<VirtualAccount>>('/virtual-accounts', data)
    return response.data.data
  },

  // Update virtual account
  updateAccount: async (accountId: string, updates: Partial<VirtualAccount>): Promise<VirtualAccount> => {
    const response = await client.patch<ApiResponse<VirtualAccount>>(`/virtual-accounts/${accountId}`, updates)
    return response.data.data
  },

  // Deactivate virtual account
  deactivateAccount: async (accountId: string): Promise<void> => {
    await client.patch(`/virtual-accounts/${accountId}/deactivate`)
  },

  // Reactivate virtual account
  reactivateAccount: async (accountId: string): Promise<void> => {
    await client.patch(`/virtual-accounts/${accountId}/reactivate`)
  },

  // Get account balance
  getBalance: async (accountId: string): Promise<VirtualAccountBalance> => {
    const response = await client.get<ApiResponse<VirtualAccountBalance>>(`/virtual-accounts/${accountId}/balance`)
    return response.data.data
  },

  // Get account statements with pagination
  getAccountStatements: async (params: {
    accountId: string
    page?: number
    limit?: number
    type?: string
    status?: string
    startDate?: string
    endDate?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<PaginatedResponse<VirtualAccountStatement>> => {
    const queryParams = new URLSearchParams()
    
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (params.type) queryParams.append('type', params.type)
    if (params.status) queryParams.append('status', params.status)
    if (params.startDate) queryParams.append('startDate', params.startDate)
    if (params.endDate) queryParams.append('endDate', params.endDate)
    if (params.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)

    const response = await client.get<PaginatedResponse<VirtualAccountStatement>>(
      `/virtual-accounts/${params.accountId}/statements?${queryParams.toString()}`
    )
    return response.data
  },

  // Get account summary
  getAccountSummary: async (params: {
    accountId: string
    startDate?: string
    endDate?: string
    type?: string
  }): Promise<AccountSummary> => {
    const queryParams = new URLSearchParams()
    
    if (params.startDate) queryParams.append('startDate', params.startDate)
    if (params.endDate) queryParams.append('endDate', params.endDate)
    if (params.type) queryParams.append('type', params.type)

    const response = await client.get<ApiResponse<AccountSummary>>(
      `/virtual-accounts/${params.accountId}/summary?${queryParams.toString()}`
    )
    return response.data.data
  },

  // Transfer funds between accounts
  transferFunds: async (data: TransferFundsRequest): Promise<TransactionDetails> => {
    const response = await client.post<ApiResponse<TransactionDetails>>('/virtual-accounts/transfer', data)
    return response.data.data
  },

  // Withdraw funds from virtual account
  withdrawFunds: async (data: WithdrawFundsRequest): Promise<TransactionDetails> => {
    const response = await client.post<ApiResponse<TransactionDetails>>('/virtual-accounts/withdraw', data)
    return response.data.data
  },

  // Fund virtual account
  fundAccount: async (data: FundAccountRequest): Promise<TransactionDetails> => {
    const response = await client.post<ApiResponse<TransactionDetails>>('/virtual-accounts/fund', data)
    return response.data.data
  },

  // Search transactions
  searchTransactions: async (params: {
    accountId: string
    query: string
    type?: string
    status?: string
    limit?: number
  }): Promise<VirtualAccountStatement[]> => {
    const response = await client.get<ApiResponse<VirtualAccountStatement[]>>(
      `/virtual-accounts/${params.accountId}/search`, 
      { params }
    )
    return response.data.data
  },

  // Get transaction details
  getTransactionDetails: async (transactionId: string): Promise<TransactionDetails> => {
    const response = await client.get<ApiResponse<TransactionDetails>>(`/transactions/${transactionId}`)
    return response.data.data
  },

  // Download transaction receipt
  downloadTransactionReceipt: async (transactionId: string): Promise<{ downloadUrl: string; filename: string }> => {
    const response = await client.get<ApiResponse<{ downloadUrl: string; filename: string }>>(`/transactions/${transactionId}/receipt/download`)
    return response.data.data
  },

  // Export account statement
  exportStatement: async (data: StatementExport): Promise<{ downloadUrl: string }> => {
    const response = await client.post<ApiResponse<{ downloadUrl: string }>>('/virtual-accounts/statements/export', data)
    return response.data.data
  }
}



// import { apiClient } from './client';
// import type { 
//   VirtualAccountResponse, 
//   VirtualAccountBalanceResponse,
//   TransactionHistoryResponse 
// } from '@/types/api';

// export const virtualAccountsApi = {
//   /**
//    * Get user's virtual account details
//    */
//   getMyVirtualAccount: async (): Promise<VirtualAccountResponse> => {
//     const response = await apiClient.get('/api/virtual-accounts/me');
//     return response.data;
//   },

//   /**
//    * Get virtual account balance
//    */
//   getBalance: async (): Promise<VirtualAccountBalanceResponse> => {
//     const response = await apiClient.get('/api/virtual-accounts/balance');
//     return response.data;
//   },

//   /**
//    * Get property-specific virtual account
//    */
//   getPropertyVirtualAccount: async (propertyId: string): Promise<VirtualAccountResponse> => {
//     const response = await apiClient.get(`/api/virtual-accounts/property/${propertyId}`);
//     return response.data;
//   },

//   /**
//    * Get transaction history for virtual account
//    */
//   getTransactionHistory: async (params?: {
//     page?: number;
//     limit?: number;
//     startDate?: string;
//     endDate?: string;
//     type?: 'credit' | 'debit';
//   }): Promise<{
//     transactions: TransactionHistoryResponse[];
//     total: number;
//     page: number;
//     limit: number;
//   }> => {
//     const response = await apiClient.get('/api/virtual-accounts/transactions', { params });
//     return response.data;
//   },

//   /**
//    * Get pending funds (funds in confirmation period)
//    */
//   getPendingFunds: async (): Promise<{
//     totalPending: number;
//     pendingTransactions: Array<{
//       id: string;
//       amount: number;
//       releaseDate: string;
//       source: string;
//     }>;
//   }> => {
//     const response = await apiClient.get('/api/virtual-accounts/pending-funds');
//     return response.data;
//   },

//   /**
//    * Refresh virtual account balance (force sync with Flutterwave)
//    */
//   refreshBalance: async (): Promise<VirtualAccountBalanceResponse> => {
//     const response = await apiClient.post('/api/virtual-accounts/refresh-balance');
//     return response.data;
//   }
// };