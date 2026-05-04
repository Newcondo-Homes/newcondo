// Client-safe enum definitions — mirrors @newcondo/db enums exactly
// ❌ NEVER import from @newcondo/db in this file
// ✅ Import from here in all client components instead

// ─── User & Auth ────────────────────────────────────────────────────────────

export const Role = {
  OWNER: "OWNER",
  AGENT: "AGENT",
  RENTER: "RENTER",
  ADMIN: "ADMIN",
} as const;

export const UserType = {
  LANDLORD: "LANDLORD",
  PROPERTY_MANAGER: "PROPERTY_MANAGER",
  AGENT: "AGENT",
  RENTER: "RENTER",
  ADMIN: "ADMIN",
} as const;

export const VerificationStatus = {
  PENDING: "PENDING",
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED",
} as const;

export const IdDocumentType = {
  NIN: "NIN",
  BVN: "BVN",
  PASSPORT: "PASSPORT",
  VOTERS_CARD: "VOTERS_CARD",
  DRIVERS_LICENSE: "DRIVERS_LICENSE",
} as const;

export const OTPType = {
  EMAIL_VERIFICATION: "EMAIL_VERIFICATION",
  PHONE_VERIFICATION: "PHONE_VERIFICATION",
  PASSWORD_RESET: "PASSWORD_RESET",
  LOGIN: "LOGIN",
} as const;

// ─── Documents ──────────────────────────────────────────────────────────────

export const DocumentType = {
  NIN: "NIN",
  BVN: "BVN",
  PASSPORT: "PASSPORT",
  VOTERS_CARD: "VOTERS_CARD",
  DRIVERS_LICENSE: "DRIVERS_LICENSE",
  SELFIE: "SELFIE",
  OWNERSHIP_DOCUMENT: "OWNERSHIP_DOCUMENT",
  CONSENT_DOCUMENT: "CONSENT_DOCUMENT",
  UNDERTAKING_DOCUMENT: "UNDERTAKING_DOCUMENT",
  BUSINESS_REGISTRATION: "BUSINESS_REGISTRATION",
  TAX_CERTIFICATE: "TAX_CERTIFICATE",
  UTILITY_BILL: "UTILITY_BILL",
  BANK_STATEMENT: "BANK_STATEMENT",
  OTHER: "OTHER",
} as const;

export const DocumentSide = {
  FRONT: "FRONT",
  BACK: "BACK",
  SINGLE: "SINGLE",
} as const;

export const DocumentStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  EXPIRED: "EXPIRED",
} as const;

// ─── Property ───────────────────────────────────────────────────────────────

export const PropertyType = {
  APARTMENT: "APARTMENT",
  HOUSE: "HOUSE",
  DUPLEX: "DUPLEX",
  ROOM: "ROOM",
  SHARED_APARTMENT: "SHARED_APARTMENT",
  OFFICE: "OFFICE",
  SHOP: "SHOP",
  WAREHOUSE: "WAREHOUSE",
} as const;

export const PropertyStatus = {
  DRAFT: "DRAFT",
  PENDING: "PENDING",
  PUBLISHED: "PUBLISHED",
  RENTED: "RENTED",
  UNAVAILABLE: "UNAVAILABLE",
} as const;

export const PropertyStructure = {
  SINGLE_UNIT: "SINGLE_UNIT",
  MULTI_FAMILY: "MULTI_FAMILY",
} as const;

export const AdminApprovalStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export const UnitStatus = {
  AVAILABLE: "AVAILABLE",
  OCCUPIED: "OCCUPIED",
  MAINTENANCE: "MAINTENANCE",
  RESERVED: "RESERVED",
} as const;

export const DuplicateStatus = {
  PENDING: "PENDING",
  CONFIRMED_DUPLICATE: "CONFIRMED_DUPLICATE",
  NOT_DUPLICATE: "NOT_DUPLICATE",
  RESOLVED: "RESOLVED",
} as const;

// ─── Property Promotion ─────────────────────────────────────────────────────

