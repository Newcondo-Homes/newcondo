import { Request, Response, NextFunction } from 'express';
import { i18next } from '@newcondo/i18n/client';
export declare const SUPPORTED_LOCALES: readonly ["en", "fr", "pcm"];
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];
export declare const DEFAULT_LOCALE: SupportedLocale;
declare global {
    namespace Express {
        interface Request {
            locale: SupportedLocale;
            t: typeof i18next.t;
        }
    }
}
/**
 * Initialize i18next with backend loading
 */
export declare function initI18n(): Promise<void>;
/**
 * i18n middleware for Express
 * Attaches locale and translation function to request
 */
export declare function i18nMiddleware(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get translation for a specific locale
 * Useful for background jobs, email templates, etc.
 */
export declare function getTranslation(locale?: SupportedLocale): any;
/**
 * Change locale dynamically
 */
export declare function changeLocale(locale: SupportedLocale): Promise<void>;
/**
 * Get all supported locales
 */
export declare function getSupportedLocales(): readonly SupportedLocale[];
/**
 * Check if a locale is supported
 */
export declare function isLocaleSupported(locale: string): locale is SupportedLocale;
//# sourceMappingURL=i18nMiddleware.d.ts.map