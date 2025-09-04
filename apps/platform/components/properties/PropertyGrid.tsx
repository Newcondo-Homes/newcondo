'use client';

import { useState, useMemo, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import PropertyCard from './PropertyCard';
import PropertyCardSkeleton from './PropertyCardSkeleton';
import { Button } from '@newcondo/ui/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { usePropertyStore } from '@/store/propertyStore';
import { Property } from '@/types/api';
import { searchProperties } from '@/lib/api/properties';

interface PropertyGridProps {
  searchQuery?: string;
  filters?: {
    priceRange?: [number, number];
    city?: string;
    state?: string;
    propertyType?: string;
    bedrooms?: number;
    bathrooms?: number;
    features?: string[];
  };
  showComparison?: boolean;
  className?: string;
}

export default function PropertyGrid({
  searchQuery = '',
  filters = {},
  showComparison = false,
  className = ''
}: PropertyGridProps) {
  const { selectedForComparison, toggleComparison, clearComparison } = usePropertyStore();
  const [retryCount, setRetryCount] = useState(0);
  
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    rootMargin: '100px'
  });

  // Memoize the search parameters to prevent unnecessary refetches
  const searchParams = useMemo(() => ({
    q: searchQuery,
    ...filters,
    limit: 48, // 8 rows × 6 cards = 48 properties per page
    retryAttempt: retryCount
  }), [searchQuery, filters, retryCount]);

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    refetch
  } = useInfiniteQuery({
    queryKey: ['properties', searchParams],
    queryFn: ({ pageParam = 1 }) =>
      searchProperties({
        ...searchParams,
        page: pageParam
      }),
    getNextPageParam: (lastPage) => {
      const { currentPage, totalPages } = lastPage.pagination;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - prevent unnecessary refetches
    cacheTime: 30 * 60 * 1000, // 30 minutes - keep data in cache
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  // Auto-fetch next page when in view
  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && status === 'success') {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage, status]);

  const allProperties = useMemo(() => {
    return data?.pages.flatMap(page => page.data) ?? [];
  }, [data]);

  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    refetch();
  }, [refetch]);

  const handleComparisonClear = useCallback(() => {
    clearComparison();
  }, [clearComparison]);

  if (status === 'loading') {
    return (
      <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 ${className}`}>
        {Array.from({ length: 48 }).map((_, index) => (
          <PropertyCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Unable to load properties</h3>
        <p className="text-gray-600 mb-4">
          {error instanceof Error 
            ? error.message 
            : 'Something went wrong while fetching properties. Please try again.'}
        </p>
        <Button onClick={handleRetry} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  if (allProperties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="text-6xl mb-4">🏠</div>
        <h3 className="text-lg font-semibold mb-2">No properties found</h3>
        <p className="text-gray-600">
          Try adjusting your search criteria or explore different areas.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Comparison Bar */}
      {showComparison && selectedForComparison.length > 0 && (
        <div className="sticky top-0 z-40 bg-white border-b shadow-sm mb-6 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedForComparison.length} propert{selectedForComparison.length === 1 ? 'y' : 'ies'} selected for comparison
            </span>
            <div className="flex items-center gap-2">
              {selectedForComparison.length >= 2 && (
                <Button asChild size="sm">
                  <a href={`/properties/compare?ids=${selectedForComparison.join(',')}`}>
                    Compare Properties
                  </a>
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleComparisonClear}
              >
                Clear All
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Properties Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {allProperties.map((property: Property) => (
          <PropertyCard
            key={property.id}
            property={property}
            showComparison={showComparison}
            isSelected={selectedForComparison.includes(property.id)}
            onToggleComparison={() => toggleComparison(property.id)}
          />
        ))}

        {/* Loading skeletons for next page */}
        {isFetchingNextPage && (
          <>
            {Array.from({ length: 12 }).map((_, index) => (
              <PropertyCardSkeleton key={`skeleton-${index}`} />
            ))}
          </>
        )}
      </div>

      {/* Load more trigger */}
      {hasNextPage && (
        <div ref={loadMoreRef} className="flex justify-center pt-8">
          {!isFetchingNextPage && (
            <div className="text-sm text-gray-500">
              Scroll to load more properties...
            </div>
          )}
        </div>
      )}

      {/* End of results */}
      {!hasNextPage && allProperties.length > 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">
            You've seen all {allProperties.length} available properties
          </p>
        </div>
      )}
    </div>
  );
}