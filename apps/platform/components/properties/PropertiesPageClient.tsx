// apps/platform/components/properties/PropertiesPageClient.tsx
'use client';

import { useState, useCallback, useMemo, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutGrid, List, SlidersHorizontal } from 'lucide-react';
import { Button } from '@newcondo/ui/components/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@newcondo/ui/components/sheet';

import { PropertySearch } from '@/components/properties/PropertySearch';
import { PropertyFilters } from '@/components/properties/PropertyFilters';
import PropertyGrid from '@/components/properties/PropertyGrid';

import type { SearchFilters } from '@/components/properties/PropertySearch';
import type { PropertyFiltersState } from '@/components/properties/PropertyFilters';
import type { PropertyType } from '@/types/api';

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Map the two filter shapes (SearchFilters + PropertyFiltersState)
 * into PropertyGrid's simpler `filters` prop.
 * Sidebar values take precedence; search-bar values fill in the gaps.
 */
function toGridFilters(
  search: SearchFilters,
  sidebar: PropertyFiltersState,
): {
  priceRange?: [number, number];
  city?: string;
  state?: string;
  propertyType?: PropertyType;
  bedrooms?: number;
  bathrooms?: number;
  features?: string[];
} {
  const hasSidebarPrice =
    sidebar.priceRange[0] > 0 || sidebar.priceRange[1] < 10_000_000;
  const hasSearchPrice =
    search.priceRange?.min !== undefined || search.priceRange?.max !== undefined;

  return {
    priceRange: hasSidebarPrice
      ? sidebar.priceRange
      : hasSearchPrice
        ? [search.priceRange?.min ?? 0, search.priceRange?.max ?? 10_000_000]
        : undefined,

    city: sidebar.location.city ?? search.location?.city,
    state: sidebar.location.state ?? search.location?.state,

    propertyType: (sidebar.propertyType[0] ??
      search.propertyType?.[0]) as PropertyType | undefined,

    bedrooms: sidebar.bedrooms[0]
      ? parseInt(sidebar.bedrooms[0], 10)
      : undefined,
    bathrooms: sidebar.bathrooms[0]
      ? parseInt(sidebar.bathrooms[0], 10)
      : undefined,

    features:
      sidebar.features.length > 0
        ? sidebar.features
        : (search.features ?? undefined),
  };
}

/** Serialize both filter shapes into a shareable URL query string. */
function buildQueryString(
  search: SearchFilters,
  sidebar: PropertyFiltersState,
): string {
  const p = new URLSearchParams();
  if (search.query) p.set('q', search.query);
  // location — sidebar takes precedence over search-bar
  const city = sidebar.location.city ?? search.location?.city;
  const state = sidebar.location.state ?? search.location?.state;
  if (city) p.set('city', city);
  if (state) p.set('state', state);
  if (sidebar.priceRange[0] > 0) p.set('minPrice', String(sidebar.priceRange[0]));
  if (sidebar.priceRange[1] < 10_000_000) p.set('maxPrice', String(sidebar.priceRange[1]));
  if (sidebar.propertyType.length) p.set('type', sidebar.propertyType.join(','));
  if (sidebar.bedrooms.length) p.set('beds', sidebar.bedrooms.join(','));
  if (sidebar.bathrooms.length) p.set('baths', sidebar.bathrooms.join(','));
  if (sidebar.features.length) p.set('features', sidebar.features.join(','));
  const qs = p.toString();
  return qs ? `?${qs}` : '';
}

// ─── Default state factories ─────────────────────────────────────────────────

const DEFAULT_SEARCH_FILTERS: SearchFilters = {
  sortBy: 'NEWEST',
  availability: 'AVAILABLE',
};

