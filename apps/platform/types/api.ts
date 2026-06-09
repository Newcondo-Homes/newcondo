// Core API Response Types
// types/api.ts

/* ============================================================
   Shared API types for the platform app.
   ============================================================ */

/**
 * The three account types Newcondo supports.
 *
 * NOTE: all three roles exist in the system and are accepted by the
 * backend. The onboarding UI only *surfaces* PROPERTY_OWNER and RENTER
 * (see `UserTypeSelector`) — AGENT accounts are created through the
 * agent-invite / promotion flow, not self-serve onboarding.
 */


/** Payload sent to the register endpoint (@newcondo/auth). */
export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  userType: UserType;
}

/** The minimal profile the onboarding flow carries between steps. */
export interface OnboardingProfile {
  name: string;
  email: string;
  phone: string;
  role: UserType;
}

/** A subscription plan option shown in the plan step. */
export interface Plan {
  id: string;
  name: string;
  tagline: string;
  /** Monthly price in naira. 0 == free. */
  price: number;
  highlight?: boolean;
  badge?: string;
  features: string[];
}

/** Result returned by the (Flutterwave) payment call. */
export interface PaymentResult {
  reference: string;
  status: "successful" | "pending" | "failed";
  amount: number;
}

export interface User {
  id: string;
  name?: string | null;
  email: string;
  phone?: string | null;
  role: 'OWNER' | 'AGENT' | 'RENTER' | 'ADMIN';
  image?: string | null;
  createdAt: string;
  updatedAt: string;
  // add other fields your UI actually needs

  // Verification fields
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verifiedAt?: string | null;        // DateTime becomes string in API responses
  verifiedBy?: string | null;
  verificationRejectionReason?: string | null;

  // Profile fields
  dateOfBirth?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;

  // Premium
  isPremium?: boolean;
  premiumExpiresAt?: string | null;

  // Agent fields
  isAvailableForMarking?: boolean;
  agentServiceAreas?: string[];
  agentReliabilityScore?: number | null;
  totalMarkingJobs?: number;
  completedMarkingJobs?: number;
}

// ADD a standalone PropertyType enum instead:
export enum PropertyType {
  APARTMENT = 'APARTMENT',
  HOUSE = 'HOUSE',
  DUPLEX = 'DUPLEX',
  ROOM = 'ROOM',
  SHARED_APARTMENT = 'SHARED_APARTMENT',
  OFFICE = 'OFFICE',
  SHOP = 'SHOP',
  WAREHOUSE = 'WAREHOUSE',
}
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface WithdrawalRequest {
  accountNumber: string;
  bankCode: string;
  amount: number;
  narration?: string;
}

export interface PaymentReleaseResponse {
  id: string
  paymentId: string
  amount: number
  currency: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  releasedAt?: string
  estimatedReleaseDate?: string
  confirmationDeadline?: string
  failureReason?: string
  createdAt: string
  updatedAt: string
}

export interface ReleaseScheduleResponse {
  id: string
  paymentId: string
  amount: number
  currency: string
  scheduledFor: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  confirmationDeadline: string
  daysRemaining: number
  property: {
    id: string
    title: string
    address: string
  }
  renter: {
    id: string
    name: string
    email: string
  }
  createdAt: string
}

export interface CommissionBreakdownResponse {
  paymentId: string
  totalAmount: number
  currency: string
  breakdown: {
    agentCommission: number
    platformFee: number
    ownerAmount: number
  }
  percentages: {
    agentCommission: number
    platformFee: number
    ownerAmount: number
  }
  releaseStatus: 'pending' | 'processing' | 'completed' | 'failed'
  releasedAt?: string
}

export interface WithdrawalResponse {
  id: string;
  status: string;
  amount: number;
  currency: string;
  reference: string;
  createdAt: string;
}

export interface WithdrawalStatusResponse extends WithdrawalResponse {
  processedAt?: string;
  failureReason?: string;
}

export interface BankAccountResponse {
  id?: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode: string;
  isDefault?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}


//   id: string;
//   email: string;
//   phone?: string;
//   firstName: string;
//   lastName: string;
//   userType: UserType;
//   profileImage?: string;
//   isVerified: boolean;
//   isEmailVerified: boolean;
//   isPhoneVerified: boolean;
//   status: UserStatus;
//   createdAt: string;
//   updatedAt: string;
//   profile?: UserProfile;
// }

export interface UserProfile {
  id: string;
  userId: string;
  dateOfBirth?: string;
  gender?: Gender;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  nationality?: string;
  occupation?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  identificationDocument?: IdentificationDocument;
  createdAt: string;
  updatedAt: string;
}