export const PropertyPromotionType = {
  PUBLIC: "PUBLIC",
  PERMISSION_BASED: "PERMISSION_BASED",
  RESTRICTED: "RESTRICTED",
  REQUEST_BASED: "REQUEST_BASED",
} as const;

export const PromotionRequestStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

// ─── Marking Jobs ───────────────────────────────────────────────────────────

export const MarkingJobStatus = {
  QUEUED: "QUEUED",
  ASSIGNED: "ASSIGNED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
} as const;

export const UrgencyLevel = {
  LOW: "LOW",
  NORMAL: "NORMAL",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;

// ─── Payments ───────────────────────────────────────────────────────────────

export const PaymentType = {
  RENT: "RENT",
  DEPOSIT: "DEPOSIT",
  AGENT_COMMISSION: "AGENT_COMMISSION",
  PREMIUM_UPGRADE: "PREMIUM_UPGRADE",
  PROPERTY_MARKING: "PROPERTY_MARKING",
} as const;

export const PaymentStatus = {
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
  HELD: "HELD",
  RELEASED: "RELEASED",
} as const;

// ─── Rentals ────────────────────────────────────────────────────────────────

export const RentalStatus = {
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  TERMINATED: "TERMINATED",
  PENDING_CONFIRMATION: "PENDING_CONFIRMATION",
} as const;

// ─── Disputes ───────────────────────────────────────────────────────────────

export const DisputeStatus = {
  PENDING: "PENDING",
  UNDER_REVIEW: "UNDER_REVIEW",
  INVESTIGATING: "INVESTIGATING",
  RESOLVED: "RESOLVED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
} as const;

export const DisputeReason = {
  PROPERTY_NOT_AS_DESCRIBED: "PROPERTY_NOT_AS_DESCRIBED",
  PROPERTY_NOT_AVAILABLE: "PROPERTY_NOT_AVAILABLE",
  UNAUTHORIZED_CHARGES: "UNAUTHORIZED_CHARGES",
  FRAUDULENT_LISTING: "FRAUDULENT_LISTING",
  SAFETY_CONCERNS: "SAFETY_CONCERNS",
  PRICING_DISCREPANCY: "PRICING_DISCREPANCY",
  OTHER: "OTHER",
} as const;

export const PreferredResolution = {
  REFUND: "REFUND",
  PARTIAL_REFUND: "PARTIAL_REFUND",
  PROPERTY_FIX: "PROPERTY_FIX",
} as const;

export const DisputeResolutionOutcome = {
  FULL_REFUND: "FULL_REFUND",
  PARTIAL_REFUND: "PARTIAL_REFUND",
  NO_REFUND: "NO_REFUND",
  PROPERTY_FIX_REQUIRED: "PROPERTY_FIX_REQUIRED",
  DISMISSED: "DISMISSED",
} as const;

// ─── Referrals & Rewards ────────────────────────────────────────────────────

export const ReferralType = {
  OWNER_TO_OWNER: "OWNER_TO_OWNER",
  OWNER_TO_AGENT: "OWNER_TO_AGENT",
  OWNER_TO_RENTER: "OWNER_TO_RENTER",
  AGENT_TO_OWNER: "AGENT_TO_OWNER",
  AGENT_TO_AGENT: "AGENT_TO_AGENT",
  AGENT_TO_RENTER: "AGENT_TO_RENTER",
  RENTER_TO_RENTER: "RENTER_TO_RENTER",
} as const;

export const ReferralStatus = {
  PENDING: "PENDING",
  QUALIFIED: "QUALIFIED",
  REWARDED: "REWARDED",
  EXPIRED: "EXPIRED",
  CANCELLED: "CANCELLED",
} as const;

export const RewardType = {
  SERVICE_CREDIT: "SERVICE_CREDIT",
  SUBSCRIPTION_DISCOUNT: "SUBSCRIPTION_DISCOUNT",
  RENT_CREDIT: "RENT_CREDIT",
  COMMISSION_CREDIT: "COMMISSION_CREDIT",
  MAINTENANCE_VOUCHER: "MAINTENANCE_VOUCHER",
  CASH_REWARD: "CASH_REWARD",
} as const;

export const RewardStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  EXPIRED: "EXPIRED",
} as const;

