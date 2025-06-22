import { ReactNode } from 'react';
import { 
  User, 
  Property, 
  Booking, 
  Payment, 
  MarkingJob, 
  VirtualAccount,
  PropertyFilters,
  PropertySearchParams,
  UserType,
  PropertyType,
  BookingStatus,
  PaymentStatus,
  MarkingJobStatus
} from './api';

// Layout Component Types
export interface LayoutProps {
  children: ReactNode;
  className?: string;
}

export interface DashboardLayoutProps extends LayoutProps {
  sidebar?: ReactNode;
  header?: ReactNode;
}

export interface AuthLayoutProps extends LayoutProps {
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
}

// Navigation Component Types
export interface NavItem {
  label: string;
  href: string;
  icon?: ReactNode;
  badge?: string | number;
  children?: NavItem[];
}

export interface SidebarProps {
  items: NavItem[];
  isCollapsed?: boolean;
  onToggle?: () => void;
  className?: string;
}

export interface NavbarProps {
  user?: User;
  onMenuToggle?: () => void;
  className?: string;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

// Form Component Types
export interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helpText?: string;
  className?: string;
}

export interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  maxFiles?: number;
  onUpload: (files: File[]) => void;
  onError?: (error: string) => void;
  loading?: boolean;
  className?: string;
}

export interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  loading?: boolean;
  suggestions?: string[];
  className?: string;
}

// Auth Component Types
export interface LoginFormProps {
  onSubmit: (data: { email: string; password: string; rememberMe?: boolean }) => void;
  loading?: boolean;
  error?: string;
  className?: string;
}

export interface RegisterFormProps {
  onSubmit: (data: {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    userType: UserType;
    acceptTerms: boolean;
  }) => void;
  loading?: boolean;
  error?: string;
  className?: string;
}

export interface OTPVerificationProps {
  email: string;
  onVerify: (code: string) => void;
  onResend: () => void;
  loading?: boolean;
  resendLoading?: boolean;
  error?: string;
  countdown?: number;
  className?: string;
}

export interface UserTypeSelectorProps {
  value?: UserType;
  onChange: (userType: UserType) => void;
  disabled?: boolean;
  className?: string;
}

// Property Component Types
export interface PropertyCardProps {
  property: Property;
  onView?: (property: Property) => void;
  onEdit?: (property: Property) => void;
  onDelete?: (property: Property) => void;
  showActions?: boolean;
  variant?: 'default' | 'compact' | 'featured';
  className?: string;
}

export interface PropertyGridProps {
  properties: Property[];
  loading?: boolean;
  onPropertyClick?: (property: Property) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  className?: string;
}

export interface PropertyFormProps {
  property?: Property;
  onSubmit: (data: PropertyFormData) => void;
  loading?: boolean;
  error?: string;
  className?: string;
}

export interface PropertyDetailsProps {
  property: Property;
  onBook?: (property: Property) => void;
  onContact?: (property: Property) => void;
  onReport?: (property: Property) => void;
  className?: string;
}

export interface PropertySearchProps {
  onSearch: (params: PropertySearchParams) => void;
  loading?: boolean;
  className?: string;
}

export interface PropertyFiltersProps {
  filters: PropertyFilters;
  onChange: (filters: PropertyFilters) => void;
  onReset: () => void;
  className?: string;
}

export interface ImageUploaderProps {
  images: string[];
  onUpload: (files: File[]) => void;
  onRemove: (index: number) => void;
  onReorder?: (startIndex: number, endIndex: number) => void;
  maxImages?: number;
  loading?: boolean;
  error?: string;
  className?: string;
}

export interface DocumentUploaderProps {
  documents: Array<{ name: string; url: string; type: string }>;
  onUpload: (files: File[]) => void;
  onRemove: (index: number) => void;
  acceptedTypes?: string[];
  maxSize?: number;
  loading?: boolean;
  error?: string;
  className?: string;
}

// Booking Component Types
export interface BookingCardProps {
  booking: Booking;
  onView?: (booking: Booking) => void;
  onCancel?: (booking: Booking) => void;
  onModify?: (booking: Booking) => void;
  showActions?: boolean;
  className?: string;
}

export interface BookingFormProps {
  property: Property;
  onSubmit: (data: BookingFormData) => void;
  loading?: boolean;
  error?: string;
  className?: string;
}

export interface BookingStatusProps {
  status: BookingStatus;
  showLabel?: boolean;
  className?: string;
}

// Payment Component Types
export interface PaymentFormProps {
  amount: number;
  currency: string;
  onSubmit: (data: PaymentFormData) => void;
  loading?: boolean;
  error?: string;
  className?: string;
}

