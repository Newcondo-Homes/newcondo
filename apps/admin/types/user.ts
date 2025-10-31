/**
 * Admin Dashboard - User Types
 * Location: apps/admin/src/types/user.ts
 */

export enum Role {
  OWNER = "OWNER",
  AGENT = "AGENT",
  RENTER = "RENTER",
  ADMIN = "ADMIN",
}

export enum UserType {
  LANDLORD = "LANDLORD",
  PROPERTY_MANAGER = "PROPERTY_MANAGER",
  AGENT = "AGENT",
  RENTER = "RENTER",
  ADMIN = "ADMIN",
}

export enum VerificationStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
}

export interface User {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  emailVerified: Date | null;
  phoneVerified: Date | null;
  image: string | null;
  role: Role;
  userType: UserType | null;
  
  // Verification
  verificationStatus: VerificationStatus;
  verificationRejectionReason: string | null;
  verifiedAt: Date | null;
  verifiedBy: string | null;
  
  // Profile
  dateOfBirth: Date | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  
  // B2B
  companyName: string | null;
  businessRegNumber: string | null;
  isB2BCustomer: boolean;
  
  // Premium
  isPremium: boolean;
  premiumExpiresAt: Date | null;
  
  // Referral
  referralCode: string;
  
  // Agent specific
  isAvailableForMarking: boolean;
  agentServiceAreas: string[];
  agentReliabilityScore: number | null;
  totalMarkingJobs: number;
  completedMarkingJobs: number;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface UserListItem {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: Role;
  userType: UserType | null;
  verificationStatus: VerificationStatus;
  isPremium: boolean;
  isB2BCustomer: boolean;
  createdAt: Date;
}

export interface UserDetails extends User {
  properties: number;
  rentals: number;
  payments: number;
  totalSpent: number;
  supportTickets: number;
  documents: number;
}

export interface UserFilters {
  search?: string;
  role?: Role;
  userType?: UserType;
  verificationStatus?: VerificationStatus;
  isPremium?: boolean;
  isB2BCustomer?: boolean;
  isAvailableForMarking?: boolean;
  state?: string;
  city?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface UserAction {
  action: "verify" | "reject" | "suspend" | "activate" | "delete";
  userId: string;
  reason?: string;
  notes?: string;
}

export interface UserVerificationRequest {
  userId: string;
  action: "approve" | "reject";
  reason?: string;
  notes?: string;
}

export interface UserSuspension {
  userId: string;
  reason: string;
  duration?: number; // days, null for permanent
  notes?: string;
}

export interface UserStats {
  totalUsers: number;
  verifiedUsers: number;
  pendingVerifications: number;
  rejectedUsers: number;
  premiumUsers: number;
  b2bCustomers: number;
  activeAgents: number;
  newUsersThisMonth: number;
}

export interface AgentPerformance {
  userId: string;
  name: string | null;
  email: string;
  totalMarkingJobs: number;
  completedMarkingJobs: number;
  completionRate: number;
  reliabilityScore: number | null;
  averageCompletionTime: number | null; // hours
  serviceAreas: string[];
  isAvailable: boolean;
}