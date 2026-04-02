// apps/platform/components/marking/QueueTimer.tsx
"use client";

import { useState, useEffect } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { Progress } from "@newcondo/ui/components/progress";

interface QueueTimerProps {
  expiryTime: string;
  totalDuration?: number; // in milliseconds, default 3 hours
  onExpiry?: () => void;
}

export function QueueTimer({ 
  expiryTime, 
  totalDuration = 3 * 60 * 60 * 1000, // 3 hours
  onExpiry 
}: QueueTimerProps) {
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
        return 0;
      }

      setTimeRemaining(remaining);
      return remaining;
    };

    // Calculate immediately
    calculateTimeRemaining();

    // Update every second
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [expiryTime, onExpiry]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      hours,
      minutes,
      seconds,
      formatted: `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
    };
  };

  const time = formatTime(timeRemaining);
  const progressPercentage = (timeRemaining / totalDuration) * 100;
  const isUrgent = progressPercentage < 25; // Less than 45 minutes remaining

  if (isExpired) {
    return (
      <div className="bg-red-100 border border-red-300 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800">
          <AlertTriangle className="h-5 w-5" />
          <div>
            <p className="font-semibold">Time Slot Expired</p>
            <p className="text-sm mt-1">This job has been reassigned to the next agent in queue</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Timer Display */}
      <div className={`flex items-center justify-center gap-3 p-4 rounded-lg ${
        isUrgent ? "bg-red-100" : "bg-blue-100"
      }`}>
        <Clock className={`h-6 w-6 ${isUrgent ? "text-red-600" : "text-blue-600"}`} />
        <div className="text-center">
          <p className={`text-3xl font-bold font-mono ${
            isUrgent ? "text-red-700" : "text-blue-700"
          }`}>
            {time.formatted}
          </p>
          <p className={`text-xs mt-1 ${
            isUrgent ? "text-red-600" : "text-blue-600"
          }`}>
            {time.hours > 0 && `${time.hours}h `}
            {time.minutes}m {time.seconds}s remaining
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <Progress 
          value={progressPercentage} 
          className={`h-2 ${isUrgent ? "bg-red-200" : ""}`}
        />
        {isUrgent && (
          <div className="flex items-center gap-2 text-xs text-red-600">
            <AlertTriangle className="h-3 w-3" />
            <span>Urgent: Less than 45 minutes remaining!</span>
          </div>
        )}
      </div>

      {/* Time Breakdown */}
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div className={`p-2 rounded ${isUrgent ? "bg-red-50" : "bg-gray-50"}`}>
          <p className="font-bold text-lg">{time.hours}</p>
          <p className="text-xs text-muted-foreground">Hours</p>
        </div>
        <div className={`p-2 rounded ${isUrgent ? "bg-red-50" : "bg-gray-50"}`}>
          <p className="font-bold text-lg">{time.minutes}</p>
          <p className="text-xs text-muted-foreground">Minutes</p>
        </div>
        <div className={`p-2 rounded ${isUrgent ? "bg-red-50" : "bg-gray-50"}`}>
          <p className="font-bold text-lg">{time.seconds}</p>
          <p className="text-xs text-muted-foreground">Seconds</p>
        </div>
      </div>
    </div>
  );
}