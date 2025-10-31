/**
 * Admin Dashboard - Type Exports
 * Location: apps/admin/src/types/index.ts
 * 
 * Central export file for all admin dashboard types
 */

// Admin types
export * from "./admin";

// User types
export * from "./user";

// Verification types
export * from "./verification";

// Property types
export * from "./property";

// Dispute types
export * from "./dispute";

// Marking Job types
export * from "./markingJob";

// Payment types
export * from "./payment";

// Support types
export * from "./support";

// Analytics types
export * from "./analytics";

// Duplicate types
export * from "./duplicate";

// API types
export * from "./api";

// Component types
export * from "./components";

/**
 * Common utility types
 */

// Date range filter
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// Status badge variant mapping
export type StatusVariant = "default" | "success" | "warning" | "error" | "info";

// Action handler
export type ActionHandler<T = any> = (data: T) => void | Promise<void>;

// Async action handler
export type AsyncActionHandler<T = any, R = any> = (data: T) => Promise<R>;

// Generic ID type
export type ID = string;

// Nullable type helper
export type Nullable<T> = T | null;

// Optional type helper
export type Optional<T> = T | undefined;

// Partial deep type helper
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Array or single item
export type ArrayOrSingle<T> = T | T[];

// Make specific keys required
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

// Make specific keys optional
export type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Extract enum values
export type EnumValues<T> = T[keyof T];

/**
 * Form types
 */
export interface FormState<T = any> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
}

export interface FormHandlers<T = any> {
  handleChange: (field: keyof T, value: any) => void;
  handleBlur: (field: keyof T) => void;
  handleSubmit: (e?: React.FormEvent) => void;
  resetForm: () => void;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldError: (field: keyof T, error: string) => void;
}

/**
 * Table types
 */
export interface TableState<T = any> {
  data: T[];
  loading: boolean;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  sorting: {
    sortBy: string | null;
    sortOrder: "asc" | "desc" | null;
  };
  filters: Record<string, any>;
  selectedRows: T[];
}

export interface TableHandlers {
  handlePageChange: (page: number) => void;
  handlePageSizeChange: (pageSize: number) => void;
  handleSortChange: (sortBy: string, sortOrder: "asc" | "desc") => void;
  handleFilterChange: (filters: Record<string, any>) => void;
  handleSelectionChange: (selectedRows: any[]) => void;
  handleRefresh: () => void;
}

/**
 * Modal types
 */
export interface ModalState {
  isOpen: boolean;
  data?: any;
}

export interface ModalHandlers {
  open: (data?: any) => void;
  close: () => void;
  toggle: () => void;
}

/**
 * Toast/Notification types
 */
export interface ToastOptions {
  type: "success" | "error" | "warning" | "info";
  message: string;
  title?: string;
  duration?: number;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center";
}

/**
 * Feature flag type
 */
export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description?: string;
}

/**
 * Permission check type
 */
export type PermissionCheck = (permission: string | string[]) => boolean;

/**
 * Navigation item
 */
export interface NavigationItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  children?: NavigationItem[];
  badge?: number | string;
  disabled?: boolean;
  requiresPermission?: string | string[];
}

/**
 * Chart data types
 */
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface TimeSeriesChartData {
  date: Date | string;
  value: number;
  category?: string;
}

export interface PieChartData {
  label: string;
  value: number;
  percentage: number;
  color?: string;
}

/**
 * File upload types
 */
export interface UploadFile {
  uid: string;
  name: string;
  size: number;
  type: string;
  status: "uploading" | "done" | "error";
  url?: string;
  error?: string;
  progress?: number;
}

export interface UploadHandlers {
  beforeUpload?: (file: File) => boolean | Promise<boolean>;
  onProgress?: (progress: number, file: File) => void;
  onSuccess?: (file: UploadFile) => void;
  onError?: (error: string, file: File) => void;
  onRemove?: (file: UploadFile) => void;
}

/**
 * Metadata types
 */
export interface Metadata {
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  userId: string;
  userName: string | null;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  timestamp: Date;
}