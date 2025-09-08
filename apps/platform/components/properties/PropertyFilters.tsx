'use client';

import { useState, useEffect } from 'react';
import { Button } from '@newcondo/ui/components/ui/button';
import { Input } from '@newcondo/ui/components/ui/input';
import { Label } from '@newcondo/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@newcondo/ui/components/ui/select';
import { Checkbox } from '@newcondo/ui/components/ui/checkbox';
import { Badge } from '@newcondo/ui/components/ui/badge';
import { Slider } from '@newcondo/ui/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@newcondo/ui/components/ui/collapsible';
import { ChevronDown, ChevronUp, Filter, X, MapPin } from 'lucide-react';

export interface PropertyFiltersState {
  priceRange: [number, number];
  location: {
    city?: string;
    state?: string;
    area?: string;
  };
  propertyType: string[];
  bedrooms: string[];
  bathrooms: string[];
  features: string[];
  availability: string;
  structure: string[];
  sortBy: string;
}

interface PropertyFiltersProps {
  filters: PropertyFiltersState;
  onFiltersChange: (filters: PropertyFiltersState) => void;
  onClearFilters: () => void;
  isLoading?: boolean;
  className?: string;
}

const PROPERTY_TYPES = [
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'HOUSE', label: 'House' },
  { value: 'DUPLEX', label: 'Duplex' },
  { value: 'ROOM', label: 'Room' },
  { value: 'SHARED_APARTMENT', label: 'Shared Apartment' },
  { value: 'OFFICE', label: 'Office' },
  { value: 'SHOP', label: 'Shop' },
  { value: 'WAREHOUSE', label: 'Warehouse' },
];

const BEDROOM_OPTIONS = [
  { value: '1', label: '1 Bedroom' },
  { value: '2', label: '2 Bedrooms' },
  { value: '3', label: '3 Bedrooms' },
  { value: '4', label: '4 Bedrooms' },
  { value: '5+', label: '5+ Bedrooms' },
];

const BATHROOM_OPTIONS = [
  { value: '1', label: '1 Bathroom' },
  { value: '2', label: '2 Bathrooms' },
  { value: '3', label: '3 Bathrooms' },
  { value: '4', label: '4 Bathrooms' },
  { value: '5+', label: '5+ Bathrooms' },
];

const FEATURES = [
  'Parking',
  'Generator',
  'Security',
  'Elevator',
  'Swimming Pool',
  'Gym',
  'Garden',
  'Balcony',
  'Air Conditioning',
  'Furnished',
  'Pet Friendly',
  'Internet',
];

const STRUCTURE_TYPES = [
  { value: 'SINGLE_UNIT', label: 'Single Unit' },
  { value: 'MULTI_FAMILY', label: 'Multi-Family Building' },
];

const NIGERIAN_STATES = [
  'Lagos', 'Abuja', 'Rivers', 'Kaduna', 'Kano', 'Ogun', 'Cross River',
  'Delta', 'Edo', 'Enugu', 'Imo', 'Kwara', 'Oyo', 'Plateau', 'Anambra'
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
];

