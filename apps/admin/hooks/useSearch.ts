// apps/admin/src/hooks/useSearch.ts
import { useState, useMemo, useCallback } from 'react';
import { useDebounce } from './useDebounce';

interface UseSearchProps<T> {
  data: T[];
  searchFields: (keyof T)[];
  debounceMs?: number;
}

interface UseSearchReturn<T> {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredData: T[];
  isSearching: boolean;
  clearSearch: () => void;
  searchFieldsConfig: (keyof T)[];
  setSearchFields: (fields: (keyof T)[]) => void;
}

export const useSearch = <T extends Record<string, any>>({
  data,
  searchFields,
  debounceMs = 300,
}: UseSearchProps<T>): UseSearchReturn<T> => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchFields, setActiveSearchFields] = useState<(keyof T)[]>(searchFields);
  
  const debouncedQuery = useDebounce(searchQuery, debounceMs);

  const filteredData = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return data;
    }

    const lowerQuery = debouncedQuery.toLowerCase();

    return data.filter((item) => {
      return activeSearchFields.some((field) => {
        const value = item[field];
        
        if (value === null || value === undefined) {
          return false;
        }

        // Handle different value types
        if (typeof value === 'string') {
          return value.toLowerCase().includes(lowerQuery);
        }
        
        if (typeof value === 'number') {
          return value.toString().includes(lowerQuery);
        }

        if (typeof value === 'boolean') {
          return value.toString().toLowerCase().includes(lowerQuery);
        }

        // Handle arrays
        if (Array.isArray(value)) {
          return value.some((v) => 
            String(v).toLowerCase().includes(lowerQuery)
          );
        }

        // Handle objects - search stringified value
        if (typeof value === 'object') {
          return JSON.stringify(value).toLowerCase().includes(lowerQuery);
        }

        return false;
      });
    });
  }, [data, debouncedQuery, activeSearchFields]);

  const isSearching = useMemo(() => {
    return searchQuery !== debouncedQuery;
  }, [searchQuery, debouncedQuery]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const setSearchFields = useCallback((fields: (keyof T)[]) => {
    setActiveSearchFields(fields);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    filteredData,
    isSearching,
    clearSearch,
    searchFieldsConfig: activeSearchFields,
    setSearchFields,
  };
};