import { useState, useCallback, useMemo } from 'react';
import { addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export type DateRangePreset = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'custom';

export function useDateRange(initialRange?: DateRange) {
  const [dateRange, setDateRange] = useState<DateRange>(
    initialRange || {
      startDate: subDays(new Date(), 30),
      endDate: new Date(),
    }
  );

  const [preset, setPreset] = useState<DateRangePreset>('last30days');

  const applyPreset = useCallback((presetType: DateRangePreset) => {
    const today = new Date();
    let newRange: DateRange;

    switch (presetType) {case 'today':
        newRange = {
          startDate: new Date(today.setHours(0, 0, 0, 0)),
          endDate: new Date(today.setHours(23, 59, 59, 999)),
        };
        break;

      case 'yesterday':
        const yesterday = subDays(today, 1);
        newRange = {
          startDate: new Date(yesterday.setHours(0, 0, 0, 0)),
          endDate: new Date(yesterday.setHours(23, 59, 59, 999)),
        };
        break;

      case 'last7days':
        newRange = {
          startDate: subDays(today, 7),
          endDate: today,
        };
        break;

      case 'last30days':
        newRange = {
          startDate: subDays(today, 30),
          endDate: today,
        };
        break;

      case 'thisWeek':
        newRange = {
          startDate: startOfWeek(today, { weekStartsOn: 1 }), // Monday
          endDate: endOfWeek(today, { weekStartsOn: 1 }),
        };
        break;

      case 'lastWeek':
        const lastWeek = subDays(today, 7);
        newRange = {
          startDate: startOfWeek(lastWeek, { weekStartsOn: 1 }),
          endDate: endOfWeek(lastWeek, { weekStartsOn: 1 }),
        };
        break;

      case 'thisMonth':
        newRange = {
          startDate: startOfMonth(today),
          endDate: endOfMonth(today),
        };
        break;

      case 'lastMonth':
        const lastMonth = subMonths(today, 1);
        newRange = {
          startDate: startOfMonth(lastMonth),
          endDate: endOfMonth(lastMonth),
        };
        break;

      case 'custom':
      default:
        return; // Don't update range for custom
    }

    setDateRange(newRange);
    setPreset(presetType);
  }, []);

  const setCustomRange = useCallback((range: DateRange) => {
    setDateRange(range);
    setPreset('custom');
  }, []);

  const duration = useMemo(() => {
    const diff = dateRange.endDate.getTime() - dateRange.startDate.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24)); // Days
  }, [dateRange]);

  const formattedRange = useMemo(() => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    
    return {
      start: dateRange.startDate.toLocaleDateString('en-US', options),
      end: dateRange.endDate.toLocaleDateString('en-US', options),
      display: `${dateRange.startDate.toLocaleDateString('en-US', options)} - ${dateRange.endDate.toLocaleDateString('en-US', options)}`,
    };
  }, [dateRange]);

  return {
    dateRange,
    preset,
    duration,
    formattedRange,
    applyPreset,
    setCustomRange,
    setDateRange,
  };
}

// Hook for comparing date ranges
export function useDateRangeComparison(currentRange: DateRange) {
  const previousRange = useMemo<DateRange>(() => {
    const duration = currentRange.endDate.getTime() - currentRange.startDate.getTime();
    
    return {
      startDate: new Date(currentRange.startDate.getTime() - duration),
      endDate: currentRange.startDate,
    };
  }, [currentRange]);

  return {
    currentRange,
    previousRange,
    duration: currentRange.endDate.getTime() - currentRange.startDate.getTime(),
  };
}