// backend/property-service/src/types/rentalHistory.ts

import { RentalStatus } from '@prisma/client';

export interface RentalHistoryRecord {
  id: string;
  propertyId: string;
  unitId?: string;
  propertyTitle: string;
  unitNumber?: string;
  
  // Renter Information
  renter: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  
  // Rental Period
  startDate: Date;
  endDate?: Date;
  duration: number; // in days
  status: RentalStatus;
  
  // Financial Information
  monthlyRent: number;
  totalPaid: number;
  outstandingBalance: number;
  
  // Payment History
  payments: Array<{
    id: string;
    amount: number;
    paidAt: Date;
    method: string;
    status: string;
  }>;
  
  // Confirmation Details
  confirmationDeadline?: Date;
  isConfirmed: boolean;
  confirmedAt?: Date;
  
  // Agent Information (if applicable)
  listingAgent?: {
    id: string;
    name: string;
    commission: number;
  };
  referringAgent?: {
    id: string;
    name: string;
    commission: number;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

export interface RentalHistoryFilters {
  propertyId?: string;
  unitId?: string;
  status?: RentalStatus;
  startDateFrom?: Date;
  startDateTo?: Date;
  endDateFrom?: Date;
  endDateTo?: Date;
  renterId?: string;
  minRent?: number;
  maxRent?: number;
  isConfirmed?: boolean;
  sortBy?: 'startDate' | 'endDate' | 'monthlyRent' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface RentalSummary {
  totalRentals: number;
  activeRentals: number;
  completedRentals: number;
  pendingConfirmation: number;
  
  // Financial Summary
  totalRevenue: number;
  averageRentalValue: number;
  totalOutstanding: number;
  
  // Duration Metrics
  averageRentalDuration: number;
  longestRental: number;
  shortestRental: number;
  
  // Recent Activity
  recentRentals: RentalHistoryRecord[];
  upcomingExpirations: Array<{
    rentalId: string;
    propertyTitle: string;
    unitNumber?: string;
    renterName: string;
    expiryDate: Date;
    daysRemaining: number;
  }>;
}

export interface PropertyRentalTimeline {
  propertyId: string;
  propertyTitle: string;
  
  timeline: Array<{
    startDate: Date;
    endDate?: Date;
    rentalId: string;
    renterName: string;
    monthlyRent: number;
    status: RentalStatus;
    duration: number;
  }>;
  
  // Vacancy Analysis
  totalDays: number;
  occupiedDays: number;
  vacantDays: number;
  occupancyRate: number;
  
  // Revenue Analysis
  totalRevenue: number;
  averageMonthlyRevenue: number;
  revenuePerDay: number;
}

export interface TenantRentalProfile {
  renterId: string;
  renterName: string;
  renterEmail: string;
  
  // Rental History with this Owner/Agent
  totalRentals: number;
  activeRentals: number;
  completedRentals: number;
  
  // Reliability Metrics
  averageRentalDuration: number;
  onTimePaymentRate: number;
  totalRevenue: number;
  
  // Current Rentals
  currentRentals: Array<{
    propertyTitle: string;
    unitNumber?: string;
    startDate: Date;
    monthlyRent: number;
  }>;
  
  // Past Rentals
  rentalHistory: RentalHistoryRecord[];
}

export interface PaymentHistoryItem {
  id: string;
  rentalId: string;
  propertyTitle: string;
  unitNumber?: string;
  renterName: string;
  
  amount: number;
  paymentType: string;
  paymentMethod?: string;
  status: string;
  
  // Commission Distribution
  ownerAmount?: number;
  agentCommission?: number;
  platformFee?: number;
  
  paidAt?: Date;
  createdAt: Date;
}

export interface RentalRevenueBreakdown {
  period: 'monthly' | 'quarterly' | 'yearly';
  data: Array<{
    period: string;
    totalRevenue: number;
    rentPayments: number;
    commissions: number;
    platformFees: number;
    netIncome: number;
  }>;
}

export interface RentalExpirationAlert {
  rentalId: string;
  propertyId: string;
  unitId?: string;
  propertyTitle: string;
  unitNumber?: string;
  
  renter: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  
  expiryDate: Date;
  daysRemaining: number;
  monthlyRent: number;
  
  alertLevel: 'INFO' | 'WARNING' | 'CRITICAL';
  renewalStatus?: 'NOT_STARTED' | 'IN_PROGRESS' | 'RENEWED' | 'DECLINED';
}