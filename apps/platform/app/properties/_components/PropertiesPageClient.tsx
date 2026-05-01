'use client';

// apps/platform/app/properties/_components/PropertiesPageClient.tsx

import { useState, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { PropertySearch, type SearchFilters } from '@/components/properties/PropertySearch';
import { PropertyFilters, type PropertyFiltersState } from '@/components/properties/PropertyFilters';
import PropertyGrid from '@/components/properties/PropertyGrid';
import { PropertyGridSkeleton } from '@/components/properties/PropertyGridSkeleton';
import { Suspense } from 'react';
import type { PropertyType } from '@/types/api';

interface RawSearchParams {
  search?: string;
  city?: string;
  state?: string;
  propertyType?: string;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
  bathrooms?: string;
  features?: string;
  sortBy?: string;
  page?: string;
}

interface PropertiesPageClientProps {
  initialSearchParams: RawSearchParams;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Convert URL searchParams → SearchFilters (used by PropertySearch) */
function searchParamsToSearchFilters(params: RawSearchParams): SearchFilters {
  return {
    query: params.search,
    location:
      params.city || params.state
        ? { city: params.city, state: params.state }
        : undefined,
    priceRange:
      params.minPrice || params.maxPrice
        ? {
            min: params.minPrice ? Number(params.minPrice) : undefined,
            max: params.maxPrice ? Number(params.maxPrice) : undefined,
          }
        : undefined,
    propertyType: params.propertyType ? [params.propertyType] : undefined,
    bedrooms: params.bedrooms
      ? { min: Number(params.bedrooms) }
      : undefined,
    bathrooms: params.bathrooms
      ? { min: Number(params.bathrooms) }
      : undefined,
    features: params.features ? params.features.split(',') : undefined,
    sortBy: (params.sortBy as SearchFilters['sortBy']) ?? 'NEWEST',
  };
}

/** Convert URL searchParams → PropertyFiltersState (used by PropertyFilters sidebar) */
function searchParamsToFiltersState(params: RawSearchParams): PropertyFiltersState {
  return {
    priceRange: [
      params.minPrice ? Number(params.minPrice) : 0,
      params.maxPrice ? Number(params.maxPrice) : 10_000_000,
    ],
    location: {
      city: params.city,
      state: params.state,
    },
    propertyType: params.propertyType ? [params.propertyType] : [],
    bedrooms: params.bedrooms ? [params.bedrooms] : [],
    bathrooms: params.bathrooms ? [params.bathrooms] : [],
    features: params.features ? params.features.split(',') : [],
    availability: 'all',
    structure: [],
    sortBy: params.sortBy ?? 'newest',
  };
}

/** Convert PropertyFiltersState → PropertyGrid filter shape */
function filtersStateToGridFilters(state: PropertyFiltersState): {
  priceRange?: [number, number];
  city?: string;
  state?: string;
  propertyType?: PropertyType;
  bedrooms?: number;
  bathrooms?: number;
  features?: string[];
} {
  return {
    priceRange:
      state.priceRange[0] > 0 || state.priceRange[1] < 10_000_000
        ? state.priceRange
        : undefined,
    city: state.location.city,
    state: state.location.state,
    propertyType: state.propertyType[0] as PropertyType | undefined,
    bedrooms: state.bedrooms[0] ? Number(state.bedrooms[0]) : undefined,
    bathrooms: state.bathrooms[0] ? Number(state.bathrooms[0]) : undefined,
    features: state.features.length > 0 ? state.features : undefined,
  };
}

/** Sync state back to URL without a full navigation */
function buildQueryString(
  searchFilters: SearchFilters,
  filtersState: PropertyFiltersState
): string {
  const params = new URLSearchParams();

  if (searchFilters.query) params.set('search', searchFilters.query);
  if (searchFilters.location?.city) params.set('city', searchFilters.location.city);
  if (searchFilters.location?.state) params.set('state', searchFilters.location.state);
  if (filtersState.propertyType[0]) params.set('propertyType', filtersState.propertyType[0]);
  if (filtersState.priceRange[0] > 0) params.set('minPrice', String(filtersState.priceRange[0]));
  if (filtersState.priceRange[1] < 10_000_000) params.set('maxPrice', String(filtersState.priceRange[1]));
  if (filtersState.bedrooms[0]) params.set('bedrooms', filtersState.bedrooms[0]);
  if (filtersState.bathrooms[0]) params.set('bathrooms', filtersState.bathrooms[0]);
  if (filtersState.features.length > 0) params.set('features', filtersState.features.join(','));
  if (filtersState.sortBy && filtersState.sortBy !== 'newest') params.set('sortBy', filtersState.sortBy);

  return params.toString();
}

const DEFAULT_FILTERS_STATE: PropertyFiltersState = {
  priceRange: [0, 10_000_000],
  location: {},
  propertyType: [],
  bedrooms: [],
  bathrooms: [],
  features: [],
  availability: 'all',
  structure: [],
  sortBy: 'newest',
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function PropertiesPageClient({
  initialSearchParams,
}: PropertiesPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [searchFilters, setSearchFilters] = useState<SearchFilters>(
    () => searchParamsToSearchFilters(initialSearchParams)
  );
  const [filtersState, setFiltersState] = useState<PropertyFiltersState>(
    () => searchParamsToFiltersState(initialSearchParams)
  );

  // Keep URL in sync (shallow replace, no page reload)
  const syncUrl = useCallback(
    (sf: SearchFilters, fs: PropertyFiltersState) => {
      const qs = buildQueryString(sf, fs);
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
    },
    [router, pathname]
  );

  // ── PropertySearch handlers ──────────────────────────────────────────────

  const handleSearchFiltersChange = useCallback(
    (updated: SearchFilters) => {
      setSearchFilters(updated);
      // Mirror location changes into the sidebar filters state
      setFiltersState((prev) => ({
        ...prev,
        location: {
          city: updated.location?.city,
          state: updated.location?.state,
        },
      }));
      syncUrl(updated, filtersState);
    },
    [filtersState, syncUrl]
  );

  const handleSearch = useCallback(
    (filters: SearchFilters) => {
      setSearchFilters(filters);
      syncUrl(filters, filtersState);
    },
    [filtersState, syncUrl]
  );

  // ── PropertyFilters (sidebar) handlers ──────────────────────────────────

  const handleFiltersChange = useCallback(
    (updated: PropertyFiltersState) => {
      setFiltersState(updated);
      // Mirror location back into search filters
      setSearchFilters((prev) => ({
        ...prev,
        location:
          updated.location.city || updated.location.state
            ? { city: updated.location.city, state: updated.location.state }
            : undefined,
      }));
      syncUrl(searchFilters, updated);
    },
    [searchFilters, syncUrl]
  );

  const handleClearFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS_STATE);
    setSearchFilters({});
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  // ── Grid filters (derived, memoised) ────────────────────────────────────

  const gridFilters = useMemo(
    () => filtersStateToGridFilters(filtersState),
    [filtersState]
  );

  const searchQuery = searchFilters.query ?? '';

  return (
    <>
      {/* Search bar */}
      <PropertySearch
        filters={searchFilters}
        onFiltersChange={handleSearchFiltersChange}
        onSearch={handleSearch}
      />

      <div className="flex flex-col lg:flex-row gap-8 mt-8">
        {/* Sidebar filters */}
        <aside className="lg:w-80 flex-shrink-0">
          <div className="sticky top-6">
            <PropertyFilters
              filters={filtersState}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
            />
          </div>
        </aside>

        {/* Properties grid */}
        <main className="flex-1">
          <Suspense fallback={<PropertyGridSkeleton />}>
            <PropertyGrid
              searchQuery={searchQuery}
              filters={gridFilters}
              showComparison
            />
          </Suspense>
        </main>
      </div>
    </>
  );
}