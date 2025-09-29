import { apiClient } from './client';

// Types
export interface VirtualAccount {
  id: string;
  accountNumber: string;
  accountName: string;
  bankCode: string;
  userId: string;
  propertyId?: string;
  balance: number;
  currency: string;
  isActive: boolean;
  flutterwaveAccountId?: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  property?: {
    id: string;
    title: string;
    address: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface VirtualAccountTransaction {
  id: string;
  accountId: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  balance: number;
  reference: string;
  description: string;
  metadata?: any;
  createdAt: string;
}

export interface VirtualAccountStats {
  totalAccounts: number;
  activeAccounts: number;
  inactiveAccounts: number;
  totalBalance: number;
  totalCredits: number;
  totalDebits: number;
  accountsByRole: {
    role: string;
    count: number;
    totalBalance: number;
  }[];
}

export interface ReconciliationData {
  accountId: string;
  expectedBalance: number;
  actualBalance: number;
  difference: number;
  status: 'BALANCED' | 'DISCREPANCY';
  transactions: VirtualAccountTransaction[];
  notes?: string;
}

export interface AccountStatement {
  data: Blob;
  filename: string;
  mimeType: string;
}

export interface VirtualAccountFilters {
  search?: string;
  role?: string;
  isActive?: boolean;
  minBalance?: number;
  maxBalance?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GenerateStatementParams {
  accountId: string;
  format: 'PDF' | 'CSV' | 'EXCEL';
  period: 'last_7_days' | 'last_30_days' | 'last_90_days' | 'custom';
  startDate?: string;
  endDate?: string;
}

// API Functions

/**
 * Get all virtual accounts with filters
 */
export const getVirtualAccounts = async (
  filters?: VirtualAccountFilters
): Promise<{
  accounts: VirtualAccount[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}> => {
  const response = await apiClient.get('/admin/virtual-accounts', {
    params: filters,
  });
  return response.data;
};

/**
 * Get virtual account by ID
 */
export const getVirtualAccountById = async (
  accountId: string
): Promise<VirtualAccount> => {
  const response = await apiClient.get(`/admin/virtual-accounts/${accountId}`);
  return response.data;
};

/**
 * Get virtual account statistics
 */
export const getVirtualAccountStats = async (): Promise<VirtualAccountStats> => {
  const response = await apiClient.get('/admin/virtual-accounts/stats');
  return response.data;
};

/**
 * Get transactions for a virtual account
 */
export const getAccountTransactions = async (
  accountId: string,
  params?: {
    startDate?: string;
    endDate?: string;
    type?: 'CREDIT' | 'DEBIT';
    page?: number;
    limit?: number;
  }
): Promise<{
  transactions: VirtualAccountTransaction[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}> => {
  const response = await apiClient.get(
    `/admin/virtual-accounts/${accountId}/transactions`,
    { params }
  );
  return response.data;
};

/**
 * Create virtual account manually (admin override)
 */
export const createVirtualAccount = async (data: {
  userId: string;
  propertyId?: string;
  accountName: string;
}): Promise<VirtualAccount> => {
  const response = await apiClient.post('/admin/virtual-accounts', data);
  return response.data;
};

/**
 * Update virtual account
 */
export const updateVirtualAccount = async (
  accountId: string,
  data: {
    accountName?: string;
    isActive?: boolean;
  }
): Promise<VirtualAccount> => {
  const response = await apiClient.patch(
    `/admin/virtual-accounts/${accountId}`,
    data
  );
  return response.data;
};

/**
 * Deactivate virtual account
 */
export const deactivateVirtualAccount = async (
  accountId: string,
  reason: string
): Promise<{ message: string }> => {
  const response = await apiClient.post(
    `/admin/virtual-accounts/${accountId}/deactivate`,
    { reason }
  );
  return response.data;
};

/**
 * Reactivate virtual account
 */
export const reactivateVirtualAccount = async (
  accountId: string
): Promise<{ message: string }> => {
  const response = await apiClient.post(
    `/admin/virtual-accounts/${accountId}/reactivate`
  );
  return response.data;
};

/**
 * Reconcile virtual account
 */
export const reconcileAccount = async (
  accountId: string,
  data: {
    expectedBalance: number;
    notes?: string;
  }
): Promise<ReconciliationData> => {
  const response = await apiClient.post(
    `/admin/virtual-accounts/${accountId}/reconcile`,
    data
  );
  return response.data;
};

/**
 * Get reconciliation history
 */
export const getReconciliationHistory = async (
  accountId: string
): Promise<ReconciliationData[]> => {
  const response = await apiClient.get(
    `/admin/virtual-accounts/${accountId}/reconciliation-history`
  );
  return response.data;
};

/**
 * Generate account statement
 */
export const generateAccountStatement = async (
  params: GenerateStatementParams
): Promise<AccountStatement> => {
  const response = await apiClient.post(
    '/admin/virtual-accounts/generate-statement',
    params,
    {
      responseType: 'blob',
    }
  );

  // Extract filename from Content-Disposition header
  const contentDisposition = response.headers['content-disposition'];
  const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
  const filename = filenameMatch
    ? filenameMatch[1]
    : `statement-${params.accountId}.${params.format.toLowerCase()}`;

  return {
    data: response.data,
    filename,
    mimeType: response.headers['content-type'],
  };
};

/**
 * Perform bulk reconciliation
 */
export const bulkReconciliation = async (data: {
  accountIds: string[];
  date?: string;
}): Promise<{
  results: ReconciliationData[];
  summary: {
    total: number;
    balanced: number;
    discrepancies: number;
  };
}> => {
  const response = await apiClient.post(
    '/admin/virtual-accounts/bulk-reconcile',
    data
  );
  return response.data;
};

/**
 * Get account audit trail
 */
export const getAccountAuditTrail = async (
  accountId: string,
  params?: {
    startDate?: string;
    endDate?: string;
    action?: string;
    page?: number;
    limit?: number;
  }
): Promise<{
  auditLogs: Array<{
    id: string;
    accountId: string;
    action: string;
    performedBy: string;
    adminName: string;
    metadata?: any;
    createdAt: string;
  }>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}> => {
  const response = await apiClient.get(
    `/admin/virtual-accounts/${accountId}/audit-trail`,
    { params }
  );
  return response.data;
};

/**
 * Export accounts data
 */
export const exportAccountsData = async (params: {
  format: 'CSV' | 'EXCEL';
  filters?: VirtualAccountFilters;
}): Promise<Blob> => {
  const response = await apiClient.post(
    '/admin/virtual-accounts/export',
    params,
    {
      responseType: 'blob',
    }
  );
  return response.data;
};

/**
 * Sync account with Flutterwave
 */
export const syncWithFlutterwave = async (
  accountId: string
): Promise<{
  message: string;
  syncedBalance: number;
  previousBalance: number;
}> => {
  const response = await apiClient.post(
    `/admin/virtual-accounts/${accountId}/sync-flutterwave`
  );
  return response.data;
};

/**
 * Get account balance history
 */
export const getBalanceHistory = async (
  accountId: string,
  params?: {
    startDate?: string;
    endDate?: string;
    interval?: 'daily' | 'weekly' | 'monthly';
  }
): Promise
  Array<{
    date: string;
    balance: number;
    credits: number;
    debits: number;
  }>
> => {
  const response = await apiClient.get(
    `/admin/virtual-accounts/${accountId}/balance-history`,
    { params }
  );
  return response.data;
};