const DEFAULT_SIDEBAR_FILTERS: PropertyFiltersState = {
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

// Count how many sidebar filter sections are active (for the badge)
function countActiveSidebarFilters(f: PropertyFiltersState): number {
  return [
    f.priceRange[0] > 0 || f.priceRange[1] < 10_000_000,
    !!f.location.city || !!f.location.state,
    f.propertyType.length > 0,
    f.bedrooms.length > 0,
    f.bathrooms.length > 0,
    f.features.length > 0,
    f.structure.length > 0,
    f.availability !== 'all',
  ].filter(Boolean).length;
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface PropertiesPageClientProps {
  userId: string;
  userRole: string;
  initialSearch?: string;
  initialCity?: string;
  initialState?: string;
  initialType?: string;
  initialMinPrice?: number;
  initialMaxPrice?: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PropertiesPageClient({
  userId: _userId,
  userRole: _userRole,
  initialSearch = '',
  initialCity = '',
  initialState = '',
  initialType = '',
  initialMinPrice,
  initialMaxPrice,
}: PropertiesPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  // ── View mode ────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // ── Mobile filters sheet ─────────────────────────────────────────────
  const [filtersOpen, setFiltersOpen] = useState(false);

  // ── Search bar filters ───────────────────────────────────────────────
  const [searchFilters, setSearchFilters] = useState<SearchFilters>(() => ({
    ...DEFAULT_SEARCH_FILTERS,
    query: initialSearch || undefined,
    location:
      initialCity || initialState
        ? {
            city: initialCity || undefined,
            state: initialState || undefined,
          }
        : undefined,
  }));

  // ── Sidebar filters ──────────────────────────────────────────────────
  const [sidebarFilters, setSidebarFilters] =
    useState<PropertyFiltersState>(() => ({
      ...DEFAULT_SIDEBAR_FILTERS,
      priceRange: [initialMinPrice ?? 0, initialMaxPrice ?? 10_000_000],
      propertyType: initialType ? [initialType] : [],
      location: {
        city: initialCity || undefined,
        state: initialState || undefined,
      },
    }));

  // ── Derived: PropertyGrid filters ────────────────────────────────────
  const gridFilters = useMemo(
    () => toGridFilters(searchFilters, sidebarFilters),
    [searchFilters, sidebarFilters],
  );

  const activeFilterCount = useMemo(
    () => countActiveSidebarFilters(sidebarFilters),
    [sidebarFilters],
  );

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleSearchFiltersChange = useCallback((updated: SearchFilters) => {
    setSearchFilters(updated);
  }, []);

  const handleSearch = useCallback(
    (filters: SearchFilters) => {
      setSearchFilters(filters);
      startTransition(() => {
        router.push(
          `${pathname}${buildQueryString(filters, sidebarFilters)}`,
          { scroll: false },
        );
      });
    },
    [pathname, router, sidebarFilters],
  );

  const handleSidebarChange = useCallback(
    (updated: PropertyFiltersState) => {
      setSidebarFilters(updated);
      startTransition(() => {
        router.push(
          `${pathname}${buildQueryString(searchFilters, updated)}`,
          { scroll: false },
        );
      });
    },
    [pathname, router, searchFilters],
  );

  const handleClearSidebar = useCallback(() => {
    setSidebarFilters(DEFAULT_SIDEBAR_FILTERS);
    startTransition(() => {
      router.push(
        `${pathname}${buildQueryString(searchFilters, DEFAULT_SIDEBAR_FILTERS)}`,
        { scroll: false },
      );
    });
  }, [pathname, router, searchFilters]);

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-full bg-background">
      {/* ── Sticky top bar: heading + search ── */}
      <div className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-4 md:px-6 pt-5 pb-4 space-y-3">
          {/* Heading row */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight leading-none">
                Browse Properties
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Verified listings across Nigeria
              </p>
            </div>

            {/* View-mode toggle — desktop */}
            <div className="hidden md:flex items-center gap-0.5 rounded-lg border bg-muted/40 p-1">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setViewMode('list')}
                aria-label="List view"
              >
                <List className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Search bar — full width */}
          <PropertySearch
            filters={searchFilters}
            onFiltersChange={handleSearchFiltersChange}
            onSearch={handleSearch}
            showAdvancedFilters
          />
        </div>
      </div>

      {/* ── Body: sidebar + grid ── */}
      <div className="flex flex-1">
        {/* Sidebar — desktop */}
        <aside className="hidden lg:flex flex-col w-[272px] shrink-0 border-r">
          <div
            className="sticky overflow-y-auto p-4 space-y-1"
            style={{ top: 'var(--header-height, 137px)', maxHeight: 'calc(100vh - 137px)' }}
          >
            <PropertyFilters
              filters={sidebarFilters}
              onFiltersChange={handleSidebarChange}
              onClearFilters={handleClearSidebar}
            />
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 px-4 md:px-6 py-5 space-y-4">
          {/* Mobile: filter trigger + view toggle */}
          <div className="flex items-center justify-between lg:hidden">
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-8">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>

              <SheetContent side="left" className="w-[300px] p-0 flex flex-col">
                <SheetHeader className="px-4 pt-5 pb-2 border-b">
                  <SheetTitle className="text-base">Filters</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto p-4">
                  <PropertyFilters
                    filters={sidebarFilters}
                    onFiltersChange={(updated) => {
                      handleSidebarChange(updated);
                      setFiltersOpen(false);
                    }}
                    onClearFilters={() => {
                      handleClearSidebar();
                      setFiltersOpen(false);
                    }}
                  />
                </div>
              </SheetContent>
            </Sheet>

            {/* Mobile view toggle */}
            <div className="flex items-center gap-0.5 rounded-lg border bg-muted/40 p-1">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setViewMode('list')}
                aria-label="List view"
              >
                <List className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Property grid — manages its own data fetching + infinite scroll */}
          <PropertyGrid
            searchQuery={searchFilters.query ?? ''}
            filters={gridFilters}
            showComparison={true}
            className={
              viewMode === 'list'
                ? 'flex flex-col gap-3'
                : undefined
            }
          />
        </main>
      </div>
    </div>
  );
}