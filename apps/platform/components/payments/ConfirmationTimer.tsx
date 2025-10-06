"use client";

import { useEffect, useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@newcondo/ui/components/alert";
import { Progress } from "@newcondo/ui/components/progress";

interface ConfirmationTimerProps {
  deadline: Date;
  onExpire?: () => void;
  showProgress?: boolean;
  className?: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
  percentage: number;
}

const CONFIRMATION_PERIOD_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export function ConfirmationTimer({
  deadline,
  onExpire,
  showProgress = true,
  className,
}: ConfirmationTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(
    calculateTimeRemaining(deadline)
  );
  const [hasExpired, setHasExpired] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining(deadline);
      setTimeRemaining(remaining);

      if (remaining.total <= 0 && !hasExpired) {
        setHasExpired(true);
        onExpire?.();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline, hasExpired, onExpire]);

  function calculateTimeRemaining(targetDate: Date): TimeRemaining {
    const now = new Date().getTime();
    const target = new Date(targetDate).getTime();
    const total = target - now;

    if (total <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        total: 0,
        percentage: 0,
      };
    }

    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));

    const percentage = Math.max(0, Math.min(100, (total / CONFIRMATION_PERIOD_MS) * 100));

    return {
      days,
      hours,
      minutes,
      seconds,
      total,
      percentage,
    };
  }

  function getUrgencyLevel(): "normal" | "warning" | "critical" {
    if (timeRemaining.percentage > 50) return "normal";
    if (timeRemaining.percentage > 25) return "warning";
    return "critical";
  }

  function getUrgencyColor() {
    const urgency = getUrgencyLevel();
    switch (urgency) {
      case "normal":
        return "text-green-600 dark:text-green-400";
      case "warning":
        return "text-amber-600 dark:text-amber-400";
      case "critical":
        return "text-red-600 dark:text-red-400";
    }
  }

  function getProgressColor() {
    const urgency = getUrgencyLevel();
    switch (urgency) {
      case "normal":
        return "bg-green-500";
      case "warning":
        return "bg-amber-500";
      case "critical":
        return "bg-red-500";
    }
  }

  if (hasExpired || timeRemaining.total <= 0) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Confirmation period has expired. Payment has been automatically released to the property owner.
        </AlertDescription>
      </Alert>
    );
  }

  const urgency = getUrgencyLevel();

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <Clock className={cn("h-4 w-4", getUrgencyColor())} />
        <span className="text-sm font-medium text-muted-foreground">
          Confirmation Period Remaining
        </span>
      </div>

      <div className="flex items-baseline gap-2">
        {timeRemaining.days > 0 && (
          <div className="flex flex-col items-center">
            <span className={cn("text-3xl font-bold tabular-nums", getUrgencyColor())}>
              {timeRemaining.days}
            </span>
            <span className="text-xs text-muted-foreground">
              {timeRemaining.days === 1 ? "day" : "days"}
            </span>
          </div>
        )}
        <div className="flex flex-col items-center">
          <span className={cn("text-3xl font-bold tabular-nums", getUrgencyColor())}>
            {String(timeRemaining.hours).padStart(2, "0")}
          </span>
          <span className="text-xs text-muted-foreground">hours</span>
        </div>
        <span className={cn("text-3xl font-bold", getUrgencyColor())}>:</span>
        <div className="flex flex-col items-center">
          <span className={cn("text-3xl font-bold tabular-nums", getUrgencyColor())}>
            {String(timeRemaining.minutes).padStart(2, "0")}
          </span>
          <span className="text-xs text-muted-foreground">mins</span>
        </div>
        <span className={cn("text-3xl font-bold", getUrgencyColor())}>:</span>
        <div className="flex flex-col items-center">
          <span className={cn("text-3xl font-bold tabular-nums", getUrgencyColor())}>
            {String(timeRemaining.seconds).padStart(2, "0")}
          </span>
          <span className="text-xs text-muted-foreground">secs</span>
        </div>
      </div>

      {showProgress && (
        <div className="space-y-2">
          <Progress value={timeRemaining.percentage} className="h-2" indicatorClassName={getProgressColor()} />
          <p className="text-xs text-muted-foreground text-center">
            {urgency === "critical" && "⚠️ "}
            {timeRemaining.percentage.toFixed(1)}% of confirmation period remaining
            {urgency === "critical" && " - Action required soon!"}
          </p>
        </div>
      )}

      {urgency === "warning" && (
        <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            Less than 12 hours remaining. Please confirm or dispute soon to avoid automatic payment release.
          </AlertDescription>
        </Alert>
      )}

      {urgency === "critical" && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            ⚠️ Critical: Less than 6 hours remaining! If no action is taken, payment will automatically be released
            to the property owner.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}