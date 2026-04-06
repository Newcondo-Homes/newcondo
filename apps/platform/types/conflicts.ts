export interface BookingConflict {
  id: string;
  propertyId: string;
  unitId?: string;
  conflictType: 'SIMULTANEOUS_PAYMENT' | 'OVERLAPPING_RENTAL' | 'PAYMENT_LOCKED' | 'ALREADY_RENTED';
  conflictingUserId?: string;
  conflictingRentalId?: string;
  detectedAt: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  metadata?: Record<string, any>;
}

export interface ConflictCheckRequest {
  propertyId: string;
  unitId?: string;
  userId: string;
  startDate: string;
  endDate?: string;
}

export interface ConflictCheckResponse {
  hasConflict: boolean;
  conflicts: BookingConflict[];
  canProceed: boolean;
  warnings: string[];
  recommendations?: string[];
}

export interface ConflictResolutionRequest {
  conflictId: string;
  resolutionAction: 'CANCEL_FIRST' | 'CANCEL_SECOND' | 'MERGE' | 'IGNORE';
  reason: string;
}

export interface ConflictHistoryParams {
  propertyId?: string;
  unitId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  conflictType?: BookingConflict['conflictType'];
  page?: number;
  limit?: number;
}

export interface ConflictHistoryResponse {
  conflicts: BookingConflict[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface PropertyConflictStats {
  propertyId: string;
  unitId?: string;
  totalConflicts: number;
  resolvedConflicts: number;
  pendingConflicts: number;
  conflictsByType: Record<string, number>;
  lastConflictAt?: string;
  averageResolutionTime?: number; // in minutes
}
