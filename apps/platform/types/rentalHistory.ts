// apps/platform/types/rentalHistory.ts

import type { RentalStatus, PaymentStatus } from '@/lib/constants/propertyStatus';

/**
 * Rental History Types
 * Type definitions for rental tracking and tenant management
 */

// Rental record
export interface RentalRecord {
  id: string;
  propertyId: string;
  unitId?: string;
  renterId: string;
  
  // Property details
  propertyTitle: string;
  propertyAddress: string;
  propertyImage?: string;
  unitNumber?: string;
  
  // Renter details
  renterName: string;
  renterEmail: string;
  renterPhone?: string;
  renterImage?: string;
  
  // Rental terms
  monthlyRent: number;
  currency: string;
  startDate: Date;
  endDate?: Date;
  duration?: number; // in months
  
  // Status
  status: RentalStatus;
  isActive: boolean;
  
  // Confirmation system
  confirmationDeadline?: Date;
  isConfirmed: boolean;
  confirmedAt?: Date;
  confirmationMethod?: 'auto' | 'manual';
  
  // Payment tracking
  totalPaid: number;
  lastPaymentDate?: Date;
  nextPaymentDue?: Date;
  
  // Relations
  payments: RentalPayment[];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  terminatedAt?: Date;
}

// Rental payment record
export interface RentalPayment {
  id: string;
  rentalId: string;
  paymentId: string;
  
  // Payment details
  amount: number;
  currency: string;
  paymentType: 'rent' | 'deposit' | 'fee';
  
  // Status
  status: PaymentStatus;
  paidAt?: Date;
  
  // Confirmation period
  confirmationPeriodEnd?: Date;
  isReleased: boolean;
  releasedAt?: Date;
  
  // Flutterwave details
  flutterwaveRef?: string;
  transactionId?: string;
  
  // Commission breakdown
  platformCommission?: number;
  agentCommission?: number;
  ownerAmount?: number;
  
  // Refund information
  refundRequested: boolean;
  refundRequestedAt?: Date;
  refundReason?: string;
  refundProcessedAt?: Date;
  refundAmount?: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Rental summary
export interface RentalSummary {
  userId: string;
  role: 'owner' | 'agent';
  
  // Overview
  totalRentals: number;
  activeRentals: number;
  pendingConfirmationsNo: number;
  completedRentals: number;
  terminatedRentals: number;
  
  // Financial summary
  totalRevenue: number;
  currentMonthRevenue: number;
  averageRent: number;
  totalCommissions?: number;
  
  // Property performance
  occupancyRate: number;
  averageRentalDuration: number;
  
  // Recent activity
  recentRentals: RentalRecord[];
  upcomingExpirations: RentalRecord[];
  pendingConfirmations: RentalRecord[];
}

// Tenant details
export interface TenantDetails {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  profileImage?: string;
  
  // Current rental
  currentRental?: RentalRecord;
  
  // Rental history
  totalRentals: number;
  activeRentals: number;
  completedRentals: number;
  
  // Payment history
  totalPaid: number;
  averagePaymentTime: number; // days
  latePayments: number;
  
  // Rating and reliability
  rating?: number;
  reliabilityScore?: number;
  
  // Status
  isVerified: boolean;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  
  // Timestamps
  firstRentalDate?: Date;
  lastRentalDate?: Date;
}

// Rental confirmation request
export interface RentalConfirmationRequest {
  rentalId: string;
  propertyId: string;
  unitId?: string;
  renterId: string;
  
  // Confirmation details
  confirmationType: 'property_verified' | 'issue_reported';
  notes?: string;
  issues?: RentalIssue[];
  
  // Media
  verificationImages?: string[];
  
  // Timestamps
  confirmedAt: Date;
}

// Rental issue
export interface RentalIssue {
  id: string;
  rentalId: string;
  reportedBy: string;
  issueType: 'property_mismatch' | 'damage' | 'cleanliness' | 'amenities' | 'access' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  images?: string[];
  
