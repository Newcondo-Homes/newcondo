// backend/admin-service/src/types/index.ts

// Admin Types
export * from './admin';

// Verification Types
export * from './verification';

// Property Approval Types
export * from './propertyApproval';

// Boundary Dispute Types
export * from './boundaryDispute';

// Marking Oversight Types
export * from './markingOversight';

// Queue Management Types
export * from './queueManagement';

// Support Types
export * from './support';

// Analytics Types
export * from './analytics';

// Transaction Types
export * from './transaction';

// Duplicate Types
export * from './duplicate';

// Common Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: ErrorResponse;
  meta?: ResponseMeta;
}

export interface ErrorResponse {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export interface ResponseMeta {
  timestamp: Date;
  requestId?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Common Query Parameters
export interface QueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
}

// File Upload Types
export interface FileUploadResult {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}

// Notification Types
export interface NotificationPayload {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  channels: ('EMAIL' | 'SMS' | 'PUSH' | 'IN_APP')[];
}