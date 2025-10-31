/**
 * Admin Dashboard - Component Types
 * Location: apps/admin/src/types/components.ts
 */

import { ReactNode } from "react";

/**
 * Base Component Props
 */
export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
}

/**
 * Table Column Definition
 */
export interface TableColumn<T = any> {
  key: string;
  title: string;
  dataIndex?: keyof T;
  render?: (value: any, record: T, index: number) => ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  align?: "left" | "center" | "right";
  fixed?: "left" | "right";
  className?: string;
}

/**
 * Table Props
 */
export interface TableProps<T = any> extends BaseComponentProps {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  onRowClick?: (record: T, index: number) => void;
  rowKey?: keyof T | ((record: T) => string);
  emptyText?: string;
  selectable?: boolean;
  selectedRows?: T[];
  onSelectionChange?: (selectedRows: T[]) => void;
}

/**
 * Form Field Props
 */
export interface FormFieldProps extends BaseComponentProps {
  label?: string;
  name: string;
  type?: "text" | "email" | "password" | "number" | "textarea" | "select" | "checkbox" | "radio" | "date" | "file";
  value?: any;
  onChange?: (value: any) => void;
  onBlur?: () => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  options?: SelectOption[];
  rows?: number; // for textarea
  accept?: string; // for file input
  multiple?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

/**
 * Select Option
 */
export interface SelectOption {
  label: string;
  value: any;
  disabled?: boolean;
  icon?: ReactNode;
}

/**
 * Button Props
 */
export interface ButtonProps extends BaseComponentProps {
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  onClick?: () => void;
}

/**
 * Modal Props
 */
export interface ModalProps extends BaseComponentProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  closeOnOverlay?: boolean;
  closeOnEsc?: boolean;
  showCloseButton?: boolean;
}

/**
 * Card Props
 */
export interface CardProps extends BaseComponentProps {
  title?: string;
  subtitle?: string;
  footer?: ReactNode;
  actions?: ReactNode;
  hoverable?: boolean;
  bordered?: boolean;
  loading?: boolean;
}

/**
 * Badge Props
 */
export interface BadgeProps extends BaseComponentProps {
  variant?: "default" | "success" | "warning" | "error" | "info";
  size?: "sm" | "md" | "lg";
  dot?: boolean;
}

/**
 * Stat Card Props
 */
export interface StatCardProps extends BaseComponentProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: "increase" | "decrease";
  icon?: ReactNode;
  loading?: boolean;
  subtitle?: string;
}

/**
 * Filter Props
 */
export interface FilterProps extends BaseComponentProps {
  filters: FilterConfig[];
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
  onReset?: () => void;
  loading?: boolean;
}

/**
 * Filter Config
 */
export interface FilterConfig {
  key: string;
  label: string;
  type: "text" | "select" | "date" | "dateRange" | "number" | "numberRange" | "checkbox";
  placeholder?: string;
  options?: SelectOption[];
  defaultValue?: any;
}

/**
 * Tabs Props
 */
export interface TabsProps extends BaseComponentProps {
  tabs: TabConfig[];
  activeTab: string;
  onChange: (tabKey: string) => void;
  variant?: "default" | "pills" | "underline";
}

/**
 * Tab Config
 */
export interface TabConfig {
  key: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
  disabled?: boolean;
  badge?: number | string;
}

/**
 * Alert Props
 */
export interface AlertProps extends BaseComponentProps {
  type: "info" | "success" | "warning" | "error";
  title?: string;
  message: string;
  closable?: boolean;
  onClose?: () => void;
  icon?: ReactNode;
}

/**
 * Loading Spinner Props
 */
export interface LoadingSpinnerProps extends BaseComponentProps {
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
  text?: string;
}

/**
 * Empty State Props
 */
export interface EmptyStateProps extends BaseComponentProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

/**
 * Dropdown Props
 */
export interface DropdownProps extends BaseComponentProps {
  trigger: ReactNode;
  items: DropdownItem[];
  placement?: "bottom-start" | "bottom-end" | "top-start" | "top-end";
  closeOnClick?: boolean;
}

/**
 * Dropdown Item
 */
export interface DropdownItem {
  key: string;
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
}

/**
 * Breadcrumb Props
 */
export interface BreadcrumbProps extends BaseComponentProps {
  items: BreadcrumbItem[];
  separator?: ReactNode;
}

/**
 * Breadcrumb Item
 */
export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: ReactNode;
}

/**
 * Pagination Props
 */
export interface PaginationProps extends BaseComponentProps {
  current: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  showSizeChanger?: boolean;
  pageSizeOptions?: number[];
  showTotal?: boolean;
}

/**
 * Progress Props
 */
export interface ProgressProps extends BaseComponentProps {
  value: number;
  max?: number;
  variant?: "default" | "success" | "warning" | "error";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  striped?: boolean;
  animated?: boolean;
}

/**
 * Avatar Props
 */
export interface AvatarProps extends BaseComponentProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  shape?: "circle" | "square";
  fallbackIcon?: ReactNode;
}

/**
 * Tooltip Props
 */
export interface TooltipProps extends BaseComponentProps {
  content: ReactNode;
  placement?: "top" | "right" | "bottom" | "left";
  trigger?: "hover" | "click";
}

/**
 * Drawer Props
 */
export interface DrawerProps extends BaseComponentProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  footer?: ReactNode;
  placement?: "left" | "right" | "top" | "bottom";
  size?: number | string;
  closeOnOverlay?: boolean;
  closeOnEsc?: boolean;
}

/**
 * Confirmation Dialog Props
 */
export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}