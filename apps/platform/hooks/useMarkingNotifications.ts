// apps/platform/hooks/useMarkingNotifications.ts
'use client'

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








// import { useState, useCallback, useEffect, useRef } from 'react';
// import { useQueryClient } from '@tanstack/react-query';
// import { useAuth } from './useAuth';

// // Types for notifications
// interface Notification {
//   id: string;
//   type: NotificationType;
//   title: string;
//   message: string;
//   data: Record<string, any>;
//   read: boolean;
//   readAt?: Date;
//   createdAt: Date;
// }

// interface MarkingJobNotification extends Notification {
//   data: {
//     markingJobId: string;
//     propertyId: string;
//     address: string;
//     urgencyLevel: string;
//     markingFee: number;
//     queuePosition: number;
//     timeSlotExpiry?: Date;
//     assignedAgentId?: string;
//     propertyOwnerId?: string;
//   };
// }

// interface NotificationPreferences {
//   emailNotifications: boolean;
//   smsNotifications: boolean;
//   pushNotifications: boolean;
//   inAppNotifications: boolean;
//   notifyForUrgentOnly: boolean;
//   notifyForHighFeeJobs: boolean;
//   minFeeThreshold?: number;
//   quietHoursStart?: string; // HH:mm format
//   quietHoursEnd?: string;
//   mutedServiceAreas?: string[];
// }

// type NotificationType =
//   | 'JOB_ASSIGNED'
//   | 'JOB_AVAILABLE'
//   | 'JOB_REMINDER'
//   | 'TIME_SLOT_WARNING'
//   | 'JOB_EXPIRED'
//   | 'PROPERTY_CONFIRMED'
//   | 'PAYMENT_RELEASED'
//   | 'QUEUE_POSITION_CHANGED'
//   | 'AGENT_PERFORMANCE_UPDATE'
//   | 'MARKING_REQUEST_RECEIVED';

// /**
//  * Hook to manage real-time notifications for marking jobs
//  * Handles WebSocket connections, notification preferences, and state management
//  */
// export const useMarkingNotifications = () => {
//   const { user } = useAuth();
//   const queryClient = useQueryClient();

//   const [notifications, setNotifications] = useState<Notification[]>([]);
//   const [unreadCount, setUnreadCount] = useState(0);
//   const [notificationPreferences, setNotificationPreferences] =
//     useState<NotificationPreferences>({
//       emailNotifications: true,
//       smsNotifications: false,
//       pushNotifications: true,
//       inAppNotifications: true,
//       notifyForUrgentOnly: false,
//       notifyForHighFeeJobs: true,
//       minFeeThreshold: 20000,
//     });

//   const [isConnected, setIsConnected] = useState(false);
//   const [connectionError, setConnectionError] = useState<string | null>(null);
//   const wsRef = useRef<WebSocket | null>(null);
//   const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

//   // Initialize WebSocket connection for real-time notifications
//   const connectWebSocket = useCallback(() => {
//     if (!user?.id) return;

//     try {
//       const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
//       const wsUrl = `${protocol}//${window.location.host}/api/ws/marking-notifications?userId=${user.id}`;

//       wsRef.current = new WebSocket(wsUrl);

//       wsRef.current.onopen = () => {
//         setIsConnected(true);
//         setConnectionError(null);
//       };

//       wsRef.current.onmessage = (event) => {
//         try {
//           const notification = JSON.parse(event.data) as Notification;
//           handleNewNotification(notification);
//         } catch (error) {
//           console.error('Failed to parse notification:', error);
//         }
//       };

//       wsRef.current.onerror = (error) => {
//         console.error('WebSocket error:', error);
//         setConnectionError('Failed to connect to notification service');
//       };

//       wsRef.current.onclose = () => {
//         setIsConnected(false);
//         // Attempt to reconnect after 5 seconds
//         reconnectTimeoutRef.current = setTimeout(() => {
//           connectWebSocket();
//         }, 5000);
//       };
//     } catch (error) {
//       console.error('WebSocket connection failed:', error);
//       setConnectionError('Unable to establish connection');
//     }
//   }, [user?.id]);

//   // Disconnect WebSocket
//   const disconnectWebSocket = useCallback(() => {
//     if (wsRef.current) {
//       wsRef.current.close();
//       wsRef.current = null;
//     }
//     if (reconnectTimeoutRef.current) {
//       clearTimeout(reconnectTimeoutRef.current);
//     }
//     setIsConnected(false);
//   }, []);

