// apps/platform/hooks/usePropertyList.ts
import { useQuery } from '@tanstack/react-query';
import { getMyProperties } from '@/lib/api/propertyManagement';
import { PropertyStatus } from '@prisma/client';

export interface PropertyListFilters {
  status?: PropertyStatus[];
  structure?: 'SINGLE_UNIT' | 'MULTI_FAMILY';
  isAvailable?: boolean;
  searchQuery?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'viewCount' | 'price' | 'title';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  state?: string;
}

export const usePropertyList = (filters?: PropertyListFilters) => {
  const query = useQuery({
    queryKey: ['my-properties', filters],
    queryFn: () => getMyProperties(filters),
    staleTime: 1000 * 60 * 3, // 3 minutes
    refetchOnWindowFocus: false,
  });

  return {
    // Data
    properties: query.data?.properties || [],
    totalCount: query.data?.totalCount || 0,
    totalPages: query.data?.totalPages || 0,
    currentPage: query.data?.currentPage || 1,
    hasNextPage: query.data?.hasNextPage || false,
    hasPreviousPage: query.data?.hasPreviousPage || false,
    
    // Summary stats
    stats: query.data?.stats || {
      totalProperties: 0,
      publishedProperties: 0,
      draftProperties: 0,
      rentedProperties: 0,
      availableProperties: 0,
      totalViews: 0,
      totalUnits: 0,
      availableUnits: 0,
    },
    
    // States
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    
    // Actions
    refetch: query.refetch,
  };
};

// Hook for getting a quick summary
export const usePropertyListSummary = () => {
  const { stats, isLoading } = usePropertyList({ limit: 1 });
  
  return {
    summary: stats,
    isLoading,
  };
};