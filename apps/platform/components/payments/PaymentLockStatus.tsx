import React from 'react';
import { Clock, Lock, LockOpen, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@newcondo/ui/components/alert';
import { Badge } from '@newcondo/ui/components/badge';
import { Progress } from '@newcondo/ui/components/progress';

interface PaymentLockStatusProps {
  isLocked: boolean;
  lockExpiry?: Date;
  lockedBy?: string;
  isCurrentUser?: boolean;
  className?: string;
}

export const PaymentLockStatus: React.FC<PaymentLockStatusProps> = ({
  isLocked,
  lockExpiry,
  // lockedBy,
  isCurrentUser = false,
  className = '',
}) => {
  const [timeRemaining, setTimeRemaining] = React.useState<number>(0);

  React.useEffect(() => {
    if (!isLocked || !lockExpiry) return;

    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const expiry = new Date(lockExpiry).getTime();
      const remaining = Math.max(0, expiry - now);
      setTimeRemaining(remaining);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [isLocked, lockExpiry]);

  const formatTimeRemaining = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (): number => {
    if (!lockExpiry) return 0;
    const lockDuration = 15 * 60 * 1000; // 15 minutes in ms
    const remaining = timeRemaining;
    return ((lockDuration - remaining) / lockDuration) * 100;
  };

  if (!isLocked) {
    return (
      <Alert className={`bg-green-50 border-green-200 ${className}`}>
        <LockOpen className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Property is available for payment
        </AlertDescription>
      </Alert>
    );
  }

  if (isCurrentUser) {
    return (
      <Alert className={`bg-blue-50 border-blue-200 ${className}`}>
        <Clock className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Payment in progress</span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {formatTimeRemaining(timeRemaining)} remaining
              </Badge>
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
            <p className="text-xs text-blue-600">
              Complete your payment within the time limit to secure this property
            </p>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className={`bg-red-50 border-red-200 ${className}`}>
      <Lock className="h-4 w-4 text-red-600" />
      <AlertDescription className="text-red-800">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium">Property currently locked</span>
            <Badge variant="destructive" className="bg-red-100 text-red-800">
              {formatTimeRemaining(timeRemaining)} remaining
            </Badge>
          </div>
          <p className="text-xs text-red-600">
            Another user is completing a payment. This property will become available if they don&apos;t complete the transaction.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
};

interface PropertyLockBadgeProps {
  isLocked: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const PropertyLockBadge: React.FC<PropertyLockBadgeProps> = ({
  isLocked,
  size = 'md',
}) => {
  if (!isLocked) return null;

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2',
  };

  return (
    <Badge 
      variant="destructive" 
      className={`${sizeClasses[size]} flex items-center gap-1`}
    >
      <Lock className="h-3 w-3" />
      Payment In Progress
    </Badge>
  );
};

interface LockTimerProps {
  lockExpiry: Date;
  onExpire?: () => void;
  showWarning?: boolean;
}

export const LockTimer: React.FC<LockTimerProps> = ({
  lockExpiry,
  onExpire,
  showWarning = true,
}) => {
  const [timeRemaining, setTimeRemaining] = React.useState<number>(0);
  const [isWarning, setIsWarning] = React.useState(false);

  React.useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const expiry = new Date(lockExpiry).getTime();
      const remaining = Math.max(0, expiry - now);
      
      setTimeRemaining(remaining);
      
      // Show warning when less than 2 minutes remain
      setIsWarning(remaining < 120000 && remaining > 0);
      
      if (remaining === 0 && onExpire) {
        onExpire();
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [lockExpiry, onExpire]);

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2">
      <Clock className={`h-4 w-4 ${isWarning ? 'text-red-500' : 'text-gray-500'}`} />
      <span className={`font-mono text-lg ${isWarning ? 'text-red-500 font-bold' : 'text-gray-700'}`}>
        {formatTime(timeRemaining)}
      </span>
      {showWarning && isWarning && (
        <AlertCircle className="h-4 w-4 text-red-500 animate-pulse" />
      )}
    </div>
  );
};