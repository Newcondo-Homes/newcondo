// apps/platform/components/analytics/AnalyticsDatePicker.tsx
'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@newcondo/ui/components/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@newcondo/ui/components/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@newcondo/ui/components/select';
import { cn } from '@/lib/utils';

interface AnalyticsDatePickerProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

export function AnalyticsDatePicker({
  dateRange,
  onDateRangeChange,
}: AnalyticsDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const presetRanges = [
    {
      label: 'Last 7 days',
      getValue: () => ({
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        to: new Date(),
      }),
    },
    {
      label: 'Last 30 days',
      getValue: () => ({
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: new Date(),
      }),
    },
    {
      label: 'Last 90 days',
      getValue: () => ({
        from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        to: new Date(),
      }),
    },
    {
      label: 'This year',
      getValue: () => ({
        from: new Date(new Date().getFullYear(), 0, 1),
        to: new Date(),
      }),
    },
  ];

  const handlePresetSelect = (preset: string) => {
    const range = presetRanges.find((r) => r.label === preset);
    if (range) {
      onDateRangeChange(range.getValue());
      setIsOpen(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select onValueChange={handlePresetSelect}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Quick select" />
        </SelectTrigger>
        <SelectContent>
          {presetRanges.map((range) => (
            <SelectItem key={range.label} value={range.label}>
              {range.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'justify-start text-left font-normal',
              !dateRange && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, 'LLL dd, y')} -{' '}
                  {format(dateRange.to, 'LLL dd, y')}
                </>
              ) : (
                format(dateRange.from, 'LLL dd, y')
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={(range) => {
              onDateRangeChange(range);
              if (range?.from && range?.to) {
                setIsOpen(false);
              }
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}