  // Resolution
  status: 'reported' | 'investigating' | 'resolved' | 'disputed';
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  
  // Timestamps
  reportedAt: Date;
  updatedAt: Date;
}

// Rental filters
export interface RentalHistoryFilters {
  status?: RentalStatus[];
  startDate?: Date;
  endDate?: Date;
  propertyIds?: string[];
  renterIds?: string[];
  minAmount?: number;
  maxAmount?: number;
  isConfirmed?: boolean;
  searchQuery?: string;
}

// Rental termination request
export interface RentalTerminationRequest {
  rentalId: string;
  reason: 'tenant_request' | 'owner_request' | 'lease_violation' | 'property_sale' | 'other';
  description?: string;
  terminationDate: Date;
  noticeGiven: boolean;
  noticePeriod?: number; // days
  refundRequired: boolean;
  refundAmount?: number;
}

// Rental extension request
export interface RentalExtensionRequest {
  rentalId: string;
  newEndDate: Date;
  extensionPeriod: number; // months
  newMonthlyRent?: number;
  notes?: string;
}

// Rental statistics
export interface RentalStatistics {
  userId: string;
  timePeriod: {
    startDate: Date;
    endDate: Date;
  };
  
  // Rental metrics
  totalRentals: number;
  newRentals: number;
  renewedRentals: number;
  terminatedRentals: number;
  
  // Financial metrics
  totalRevenue: number;
  averageRent: number;
  highestRent: number;
  lowestRent: number;
  
  // Performance metrics
  occupancyRate: number;
  averageRentalDuration: number;
  confirmationRate: number;
  
  // Trends
  rentalsTrend: {
    period: string;
    count: number;
  }[];
  revenueTrend: {
    period: string;
    amount: number;
  }[];
}

// Rental dashboard data
export interface RentalDashboard {
  summary: RentalSummary;
  activeRentals: RentalRecord[];
  pendingConfirmations: RentalRecord[];
  upcomingRenewals: RentalRecord[];
  recentPayments: RentalPayment[];
  tenants: TenantDetails[];
  statistics: RentalStatistics;
}

// Rental notification
export interface RentalNotification {
  id: string;
  userId: string;
  type: 'new_rental' | 'payment_received' | 'confirmation_pending' | 'confirmation_expired' | 'rental_expiring' | 'issue_reported' | 'rental_terminated';
  title: string;
  message: string;
  rentalId?: string;
  propertyId?: string;
  amount?: number;
  read: boolean;
  createdAt: Date;
}

// Rental export options
export interface RentalExportOptions {
  format: 'csv' | 'pdf' | 'excel';
  filters: RentalHistoryFilters;
  includePayments: boolean;
  includeIssues: boolean;
  groupBy?: 'property' | 'month' | 'status';
}

// Rental API responses
export interface RentalApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Rental list response
export interface RentalListResponse {
  rentals: RentalRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Rental context type
export interface RentalContextType {
  rentals: RentalRecord[];
  summary: RentalSummary | null;
  loading: boolean;
  error: string | null;
  filters: RentalHistoryFilters;
  fetchRentals: (filters?: RentalHistoryFilters) => Promise<void>;
  confirmRental: (request: RentalConfirmationRequest) => Promise<void>;
  terminateRental: (request: RentalTerminationRequest) => Promise<void>;
  extendRental: (request: RentalExtensionRequest) => Promise<void>;
  reportIssue: (issue: Omit<RentalIssue, 'id' | 'reportedAt' | 'updatedAt'>) => Promise<void>;
  refreshData: () => Promise<void>;
}

// Tenant management interface
export interface TenantManagementInterface {
  tenants: TenantDetails[];
  totalTenants: number;
  activeTenants: number;
  
  // Actions
  viewTenantDetails: (tenantId: string) => Promise<TenantDetails>;
  getTenantRentalHistory: (tenantId: string) => Promise<RentalRecord[]>;
  getTenantPaymentHistory: (tenantId: string) => Promise<RentalPayment[]>;
  contactTenant: (tenantId: string, message: string) => Promise<void>;
}

// Rental timeline event
export interface RentalTimelineEvent {
  id: string;
  rentalId: string;
  eventType: 'created' | 'payment' | 'confirmation' | 'issue' | 'extension' | 'termination' | 'renewal';
  title: string;
  description: string;
  actor?: string; // user who triggered the event
  metadata?: Record<string, any>;
  timestamp: Date;
}

// Rental insights
export interface RentalInsights {
  rentalId?: string;
  userId: string;
  insights: {
    type: 'positive' | 'negative' | 'neutral';
    category: 'financial' | 'occupancy' | 'tenant' | 'maintenance';
    title: string;
    description: string;
    value?: number;
    recommendation?: string;
  }[];
  lastGenerated: Date;
}

// Export all types
export type {
  RentalStatus,
  PaymentStatus,
};