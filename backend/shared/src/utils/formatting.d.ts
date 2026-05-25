/**
 * File: backend/shared/src/utils/formatting.ts
 * Formatting utilities for internationalization support
 */
import { SupportedLocale, SupportedCurrency } from '../types/i18n.types';
/**
 * Format currency with locale-specific formatting
 */
export declare const formatCurrencyUtil: (amount: number, currency?: SupportedCurrency, locale?: SupportedLocale) => string;
/**
 * Format date with locale-specific formatting
 */
export declare const formatDateUtil: (date: Date | string, locale?: SupportedLocale, options?: Intl.DateTimeFormatOptions) => string;
/**
 * Format date and time with locale-specific formatting
 */
export declare const formatDateTime: (date: Date | string, locale?: SupportedLocale, options?: Intl.DateTimeFormatOptions) => string;
/**
 * Format number with locale-specific formatting
 */
export declare const formatNumber: (num: number, locale?: SupportedLocale, options?: Intl.NumberFormatOptions) => string;
/**
 * Format percentage with locale-specific formatting
 */
export declare const formattingFormatPercentage: (value: number, locale?: SupportedLocale, decimals?: number) => string;
/**
 * Format phone number for Nigerian context
 */
export declare const formatPhoneNumber: (phone: string, locale?: SupportedLocale) => string;
/**
 * Pluralize text based on count and locale
 */
export declare const pluralize: (count: number, singular: string, plural?: string, locale?: SupportedLocale) => string;
/**
 * Format file size with locale-specific units
 */
export declare const formatFileSize: (bytes: number, locale?: SupportedLocale) => string;
/**
 * Truncate text with ellipsis
 */
export declare const truncateText: (text: string, maxLength: number) => string;
/**
 * Format list of items with locale-specific conjunctions
 */
export declare const formatList: (items: string[], locale?: SupportedLocale, type?: "conjunction" | "disjunction") => string;
//# sourceMappingURL=formatting.d.ts.map