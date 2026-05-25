import { SupportedLocale } from '@newcondo/i18n';
/**
 * Supported currencies
 */
export declare enum Currency {
    NGN = "NGN",// Nigerian Naira
    USD = "USD",// US Dollar
    EUR = "EUR",// Euro
    GBP = "GBP",// British Pound
    XOF = "XOF"
}
/**
 * Currency symbols
 */
export declare const CURRENCY_SYMBOLS: Record<Currency, string>;
/**
 * Default currency per locale
 */
export declare const LOCALE_CURRENCY_MAP: Record<SupportedLocale, Currency>;
/**
 * Format currency amount based on locale
 */
export declare function formatCurrency(amount: number, currency?: Currency, locale?: SupportedLocale): string;
/**
 * Format currency amount with custom options
 */
export declare function formatCurrencyCustom(amount: number, currency: Currency, locale: SupportedLocale, options?: Partial<Intl.NumberFormatOptions>): string;
/**
 * Format amount without currency symbol
 */
export declare function formatAmount(amount: number, locale?: SupportedLocale, decimals?: number): string;
/**
 * Get currency symbol
 */
export declare function getCurrencySymbol(currency: Currency): string;
/**
 * Get default currency for locale
 */
export declare function getLocaleCurrency(locale: SupportedLocale): Currency;
/**
 * Parse currency string to number
 */
export declare function parseCurrencyString(currencyString: string): number;
/**
 * Format large numbers with abbreviations (K, M, B)
 */
export declare function formatCompactCurrency(amount: number, currency?: Currency, locale?: SupportedLocale): string;
/**
 * Calculate percentage
 */
export declare function calculatePercentage(value: number, total: number, decimals?: number): number;
/**
 * Format percentage
 */
export declare function formatPercentage(value: number, locale?: SupportedLocale, decimals?: number): string;
/**
 * Convert currency (simplified - in production, use real exchange rates)
 */
export declare function convertCurrency(amount: number, fromCurrency: Currency, toCurrency: Currency): Promise<number>;
/**
 * Round to nearest currency unit
 */
export declare function roundToNearestUnit(amount: number, unit?: number): number;
/**
 * Format currency range
 */
export declare function formatCurrencyRange(min: number, max: number, currency?: Currency, locale?: SupportedLocale): string;
//# sourceMappingURL=currency.d.ts.map