// apps/platform/store/notificationStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type NotificationType = 
  | 'MARKING_JOB_AVAILABLE'
  | 'MARKING_JOB_ASSIGNED'
  | 'MARKING_JOB_EXPIRED'
  | 'MARKING_JOB_COMPLETED'
  | 'MARKING_JOB_CANCELLED'
  | 'QUEUE_POSITION_UPDATED'
  | 'TIME_SLOT_EXPIRING'
  | 'PAYMENT_RECEIVED'
  | 'CONFIRMATION_REQUIRED'
  | 'CONFIRMATION_APPROVED'
  | 'CONFIRMATION_REJECTED';

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface MarkingNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  
  // Related entities
  markingJobId?: string;
  propertyId?: string;
  userId?: string;
  
  // Metadata
  metadata?: Record<string, any>;
  
  // Status
  isRead: boolean;
  isActionable: boolean;
  actionUrl?: string;
  actionLabel?: string;
  
  // Timestamps
  createdAt: string;
  expiresAt?: string;
  readAt?: string;
}

interface NotificationState {
  // Notifications
  notifications: MarkingNotification[];
  unreadCount: number;
  
  // Filter & Sort
  filter: 'all' | 'unread' | 'actionable';
  sortBy: 'newest' | 'oldest' | 'priority';
  
  // Preferences
  preferences: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    inAppEnabled: boolean;
    mutedTypes: NotificationType[];
  };
  
  // Real-time connection
  isConnected: boolean;
  lastSync: string | null;
}

interface NotificationActions {
  // Notification management
  addNotification: (notification: Omit<MarkingNotification, 'id' | 'createdAt' | 'isRead'>) => void;
  addNotifications: (notifications: MarkingNotification[]) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  
  // Filtering & Sorting
  setFilter: (filter: NotificationState['filter']) => void;
  setSortBy: (sortBy: NotificationState['sortBy']) => void;
  
  // Preferences
  updatePreferences: (preferences: Partial<NotificationState['preferences']>) => void;
  muteNotificationType: (type: NotificationType) => void;
  unmuteNotificationType: (type: NotificationType) => void;
  
  // Connection
  setConnectionStatus: (isConnected: boolean) => void;
  updateLastSync: () => void;
  
  // Utilities
  getFilteredNotifications: () => MarkingNotification[];
  getUnreadCount: () => number;
  getActionableNotifications: () => MarkingNotification[];
  getNotificationsByType: (type: NotificationType) => MarkingNotification[];
  removeExpiredNotifications: () => void;
  
  // Reset
  reset: () => void;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  filter: 'all',
  sortBy: 'newest',
  preferences: {
    emailEnabled: true,
    smsEnabled: true,
    pushEnabled: true,
    inAppEnabled: true,
    mutedTypes: [],
  },
  isConnected: false,
  lastSync: null,
};

export const useNotificationStore = create<NotificationState & NotificationActions>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Notification management
        addNotification: (notification) => {
          const newNotification: MarkingNotification = {
            ...notification,
            id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            isRead: false,
          };

          set((state) => {
            // Check if notification type is muted
            if (state.preferences.mutedTypes.includes(newNotification.type)) {
              return state;
            }

            const notifications = [newNotification, ...state.notifications];
            const unreadCount = notifications.filter(n => !n.isRead).length;

            return {
              notifications,
              unreadCount,
            };
          });
        },

        addNotifications: (notifications) => {
          set((state) => {
            const filteredNotifications = notifications.filter(
              n => !state.preferences.mutedTypes.includes(n.type)
            );

            const allNotifications = [...filteredNotifications, ...state.notifications];
            const unreadCount = allNotifications.filter(n => !n.isRead).length;

            return {
              notifications: allNotifications,
              unreadCount,
            };
          });
        },

        markAsRead: (notificationId) => {
          set((state) => {
            const notifications = state.notifications.map(n =>
              n.id === notificationId
                ? { ...n, isRead: true, readAt: new Date().toISOString() }
                : n
            );
            const unreadCount = notifications.filter(n => !n.isRead).length;

            return { notifications, unreadCount };
          });
        },

        markAllAsRead: () => {
          set((state) => {
            const notifications = state.notifications.map(n => ({
              ...n,
              isRead: true,
              readAt: n.readAt || new Date().toISOString(),
            }));

            return { notifications, unreadCount: 0 };
          });
        },

        deleteNotification: (notificationId) => {
          set((state) => {
            const notifications = state.notifications.filter(n => n.id !== notificationId);
            const unreadCount = notifications.filter(n => !n.isRead).length;

            return { notifications, unreadCount };
          });
        },

        clearAllNotifications: () => {
          set({ notifications: [], unreadCount: 0 });
        },

        // Filtering & Sorting
        setFilter: (filter) => set({ filter }),

        setSortBy: (sortBy) => set({ sortBy }),

        // Preferences
        updatePreferences: (preferences) => {
          set((state) => ({
            preferences: { ...state.preferences, ...preferences },
          }));
        },

        muteNotificationType: (type) => {
          set((state) => ({
            preferences: {
              ...state.preferences,
              mutedTypes: [...state.preferences.mutedTypes, type],
            },
          }));
        },

        unmuteNotificationType: (type) => {
          set((state) => ({
            preferences: {
              ...state.preferences,
              mutedTypes: state.preferences.mutedTypes.filter(t => t !== type),
            },
          }));
        },

        // Connection
        setConnectionStatus: (isConnected) => set({ isConnected }),

        updateLastSync: () => set({ lastSync: new Date().toISOString() }),

        // Utilities
        getFilteredNotifications: () => {
          const { notifications, filter, sortBy } = get();

          let filtered = [...notifications];

          // Apply filter
          if (filter === 'unread') {
            filtered = filtered.filter(n => !n.isRead);
          } else if (filter === 'actionable') {
            filtered = filtered.filter(n => n.isActionable);
          }

          // Apply sorting
          filtered.sort((a, b) => {
            if (sortBy === 'newest') {
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            } else if (sortBy === 'oldest') {
              return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            } else if (sortBy === 'priority') {
              const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
              return priorityOrder[b.priority] - priorityOrder[a.priority];
            }
            return 0;
          });

          return filtered;
        },

        getUnreadCount: () => {
          const { notifications } = get();
          return notifications.filter(n => !n.isRead).length;
        },

        getActionableNotifications: () => {
          const { notifications } = get();
          return notifications.filter(n => n.isActionable && !n.isRead);
        },

        getNotificationsByType: (type) => {
          const { notifications } = get();
          return notifications.filter(n => n.type === type);
        },

        removeExpiredNotifications: () => {
          set((state) => {
            const now = new Date();
            const notifications = state.notifications.filter(n => {
              if (!n.expiresAt) return true;
              return new Date(n.expiresAt) > now;
            });
            const unreadCount = notifications.filter(n => !n.isRead).length;

            return { notifications, unreadCount };
          });
        },

        // Reset
        reset: () => set(initialState),
      }),
      {
        name: 'notification-storage',
        partialize: (state) => ({
          notifications: state.notifications,
          preferences: state.preferences,
          filter: state.filter,
          sortBy: state.sortBy,
        }),
      }
    ),
    { name: 'NotificationStore' }
  )
);

