// apps/platform/hooks/usePagination.ts
'use client'

import { useState, useMemo, useCallback } from 'react';

export interface PaginationOptions {
  initialPage?: number;
  initialLimit?: number;
  totalCount: number;
}

export interface PaginationReturn {
  currentPage: number;
  limit: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startIndex: number;
  endIndex: number;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  setLimit: (limit: number) => void;
  reset: () => void;
}

export const usePagination = ({
  initialPage = 1,
  initialLimit = 10,
  totalCount,
}: PaginationOptions): PaginationReturn => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit, setLimitState] = useState(initialLimit);

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalCount / limit));
  }, [totalCount, limit]);

  // Check if navigation is available
  const hasNextPage = useMemo(() => {
    return currentPage < totalPages;
  }, [currentPage, totalPages]);

  const hasPreviousPage = useMemo(() => {
    return currentPage > 1;
  }, [currentPage]);

  // Calculate indices for current page
  const startIndex = useMemo(() => {
    return (currentPage - 1) * limit;
  }, [currentPage, limit]);

  const endIndex = useMemo(() => {
    return Math.min(startIndex + limit, totalCount);
  }, [startIndex, limit, totalCount]);

  // Navigation functions
  const goToPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasNextPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [hasPreviousPage]);

  const setLimit = useCallback((newLimit: number) => {
    setLimitState(newLimit);
    setCurrentPage(1); // Reset to first page when limit changes
  }, []);

  const reset = useCallback(() => {
    setCurrentPage(initialPage);
    setLimitState(initialLimit);
  }, [initialPage, initialLimit]);

  return {
    currentPage,
    limit,
    totalPages,
    totalCount,
    hasNextPage,
    hasPreviousPage,
    startIndex,
    endIndex,
    goToPage,
    nextPage,
    previousPage,
    setLimit,
    reset,
  };
};

// Hook for generating page numbers array for pagination UI
export const usePaginationRange = (
  currentPage: number,
  totalPages: number,
  siblings = 1
) => {
  const range = useMemo(() => {
    const totalNumbers = siblings * 2 + 3; // siblings on each side + first + last + current
    const totalBlocks = totalNumbers + 2; // + 2 for left and right dots

    if (totalPages <= totalBlocks) {
      // Show all pages if total is less than max displayable
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblings, 1);
    const rightSiblingIndex = Math.min(currentPage + siblings, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblings;
      const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
      return [...leftRange, '...', totalPages];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblings;
      const rightRange = Array.from(
        { length: rightItemCount },
        (_, i) => totalPages - rightItemCount + i + 1
      );
      return [1, '...', ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i
      );
      return [1, '...', ...middleRange, '...', totalPages];
    }

    return [];
  }, [currentPage, totalPages, siblings]);

  return range;
};

// Hook for offset-based pagination (for APIs)
export const useOffsetPagination = (limit: number = 10) => {
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const currentPage = useMemo(() => {
    return Math.floor(offset / limit) + 1;
  }, [offset, limit]);

  const totalPages = useMemo(() => {
    return Math.ceil(totalCount / limit);
  }, [totalCount, limit]);

  const goToPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setOffset((validPage - 1) * limit);
  }, [limit, totalPages]);

  const nextPage = useCallback(() => {
    if (offset + limit < totalCount) {
      setOffset(prev => prev + limit);
    }
  }, [offset, limit, totalCount]);

  const previousPage = useCallback(() => {
    if (offset > 0) {
      setOffset(prev => Math.max(0, prev - limit));
    }
  }, [offset, limit]);

  return {
    offset,
    limit,
    currentPage,
    totalPages,
    totalCount,
    setTotalCount,
    goToPage,
    nextPage,
    previousPage,
    hasNextPage: offset + limit < totalCount,
    hasPreviousPage: offset > 0,
  };
};