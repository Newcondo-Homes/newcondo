// File: apps/platform/hooks/useTimeSlot.ts

import { useState, useCallback, useEffect } from 'react';

interface TimeSlotData {
  markingJobId: string;
  startTime: Date;
  endTime: Date;
  timeRemainingMs: number; // Milliseconds remaining
  timeRemainingFormatted: string; // e.g., "2h 15m 30s"
  isExpired: boolean;
  isWarning: boolean; // true when less than 30 minutes remain
}

interface TimeSlotState {
  slots: Map<string, TimeSlotData>;
  updateInterval: NodeJS.Timeout | null;
}

export function useTimeSlot() {
  const [state, setState] = useState<TimeSlotState>({
    slots: new Map(),
    updateInterval: null,
  });

  // Format milliseconds to readable time format
  const formatTimeRemaining = useCallback((ms: number): string => {
    if (ms <= 0) return '0s';

    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

    return parts.join(' ');
  }, []);

  // Start time slot for an assignment
  const startTimeSlot = useCallback(
    (
      markingJobId: string,
      expiryTime: string,
      durationMs: number = 10800000 // 3 hours in milliseconds
    ) => {
      const now = new Date();
      const expiry = new Date(expiryTime);
      const actualDuration = expiry.getTime() - now.getTime();

      setState((prev) => {
        const newSlots = new Map(prev.slots);
        newSlots.set(markingJobId, {
          markingJobId,
          startTime: now,
          endTime: expiry,
          timeRemainingMs: Math.max(0, actualDuration),
          timeRemainingFormatted: formatTimeRemaining(actualDuration),
          isExpired: actualDuration <= 0,
          isWarning: actualDuration <= 1800000, // 30 minutes
        });
        return { ...prev, slots: newSlots };
      });
    },
    [formatTimeRemaining]
  );

  // Get time slot info
  const getTimeSlot = useCallback(
    (markingJobId: string): TimeSlotData | undefined => {
      return state.slots.get(markingJobId);
    },
    [state.slots]
  );

  // Check if time slot is expired
  const isExpired = useCallback(
    (markingJobId: string): boolean => {
      const slot = state.slots.get(markingJobId);
      return slot?.isExpired || false;
    },
    [state.slots]
  );

  // Check if in warning zone (less than 30 minutes)
  const isWarning = useCallback(
    (markingJobId: string): boolean => {
      const slot = state.slots.get(markingJobId);
      return slot?.isWarning || false;
    },
    [state.slots]
  );

  // Get remaining time in milliseconds
  const getTimeRemaining = useCallback(
    (markingJobId: string): number => {
      const slot = state.slots.get(markingJobId);
      return slot?.timeRemainingMs || 0;
    },
    [state.slots]
  );

  // Get formatted remaining time
  const getFormattedTimeRemaining = useCallback(
    (markingJobId: string): string => {
      const slot = state.slots.get(markingJobId);
      return slot?.timeRemainingFormatted || '0s';
    },
    [state.slots]
  );

  // Clear expired time slots
  const clearExpiredSlots = useCallback(() => {
    setState((prev) => {
      const newSlots = new Map(prev.slots);
      Array.from(newSlots.entries()).forEach(([key, slot]) => {
        if (slot.isExpired) {
          newSlots.delete(key);
        }
      });
      return { ...prev, slots: newSlots };
    });
  }, []);

  // End time slot manually
  const endTimeSlot = useCallback((markingJobId: string) => {
    setState((prev) => {
      const newSlots = new Map(prev.slots);
      newSlots.delete(markingJobId);
      return { ...prev, slots: newSlots };
    });
  }, []);

  // Update all time slots (called by interval)
  const updateTimeSlots = useCallback(() => {
    setState((prev) => {
      const newSlots = new Map<string, TimeSlotData>();
      const now = new Date();

      prev.slots.forEach((slot, key) => {
        const timeRemainingMs = slot.endTime.getTime() - now.getTime();
        const isExpired = timeRemainingMs <= 0;
        const isWarning = timeRemainingMs <= 1800000 && timeRemainingMs > 0; // 30 minutes

        if (!isExpired) {
          newSlots.set(key, {
            ...slot,
            timeRemainingMs: Math.max(0, timeRemainingMs),
            timeRemainingFormatted: formatTimeRemaining(timeRemainingMs),
            isExpired,
            isWarning,
          });
        }
      });

      return { ...prev, slots: newSlots };
    });
  }, [formatTimeRemaining]);

  // Set up update interval (update every 1 second)
  useEffect(() => {
    if (state.slots.size === 0) return;

    const interval = setInterval(() => {
      updateTimeSlots();
    }, 1000);

    setState((prev) => ({ ...prev, updateInterval: interval }));

    return () => {
      clearInterval(interval);
    };
  }, [state.slots.size, updateTimeSlots]);

  return {
    slots: state.slots,
    startTimeSlot,
    getTimeSlot,
    isExpired,
    isWarning,
    getTimeRemaining,
    getFormattedTimeRemaining,
    clearExpiredSlots,
    endTimeSlot,
  };
}