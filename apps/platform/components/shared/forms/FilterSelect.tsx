// apps/platform/components/shared/forms/FilterSelect.tsx
'use client'

import React from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@newcondo/ui/components/badge"
import { Checkbox } from "@newcondo/ui/components/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@newcondo/ui/components/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@newcondo/ui/components/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@newcondo/ui/components/command"
import { cn } from "@/lib/utils"
import { 
  ChevronDown, 
  X, 
  Check,
  Filter,
  Home,
  MapPin,
  Bed,
  Bath
} from "lucide-react"

export interface FilterOption {
  value: string
  label: string
  count?: number
  description?: string
  icon?: React.ReactNode
}

interface SingleSelectProps {
  value?: string
  onChange: (value: string) => void
  options: FilterOption[]
  placeholder?: string
  title: string
  icon?: React.ReactNode
  variant?: 'outline' | 'ghost' | 'secondary'
}

interface MultiSelectProps {
  value?: string[]
  onChange: (value: string[]) => void
  options: FilterOption[]
  placeholder?: string
  title: string
  icon?: React.ReactNode
  variant?: 'outline' | 'ghost' | 'secondary'
  multi: true
}

type FilterSelectProps = SingleSelectProps | MultiSelectProps;

const FilterSelect: React.FC<FilterSelectProps> = ({ 
  options,
  title,
  placeholder = 'Select option',
  icon,
  variant = 'outline',
  ...props
}) => {
  const isMulti = 'multi' in props && props.multi;
  
  if (isMulti) {
    const { value, onChange } = props;
    const selectedOptions = value || [];

    const handleCheckedChange = (optionValue: string, checked: boolean) => {
      if (checked) {
        onChange([...selectedOptions, optionValue]);
      } else {
        onChange(selectedOptions.filter((v) => v !== optionValue));
      }
    };

    const clearSelection = () => onChange([]);
    
    const selectedLabels = selectedOptions.map(val => options.find(opt => opt.value === val)?.label).filter(Boolean);

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant={variant} 
            size="sm"
            className="flex items-center gap-2"
          >
            {icon || <Filter className="h-4 w-4" />}
            <span className="font-semibold">{title}</span>
            {selectedOptions.length > 0 && (
              <Badge variant="secondary" className="rounded-full h-5 px-2">
                {selectedOptions.length}
              </Badge>
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput placeholder={`Search ${title.toLowerCase()}...`} />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem key={option.value} onSelect={() => handleCheckedChange(option.value, !selectedOptions.includes(option.value))} className="cursor-pointer">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={option.value}
                        checked={selectedOptions.includes(option.value)}
                        onCheckedChange={(checked) => handleCheckedChange(option.value, !!checked)}
                      />
                      <label htmlFor={option.value} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {option.label}
                      </label>
                      {option.count && (
                        <span className="ml-auto text-xs text-gray-500">{option.count}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
          {selectedOptions.length > 0 && (
            <div className="p-2 border-t">
              <Button onClick={clearSelection} variant="ghost" className="w-full">
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    );
  }
  
  // Single select logic
  const { value, onChange } = props;
  const selectedLabel = value ? options.find(opt => opt.value === value)?.label : '';

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn("w-[180px]", variant === 'ghost' && 'border-none shadow-none')}>
        <div className="flex items-center gap-2">
          {icon || <Filter className="h-4 w-4" />}
          <span className="font-semibold">{title}:</span>
          <SelectValue placeholder={placeholder} />
        </div>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex items-center gap-2">
              {option.icon}
              {option.label}
              {option.count && (
                <span className="ml-auto text-xs text-gray-500">{option.count}</span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default FilterSelect;