import { PropertyType, PropertyStatus } from '@newcondo/db';

// Property data types from Prisma schema
export interface PropertyImage {
  id: string;
  url: string;
  altText?: string;
  isPrimary: boolean;
  order: number;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  price?: number;
  currency: string;
  address: string;
  city: string;
  state: string;
  country: string;
  propertyType: PropertyType;
  bedrooms?: number;
  bathrooms?: number;
  area?: string;
  features: string[];
  images: PropertyImage[];
  isAvailable: boolean;
  status: PropertyStatus;
  boundaryVerified: boolean;
  isOwnerListing: boolean;
  createdAt: string;
  updatedAt: string;
  gpsCoordinates?: string;
  viewCount: number;
  favoriteCount: number;
  shareableLink?: string;
}

// Format price with currency
export function formatPrice(price: number, currency: string = 'NGN'): string {
  const formatter = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  return formatter.format(price);
}

// Format price range
export function formatPriceRange(minPrice?: number, maxPrice?: number, currency: string = 'NGN'): string {
  if (!minPrice && !maxPrice) return 'Any price';
  if (minPrice && !maxPrice) return `From ${formatPrice(minPrice, currency)}`;
  if (!minPrice && maxPrice) return `Up to ${formatPrice(maxPrice, currency)}`;
  if (minPrice === maxPrice) return formatPrice(minPrice!, currency);
  return `${formatPrice(minPrice!, currency)} - ${formatPrice(maxPrice!, currency)}`;
}

// Get property type display name
export function getPropertyTypeDisplayName(type: PropertyType): string {
  const typeNames: Record<PropertyType, string> = {
    APARTMENT: 'Apartment',
    HOUSE: 'House',
    DUPLEX: 'Duplex',
    ROOM: 'Room',
    SHARED_APARTMENT: 'Shared Apartment',
    OFFICE: 'Office',
    SHOP: 'Shop',
    WAREHOUSE: 'Warehouse',
  };
  
  return typeNames[type] || type;
}

// Get property status display info
export function getPropertyStatusInfo(status: PropertyStatus) {
  const statusInfo = {
    DRAFT: { label: 'Draft', color: 'gray', description: 'Property is being prepared' },
    PENDING: { label: 'Pending Review', color: 'yellow', description: 'Awaiting admin approval' },
    PUBLISHED: { label: 'Published', color: 'green', description: 'Property is live and available' },
    RENTED: { label: 'Rented', color: 'blue', description: 'Property is currently rented' },
    UNAVAILABLE: { label: 'Unavailable', color: 'red', description: 'Property is not available' },
  };
  
  return statusInfo[status] || { label: status, color: 'gray', description: '' };
}

// Generate property description snippet
export function generatePropertySnippet(property: Property, maxLength: number = 120): string {
  let snippet = `${getPropertyTypeDisplayName(property.propertyType)}`;
  
  if (property.bedrooms) {
    snippet += ` • ${property.bedrooms} bed${property.bedrooms > 1 ? 's' : ''}`;
  }
  
  if (property.bathrooms) {
    snippet += ` • ${property.bathrooms} bath${property.bathrooms > 1 ? 's' : ''}`;
  }
  
  if (property.area) {
    snippet += ` • ${property.area}`;
  }
  
  snippet += ` • ${property.city}, ${property.state}`;

  // Check if snippet exceeds max length and truncate
  if (snippet.length > maxLength) {
    return snippet.substring(0, maxLength - 3) + '...';
  }
  
  return snippet;
}

// Get the primary image from a list of images
export function getPrimaryImage(images: PropertyImage[]): PropertyImage | undefined {
  if (!images || images.length === 0) return undefined;
  
  const primary = images.find(img => img.isPrimary);
  if (primary) return primary;
  
  // If no primary image is explicitly set, return the first one
  return images.sort((a, b) => a.order - b.order)[0];
}

// Get a formatted string of property features
export function getFormattedFeatures(features: string[], limit: number = 3): string {
  if (!features || features.length === 0) return 'No features listed.';
  
  const limitedFeatures = features.slice(0, limit).join(', ');
  
  if (features.length > limit) {
    return `${limitedFeatures}, and more.`;
  }
  
  return limitedFeatures;
}

// Parse GPS coordinates string into an object
export function parseGpsCoordinates(coordinates: string | null | undefined): { lat: number; lng: number } | null {
  if (!coordinates) return null;
  
  const parts = coordinates.split(',').map(part => parseFloat(part.trim()));
  
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return { lat: parts[0], lng: parts[1] };
  }
  
  return null;
}

// Get full property address
export function getFullAddress(property: Pick<Property, 'address' | 'city' | 'state' | 'country'>): string {
  const parts = [property.address, property.city, property.state, property.country].filter(Boolean);
  return parts.join(', ');
}

// Check if a property is currently available
export function isPropertyAvailable(property: Pick<Property, 'isAvailable' | 'status'>): boolean {
  return property.isAvailable && property.status === 'PUBLISHED';
}