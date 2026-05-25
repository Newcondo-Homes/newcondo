"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_LOCALE = exports.SUPPORTED_LOCALES = void 0;
exports.initI18n = initI18n;
exports.i18nMiddleware = i18nMiddleware;
exports.getTranslation = getTranslation;
exports.changeLocale = changeLocale;
exports.getSupportedLocales = getSupportedLocales;
exports.isLocaleSupported = isLocaleSupported;
const client_1 = require("@newcondo/i18n/client");
const i18n_1 = __importDefault(require("@newcondo/i18n"));
const path_1 = require("path");
// Supported locales
exports.SUPPORTED_LOCALES = ['en', 'fr', 'pcm'];
// Default locale
exports.DEFAULT_LOCALE = 'en';
/**
 * Initialize i18next with backend loading
 */
async function initI18n() {
    const backendInstance = typeof i18n_1.default === 'function' ? new i18n_1.default() : i18n_1.default;
    await client_1.i18next.use(backendInstance).init({
        lng: exports.DEFAULT_LOCALE,
        fallbackLng: exports.DEFAULT_LOCALE,
        supportedLngs: [...exports.SUPPORTED_LOCALES],
        preload: [...exports.SUPPORTED_LOCALES],
        ns: ['errors', 'notifications', 'email', 'sms'],
        defaultNS: 'errors',
        backend: {
            loadPath: (0, path_1.join)(__dirname, '../locales/{{lng}}/{{ns}}.json'),
        },
        interpolation: {
            escapeValue: false, // React/templates handle escaping
        },
        saveMissing: false,
        missingKeyHandler: (lngs, ns, key) => {
            console.warn(`Missing translation key: ${key} in namespace: ${ns} for languages: ${lngs.join(', ')}`);
        },
    });
}
/**
 * Detect locale from various sources
 */
function detectLocale(req) {
    // 1. Check query parameter (?lang=fr)
    if (req.query.lang && typeof req.query.lang === 'string') {
        const queryLang = req.query.lang.toLowerCase();
        if (exports.SUPPORTED_LOCALES.includes(queryLang)) {
            return queryLang;
        }
    }
    // 2. Check custom header (X-Locale)
    const headerLocale = req.headers['x-locale'];
    if (headerLocale) {
        const locale = headerLocale.toLowerCase();
        if (exports.SUPPORTED_LOCALES.includes(locale)) {
            return locale;
        }
    }
    // 3. Check Accept-Language header
    const acceptLanguage = req.headers['accept-language'];
    if (acceptLanguage) {
        const languages = acceptLanguage
            .split(',')
            .map(lang => lang.split(';')[0].trim().toLowerCase().split('-')[0]);
        for (const lang of languages) {
            if (exports.SUPPORTED_LOCALES.includes(lang)) {
                return lang;
            }
        }
    }
    // 4. Check user preferences from JWT token (if authenticated)
    if (req.user && 'preferredLocale' in req.user) {
        const userLocale = req.user.preferredLocale;
        if (userLocale && exports.SUPPORTED_LOCALES.includes(userLocale)) {
            return userLocale;
        }
    }
    // 5. Default locale
    return exports.DEFAULT_LOCALE;
}
/**
 * i18n middleware for Express
 * Attaches locale and translation function to request
 */
function i18nMiddleware() {
    return async (req, res, next) => {
        try {
            // Ensure i18next is initialized
            if (!client_1.i18next.isInitialized) {
                await initI18n();
            }
            // Detect and set locale
            const locale = detectLocale(req);
            req.locale = locale;
            // Create a translation function bound to the detected locale
            req.t = client_1.i18next.getFixedT(locale);
            // Set locale in response header for client reference
            res.setHeader('Content-Language', locale);
            next();
        }
        catch (error) {
            console.error('i18n middleware error:', error);
            // Fall back to default locale on error
            req.locale = exports.DEFAULT_LOCALE;
            req.t = client_1.i18next.getFixedT(exports.DEFAULT_LOCALE);
            next();
        }
    };
}
/**
 * Get translation for a specific locale
 * Useful for background jobs, email templates, etc.
 */
function getTranslation(locale = exports.DEFAULT_LOCALE) {
    return client_1.i18next.getFixedT(locale);
}
/**
 * Change locale dynamically
 */
async function changeLocale(locale) {
    if (!exports.SUPPORTED_LOCALES.includes(locale)) {
        throw new Error(`Unsupported locale: ${locale}`);
    }
    await client_1.i18next.changeLanguage(locale);
}
/**
 * Get all supported locales
 */
function getSupportedLocales() {
    return exports.SUPPORTED_LOCALES;
}
/**
 * Check if a locale is supported
 */
function isLocaleSupported(locale) {
    return exports.SUPPORTED_LOCALES.includes(locale);
}
//# sourceMappingURL=i18nMiddleware.js.map