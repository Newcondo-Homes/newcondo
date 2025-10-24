// apps/platform/components/marking/ConfirmationTimer.tsx
"use client";

import { useState, useEffect } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { Progress } from "@newcondo/ui/progress";

interface ConfirmationTimerProps {
  deadline: string;
  totalDuration?: number; // in milliseconds, default 2-3 days
  onExpiry?: () => void;
}

export function ConfirmationTimer({
  deadline,
  totalDuration = 2 * 24 * 60 * 60 * 1000, // 2 days default
  onExpiry,
}: ConfirmationTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const deadlineTime = new Date(deadline).getTime();
      const remaining = deadlineTime - now;

      if (remaining <= 0) {
        setIsExpired(true);
        setTimeRemaining(0);
        onExpiry?.();
        return 0;
      }

      setTimeRemaining(remaining);
      return remaining;
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [deadline, onExpiry]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return { days, hours, minutes, seconds };
  };

  const time = formatTime(timeRemaining);
  const progressPercentage = (timeRemaining / totalDuration) * 100;
  const isUrgent = progressPercentage < 25; // Less than 25% time remaining
  const isCritical = progressPercentage < 10; // Less than 10% time remaining

  if (isExpired) {
    return (
      <div className="bg-red-100 border border-red-300 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          <div>
            <p className="font-semibold text-red-900">Confirmation Period Expired</p>
            <p className="text-sm text-red-700 mt-1">
              Automatic compensation has been processed. Please initiate a new marking job if needed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Urgency Alert */}
      {(isUrgent || isCritical) && (
        <div className={`flex items-center gap-2 p-3 rounded-lg ${
          isCritical ? "bg-red-100 border border-red-300" : "bg-yellow-100 border border-yellow-300"
        }`}>
          <AlertTriangle className={`h-5 w-5 ${isCritical ? "text-red-600" : "text-yellow-600"}`} />
          <p className={`text-sm font-semibold ${isCritical ? "text-red-900" : "text-yellow-900"}`}>
            {isCritical 
              ? "Critical: Confirmation required urgently!" 
              : "Reminder: Please review and confirm soon"}
          </p>
        </div>
      )}

      {/* Timer Display */}
      <div className="flex items-center justify-center gap-4">
        <Clock className={`h-8 w-8 ${
          isCritical ? "text-red-600" : isUrgent ? "text-yellow-600" : "text-blue-600"
        }`} />
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">Time Remaining to Confirm</p>
          <div className="flex items-center gap-2 text-2xl font-bold font-mono">
            {time.days > 0 && (
              <div>
                <span className={isCritical ? "text-red-700" : isUrgent ? "text-yellow-700" : "text-blue-700"}>
                  {time.days}
                </span>
                <span className="text-sm text-muted-foreground ml-1">d</span>
              </div>
            )}
            <div>
              <span className={isCritical ? "text-red-700" : isUrgent ? "text-yellow-700" : "text-blue-700"}>
                {time.hours.toString().padStart(2, "0")}
              </span>
              <span className="text-sm text-muted-foreground ml-1">h</span>
            </div>
            <span className="text-muted-foreground">:</span>
            <div>
              <span className={isCritical ? "text-red-700" : isUrgent ? "text-yellow-700" : "text-blue-700"}>
                {time.minutes.toString().padStart(2, "0")}
              </span>
              <span className="text-sm text-muted-foreground ml-1">m</span>
            </div>
            <span className="text-muted-foreground">:</span>
            <div>
              <span className={isCritical ? "text-red-700" : isUrgent ? "text-yellow-700" : "text-blue-700"}>
                {time.seconds.toString().padStart(2, "0")}
              </span>
              <span className="text-sm text-muted-foreground ml-1">s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress 
          value={progressPercentage} 
          className={`h-3 ${
            isCritical ? "bg-red-200" : isUrgent ? "bg-yellow-200" : ""
          }`}
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Deadline: {new Date(deadline).toLocaleString("en-NG")}</span>
          <span>{Math.round(progressPercentage)}% remaining</span>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className={`p-3 rounded ${
          isCritical ? "bg-red-50" : isUrgent ? "bg-yellow-50" : "bg-blue-50"
        }`}>
          <p className="text-2xl font-bold">{time.days}</p>
          <p className="text-xs text-muted-foreground">Days</p>
        </div>
        <div className={`p-3 rounded ${
          isCritical ? "bg-red-50" : isUrgent ? "bg-yellow-50" : "bg-blue-50"
        }`}>
          <p className="text-2xl font-bold">{time.hours}</p>
          <p className="text-xs text-muted-foreground">Hours</p>
        </div>
        <div className={`p-3 rounded ${
          isCritical ? "bg-red-50" : isUrgent ? "bg-yellow-50" : "bg-blue-50"
        }`}>
          <p className="text-2xl font-bold">{time.minutes}</p>
          <p className="text-xs text-muted-foreground">Minutes</p>
        </div>
        <div className={`p-3 rounded ${
          isCritical ? "bg-red-50" : isUrgent ? "bg-yellow-50" : "bg-blue-50"
        }`}>
          <p className="text-2xl font-bold">{time.seconds}</p>
          <p className="text-xs text-muted-foreground">Seconds</p>
        </div>
      </div>
    </div>
  );
}