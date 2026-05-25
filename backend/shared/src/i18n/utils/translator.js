"use strict";
// src/i18n/utils/translator.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.Translator = void 0;
exports.createTranslator = createTranslator;
exports.translateForRequest = translateForRequest;
exports.batchTranslate = batchTranslate;
exports.translateWithFallback = translateWithFallback;
exports.translateEnum = translateEnum;
exports.translatePlural = translatePlural;
exports.formatDate = formatDate;
exports.formatTime = formatTime;
exports.formatRelativeTime = formatRelativeTime;
const i18n_1 = require("@newcondo/i18n");
const client_1 = require("@newcondo/i18n/client");
/**
 * Translator class for managing translations
 */
class Translator {
    constructor(locale = i18n_1.DEFAULT_LOCALE) {
        this.locale = locale;
        this.t = client_1.i18next.getFixedT(locale);
    }
    /**
     * Translate a key with optional interpolation
     */
    translate(key, options) {
        // FIXED: Cast return value to string or pass string constraint to t()
        return this.t(key, options);
    }
    /**
     * Translate error messages
     */
    translateError(errorKey, options) {
        // FIXED: Added <string> generic constraint
        return this.t(`errors.${errorKey}`, options);
    }
    /**
     * Translate notification messages
     */
    translateNotification(notificationKey, options) {
        // FIXED: Added <string> generic constraint
        return this.t(`notifications.${notificationKey}`, options);
    }
    /**
     * Translate email content
     */
    translateEmail(emailKey, options) {
        // FIXED: Added <string> generic constraint
        return this.t(`email.${emailKey}`, options);
    }
    /**
     * Translate SMS content
     */
    translateSMS(smsKey, options) {
        // FIXED: Added <string> generic constraint
        return this.t(`sms.${smsKey}`, options);
    }
    /**
     * Get current locale
     */
    getLocale() {
        return this.locale;
    }
    /**
     * Change locale
     */
    setLocale(locale) {
        this.locale = locale;
        this.t = client_1.i18next.getFixedT(locale);
    }
    /**
     * Check if translation key exists
     */
    exists(key) {
        return client_1.i18next.exists(key, { lng: this.locale });
    }
}
exports.Translator = Translator;
/**
 * Create a translator instance for a specific locale
 */
function createTranslator(locale = i18n_1.DEFAULT_LOCALE) {
    return new Translator(locale);
}
/**
 * Translate with automatic locale detection from request
 */
function translateForRequest(req, key, options) {
    const locale = req.locale || i18n_1.DEFAULT_LOCALE;
    const translator = createTranslator(locale);
    return translator.translate(key, options);
}
/**
 * Batch translate multiple keys
 */
function batchTranslate(locale, keys, options) {
    const translator = createTranslator(locale);
    const translations = {};
    for (const key of keys) {
        translations[key] = translator.translate(key, options);
    }
    return translations;
}
/**
 * Get translation with fallback
 */
function translateWithFallback(locale, key, fallback, options) {
    const translator = createTranslator(locale);
    if (translator.exists(key)) {
        return translator.translate(key, options);
    }
    return fallback;
}
/**
 * Translate enum values
 */
function translateEnum(locale, enumKey, value) {
    const translator = createTranslator(locale);
    const key = `enums.${enumKey}.${value}`;
    if (translator.exists(key)) {
        return translator.translate(key);
    }
    return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}
/**
 * Pluralization helper
 */
function translatePlural(locale, key, count, options) {
    const translator = createTranslator(locale);
    return translator.translate(key, { ...options, count });
}
/**
 * Date formatting with locale
 */
function formatDate(locale, date, format = 'short') {
    const options = format === 'short'
        ? { year: 'numeric', month: '2-digit', day: '2-digit' }
        : format === 'long'
            ? { year: 'numeric', month: 'long', day: 'numeric' }
            : { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    return new Intl.DateTimeFormat(locale, options).format(date);
}
/**
 * Time formatting with locale
 */
function formatTime(locale, date, includeSeconds = false) {
    const options = {
        hour: '2-digit',
        minute: '2-digit',
        ...(includeSeconds && { second: '2-digit' }),
    };
    return new Intl.DateTimeFormat(locale, { ...options, hour12: false }).format(date);
}
/**
 * Relative time formatting
 */
function formatRelativeTime(locale, date, baseDate = new Date()) {
    const diffInSeconds = Math.floor((date.getTime() - baseDate.getTime()) / 1000);
    const absDiff = Math.abs(diffInSeconds);
    let value;
    let unit;
    if (absDiff < 60) {
        value = diffInSeconds;
        unit = 'second';
    }
    else if (absDiff < 3600) {
        value = Math.floor(diffInSeconds / 60);
        unit = 'minute';
    }
    else if (absDiff < 86400) {
        value = Math.floor(diffInSeconds / 3600);
        unit = 'hour';
    }
    else if (absDiff < 2592000) {
        value = Math.floor(diffInSeconds / 86400);
        unit = 'day';
    }
    else if (absDiff < 31536000) {
        value = Math.floor(diffInSeconds / 2592000);
        unit = 'month';
    }
    else {
        value = Math.floor(diffInSeconds / 31536000);
        unit = 'year';
    }
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    return rtf.format(value, unit);
}
//# sourceMappingURL=translator.js.map