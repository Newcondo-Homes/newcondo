"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export default function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempFrom, setTempFrom] = useState<Date | undefined>(value.from);
  const [tempTo, setTempTo] = useState<Date | undefined>(value.to);

  const handleQuickSelect = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    onChange({ from, to });
    setTempFrom(from);
    setTempTo(to);
    setIsOpen(false);
  };

  const handleApply = () => {
    if (tempFrom && tempTo) {
      onChange({ from: tempFrom, to: tempTo });
      setIsOpen(false);
    }
  };

  const handleCancel = () => {
    setTempFrom(value.from);
    setTempTo(value.to);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value?.from ? (
            value.to ? (
              <>
                {format(value.from, "LLL dd, y")} - {format(value.to, "LLL dd, y")}
              </>
            ) : (
              format(value.from, "LLL dd, y")
            )
          ) : (
            <span>Pick a date range</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Quick Select</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect(7)}
              >
                Last 7 days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect(30)}
              >
                Last 30 days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect(90)}
              >
                Last 90 days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect(365)}
              >
                Last year
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Custom Range</p>
            <div className="flex gap-4">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">From</p>
                <Calendar
                  mode="single"
                  selected={tempFrom}
                  onSelect={setTempFrom}
                  disabled={(date) =>
                    date > new Date() || (tempTo ? date > tempTo : false)
                  }
                  initialFocus
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">To</p>
                <Calendar
                  mode="single"
                  selected={tempTo}
                  onSelect={setTempTo}
                  disabled={(date) =>
                    date > new Date() || (tempFrom ? date < tempFrom : false)
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              disabled={!tempFrom || !tempTo}
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}