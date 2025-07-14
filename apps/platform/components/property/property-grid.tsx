// apps/platform/src/components/property/property-grid.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { PropertyCard } from './property-card';
import { PropertyFilters } from './property-filters';
import { PropertySearch } from './property-search';
import { useProperties } from '@/hooks/useProperties';
import { usePropertyStore } from '@/store/propertyListingStore';
import { Button } from '@newcondo/ui/';
import { Skeleton } from '@newcondo/ui/';
import { Alert, AlertDescription } from '@newcondo/ui/';
import { AlertCircle, MapPin, Grid, List } from 'lucide-react';
import { Property, PropertySearchFilters } from '@/types/property';

interface PropertyGridProps {
  searchQuery?: string;
  filters?: PropertySearchFilters;
  showFilters?: boolean;
  gridView?: boolean;
  onPropertyClick?: (property: Property) => void;
  className?: string;
}

export function PropertyGrid({
  searchQuery = '',
  filters,
  showFilters = true,
  gridView = true,
  onPropertyClick,
  className = ''
}: PropertyGridProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(gridView ? 'grid' : 'list');
  const [localFilters, setLocalFilters] = useState<PropertySearchFilters>(filters || {});
  const [searchTerm, setSearchTerm] = useState(searchQuery);

  const { searchProperties, loading, error, hasMore } = useProperties();
  const { properties, totalCount, duplicateProperties } = usePropertyStore();

  // Search properties with filters
  const handleSearch = useCallback(async (page: number = 1) => {
    const searchParams = {
      query: searchTerm,
      page,
      limit: 12,
      ...localFilters
    };

    await searchProperties(searchParams);
  }, [searchTerm, localFilters, searchProperties]);

  // Initial load
  useEffect(() => {
    handleSearch(1);
  }, []);

  // Handle search input change
  const handleSearchChange = (query: string) => {
    setSearchTerm(query);
    setCurrentPage(1);
  };

  // Handle filter change
  const handleFilterChange = (newFilters: PropertySearchFilters) => {
    setLocalFilters(newFilters);
    setCurrentPage(1);
  };

  // Handle search submit
  const handleSearchSubmit = () => {
    handleSearch(1);
  };

  // Load more properties
  const loadMoreProperties = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    handleSearch(nextPage);
  };

  // Toggle view mode
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
  };

  // Check if property is a duplicate
  const isDuplicate = (propertyId: string) => {
    return duplicateProperties.some(dup => 
      dup.originalPropertyId === propertyId || 
      dup.duplicatePropertyId === propertyId
    );
  };

  // Render loading skeleton
  const renderLoadingSkeleton = () => (
    <div className={`grid gap-6 ${
      viewMode === 'grid' 
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
            setLocalFilters({});
            handleSearch(1);
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
              onSearch={handleSearchChange}
              onSubmit={handleSearchSubmit}
              placeholder="Search properties by location, type, or features..."
              initialValue={searchTerm}
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
          <PropertyFilters
            filters={localFilters}
            onFilterChange={handleFilterChange}
            onApplyFilters={handleSearchSubmit}
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
              Search results for "{searchTerm}"
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
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
            : 'grid-cols-1'
        }`}>
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              viewMode={viewMode}
              onClick={() => onPropertyClick?.(property)}
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