export function PropertyFilters({ 
  filters, 
  onFiltersChange, 
  onClearFilters, 
  isLoading = false,
  className = '' 
}: PropertyFiltersProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  // Calculate active filter count
  useEffect(() => {
    let count = 0;
    
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000000) count++;
    if (filters.location.city || filters.location.state || filters.location.area) count++;
    if (filters.propertyType.length > 0) count++;
    if (filters.bedrooms.length > 0) count++;
    if (filters.bathrooms.length > 0) count++;
    if (filters.features.length > 0) count++;
    if (filters.availability !== 'all') count++;
    if (filters.structure.length > 0) count++;
    
    setActiveFilterCount(count);
  }, [filters]);

  const updateFilters = (updates: Partial<PropertyFiltersState>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const toggleArrayFilter = (key: keyof PropertyFiltersState, value: string) => {
    const currentArray = filters[key] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    updateFilters({ [key]: newArray });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-sm"
                disabled={isLoading}
              >
                Clear All
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="lg:hidden"
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <Collapsible open={!isCollapsed} onOpenChange={setIsCollapsed}>
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Price Range */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Price Range</Label>
              <div className="px-3">
                <Slider
                  value={filters.priceRange}
                  onValueChange={(value) => updateFilters({ priceRange: value as [number, number] })}
                  max={10000000}
                  min={0}
                  step={50000}
                  className="w-full"
                  disabled={isLoading}
                />
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{formatPrice(filters.priceRange[0])}</span>
                <span>{formatPrice(filters.priceRange[1])}</span>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                Location
              </Label>
              <div className="grid grid-cols-1 gap-3">
                <Select
                  value={filters.location.state || ''}
                  onValueChange={(value) => 
                    updateFilters({ 
                      location: { 
                        ...filters.location, 
                        state: value || undefined,
                        city: undefined // Reset city when state changes
                      } 
                    })
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All States</SelectItem>
                    {NIGERIAN_STATES.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Input
                  placeholder="Enter city or area"
                  value={filters.location.city || ''}
                  onChange={(e) => 
                    updateFilters({ 
                      location: { ...filters.location, city: e.target.value || undefined } 
                    })
                  }
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Property Type */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Property Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {PROPERTY_TYPES.map(type => (
                  <div key={type.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type.value}`}
                      checked={filters.propertyType.includes(type.value)}
                      onCheckedChange={() => toggleArrayFilter('propertyType', type.value)}
                      disabled={isLoading}
                    />
                    <Label 
                      htmlFor={`type-${type.value}`} 
                      className="text-sm cursor-pointer"
                    >
                      {type.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Structure Type */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Property Structure</Label>
              <div className="grid grid-cols-1 gap-2">
                {STRUCTURE_TYPES.map(structure => (
                  <div key={structure.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`structure-${structure.value}`}
                      checked={filters.structure.includes(structure.value)}
                      onCheckedChange={() => toggleArrayFilter('structure', structure.value)}
                      disabled={isLoading}
                    />
                    <Label 
                      htmlFor={`structure-${structure.value}`} 
                      className="text-sm cursor-pointer"
                    >
                      {structure.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Bedrooms */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Bedrooms</Label>
              <div className="flex flex-wrap gap-2">
                {BEDROOM_OPTIONS.map(option => (
                  <Badge
                    key={option.value}
                    variant={filters.bedrooms.includes(option.value) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleArrayFilter('bedrooms', option.value)}
                  >
                    {option.label}
                    {filters.bedrooms.includes(option.value) && (
                      <X className="w-3 h-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Bathrooms */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Bathrooms</Label>
              <div className="flex flex-wrap gap-2">
                {BATHROOM_OPTIONS.map(option => (
                  <Badge
                    key={option.value}
                    variant={filters.bathrooms.includes(option.value) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleArrayFilter('bathrooms', option.value)}
                  >
                    {option.label}
                    {filters.bathrooms.includes(option.value) && (
                      <X className="w-3 h-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Features */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Features & Amenities</Label>
              <div className="grid grid-cols-2 gap-2">
                {FEATURES.map(feature => (
                  <div key={feature} className="flex items-center space-x-2">
                    <Checkbox
                      id={`feature-${feature}`}
                      checked={filters.features.includes(feature)}
                      onCheckedChange={() => toggleArrayFilter('features', feature)}
                      disabled={isLoading}
                    />
                    <Label 
                      htmlFor={`feature-${feature}`} 
                      className="text-sm cursor-pointer"
                    >
                      {feature}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Availability</Label>
              <Select
                value={filters.availability}
                onValueChange={(value) => updateFilters({ availability: value })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Properties</SelectItem>
                  <SelectItem value="available">Available Only</SelectItem>
                  <SelectItem value="coming_soon">Coming Soon</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Sort By</Label>
              <Select
                value={filters.sortBy}
                onValueChange={(value) => updateFilters({ sortBy: value })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}