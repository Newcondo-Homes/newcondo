'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@newcondo/ui/lib/utils';

interface CountdownTimerProps {
  targetDate: Date;
  onExpire?: () => void;
  className?: string;
  showIcon?: boolean;
  warningThreshold?: number; // Hours before expiry to show warning
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export function CountdownTimer({
  targetDate,
  onExpire,
  className,
  showIcon = true,
  warningThreshold = 6,
}: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(
    calculateTimeRemaining(targetDate)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining(targetDate);
      setTimeRemaining(remaining);

      if (remaining.total <= 0 && onExpire) {
        onExpire();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate, onExpire]);

  function calculateTimeRemaining(target: Date): TimeRemaining {
    const total = target.getTime() - Date.now();

    if (total <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    }

    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));

    return { days, hours, minutes, seconds, total };
  }

  const isExpired = timeRemaining.total <= 0;
  const isWarning =
    timeRemaining.total > 0 &&
    timeRemaining.total <= warningThreshold * 60 * 60 * 1000;

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  if (isExpired) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700',
          className
        )}
      >
        {showIcon && <Clock className="h-4 w-4" />}
        <span>Expired</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium',
        isWarning
          ? 'bg-red-50 text-red-700'
          : 'bg-blue-50 text-blue-700',
        className
      )}
    >
      {showIcon && <Clock className="h-4 w-4" />}
      <div className="flex items-center gap-1">
        {timeRemaining.days > 0 && (
          <>
            <span className="font-mono text-base">
              {formatNumber(timeRemaining.days)}
            </span>
            <span className="text-xs">d</span>
            <span className="mx-1">:</span>
          </>
        )}
        <span className="font-mono text-base">
          {formatNumber(timeRemaining.hours)}
        </span>
        <span className="text-xs">h</span>
        <span className="mx-1">:</span>
        <span className="font-mono text-base">
          {formatNumber(timeRemaining.minutes)}
        </span>
        <span className="text-xs">m</span>
        <span className="mx-1">:</span>
        <span className="font-mono text-base">
          {formatNumber(timeRemaining.seconds)}
        </span>
        <span className="text-xs">s</span>
      </div>
    </div>
  );
}