'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import * as propertyApi from '@/lib/api/properties';
import * as searchApi from '@/lib/api/search';
import * as favoritesApi from '@/lib/api/favorites';
import type { Property, PropertySearchParams } from '@/types/api';
import type { PropertyFilters } from '@/lib/api/properties';



// Query keys for React Query
export const propertyKeys = {
  all: ['properties'] as const,
  lists: () => [...propertyKeys.all, 'list'] as const,
  list: (filters: PropertyFilters) => [...propertyKeys.lists(), filters] as const,
  details: () => [...propertyKeys.all, 'detail'] as const,
  detail: (id: string) => [...propertyKeys.details(), id] as const,
  search: (params: PropertySearchParams) => [...propertyKeys.all, 'search', params] as const,
  favorites: () => [...propertyKeys.all, 'favorites'] as const,
  recent: () => [...propertyKeys.all, 'recent'] as const,
};


export function useMarkProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ propertyId, data }: {
      propertyId: string;
      data: {
        boundaryCoordinates: { lat: number; lng: number }[];
        boundaryCenter?: { lat: number; lng: number };
        boundaryImages: string[];
        boundaryVerified: boolean;
        boundaryMarkedAt: Date;
      };
    }) => propertyApi.markProperty(propertyId, data),
    onSuccess: (_, { propertyId }) => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.detail(propertyId) });
    },
  });
}


// Hook for fetching properties with filters and pagination
export function useProperties(filters?: PropertyFilters) {
  return useQuery({
    queryKey: propertyKeys.list(filters || {}),
    queryFn: () => propertyApi.getProperties(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
    refetchOnWindowFocus: false,
    select: (data) => data,
  });
}

// Hook for property search with debouncing
export function usePropertySearch(searchParams: PropertySearchParams) {
  return useQuery({
    queryKey: propertyKeys.search(searchParams),
    queryFn: () => searchApi.searchProperties(searchParams),
    enabled: !!searchParams.query || Object.keys(searchParams.filters || {}).length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Hook for getting a single property details
export function useProperty(id: string) {
  return useQuery({
    queryKey: propertyKeys.detail(id),
    queryFn: () => propertyApi.getProperty(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000, // Cache property details longer
  });
}

// Hook for recent/popular properties (landing page)
export function useRecentProperties() {
  return useQuery({
    queryKey: propertyKeys.recent(),
    queryFn: () => propertyApi.getRecentProperties(),
    staleTime: 10 * 60 * 1000, // 10 minutes for landing page
    gcTime: 30 * 60 * 1000, // Cache longer for landing page performance
    refetchOnWindowFocus: false,
  });
}

// Hook for favorite properties
export function useFavoriteProperties() {
  return useQuery({
    queryKey: propertyKeys.favorites(),
    queryFn: () => favoritesApi.getFavorites(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Hook for toggling property favorites
export function useFavoriteToggle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ propertyId, isFavorite }: { propertyId: string; isFavorite: boolean }) => {
      return isFavorite 
        ? favoritesApi.removeFavorite(propertyId)
        : favoritesApi.addFavorite(propertyId);
    },
    onMutate: async ({ propertyId, isFavorite }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: propertyKeys.favorites() });
      await queryClient.cancelQueries({ queryKey: propertyKeys.detail(propertyId) });

      // Snapshot the previous values
      const previousFavorites = queryClient.getQueryData(propertyKeys.favorites());
      const previousProperty = queryClient.getQueryData(propertyKeys.detail(propertyId));

      // Optimistically update the cache
      if (previousProperty) {
        queryClient.setQueryData(propertyKeys.detail(propertyId), {
          ...previousProperty,
          isFavorite: !isFavorite,
        });
      }

      return { previousFavorites, previousProperty };
    },
    onError: (err, { propertyId }, context) => {
      // Rollback on error
      if (context?.previousFavorites) {
        queryClient.setQueryData(propertyKeys.favorites(), context.previousFavorites);
      }
      if (context?.previousProperty) {
        queryClient.setQueryData(propertyKeys.detail(propertyId), context.previousProperty);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: propertyKeys.favorites() });
    },
  });
}

// Hook for property comparison
export function usePropertyComparison() {
  const queryClient = useQueryClient();

  const getComparisonProperties = (propertyIds: string[]) => {
    return Promise.all(
      propertyIds.map(id => 
        queryClient.ensureQueryData({
          queryKey: propertyKeys.detail(id),
          queryFn: () => propertyApi.getProperty(id),
          staleTime: 5 * 60 * 1000,
        })
      )
    );
  };

  return {
    getComparisonProperties,
  };
}

// Hook for URL search params management
export function usePropertyFiltersFromURL() {
  const searchParams = useSearchParams();
  
  const filters = useMemo(() => {
    const params: PropertyFilters = {};
    
    // Extract filters from URL
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const city = searchParams.get('city');
    const state = searchParams.get('state');
    const propertyType = searchParams.get('type');
    const bedrooms = searchParams.get('bedrooms');
    const bathrooms = searchParams.get('bathrooms');
    const amenities = searchParams.get('amenities');

    if (minPrice) params.minPrice = parseFloat(minPrice);
    if (maxPrice) params.maxPrice = parseFloat(maxPrice);
    if (city) params.city = city;
    if (state) params.state = state;
    if (propertyType) params.propertyType = propertyType as any;
    if (bedrooms) params.bedrooms = parseInt(bedrooms);
    if (bathrooms) params.bathrooms = parseInt(bathrooms);
    if (amenities) params.amenities = amenities.split(',');

    return params;
  }, [searchParams]);

  return filters;
}

// Hook for incrementing property view count
export function usePropertyView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: propertyApi.incrementViewCount,
    onSuccess: (data, propertyId) => {
      // Update the property detail cache with new view count
      queryClient.setQueryData(
        propertyKeys.detail(propertyId),
        (oldData: Property) => oldData ? { ...oldData, viewCount: data.viewCount } : oldData
      );
    },
  });
}

// Hook for property sharing
export function usePropertyShare() {
  return useMutation({
    mutationFn: propertyApi.shareProperty,
    onSuccess: (data) => {
      // Could track sharing analytics here
      console.log('Property shared:', data.shareableLink);
    },
  });
}

// Prefetch hook for better UX
export function usePrefetchProperty() {
  const queryClient = useQueryClient();

  const prefetchProperty = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: propertyKeys.detail(id),
      queryFn: () => propertyApi.getProperty(id),
      staleTime: 5 * 60 * 1000,
    });
  };

  return { prefetchProperty };
}