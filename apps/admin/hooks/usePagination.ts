// apps/admin/src/hooks/usePagination.ts
import { useState, useMemo } from 'react';

interface UsePaginationProps {
  totalItems: number;
  itemsPerPage?: number;
  initialPage?: number;
}

interface UsePaginationReturn {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  startIndex: number;
  endIndex: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  setPageSize: (size: number) => void;
  reset: () => void;
}

export const usePagination = ({
  totalItems,
  itemsPerPage = 10,
  initialPage = 1,
}: UsePaginationProps): UsePaginationReturn => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(itemsPerPage);

  const totalPages = useMemo(() => {
    return Math.ceil(totalItems / pageSize);
  }, [totalItems, pageSize]);

  const startIndex = useMemo(() => {
    return (currentPage - 1) * pageSize;
  }, [currentPage, pageSize]);

  const endIndex = useMemo(() => {
    return Math.min(startIndex + pageSize, totalItems);
  }, [startIndex, pageSize, totalItems]);

  const hasNextPage = useMemo(() => {
    return currentPage < totalPages;
  }, [currentPage, totalPages]);

  const hasPreviousPage = useMemo(() => {
    return currentPage > 1;
  }, [currentPage]);

  const goToPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  };

  const nextPage = () => {
    if (hasNextPage) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const previousPage = () => {
    if (hasPreviousPage) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleSetPageSize = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const reset = () => {
    setCurrentPage(initialPage);
    setPageSize(itemsPerPage);
  };

  return {
    currentPage,
    totalPages,
    pageSize,
    startIndex,
    endIndex,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    nextPage,
    previousPage,
    setPageSize: handleSetPageSize,
    reset,
  };
};