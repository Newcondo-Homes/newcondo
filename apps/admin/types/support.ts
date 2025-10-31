/**
 * Admin Dashboard - Support Types
 * Location: apps/admin/src/types/support.ts
 */

export enum TicketCategory {
  TECHNICAL = "TECHNICAL",
  BILLING = "BILLING",
  PROPERTY = "PROPERTY",
  VERIFICATION = "VERIFICATION",
  GENERAL = "GENERAL",
}

export enum TicketPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export enum TicketStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
}

export interface SupportTicket {
  id: string;
  
  // User info
  userId: string;
  userName: string | null;
  userEmail: string;
  userPhone: string | null;
  
  // Ticket details
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  
  // Admin response
  adminResponse: string | null;
  resolvedBy: string | null;
  resolvedByName: string | null;
  resolvedAt: Date | null;
  
  // Metadata
  attachments: string[]; // URLs to attached files
  tags: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string | null;
  senderType: "user" | "admin";
  message: string;
  attachments: string[];
  isInternal: boolean; // Internal admin notes
  createdAt: Date;
}

export interface TicketListItem {
  id: string;
  userName: string | null;
  userEmail: string;
  title: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  lastUpdated: Date;
  createdAt: Date;
}

export interface TicketResponse {
  ticketId: string;
  response: string;
  status?: TicketStatus;
  attachments?: string[];
  isInternal?: boolean;
  respondedBy: string; // Admin ID
}

export interface BulkTicketAction {
  ticketIds: string[];
  action: "close" | "resolve" | "reassign" | "change_priority";
  priority?: TicketPriority;
  assignedTo?: string; // Admin ID
  notes?: string;
}

export interface TicketFilters {
  search?: string;
  status?: TicketStatus;
  category?: TicketCategory;
  priority?: TicketPriority;
  userId?: string;
  assignedTo?: string;
  dateFrom?: Date;
  dateTo?: Date;
  tags?: string[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface TicketStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  averageResponseTime: number; // hours
  averageResolutionTime: number; // hours
  todayCreated: number;
  todayResolved: number;
  thisWeekCreated: number;
  thisWeekResolved: number;
}

export interface TicketCategoryStats {
  category: TicketCategory;
  total: number;
  open: number;
  resolved: number;
  averageResolutionTime: number;
}

export interface TicketTimeline {
  id: string;
  ticketId: string;
  event: string;
  description: string;
  performedBy: string | null;
  performedByName: string | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
}

export interface TicketAssignment {
  ticketId: string;
  assignedTo: string; // Admin ID
  assignedBy: string; // Admin ID
  notes?: string;
}

export interface TicketEscalation {
  ticketId: string;
  reason: string;
  escalatedTo: string; // Senior admin ID
  escalatedBy: string; // Admin ID
  notes?: string;
}

export interface SupportAnalytics {
  period: string; // "daily", "weekly", "monthly"
  startDate: Date;
  endDate: Date;
  ticketsCreated: number;
  ticketsResolved: number;
  averageResponseTime: number;
  averageResolutionTime: number;
  satisfactionScore: number | null;
  categoryBreakdown: TicketCategoryStats[];
  topIssues: {
    title: string;
    count: number;
    category: TicketCategory;
  }[];
}

export interface TicketTemplate {
  id: string;
  name: string;
  category: TicketCategory;
  subject: string;
  body: string;
  tags: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AutoResponse {
  id: string;
  category: TicketCategory;
  keywords: string[];
  response: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}