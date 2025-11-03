// apps/platform/hooks/useFilters.ts
import { useState, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export interface FilterConfig<T = any> {
  key: string;
  defaultValue?: T;
  transform?: (value: any) => T;
}

export const useFilters = <T extends Record<string, any>>(
  config: FilterConfig[],
  options?: {
    syncWithUrl?: boolean;
    debounceMs?: number;
  }
) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const syncWithUrl = options?.syncWithUrl ?? true;

  // Initialize filters from URL params or defaults
  const initialFilters = useMemo(() => {
    const filters: any = {};
    
    config.forEach(({ key, defaultValue, transform }) => {
      if (syncWithUrl && searchParams?.has(key)) {
        const value = searchParams.get(key);
        filters[key] = transform ? transform(value) : value;
      } else {
        filters[key] = defaultValue;
      }
    });
    
    return filters as T;
  }, [config, searchParams, syncWithUrl]);

  const [filters, setFilters] = useState<T>(initialFilters);

  // Update URL params when filters change
  const updateUrl = useCallback((newFilters: T) => {
    if (!syncWithUrl) return;

    const params = new URLSearchParams(searchParams?.toString());
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params.set(key, String(value));
      } else {
        params.delete(key);
      }
    });

    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    
    router.push(newUrl, { scroll: false });
  }, [pathname, router, searchParams, syncWithUrl]);

  // Set a single filter
  const setFilter = useCallback((key: keyof T, value: T[keyof T]) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      updateUrl(newFilters);
      return newFilters;
    });
  }, [updateUrl]);

  // Set multiple filters at once
  const setMultipleFilters = useCallback((updates: Partial<T>) => {
    setFilters(prev => {
      const newFilters = { ...prev, ...updates };
      updateUrl(newFilters);
      return newFilters;
    });
  }, [updateUrl]);

  // Reset all filters to defaults
  const resetFilters = useCallback(() => {
    const defaults: any = {};
    config.forEach(({ key, defaultValue }) => {
      defaults[key] = defaultValue;
    });
    
    setFilters(defaults);
    updateUrl(defaults);
  }, [config, updateUrl]);

  // Reset a single filter
  const resetFilter = useCallback((key: keyof T) => {
    const defaultValue = config.find(c => c.key === key as string)?.defaultValue;
    setFilter(key, defaultValue as T[keyof T]);
  }, [config, setFilter]);

  // Check if filters have been applied
  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      const defaultValue = config.find(c => c.key === key)?.defaultValue;
      return value !== defaultValue && value !== null && value !== undefined && value !== '';
    });
  }, [filters, config]);

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      const defaultValue = config.find(c => c.key === key)?.defaultValue;
      return value !== defaultValue && value !== null && value !== undefined && value !== '';
    }).length;
  }, [filters, config]);

  return {
    filters,
    setFilter,
    setMultipleFilters,
    resetFilters,
    resetFilter,
    hasActiveFilters,
    activeFilterCount,
  };
};

// Specialized hook for property filters
export const usePropertyFilters = () => {
  return useFilters([
    { key: 'status', defaultValue: undefined },
    { key: 'structure', defaultValue: undefined },
    { key: 'propertyType', defaultValue: undefined },
    { key: 'minPrice', defaultValue: undefined, transform: Number },
    { key: 'maxPrice', defaultValue: undefined, transform: Number },
    { key: 'bedrooms', defaultValue: undefined, transform: Number },
    { key: 'bathrooms', defaultValue: undefined, transform: Number },
    { key: 'city', defaultValue: undefined },
    { key: 'state', defaultValue: undefined },
    { key: 'searchQuery', defaultValue: '' },
    { key: 'sortBy', defaultValue: 'createdAt' },
    { key: 'sortOrder', defaultValue: 'desc' },
  ]);
};

// Hook for date range filters
export const useDateRangeFilter = (initialStartDate?: Date, initialEndDate?: Date) => {
  const [startDate, setStartDate] = useState<Date | undefined>(initialStartDate);
  const [endDate, setEndDate] = useState<Date | undefined>(initialEndDate);

  const setDateRange = useCallback((start?: Date, end?: Date) => {
    setStartDate(start);
    setEndDate(end);
  }, []);

  const resetDateRange = useCallback(() => {
    setStartDate(undefined);
    setEndDate(undefined);
  }, []);

  const isActive = useMemo(() => {
    return !!startDate || !!endDate;
  }, [startDate, endDate]);

  return {
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    setDateRange,
    resetDateRange,
    isActive,
  };
};

// Hook for multi-select filters
export const useMultiSelectFilter = <T extends string | number>(
  initialValues: T[] = []
) => {
  const [selectedValues, setSelectedValues] = useState<T[]>(initialValues);

  const toggleValue = useCallback((value: T) => {
    setSelectedValues(prev =>
      prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
  }, []);

  const addValue = useCallback((value: T) => {
    setSelectedValues(prev =>
      prev.includes(value) ? prev : [...prev, value]
    );
  }, []);

  const removeValue = useCallback((value: T) => {
    setSelectedValues(prev => prev.filter(v => v !== value));
  }, []);

  const clearAll = useCallback(() => {
    setSelectedValues([]);
  }, []);

  const selectAll = useCallback((values: T[]) => {
    setSelectedValues(values);
  }, []);

  const hasValue = useCallback((value: T) => {
    return selectedValues.includes(value);
  }, [selectedValues]);

  return {
    selectedValues,
    toggleValue,
    addValue,
    removeValue,
    clearAll,
    selectAll,
    hasValue,
    count: selectedValues.length,
    isEmpty: selectedValues.length === 0,
  };
};