//   // Handle new incoming notification
//   const handleNewNotification = useCallback(
//     (notification: Notification) => {
//       // Check if notification should be suppressed based on preferences
//       if (!shouldShowNotification(notification)) {
//         return;
//       }

//       // Add to notifications list
//       setNotifications((prev) => [notification, ...prev]);
//       setUnreadCount((prev) => prev + 1);

//       // Trigger browser notification if enabled
//       if (notificationPreferences.pushNotifications && 'Notification' in window) {
//         new Notification(notification.title, {
//           body: notification.message,
//           icon: '/images/icons/marking-job.png',
//           tag: notification.id,
//         });
//       }

//       // Invalidate relevant queries to refresh data
//       invalidateRelatedQueries(notification);
//     },
//     [notificationPreferences]
//   );

//   // Check if notification should be shown based on user preferences
//   const shouldShowNotification = (notification: Notification): boolean => {
//     // Always show in quiet hours unless notification is urgent
//     const now = new Date();
//     const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now
//       .getMinutes()
//       .toString()
//       .padStart(2, '0')}`;

//     if (
//       notificationPreferences.quietHoursStart &&
//       notificationPreferences.quietHoursEnd
//     ) {
//       const isInQuietHours =
//         currentTime >= notificationPreferences.quietHoursStart &&
//         currentTime < notificationPreferences.quietHoursEnd;

//       if (
//         isInQuietHours &&
//         notification.type !== 'TIME_SLOT_WARNING' &&
//         notification.type !== 'JOB_EXPIRED'
//       ) {
//         return false;
//       }
//     }

//     // Filter by urgency if preference enabled
//     if (notificationPreferences.notifyForUrgentOnly) {
//       const jobNotif = notification as MarkingJobNotification;
//       if (
//         jobNotif.data?.urgencyLevel &&
//         !['URGENT', 'HIGH'].includes(jobNotif.data.urgencyLevel)
//       ) {
//         return false;
//       }
//     }

//     // Filter by fee threshold
//     if (notificationPreferences.notifyForHighFeeJobs) {
//       const jobNotif = notification as MarkingJobNotification;
//       if (
//         jobNotif.data?.markingFee &&
//         jobNotif.data.markingFee < (notificationPreferences.minFeeThreshold || 0)
//       ) {
//         return false;
//       }
//     }

//     // Filter by service area
//     if (notificationPreferences.mutedServiceAreas?.length) {
//       const jobNotif = notification as MarkingJobNotification;
//       if (
//         jobNotif.data?.address &&
//         notificationPreferences.mutedServiceAreas.some((area) =>
//           jobNotif.data.address.includes(area)
//         )
//       ) {
//         return false;
//       }
//     }

//     return true;
//   };

//   // Invalidate related queries when notification received
//   const invalidateRelatedQueries = (notification: Notification) => {
//     switch (notification.type) {
//       case 'JOB_ASSIGNED':
//       case 'JOB_AVAILABLE':
//         queryClient.invalidateQueries({ queryKey: ['queuedJobs'] });
//         queryClient.invalidateQueries({ queryKey: ['myAssignedJobs'] });
//         break;
//       case 'QUEUE_POSITION_CHANGED':
//         queryClient.invalidateQueries({ queryKey: ['myAssignedJobs'] });
//         break;
//       case 'PAYMENT_RELEASED':
//         queryClient.invalidateQueries({ queryKey: ['agentPerformance'] });
//         break;
//       case 'PROPERTY_CONFIRMED':
//         queryClient.invalidateQueries({ queryKey: ['myAssignedJobs'] });
//         break;
//       default:
//         break;
//     }
//   };

//   // Mark notification as read
//   const markNotificationAsRead = useCallback(
//     async (notificationId: string) => {
//       // Update local state immediately
//       setNotifications((prev) =>
//         prev.map((notif) =>
//           notif.id === notificationId
//             ? { ...notif, read: true, readAt: new Date() }
//             : notif
//         )
//       );
//       setUnreadCount((prev) => Math.max(0, prev - 1));

//       // Send to server
//       try {
//         await fetch(`/api/notifications/${notificationId}/read`, {
//           method: 'PATCH',
//           headers: { 'Content-Type': 'application/json' },
//         });
//       } catch (error) {
//         console.error('Failed to mark notification as read:', error);
//       }
//     },
//     []
//   );

