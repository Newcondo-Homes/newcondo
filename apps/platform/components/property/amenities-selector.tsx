// apps/platform/components/property/amenities-selector.tsx
import React, { useState } from 'react';
import { Checkbox } from '@newcondo/ui';
import { Badge } from '@newcondo/ui';
import { Input } from '@newcondo/ui';
import { Button } from '@newcondo/ui';
import { Label } from '@newcondo/ui';
import { 
  Wifi, 
  Car, 
  Zap, 
  Shield, 
  Home, 
  Waves, 
  Dumbbell, 
  TreePine,
  Wind,
  Flame,
  Droplets,
  Sun,
  Camera,
  Lock,
  Phone,
  Tv,
  Refrigerator,
  Washing,
  AirVent,
  Plus,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AmenitiesSelectorProps {
  selectedAmenities: string[];
  onAmenitiesChange: (amenities: string[]) => void;
  className?: string;
}

// Define amenity categories with icons
const amenityCategories = {
  'Basic Utilities': [
    { id: 'electricity', label: 'Electricity', icon: Zap },
    { id: 'water', label: 'Water Supply', icon: Droplets },
    { id: 'internet', label: 'Internet/WiFi', icon: Wifi },
    { id: 'gas', label: 'Gas Connection', icon: Flame },
    { id: 'phone', label: 'Phone Line', icon: Phone },
  ],
  'Security & Safety': [
    { id: 'security', label: 'Security Guard', icon: Shield },
    { id: 'gated', label: 'Gated Community', icon: Lock },
    { id: 'cctv', label: 'CCTV Surveillance', icon: Camera },
    { id: 'intercom', label: 'Intercom System', icon: Phone },
  ],
  'Parking & Transport': [
    { id: 'parking', label: 'Parking Space', icon: Car },
    { id: 'covered_parking', label: 'Covered Parking', icon: Home },
    { id: 'garage', label: 'Private Garage', icon: Home },
  ],
  'Appliances': [
    { id: 'air_conditioning', label: 'Air Conditioning', icon: AirVent },
    { id: 'heating', label: 'Heating System', icon: Sun },
    { id: 'refrigerator', label: 'Refrigerator', icon: Refrigerator },
    { id: 'washing_machine', label: 'Washing Machine', icon: Washing },
    { id: 'television', label: 'Television', icon: Tv },
  ],
  'Recreational': [
    { id: 'swimming_pool', label: 'Swimming Pool', icon: Waves },
    { id: 'gym', label: 'Gym/Fitness Center', icon: Dumbbell },
    { id: 'playground', label: 'Playground', icon: TreePine },
    { id: 'garden', label: 'Garden/Green Space', icon: TreePine },
  ],
  'Power & Backup': [
    { id: 'generator', label: 'Generator', icon: Zap },
    { id: 'inverter', label: 'Inverter/UPS', icon: Zap },
    { id: 'solar', label: 'Solar Power', icon: Sun },
  ],
  'Comfort Features': [
    { id: 'furnished', label: 'Furnished', icon: Home },
    { id: 'elevator', label: 'Elevator', icon: Wind },
    { id: 'balcony', label: 'Balcony/Terrace', icon: Home },
    { id: 'storage', label: 'Storage Space', icon: Home },
  ]
};

export const AmenitiesSelector: React.FC<AmenitiesSelectorProps> = ({
  selectedAmenities,
  onAmenitiesChange,
  className
}) => {
  const [customAmenity, setCustomAmenity] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleAmenityToggle = (amenityId: string) => {
    const isSelected = selectedAmenities.includes(amenityId);
    if (isSelected) {
      onAmenitiesChange(selectedAmenities.filter(id => id !== amenityId));
    } else {
      onAmenitiesChange([...selectedAmenities, amenityId]);
    }
  };

  const handleCustomAmenityAdd = () => {
    if (customAmenity.trim() && !selectedAmenities.includes(customAmenity.trim())) {
      onAmenitiesChange([...selectedAmenities, customAmenity.trim()]);
      setCustomAmenity('');
      setShowCustomInput(false);
    }
  };

  const removeCustomAmenity = (amenityId: string) => {
    onAmenitiesChange(selectedAmenities.filter(id => id !== amenityId));
  };

  const isStandardAmenity = (amenityId: string) => {
    return Object.values(amenityCategories)
      .flat()
      .some(amenity => amenity.id === amenityId);
  };

  const getCustomAmenities = () => {
    return selectedAmenities.filter(amenityId => !isStandardAmenity(amenityId));
  };

  return (
    <div className={cn('space-y-6', className)}>
      <div>
        <Label className="text-base font-medium mb-4 block">
          Property Amenities & Features
        </Label>
        <p className="text-sm text-gray-600 mb-4">
          Select all amenities and features available in your property
        </p>
      </div>

      {/* Selected Amenities Overview */}
      {selectedAmenities.length > 0 && (
        <div className="mb-6">
          <Label className="text-sm font-medium mb-2 block">
            Selected Amenities ({selectedAmenities.length})
          </Label>
          <div className="flex flex-wrap gap-2">
            {selectedAmenities.map(amenityId => {
              const standardAmenity = Object.values(amenityCategories)
                .flat()
                .find(amenity => amenity.id === amenityId);
              
              return (
                <Badge
                  key={amenityId}
                  variant="secondary"
                  className="px-3 py-1 bg-blue-50 text-blue-700 border-blue-200"
                >
                  {standardAmenity?.label || amenityId}
                  <button
                    onClick={() => removeCustomAmenity(amenityId)}
                    className="ml-2 hover:text-red-600"
                  >
                    <X size={14} />
                  </button>
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Amenity Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(amenityCategories).map(([category, amenities]) => (
          <div key={category} className="space-y-3">
            <h4 className="font-medium text-gray-900">{category}</h4>
            <div className="space-y-2">
              {amenities.map(amenity => {
                const Icon = amenity.icon;
                const isSelected = selectedAmenities.includes(amenity.id);
                
                return (
                  <div
                    key={amenity.id}
                    className={cn(
                      'flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors',
                      isSelected
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    )}
                    onClick={() => handleAmenityToggle(amenity.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onChange={() => handleAmenityToggle(amenity.id)}
                      className="pointer-events-none"
                    />
                    <Icon size={16} className="text-gray-600" />
                    <span className="text-sm font-medium">{amenity.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Custom Amenities */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <Label className="text-sm font-medium">Custom Amenities</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowCustomInput(!showCustomInput)}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Add Custom
          </Button>
        </div>

        {showCustomInput && (
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Enter custom amenity (e.g., 'Rooftop Access', 'Pet-Friendly')"
              value={customAmenity}
              onChange={(e) => setCustomAmenity(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCustomAmenityAdd()}
            />
            <Button
              type="button"
              onClick={handleCustomAmenityAdd}
              disabled={!customAmenity.trim()}
              size="sm"
            >
              Add
            </Button>
          </div>
        )}

        {/* Display Custom Amenities */}
        {getCustomAmenities().length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs text-gray-500">Custom Amenities:</Label>
            <div className="flex flex-wrap gap-2">
              {getCustomAmenities().map(amenityId => (
                <Badge
                  key={amenityId}
                  variant="outline"
                  className="px-3 py-1 border-gray-300"
                >
                  {amenityId}
                  <button
                    onClick={() => removeCustomAmenity(amenityId)}
                    className="ml-2 hover:text-red-600"
                  >
                    <X size={12} />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AmenitiesSelector;