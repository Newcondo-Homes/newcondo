// apps/platform/components/property/property-type-selector.tsx
import React from 'react';
import { Label } from '@newcondo/ui';
import { 
  Home, 
  Building, 
  Building2, 
  Bed, 
  Users, 
  Briefcase, 
  ShoppingBag, 
  Warehouse 
} from 'lucide-react';
import { cn } from '@/lib/utils';

type PropertyType = 'APARTMENT' | 'HOUSE' | 'DUPLEX' | 'ROOM' | 'SHARED_APARTMENT' | 'OFFICE' | 'SHOP' | 'WAREHOUSE';

interface PropertyTypeSelectorProps {
  selectedType: PropertyType | null;
  onTypeChange: (type: PropertyType) => void;
  className?: string;
}

// Define property types with their details
const propertyTypes: Record<PropertyType, {
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  category: 'residential' | 'commercial';
}> = {
  APARTMENT: {
    label: 'Apartment',
    description: 'Self-contained unit in a building',
    icon: Building,
    category: 'residential'
  },
  HOUSE: {
    label: 'House',
    description: 'Standalone residential building',
    icon: Home,
    category: 'residential'
  },
  DUPLEX: {
    label: 'Duplex',
    description: 'Two-story residential unit',
    icon: Building2,
    category: 'residential'
  },
  ROOM: {
    label: 'Room',
    description: 'Single room in a shared space',
    icon: Bed,
    category: 'residential'
  },
  SHARED_APARTMENT: {
    label: 'Shared Apartment',
    description: 'Shared living space with roommates',
    icon: Users,
    category: 'residential'
  },
  OFFICE: {
    label: 'Office Space',
    description: 'Commercial workspace',
    icon: Briefcase,
    category: 'commercial'
  },
  SHOP: {
    label: 'Shop/Retail',
    description: 'Retail or commercial store',
    icon: ShoppingBag,
    category: 'commercial'
  },
  WAREHOUSE: {
    label: 'Warehouse',
    description: 'Storage or industrial space',
    icon: Warehouse,
    category: 'commercial'
  }
};

export const PropertyTypeSelector: React.FC<PropertyTypeSelectorProps> = ({
  selectedType,
  onTypeChange,
  className
}) => {
  const residentialTypes = Object.entries(propertyTypes).filter(
    ([_, config]) => config.category === 'residential'
  );
  
  const commercialTypes = Object.entries(propertyTypes).filter(
    ([_, config]) => config.category === 'commercial'
  );

  const renderPropertyTypeCard = (type: PropertyType, config: typeof propertyTypes[PropertyType]) => {
    const Icon = config.icon;
    const isSelected = selectedType === type;
    
    return (
      <div
        key={type}
        className={cn(
          'relative p-4 rounded-lg border cursor-pointer transition-all duration-200',
          'hover:shadow-md hover:border-blue-300',
          isSelected
            ? 'border-blue-500 bg-blue-50 shadow-md'
            : 'border-gray-200 bg-white'
        )}
        onClick={() => onTypeChange(type)}
      >
        <div className="flex items-start space-x-3">
          <div className={cn(
            'p-2 rounded-lg',
            isSelected
              ? 'bg-blue-100 text-blue-600'
              : 'bg-gray-100 text-gray-600'
          )}>
            <Icon size={20} />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className={cn(
              'font-medium text-sm mb-1',
              isSelected ? 'text-blue-900' : 'text-gray-900'
            )}>
              {config.label}
            </h4>
            <p className={cn(
              'text-xs leading-relaxed',
              isSelected ? 'text-blue-700' : 'text-gray-600'
            )}>
              {config.description}
            </p>
          </div>
        </div>
        
        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full" />
        )}
      </div>
    );
  };

  return (
    <div className={cn('space-y-6', className)}>
      <div>
        <Label className="text-base font-medium mb-2 block">
          Property Type *
        </Label>
        <p className="text-sm text-gray-600 mb-4">
          Select the type of property you're listing
        </p>
      </div>

      {/* Residential Properties */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Home size={16} className="text-gray-600" />
          <h3 className="font-medium text-gray-900">Residential Properties</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {residentialTypes.map(([type, config]) => 
            renderPropertyTypeCard(type as PropertyType, config)
          )}
        </div>
      </div>

      {/* Commercial Properties */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Briefcase size={16} className="text-gray-600" />
          <h3 className="font-medium text-gray-900">Commercial Properties</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {commercialTypes.map(([type, config]) => 
            renderPropertyTypeCard(type as PropertyType, config)
          )}
        </div>
      </div>

      {/* Selection Summary */}
      {selectedType && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <span className="text-sm font-medium text-blue-900">
              Selected: {propertyTypes[selectedType].label}
            </span>
          </div>
          <p className="text-sm text-blue-700 mt-1 ml-4">
            {propertyTypes[selectedType].description}
          </p>
        </div>
      )}
    </div>
  );
};

// Helper function to get property type display info
export const getPropertyTypeInfo = (type: PropertyType) => {
  return propertyTypes[type];
};

// Helper function to check if property type is residential
export const isResidentialProperty = (type: PropertyType): boolean => {
  return propertyTypes[type].category === 'residential';
};

// Helper function to check if property type is commercial
export const isCommercialProperty = (type: PropertyType): boolean => {
  return propertyTypes[type].category === 'commercial';
};

export default PropertyTypeSelector;