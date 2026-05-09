// apps/platform/src/components/property/property-grid.tsx
'use client';

import { useState } from 'react';
import { PropertyCard } from './property-card';
import { PropertyFilters as PropertyFiltersComponent } from './property-filters';
import { PropertySearch } from './property-search';
import { useProperties } from '@/hooks/useProperties';
import { usePropertyListingStore } from '@/store/propertyListingStore';
import { Button } from '@newcondo/ui/';
import { Skeleton } from '@newcondo/ui/';
import { Alert, AlertDescription } from '@newcondo/ui/';
import { AlertCircle, MapPin, Grid, List } from 'lucide-react';
import { PropertyFilters, PropertyResponse } from '@/lib/api/properties';
import { PropertyType } from '@/types/enums';
type Property = PropertyResponse;

interface PropertyGridProps {
  searchQuery?: string;
  filters?: PropertyFilters;
  showFilters?: boolean;
  gridView?: boolean;
  onPropertyClick?: (property: Property) => void;
  className?: string;
}

export function PropertyGrid({
  searchQuery = '',
  // filters,
  showFilters = true,
  gridView = true,
  onPropertyClick,
  className = ''
}: PropertyGridProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(gridView ? 'grid' : 'list');
  const [localFilters, setLocalFilters] = useState<{
    priceRange: { min?: number; max?: number };
    propertyType: string;
    bedrooms: string;
    bathrooms: string;
    features: string[];
    availableFrom: string;
  }>({
    priceRange: { min: undefined, max: undefined },
    propertyType: '',
    bedrooms: '',
    bathrooms: '',
    features: [],
    availableFrom: '',
  });
  const [searchTerm, setSearchTerm] = useState(searchQuery);

  const { data, isLoading: loading, error: queryError } = useProperties({
    minPrice: localFilters.priceRange.min,
    maxPrice: localFilters.priceRange.max,
    propertyType: localFilters.propertyType as PropertyType | undefined,
    bedrooms: localFilters.bedrooms ? Number(localFilters.bedrooms) : undefined,
    bathrooms: localFilters.bathrooms ? Number(localFilters.bathrooms) : undefined,
    features: localFilters.features,
    page: currentPage,
    limit: 12,
  } satisfies PropertyFilters);

  const properties = data?.properties ?? [];
  const totalCount = data?.pagination?.total ?? 0;
  const hasMore = data?.pagination?.hasNext ?? false;
  const error = queryError ? (queryError as Error).message : null;

  const { duplicateProperties } = usePropertyListingStore();

  const toPropertyWithDetails = (p: PropertyResponse): Property => ({
    ...p,
    images: p.images.map(img => ({
      ...img,
      propertyId: p.id,
      createdAt: new Date(),
    })),
  });

  // Handle search input change
  const handleSearchChange = (query: string) => {
    setSearchTerm(query);
    setCurrentPage(1);
  };

  // Handle filter change
  const handleFilterChange = (newFilters: typeof localFilters) => {
    setLocalFilters(newFilters);
    setCurrentPage(1);
  };

  // Handle search submit
  // const handleSearchSubmit = () => {
  //   setCurrentPage(1);
  // };

  // Load more properties
  const loadMoreProperties = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
  };

  // Toggle view mode
  // const toggleViewMode = () => {
  //   setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
  // };

  // Check if property is a duplicate
  const isDuplicate = (propertyId: string) => {
    return duplicateProperties.some(dup => dup.id === propertyId);
  };

  // Render loading skeleton
  const renderLoadingSkeleton = () => (
    <div className={`grid gap-6 ${viewMode === 'grid'
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      : 'grid-cols-1'
      }`}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-48 w-full rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-6 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );

  // Render empty state
  const renderEmptyState = () => (
    <div className="text-center py-12">
      <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold">No properties found</h3>
      <p className="mt-2 text-muted-foreground">
        {searchTerm || Object.keys(localFilters).length > 0
          ? "Try adjusting your search or filters"
          : "No properties are currently available"}
      </p>
      {(searchTerm || Object.keys(localFilters).length > 0) && (
        <Button
          variant="outline"
          onClick={() => {
            setSearchTerm('');
            setLocalFilters({
              priceRange: { min: undefined, max: undefined },
              propertyType: '',
              bedrooms: '',
              bathrooms: '',
              features: [],
              availableFrom: '',
            });
            setCurrentPage(1);
          }}
          className="mt-4"
        >
          Clear all filters
        </Button>
      )}
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <PropertySearch
              onFiltersChange={(filters) => {
                handleSearchChange(filters.query ?? '');
                handleFilterChange(filters);
              }}
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="px-3"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="px-3"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {showFilters && (
          <PropertyFiltersComponent
            filters={localFilters}
            onFiltersChange={handleFilterChange}
          />
        )}
      </div>

      {/* Results Summary */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {properties.length} of {totalCount} properties
          </span>
          {searchTerm && (
            <span>
              Search results for &quot;{searchTerm}&quot;
            </span>
          )}
        </div>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Properties Grid/List */}
      {loading && properties.length === 0 ? (
        renderLoadingSkeleton()
      ) : properties.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className={`grid gap-6 ${viewMode === 'grid'
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          : 'grid-cols-1'
          }`}>
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property as unknown as import('@/types/property').PropertyWithDetails}
              viewMode={viewMode}
              onClick={() => onPropertyClick?.(toPropertyWithDetails(property))}
              isDuplicate={isDuplicate(property.id)}
              showBoundaryStatus={true}
            />
          ))}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && !loading && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={loadMoreProperties}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More Properties'}
          </Button>
        </div>
      )}

      {/* Loading More */}
      {loading && properties.length > 0 && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Loading more properties...</span>
          </div>
        </div>
      )}
    </div>
  );
}