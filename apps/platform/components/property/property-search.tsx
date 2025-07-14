// apps/platform/src/components/property/property-search.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, MapPin, Filter, SortAsc } from "lucide-react";
import { Input } from "@newcondo/ui/input";
import { Button } from "@newcondo/ui/button";
import { Card, CardContent } from "@newcondo/ui/card";
import { Badge } from "@newcondo/ui/badge";
import { Separator } from "@newcondo/ui/separator";
import { PropertyFilters } from "./property-filters";
import { useDebounce } from "@/hooks/use-debounce";
import { useProperties } from "@/hooks/use-properties";

interface PropertySearchProps {
  onFiltersChange?: (filters: any) => void;
  showMapView?: boolean;
}

export function PropertySearch({ onFiltersChange, showMapView = false }: PropertySearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "newest");
  
  const debouncedSearch = useDebounce(searchQuery, 300);
  const debouncedLocation = useDebounce(location, 300);
  
  const { searchProperties, isLoading } = useProperties();

  const [filters, setFilters] = useState({
    priceRange: {
      min: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
      max: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
    },
    propertyType: searchParams.get("type") || "",
    bedrooms: searchParams.get("bedrooms") || "",
    bathrooms: searchParams.get("bathrooms") || "",
    features: searchParams.get("features")?.split(",") || [],
    availableFrom: searchParams.get("availableFrom") || "",
  });

  useEffect(() => {
    const searchFilters = {
      query: debouncedSearch,
      location: debouncedLocation,
      sort: sortBy,
      ...filters,
    };

    // Update URL params
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (debouncedLocation) params.set("location", debouncedLocation);
    if (sortBy !== "newest") params.set("sort", sortBy);
    if (filters.priceRange.min) params.set("minPrice", filters.priceRange.min.toString());
    if (filters.priceRange.max) params.set("maxPrice", filters.priceRange.max.toString());
    if (filters.propertyType) params.set("type", filters.propertyType);
    if (filters.bedrooms) params.set("bedrooms", filters.bedrooms);
    if (filters.bathrooms) params.set("bathrooms", filters.bathrooms);
    if (filters.features.length > 0) params.set("features", filters.features.join(","));
    if (filters.availableFrom) params.set("availableFrom", filters.availableFrom);

    router.push(`?${params.toString()}`, { scroll: false });
    
    // Trigger search
    onFiltersChange?.(searchFilters);
  }, [debouncedSearch, debouncedLocation, sortBy, filters, onFiltersChange, router]);

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setLocation("");
    setSortBy("newest");
    setFilters({
      priceRange: { min: undefined, max: undefined },
      propertyType: "",
      bedrooms: "",
      bathrooms: "",
      features: [],
      availableFrom: "",
    });
  };

  const activeFiltersCount = Object.values(filters).filter(value => {
    if (typeof value === "object" && value !== null) {
      return Object.values(value).some(v => v !== undefined && v !== "");
    }
    return value !== "" && value !== undefined && (Array.isArray(value) ? value.length > 0 : true);
  }).length;

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Location Input */}
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Location (city, neighborhood)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="popular">Most Popular</option>
            </select>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Filters</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                disabled={activeFiltersCount === 0}
              >
                Clear All
              </Button>
            </div>
            <PropertyFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
            />
          </CardContent>
        </Card>
      )}

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          
          {filters.priceRange.min && (
            <Badge variant="secondary">
              Min: ₦{filters.priceRange.min.toLocaleString()}
            </Badge>
          )}
          
          {filters.priceRange.max && (
            <Badge variant="secondary">
              Max: ₦{filters.priceRange.max.toLocaleString()}
            </Badge>
          )}
          
          {filters.propertyType && (
            <Badge variant="secondary">
              Type: {filters.propertyType}
            </Badge>
          )}
          
          {filters.bedrooms && (
            <Badge variant="secondary">
              {filters.bedrooms} Bedrooms
            </Badge>
          )}
          
          {filters.bathrooms && (
            <Badge variant="secondary">
              {filters.bathrooms} Bathrooms
            </Badge>
          )}
          
          {filters.features.map((feature) => (
            <Badge key={feature} variant="secondary">
              {feature}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}