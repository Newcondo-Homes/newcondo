"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOCALE_CURRENCY_MAP = exports.CURRENCY_SYMBOLS = exports.Currency = void 0;
exports.formatCurrency = formatCurrency;
exports.formatCurrencyCustom = formatCurrencyCustom;
exports.formatAmount = formatAmount;
exports.getCurrencySymbol = getCurrencySymbol;
exports.getLocaleCurrency = getLocaleCurrency;
exports.parseCurrencyString = parseCurrencyString;
exports.formatCompactCurrency = formatCompactCurrency;
exports.calculatePercentage = calculatePercentage;
exports.formatPercentage = formatPercentage;
exports.convertCurrency = convertCurrency;
exports.roundToNearestUnit = roundToNearestUnit;
exports.formatCurrencyRange = formatCurrencyRange;
const i18n_1 = require("@newcondo/i18n");
/**
 * Supported currencies
 */
var Currency;
(function (Currency) {
    Currency["NGN"] = "NGN";
    Currency["USD"] = "USD";
    Currency["EUR"] = "EUR";
    Currency["GBP"] = "GBP";
    Currency["XOF"] = "XOF";
})(Currency || (exports.Currency = Currency = {}));
/**
 * Currency symbols
 */
exports.CURRENCY_SYMBOLS = {
    [Currency.NGN]: '₦',
    [Currency.USD]: '$',
    [Currency.EUR]: '€',
    [Currency.GBP]: '£',
    [Currency.XOF]: 'CFA',
};
/**
 * Default currency per locale
 */
exports.LOCALE_CURRENCY_MAP = {
    en: Currency.NGN,
    fr: Currency.XOF,
    pcm: Currency.NGN,
};
/**
 * Format currency amount based on locale
 */
function formatCurrency(amount, currency = Currency.NGN, locale = i18n_1.DEFAULT_LOCALE) {
    const formatter = new Intl.NumberFormat(getLocaleForCurrency(locale), {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return formatter.format(amount);
}
/**
 * Format currency amount with custom options
 */
function formatCurrencyCustom(amount, currency, locale, options = {}) {
    const formatter = new Intl.NumberFormat(getLocaleForCurrency(locale), {
        style: 'currency',
        currency,
        ...options,
    });
    return formatter.format(amount);
}
/**
 * Format amount without currency symbol
 */
function formatAmount(amount, locale = i18n_1.DEFAULT_LOCALE, decimals = 2) {
    const formatter = new Intl.NumberFormat(getLocaleForCurrency(locale), {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
    return formatter.format(amount);
}
/**
 * Get currency symbol
 */
function getCurrencySymbol(currency) {
    return exports.CURRENCY_SYMBOLS[currency] || currency;
}
/**
 * Get default currency for locale
 */
function getLocaleCurrency(locale) {
    return exports.LOCALE_CURRENCY_MAP[locale] || Currency.NGN;
}
/**
 * Convert locale to Intl locale format
 */
function getLocaleForCurrency(locale) {
    const localeMap = {
        en: 'en-NG', // English (Nigeria)
        fr: 'fr-FR', // French (France)
        pcm: 'en-NG', // Pidgin (use Nigerian English format)
    };
    return localeMap[locale] || 'en-NG';
}
/**
 * Parse currency string to number
 */
function parseCurrencyString(currencyString) {
    // Remove currency symbols and non-numeric characters except decimal point
    const cleaned = currencyString.replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
}
/**
 * Format large numbers with abbreviations (K, M, B)
 */
function formatCompactCurrency(amount, currency = Currency.NGN, locale = i18n_1.DEFAULT_LOCALE) {
    const formatter = new Intl.NumberFormat(getLocaleForCurrency(locale), {
        style: 'currency',
        currency,
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 1,
    });
    return formatter.format(amount);
}
/**
 * Calculate percentage
 */
function calculatePercentage(value, total, decimals = 2) {
    if (total === 0)
        return 0;
    return Number(((value / total) * 100).toFixed(decimals));
}
/**
 * Format percentage
 */
function formatPercentage(value, locale = i18n_1.DEFAULT_LOCALE, decimals = 2) {
    const formatter = new Intl.NumberFormat(getLocaleForCurrency(locale), {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
    return formatter.format(value / 100);
}
/**
 * Convert currency (simplified - in production, use real exchange rates)
 */
async function convertCurrency(amount, fromCurrency, toCurrency) {
    // TODO: Implement actual currency conversion using a service like exchangerate-api.com
    // This is a placeholder implementation
    if (fromCurrency === toCurrency) {
        return amount;
    }
    // Placeholder exchange rates (update with real rates)
    const exchangeRates = {
        'NGN_USD': 0.0012,
        'USD_NGN': 833.33,
        'NGN_EUR': 0.0011,
        'EUR_NGN': 909.09,
        'NGN_GBP': 0.00095,
        'GBP_NGN': 1052.63,
        'XOF_NGN': 1.35,
        'NGN_XOF': 0.74,
    };
    const rateKey = `${fromCurrency}_${toCurrency}`;
    const rate = exchangeRates[rateKey] || 1;
    return amount * rate;
}
/**
 * Round to nearest currency unit
 */
function roundToNearestUnit(amount, unit = 1) {
    return Math.round(amount / unit) * unit;
}
/**
 * Format currency range
 */
function formatCurrencyRange(min, max, currency = Currency.NGN, locale = i18n_1.DEFAULT_LOCALE) {
    const minFormatted = formatCurrency(min, currency, locale);
    const maxFormatted = formatCurrency(max, currency, locale);
    return `${minFormatted} - ${maxFormatted}`;
}
//# sourceMappingURL=currency.js.map