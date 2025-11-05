// backend/payment-service/src/types/commission.ts

export interface CommissionDashboard {
  summary: {
    totalEarnings: string;
    pendingEarnings: string;
    releasedEarnings: string;
    availableBalance: string;
    totalTransactions: number;
  };
  recentEarnings: RecentEarning[];
}

export interface RecentEarning {
  id: string;
  type: 'listing_agent' | 'sub_agent';
  propertyTitle: string;
  propertyAddress: string;
  propertyImage: string | null;
  amount: number;
  commission: number;
  status: string;
  isReleased: boolean;
  date: string;
}

export interface CommissionBreakdown {
  rentAmount: number;
  platformCommission: number;
  platformCommissionPercentage: number;
  listingAgentCommission: number;
  subAgentCommission: number;
  propertyOwnerAmount: number;
  newcondoAmount: number;
  flutterwaveFee: number;
  transactionFee: number;
  totalDeductions: number;
}

export interface PaymentCommissionBreakdown {
  payment: {
    id: string;
    amount: number;
    status: string;
    paidAt: string | null;
    isReleased: boolean;
    releasedAt: string | null;
    confirmationPeriodEnd: string | null;
  };
  property: {
    id: string;
    title: string;
    address: string;
  };
  breakdown: CommissionBreakdown;
  parties: {
    owner: {
      id: string;
      name: string | null;
      email: string;
    };
    listingAgent: {
      id: string;
      name: string | null;
      email: string;
    } | null;
    subAgent: {
      id: string;
      name: string | null;
      email: string;
    } | null;
  };
}

export interface EarningsSummary {
  totalEarnings: string;
  breakdown: {
    listingAgent: {
      earnings: string;
      transactions: number;
      totalRentCollected: string;
    };
    subAgent: {
      earnings: string;
      transactions: number;
      totalRentCollected: string;
    };
    markingJobs: {
      earnings: string;
      jobs: number;
      totalFeesCollected: string;
    };
  };
  totalTransactions: number;
  averageEarningPerTransaction: string;
}

export interface CommissionHistoryItem {
  id: string;
  type: 'listing_agent' | 'sub_agent';
  property: {
    id: string;
    title: string;
    address: string;
    image: string | null;
  };
  renter: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  rentAmount: string;
  commission: string;
  status: string;
  isReleased: boolean;
  releasedAt: string | null;
  confirmationPeriodEnd: string | null;
  date: string;
  createdAt: string;
}

export interface CommissionHistoryResponse {
  history: CommissionHistoryItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface PendingEarningsItem {
  id: string;
  type: 'listing_agent' | 'sub_agent';
  property: {
    id: string;
    title: string;
    address: string;
    image: string | null;
  };
  commission: string;
  confirmationPeriodEnd: string | null;
  paidAt: string;
}

export interface PendingEarnings {
  totalPending: string;
  items: PendingEarningsItem[];
}

export interface ReleasedEarningsItem {
  id: string;
  type: 'listing_agent' | 'sub_agent';
  property: {
    id: string;
    title: string;
    address: string;
    image: string | null;
  };
  commission: string;
  releasedAt: string;
}

export interface ReleasedEarnings {
  totalReleased: string;
  earnings: ReleasedEarningsItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface PropertyEarnings {
  property: {
    id: string;
    title: string;
    address: string;
    image: string | null;
  };
  totalEarnings: string;
  totalTransactions: number;
  listingAgentEarnings: string;
  subAgentEarnings: string;
  totalRentCollected: string;
}

export interface EarningsByProperty {
  properties: PropertyEarnings[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface EarningsAnalytics {
  period: 'week' | 'month' | 'year';
  startDate: string;
  endDate: string;
  earningsOverTime: Array<{
    date: string;
    amount: string;
  }>;
  totalForPeriod: string;
}