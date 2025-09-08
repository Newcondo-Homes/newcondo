'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Search, MapPin, Filter, X, Loader2, Bed, Bath, DollarSign, Home, Maximize, CheckSquare } from 'lucide-react';
import { Button } from '@newcondo/ui/components/ui/button';
import { Input } from '@newcondo/ui/components/ui/input';
import { Badge } from '@newcondo/ui/components/ui/badge';
import { Card, CardContent } from '@newcondo/ui/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger, PopoverClose } from '@newcondo/ui/components/ui/popover';
import { Label } from '@newcondo/ui/components/ui/label';
import { Slider } from '@newcondo/ui/components/ui/slider';
import { Checkbox } from '@newcondo/ui/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@newcondo/ui/components/ui/radio-group';
import { Separator } from '@newcondo/ui/components/ui/separator';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@newcondo/ui/lib/utils';
import { formatNumber } from '@/lib/utils';

export interface SearchFilters {
  query?: string;
  location?: {
    city?: string;
    state?: string;
    coordinates?: {
      lat: number;
      lng: number;
      radius?: number; // in km
    };
  };
  priceRange?: {
    min?: number;
    max?: number;
  };
  propertyType?: string[];
  bedrooms?: {
    min?: number;
    max?: number;
  };
  bathrooms?: {
    min?: number;
    max?: number;
  };
  features?: string[];
  structure?: 'SINGLE_UNIT' | 'MULTI_FAMILY' | 'ALL';
  availability?: 'AVAILABLE' | 'ALL';
  sortBy?: 'PRICE_ASC' | 'PRICE_DESC' | 'NEWEST' | 'POPULAR' | 'RELEVANCE';
}

export interface LocationSuggestion {
  id: string;
  displayName: string;
  city: string;
  state: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  type: 'CITY' | 'AREA' | 'LANDMARK';
}

interface PropertySearchProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch: (filters: SearchFilters) => void;
  loading?: boolean;
  resultCount?: number;
  popularSearches?: string[];
  locationSuggestions?: LocationSuggestion[];
  onLocationSearch?: (query: string) => Promise<LocationSuggestion[]>;
  placeholder?: string;
  className?: string;
  showAdvancedFilters?: boolean;
}

const PROPERTY_TYPES = ['Apartment', 'Duplex', 'Penthouse', 'Mansion', 'Bungalow', 'Terrace'];
const PROPERTY_FEATURES = ['Swimming Pool', 'Gym', 'Parking', 'Security', 'Generator', 'Balcony', 'Garden', 'Fitted Kitchen'];

