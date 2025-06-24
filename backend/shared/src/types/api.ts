/**
 * Standard API response interface
 */
export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data: T | null
  timestamp?: string
  statusCode?: number
}

/**
 * Error response interface with additional error details
 */
export interface ErrorResponse extends ApiResponse<null> {
  error?: {
    code?: string
    details?: any
    stack?: string
  }
}

/**
 * Paginated response interface
 */
export interface PaginatedResponse<T = any> extends ApiResponse<{
  items: T[]
  pagination: PaginationMeta
}> {}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

/**
 * API request query parameters for pagination
 */
export interface PaginationQuery {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * API request query parameters for filtering
 */
export interface FilterQuery {
  search?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  [key: string]: any
}

/**
 * Combined query parameters
 */
export interface ApiQuery extends PaginationQuery, FilterQuery {}

/**
 * Authentication response
 */
export interface AuthResponse extends ApiResponse<{
  user: UserInfo
  token: string
  refreshToken?: string
  expiresIn: string | number
}> {}

/**
 * User information in API responses
 */
export interface UserInfo {
  id: string
  email: string
  name: string | null
  role: string
  emailVerified: boolean
  phoneVerified?: boolean
  verificationStatus?: string
  image?: string | null
  createdAt: Date | string
  updatedAt?: Date | string
}

/**
 * Upload response
 */
export interface UploadResponse extends ApiResponse<{
  url: string
  publicId?: string
  filename: string
  size: number
  type: string
}> {}

/**
 * Validation error details
 */
export interface ValidationError {
  field: string
  message: string
  code?: string
  value?: any
}

/**
 * Validation error response
 */
export interface ValidationErrorResponse extends ApiResponse<null> {
  error: {
    code: 'VALIDATION_ERROR'
    details: ValidationError[]
  }
}

/**
 * OTP verification response
 */
export interface OTPResponse extends ApiResponse<{
  verified: boolean
  attemptsRemaining?: number
}> {}

/**
 * Generic list response
 */
export interface ListResponse<T = any> extends ApiResponse<T[]> {}

/**
 * Generic single item response
 */
export interface ItemResponse<T = any> extends ApiResponse<T> {}

/**
 * Status response (for operations that don't return data)
 */
export interface StatusResponse extends ApiResponse<null> {}

/**
 * Count response
 */
export interface CountResponse extends ApiResponse<{
  count: number
}> {}

/**
 * Health check response
 */
export interface HealthResponse extends ApiResponse<{
  service: string
  status: 'healthy' | 'unhealthy'
  timestamp: string
  uptime: number
  dependencies?: {
    [key: string]: 'healthy' | 'unhealthy'
  }
}> {}

/**
 * Common HTTP status codes
 */
export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504
}

/**
 * Common error codes
 */
export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Resources
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
  
  // Business Logic
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  
  // System
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // External Services
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  EMAIL_SEND_FAILED = 'EMAIL_SEND_FAILED',
  SMS_SEND_FAILED = 'SMS_SEND_FAILED'
}

/**
 * API endpoint response types for specific domains
 */

// Property-related responses
export interface PropertyResponse extends ItemResponse<{
  id: string
  title: string
  description: string
  price: number
  currency: string
  location: {
    address: string
    city: string
    state: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  images: string[]
  amenities: string[]
  status: string
  ownerId: string
  createdAt: string
  updatedAt: string
}> {}

// Payment-related responses
export interface PaymentResponse extends ItemResponse<{
  id: string
  amount: number
  currency: string
  status: string
  method: string
  reference: string
  metadata?: Record<string, any>
  createdAt: string
}> {}

// Booking-related responses
export interface BookingResponse extends ItemResponse<{
  id: string
  propertyId: string
  userId: string
  startDate: string
  endDate: string
  totalAmount: number
  status: string
  createdAt: string
}> {}

/**
 * WebSocket message types
 */
export interface WebSocketMessage<T = any> {
  type: string
  data: T
  timestamp: string
  id?: string
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  id: string
  userId: string
  action: string
  resource: string
  resourceId?: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  timestamp: string
}