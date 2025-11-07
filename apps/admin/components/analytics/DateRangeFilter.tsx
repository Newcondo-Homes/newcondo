'use client';

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

export default function DateRangeFilter() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(2024, 9, 1), // October 1, 2024
    to: new Date(),
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date?.from ? (
            date.to ? (
              <>
                {format(date.from, 'LLL dd, y')} - {format(date.to, 'LLL dd, y')}
              </>
            ) : (
              format(date.from, 'LLL dd, y')
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
          defaultMonth={date?.from}
          selected={date}
          onSelect={setDate}
          numberOfMonths={2}
        />
        <div className="p-3 border-t flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => setDate({
              from: new Date(new Date().setDate(new Date().getDate() - 7)),
              to: new Date(),
            })}
          >
            Last 7 days
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => setDate({
              from: new Date(new Date().setDate(new Date().getDate() - 30)),
              to: new Date(),
            })}
          >
            Last 30 days
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => setDate({
              from: new Date(new Date().setDate(new Date().getDate() - 90)),
              to: new Date(),
            })}
          >
            Last 90 days
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}