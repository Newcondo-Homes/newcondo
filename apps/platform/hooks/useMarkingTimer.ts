// apps/platform/hooks/useMarkingTimer.ts

import { useState, useEffect, useCallback, useRef } from 'react';

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMilliseconds: number;
}

interface UseMarkingTimerOptions {
  deadline?: string | Date;
  onExpire?: () => void;
  autoStart?: boolean;
  warningThreshold?: number; // milliseconds before showing warning
}

interface UseMarkingTimerReturn {
  timeRemaining: TimeRemaining;
  formattedTime: string;
  isExpired: boolean;
  isWarning: boolean;
  isRunning: boolean;
  progress: number; // percentage (0-100)
  start: () => void;
  pause: () => void;
  reset: () => void;
}

export const useMarkingTimer = ({
  deadline,
  onExpire,
  autoStart = true,
  warningThreshold = 24 * 60 * 60 * 1000 // 24 hours default
}: UseMarkingTimerOptions = {}): UseMarkingTimerReturn => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalMilliseconds: 0
  });
  const [isExpired, setIsExpired] = useState(false);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onExpireRef = useRef(onExpire);

  // Update onExpireRef when callback changes
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const calculateTimeRemaining = useCallback((deadlineDate: Date): TimeRemaining => {
    const now = new Date().getTime();
    const targetTime = deadlineDate.getTime();
    const difference = targetTime - now;

    if (difference <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalMilliseconds: 0
      };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return {
      days,
      hours,
      minutes,
      seconds,
      totalMilliseconds: difference
    };
  }, []);

  const formatTime = useCallback((time: TimeRemaining): string => {
    if (time.totalMilliseconds <= 0) {
      return 'Expired';
    }

    if (time.days > 0) {
      return `${time.days}d ${time.hours}h ${time.minutes}m`;
    }

    if (time.hours > 0) {
      return `${time.hours}h ${time.minutes}m ${time.seconds}s`;
    }

    if (time.minutes > 0) {
      return `${time.minutes}m ${time.seconds}s`;
    }

    return `${time.seconds}s`;
  }, []);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    if (deadline) {
      const deadlineDate = deadline instanceof Date ? deadline : new Date(deadline);
      const time = calculateTimeRemaining(deadlineDate);
      setTimeRemaining(time);
      setIsExpired(time.totalMilliseconds <= 0);
    }
  }, [deadline, calculateTimeRemaining]);

  // Main timer effect
  useEffect(() => {
    if (!deadline || !isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const deadlineDate = deadline instanceof Date ? deadline : new Date(deadline);

    const updateTimer = () => {
      const time = calculateTimeRemaining(deadlineDate);
      setTimeRemaining(time);

      if (time.totalMilliseconds <= 0) {
        setIsExpired(true);
        setIsRunning(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        // Call onExpire callback if provided
        if (onExpireRef.current) {
          onExpireRef.current();
        }
      }
    };

    // Initial update
    updateTimer();

    // Set up interval
    intervalRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [deadline, isRunning, calculateTimeRemaining]);

  // Calculate progress percentage (assuming 3 days max)
  const progress = deadline
    ? Math.max(0, Math.min(100, (timeRemaining.totalMilliseconds / (3 * 24 * 60 * 60 * 1000)) * 100))
    : 0;

  // Check if we're in warning period
  const isWarning = !isExpired && timeRemaining.totalMilliseconds <= warningThreshold;

  const formattedTime = formatTime(timeRemaining);

  return {
    timeRemaining,
    formattedTime,
    isExpired,
    isWarning,
    isRunning,
    progress,
    start,
    pause,
    reset
  };
};

// Hook for agent's 3-hour time slot countdown
export const useAgentTimeSlot = (
  assignedAt?: string | Date,
  duration: number = 3 * 60 * 60 * 1000 // 3 hours in milliseconds
) => {
  const deadline = assignedAt
    ? new Date(new Date(assignedAt).getTime() + duration)
    : undefined;

  return useMarkingTimer({
    deadline,
    autoStart: true,
    warningThreshold: 30 * 60 * 1000 // 30 minutes warning
  });
};

// Hook for verification deadline (2-3 days)
export const useVerificationDeadline = (
  completedAt?: string | Date,
  duration: number = 3 * 24 * 60 * 60 * 1000 // 3 days in milliseconds
) => {
  const deadline = completedAt
    ? new Date(new Date(completedAt).getTime() + duration)
    : undefined;

  return useMarkingTimer({
    deadline,
    autoStart: true,
    warningThreshold: 24 * 60 * 60 * 1000 // 24 hours warning
  });
};

// Hook to format milliseconds to human-readable duration
export const useFormatDuration = () => {
  const formatDuration = useCallback((milliseconds: number): string => {
    if (milliseconds <= 0) return '0 seconds';

    const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
    const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

    const parts: string[] = [];

    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
    if (seconds > 0 && days === 0) parts.push(`${seconds} second${seconds > 1 ? 's' : ''}`);

    return parts.join(', ');
  }, []);

  return { formatDuration };
};

// Hook to check if a deadline has passed
export const useDeadlineStatus = (deadline?: string | Date) => {
  const [isPassed, setIsPassed] = useState(false);

  useEffect(() => {
    if (!deadline) {
      setIsPassed(false);
      return;
    }

    const checkDeadline = () => {
      const deadlineDate = deadline instanceof Date ? deadline : new Date(deadline);
      const now = new Date();
      setIsPassed(now > deadlineDate);
    };

    checkDeadline();
    const interval = setInterval(checkDeadline, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  return isPassed;
};

// Hook for multiple timers (useful for queue management)
export const useMultipleTimers = (
  deadlines: Array<{ id: string; deadline: string | Date }>
) => {
  const [timers, setTimers] = useState<Record<string, TimeRemaining>>({});

  useEffect(() => {
    const updateTimers = () => {
      const newTimers: Record<string, TimeRemaining> = {};

      deadlines.forEach(({ id, deadline }) => {
        const deadlineDate = deadline instanceof Date ? deadline : new Date(deadline);
        const now = new Date().getTime();
        const difference = deadlineDate.getTime() - now;

        if (difference <= 0) {
          newTimers[id] = {
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            totalMilliseconds: 0
          };
        } else {
          const days = Math.floor(difference / (1000 * 60 * 60 * 24));
          const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((difference % (1000 * 60)) / 1000);

          newTimers[id] = {
            days,
            hours,
            minutes,
            seconds,
            totalMilliseconds: difference
          };
        }
      });

      setTimers(newTimers);
    };

    updateTimers();
    const interval = setInterval(updateTimers, 1000);

    return () => clearInterval(interval);
  }, [deadlines]);

  return timers;
};