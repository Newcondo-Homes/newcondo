'use client';

import { useState, useCallback } from 'react';
import { PropertySearch, SearchFilters } from './PropertySearch';
import { useRouter } from 'next/navigation';

export function SearchBox() {
  const router = useRouter();
  const [filters, setFilters] = useState<SearchFilters>({});

  const handleFiltersChange = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters);
  }, []);

  const handleSearch = useCallback((newFilters: SearchFilters) => {
    // Build query params and navigate, or trigger a refetch
    const params = new URLSearchParams();
    if (newFilters.query) params.set('q', newFilters.query);
    if (newFilters.location?.city) params.set('city', newFilters.location.city);
    if (newFilters.location?.state) params.set('state', newFilters.location.state);
    if (newFilters.priceRange?.min) params.set('minPrice', String(newFilters.priceRange.min));
    if (newFilters.priceRange?.max) params.set('maxPrice', String(newFilters.priceRange.max));
    if (newFilters.propertyType?.length) params.set('type', newFilters.propertyType.join(','));
    if (newFilters.bedrooms?.min) params.set('minBeds', String(newFilters.bedrooms.min));
    if (newFilters.bathrooms?.min) params.set('minBaths', String(newFilters.bathrooms.min));

    router.push(`/properties?${params.toString()}`);
  }, []);

  return (
    <PropertySearch
      filters={filters}
      onFiltersChange={handleFiltersChange}
      onSearch={handleSearch}
    />
  );
}