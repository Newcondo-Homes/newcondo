'use client';

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '@/lib/utils';

interface PriceRangeSliderProps {
  value: [number, number];
  onValueChange: (value: [number, number]) => void;
  min?: number;
  max?: number;
  step?: number;
  formatValue?: (value: number) => string;
  className?: string;
  disabled?: boolean;
}

const PriceRangeSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  PriceRangeSliderProps
>(({ 
  value, 
  onValueChange, 
  min = 0, 
  max = 10000000, 
  step = 50000,
  formatValue = (val) => `₦${val.toLocaleString()}`,
  className,
  disabled = false,
  ...props 
}, ref) => {
  const [localValue, setLocalValue] = React.useState<[number, number]>(value);
  const [isDragging, setIsDragging] = React.useState(false);

  // Update local value when prop changes
  React.useEffect(() => {
    if (!isDragging) {
      setLocalValue(value);
    }
  }, [value, isDragging]);

  const handleValueChange = (newValue: number[]) => {
    const typedValue = newValue as [number, number];
    setLocalValue(typedValue);
    setIsDragging(true);
  };

  const handleValueCommit = (newValue: number[]) => {
    const typedValue = newValue as [number, number];
    setLocalValue(typedValue);
    onValueChange(typedValue);
    setIsDragging(false);
  };

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* Value Display */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex flex-col">
          <span className="text-muted-foreground">Min Price</span>
          <span className="font-medium">{formatValue(localValue[0])}</span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-muted-foreground">Max Price</span>
          <span className="font-medium">{formatValue(localValue[1])}</span>
        </div>
      </div>

      {/* Slider */}
      <SliderPrimitive.Root
        ref={ref}
        className={cn(
          'relative flex w-full touch-none select-none items-center',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        value={localValue}
        onValueChange={handleValueChange}
        onValueCommit={handleValueCommit}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
          <SliderPrimitive.Range className="absolute h-full bg-primary" />
        </SliderPrimitive.Track>
        
        {/* Min Thumb */}
        <SliderPrimitive.Thumb 
          className={cn(
            'block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:pointer-events-none disabled:opacity-50',
            'hover:bg-primary/10 hover:scale-110',
            isDragging && 'scale-110 bg-primary/10'
          )}
        />
        
        {/* Max Thumb */}
        <SliderPrimitive.Thumb 
          className={cn(
            'block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:pointer-events-none disabled:opacity-50',
            'hover:bg-primary/10 hover:scale-110',
            isDragging && 'scale-110 bg-primary/10'
          )}
        />
      </SliderPrimitive.Root>

      {/* Range Labels */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  );
});

PriceRangeSlider.displayName = 'PriceRangeSlider';

export { PriceRangeSlider };
export type { PriceRangeSliderProps };