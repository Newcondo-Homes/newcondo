// apps/admin/src/lib/constants/filters.ts

import {
  VerificationStatus,
  PropertyStatus,
  AdminApprovalStatus,
  DocumentStatus,
  PaymentStatus,
  MarkingJobStatus,
  TicketStatus,
  TicketPriority,
  DuplicateStatus,
  UrgencyLevel,
} from './status';
import { UserRole, UserType } from './roles';

/**
 * Filter Options for Admin Dashboard
 */

// User Filters
export const USER_ROLE_FILTERS = [
  { label: 'All Roles', value: 'all' },
  { label: 'Property Owners', value: UserRole.OWNER },
  { label: 'Agents', value: UserRole.AGENT },
  { label: 'Renters', value: UserRole.RENTER },
];

export const USER_TYPE_FILTERS = [
  { label: 'All Types', value: 'all' },
  { label: 'Landlords', value: UserType.LANDLORD },
  { label: 'Property Managers', value: UserType.PROPERTY_MANAGER },
  { label: 'Agents', value: UserType.AGENT },
  { label: 'Renters', value: UserType.RENTER },
];

export const VERIFICATION_STATUS_FILTERS = [
  { label: 'All Status', value: 'all' },
  { label: 'Pending', value: VerificationStatus.PENDING },
  { label: 'Verified', value: VerificationStatus.VERIFIED },
  { label: 'Rejected', value: VerificationStatus.REJECTED },
];

export const PREMIUM_STATUS_FILTERS = [
  { label: 'All Users', value: 'all' },
  { label: 'Premium', value: 'true' },
  { label: 'Regular', value: 'false' },
];

// Property Filters
export const PROPERTY_STATUS_FILTERS = [
  { label: 'All Status', value: 'all' },
  { label: 'Draft', value: PropertyStatus.DRAFT },
  { label: 'Pending', value: PropertyStatus.PENDING },
  { label: 'Published', value: PropertyStatus.PUBLISHED },
  { label: 'Rented', value: PropertyStatus.RENTED },
  { label: 'Unavailable', value: PropertyStatus.UNAVAILABLE },
];

export const ADMIN_APPROVAL_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Pending Review', value: AdminApprovalStatus.PENDING },
  { label: 'Approved', value: AdminApprovalStatus.APPROVED },
  { label: 'Rejected', value: AdminApprovalStatus.REJECTED },
];

export const PROPERTY_TYPE_FILTERS = [
  { label: 'All Types', value: 'all' },
  { label: 'Apartment', value: 'APARTMENT' },
  { label: 'House', value: 'HOUSE' },
  { label: 'Duplex', value: 'DUPLEX' },
  { label: 'Room', value: 'ROOM' },
  { label: 'Shared Apartment', value: 'SHARED_APARTMENT' },
  { label: 'Office', value: 'OFFICE' },
  { label: 'Shop', value: 'SHOP' },
  { label: 'Warehouse', value: 'WAREHOUSE' },
];

export const PROPERTY_STRUCTURE_FILTERS = [
  { label: 'All Structures', value: 'all' },
  { label: 'Single Unit', value: 'SINGLE_UNIT' },
  { label: 'Multi-Family', value: 'MULTI_FAMILY' },
];

export const BOUNDARY_VERIFICATION_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Verified', value: 'true' },
  { label: 'Not Verified', value: 'false' },
];

// Document Filters
export const DOCUMENT_STATUS_FILTERS = [
  { label: 'All Status', value: 'all' },
  { label: 'Pending', value: DocumentStatus.PENDING },
  { label: 'Approved', value: DocumentStatus.APPROVED },
  { label: 'Rejected', value: DocumentStatus.REJECTED },
  { label: 'Expired', value: DocumentStatus.EXPIRED },
];

export const DOCUMENT_TYPE_FILTERS = [
  { label: 'All Types', value: 'all' },
  { label: 'Identity Documents', value: 'identity' },
  { label: 'Property Documents', value: 'property' },
  { label: 'Business Documents', value: 'business' },
  { label: 'Utility Documents', value: 'utility' },
];