export interface PaymentHistoryProps {
  payments: Payment[];
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  className?: string;
}

export interface PaymentStatusProps {
  status: PaymentStatus;
  showLabel?: boolean;
  className?: string;
}

export interface VirtualAccountCardProps {
  account: VirtualAccount;
  onTopUp?: (account: VirtualAccount) => void;
  onWithdraw?: (account: VirtualAccount) => void;
  showActions?: boolean;
  className?: string;
}

// Profile Component Types
export interface ProfileFormProps {
  user: User;
  onSubmit: (data: ProfileFormData) => void;
  loading?: boolean;
  error?: string;
  className?: string;
}

export interface VerificationUploadProps {
  onUpload: (files: File[], documentType: string) => void;
  loading?: boolean;
  error?: string;
  className?: string;
}

export interface VerificationStatusProps {
  status: string;
  message?: string;
  className?: string;
}

// Marking Job Component Types
export interface MarkingJobCardProps {
  job: MarkingJob;
  onView?: (job: MarkingJob) => void;
  onAccept?: (job: MarkingJob) => void;
  onReject?: (job: MarkingJob) => void;
  onComplete?: (job: MarkingJob) => void;
  showActions?: boolean;
  userType?: UserType;
  className?: string;
}

export interface MarkingJobFormProps {
  property: Property;
  onSubmit: (data: MarkingJobFormData) => void;
  loading?: boolean;
  error?: string;
  className?: string;
}

export interface AgentQueueProps {
  jobs: MarkingJob[];
  onAcceptJob: (job: MarkingJob) => void;
  onRejectJob: (job: MarkingJob) => void;
  loading?: boolean;
  className?: string;
}

export interface MarkingProgressProps {
  job: MarkingJob;
  onUpdateProgress: (jobId: string, progress: number) => void;
  onAddNote: (jobId: string, note: string) => void;
  onUploadImage: (jobId: string, files: File[]) => void;
  className?: string;
}

export interface ContactPersonFormProps {
  onSubmit: (data: ContactPersonData) => void;
  initialData?: ContactPersonData;
  loading?: boolean;
  error?: string;
  className?: string;
}

// Feedback Component Types
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  onClose?: () => void;
  className?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

// Map Component Types
export interface GoogleMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  properties?: Property[];
  selectedProperty?: Property;
  onPropertySelect?: (property: Property) => void;
  onMapClick?: (location: { lat: number; lng: number }) => void;
  className?: string;
}

export interface PropertyMarkerProps {
  property: Property;
  isSelected?: boolean;
  onClick?: (property: Property) => void;
}

export interface BoundaryPolygonProps {
  coordinates: Array<{ lat: number; lng: number }>;
  isEditable?: boolean;
  onUpdate?: (coordinates: Array<{ lat: number; lng: number }>) => void;
  className?: string;
}

// Data Types for Forms
export interface PropertyFormData {
  title: string;
  description: string;
  type: PropertyType;
  address: string;
  city: string;
  state: string;
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  furnished: boolean;
  parking: boolean;
  petFriendly: boolean;
  utilities: string[];
  amenities: string[];
  rules: string[];
}

export interface BookingFormData {
  checkIn: string;
  checkOut: string;
  guests: number;
  specialRequests?: string;
}

export interface PaymentFormData {
  method: string;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

export interface ProfileFormData {
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  occupation?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface MarkingJobFormData {
  scheduledDate: string;
  timeSlot: string;
  priority: string;
  contactPerson: ContactPersonData;
  specialInstructions?: string;
}

export interface ContactPersonData {
  name: string;
  phone: string;
  relationship: string;
  alternativePhone?: string;
}

// Table Component Types
export interface TableColumn<T = any> {
  key: string;
  title: string;
  dataIndex?: string;
  render?: (value: any, record: T, index: number) => ReactNode;
  sortable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  rowKey?: string | ((record: T) => string);
  onRow?: (record: T, index: number) => object;
  className?: string;
}

// Chart Component Types
export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }>;
}

export interface ChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  plugins?: {
    legend?: {
      display?: boolean;
      position?: 'top' | 'bottom' | 'left' | 'right';
    };
    title?: {
      display?: boolean;
      text?: string;
    };
  };
  scales?: {
    x?: {
      display?: boolean;
      title?: {
        display?: boolean;
        text?: string;
      };
    };
    y?: {
      display?: boolean;
      title?: {
        display?: boolean;
        text?: string;
      };
    };
  };
}

export interface ChartProps {
  data: ChartData;
  options?: ChartOptions;
  type?: 'line' | 'bar' | 'pie' | 'doughnut';
  className?: string;
}