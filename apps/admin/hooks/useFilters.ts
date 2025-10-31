// apps/admin/src/hooks/useFilters.ts

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';

export const useFilters = <T extends Record<string, any>>(initialFilters: T) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<T>(initialFilters);

  // Sync filters with URL on mount
  useEffect(() => {
    const urlFilters: any = { ...initialFilters };
    searchParams.forEach((value, key) => {
      if (key in initialFilters) {
        urlFilters[key] = value;
      }
    });
    setFilters(urlFilters);
  }, []);

  // Update filters and URL
  const updateFilters = useCallback((newFilters: Partial<T>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);

    // Update URL
    const params = new URLSearchParams();
    Object.entries(updated).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
      }
    });
    router.push(`${pathname}?${params.toString()}`);
  }, [filters, pathname, router]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
    router.push(pathname);
  }, [initialFilters, pathname, router]);

  // Save filter preset
  const savePreset = useCallback((name: string) => {
    if (typeof window !== 'undefined') {
      const presets = JSON.parse(localStorage.getItem('filterPresets') || '{}');
      presets[name] = filters;
      localStorage.setItem('filterPresets', JSON.stringify(presets));
    }
  }, [filters]);

  // Load filter preset
  const loadPreset = useCallback((name: string) => {
    if (typeof window !== 'undefined') {
      const presets = JSON.parse(localStorage.getItem('filterPresets') || '{}');
      if (presets[name]) {
        updateFilters(presets[name]);
      }
    }
  }, [updateFilters]);

  return {
    filters,
    updateFilters,
    clearFilters,
    savePreset,
    loadPreset
  };
};

// ============================================
// apps/admin/src/hooks/usePagination.ts

import { useState, useCallback } from 'react';

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const usePagination = (
  initialPage = 1,
  initialLimit = 20
) => {
  const [pagination, setPagination] = useState<PaginationState>({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    totalPages: 0
  });

  // Update pagination from API response
  const updatePagination = useCallback((data: {
    total?: number;
    totalPages?: number;
    page?: number;
    limit?: number;
  }) => {
    setPagination(prev => ({
      ...prev,
      ...data
    }));
  }, []);

  // Go to specific page
  const goToPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  // Go to next page
  const nextPage = useCallback(() => {
    setPagination(prev => ({
      ...prev,
      page: Math.min(prev.page + 1, prev.totalPages)
    }));
  }, []);

  // Go to previous page
  const previousPage = useCallback(() => {
    setPagination(prev => ({
      ...prev,
      page: Math.max(prev.page - 1, 1)
    }));
  }, []);

  // Change page size
  const setPageSize = useCallback((limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }));
  }, []);

  // Reset pagination
  const resetPagination = useCallback(() => {
    setPagination({
      page: initialPage,
      limit: initialLimit,
      total: 0,
      totalPages: 0
    });
  }, [initialPage, initialLimit]);

  return {
    pagination,
    updatePagination,
    goToPage,
    nextPage,
    previousPage,
    setPageSize,
    resetPagination,
    hasNextPage: pagination.page < pagination.totalPages,
    hasPreviousPage: pagination.page > 1
  };
};

// ============================================
// apps/admin/src/hooks/useSearch.ts

import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from './useDebounce';

export const useSearch = (
  initialQuery = '',
  debounceMs = 500
) => {
  const [query, setQuery] = useState(initialQuery);
  const [history, setHistory] = useState<string[]>([]);
  const debouncedQuery = useDebounce(query, debounceMs);

  // Load search history from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('searchHistory');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    }
  }, []);

  // Update query
  const search = useCallback((newQuery: string) => {
    setQuery(newQuery);

    // Add to history if not empty
    if (newQuery.trim() && typeof window !== 'undefined') {
      setHistory(prev => {
        const updated = [newQuery, ...prev.filter(q => q !== newQuery)].slice(0, 10);
        localStorage.setItem('searchHistory', JSON.stringify(updated));
        return updated;
      });
    }
  }, []);

  // Clear query
  const clearSearch = useCallback(() => {
    setQuery('');
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('searchHistory');
    }
  }, []);

  return {
    query,
    debouncedQuery,
    search,
    clearSearch,
    history,
    clearHistory
  };
};

// ============================================
// apps/admin/src/hooks/useDebounce.ts

import { useState, useEffect } from 'react';

export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// ============================================
// apps/admin/src/hooks/useExport.ts

import { useState, useCallback } from 'react';

type ExportFormat = 'CSV' | 'EXCEL' | 'PDF';

interface ExportColumn {
  key: string;
  label: string;
  format?: (value: any) => string;
}

export const useExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Export data to CSV
   */
  const exportToCsv = useCallback(async (
    data: any[],
    filename: string,
    columns: ExportColumn[]
  ) => {
    setIsExporting(true);
    setError(null);

    try {
      // Create CSV content
      const headers = columns.map(col => col.label).join(',');
      const rows = data.map(item =>
        columns.map(col => {
          const value = item[col.key];
          const formatted = col.format ? col.format(value) : value;
          return `"${String(formatted).replace(/"/g, '""')}"`;
        }).join(',')
      );

      const csv = [headers, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

      // Download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Export failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsExporting(false);
    }
  }, []);

  /**
   * Export data to Excel (using CSV format for simplicity)
   */
  const exportToExcel = useCallback(async (
    data: any[],
    filename: string,
    sheets: { name: string; columns: ExportColumn[] }[]
  ) => {
    // For now, export first sheet as CSV
    // In production, use a library like xlsx for proper Excel support
    const firstSheet = sheets[0];
    return exportToCsv(data, filename, firstSheet.columns);
  }, [exportToCsv]);

  /**
   * Export custom report via API
   */
  const exportCustomReport = useCallback(async (
    apiEndpoint: string,
    filters: any,
    format: ExportFormat = 'CSV'
  ) => {
    setIsExporting(true);
    setError(null);

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ ...filters, format })
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `export-${Date.now()}.${format.toLowerCase()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Export failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsExporting(false);
    }
  }, []);

  return {
    isExporting,
    error,
    exportToCsv,
    exportToExcel,
    exportCustomReport,
    clearError: () => setError(null)
  };
};