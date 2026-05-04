"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@newcondo/ui/components/card";
import { Progress } from "@newcondo/ui/components/progress";
import { Badge } from "@newcondo/ui/components/badge";
import { Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarkingTimerCountdownProps {
  expiryTime: Date | string;
  totalDuration?: number; // in milliseconds, default 3 hours
  onExpire?: () => void;
  variant?: "compact" | "detailed";
  showProgress?: boolean;
}

export function MarkingTimerCountdown({
  expiryTime,
  totalDuration = 3 * 60 * 60 * 1000, // 3 hours in milliseconds
  onExpire,
  variant = "detailed",
  showProgress = true,
}: MarkingTimerCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiryTime).getTime();
      const remaining = expiry - now;

      if (remaining <= 0) {
        setTimeRemaining(0);
        if (!isExpired) {
          setIsExpired(true);
          onExpire?.();
        }
      } else {
        setTimeRemaining(remaining);
        setIsExpired(false);
      }
    };

    // Calculate immediately
    calculateTimeRemaining();

    // Update every second
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [expiryTime, isExpired, onExpire]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    const h = hours;
    const m = minutes % 60;
    const s = seconds % 60;

    return {
      hours: h,
      minutes: m,
      seconds: s,
      formatted: `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s
        .toString()
        .padStart(2, "0")}`,
    };
  };

  const time = formatTime(timeRemaining);
  const progressPercentage = (timeRemaining / totalDuration) * 100;

  // Determine urgency level
  const getUrgencyLevel = () => {
    if (isExpired) return "expired";
    if (timeRemaining < 30 * 60 * 1000) return "critical"; // < 30 minutes
    if (timeRemaining < 60 * 60 * 1000) return "warning"; // < 1 hour
    return "normal";
  };

  const urgencyLevel = getUrgencyLevel();

  const getUrgencyColor = () => {
    switch (urgencyLevel) {
      case "expired":
        return "text-destructive";
      case "critical":
        return "text-red-600";
      case "warning":
        return "text-amber-600";
      default:
        return "text-green-600";
    }
  };

  // const getProgressColor = () => {
  //   switch (urgencyLevel) {
  //     case "expired":
  //       return "bg-destructive";
  //     case "critical":
  //       return "bg-red-500";
  //     case "warning":
  //       return "bg-amber-500";
  //     default:
  //       return "bg-green-500";
  //   }
  // };

  const getBadgeVariant = () => {
    switch (urgencyLevel) {
      case "expired":
        return "destructive";
      case "critical":
        return "destructive";
      case "warning":
        return "secondary";
      default:
        return "default";
    }
  };

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2">
        {isExpired ? (
          <>
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">Time Expired</span>
          </>
        ) : (
          <>
            <Clock className={cn("h-4 w-4", getUrgencyColor())} />
            <span className={cn("text-sm font-mono font-medium", getUrgencyColor())}>
              {time.formatted}
            </span>
          </>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isExpired ? (
              <AlertCircle className="h-5 w-5 text-destructive" />
            ) : (
              <Clock className={cn("h-5 w-5", getUrgencyColor())} />
            )}
            <h3 className="font-semibold">
              {isExpired ? "Time Slot Expired" : "Time Remaining"}
            </h3>
          </div>
          <Badge variant={getBadgeVariant()}>
            {isExpired
              ? "Expired"
              : urgencyLevel === "critical"
              ? "Urgent"
              : urgencyLevel === "warning"
              ? "Hurry"
              : "Active"}
          </Badge>
        </div>

        {/* Timer Display */}
        <div
          className={cn(
            "flex items-center justify-center gap-4 rounded-lg bg-muted/50 p-6",
            isExpired && "bg-destructive/10"
          )}
        >
          {isExpired ? (
            <div className="text-center">
              <p className="text-2xl font-bold text-destructive">00:00:00</p>
              <p className="text-sm text-muted-foreground mt-1">Time slot has expired</p>
            </div>
          ) : (
            <>
              <div className="text-center">
                <p className={cn("text-3xl font-mono font-bold", getUrgencyColor())}>
                  {time.hours.toString().padStart(2, "0")}
                </p>
                <p className="text-xs text-muted-foreground">Hours</p>
              </div>
              <span className={cn("text-2xl font-bold", getUrgencyColor())}>:</span>
              <div className="text-center">
                <p className={cn("text-3xl font-mono font-bold", getUrgencyColor())}>
                  {time.minutes.toString().padStart(2, "0")}
                </p>
                <p className="text-xs text-muted-foreground">Minutes</p>
              </div>
              <span className={cn("text-2xl font-bold", getUrgencyColor())}>:</span>
              <div className="text-center">
                <p className={cn("text-3xl font-mono font-bold", getUrgencyColor())}>
                  {time.seconds.toString().padStart(2, "0")}
                </p>
                <p className="text-xs text-muted-foreground">Seconds</p>
              </div>
            </>
          )}
        </div>

        {/* Progress Bar */}
        {showProgress && !isExpired && (
          <div className="space-y-2">
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Started</span>
              <span className={cn("font-medium", getUrgencyColor())}>
                {Math.round(progressPercentage)}% remaining
              </span>
              <span>3 hours</span>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {!isExpired && urgencyLevel === "critical" && (
          <div className="flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-800">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              <strong>Critical:</strong> Less than 30 minutes remaining. Please complete the
              marking immediately or the job will expire.
            </p>
          </div>
        )}

        {!isExpired && urgencyLevel === "warning" && (
          <div className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              <strong>Warning:</strong> Less than 1 hour remaining. Please complete the marking
              soon.
            </p>
          </div>
        )}

        {isExpired && (
          <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              Your time slot has expired. The marking job has been reassigned to the next agent in
              the queue.
            </p>
          </div>
        )}

        {!isExpired && urgencyLevel === "normal" && (
          <div className="flex items-start gap-2 rounded-md bg-green-50 p-3 text-sm text-green-800">
            <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>You have sufficient time to complete this marking job. Work carefully and safely.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}