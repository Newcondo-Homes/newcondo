import { prisma, PaymentStatus, AdminActionType, Prisma } from '@newcondo/db';
import { Decimal, JsonValue } from '@newcondo/db';
import { addHours, isPast, formatDistanceToNow } from 'date-fns';


export interface ConfirmationFilters {
  status?: 'PENDING' | 'CONFIRMED' | 'DISPUTED' | 'CANCELLED' | 'EXPIRED' | 'ALL';
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'confirmationDeadline' | 'amount';
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface ConfirmationStats {
  total: number;
  pendingConfirmation: number;
  confirmed: number;
  disputed: number;
  expiringSoon: number;
  averageConfirmationTime: number;
  totalValueHeld: number;
}

export interface ForceReleaseParams {
  paymentId: string;
  adminId: string;
  reason: string;
  notifyParties: boolean;
}

export interface ExtendDeadlineParams {
  paymentId: string;
  adminId: string;
  extensionDays: number;
  reason: string;
}

export interface BulkActionParams {
  paymentIds: string[];
  action: 'RELEASE' | 'EXTEND' | 'CANCEL';
  adminId: string;
  reason: string;
  extensionDays?: number;
}

export interface PaymentTimeline {
  paymentId: string;
  events: TimelineEvent[];
}

export interface TimelineEvent {
  timestamp: Date;
  type: string;
  description: string;
  actor?: string;
  metadata?: JsonValue;
}

export interface CommissionBreakdown {
  totalAmount: number;
  platformFee: number;
  platformFeePercentage: string;
  agentCommission: number;
  agentCommissionPercentage: string;
  ownerAmount: number;
  ownerAmountPercentage: string;
}

export interface EnhancedConfirmation {
  timeRemaining: string | null;
  isExpiringSoon: boolean | null;
  id: string;
  userId: string;
  rentalId: string | null;
  markingJobId: string | null;
  amount: Decimal;
  currency: string;
  paymentType: string;
  paymentMethod: string | null;
  flutterwaveRef: string | null;
  transactionId: string | null;
  agentCommission: Decimal | null;
  platformFee: Decimal | null;
  ownerAmount: Decimal | null;
  confirmationPeriodEnd: Date | null;
  isReleased: boolean;
  releasedAt: Date | null;
  description: string | null;
  failureReason: string | null;
  paidAt: Date | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  };
  rental: Prisma.RentalGetPayload<{
    include: {
      property: {
        select: {
          id: true;
          title: true;
          address: true;
          city: true;
        };
      };
      unit: {
        select: {
          id: true;
          unitNumber: true;
        };
      };
    };
  }> | null;
}

export interface ConfirmationsResult {
  confirmations: EnhancedConfirmation[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ConfirmationDetails {
  payment: Prisma.PaymentGetPayload<{
    include: {
      user: {
        select: {
          id: true;
          name: true;
          email: true;
          phone: true;
          verificationStatus: true;
        };
      };
      rental: {
        include: {
          property: {
            include: {
              owner: {
                select: {
                  id: true;
                  name: true;
                  email: true;
                  phone: true;
                };
              };
              agent: {
                select: {
                  id: true;
                  name: true;
                  email: true;
                  phone: true;
                };
              };
              images: {
                where: { isPrimary: true };
                take: 1;
              };
            };
          };
          unit: true;
        };
      };
    };
  }>;
  commissionBreakdown: CommissionBreakdown;
  adminActions: Prisma.AdminActionGetPayload<{
    include: {
      admin: {
        select: {
          id: true;
          name: true;
          email: true;
        };
      };
    };
  }>[];
  timeRemaining: string | null;
  canBeReleased: boolean;
  canBeRefunded: boolean | null;
}

export interface BulkActionResult {
  succeeded: string[];
  failed: { paymentId: string; reason: string }[];
  total: number;
  successCount: number;
  failureCount: number;
}

export type UpdatedPayment = Prisma.PaymentGetPayload<Record<string, never>>;