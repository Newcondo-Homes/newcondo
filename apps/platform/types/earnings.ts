// Add these interfaces
export interface EarningsResponse {
  totalEarnings: number;
  totalCommissions: number;
  totalMarkingFees: number;
  totalReferralRewards: number;
  availableAmount: number;
  pendingAmount: number;
  lockedAmount: number;
  earningsByPeriod: EarningsPeriod[];
  topEarningProperties: TopEarningProperty[];
  topEarningPeriods: TopEarningPeriod[];
  growthRate: number;
  monthOverMonth: number;
  yearOverYear: number;
}

export interface EarningsBreakdownResponse {
  bySource: {
    listingCommissions: number;
    subAgentCommissions: number;
    markingFees: number;
    referralRewards: number;
  };
  byProperty: PropertyEarning[];
  byMonth: MonthlyEarning[];
  byStatus: {
    pending: number;
    released: number;
    withdrawn: number;
  };
  sourceDistribution: SourceDistribution[];
}

// Supporting interfaces
export interface EarningsPeriod {
  date: string;
  amount: number;
  period: string;
}

export interface TopEarningProperty {
  propertyId: string;
  propertyName: string;
  amount: number;
}

export interface TopEarningPeriod {
  period: string;
  amount: number;
}

export interface PropertyEarning {
  propertyId: string;
  propertyName: string;
  amount: number;
}

export interface MonthlyEarning {
  month: string;
  amount: number;
}

export interface SourceDistribution {
  source: string;
  percentage: number;
  amount: number;
}