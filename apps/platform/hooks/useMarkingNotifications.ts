// apps/platform/hooks/useMarkingNotifications.ts

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './useAuth';

export type MarkingNotificationType = 
  | 'JOB_ASSIGNED'
  | 'JOB_AVAILABLE'
  | 'JOB_COMPLETED'
  | 'JOB_EXPIRED'
  | 'VERIFICATION_REQUIRED'
  | 'VERIFICATION_APPROVED'
  | 'VERIFICATION_REJECTED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_RELEASED'
  | 'QUEUE_POSITION_UPDATED'
  | 'TIME_SLOT_EXPIRING'
  | 'AGENT_NEARBY'
  | 'JOB_CANCELLED';

export interface MarkingNotification {
  id: string;
  type: MarkingNotificationType;
  title: string;
  message: string;
  markingJobId?: string;
  propertyId?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  expiresAt?: Date;
}

interface UseMarkingNotificationsReturn {
  notifications: MarkingNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAll: () => Promise<void>;
  refetch: () => Promise<void>;
  subscribeToNotifications: () => void;
  unsubscribeFromNotifications: () => void;
}

export const useMarkingNotifications = (): UseMarkingNotificationsReturn => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<MarkingNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/marking/notifications', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      
      // Transform dates
      const transformedNotifications = data.notifications.map((notif: any) => ({
        ...notif,
        createdAt: new Date(notif.createdAt),
        expiresAt: notif.expiresAt ? new Date(notif.expiresAt) : undefined,
      }));

      setNotifications(transformedNotifications);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching marking notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Subscribe to real-time notifications via SSE or WebSocket
  const subscribeToNotifications = useCallback(() => {
    if (!user || eventSource) return;

    // Using Server-Sent Events (SSE) for real-time updates
    const es = new EventSource(`/api/marking/notifications/stream`);

    es.onmessage = (event) => {
      try {
        const notification: MarkingNotification = JSON.parse(event.data);
        
        // Transform dates
        notification.createdAt = new Date(notification.createdAt);
        if (notification.expiresAt) {
          notification.expiresAt = new Date(notification.expiresAt);
        }

        // Add new notification to the list
        setNotifications((prev) => [notification, ...prev]);

        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/icons/marking-notification.png',
            tag: notification.id,
          });
        }

        // Play notification sound for high priority
        if (notification.priority === 'high' || notification.priority === 'urgent') {
          playNotificationSound();
        }
      } catch (err) {
        console.error('Error parsing notification:', err);
      }
    };

    es.onerror = (error) => {
      console.error('SSE connection error:', error);
      es.close();
      setEventSource(null);
      
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        subscribeToNotifications();
      }, 5000);
    };

    setEventSource(es);
  }, [user, eventSource]);

  // Unsubscribe from real-time notifications
  const unsubscribeFromNotifications = useCallback(() => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
    }
  }, [eventSource]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/marking/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/marking/notifications/read-all', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true }))
      );
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, []);

  // Delete a notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/marking/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      // Update local state
      setNotifications((prev) =>
        prev.filter((notif) => notif.id !== notificationId)
      );
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, []);

  // Clear all notifications
  const clearAll = useCallback(async () => {
    try {
      const response = await fetch('/api/marking/notifications', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to clear notifications');
      }

      // Update local state
      setNotifications([]);
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  }, []);

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Fetch notifications on mount and when user changes
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Subscribe to real-time notifications on mount
  useEffect(() => {
    if (user) {
      subscribeToNotifications();
    }

    return () => {
      unsubscribeFromNotifications();
    };
  }, [user, subscribeToNotifications, unsubscribeFromNotifications]);

  // Auto-remove expired notifications
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setNotifications((prev) =>
        prev.filter((notif) => !notif.expiresAt || notif.expiresAt > now)
      );
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refetch: fetchNotifications,
    subscribeToNotifications,
    unsubscribeFromNotifications,
  };
};

// Helper function to play notification sound
function playNotificationSound() {
  try {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch((err) => {
      console.error('Error playing notification sound:', err);
    });
  } catch (err) {
    console.error('Error creating audio:', err);
  }
}

// Helper hook for filtering notifications by type
export const useFilteredNotifications = (
  type?: MarkingNotificationType | MarkingNotificationType[]
) => {
  const { notifications, ...rest } = useMarkingNotifications();

  const filteredNotifications = notifications.filter((notif) => {
    if (!type) return true;
    if (Array.isArray(type)) {
      return type.includes(notif.type);
    }
    return notif.type === type;
  });

  return {
    notifications: filteredNotifications,
    ...rest,
  };
};

// Helper hook for urgent notifications only
export const useUrgentNotifications = () => {
  const { notifications, ...rest } = useMarkingNotifications();

  const urgentNotifications = notifications.filter(
    (notif) => notif.priority === 'urgent' || notif.priority === 'high'
  );

  return {
    notifications: urgentNotifications,
    urgentCount: urgentNotifications.length,
    hasUrgent: urgentNotifications.length > 0,
    ...rest,
  };
};

// Helper hook for job-specific notifications
export const useJobNotifications = (markingJobId: string) => {
  const { notifications, ...rest } = useMarkingNotifications();

  const jobNotifications = notifications.filter(
    (notif) => notif.markingJobId === markingJobId
  );

  return {
    notifications: jobNotifications,
    ...rest,
  };
};