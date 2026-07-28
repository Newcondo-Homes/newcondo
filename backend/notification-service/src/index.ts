// backend/notification-service/src/index.ts
// Barrel — combined-backend imports notification-service through this file.
export {
  listNotifications,
  markAllRead,
  markRead,
  streamNotifications,
} from "./services/notificationStoreService";

// Existing domain notification senders (marking/referral/queue/email/sms)
// keep working as-is; export the ones combined routes need over time.
