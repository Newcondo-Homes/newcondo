'use client';

import { useEffect, useState, useCallback } from 'react';
import { Clock, Lock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface LockTimerProps {
  expiresAt: Date;
  onExpire?: () => void;
  onWarning?: (secondsRemaining: number) => void;
  warningThreshold?: number; // seconds before expiry to trigger warning
  variant?: 'default' | 'compact' | 'minimal';
  showProgress?: boolean;
  totalDuration?: number; // total lock duration in seconds for progress calculation
  className?: string;
}

export function LockTimer({
  expiresAt,
  onExpire,
  onWarning,
  warningThreshold = 60, // 1 minute warning by default
  variant = 'default',
  showProgress = true,
  totalDuration = 300, // 5 minutes default
  className,
}: LockTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);
  const [hasWarned, setHasWarned] = useState(false);

  const calculateTimeRemaining = useCallback(() => {
    const now = new Date().getTime();
    const expires = expiresAt.getTime();
    const remaining = Math.max(0, Math.floor((expires - now) / 1000));
    return remaining;
  }, [expiresAt]);

  useEffect(() => {
    const updateTimer = () => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);

      // Check for expiry
      if (remaining === 0 && !isExpired) {
        setIsExpired(true);
        onExpire?.();
      }

      // Check for warning threshold
      if (remaining <= warningThreshold && remaining > 0 && !hasWarned) {
        setHasWarned(true);
        onWarning?.(remaining);
      }
    };

    // Initial update
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [
    calculateTimeRemaining,
    isExpired,
    hasWarned,
    warningThreshold,
    onExpire,
    onWarning,
  ]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (): number => {
    return ((totalDuration - timeRemaining) / totalDuration) * 100;
  };

  const isWarning = timeRemaining <= warningThreshold && timeRemaining > 0;
  const isCritical = timeRemaining <= 30 && timeRemaining > 0;

  if (isExpired) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 bg-destructive/10 text-destructive rounded-md',
          'border border-destructive/20',
          className
        )}
      >
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm font-medium">Payment lock expired</span>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-1.5 text-sm', className)}>
        <Clock className={cn(
          'h-3.5 w-3.5',
          isCritical ? 'text-destructive animate-pulse' : 
          isWarning ? 'text-orange-600' : 'text-muted-foreground'
        )} />
        <span className={cn(
          'font-mono font-medium',
          isCritical ? 'text-destructive' : 
          isWarning ? 'text-orange-600' : 'text-foreground'
        )}>
          {formatTime(timeRemaining)}
        </span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn('inline-flex items-center gap-2', className)}>
        <Lock className={cn(
          'h-4 w-4',
          isCritical ? 'text-destructive' : 
          isWarning ? 'text-orange-600' : 'text-blue-600'
        )} />
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Payment lock</span>
          <span className={cn(
            'text-sm font-mono font-semibold',
            isCritical ? 'text-destructive' : 
            isWarning ? 'text-orange-600' : 'text-foreground'
          )}>
            {formatTime(timeRemaining)}
          </span>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div
      className={cn(
        'flex flex-col gap-3 p-4 rounded-lg border',
        isCritical
          ? 'bg-destructive/5 border-destructive/20'
          : isWarning
          ? 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900/30'
          : 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/30',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock
            className={cn(
              'h-5 w-5',
              isCritical ? 'text-destructive animate-pulse' : 
              isWarning ? 'text-orange-600' : 'text-blue-600'
            )}
          />
          <div>
            <p className="text-sm font-medium">
              {isCritical
                ? 'Payment lock expiring soon!'
                : isWarning
                ? 'Complete payment soon'
                : 'Payment lock active'}
            </p>
            <p className="text-xs text-muted-foreground">
              {isCritical
                ? 'Less than 30 seconds remaining'
                : 'Property reserved for you'}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <p
            className={cn(
              'text-2xl font-mono font-bold',
              isCritical ? 'text-destructive' : 
              isWarning ? 'text-orange-600' : 'text-foreground'
            )}
          >
            {formatTime(timeRemaining)}
          </p>
          <p className="text-xs text-muted-foreground">remaining</p>
        </div>
      </div>

      {showProgress && (
        <div className="space-y-1">
          <Progress
            value={getProgressPercentage()}
            className={cn(
              'h-2',
              isCritical && 'bg-destructive/20',
              isWarning && 'bg-orange-200 dark:bg-orange-950'
            )}
            indicatorClassName={cn(
              isCritical ? 'bg-destructive' : 
              isWarning ? 'bg-orange-600' : 'bg-blue-600'
            )}
          />
          <p className="text-xs text-muted-foreground text-center">
            {isCritical
              ? 'Complete payment immediately'
              : `${timeRemaining}s of ${totalDuration}s remaining`}
          </p>
        </div>
      )}
    </div>
  );
}

// Hook for managing lock timer state
export function useLockTimer(expiresAt: Date | null) {
  const [isExpired, setIsExpired] = useState(false);
  const [isWarning, setIsWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt) {
      setSecondsRemaining(null);
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const expires = expiresAt.getTime();
      const remaining = Math.max(0, Math.floor((expires - now) / 1000));
      
      setSecondsRemaining(remaining);
      setIsExpired(remaining === 0);
      setIsWarning(remaining <= 60 && remaining > 0);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  return {
    isExpired,
    isWarning,
    secondsRemaining,
    formattedTime: secondsRemaining
      ? `${Math.floor(secondsRemaining / 60)}:${(secondsRemaining % 60)
          .toString()
          .padStart(2, '0')}`
      : null,
  };
}