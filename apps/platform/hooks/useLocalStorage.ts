'use client'

import { useState, useEffect, useCallback } from 'react';

// Type for the hook return value
type UseLocalStorageReturn<T> = [
  T,
  (value: T | ((prevValue: T) => T)) => void,
  () => void
];

// Custom hook for localStorage with TypeScript support
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): UseLocalStorageReturn<T> {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback((value: T | ((prevValue: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to local storage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Function to remove the item from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Listen for changes in localStorage from other tabs/windows
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error(`Error parsing localStorage value for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);

  return [storedValue, setValue, removeValue];
}

// Specific hooks for common property-related data
export function useSearchHistory() {
  return useLocalStorage<string[]>('newcondo_search_history', []);
}

export function useRecentlyViewed() {
  return useLocalStorage<string[]>('newcondo_recently_viewed', []);
}

export function useFavoritesList() {
  return useLocalStorage<string[]>('newcondo_favorites', []);
}

export function usePropertyFilters() {
  return useLocalStorage('newcondo_property_filters', {
    minPrice: null,
    maxPrice: null,
    propertyType: null,
    bedrooms: null,
    bathrooms: null,
    amenities: [],
    city: null,
    state: null,
  });
}

export function useComparisonList() {
  return useLocalStorage<string[]>('newcondo_property_comparison', []);
}

export function useViewMode() {
  return useLocalStorage<'grid' | 'list'>('newcondo_view_mode', 'grid');
}

export function useSortPreference() {
  return useLocalStorage<'price_asc' | 'price_desc' | 'newest' | 'oldest' | 'popular'>(
    'newcondo_sort_preference', 
    'newest'
  );
}

// Hook to manage recently viewed properties with automatic cleanup
export function useRecentlyViewedManager() {
  const [recentlyViewed, setRecentlyViewed] = useRecentlyViewed();
  
  const addToRecentlyViewed = useCallback((propertyId: string) => {
    setRecentlyViewed(prev => {
      const filtered = prev.filter(id => id !== propertyId);
      const updated = [propertyId, ...filtered];
      // Keep only the last 20 items
      return updated.slice(0, 20);
    });
  }, [setRecentlyViewed]);

  const removeFromRecentlyViewed = useCallback((propertyId: string) => {
    setRecentlyViewed(prev => prev.filter(id => id !== propertyId));
  }, [setRecentlyViewed]);

  const clearRecentlyViewed = useCallback(() => {
    setRecentlyViewed([]);
  }, [setRecentlyViewed]);

  return {
    recentlyViewed,
    addToRecentlyViewed,
    removeFromRecentlyViewed,
    clearRecentlyViewed,
  };
}

// Hook to manage search history with automatic cleanup
export function useSearchHistoryManager() {
  const [searchHistory, setSearchHistory] = useSearchHistory();

  const addToSearchHistory = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    setSearchHistory(prev => {
      const filtered = prev.filter(term => term !== searchTerm);
      const updated = [searchTerm, ...filtered];
      // Keep only the last 10 searches
      return updated.slice(0, 10);
    });
  }, [setSearchHistory]);

  const removeFromSearchHistory = useCallback((searchTerm: string) => {
    setSearchHistory(prev => prev.filter(term => term !== searchTerm));
  }, [setSearchHistory]);

  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
  }, [setSearchHistory]);

  return {
    searchHistory,
    addToSearchHistory,
    removeFromSearchHistory,
    clearSearchHistory,
  };
}

// Hook to manage property comparison list
export function useComparisonManager() {
  const [comparisonList, setComparisonList] = useComparisonList();
  const maxComparisons = 4;

  const addToComparison = useCallback((propertyId: string) => {
    setComparisonList(prev => {
      if (prev.includes(propertyId)) return prev;
      if (prev.length >= maxComparisons) {
        // Remove the first item and add the new one
        return [...prev.slice(1), propertyId];
      }
      return [...prev, propertyId];
    });
  }, [setComparisonList]);

  const removeFromComparison = useCallback((propertyId: string) => {
    setComparisonList(prev => prev.filter(id => id !== propertyId));
  }, [setComparisonList]);

  const clearComparison = useCallback(() => {
    setComparisonList([]);
  }, [setComparisonList]);

  const isInComparison = useCallback((propertyId: string) => {
    return comparisonList.includes(propertyId);
  }, [comparisonList]);

  const canAddToComparison = comparisonList.length < maxComparisons;

  return {
    comparisonList,
    addToComparison,
    removeFromComparison,
    clearComparison,
    isInComparison,
    canAddToComparison,
    maxComparisons,
  };
}