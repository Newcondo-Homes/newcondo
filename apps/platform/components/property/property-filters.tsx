// apps/platform/src/components/property/property-filters.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@newcondo/ui/";
import { Button } from "@newcondo/ui/";
import { Input } from "@newcondo/ui/";
import { Label } from "@newcondo/ui/";
import { Checkbox } from "@newcondo/ui/";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@newcondo/ui/";
import { Slider } from "@newcondo/ui/";
import { Calendar } from "@newcondo/ui/";
import { Popover, PopoverContent, PopoverTrigger } from "@newcondo/ui/";
import { CalendarIcon, Home, Wifi, Car, Zap, Shield, Wind } from "lucide-react";
import { format } from "date-fns";

interface PropertyFilterValues {
  priceRange: { min?: number; max?: number };
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  features: string[];
  availableFrom: string;
}

interface PropertyFiltersProps {
  filters: PropertyFilterValues;
  onFiltersChange: (filters: PropertyFilterValues) => void;
}

const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "duplex", label: "Duplex" },
  { value: "room", label: "Room" },
  { value: "shared_apartment", label: "Shared Apartment" },
  { value: "office", label: "Office" },
  { value: "shop", label: "Shop" },
  { value: "warehouse", label: "Warehouse" },
];

const BEDROOM_OPTIONS = [
  { value: "1", label: "1 Bedroom" },
  { value: "2", label: "2 Bedrooms" },
  { value: "3", label: "3 Bedrooms" },
  { value: "4", label: "4 Bedrooms" },
  { value: "5+", label: "5+ Bedrooms" },
];

const BATHROOM_OPTIONS = [
  { value: "1", label: "1 Bathroom" },
  { value: "2", label: "2 Bathrooms" },
  { value: "3", label: "3 Bathrooms" },
  { value: "4+", label: "4+ Bathrooms" },
];

const PROPERTY_FEATURES = [
  { value: "parking", label: "Parking", icon: Car },
  { value: "generator", label: "Generator", icon: Zap },
  { value: "security", label: "Security", icon: Shield },
  { value: "wifi", label: "Wi-Fi", icon: Wifi },
  { value: "air_conditioning", label: "Air Conditioning", icon: Wind },
  { value: "furnished", label: "Furnished", icon: Home },
  { value: "balcony", label: "Balcony", icon: Home },
  { value: "gym", label: "Gym", icon: Home },
  { value: "pool", label: "Pool", icon: Home },
  { value: "elevator", label: "Elevator", icon: Home },
];

export function PropertyFilters({ filters, onFiltersChange }: PropertyFiltersProps) {
  const [priceRange, setPriceRange] = useState([
    filters.priceRange.min || 0,
    filters.priceRange.max || 5000000
  ]);
  const [availableFromDate, setAvailableFromDate] = useState<Date | undefined>(
    filters.availableFrom ? new Date(filters.availableFrom) : undefined
  );

  const updateFilters = (updates: Partial<PropertyFilterValues>) => {
    const newFilters = { ...filters, ...updates };
    onFiltersChange(newFilters);
  };

  const handlePriceRangeChange = (values: number[]) => {
    setPriceRange(values);
    updateFilters({
      priceRange: {
        min: values[0] === 0 ? undefined : values[0],
        max: values[1] === 5000000 ? undefined : values[1],
      },
    });
  };

  const handleFeatureToggle = (feature: string) => {
    const newFeatures = filters.features.includes(feature)
      ? filters.features.filter(f => f !== feature)
      : [...filters.features, feature];

    updateFilters({ features: newFeatures });
  };

  const handleAvailableFromChange = (date: Date | undefined) => {
    setAvailableFromDate(date);
    updateFilters({
      availableFrom: date ? format(date, "yyyy-MM-dd") : "",
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Price Range */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Price Range</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Monthly Rent</Label>
            <Slider
              value={priceRange}
              onValueChange={handlePriceRangeChange}
              max={5000000}
              min={0}
              step={50000}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>₦{priceRange[0].toLocaleString()}</span>
              <span>₦{priceRange[1].toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="min-price">Min Price</Label>
              <Input
                id="min-price"
                type="number"
                placeholder="0"
                value={priceRange[0] || ""}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  handlePriceRangeChange([value, priceRange[1]]);
                }}
              />
            </div>
            <div>
              <Label htmlFor="max-price">Max Price</Label>
              <Input
                id="max-price"
                type="number"
                placeholder="5,000,000"
                value={priceRange[1] || ""}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  handlePriceRangeChange([priceRange[0], value]);
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Property Type & Specifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Property Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Property Type</Label>
            <Select
              value={filters.propertyType}
              onValueChange={(value) => updateFilters({ propertyType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select property type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                {PROPERTY_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Bedrooms</Label>
            <Select
              value={filters.bedrooms}
              onValueChange={(value) => updateFilters({ bedrooms: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any</SelectItem>
                {BEDROOM_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Bathrooms</Label>
            <Select
              value={filters.bathrooms}
              onValueChange={(value) => updateFilters({ bathrooms: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any</SelectItem>
                {BATHROOM_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Features & Amenities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Features & Amenities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3">
            {PROPERTY_FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={feature.value}
                    checked={filters.features.includes(feature.value)}
                    onCheckedChange={() => handleFeatureToggle(feature.value)}
                  />
                  <Label
                    htmlFor={feature.value}
                    className="flex items-center gap-2 text-sm font-normal cursor-pointer"
                  >
                    <Icon className="w-4 h-4" />
                    {feature.label}
                  </Label>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Available From */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Availability</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label>Available From</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {availableFromDate ? (
                    format(availableFromDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={availableFromDate}
                  onSelect={handleAvailableFromChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}