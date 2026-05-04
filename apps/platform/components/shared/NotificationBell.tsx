// apps/platform/components/shared/NotificationBell.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, X, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  type: "MARKING_JOB" | "PAYMENT" | "PROPERTY" | "SYSTEM" | "VERIFICATION";
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  metadata?: {
    propertyId?: string;
    markingJobId?: string;
    distance?: number;
    urgency?: string;
  };
  createdAt: string;
}

interface NotificationBellProps {
  className?: string;
  onNotificationClick?: (notification: Notification) => void;
}

export function NotificationBell({
  className,
  onNotificationClick,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/notifications");
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications || []);
          setUnreadCount(
            data.notifications?.filter((n: Notification) => !n.isRead).length ||
              0
          );
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(
        `/api/notifications/${notificationId}/read`,
        {
          method: "PATCH",
        }
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "PATCH",
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        setUnreadCount((prev) =>
          Math.max(
            0,
            prev -
              (notifications.find((n) => n.id === notificationId)?.isRead
                ? 0
                : 1)
          )
        );
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);

    if (onNotificationClick) {
      onNotificationClick(notification);
    } else if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }

    setIsOpen(false);
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    const iconClasses = "h-5 w-5";
    switch (type) {
      case "MARKING_JOB":
        return (
          <div className="p-2 bg-blue-100 rounded-full">
            <Bell className={cn(iconClasses, "text-blue-600")} />
          </div>
        );
      case "PAYMENT":
        return (
          <div className="p-2 bg-green-100 rounded-full">
            <Check className={cn(iconClasses, "text-green-600")} />
          </div>
        );
      case "PROPERTY":
        return (
          <div className="p-2 bg-purple-100 rounded-full">
            <AlertCircle className={cn(iconClasses, "text-purple-600")} />
          </div>
        );
      case "VERIFICATION":
        return (
          <div className="p-2 bg-yellow-100 rounded-full">
            <AlertCircle className={cn(iconClasses, "text-yellow-600")} />
          </div>
        );
      default:
        return (
          <div className="p-2 bg-gray-100 rounded-full">
            <Bell className={cn(iconClasses, "text-gray-600")} />
          </div>
        );
    }
  };

  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2 rounded-full transition-colors",
          "hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
          isOpen && "bg-gray-100"
        )}
        aria-label="Notifications"
      >
        <Bell className="h-6 w-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Bell className="h-12 w-12 text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No notifications</p>
                <p className="text-sm text-gray-400 mt-1">
                  You&apos;re all caught up!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "relative group hover:bg-gray-50 transition-colors cursor-pointer",
                      !notification.isRead && "bg-blue-50/50"
                    )}
                  >
                    <div
                      onClick={() => handleNotificationClick(notification)}
                      className="p-4"
                    >
                      <div className="flex gap-3">
                        {getNotificationIcon(notification.type)}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-gray-900 text-sm">
                              {notification.title}
                            </p>
                            {!notification.isRead && (
                              <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full" />
                            )}
                          </div>

                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>

                          {notification.metadata?.distance !== undefined && (
                            <p className="text-xs text-gray-500 mt-1">
                              📍 {notification.metadata.distance.toFixed(1)}km
                              away
                            </p>
                          )}

                          <p className="text-xs text-gray-400 mt-2">
                            {getTimeAgo(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                      aria-label="Delete notification"
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-200 p-3">
              <button
                onClick={() => {
                  router.push("/dashboard/notifications");
                  setIsOpen(false);
                }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Compact notification badge for mobile
export function NotificationBadge({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  if (count === 0) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center",
        "min-w-[20px] h-5 px-1.5 text-xs font-bold",
        "text-white bg-red-500 rounded-full",
        className
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

// Notification toast for real-time updates
export function NotificationToast({
  notification,
  onClose,
  onAction,
}: {
  notification: Notification;
  onClose: () => void;
  onAction?: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getNotificationColor = (type: Notification["type"]) => {
    switch (type) {
      case "MARKING_JOB":
        return "bg-blue-50 border-blue-200 text-blue-900";
      case "PAYMENT":
        return "bg-green-50 border-green-200 text-green-900";
      case "PROPERTY":
        return "bg-purple-50 border-purple-200 text-purple-900";
      case "VERIFICATION":
        return "bg-yellow-50 border-yellow-200 text-yellow-900";
      default:
        return "bg-gray-50 border-gray-200 text-gray-900";
    }
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border shadow-lg",
        "animate-in slide-in-from-top-5 duration-300",
        getNotificationColor(notification.type)
      )}
    >
      <Bell className="h-5 w-5 flex-shrink-0 mt-0.5" />

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{notification.title}</p>
        <p className="text-sm mt-1">{notification.message}</p>

        {onAction && notification.actionUrl && (
          <button
            onClick={onAction}
            className="text-sm font-medium underline mt-2 hover:opacity-80"
          >
            View Details
          </button>
        )}
      </div>

      <button
        onClick={onClose}
        className="flex-shrink-0 p-1 hover:bg-black/5 rounded"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// Inline notification for specific contexts
export function InlineNotification({
  type,
  title,
  message,
  action,
  onDismiss,
  className,
}: {
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
  className?: string;
}) {
  const typeConfig = {
    info: {
      icon: Bell,
      className: "bg-blue-50 border-blue-200 text-blue-900",
      iconColor: "text-blue-600",
    },
    success: {
      icon: Check,
      className: "bg-green-50 border-green-200 text-green-900",
      iconColor: "text-green-600",
    },
    warning: {
      icon: AlertCircle,
      className: "bg-yellow-50 border-yellow-200 text-yellow-900",
      iconColor: "text-yellow-600",
    },
    error: {
      icon: X,
      className: "bg-red-50 border-red-200 text-red-900",
      iconColor: "text-red-600",
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border",
        config.className,
        className
      )}
    >
      <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", config.iconColor)} />

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-sm mt-1">{message}</p>

        {action && (
          <button
            onClick={action.onClick}
            className="text-sm font-medium underline mt-2 hover:opacity-80"
          >
            {action.label}
          </button>
        )}
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 hover:bg-black/5 rounded"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}