export interface IdentificationDocument {
  id: string;
  type: DocumentType;
  number: string;
  frontImageUrl: string;
  backImageUrl?: string;
  verificationStatus: VerificationStatus;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Auth Types
export interface AuthResponse<T = any> {
  user?: User;
  token?: string;
  refreshToken?: string;
  expiresAt?: string;
  success: boolean;
  data?: T;
  error?: string;
  requiresOTP?: boolean
  requiresVerification?: boolean
  message?: string;
}
export interface RegisterData {
  name?: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
  userType: UserType;
  acceptTerms?: boolean;
}

export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface OTPVerificationData {
  identifier: string
  code: string;
  type: OTPType;
}

export interface OTPResendData {
  identifier: string
  type: OTPType;
}

export interface PasswordResetData {
  email: string;
}

export interface PasswordResetConfirmData {
  token: string;
  password: string;
  confirmPassword: string;
}

// Property Types
export interface Property {
  id: string;
  title: string;
  description: string;
  type: PropertyType;
  category: PropertyCategory;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude?: number;
  longitude?: number;
  price: number;
  currency: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  areaUnit: AreaUnit;
  furnished: boolean;
  parking: boolean;
  petFriendly: boolean;
  utilities: string[];
  amenities: string[];
  rules: string[];
  images: PropertyImage[];
  documents: PropertyDocument[];
  availability: PropertyAvailability;
  owner: User;
  ownerId: string;
  status: PropertyStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  boundaries?: PropertyBoundary[];
  duplicateScore?: number;
  similarProperties?: string[];
}

export interface PropertyCreateRequest {
  title: string;
  description: string;
  type: PropertyType;
  structure?: PropertyStructure;
  category: PropertyCategory;
  address: string;
  city: string;
  state: string;
  country?: string;
  price: number;
  currency?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  areaUnit?: AreaUnit;
  furnished?: boolean;
  parking?: boolean;
  petFriendly?: boolean;
  utilities?: string[];
  amenities?: string[];
  features?: string[];
  rules?: string[];
  availability?: {
    startDate: string;
    endDate?: string;
    minimumStay?: number;
    maximumStay?: number;
    instantBooking?: boolean;
    advanceNotice?: number;
    preparationTime?: number;
  };
  /** IDs of already-uploaded images */
  imageIds?: string[];
  /** For multi-family buildings */
  totalUnits?: number;
}

export type PropertyUpdateRequest = Partial<PropertyCreateRequest>;

export interface PropertyImage {
  id: string;
  url: string;
  caption?: string;
  isPrimary: boolean;
  order: number;
  createdAt: string;
}

export interface PropertyDocument {
  id: string;
  name: string;
  type: DocumentType;
  url: string;
  size: number;
  createdAt: string;
}

export interface PropertyAvailability {
  id: string;
  startDate: string;
  endDate?: string;
  minimumStay: number;
  maximumStay?: number;
  instantBooking: boolean;
  advanceNotice: number;
  preparationTime: number;
}

export interface PropertyBoundary {
  id: string;
  propertyId: string;
  coordinates: GeoCoordinate[];
  area: number;
  perimeter: number;
  verificationStatus: VerificationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface GeoCoordinate {
  latitude: number;
  longitude: number;
}

// Booking Types
export interface Booking {
  id: string;
  propertyId: string;
  property: Property;
  guestId: string;
  guest: User;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  currency: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;
  payments: Payment[];
}

// Payment Types
export interface Payment {
  id: string;
  bookingId?: string;
  markingJobId?: string;
  amount: number;
  currency: string;
  type: PaymentType;
  method: PaymentMethod;
  status: PaymentStatus;
  reference: string;
  gatewayReference?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VirtualAccount {
  id: string;
  userId: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode: string;
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Marking Job Types
export interface MarkingJob {
  id: string;
  propertyId: string;
  property: Property;
  requesterId: string;
  requester: User;
  agentId?: string;
  agent?: User;
  scheduledDate: string;
  timeSlot: TimeSlot;
  status: MarkingJobStatus;
  priority: JobPriority;
  contactPerson: ContactPerson;
  specialInstructions?: string;
  completionNotes?: string;
  completionImages?: string[];
  paymentAmount: number;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ContactPerson {
  name: string;
  phone: string;
  relationship: string;
  alternativePhone?: string;
}

// Referral Types
export interface Referral {
  id: string;
  referrerId: string;
  referrer: User;
  referredId?: string;
  referred?: User;
  referralCode: string;
  email?: string;
  phone?: string;
  status: ReferralStatus;
  rewardAmount: number;
  rewardCurrency: string;
  rewardPaid: boolean;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Enums
export enum UserType {
  RENTER = 'RENTER',
  AGENT = 'AGENT',
  PROPERTY_OWNER = 'PROPERTY_OWNER',
  PROPERTY_MANAGER = 'PROPERTY_MANAGER',
  ADMIN = 'ADMIN'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  BANNED = 'BANNED'
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER'
}

export enum DocumentType {
  NATIONAL_ID = 'NATIONAL_ID',
  PASSPORT = 'PASSPORT',
  DRIVERS_LICENSE = 'DRIVERS_LICENSE',
  VOTERS_CARD = 'VOTERS_CARD',
  PROPERTY_DEED = 'PROPERTY_DEED',
  CERTIFICATE_OF_OCCUPANCY = 'CERTIFICATE_OF_OCCUPANCY',
  SURVEY_PLAN = 'SURVEY_PLAN',
  BUILDING_PLAN = 'BUILDING_PLAN'
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

// export enum OTPType {
//   EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
//   PHONE_VERIFICATION = 'PHONE_VERIFICATION',
//   PASSWORD_RESET = 'PASSWORD_RESET',
//   LOGIN_VERIFICATION = 'LOGIN_VERIFICATION'
// }

export type OTPType = 'EMAIL_VERIFICATION' | 'LOGIN' | 'PASSWORD_RESET'


// types/api.ts
// export enum PropertyType {
//   APARTMENT = 'APARTMENT',
//   HOUSE = 'HOUSE',
//   DUPLEX = 'DUPLEX',
//   ROOM = 'ROOM',
//   SHARED_APARTMENT = 'SHARED_APARTMENT',
//   OFFICE = 'OFFICE',
//   SHOP = 'SHOP',
//   WAREHOUSE = 'WAREHOUSE'
// }



export enum PropertyStructure {
  SINGLE_UNIT = 'SINGLE_UNIT',
  MULTI_FAMILY = 'MULTI_FAMILY',
}

export enum PropertyCategory {
  RENTAL = 'RENTAL',
  SALE = 'SALE',
  SHORT_TERM = 'SHORT_TERM'
}

export enum AreaUnit {
  SQFT = 'SQFT',
  SQM = 'SQM'
}

export enum PropertyStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  RENTED = 'RENTED',
  SOLD = 'SOLD',
  SUSPENDED = 'SUSPENDED'
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  CHECKED_OUT = 'CHECKED_OUT',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export enum PaymentType {
  BOOKING = 'BOOKING',
  MARKING_JOB = 'MARKING_JOB',
  REFERRAL_REWARD = 'REFERRAL_REWARD',
  SECURITY_DEPOSIT = 'SECURITY_DEPOSIT'
}

export enum PaymentMethod {
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  VIRTUAL_ACCOUNT = 'VIRTUAL_ACCOUNT',
  WALLET = 'WALLET'
}

export enum MarkingJobStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  RESCHEDULED = 'RESCHEDULED'
}

export enum JobPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum TimeSlot {
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON',
  EVENING = 'EVENING'
}

export enum ReferralStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED'
}

// Form Data Types
export interface PropertyFormData {
  title: string;
  description: string;
  type: PropertyType;
  category: PropertyCategory;
  address: string;
  city: string;
  state: string;
  country: string;
  price: number;
  currency: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  areaUnit: AreaUnit;
  furnished: boolean;
  parking: boolean;
  petFriendly: boolean;
  utilities: string[];
  amenities: string[];
  rules: string[];
  availability: {
    startDate: string;
    endDate?: string;
    minimumStay: number;
    maximumStay?: number;
    instantBooking: boolean;
    advanceNotice: number;
    preparationTime: number;
  };
}

export interface BookingFormData {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  specialRequests?: string;
}

export interface ProfileFormData {
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: Gender;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  nationality?: string;
  occupation?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
}

// Search and Filter Types
export interface PropertySearchParams {
  query?: string
  type?: PropertyType
  category?: PropertyCategory
  city?: string
  state?: string
  minPrice?: number
  maxPrice?: number
  bedrooms?: number
  bathrooms?: number
  furnished?: boolean
  parking?: boolean
  petFriendly?: boolean
  amenities?: string[]
  page?: number
  limit?: number
  sortBy?: 'price' | 'createdAt' | 'rating'
  sortOrder?: 'asc' | 'desc'
  // kept for backward compat with existing callers that pass filters object
  filters?: Partial<PropertyFilters>
}

export interface PropertyFilters {
  // Flat fields used by usePropertyFiltersFromURL & API calls
  city?: string
  state?: string
  propertyType?: PropertyType
  minPrice?: number
  maxPrice?: number
  bedrooms?: number
  bathrooms?: number
  amenities?: string[]
  isAvailable?: boolean

  // UI filter-panel fields (arrays / ranges)
  search?: string
  status?: string
  sortBy?: 'price' | 'createdAt' | 'updatedAt' | 'viewCount'
  sortOrder?: 'asc' | 'desc'
  type?: PropertyType[]           // multi-select variant
  priceRange?: [number, number]   // alternative to min/maxPrice
  bedroomsRange?: number[]        // alternative multi-select
  bathroomsRange?: number[]
  furnished?: boolean
  parking?: boolean
  petFriendly?: boolean

  // Pagination
  page?: number
  limit?: number
}

// Analytics Types
export interface AnalyticsData {
  totalUsers: number;
  totalProperties: number;
  totalBookings: number;
  totalRevenue: number;
  monthlyGrowth: {
    users: number;
    properties: number;
    bookings: number;
    revenue: number;
  };
  topCities: Array<{
    city: string;
    count: number;
  }>;
  propertyTypes: Array<{
    type: PropertyType;
    count: number;
  }>;
}