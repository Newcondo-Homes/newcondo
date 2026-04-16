// apps/platform/hooks/useReferralNotifications.ts
"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "@newcondo/ui/";

interface ReferralNotification {
  id: string;
  type:
    | "referral_signup"
    | "referral_qualified"
    | "reward_earned"
    | "reward_expiring"
    | "milestone_reached";
  title: string;
  message: string;
  data?: Record<string, any>;
  createdAt: string;
  read: boolean;
}

interface UseReferralNotificationsReturn {
  notifications: ReferralNotification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refresh: () => Promise<void>;
  isLoading: boolean;
}

export function useReferralNotifications(): UseReferralNotificationsReturn {
  const [notifications, setNotifications] = useState<ReferralNotification[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/referrals/notifications");
      if (!response.ok) throw new Error("Failed to fetch notifications");

      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error("Error fetching referral notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(
        `/api/referrals/notifications/${notificationId}/read`,
        {
          method: "PATCH",
        }
      );

      if (!response.ok) throw new Error("Failed to mark as read");

      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch("/api/referrals/notifications/read-all", {
        method: "PATCH",
      });

      if (!response.ok) throw new Error("Failed to mark all as read");

      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true }))
      );
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(
        `/api/referrals/notifications/${notificationId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Failed to delete notification");

      setNotifications((prev) =>
        prev.filter((notif) => notif.id !== notificationId)
      );
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  }, []);

  // Set up real-time notifications via Server-Sent Events
  useEffect(() => {
    // Initial fetch
    fetchNotifications();

    // Set up SSE connection for real-time updates
    const eventSource = new EventSource("/api/referrals/notifications/stream");

    eventSource.onmessage = (event) => {
      try {
        const notification: ReferralNotification = JSON.parse(event.data);

        // Add new notification to state
        setNotifications((prev) => [notification, ...prev]);

        // Show toast for important notifications
        if (
          notification.type === "reward_earned" ||
          notification.type === "referral_qualified"
        ) {
          toast(notification.title,{
            description: notification.message,
            duration: 5000,
          });
        }
      } catch (error) {
        console.error("Error parsing notification:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
      eventSource.close();
    };

    // Cleanup
    return () => {
      eventSource.close();
    };
  }, [fetchNotifications, toast]);

  // Poll for updates every 30 seconds as fallback
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications,
    isLoading,
  };
}

// Hook for showing real-time toast notifications
export function useReferralToasts() {

  useEffect(() => {
    const eventSource = new EventSource("/api/referrals/notifications/stream");

    eventSource.onmessage = (event) => {
      try {
        const notification: ReferralNotification = JSON.parse(event.data);

        // Show toast based on notification type
        switch (notification.type) {
          case "referral_signup":
            toast.success("🎉 New Referral Signup!",{
              description: notification.message,
              duration: 5000,
            });
            break;

          case "referral_qualified":
            toast("✅ Referral Qualified!",{
              description: notification.message,
              duration: 7000,
            });
            break;

          case "reward_earned":
            toast.success("💰 Reward Earned!",{
              description: notification.message,
              duration: 7000,
            });
            break;

          case "reward_expiring":
            toast("⏰ Reward Expiring Soon",{
              description: notification.message,
              duration: 10000,
            });
            break;

          case "milestone_reached":
            toast("🏆 Milestone Reached!",{
              description: notification.message,
              duration: 7000,
            });
            break;
        }
      } catch (error) {
        console.error("Error parsing notification:", error);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [toast]);
}

// Hook for checking expiring rewards
export function useExpiringRewards() {
  const [expiringRewards, setExpiringRewards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExpiringRewards = async () => {
      try {
        const response = await fetch("/api/referrals/rewards/expiring");
        if (!response.ok) throw new Error("Failed to fetch expiring rewards");

        const data = await response.json();
        setExpiringRewards(data.rewards || []);
      } catch (error) {
        console.error("Error fetching expiring rewards:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExpiringRewards();

    // Refresh every hour
    const interval = setInterval(fetchExpiringRewards, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    expiringRewards,
    isLoading,
    hasExpiringRewards: expiringRewards.length > 0,
  };
}