// ─── Admin ───────────────────────────────────────────────────────────────────

export const AdminActionType = {
  USER_VERIFIED: "USER_VERIFIED",
  USER_REJECTED: "USER_REJECTED",
  PROPERTY_APPROVED: "PROPERTY_APPROVED",
  PROPERTY_REJECTED: "PROPERTY_REJECTED",
  PAYMENT_REFUNDED: "PAYMENT_REFUNDED",
  DUPLICATE_RESOLVED: "DUPLICATE_RESOLVED",
  BOUNDARY_DISPUTE_RESOLVED: "BOUNDARY_DISPUTE_RESOLVED",
  TICKET_RESOLVED: "TICKET_RESOLVED",
  AGENT_SUSPENDED: "AGENT_SUSPENDED",
} as const;

// ─── Support Tickets ────────────────────────────────────────────────────────

export const TicketCategory = {
  TECHNICAL: "TECHNICAL",
  BILLING: "BILLING",
  PROPERTY: "PROPERTY",
  VERIFICATION: "VERIFICATION",
  GENERAL: "GENERAL",
} as const;

export const TicketPriority = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;

export const TicketStatus = {
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED",
} as const;

// ─── Type helpers ────────────────────────────────────────────────────────────

export type Role = typeof Role[keyof typeof Role];
export type UserType = typeof UserType[keyof typeof UserType];
export type VerificationStatus = typeof VerificationStatus[keyof typeof VerificationStatus];
export type IdDocumentType = typeof IdDocumentType[keyof typeof IdDocumentType];
export type OTPType = typeof OTPType[keyof typeof OTPType];
export type DocumentType = typeof DocumentType[keyof typeof DocumentType];
export type DocumentSide = typeof DocumentSide[keyof typeof DocumentSide];
export type DocumentStatus = typeof DocumentStatus[keyof typeof DocumentStatus];
export type PropertyType = typeof PropertyType[keyof typeof PropertyType];
export type PropertyStatus = typeof PropertyStatus[keyof typeof PropertyStatus];
export type PropertyStructure = typeof PropertyStructure[keyof typeof PropertyStructure];
export type AdminApprovalStatus = typeof AdminApprovalStatus[keyof typeof AdminApprovalStatus];
export type UnitStatus = typeof UnitStatus[keyof typeof UnitStatus];
export type DuplicateStatus = typeof DuplicateStatus[keyof typeof DuplicateStatus];
export type PropertyPromotionType = typeof PropertyPromotionType[keyof typeof PropertyPromotionType];
export type PromotionRequestStatus = typeof PromotionRequestStatus[keyof typeof PromotionRequestStatus];
export type MarkingJobStatus = typeof MarkingJobStatus[keyof typeof MarkingJobStatus];
export type UrgencyLevel = typeof UrgencyLevel[keyof typeof UrgencyLevel];
export type PaymentType = typeof PaymentType[keyof typeof PaymentType];
export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];
export type RentalStatus = typeof RentalStatus[keyof typeof RentalStatus];
export type DisputeStatus = typeof DisputeStatus[keyof typeof DisputeStatus];
export type DisputeReason = typeof DisputeReason[keyof typeof DisputeReason];
export type PreferredResolution = typeof PreferredResolution[keyof typeof PreferredResolution];
export type DisputeResolutionOutcome = typeof DisputeResolutionOutcome[keyof typeof DisputeResolutionOutcome];
export type ReferralType = typeof ReferralType[keyof typeof ReferralType];
export type ReferralStatus = typeof ReferralStatus[keyof typeof ReferralStatus];
export type RewardType = typeof RewardType[keyof typeof RewardType];
export type RewardStatus = typeof RewardStatus[keyof typeof RewardStatus];
export type AdminActionType = typeof AdminActionType[keyof typeof AdminActionType];
export type TicketCategory = typeof TicketCategory[keyof typeof TicketCategory];
export type TicketPriority = typeof TicketPriority[keyof typeof TicketPriority];
export type TicketStatus = typeof TicketStatus[keyof typeof TicketStatus];