// Payment Filters
export const PAYMENT_STATUS_FILTERS = [
  { label: 'All Status', value: 'all' },
  { label: 'Pending', value: PaymentStatus.PENDING },
  { label: 'Success', value: PaymentStatus.SUCCESS },
  { label: 'Failed', value: PaymentStatus.FAILED },
  { label: 'Held', value: PaymentStatus.HELD },
  { label: 'Released', value: PaymentStatus.RELEASED },
  { label: 'Refunded', value: PaymentStatus.REFUNDED },
];

export const PAYMENT_TYPE_FILTERS = [
  { label: 'All Types', value: 'all' },
  { label: 'Rent', value: 'RENT' },
  { label: 'Deposit', value: 'DEPOSIT' },
  { label: 'Agent Commission', value: 'AGENT_COMMISSION' },
  { label: 'Premium Upgrade', value: 'PREMIUM_UPGRADE' },
  { label: 'Property Marking', value: 'PROPERTY_MARKING' },
];

// Marking Job Filters
export const MARKING_STATUS_FILTERS = [
  { label: 'All Status', value: 'all' },
  { label: 'Queued', value: MarkingJobStatus.QUEUED },
  { label: 'Assigned', value: MarkingJobStatus.ASSIGNED },
  { label: 'In Progress', value: MarkingJobStatus.IN_PROGRESS },
  { label: 'Completed', value: MarkingJobStatus.COMPLETED },
  { label: 'Cancelled', value: MarkingJobStatus.CANCELLED },
  { label: 'Expired', value: MarkingJobStatus.EXPIRED },
];

export const URGENCY_LEVEL_FILTERS = [
  { label: 'All Levels', value: 'all' },
  { label: 'Low', value: UrgencyLevel.LOW },
  { label: 'Normal', value: UrgencyLevel.NORMAL },
  { label: 'High', value: UrgencyLevel.HIGH },
  { label: 'Urgent', value: UrgencyLevel.URGENT },
];

export const AGENT_AVAILABILITY_FILTERS = [
  { label: 'All Agents', value: 'all' },
  { label: 'Available', value: 'true' },
  { label: 'Unavailable', value: 'false' },
];

// Support Ticket Filters
export const TICKET_STATUS_FILTERS = [
  { label: 'All Status', value: 'all' },
  { label: 'Open', value: TicketStatus.OPEN },
  { label: 'In Progress', value: TicketStatus.IN_PROGRESS },
  { label: 'Resolved', value: TicketStatus.RESOLVED },
  { label: 'Closed', value: TicketStatus.CLOSED },
];

export const TICKET_PRIORITY_FILTERS = [
  { label: 'All Priorities', value: 'all' },
  { label: 'Low', value: TicketPriority.LOW },
  { label: 'Medium', value: TicketPriority.MEDIUM },
  { label: 'High', value: TicketPriority.HIGH },
  { label: 'Urgent', value: TicketPriority.URGENT },
];

export const TICKET_CATEGORY_FILTERS = [
  { label: 'All Categories', value: 'all' },
  { label: 'Technical', value: 'TECHNICAL' },
  { label: 'Billing', value: 'BILLING' },
  { label: 'Property', value: 'PROPERTY' },
  { label: 'Verification', value: 'VERIFICATION' },
  { label: 'General', value: 'GENERAL' },
];

// Duplicate Property Filters
export const DUPLICATE_STATUS_FILTERS = [
  { label: 'All Status', value: 'all' },
  { label: 'Pending', value: DuplicateStatus.PENDING },
  { label: 'Confirmed Duplicate', value: DuplicateStatus.CONFIRMED_DUPLICATE },
  { label: 'Not Duplicate', value: DuplicateStatus.NOT_DUPLICATE },
  { label: 'Resolved', value: DuplicateStatus.RESOLVED },
];

// Date Range Filters
export const DATE_RANGE_FILTERS = [
  { label: 'All Time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 Days', value: 'last_7_days' },
  { label: 'Last 30 Days', value: 'last_30_days' },
  { label: 'This Month', value: 'this_month' },
  { label: 'Last Month', value: 'last_month' },
  { label: 'Custom Range', value: 'custom' },
];