export const PropertySearch: React.FC<PropertySearchProps> = ({
  filters,
  onFiltersChange,
  onSearch,
  loading = false,
  resultCount,
  popularSearches = [],
  locationSuggestions = [],
  onLocationSearch,
  placeholder = "Search by location, property type, or features...",
  className = "",
  showAdvancedFilters = true,
}) => {
  const [searchQuery, setSearchQuery] = useState(filters.query || '');
  const [locationQuery, setLocationQuery] = useState('');
  const [locationSuggestionsList, setLocationSuggestionsList] = useState<LocationSuggestion[]>(locationSuggestions);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);

  // Debounced search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const debouncedLocationQuery = useDebounce(locationQuery, 300);

  // Handle search query changes
  useEffect(() => {
    if (debouncedSearchQuery !== filters.query) {
      const updatedFilters = { ...filters, query: debouncedSearchQuery || undefined };
      onFiltersChange(updatedFilters);
    }
  }, [debouncedSearchQuery, filters, onFiltersChange]);

  // Handle location search
  useEffect(() => {
    if (debouncedLocationQuery && debouncedLocationQuery.length >= 2 && onLocationSearch) {
      setIsLocationLoading(true);
      onLocationSearch(debouncedLocationQuery)
        .then((suggestions) => {
          setLocationSuggestionsList(suggestions);
          setShowLocationSuggestions(true);
        })
        .catch((error) => {
          console.error('Location search error:', error);
          setLocationSuggestionsList([]);
        })
        .finally(() => {
          setIsLocationLoading(false);
        });
    } else if (debouncedLocationQuery.length < 2) {
      setLocationSuggestionsList(locationSuggestions);
      setShowLocationSuggestions(false);
    }
  }, [debouncedLocationQuery, onLocationSearch, locationSuggestions]);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSearch(filters);
  }, [filters, onSearch]);

  const handleLocationSelect = useCallback((location: LocationSuggestion) => {
    const updatedFilters = {
      ...filters,
      location: {
        city: location.city,
        state: location.state,
        coordinates: location.coordinates,
      }
    };
    onFiltersChange(updatedFilters);
    setLocationQuery(location.displayName);
    setShowLocationSuggestions(false);
  }, [filters, onFiltersChange]);

  const handleClearLocation = useCallback(() => {
    const updatedFilters = { ...filters, location: undefined };
    onFiltersChange(updatedFilters);
    setLocationQuery('');
    setShowLocationSuggestions(false);
  }, [filters, onFiltersChange]);

  const handlePopularSearchClick = useCallback((searchTerm: string) => {
    setSearchQuery(searchTerm);
    const updatedFilters = { ...filters, query: searchTerm };
    onFiltersChange(updatedFilters);
    onSearch(updatedFilters);
  }, [filters, onFiltersChange, onSearch]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.location) count++;
    if (filters.priceRange?.min || filters.priceRange?.max) count++;
    if (filters.propertyType && filters.propertyType.length > 0) count++;
    if (filters.bedrooms?.min || filters.bedrooms?.max) count++;
    if (filters.bathrooms?.min || filters.bathrooms?.max) count++;
    if (filters.features && filters.features.length > 0) count++;
    if (filters.structure && filters.structure !== 'ALL') count++;
    if (filters.availability && filters.availability !== 'ALL') count++;
    return count;
  }, [filters]);

  const getLocationDisplayText = useMemo(() => {
    if (filters.location?.city && filters.location?.state) {
      return `${filters.location.city}, ${filters.location.state}`;
    }
    return '';
  }, [filters.location]);

  useEffect(() => {
    if (getLocationDisplayText && !locationQuery) {
      setLocationQuery(getLocationDisplayText);
    }
  }, [getLocationDisplayText, locationQuery]);

  const clearFilter = (filterKey: keyof SearchFilters) => {
    const updatedFilters = { ...filters, [filterKey]: undefined };
    onFiltersChange(updatedFilters);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Search Bar */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder={placeholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4"
                  />
                </div>
              </div>

              {/* Location Search */}
              <div className="lg:w-80 relative">
                <Popover open={showLocationSuggestions} onOpenChange={setShowLocationSuggestions}>
                  <PopoverTrigger asChild>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        type="text"
                        placeholder="Enter location..."
                        value={locationQuery}
                        onChange={(e) => setLocationQuery(e.target.value)}
                        onFocus={() => setShowLocationSuggestions(true)}
                        className="pl-10 pr-10"
                      />
                      {isLocationLoading && (
                        <Loader2 className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 animate-spin" />
                      )}
                      {filters.location && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleClearLocation}
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="start">
                    {locationSuggestionsList.length > 0 ? (
                      <div className="max-h-60 overflow-y-auto">
                        {locationSuggestionsList.map((suggestion) => (
                          <button
                            key={suggestion.id}
                            onClick={() => handleLocationSelect(suggestion)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0 flex items-center space-x-3"
                          >
                            <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="font-medium text-sm">{suggestion.displayName}</div>
                              <div className="text-xs text-gray-500">
                                {suggestion.city}, {suggestion.state}
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {suggestion.type.toLowerCase()}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    ) : locationQuery.length >= 2 && !isLocationLoading ? (
                      <div className="p-4 text-center text-gray-500">
                        <p className="text-sm">No locations found</p>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        <p className="text-sm">Type to search locations</p>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>

              {/* Search Button */}
              <Button
                type="submit"
                disabled={loading}
                className="lg:w-auto w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </>
                )}
              </Button>

              {/* Advanced Filters Button */}
              {showAdvancedFilters && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="relative"
                    >
                      <Filter className="mr-2 h-4 w-4" />
                      Filters
                      {activeFiltersCount > 0 && (
                        <Badge
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                        >
                          {activeFiltersCount}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[350px] p-4" align="end">
                    <AdvancedFilters filters={filters} onFiltersChange={onFiltersChange} />
                    <div className="mt-4 flex justify-end">
                      <PopoverClose asChild>
                        <Button type="button" size="sm">
                          Apply Filters
                        </Button>
                      </PopoverClose>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </form>

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
              {filters.location && (
                <Badge variant="secondary" className="gap-1">
                  <MapPin className="h-3 w-3" />
                  {getLocationDisplayText}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearLocation}
                    className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              
              {(filters.priceRange?.min || filters.priceRange?.max) && (
                <Badge variant="secondary" className="gap-1">
                  Price: {filters.priceRange.min ? `₦${formatNumber(filters.priceRange.min)}` : '0'} - {filters.priceRange.max ? `₦${formatNumber(filters.priceRange.max)}` : 'Max'}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearFilter('priceRange')}
                    className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}

              {filters.propertyType && filters.propertyType.map((type) => (
                <Badge key={type} variant="secondary" className="gap-1">
                  {type}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFiltersChange({
                      ...filters,
                      propertyType: filters.propertyType?.filter(t => t !== type)
                    })}
                    className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}

              {(filters.bedrooms?.min || filters.bedrooms?.max) && (
                <Badge variant="secondary" className="gap-1">
                  Beds: {filters.bedrooms.min} - {filters.bedrooms.max || 'Max'}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearFilter('bedrooms')}
                    className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}

              {(filters.bathrooms?.min || filters.bathrooms?.max) && (
                <Badge variant="secondary" className="gap-1">
                  Baths: {filters.bathrooms.min} - {filters.bathrooms.max || 'Max'}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearFilter('bathrooms')}
                    className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}

              {filters.features && filters.features.map((feature) => (
                <Badge key={feature} variant="secondary" className="gap-1">
                  {feature}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFiltersChange({
                      ...filters,
                      features: filters.features?.filter(f => f !== feature)
                    })}
                    className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}

              {filters.structure && filters.structure !== 'ALL' && (
                <Badge variant="secondary" className="gap-1">
                  Structure: {filters.structure.replace('_', ' ').toLowerCase()}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearFilter('structure')}
                    className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}

              {filters.availability && filters.availability !== 'ALL' && (
                <Badge variant="secondary" className="gap-1">
                  Availability: {filters.availability.toLowerCase()}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearFilter('availability')}
                    className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Popular Searches */}
      {popularSearches.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-sm text-gray-600 font-medium whitespace-nowrap">Popular searches:</span>
          <div className="flex gap-2">
            {popularSearches.map((searchTerm) => (
              <Badge
                key={searchTerm}
                variant="outline"
                className="cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handlePopularSearchClick(searchTerm)}
              >
                {searchTerm}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {resultCount !== undefined && (
        <div className="flex justify-between items-center text-gray-600">
          <p className="text-sm">
            <span className="font-semibold text-gray-900">
              {resultCount}
            </span> results found
          </p>
        </div>
      )}
    </div>
  );
};


interface AdvancedFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({ filters, onFiltersChange }) => {
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handlePriceRangeChange = useCallback((value: [number, number]) => {
    setLocalFilters(prev => ({
      ...prev,
      priceRange: { min: value[0], max: value[1] }
    }));
  }, []);

  const handleBedroomsChange = useCallback((value: [number, number]) => {
    setLocalFilters(prev => ({
      ...prev,
      bedrooms: { min: value[0], max: value[1] }
    }));
  }, []);

  const handleBathroomsChange = useCallback((value: [number, number]) => {
    setLocalFilters(prev => ({
      ...prev,
      bathrooms: { min: value[0], max: value[1] }
    }));
  }, []);

  const handlePropertyTypeChange = useCallback((type: string, isChecked: boolean) => {
    setLocalFilters(prev => {
      const currentTypes = prev.propertyType || [];
      return {
        ...prev,
        propertyType: isChecked ? [...currentTypes, type] : currentTypes.filter(t => t !== type)
      };
    });
  }, []);

  const handleFeatureChange = useCallback((feature: string, isChecked: boolean) => {
    setLocalFilters(prev => {
      const currentFeatures = prev.features || [];
      return {
        ...prev,
        features: isChecked ? [...currentFeatures, feature] : currentFeatures.filter(f => f !== feature)
      };
    });
  }, []);

  const handleStructureChange = useCallback((structure: string) => {
    setLocalFilters(prev => ({
      ...prev,
      structure: structure as 'SINGLE_UNIT' | 'MULTI_FAMILY' | 'ALL'
    }));
  }, []);

  const handleAvailabilityChange = useCallback((availability: string) => {
    setLocalFilters(prev => ({
      ...prev,
      availability: availability as 'AVAILABLE' | 'ALL'
    }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setLocalFilters({});
    onFiltersChange({});
  }, [onFiltersChange]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-lg">Advanced Filters</h4>
        <Button variant="link" size="sm" onClick={handleResetFilters}>
          Reset
        </Button>
      </div>

      {/* Price Range */}
      <div>
        <Label className="flex items-center gap-2 mb-2">
          <DollarSign className="h-4 w-4 text-gray-500" />
          Price Range (₦)
        </Label>
        <div className="flex items-center gap-2">
          <Input 
            type="number" 
            placeholder="Min" 
            value={localFilters.priceRange?.min || ''} 
            onChange={(e) => setLocalFilters(prev => ({ ...prev, priceRange: { ...prev.priceRange, min: Number(e.target.value) || undefined }}))}
            className="w-1/2"
          />
          <span className="text-gray-500">-</span>
          <Input 
            type="number" 
            placeholder="Max" 
            value={localFilters.priceRange?.max || ''} 
            onChange={(e) => setLocalFilters(prev => ({ ...prev, priceRange: { ...prev.priceRange, max: Number(e.target.value) || undefined }}))}
            className="w-1/2"
          />
        </div>
      </div>

      <Separator />

      {/* Property Type */}
      <div>
        <Label className="flex items-center gap-2 mb-2">
          <Home className="h-4 w-4 text-gray-500" />
          Property Type
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {PROPERTY_TYPES.map(type => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox
                id={`type-${type}`}
                checked={localFilters.propertyType?.includes(type)}
                onCheckedChange={(checked) => handlePropertyTypeChange(type, checked as boolean)}
              />
              <Label htmlFor={`type-${type}`}>{type}</Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Bedrooms and Bathrooms */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="flex items-center gap-2 mb-2">
            <Bed className="h-4 w-4 text-gray-500" />
            Bedrooms
          </Label>
          <Input 
            type="number" 
            placeholder="Min" 
            value={localFilters.bedrooms?.min || ''} 
            onChange={(e) => setLocalFilters(prev => ({ ...prev, bedrooms: { ...prev.bedrooms, min: Number(e.target.value) || undefined }}))}
          />
        </div>
        <div>
          <Label className="flex items-center gap-2 mb-2">
            <Bath className="h-4 w-4 text-gray-500" />
            Bathrooms
          </Label>
          <Input 
            type="number" 
            placeholder="Min" 
            value={localFilters.bathrooms?.min || ''} 
            onChange={(e) => setLocalFilters(prev => ({ ...prev, bathrooms: { ...prev.bathrooms, min: Number(e.target.value) || undefined }}))}
          />
        </div>
      </div>

      <Separator />

      {/* Features */}
      <div>
        <Label className="flex items-center gap-2 mb-2">
          <CheckSquare className="h-4 w-4 text-gray-500" />
          Features
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {PROPERTY_FEATURES.map(feature => (
            <div key={feature} className="flex items-center space-x-2">
              <Checkbox
                id={`feature-${feature}`}
                checked={localFilters.features?.includes(feature)}
                onCheckedChange={(checked) => handleFeatureChange(feature, checked as boolean)}
              />
              <Label htmlFor={`feature-${feature}`}>{feature}</Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Structure */}
      <div>
        <Label className="flex items-center gap-2 mb-2">
          <Building2 className="h-4 w-4 text-gray-500" />
          Structure
        </Label>
        <RadioGroup
          defaultValue={localFilters.structure || 'ALL'}
          onValueChange={handleStructureChange}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="ALL" id="structure-all" />
            <Label htmlFor="structure-all">All</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="SINGLE_UNIT" id="structure-single" />
            <Label htmlFor="structure-single">Single Unit</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="MULTI_FAMILY" id="structure-multi" />
            <Label htmlFor="structure-multi">Multi-Family</Label>
          </div>
        </RadioGroup>
      </div>

      <Separator />

      {/* Availability */}
      <div>
        <Label className="flex items-center gap-2 mb-2">
          <Zap className="h-4 w-4 text-gray-500" />
          Availability
        </Label>
        <RadioGroup
          defaultValue={localFilters.availability || 'ALL'}
          onValueChange={handleAvailabilityChange}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="ALL" id="availability-all" />
            <Label htmlFor="availability-all">All</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="AVAILABLE" id="availability-available" />
            <Label htmlFor="availability-available">Available</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="mt-4 flex justify-end">
        <PopoverClose asChild>
          <Button type="button" size="sm" onClick={() => onFiltersChange(localFilters)}>
            Apply Filters
          </Button>
        </PopoverClose>
      </div>
    </div>
  );
};
