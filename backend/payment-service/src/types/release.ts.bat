import { Decimal } from '@prisma/client/runtime/library';

export interface PaymentReleaseRequest {
  paymentId: string;
  rentalId: string;
  triggerType: 'AUTO' | 'MANUAL' | 'ADMIN_OVERRIDE';
  triggeredBy?: string; // Admin ID for manual releases
}

export interface CommissionBreakdown {
  totalRent: Decimal;
  platformCommission: Decimal; // 20% of rent
  agentShare: Decimal; // 50% of platform commission (10% of rent)
  newCondoShare: Decimal; // 50% of platform commission (10% of rent)
  propertyOwnerAmount: Decimal; // 80% of rent
  
  // Sub-agent split (if applicable)
  listingAgentShare?: Decimal; // 5% of rent (half of agent share)
  subAgentShare?: Decimal; // 5% of rent (half of agent share)
}

export interface PartyDistribution {
  virtualAccountId: string;
  userId: string;
  role: 'PROPERTY_OWNER' | 'LISTING_AGENT' | 'SUB_AGENT' | 'NEWCONDO';
  amount: Decimal;
  currency: string;
}

export interface PaymentReleaseResult {
  success: boolean;
  paymentId: string;
  rentalId: string;
  releasedAt: Date;
  totalAmount: Decimal;
  commissionBreakdown: CommissionBreakdown;
  distributions: PartyDistribution[];
  errors?: string[];
}

export interface ScheduledRelease {
  id: string;
  paymentId: string;
  rentalId: string;
  scheduledFor: Date;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  retryCount: number;
  lastError?: string;
}

export interface ReleaseJobResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  skipped: number;
  details: {
    paymentId: string;
    status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
    error?: string;
  }[];
}