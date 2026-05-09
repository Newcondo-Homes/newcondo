// apps/platform/lib/api/virtualAccounts.ts
import { apiClient } from '@/lib/api/client';
import type {
  VirtualAccount,
  VirtualAccountBalance,
  VirtualAccountStatement,
  VirtualAccountTransaction,
  WithdrawalSettings,
  // VirtualAccountQueryParams,
  TransactionListParams,
  UpdateWithdrawalSettingsParams,
  PaginatedTransactionsResponse,
  CreateVirtualAccountRequest,
  InitiateFundTransferRequest,
  InitiateFundTransferResponse,
  GetVirtualAccountsResponse,
  PaginatedResponse,
} from '@/types/virtualAccount';


// ─────────────────────────────────────────────────────────────────────────────
// Account Endpointss
// ─────────────────────────────────────────────────────────────────────────────

/** Fetches the authenticated user's primary virtual account. */
export const fetchMyVirtualAccount = async (): Promise<VirtualAccount> => {
  const response = await apiClient.get<VirtualAccount>('/virtual-accounts/me');
  return response.data!;
};

/** Fetches a specific virtual account by ID. */
export const fetchVirtualAccountById = async (
  accountId: string
): Promise<VirtualAccount> => {
  const response = await apiClient.get<VirtualAccount>(`/virtual-accounts/${accountId}`);
  return response.data!;
};

/** Fetches all virtual accounts belonging to the authenticated user. */
export const fetchAllVirtualAccounts = async (): Promise<VirtualAccount[]> => {
  const response = await apiClient.get<GetVirtualAccountsResponse>('/virtual-accounts');
  return response.data!.data;
};

/** Fetches the virtual account linked to a specific property. */
export const fetchPropertyVirtualAccount = async (
  propertyId: string
): Promise<VirtualAccount | null> => {
  try {
    const response = await apiClient.get<VirtualAccount>(
      `/virtual-accounts/property/${propertyId}`
    );
    return response.data!;
  } catch (error: any) {
    if (error.response?.status === 404) return null;
    throw error;
  }
};

/** Creates a new virtual account. */
export const createVirtualAccount = async (
  payload: CreateVirtualAccountRequest
): Promise<VirtualAccount> => {
  const response = await apiClient.post<VirtualAccount>('/virtual-accounts', payload);
  return response.data!;
};

/** Updates a virtual account's mutable fields. */
export const updateVirtualAccount = async (
  accountId: string,
  updates: Partial<VirtualAccount>
): Promise<VirtualAccount> => {
  const response = await apiClient.patch<VirtualAccount>(
    `/virtual-accounts/${accountId}`,
    updates
  );
  return response.data!;
};

/** Deactivates a virtual account. */
export const deactivateVirtualAccount = async (
  accountId: string
): Promise<VirtualAccount> => {
  const response = await apiClient.patch<VirtualAccount>(
    `/virtual-accounts/${accountId}/deactivate`
  );
  return response.data!;
};

/** Reactivates a previously deactivated virtual account. */
export const reactivateVirtualAccount = async (
  accountId: string
): Promise<VirtualAccount> => {
  const response = await apiClient.patch<VirtualAccount>(
    `/virtual-accounts/${accountId}/reactivate`
  );
  return response.data!;
};



// ─────────────────────────────────────────────────────────────────────────────
// Balance Endpoints
// ─────────────────────────────────────────────────────────────────────────────

/** Fetches the live balance for a virtual account. */
export const fetchAccountBalance = async (
  accountId: string
): Promise<VirtualAccountBalance> => {
  const response = await apiClient.get<VirtualAccountBalance>(
    `/virtual-accounts/${accountId}/balance`
  );
  return response.data!;
};



// ─────────────────────────────────────────────────────────────────────────────
// Transaction Endpoints
// ─────────────────────────────────────────────────────────────────────────────

/** Fetches paginated transaction history for a virtual account. */
export const fetchAccountTransactions = async (
  accountId: string,
  params: TransactionListParams = {}
): Promise<PaginatedTransactionsResponse> => {
  const response = await apiClient.get<PaginatedTransactionsResponse>(
    `/virtual-accounts/${accountId}/transactions`,
    params as Record<string, unknown>
  );
  return response.data!;
};

/** Fetches a single transaction by ID. */
export const fetchTransactionById = async (
  accountId: string,
  transactionId: string
): Promise<VirtualAccountTransaction> => {
  const response = await apiClient.get<VirtualAccountTransaction>(
    `/virtual-accounts/${accountId}/transactions/${transactionId}`
  );
  return response.data!;
};

/** Searches transactions for a given account. */
export const searchTransactions = async (params: {
  accountId: string;
  query: string;
  type?: string;
  status?: string;
  limit?: number;
}): Promise<VirtualAccountTransaction[]> => {
  const { accountId, ...rest } = params;
  const response = await apiClient.get<VirtualAccountTransaction[]>(
    `/virtual-accounts/${accountId}/search`,
    rest as Record<string, unknown>
  );
  return response.data!;
};