//   // Mark all notifications as read
//   const markAllAsRead = useCallback(async () => {
//     setNotifications((prev) =>
//       prev.map((notif) => ({
//         ...notif,
//         read: true,
//         readAt: new Date(),
//       }))
//     );
//     setUnreadCount(0);

//     try {
//       await fetch('/api/notifications/read-all', {
//         method: 'PATCH',
//         headers: { 'Content-Type': 'application/json' },
//       });
//     } catch (error) {
//       console.error('Failed to mark all notifications as read:', error);
//     }
//   }, []);

//   // Delete notification
//   const deleteNotification = useCallback(
//     async (notificationId: string) => {
//       const notification = notifications.find((n) => n.id === notificationId);

//       // Update local state
//       setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));
//       if (notification && !notification.read) {
//         setUnreadCount((prev) => Math.max(0, prev - 1));
//       }

//       // Send to server
//       try {
//         await fetch(`/api/notifications/${notificationId}`, {
//           method: 'DELETE',
//           headers: { 'Content-Type': 'application/json' },
//         });
//       } catch (error) {
//         console.error('Failed to delete notification:', error);
//       }
//     },
//     [notifications]
//   );

//   // Clear all notifications
//   const clearAllNotifications = useCallback(async () => {
//     setNotifications([]);
//     setUnreadCount(0);

//     try {
//       await fetch('/api/notifications/clear-all', {
//         method: 'DELETE',
//         headers: { 'Content-Type': 'application/json' },
//       });
//     } catch (error) {
//       console.error('Failed to clear notifications:', error);
//     }
//   }, []);

//   // Update notification preferences
//   const updateNotificationPreferences = useCallback(
//     async (preferences: Partial<NotificationPreferences>) => {
//       const updated = { ...notificationPreferences, ...preferences };
//       setNotificationPreferences(updated);

//       try {
//         await fetch('/api/notifications/preferences', {
//           method: 'PATCH',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify(updated),
//         });
//       } catch (error) {
//         console.error('Failed to update notification preferences:', error);
//       }
//     },
//     [notificationPreferences]
//   );

//   // Request browser notification permission
//   const requestNotificationPermission = useCallback(async () => {
//     if (!('Notification' in window)) {
//       setConnectionError('Browser does not support notifications');
//       return false;
//     }

//     if (Notification.permission === 'granted') {
//       return true;
//     }

//     if (Notification.permission !== 'denied') {
//       try {
//         const permission = await Notification.requestPermission();
//         return permission === 'granted';
//       } catch (error) {
//         console.error('Failed to request notification permission:', error);
//         return false;
//       }
//     }

//     return false;
//   }, []);

//   // Get notifications filtered by type
//   const getNotificationsByType = useCallback(
//     (type: NotificationType) => {
//       return notifications.filter((n) => n.type === type);
//     },
//     [notifications]
//   );

//   // Get unread notifications
//   const getUnreadNotifications = useCallback(() => {
//     return notifications.filter((n) => !n.read);
//   }, [notifications]);

//   // Get recent notifications
//   const getRecentNotifications = useCallback(
//     (limit = 10) => {
//       return notifications.slice(0, limit);
//     },
//     [notifications]
//   );

//   // Initialize WebSocket on mount
//   useEffect(() => {
//     if (user?.id) {
//       connectWebSocket();
//     }

//     return () => {
//       disconnectWebSocket();
//     };
//   }, [user?.id, connectWebSocket, disconnectWebSocket]);

//   // Request notification permission on mount
//   useEffect(() => {
//     if (notificationPreferences.pushNotifications) {
//       requestNotificationPermission();
//     }
//   }, [requestNotificationPermission, notificationPreferences.pushNotifications]);

//   return {
//     // Data
//     notifications,
//     unreadCount,
//     notificationPreferences,

//     // Connection status
//     isConnected,
//     connectionError,

//     // Actions
//     markNotificationAsRead,
//     markAllAsRead,
//     deleteNotification,
//     clearAllNotifications,
//     updateNotificationPreferences,
//     requestNotificationPermission,

//     // Utilities
//     getNotificationsByType,
//     getUnreadNotifications,
//     getRecentNotifications,

//     // WebSocket management
//     connectWebSocket,
//     disconnectWebSocket,
//   };
// };

// export default useMarkingNotifications;