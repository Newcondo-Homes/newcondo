import { Request } from 'express';
import { SupportedLocale } from '@newcondo/i18n';
/**
 * Locale detection strategies
 */
export declare enum LocaleDetectionStrategy {
    QUERY_PARAM = "query",
    HEADER = "header",
    ACCEPT_LANGUAGE = "accept-language",
    USER_PREFERENCE = "user",
    COOKIE = "cookie",
    SUBDOMAIN = "subdomain"
}
/**
 * Locale detector configuration
 */
export interface LocaleDetectorConfig {
    strategies: LocaleDetectionStrategy[];
    queryParamName?: string;
    headerName?: string;
    cookieName?: string;
    userPropertyName?: string;
}
/**
 * Locale detector class
 */
export declare class LocaleDetector {
    private config;
    constructor(config?: Partial<LocaleDetectorConfig>);
    /**
     * Detect locale from request using configured strategies
     */
    detect(req: Request): SupportedLocale;
    /**
     * Detect locale using a specific strategy
     */
    private detectByStrategy;
    /**
     * Detect from query parameter
     */
    private detectFromQueryParam;
    /**
     * Detect from custom header
     */
    private detectFromHeader;
    /**
     * Detect from Accept-Language header
     */
    private detectFromAcceptLanguage;
    /**
     * Detect from user preferences
     */
    private detectFromUserPreference;
    /**
     * Detect from cookie
     */
    private detectFromCookie;
    /**
     * Detect from subdomain (e.g., fr.newcondo.com)
     */
    private detectFromSubdomain;
    /**
     * Validate if locale is supported
     */
    private validateLocale;
    /**
     * Get all supported locales
     */
    getSupportedLocales(): readonly SupportedLocale[];
    /**
     * Check if locale is supported
     */
    isSupported(locale: string): boolean;
}
/**
 * Create a locale detector instance
 */
export declare function createLocaleDetector(config?: Partial<LocaleDetectorConfig>): LocaleDetector;
/**
 * Quick locale detection function
 */
export declare function detectLocale(req: Request, config?: Partial<LocaleDetectorConfig>): SupportedLocale;
//# sourceMappingURL=localeDetector.d.ts.map