/** Downloads a receipt for a specific transaction. */
export const downloadTransactionReceipt = async (
  transactionId: string
): Promise<{ downloadUrl: string; filename: string }> => {
  const response = await apiClient.get<{ downloadUrl: string; filename: string }>(
    `/transactions/${transactionId}/receipt/download`
  );
  return response.data!;
};


// ─────────────────────────────────────────────────────────────────────────────
// Statement Endpoints
// ─────────────────────────────────────────────────────────────────────────────

/** Fetches account statements with optional filters and pagination. */
export const fetchAccountStatements = async (params: {
  accountId: string;
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<PaginatedResponse<VirtualAccountStatement>> => {
  const { accountId, ...rest } = params;
  const query = new URLSearchParams(
    Object.entries(rest)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ).toString();

  const response = await apiClient.get<PaginatedResponse<VirtualAccountStatement>>(
    `/virtual-accounts/${accountId}/statements?${query}`
  );
  return response.data!;
};

/** Fetches a statement summary for a date range. */
export const fetchAccountStatement = async (
  accountId: string,
  startDate: string,
  endDate: string
): Promise<VirtualAccountStatement> => {
  const response = await apiClient.get<VirtualAccountStatement>(
    `/virtual-accounts/${accountId}/statement`,
    { startDate, endDate } as Record<string, unknown>
  );
  return response.data!;
};

/** Exports an account statement as a downloadable file. */
export const exportAccountStatement = async (data: {
  accountId: string;
  startDate: string;
  endDate: string;
  format?: 'pdf' | 'csv';
}): Promise<{ downloadUrl: string }> => {
  const response = await apiClient.post<{ downloadUrl: string }>(
    '/virtual-accounts/statements/export',
    data
  );
  return response.data!;
};


// ─────────────────────────────────────────────────────────────────────────────
// Fund Transfer Endpoints
// ─────────────────────────────────────────────────────────────────────────────

/** Initiates an internal or external fund transfer. */
export const initiateFundTransfer = async (
  payload: InitiateFundTransferRequest
): Promise<InitiateFundTransferResponse['data']> => {
  const response = await apiClient.post<InitiateFundTransferResponse['data']>(
    '/virtual-accounts/transfers',
    payload
  );
  return response.data!;
};


// ─────────────────────────────────────────────────────────────────────────────
// Withdrawal Settings Endpoints
// ─────────────────────────────────────────────────────────────────────────────

/** Fetches withdrawal settings for a virtual account. */
export const fetchWithdrawalSettings = async (
  accountId: string
): Promise<WithdrawalSettings> => {
  const response = await apiClient.get<WithdrawalSettings>(
    `/virtual-accounts/${accountId}/withdrawal-settings`
  );
  return response.data!;
};

/** Updates withdrawal settings for a virtual account. */
export const updateWithdrawalSettings = async (
  accountId: string,
  settings: UpdateWithdrawalSettingsParams
): Promise<WithdrawalSettings> => {
  const response = await apiClient.patch<WithdrawalSettings>(
    `/virtual-accounts/${accountId}/withdrawal-settings`,
    settings
  );
  return response.data!;
};

export const virtualAccountsApi = {
  //TODO: see if you can pass in params for getVirtualAccounts like below
  // getVirtualAccounts: (params?: VirtualAccountQueryParams) => fetchAllVirtualAccounts(),
  getVirtualAccounts: () => fetchAllVirtualAccounts(),
  getVirtualAccount: (accountId: string) => fetchVirtualAccountById(accountId),
  getUserVirtualAccounts: () => fetchAllVirtualAccounts(), // filter client-side or add endpoint
  //TODO: see if you need to pass user string for fetching virtual accounts
  // getUserVirtualAccounts: (userId: string) => fetchAllVirtualAccounts(), // filter client-side or add endpoint
  getPropertyVirtualAccount: (propertyId: string) => fetchPropertyVirtualAccount(propertyId),
  createVirtualAccount: (data: CreateVirtualAccountRequest) => createVirtualAccount(data),
  activateVirtualAccount: (accountId: string) => reactivateVirtualAccount(accountId),
  deactivateVirtualAccount: (accountId: string) => deactivateVirtualAccount(accountId),
  updateVirtualAccountName: (accountId: string, name: string) => updateVirtualAccount(accountId, { accountName: name }),
  deleteVirtualAccount: (accountId: string) => deactivateVirtualAccount(accountId), // no delete endpoint exists yet
  //TODO: see if you may need to pass data in to reconcileAccount like the below
  // reconcileAccount: (data: any) => Promise.reject(new Error('Reconcile not yet implemented')),
  reconcileAccount: () => Promise.reject(new Error('Reconcile not yet implemented')),
};