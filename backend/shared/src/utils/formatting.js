"use strict";
/**
 * File: backend/shared/src/utils/formatting.ts
 * Formatting utilities for internationalization support
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatList = exports.truncateText = exports.formatFileSize = exports.pluralize = exports.formatPhoneNumber = exports.formattingFormatPercentage = exports.formatNumber = exports.formatDateTime = exports.formatDateUtil = exports.formatCurrencyUtil = void 0;
/**
 * Format currency with locale-specific formatting
 */
const formatCurrencyUtil = (amount, currency = 'NGN', locale = 'en') => {
    const localeMap = {
        en: 'en-NG',
        fr: 'fr-FR',
        pcm: 'en-NG', // Nigerian Pidgin uses same formatting as English Nigeria
    };
    try {
        return new Intl.NumberFormat(localeMap[locale], {
            style: 'currency',
            currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    }
    catch (error) {
        // Fallback to basic formatting if Intl fails
        const symbol = getCurrencySymbol(currency);
        return `${symbol}${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    }
};
exports.formatCurrencyUtil = formatCurrencyUtil;
/**
 * Get currency symbol for a given currency code
 */
const getCurrencySymbol = (currency) => {
    const symbols = {
        NGN: '₦',
        USD: '$',
        EUR: '€',
        GBP: '£',
    };
    return symbols[currency] || currency;
};
/**
 * Format date with locale-specific formatting
 */
const formatDateUtil = (date, locale = 'en', options) => {
    const localeMap = {
        en: 'en-NG',
        fr: 'fr-FR',
        pcm: 'en-NG',
    };
    const defaultOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        ...options,
    };
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    try {
        return new Intl.DateTimeFormat(localeMap[locale], defaultOptions).format(dateObj);
    }
    catch (error) {
        // Fallback to ISO string
        return dateObj.toISOString().split('T')[0];
    }
};
exports.formatDateUtil = formatDateUtil;
/**
 * Format date and time with locale-specific formatting
 */
const formatDateTime = (date, locale = 'en', options) => {
    const defaultOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        ...options,
    };
    return (0, exports.formatDateUtil)(date, locale, defaultOptions);
};
exports.formatDateTime = formatDateTime;
/**
 * Format time with locale-specific formatting
 */
const formatTime = (date, locale = 'en', options) => {
    const defaultOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: locale === 'en', // 12-hour for English, 24-hour for others
        ...options,
    };
    return (0, exports.formatDateUtil)(date, locale, defaultOptions);
};
/**
 * Format relative time (e.g., "2 hours ago")
 */
const formatRelativeTime = (date, locale = 'en') => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const localeMap = {
        en: 'en-NG',
        fr: 'fr-FR',
        pcm: 'en-NG',
    };
    try {
        const rtf = new Intl.RelativeTimeFormat(localeMap[locale], { numeric: 'auto' });
        if (diffSeconds < 60) {
            return rtf.format(-diffSeconds, 'second');
        }
        else if (diffMinutes < 60) {
            return rtf.format(-diffMinutes, 'minute');
        }
        else if (diffHours < 24) {
            return rtf.format(-diffHours, 'hour');
        }
        else if (diffDays < 30) {
            return rtf.format(-diffDays, 'day');
        }
        else {
            return (0, exports.formatDateUtil)(dateObj, locale);
        }
    }
    catch (error) {
        // Fallback for unsupported environments
        if (diffMinutes < 1)
            return 'just now';
        if (diffMinutes < 60)
            return `${diffMinutes}m ago`;
        if (diffHours < 24)
            return `${diffHours}h ago`;
        if (diffDays < 7)
            return `${diffDays}d ago`;
        return (0, exports.formatDateUtil)(dateObj, locale);
    }
};
/**
 * Format number with locale-specific formatting
 */
const formatNumber = (num, locale = 'en', options) => {
    const localeMap = {
        en: 'en-NG',
        fr: 'fr-FR',
        pcm: 'en-NG',
    };
    try {
        return new Intl.NumberFormat(localeMap[locale], options).format(num);
    }
    catch (error) {
        return num.toString();
    }
};
exports.formatNumber = formatNumber;
/**
 * Format percentage with locale-specific formatting
 */
const formattingFormatPercentage = (value, locale = 'en', decimals = 0) => {
    return (0, exports.formatNumber)(value, locale, {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
};
exports.formattingFormatPercentage = formattingFormatPercentage;
/**
 * Format phone number for Nigerian context
 */
const formatPhoneNumber = (phone, locale = 'en') => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    // Handle Nigerian phone numbers
    if (cleaned.startsWith('234')) {
        // International format: +234 XXX XXX XXXX
        return `+234 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
    }
    else if (cleaned.startsWith('0') && cleaned.length === 11) {
        // Local format: 0XXX XXX XXXX
        return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    }
    // Return as-is if format doesn't match
    return phone;
};
exports.formatPhoneNumber = formatPhoneNumber;
/**
 * Pluralize text based on count and locale
 */
const pluralize = (count, singular, plural, locale = 'en') => {
    const pluralForm = plural || `${singular}s`;
    try {
        const rules = new Intl.PluralRules(locale);
        const rule = rules.select(count);
        // Simple pluralization - can be extended for more complex rules
        if (rule === 'one') {
            return `${count} ${singular}`;
        }
        else {
            return `${count} ${pluralForm}`;
        }
    }
    catch (error) {
        // Fallback
        return count === 1 ? `${count} ${singular}` : `${count} ${pluralForm}`;
    }
};
exports.pluralize = pluralize;
// /**
//  * Format address based on Nigerian context
//  */
// export const formatAddress = (
//   address: {
//     street?: string;
//     city?: string;
//     state?: string;
//     country?: string;
//   },
//   locale: SupportedLocale = 'en'
// ): string => {
//   const parts: string[] = [];
//   if (address.street) parts.push(address.street);
//   if (address.city) parts.push(address.city);
//   if (address.state) parts.push(address.state);
//   if (address.country && address.country !== 'Nigeria') parts.push(address.country);
//   return parts.join(', ');
// };
/**
 * Format file size with locale-specific units
 */
const formatFileSize = (bytes, locale = 'en') => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    return `${(0, exports.formatNumber)(size, locale, { maximumFractionDigits: 2 })} ${units[unitIndex]}`;
};
exports.formatFileSize = formatFileSize;
/**
 * Truncate text with ellipsis
 */
const truncateText = (text, maxLength) => {
    if (text.length <= maxLength)
        return text;
    return `${text.slice(0, maxLength).trim()}...`;
};
exports.truncateText = truncateText;
/**
 * Format list of items with locale-specific conjunctions
 */
const formatList = (items, locale = 'en', type = 'conjunction') => {
    const localeMap = {
        en: 'en-NG',
        fr: 'fr-FR',
        pcm: 'en-NG',
    };
    try {
        const formatter = new Intl.ListFormat(localeMap[locale], { type });
        return formatter.format(items);
    }
    catch (error) {
        // Fallback
        if (items.length === 0)
            return '';
        if (items.length === 1)
            return items[0];
        if (items.length === 2)
            return items.join(type === 'conjunction' ? ' and ' : ' or ');
        const last = items[items.length - 1];
        const rest = items.slice(0, -1);
        const conjunction = type === 'conjunction' ? 'and' : 'or';
        return `${rest.join(', ')}, ${conjunction} ${last}`;
    }
};
exports.formatList = formatList;
//# sourceMappingURL=formatting.js.map