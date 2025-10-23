// apps/platform/components/shared/TimeSlotIndicator.tsx
"use client";

import { useEffect, useState } from "react";
import { Clock, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimeSlotIndicatorProps {
  expiryTime: Date | string;
  totalDuration?: number; // in milliseconds
  onExpiry?: () => void;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "warning" | "danger";
  showProgress?: boolean;
  className?: string;
}

export function TimeSlotIndicator({
  expiryTime,
  totalDuration = 3 * 60 * 60 * 1000, // Default 3 hours
  onExpiry,
  size = "md",
  variant,
  showProgress = true,
  className,
}: TimeSlotIndicatorProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiryTime).getTime();
      const remaining = expiry - now;

      if (remaining <= 0) {
        setIsExpired(true);
        setTimeRemaining(0);
        onExpiry?.();
        return;
      }

      setTimeRemaining(remaining);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [expiryTime, onExpiry]);

  const formatTime = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const getProgressPercentage = (): number => {
    return ((totalDuration - timeRemaining) / totalDuration) * 100;
  };

  const getVariant = (): "default" | "warning" | "danger" => {
    if (variant) return variant;

    const percentage = (timeRemaining / totalDuration) * 100;
    if (percentage <= 10) return "danger";
    if (percentage <= 30) return "warning";
    return "default";
  };

  const currentVariant = getVariant();

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-2",
    lg: "text-base px-4 py-3",
  };

  const variantClasses = {
    default: "bg-blue-50 text-blue-700 border-blue-200",
    warning: "bg-yellow-50 text-yellow-700 border-yellow-200",
    danger: "bg-red-50 text-red-700 border-red-200",
  };

  const progressColors = {
    default: "bg-blue-500",
    warning: "bg-yellow-500",
    danger: "bg-red-500",
  };

  if (isExpired) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border",
          "bg-gray-50 text-gray-700 border-gray-200",
          sizeClasses[size],
          className
        )}
      >
        <AlertCircle className="h-4 w-4" />
        <span className="font-medium">Time Expired</span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border",
          variantClasses[currentVariant],
          sizeClasses[size]
        )}
      >
        <Clock className="h-4 w-4" />
        <span className="font-medium">{formatTime(timeRemaining)}</span>
        {currentVariant === "danger" && (
          <span className="text-xs">(Expiring soon!)</span>
        )}
      </div>

      {showProgress && (
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-1000 rounded-full",
              progressColors[currentVariant]
            )}
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      )}
    </div>
  );
}

// Compact version for lists
export function CompactTimeSlotIndicator({
  expiryTime,
  className,
}: {
  expiryTime: Date | string;
  className?: string;
}) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiryTime).getTime();
      const remaining = expiry - now;
      setTimeRemaining(Math.max(0, remaining));
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [expiryTime]);

  const formatCompactTime = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m`;
    return "< 1m";
  };

  if (timeRemaining === 0) {
    return (
      <span className={cn("text-xs text-red-600 font-medium", className)}>
        Expired
      </span>
    );
  }

  return (
    <span
      className={cn(
        "text-xs font-medium",
        timeRemaining < 30 * 60 * 1000
          ? "text-red-600"
          : timeRemaining < 60 * 60 * 1000
          ? "text-yellow-600"
          : "text-blue-600",
        className
      )}
    >
      {formatCompactTime(timeRemaining)} left
    </span>
  );
}

// Time slot status badge
export function TimeSlotStatus({
  status,
  expiryTime,
  size = "md",
  className,
}: {
  status: "QUEUED" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "EXPIRED";
  expiryTime?: Date | string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-2.5 py-1.5",
    lg: "text-base px-3 py-2",
  };

  const statusConfig = {
    QUEUED: {
      label: "Queued",
      icon: Clock,
      className: "bg-gray-100 text-gray-700 border-gray-300",
    },
    ASSIGNED: {
      label: "Assigned",
      icon: Clock,
      className: "bg-blue-100 text-blue-700 border-blue-300",
    },
    IN_PROGRESS: {
      label: "In Progress",
      icon: Clock,
      className: "bg-yellow-100 text-yellow-700 border-yellow-300",
    },
    COMPLETED: {
      label: "Completed",
      icon: CheckCircle,
      className: "bg-green-100 text-green-700 border-green-300",
    },
    EXPIRED: {
      label: "Expired",
      icon: AlertCircle,
      className: "bg-red-100 text-red-700 border-red-300",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={cn("inline-flex flex-col gap-1", className)}>
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border font-medium",
          config.className,
          sizeClasses[size]
        )}
      >
        <Icon className="h-4 w-4" />
        <span>{config.label}</span>
      </div>

      {expiryTime && (status === "ASSIGNED" || status === "IN_PROGRESS") && (
        <CompactTimeSlotIndicator expiryTime={expiryTime} />
      )}
    </div>
  );
}