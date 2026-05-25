import { SupportedLocale } from '@newcondo/i18n';
/**
 * Translator class for managing translations
 */
export declare class Translator {
    private locale;
    private t;
    constructor(locale?: SupportedLocale);
    /**
     * Translate a key with optional interpolation
     */
    translate(key: string, options?: Record<string, any>): string;
    /**
     * Translate error messages
     */
    translateError(errorKey: string, options?: Record<string, any>): string;
    /**
     * Translate notification messages
     */
    translateNotification(notificationKey: string, options?: Record<string, any>): string;
    /**
     * Translate email content
     */
    translateEmail(emailKey: string, options?: Record<string, any>): string;
    /**
     * Translate SMS content
     */
    translateSMS(smsKey: string, options?: Record<string, any>): string;
    /**
     * Get current locale
     */
    getLocale(): SupportedLocale;
    /**
     * Change locale
     */
    setLocale(locale: SupportedLocale): void;
    /**
     * Check if translation key exists
     */
    exists(key: string): boolean;
}
/**
 * Create a translator instance for a specific locale
 */
export declare function createTranslator(locale?: SupportedLocale): Translator;
/**
 * Translate with automatic locale detection from request
 */
export declare function translateForRequest(req: any, key: string, options?: Record<string, any>): string;
/**
 * Batch translate multiple keys
 */
export declare function batchTranslate(locale: SupportedLocale, keys: string[], options?: Record<string, any>): Record<string, string>;
/**
 * Get translation with fallback
 */
export declare function translateWithFallback(locale: SupportedLocale, key: string, fallback: string, options?: Record<string, any>): string;
/**
 * Translate enum values
 */
export declare function translateEnum<T extends string>(locale: SupportedLocale, enumKey: string, value: T): string;
/**
 * Pluralization helper
 */
export declare function translatePlural(locale: SupportedLocale, key: string, count: number, options?: Record<string, any>): string;
/**
 * Date formatting with locale
 */
export declare function formatDate(locale: SupportedLocale, date: Date, format?: 'short' | 'long' | 'full'): string;
/**
 * Time formatting with locale
 */
export declare function formatTime(locale: SupportedLocale, date: Date, includeSeconds?: boolean): string;
/**
 * Relative time formatting
 */
export declare function formatRelativeTime(locale: SupportedLocale, date: Date, baseDate?: Date): string;
//# sourceMappingURL=translator.d.ts.map