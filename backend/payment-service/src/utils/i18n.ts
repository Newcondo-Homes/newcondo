// backend/payment-service/src/utils/i18n.ts

import i18n from '../../../shared/src/i18n/config/i18n.config';

/**
 * Get translation for a given key
 */
export function getTranslation(key: string, locale: string = 'en', options?: any): string {
  return i18n.t(key, { ...options, lng: locale });
}

/**
 * Get multiple translations
 */
export function getTranslations(keys: string[], locale: string = 'en'): Record<string, string> {
  const translations: Record<string, string> = {};
  
  keys.forEach(key => {
    translations[key] = getTranslation(key, locale);
  });
  
  return translations;
}

/**
 * Get payment status translations
 */
export function getPaymentStatusTranslation(status: string, locale: string = 'en'): string {
  const statusKey = `payment.status.${status.toLowerCase()}`;
  return getTranslation(statusKey, locale);
}

/**
 * Get payment type translations
 */
export function getPaymentTypeTranslation(type: string, locale: string = 'en'): string {
  const typeKey = `payment.type.${type.toLowerCase()}`;
  return getTranslation(typeKey, locale);
}

/**
 * Get error message with context
 */
export function getErrorMessage(errorCode: string, locale: string = 'en', context?: any): string {
  const errorKey = `errors.${errorCode}`;
  return getTranslation(errorKey, locale, context);
}

/**
 * Get payment confirmation message
 */
export function getConfirmationMessage(confirmed: boolean, locale: string = 'en'): string {
  return confirmed 
    ? getTranslation('payment.confirmed', locale)
    : getTranslation('payment.disputed', locale);
}

/**
 * Format payment notification message
 */
export function formatPaymentNotification(
  type: 'success' | 'failed' | 'pending' | 'refunded',
  amount: string,
  locale: string = 'en'
): string {
  return getTranslation(`notifications.payment_${type}`, locale, { amount });
}

/**
 * Get payment instructions
 */
export function getPaymentInstructions(paymentMethod: string, locale: string = 'en'): string {
  return getTranslation(`payment.instructions.${paymentMethod}`, locale);
}

/**
 * Get refund policy text
 */
export function getRefundPolicy(locale: string = 'en'): string {
  return getTranslation('payment.refund_policy', locale);
}

/**
 * Get virtual account creation message
 */
export function getVirtualAccountMessage(accountNumber: string, bankName: string, locale: string = 'en'): string {
  return getTranslation('payment.virtual_account_created', locale, {
    accountNumber,
    bankName
  });
}