// Sort Options
export const SORT_OPTIONS = {
  users: [
    { label: 'Newest First', value: 'createdAt:desc' },
    { label: 'Oldest First', value: 'createdAt:asc' },
    { label: 'Name (A-Z)', value: 'name:asc' },
    { label: 'Name (Z-A)', value: 'name:desc' },
    { label: 'Recently Updated', value: 'updatedAt:desc' },
  ],
  properties: [
    { label: 'Newest First', value: 'createdAt:desc' },
    { label: 'Oldest First', value: 'createdAt:asc' },
    { label: 'Price (Low to High)', value: 'price:asc' },
    { label: 'Price (High to Low)', value: 'price:desc' },
    { label: 'Recently Updated', value: 'updatedAt:desc' },
    { label: 'Most Viewed', value: 'viewCount:desc' },
  ],
  payments: [
    { label: 'Newest First', value: 'createdAt:desc' },
    { label: 'Oldest First', value: 'createdAt:asc' },
    { label: 'Amount (Low to High)', value: 'amount:asc' },
    { label: 'Amount (High to Low)', value: 'amount:desc' },
  ],
  markingJobs: [
    { label: 'Newest First', value: 'createdAt:desc' },
    { label: 'Oldest First', value: 'createdAt:asc' },
    { label: 'Queue Position', value: 'queuePosition:asc' },
    { label: 'Urgency Level', value: 'urgencyLevel:desc' },
  ],
  tickets: [
    { label: 'Newest First', value: 'createdAt:desc' },
    { label: 'Oldest First', value: 'createdAt:asc' },
    { label: 'Priority (High to Low)', value: 'priority:desc' },
    { label: 'Recently Updated', value: 'updatedAt:desc' },
  ],
};

// Items per page options
export const ITEMS_PER_PAGE_OPTIONS = [
  { label: '10', value: 10 },
  { label: '25', value: 25 },
  { label: '50', value: 50 },
  { label: '100', value: 100 },
];

// Nigerian States for Location Filters
export const NIGERIAN_STATES_FILTERS = [
  { label: 'All States', value: 'all' },
  { label: 'Lagos', value: 'Lagos' },
  { label: 'Abuja', value: 'Abuja' },
  { label: 'Kano', value: 'Kano' },
  { label: 'Rivers', value: 'Rivers' },
  { label: 'Oyo', value: 'Oyo' },
  { label: 'Kaduna', value: 'Kaduna' },
  { label: 'Ogun', value: 'Ogun' },
  { label: 'Anambra', value: 'Anambra' },
  // Add more states as needed
];

/**
 * Helper function to get filter options by type
 */
export const getFilterOptions = (filterType: string) => {
  const filterMap: Record<string, any[]> = {
    userRole: USER_ROLE_FILTERS,
    userType: USER_TYPE_FILTERS,
    verificationStatus: VERIFICATION_STATUS_FILTERS,
    premiumStatus: PREMIUM_STATUS_FILTERS,
    propertyStatus: PROPERTY_STATUS_FILTERS,
    adminApproval: ADMIN_APPROVAL_FILTERS,
    propertyType: PROPERTY_TYPE_FILTERS,
    documentStatus: DOCUMENT_STATUS_FILTERS,
    documentType: DOCUMENT_TYPE_FILTERS,
    paymentStatus: PAYMENT_STATUS_FILTERS,
    paymentType: PAYMENT_TYPE_FILTERS,
    markingStatus: MARKING_STATUS_FILTERS,
    urgencyLevel: URGENCY_LEVEL_FILTERS,
    ticketStatus: TICKET_STATUS_FILTERS,
    ticketPriority: TICKET_PRIORITY_FILTERS,
    ticketCategory: TICKET_CATEGORY_FILTERS,
    duplicateStatus: DUPLICATE_STATUS_FILTERS,
    dateRange: DATE_RANGE_FILTERS,
    state: NIGERIAN_STATES_FILTERS,
  };

  return filterMap[filterType] || [];
};