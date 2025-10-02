"use client";

import { Badge } from "@newcondo/ui/components/ui/badge";
import { Clock, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/helpers";

interface AvailabilityBadgeProps {
  isAvailable: boolean;
  isLocked?: boolean;
  lockExpiresAt?: Date | string | null;
  className?: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

export function AvailabilityBadge({
  isAvailable,
  isLocked = false,
  lockExpiresAt,
  className,
  showIcon = true,
  size = "md",
}: AvailabilityBadgeProps) {
  // Calculate time remaining if locked
  const getTimeRemaining = () => {
    if (!lockExpiresAt) return null;
    const now = new Date().getTime();
    const expiry = new Date(lockExpiresAt).getTime();
    const diff = expiry - now;
    
    if (diff <= 0) return null;
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    return { minutes, seconds };
  };

  const timeRemaining = isLocked ? getTimeRemaining() : null;

  // Determine badge variant and content
  const getBadgeConfig = () => {
    if (isLocked && timeRemaining) {
      return {
        variant: "warning" as const,
        text: "Payment in Progress",
        subText: `${timeRemaining.minutes}:${timeRemaining.seconds.toString().padStart(2, "0")} left`,
        icon: Lock,
        className: "bg-yellow-100 text-yellow-800 border-yellow-300",
      };
    }

    if (!isAvailable) {
      return {
        variant: "destructive" as const,
        text: "Unavailable",
        subText: "Property rented",
        icon: AlertCircle,
        className: "bg-red-100 text-red-800 border-red-300",
      };
    }

    return {
      variant: "success" as const,
      text: "Available",
      subText: "Ready to rent",
      icon: CheckCircle2,
      className: "bg-green-100 text-green-800 border-green-300",
    };
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  return (
    <div className={cn("inline-flex flex-col gap-0.5", className)}>
      <Badge
        variant={config.variant}
        className={cn(
          "flex items-center gap-1.5 font-medium border",
          config.className,
          sizeClasses[size]
        )}
      >
        {showIcon && <Icon className="h-3.5 w-3.5" />}
        <span>{config.text}</span>
      </Badge>
      
      {timeRemaining && (
        <span className="text-xs text-muted-foreground ml-1">
          {config.subText}
        </span>
      )}
    </div>
  );
}

// Variant for inline display (smaller)
export function InlineAvailabilityBadge({
  isAvailable,
  isLocked,
  className,
}: Pick<AvailabilityBadgeProps, "isAvailable" | "isLocked" | "className">) {
  return (
    <AvailabilityBadge
      isAvailable={isAvailable}
      isLocked={isLocked}
      size="sm"
      showIcon={true}
      className={className}
    />
  );
}