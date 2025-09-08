// apps/platform/lib/constants/amenities.ts

export interface Amenity {
  id: string;
  label: string;
  category: 'security' | 'utilities' | 'comfort' | 'parking' | 'connectivity' | 'recreation' | 'accessibility';
  icon?: string; // For future use with icons
}

export const AMENITIES: Amenity[] = [
  // Security
  {
    id: 'security_guard',
    label: 'Security Guard',
    category: 'security'
  },
  {
    id: 'security_fence',
    label: 'Security Fence',
    category: 'security'
  },
  {
    id: 'cctv',
    label: 'CCTV',
    category: 'security'
  },
  {
    id: 'gate_house',
    label: 'Gate House',
    category: 'security'
  },
  {
    id: 'security_alarm',
    label: 'Security Alarm',
    category: 'security'
  },

  // Utilities
  {
    id: 'generator',
    label: 'Generator',
    category: 'utilities'
  },
  {
    id: 'backup_power',
    label: 'Backup Power',
    category: 'utilities'
  },
  {
    id: 'water_heater',
    label: 'Water Heater',
    category: 'utilities'
  },
  {
    id: 'inverter',
    label: 'Inverter',
    category: 'utilities'
  },
  {
    id: 'solar_panels',
    label: 'Solar Panels',
    category: 'utilities'
  },
  {
    id: 'prepaid_meter',
    label: 'Prepaid Meter',
    category: 'utilities'
  },
  {
    id: 'borehole',
    label: 'Borehole',
    category: 'utilities'
  },
  {
    id: 'water_treatment',
    label: 'Water Treatment',
    category: 'utilities'
  },

  // Comfort & Appliances
  {
    id: 'air_conditioning',
    label: 'Air Conditioning',
    category: 'comfort'
  },
  {
    id: 'ceiling_fans',
    label: 'Ceiling Fans',
    category: 'comfort'
  },
  {
    id: 'refrigerator',
    label: 'Refrigerator',
    category: 'comfort'
  },
  {
    id: 'microwave',
    label: 'Microwave',
    category: 'comfort'
  },
  {
    id: 'washing_machine',
    label: 'Washing Machine',
    category: 'comfort'
  },
  {
    id: 'dishwasher',
    label: 'Dishwasher',
    category: 'comfort'
  },
  {
    id: 'wardrobe',
    label: 'Wardrobe',
    category: 'comfort'
  },
  {
    id: 'furnished',
    label: 'Furnished',
    category: 'comfort'
  },
  {
    id: 'semi_furnished',
    label: 'Semi-Furnished',
    category: 'comfort'
  },

  // Parking
  {
    id: 'parking_space',
    label: 'Parking Space',
    category: 'parking'
  },
  {
    id: 'covered_parking',
    label: 'Covered Parking',
    category: 'parking'
  },
  {
    id: 'garage',
    label: 'Garage',
    category: 'parking'
  },
  {
    id: 'parking_lot',
    label: 'Parking Lot',
    category: 'parking'
  },

  // Connectivity
  {
    id: 'wifi',
    label: 'WiFi',
    category: 'connectivity'
  },
  {
    id: 'internet_ready',
    label: 'Internet Ready',
    category: 'connectivity'
  },
  {
    id: 'cable_tv',
    label: 'Cable TV',
    category: 'connectivity'
  },
  {
    id: 'satellite_tv',
    label: 'Satellite TV',
    category: 'connectivity'
  },

  // Recreation & Facilities
  {
    id: 'swimming_pool',
    label: 'Swimming Pool',
    category: 'recreation'
  },
  {
    id: 'gym',
    label: 'Gym',
    category: 'recreation'
  },
  {
    id: 'playground',
    label: 'Playground',
    category: 'recreation'
  },
  {
    id: 'garden',
    label: 'Garden',
    category: 'recreation'
  },
  {
    id: 'balcony',
    label: 'Balcony',
    category: 'recreation'
  },
  {
    id: 'terrace',
    label: 'Terrace',
    category: 'recreation'
  },
  {
    id: 'rooftop_access',
    label: 'Rooftop Access',
    category: 'recreation'
  },

  // Accessibility
  {
    id: 'elevator',
    label: 'Elevator',
    category: 'accessibility'
  },
  {
    id: 'wheelchair_accessible',
    label: 'Wheelchair Accessible',
    category: 'accessibility'
  },
  {
    id: 'ramp_access',
    label: 'Ramp Access',
    category: 'accessibility'
  }
];

export const AMENITY_CATEGORIES = [
  { id: 'security', label: 'Security' },
  { id: 'utilities', label: 'Utilities' },
  { id: 'comfort', label: 'Comfort & Appliances' },
  { id: 'parking', label: 'Parking' },
  { id: 'connectivity', label: 'Connectivity' },
  { id: 'recreation', label: 'Recreation' },
  { id: 'accessibility', label: 'Accessibility' }
] as const;

// Helper functions
export const getAmenitiesByCategory = (category: string) => {
  return AMENITIES.filter(amenity => amenity.category === category);
};

export const getAmenityById = (id: string) => {
  return AMENITIES.find(amenity => amenity.id === id);
};

export const getAmenityLabels = (amenityIds: string[]) => {
  return amenityIds
    .map(id => getAmenityById(id))
    .filter(Boolean)
    .map(amenity => amenity!.label);
};

// Popular amenities for quick filters
export const POPULAR_AMENITIES = [
  'parking_space',
  'generator',
  'security_guard',
  'air_conditioning',
  'wifi',
  'furnished',
  'elevator',
  'swimming_pool'
];

// Essential amenities that most renters look for
export const ESSENTIAL_AMENITIES = [
  'generator',
  'security_guard',
  'parking_space',
  'water_heater'
];

export type AmenityCategory = typeof AMENITY_CATEGORIES[number]['id'];
export type AmenityId = typeof AMENITIES[number]['id'];