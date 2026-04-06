"use client";

import { useEffect, useState } from "react";
import { Lock, AlertTriangle, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@newcondo/ui/components/alert";
import { Progress } from "@newcondo/ui/components/progress";
import { cn } from "@newcondo/ui";

interface PropertyLockIndicatorProps {
  isLocked: boolean;
  lockExpiresAt?: Date | string | null;
  lockedBy?: string | null; // User ID or identifier
  currentUserId?: string;
  onLockExpired?: () => void;
  variant?: "default" | "compact" | "detailed";
  className?: string;
}

export function PropertyLockIndicator({
  isLocked,
  lockExpiresAt,
  lockedBy,
  currentUserId,
  onLockExpired,
  variant = "default",
  className,
}: PropertyLockIndicatorProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [progress, setProgress] = useState<number>(100);

  const LOCK_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

  useEffect(() => {
    if (!isLocked || !lockExpiresAt) {
      setTimeRemaining(0);
      setProgress(100);
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(lockExpiresAt).getTime();
      const remaining = Math.max(0, expiry - now);

      setTimeRemaining(remaining);

      // Calculate progress (percentage of time remaining)
      const elapsed = LOCK_DURATION - remaining;
      const progressPercent = Math.min(100, (elapsed / LOCK_DURATION) * 100);
      setProgress(progressPercent);

      if (remaining <= 0 && onLockExpired) {
        onLockExpired();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [isLocked, lockExpiresAt, onLockExpired]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const isOwnLock = lockedBy === currentUserId;

  if (!isLocked) {
    return null;
  }

  // Compact variant - minimal display
  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2 text-sm", className)}>
        <Lock className="h-4 w-4 text-yellow-600" />
        <span className="text-yellow-700 font-medium">
          {isOwnLock ? "Your payment" : "Payment"} in progress
        </span>
        <span className="text-muted-foreground">
          {formatTime(timeRemaining)}
        </span>
      </div>
    );
  }

  // Detailed variant - full information
  if (variant === "detailed") {
    return (
      <div className={cn("space-y-3", className)}>
        <Alert variant="default"
          className={cn(
            !isOwnLock && "border-yellow-500 bg-yellow-50 text-yellow-800 [&>svg]:text-yellow-600",
            "relative overflow-hidden",  // keep existing className for the default variant usage
            className
          )}
        >
          <Lock className="h-4 w-4" />
          <AlertTitle>
            {isOwnLock
              ? "Complete Your Payment"
              : "Property Temporarily Unavailable"}
          </AlertTitle>
          <AlertDescription>
            {isOwnLock ? (
              <>
                You have <strong>{formatTime(timeRemaining)}</strong> to
                complete this payment. The property is reserved for you during
                this time.
              </>
            ) : (
              <>
                Another user is currently completing their payment. This
                property will become available again in{" "}
                <strong>{formatTime(timeRemaining)}</strong> if the payment is
                not completed.
              </>
            )}
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Time remaining</span>
            <span className="font-medium">{formatTime(timeRemaining)}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {timeRemaining < 5 * 60 * 1000 && isOwnLock && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Less than 5 minutes remaining! Please complete your payment soon.
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <Alert
      variant="default"
      className={cn(
        !isOwnLock && "border-yellow-500 bg-yellow-50 text-yellow-800 [&>svg]:text-yellow-600",
        "relative overflow-hidden",  // keep existing className for the default variant usage
        className
      )}
    >
      <div
        className="absolute inset-0 bg-yellow-100 opacity-20 transition-all duration-1000"
        style={{ width: `${100 - progress}%` }}
      />
      <div className="relative flex items-start gap-3">
        {isOwnLock ? (
          <Clock className="h-5 w-5 mt-0.5" />
        ) : (
          <Lock className="h-5 w-5 mt-0.5" />
        )}
        <div className="flex-1 space-y-1">
          <AlertTitle className="mb-1">
            {isOwnLock
              ? "Complete your payment"
              : "Payment in progress"}
          </AlertTitle>
          <AlertDescription>
            {isOwnLock ? (
              <>
                You have <span className="font-semibold">{formatTime(timeRemaining)}</span> to
                complete this transaction.
              </>
            ) : (
              <>
                This property will be available in{" "}
                <span className="font-semibold">{formatTime(timeRemaining)}</span> if the
                current payment is not completed.
              </>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}

// Hook for managing lock state
export function usePropertyLock(propertyId: string, unitId?: string) {
  const [isLocked, setIsLocked] = useState(false);
  const [lockExpiresAt, setLockExpiresAt] = useState<Date | null>(null);
  const [lockedBy, setLockedBy] = useState<string | null>(null);

  // This would typically fetch from your backend
  useEffect(() => {
    // Implementation would fetch lock status from API
    // and set up WebSocket or polling for real-time updates
  }, [propertyId, unitId]);

  return {
    isLocked,
    lockExpiresAt,
    lockedBy,
    refreshLock: () => {
      // Refresh lock status from API
    },
  };
}