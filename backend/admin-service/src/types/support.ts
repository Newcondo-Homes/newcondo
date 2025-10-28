// backend/admin-service/src/types/support.ts

export interface SupportTicketDetails {
  id: string;
  ticketNumber: string; // Human-readable ticket number
  
  // User Information
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  userType: 'LANDLORD' | 'PROPERTY_MANAGER' | 'AGENT' | 'RENTER';
  
  // Ticket Details
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  
  // Related Entities
  relatedPropertyId?: string;
  relatedPaymentId?: string;
  relatedMarkingJobId?: string;
  
  // Attachments
  attachments: TicketAttachment[];
  
  // Admin Response
  assignedToAdminId?: string;
  assignedToAdminName?: string;
  adminResponse?: string;
  internalNotes?: string;
  
  // Resolution
  resolvedBy?: string;
  resolvedByName?: string;
  resolvedAt?: Date;
  resolutionTime?: number; // in hours
  resolutionSummary?: string;
  
  // User Feedback
  userSatisfactionRating?: number; // 1-5
  userFeedback?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  firstResponseAt?: Date;
  lastActivityAt?: Date;
}

export enum TicketCategory {
  TECHNICAL = 'TECHNICAL',
  BILLING = 'BILLING',
  PROPERTY = 'PROPERTY',
  VERIFICATION = 'VERIFICATION',
  MARKING_SERVICE = 'MARKING_SERVICE',
  PAYMENT = 'PAYMENT',
  ACCOUNT = 'ACCOUNT',
  GENERAL = 'GENERAL',
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_USER = 'WAITING_USER',
  WAITING_ADMIN = 'WAITING_ADMIN',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  REOPENED = 'REOPENED',
}

export interface TicketAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface TicketResponse {
  ticketId: string;
  adminId: string;
  response: string;
  isPublic: boolean; // visible to user or internal only
  attachments?: TicketAttachment[];
  timestamp: Date;
}

export interface TicketAssignment {
  ticketId: string;
  assignedToAdminId: string;
  assignedByAdminId: string;
  reason?: string;
  timestamp: Date;
}

export interface TicketEscalation {
  ticketId: string;
  escalatedBy: string;
  escalatedTo?: string;
  reason: string;
  newPriority: TicketPriority;
  timestamp: Date;
}

export interface SupportTicketStats {
  total: number;
  open: number;
  inProgress: number;
  waitingUser: number;
  waitingAdmin: number;
  resolved: number;
  closed: number;
  
  // By Priority
  urgent: number;
  high: number;
  medium: number;
  low: number;
  
  // By Category
  byCategory: Record<TicketCategory, number>;
  
  // Performance Metrics
  averageFirstResponseTime: number; // in hours
  averageResolutionTime: number; // in hours
  satisfactionScore: number; // average rating
  
  // Today's Stats
  createdToday: number;
  resolvedToday: number;
  overdueTickets: number; // open > 48 hours
}

export interface BulkTicketAction {
  ticketIds: string[];
  adminId: string;
  action: 'ASSIGN' | 'CLOSE' | 'CHANGE_PRIORITY' | 'CHANGE_CATEGORY';
  assignToAdminId?: string;
  newPriority?: TicketPriority;
  newCategory?: TicketCategory;
  reason?: string;
}

export interface TicketFilter {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  category?: TicketCategory[];
  assignedToAdminId?: string;
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface TicketActivity {
  id: string;
  ticketId: string;
  activityType: TicketActivityType;
  performedBy: string;
  performedByName: string;
  details: string;
  oldValue?: string;
  newValue?: string;
  timestamp: Date;
}

export enum TicketActivityType {
  CREATED = 'CREATED',
  ASSIGNED = 'ASSIGNED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  PRIORITY_CHANGED = 'PRIORITY_CHANGED',
  RESPONSE_ADDED = 'RESPONSE_ADDED',
  ESCALATED = 'ESCALATED',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  REOPENED = 'REOPENED',
}

export interface TicketTemplate {
  id: string;
  name: string;
  category: TicketCategory;
  responseTemplate: string;
  variables: string[]; // e.g., ["userName", "propertyTitle"]
  isActive: boolean;
}