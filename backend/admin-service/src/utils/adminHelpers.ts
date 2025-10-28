// backend/admin-service/src/utils/adminHelpers.ts

import { AdminPermission } from '../types/admin';

/**
 * Check if admin has required permission
 */
export const hasPermission = (
  adminPermissions: AdminPermission[],
  requiredPermission: AdminPermission
): boolean => {
  return (
    adminPermissions.includes(AdminPermission.SUPER_ADMIN) ||
    adminPermissions.includes(requiredPermission)
  );
};

/**
 * Check if admin has any of the required permissions
 */
export const hasAnyPermission = (
  adminPermissions: AdminPermission[],
  requiredPermissions: AdminPermission[]
): boolean => {
  if (adminPermissions.includes(AdminPermission.SUPER_ADMIN)) {
    return true;
  }
  
  return requiredPermissions.some(permission =>
    adminPermissions.includes(permission)
  );
};

/**
 * Check if admin has all required permissions
 */
export const hasAllPermissions = (
  adminPermissions: AdminPermission[],
  requiredPermissions: AdminPermission[]
): boolean => {
  if (adminPermissions.includes(AdminPermission.SUPER_ADMIN)) {
    return true;
  }
  
  return requiredPermissions.every(permission =>
    adminPermissions.includes(permission)
  );
};

/**
 * Generate unique ticket number
 */
export const generateTicketNumber = (): string => {
  const prefix = 'TKT';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Calculate time difference in hours
 */
export const calculateHoursDifference = (startDate: Date, endDate: Date): number => {
  const diffMs = endDate.getTime() - startDate.getTime();
  return diffMs / (1000 * 60 * 60);
};

/**
 * Calculate average from array of numbers
 */
export const calculateAverage = (numbers: number[]): number => {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return sum / numbers.length;
};

/**
 * Calculate median from array of numbers
 */
export const calculateMedian = (numbers: number[]): number => {
  if (numbers.length === 0) return 0;
  
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  
  return sorted[mid];
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return (value / total) * 100;
};

/**
 * Format currency (NGN)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(amount);
};

/**
 * Format date to readable string
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return formatDate(date);
};

/**
 * Sanitize search query
 */
export const sanitizeSearchQuery = (query: string): string => {
  return query.trim().toLowerCase().replace(/[^\w\s]/gi, '');
};

/**
 * Generate pagination metadata
 */
export const generatePaginationMeta = (
  total: number,
  page: number,
  limit: number
) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Nigerian format)
 */
export const isValidNigerianPhone = (phone: string): boolean => {
  const phoneRegex = /^(\+234|0)[789]\d{9}$/;
  return phoneRegex.test(phone);
};

/**
 * Mask sensitive data
 */
export const maskEmail = (email: string): string => {
  const [username, domain] = email.split('@');
  if (!username || !domain) return email;
  
  const visibleChars = Math.min(3, Math.floor(username.length / 2));
  const masked = username.substring(0, visibleChars) + '***';
  return `${masked}@${domain}`;
};

export const maskPhone = (phone: string): string => {
  if (phone.length < 4) return phone;
  const last4 = phone.slice(-4);
  const masked = '*'.repeat(phone.length - 4);
  return masked + last4;
};

/**
 * Generate random string
 */
export const generateRandomString = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Sleep/delay function
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Chunk array into smaller arrays
 */
export const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

/**
 * Remove duplicates from array
 */
export const removeDuplicates = <T>(array: T[]): T[] => {
  return [...new Set(array)];
};

/**
 * Group array by key
 */
export const groupBy = <T>(
  array: T[],
  key: keyof T
): Record<string, T[]> => {
  return array.reduce((acc, item) => {
    const groupKey = String(item[key]);
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(item);
    return acc;
  }, {} as Record<string, T[]>);
};

/**
 * Sort array by key
 */
export const sortBy = <T>(
  array: T[],
  key: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

/**
 * Truncate text
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

/**
 * Calculate distance between two coordinates (in km)
 */
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (deg: number): number => {
  return (deg * Math.PI) / 180;
};

/**
 * Retry function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = baseDelay * Math.pow(2, i);
      await sleep(delay);
    }
  }
  throw new Error('Max retries exceeded');
};

/**
 * Parse date range
 */
export const parseDateRange = (
  range: 'today' | 'week' | 'month' | 'year' | 'custom',
  customFrom?: Date,
  customTo?: Date
): { from: Date; to: Date } => {
  const now = new Date();
  let from: Date;
  const to = new Date(now);
  
  switch (range) {
    case 'today':
      from = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'week':
      from = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'month':
      from = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case 'year':
      from = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    case 'custom':
      from = customFrom || new Date(now.setDate(now.getDate() - 30));
      to.setTime(customTo?.getTime() || Date.now());
      break;
    default:
      from = new Date(now.setDate(now.getDate() - 30));
  }
  
  return { from, to };
};