// apps/platform/components/marking/TimeSlotExpiryWarning.tsx

'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Clock, X } from 'lucide-react';
import { format, differenceInMinutes, differenceInSeconds } from 'date-fns';

interface TimeSlotExpiryWarningProps {
  timeSlotExpiry: Date | string;
  jobId: string;
  agentName: string;
  propertyAddress: string;
  warningThresholdMinutes?: number; // Show warning when X minutes remain (default: 30)
  onDismiss?: (jobId: string) => void;
  onEscalate?: (jobId: string) => void;
  severity?: 'info' | 'warning' | 'critical'; // Auto-determined if not provided
}

export function TimeSlotExpiryWarning({
  timeSlotExpiry,
  jobId,
  agentName,
  propertyAddress,
  warningThresholdMinutes = 30,
  onDismiss,
  onEscalate,
  severity: initialSeverity,
}: TimeSlotExpiryWarningProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [severity, setSeverity] = useState<'info' | 'warning' | 'critical'>(initialSeverity || 'info');
  const [isDismissed, setIsDismissed] = useState(false);

  const expiryDate = typeof timeSlotExpiry === 'string' ? new Date(timeSlotExpiry) : timeSlotExpiry;

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const minutesRemaining = differenceInMinutes(expiryDate, now);
      const secondsRemaining = differenceInSeconds(expiryDate, now);

      if (secondsRemaining <= 0) {
        setIsExpired(true);
        setTimeRemaining('Expired');
        setSeverity('critical');
      } else if (minutesRemaining <= 0) {
        // Less than 1 minute
        setTimeRemaining(`${secondsRemaining} second${secondsRemaining !== 1 ? 's' : ''}`);
        setSeverity('critical');
      } else if (minutesRemaining <= 5) {
        // Less than 5 minutes - critical
        setTimeRemaining(`${minutesRemaining}m ${secondsRemaining % 60}s`);
        setSeverity('critical');
      } else if (minutesRemaining <= 15) {
        // Less than 15 minutes - warning
        setTimeRemaining(`${minutesRemaining}m ${secondsRemaining % 60}s`);
        setSeverity('warning');
      } else if (minutesRemaining <= warningThresholdMinutes) {
        // Within threshold - info
        setTimeRemaining(`${minutesRemaining}m ${secondsRemaining % 60}s`);
        setSeverity('info');
      } else {
        // More than threshold - don't show
        setTimeRemaining('');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiryDate, warningThresholdMinutes]);

  // Don't show if dismissed
  if (isDismissed) return null;

  // Don't show if time remaining is more than threshold
  if (!isExpired && timeRemaining === '') return null;

  // Color schemes based on severity
  const getStyles = () => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-red-50 dark:bg-red-950/30',
          border: 'border-red-200 dark:border-red-800',
          icon: 'text-red-600 dark:text-red-400',
          text: 'text-red-800 dark:text-red-200',
          label: 'text-red-700 dark:text-red-300',
          badge: 'bg-red-600 dark:bg-red-700 text-white',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-950/30',
          border: 'border-yellow-200 dark:border-yellow-800',
          icon: 'text-yellow-600 dark:text-yellow-400',
          text: 'text-yellow-800 dark:text-yellow-200',
          label: 'text-yellow-700 dark:text-yellow-300',
          badge: 'bg-yellow-600 dark:bg-yellow-700 text-white',
        };
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/30',
          border: 'border-blue-200 dark:border-blue-800',
          icon: 'text-blue-600 dark:text-blue-400',
          text: 'text-blue-800 dark:text-blue-200',
          label: 'text-blue-700 dark:text-blue-300',
          badge: 'bg-blue-600 dark:bg-blue-700 text-white',
        };
    }
  };

  const styles = getStyles();

  const getMessage = () => {
    if (isExpired) {
      return 'Your 3-hour time slot has expired. You can no longer complete this marking job.';
    }
    if (severity === 'critical') {
      return 'Your time slot is expiring soon! Complete the marking immediately.';
    }
    if (severity === 'warning') {
      return 'Your time slot will expire soon. Please hurry to complete the marking.';
    }
    return 'Your 3-hour time slot for this marking job is running out.';
  };

  return (
    <div className={`${styles.bg} border ${styles.border} rounded-lg p-4 mb-4`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 mt-0.5 ${styles.icon}`}>
          {severity === 'critical' ? (
            <AlertCircle className="w-5 h-5" />
          ) : (
            <Clock className="w-5 h-5" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`text-sm font-semibold ${styles.label}`}>
              Time Slot Expiring
            </h3>
            <span className={`${styles.badge} px-2 py-1 rounded text-xs font-medium`}>
              {timeRemaining}
            </span>
          </div>

          <p className={`text-sm ${styles.text} mb-2`}>
            {getMessage()}
          </p>

          <div className={`text-xs ${styles.label} space-y-1 mb-3`}>
            <div>
              <strong>Agent:</strong> {agentName}
            </div>
            <div>
              <strong>Property:</strong> {propertyAddress}
            </div>
            <div>
              <strong>Expires at:</strong> {format(expiryDate, 'MMM d, yyyy h:mm a')}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            {!isExpired && onEscalate && (
              <button
                onClick={() => onEscalate(jobId)}
                className={`text-xs font-medium px-3 py-1.5 rounded transition-colors ${styles.badge} hover:opacity-90`}
              >
                Request Extension
              </button>
            )}

            {isExpired && onEscalate && (
              <button
                onClick={() => onEscalate(jobId)}
                className={`text-xs font-medium px-3 py-1.5 rounded transition-colors ${styles.badge} hover:opacity-90`}
              >
                Report Issue
              </button>
            )}

            <button
              onClick={() => setIsDismissed(true)}
              className={`text-xs font-medium px-3 py-1.5 rounded transition-colors border ${styles.border} ${styles.label} hover:opacity-75`}
            >
              Dismiss
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={() => setIsDismissed(true)}
          className={`flex-shrink-0 ${styles.icon} hover:opacity-75 transition-opacity`}
          aria-label="Close alert"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className={`mt-3 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden`}>
        <div
          className={`h-full transition-all duration-1000 ${
            severity === 'critical'
              ? 'bg-red-600 dark:bg-red-500'
              : severity === 'warning'
              ? 'bg-yellow-600 dark:bg-yellow-500'
              : 'bg-blue-600 dark:bg-blue-500'
          }`}
          style={{
            width: isExpired ? '0%' : '100%',
          }}
        />
      </div>
    </div>
  );
}