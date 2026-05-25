"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocaleDetector = exports.LocaleDetectionStrategy = void 0;
exports.createLocaleDetector = createLocaleDetector;
exports.detectLocale = detectLocale;
const i18n_1 = require("@newcondo/i18n");
/**
 * Locale detection strategies
 */
var LocaleDetectionStrategy;
(function (LocaleDetectionStrategy) {
    LocaleDetectionStrategy["QUERY_PARAM"] = "query";
    LocaleDetectionStrategy["HEADER"] = "header";
    LocaleDetectionStrategy["ACCEPT_LANGUAGE"] = "accept-language";
    LocaleDetectionStrategy["USER_PREFERENCE"] = "user";
    LocaleDetectionStrategy["COOKIE"] = "cookie";
    LocaleDetectionStrategy["SUBDOMAIN"] = "subdomain";
})(LocaleDetectionStrategy || (exports.LocaleDetectionStrategy = LocaleDetectionStrategy = {}));
/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
    strategies: [
        LocaleDetectionStrategy.QUERY_PARAM,
        LocaleDetectionStrategy.HEADER,
        LocaleDetectionStrategy.USER_PREFERENCE,
        LocaleDetectionStrategy.ACCEPT_LANGUAGE,
    ],
    queryParamName: 'lang',
    headerName: 'x-locale',
    cookieName: 'locale',
    userPropertyName: 'preferredLocale',
};
/**
 * Locale detector class
 */
class LocaleDetector {
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    /**
     * Detect locale from request using configured strategies
     */
    detect(req) {
        for (const strategy of this.config.strategies) {
            const locale = this.detectByStrategy(req, strategy);
            if (locale) {
                return locale;
            }
        }
        return i18n_1.DEFAULT_LOCALE;
    }
    /**
     * Detect locale using a specific strategy
     */
    detectByStrategy(req, strategy) {
        switch (strategy) {
            case LocaleDetectionStrategy.QUERY_PARAM:
                return this.detectFromQueryParam(req);
            case LocaleDetectionStrategy.HEADER:
                return this.detectFromHeader(req);
            case LocaleDetectionStrategy.ACCEPT_LANGUAGE:
                return this.detectFromAcceptLanguage(req);
            case LocaleDetectionStrategy.USER_PREFERENCE:
                return this.detectFromUserPreference(req);
            case LocaleDetectionStrategy.COOKIE:
                return this.detectFromCookie(req);
            case LocaleDetectionStrategy.SUBDOMAIN:
                return this.detectFromSubdomain(req);
            default:
                return null;
        }
    }
    /**
     * Detect from query parameter
     */
    detectFromQueryParam(req) {
        const paramName = this.config.queryParamName || 'lang';
        const locale = req.query[paramName];
        return this.validateLocale(locale);
    }
    /**
     * Detect from custom header
     */
    detectFromHeader(req) {
        const headerName = (this.config.headerName || 'x-locale').toLowerCase();
        const locale = req.headers[headerName];
        return this.validateLocale(locale);
    }
    /**
     * Detect from Accept-Language header
     */
    detectFromAcceptLanguage(req) {
        const acceptLanguage = req.headers['accept-language'];
        if (!acceptLanguage) {
            return null;
        }
        const languages = acceptLanguage
            .split(',')
            .map(lang => {
            const parts = lang.split(';');
            const locale = parts[0].trim().toLowerCase();
            const quality = parts[1] ? parseFloat(parts[1].split('=')[1]) : 1.0;
            return { locale: locale.split('-')[0], quality };
        })
            .sort((a, b) => b.quality - a.quality);
        for (const { locale } of languages) {
            const validated = this.validateLocale(locale);
            if (validated) {
                return validated;
            }
        }
        return null;
    }
    /**
     * Detect from user preferences
     */
    detectFromUserPreference(req) {
        const propertyName = this.config.userPropertyName || 'preferredLocale';
        if (req.user && typeof req.user === 'object' && propertyName in req.user) {
            const locale = req.user[propertyName];
            return this.validateLocale(locale);
        }
        return null;
    }
    /**
     * Detect from cookie
     */
    detectFromCookie(req) {
        const cookieName = this.config.cookieName || 'locale';
        if (req.cookies && req.cookies[cookieName]) {
            const locale = req.cookies[cookieName];
            return this.validateLocale(locale);
        }
        return null;
    }
    /**
     * Detect from subdomain (e.g., fr.newcondo.com)
     */
    detectFromSubdomain(req) {
        const host = req.hostname;
        const parts = host.split('.');
        if (parts.length > 2) {
            const subdomain = parts[0].toLowerCase();
            return this.validateLocale(subdomain);
        }
        return null;
    }
    /**
     * Validate if locale is supported
     */
    validateLocale(locale) {
        if (!locale) {
            return null;
        }
        const normalized = locale.toLowerCase();
        return i18n_1.SUPPORTED_LOCALES.includes(normalized) ? normalized : null;
    }
    /**
     * Get all supported locales
     */
    getSupportedLocales() {
        return i18n_1.SUPPORTED_LOCALES;
    }
    /**
     * Check if locale is supported
     */
    isSupported(locale) {
        return i18n_1.SUPPORTED_LOCALES.includes(locale.toLowerCase());
    }
}
exports.LocaleDetector = LocaleDetector;
/**
 * Create a locale detector instance
 */
function createLocaleDetector(config) {
    return new LocaleDetector(config);
}
/**
 * Quick locale detection function
 */
function detectLocale(req, config) {
    const detector = createLocaleDetector(config);
    return detector.detect(req);
}
//# sourceMappingURL=localeDetector.js.map