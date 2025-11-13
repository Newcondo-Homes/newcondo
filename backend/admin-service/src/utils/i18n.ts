// backend/admin-service/src/utils/i18n.ts

import i18n from '../../../shared/src/i18n/config/i18n.config';

/**
 * Get translation for a given key
 */
export function getTranslation(key: string, locale: string = 'en', options?: any): string {
  return i18n.t(key, { ...options, lng: locale });
}

/**
 * Get admin action translation
 */
export function getAdminActionTranslation(action: string, locale: string = 'en'): string {
  const actionKey = `admin.action.${action.toLowerCase().replace(/_/g, '.')}`;
  return getTranslation(actionKey, locale);
}

/**
 * Get verification status translation
 */
export function getVerificationStatusTranslation(status: string, locale: string = 'en'): string {
  const statusKey = `admin.verification.status.${status.toLowerCase()}`;
  return getTranslation(statusKey, locale);
}

/**
 * Get approval status translation
 */
export function getApprovalStatusTranslation(status: string, locale: string = 'en'): string {
  const statusKey = `admin.approval.status.${status.toLowerCase()}`;
  return getTranslation(statusKey, locale);
}

/**
 * Get ticket status translation
 */
export function getTicketStatusTranslation(status: string, locale: string = 'en'): string {
  const statusKey = `admin.ticket.status.${status.toLowerCase()}`;
  return getTranslation(statusKey, locale);
}

/**
 * Get ticket category translation
 */
export function getTicketCategoryTranslation(category: string, locale: string = 'en'): string {
  const categoryKey = `admin.ticket.category.${category.toLowerCase()}`;
  return getTranslation(categoryKey, locale);
}

/**
 * Get dispute status translation
 */
export function getDisputeStatusTranslation(status: string, locale: string = 'en'): string {
  const statusKey = `admin.dispute.status.${status.toLowerCase()}`;
  return getTranslation(statusKey, locale);
}

/**
 * Format admin notification message
 */
export function formatAdminNotification(
  type: string,
  entityType: string,
  entityId: string,
  locale: string = 'en'
): string {
  return getTranslation(`admin.notification.${type}`, locale, {
    entityType,
    entityId
  });
}

/**
 * Get analytics metric translation
 */
export function getAnalyticsMetricTranslation(metric: string, locale: string = 'en'): string {
  const metricKey = `admin.analytics.metric.${metric.toLowerCase().replace(/\s+/g, '_')}`;
  return getTranslation(metricKey, locale);
}

/**
 * Get user role translation
 */
export function getUserRoleTranslation(role: string, locale: string = 'en'): string {
  const roleKey = `admin.user.role.${role.toLowerCase()}`;
  return getTranslation(roleKey, locale);
}

/**
 * Get admin dashboard message
 */
export function getDashboardMessage(messageType: string, locale: string = 'en'): string {
  return getTranslation(`admin.dashboard.${messageType}`, locale);
}

/**
 * Format rejection reason
 */
export function formatRejectionReason(reason: string, locale: string = 'en'): string {
  // Check if reason is a translation key
  if (reason.startsWith('rejection.')) {
    return getTranslation(reason, locale);
  }
  return reason;
}

/**
 * Get marking oversight status translation
 */
export function getMarkingOversightStatusTranslation(status: string, locale: string = 'en'): string {
  const statusKey = `admin.marking.oversight.${status.toLowerCase()}`;
  return getTranslation(statusKey, locale);
}

/**
 * Get payment status for admin view
 */
export function getAdminPaymentStatusTranslation(status: string, locale: string = 'en'): string {
  const statusKey = `admin.payment.status.${status.toLowerCase()}`;
  return getTranslation(statusKey, locale);
}

/**
 * Format admin action log message
 */
export function formatActionLogMessage(
  action: string,
  targetType: string,
  targetId: string,
  adminName: string,
  locale: string = 'en'
): string {
  return getTranslation('admin.action_log.message', locale, {
    action: getAdminActionTranslation(action, locale),
    targetType,
    targetId,
    adminName
  });
}

/**
 * Get bulk action confirmation message
 */
export function getBulkActionConfirmation(
  action: string,
  count: number,
  locale: string = 'en'
): string {
  return getTranslation('admin.bulk_action.confirm', locale, {
    action,
    count
  });
}

/**
 * Get system health status translation
 */
export function getSystemHealthTranslation(status: string, locale: string = 'en'): string {
  const statusKey = `admin.system.health.${status.toLowerCase()}`;
  return getTranslation(statusKey, locale);
}