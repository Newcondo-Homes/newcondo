// apps/platform/components/marking/TimeSlotTimer.tsx
'use client';

import { useEffect, useState } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

interface TimeSlotTimerProps {
  timeSlotExpiry: Date | string;
  jobId?: string;
  onExpiry?: () => void;
  onWarning?: (minutesRemaining: number) => void;
  compactMode?: boolean;
}

export function TimeSlotTimer({
  timeSlotExpiry,
  // jobId,
  onExpiry,
  onWarning,
  compactMode = false,
}: TimeSlotTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [isWarning, setIsWarning] = useState(false);
  const [percentageRemaining, setPercentageRemaining] = useState(100);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const expiryDate = new Date(timeSlotExpiry);
      const now = new Date();
      const diffMs = expiryDate.getTime() - now.getTime();

      if (diffMs <= 0) {
        setTimeRemaining('Expired');
        setIsExpired(true);
        onExpiry?.();
        return;
      }

      // Calculate time units
      const totalSeconds = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      // Format time string
      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }

      // Check for warning threshold (less than 30 minutes remaining)
      const minutesRemaining = Math.floor(totalSeconds / 60);
      if (minutesRemaining < 30 && minutesRemaining > 0) {
        setIsWarning(true);
        onWarning?.(minutesRemaining);
      } else {
        setIsWarning(false);
      }

      // Calculate percentage of time remaining (3 hours = 10800 seconds)
      const totalSlotSeconds = 3 * 60 * 60;
      const percentage = Math.max(0, (totalSeconds / totalSlotSeconds) * 100);
      setPercentageRemaining(percentage);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [timeSlotExpiry, onExpiry, onWarning]);

  if (compactMode) {
    return (
      <div className="flex items-center gap-2">
        <Clock className={`w-4 h-4 ${isExpired ? 'text-red-500' : isWarning ? 'text-yellow-500' : 'text-blue-500'}`} />
        <span className={`text-sm font-semibold ${isExpired ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-gray-700'}`}>
          {timeRemaining}
        </span>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg border ${
      isExpired
        ? 'bg-red-50 border-red-200'
        : isWarning
          ? 'bg-yellow-50 border-yellow-200'
          : 'bg-blue-50 border-blue-200'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {isWarning && !isExpired && (
            <AlertCircle className="w-5 h-5 text-yellow-600" />
          )}
          <Clock className={`w-5 h-5 ${isExpired ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-blue-600'}`} />
          <div>
            <p className="text-sm font-medium text-gray-700">3-Hour Time Slot</p>
            <p className={`text-2xl font-bold ${isExpired ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-blue-600'}`}>
              {timeRemaining}
            </p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            isExpired
              ? 'bg-red-600'
              : isWarning
                ? 'bg-yellow-500'
                : 'bg-blue-600'
          }`}
          style={{ width: `${percentageRemaining}%` }}
        />
      </div>

      {/* Status message */}
      <p className={`text-xs mt-2 ${
        isExpired
          ? 'text-red-700'
          : isWarning
            ? 'text-yellow-700'
            : 'text-blue-700'
      }`}>
        {isExpired
          ? 'Time slot has expired. Job will be reassigned.'
          : isWarning
            ? `Hurry! Complete the marking within ${timeRemaining}`
            : 'You have 3 hours to complete the property marking'}
      </p>
    </div>
  );
}