// Helper functions for creating notifications
export const createMarkingJobNotification = (
  type: NotificationType,
  markingJobId: string,
  propertyId: string,
  customMessage?: string
): Omit<MarkingNotification, 'id' | 'createdAt' | 'isRead'> => {
  const notificationTemplates: Record<NotificationType, { title: string; message: string; priority: NotificationPriority; isActionable: boolean }> = {
    MARKING_JOB_AVAILABLE: {
      title: 'New Marking Job Available',
      message: customMessage || 'A new property marking job is available in your area',
      priority: 'HIGH',
      isActionable: true,
    },
    MARKING_JOB_ASSIGNED: {
      title: 'Marking Job Assigned',
      message: customMessage || 'You have been assigned a property marking job',
      priority: 'URGENT',
      isActionable: true,
    },
    MARKING_JOB_EXPIRED: {
      title: 'Marking Job Expired',
      message: customMessage || 'Your marking time slot has expired',
      priority: 'MEDIUM',
      isActionable: false,
    },
    MARKING_JOB_COMPLETED: {
      title: 'Marking Job Completed',
      message: customMessage || 'Property marking has been completed',
      priority: 'MEDIUM',
      isActionable: false,
    },
    MARKING_JOB_CANCELLED: {
      title: 'Marking Job Cancelled',
      message: customMessage || 'The marking job has been cancelled',
      priority: 'MEDIUM',
      isActionable: false,
    },
    QUEUE_POSITION_UPDATED: {
      title: 'Queue Position Updated',
      message: customMessage || 'Your position in the marking queue has been updated',
      priority: 'LOW',
      isActionable: false,
    },
    TIME_SLOT_EXPIRING: {
      title: 'Time Slot Expiring Soon',
      message: customMessage || 'Your marking time slot is expiring in 30 minutes',
      priority: 'URGENT',
      isActionable: true,
    },
    PAYMENT_RECEIVED: {
      title: 'Payment Received',
      message: customMessage || 'Payment has been credited to your account',
      priority: 'MEDIUM',
      isActionable: false,
    },
    CONFIRMATION_REQUIRED: {
      title: 'Confirmation Required',
      message: customMessage || 'Please confirm the property marking',
      priority: 'HIGH',
      isActionable: true,
    },
    CONFIRMATION_APPROVED: {
      title: 'Marking Confirmed',
      message: customMessage || 'Your property marking has been approved',
      priority: 'MEDIUM',
      isActionable: false,
    },
    CONFIRMATION_REJECTED: {
      title: 'Marking Rejected',
      message: customMessage || 'Your property marking has been rejected',
      priority: 'HIGH',
      isActionable: true,
    },
  };

  const template = notificationTemplates[type];

  return {
    type,
    title: template.title,
    message: template.message,
    priority: template.priority,
    isActionable: template.isActionable,
    markingJobId,
    propertyId,
    actionUrl: template.isActionable ? `/dashboard/marking-jobs/${markingJobId}` : undefined,
    actionLabel: template.isActionable ? 'View Job' : undefined,
  };
};