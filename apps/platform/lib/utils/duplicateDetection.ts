// apps/platform/lib/utils/duplicateDetection.ts

import { PropertyStructure, PropertyType } from '@newcondo/db';

export interface PropertyBoundary {
  coordinates: Array<{ lat: number; lng: number }>;
  area: number; // in square meters
  center: { lat: number; lng: number };
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface PropertyMask {
  id: string;
  propertyId: string;
  boundary: PropertyBoundary;
  fingerprint: string;
  createdBy: string;
  createdAt: Date;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'DISPUTED';
}

export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  confidence: number; // 0-1 scale
  existingProperties: Array<{
    id: string;
    title: string;
    address: string;
    ownerId: string;
    overlapPercentage: number;
    distance: number; // in meters
    fingerprint: string;
  }>;
  suggestions: string[];
}

export interface ConflictResolutionData {
  originalProperty: {
    id: string;
    title: string;
    address: string;
    owner: string;
    boundary: PropertyBoundary;
  };
  conflictingProperty: {
    boundary: PropertyBoundary;
    claimedBy: string;
  };
  overlapArea: number;
  overlapPercentage: number;
}

/**
 * Calculate the area of a polygon defined by lat/lng coordinates
 * Uses the shoelace formula for polygon area calculation
 */
export function calculatePolygonArea(coordinates: Array<{ lat: number; lng: number }>): number {
  if (coordinates.length < 3) return 0;

  let area = 0;
  const earthRadius = 6371000; // Earth's radius in meters

  for (let i = 0; i < coordinates.length; i++) {
    const j = (i + 1) % coordinates.length;
    
    const lat1 = coordinates[i].lat * Math.PI / 180;
    const lat2 = coordinates[j].lat * Math.PI / 180;
    const lng1 = coordinates[i].lng * Math.PI / 180;
    const lng2 = coordinates[j].lng * Math.PI / 180;
    
    area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  
  area = Math.abs(area * earthRadius * earthRadius / 2);
  return area;
}

/**
 * Calculate the distance between two geographical points using Haversine formula
 */
export function calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
export function isPointInPolygon(
  point: { lat: number; lng: number },
  polygon: Array<{ lat: number; lng: number }>
): boolean {
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    if (
      ((polygon[i].lat > point.lat) !== (polygon[j].lat > point.lat)) &&
      (point.lng < (polygon[j].lng - polygon[i].lng) * (point.lat - polygon[i].lat) / 
        (polygon[j].lat - polygon[i].lat) + polygon[i].lng)
    ) {
      inside = !inside;
    }
  }
  
  return inside;
}

/**
 * Calculate the overlap percentage between two polygons
 * This is a simplified implementation - for production, consider using a more robust library like Turf.js
 */
export function calculatePolygonOverlap(
  polygon1: Array<{ lat: number; lng: number }>,
  polygon2: Array<{ lat: number; lng: number }>
): number {
  if (polygon1.length < 3 || polygon2.length < 3) return 0;

  let overlapPoints = 0;
  let totalSamplePoints = 0;

  // Sample points from polygon1 and check if they're in polygon2
  const sampleDensity = 20; // Number of sample points per side
  
  for (let i = 0; i < polygon1.length; i++) {
    const current = polygon1[i];
    const next = polygon1[(i + 1) % polygon1.length];
    
    for (let j = 0; j <= sampleDensity; j++) {
      const t = j / sampleDensity;
      const samplePoint = {
        lat: current.lat + t * (next.lat - current.lat),
        lng: current.lng + t * (next.lng - current.lng)
      };
      
      if (isPointInPolygon(samplePoint, polygon2)) {
        overlapPoints++;
      }
      totalSamplePoints++;
    }
  }

  return totalSamplePoints > 0 ? overlapPoints / totalSamplePoints : 0;
}

/**
 * Validate property boundary constraints
 */
export function validatePropertyBoundary(
  boundary: PropertyBoundary,
  propertyType: PropertyType,
  // structure: PropertyStructure
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Minimum and maximum area constraints based on property type
  const areaConstraints = {
    [PropertyType.ROOM]: { min: 9, max: 50 }, // 9-50 sqm
    [PropertyType.APARTMENT]: { min: 20, max: 300 }, // 20-300 sqm
    [PropertyType.HOUSE]: { min: 40, max: 1000 }, // 40-1000 sqm
    [PropertyType.DUPLEX]: { min: 80, max: 1500 }, // 80-1500 sqm
    [PropertyType.OFFICE]: { min: 15, max: 2000 }, // 15-2000 sqm
    [PropertyType.SHOP]: { min: 10, max: 500 }, // 10-500 sqm
    [PropertyType.WAREHOUSE]: { min: 100, max: 10000 }, // 100-10000 sqm
    [PropertyType.SHARED_APARTMENT]: { min: 20, max: 300 }
  };

  const constraints = areaConstraints[propertyType];
  
  if (boundary.area < constraints.min) {
    errors.push(`Property area (${boundary.area.toFixed(1)} sqm) is too small for ${propertyType}. Minimum: ${constraints.min} sqm`);
  }
  
  if (boundary.area > constraints.max) {
    errors.push(`Property area (${boundary.area.toFixed(1)} sqm) is too large for ${propertyType}. Maximum: ${constraints.max} sqm`);
  }

  // Check for reasonable polygon shape (at least 3 points, max 20 points)
  if (boundary.coordinates.length < 3) {
    errors.push('Property boundary must have at least 3 points');
  }
  
  if (boundary.coordinates.length > 20) {
    errors.push('Property boundary cannot have more than 20 points');
  }

  // Check for self-intersecting polygons (basic check)
  if (boundary.coordinates.length >= 4) {
    const hasIntersection = checkSelfIntersection(boundary.coordinates);
    if (hasIntersection) {
      errors.push('Property boundary cannot intersect with itself');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Basic check for self-intersecting polygons
 */
function checkSelfIntersection(coordinates: Array<{ lat: number; lng: number }>): boolean {
  for (let i = 0; i < coordinates.length - 1; i++) {
    for (let j = i + 2; j < coordinates.length - (i === 0 ? 1 : 0); j++) {
      if (lineIntersects(
        coordinates[i], coordinates[i + 1],
        coordinates[j], coordinates[(j + 1) % coordinates.length]
      )) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Check if two line segments intersect
 */
function lineIntersects(
  p1: { lat: number; lng: number }, p2: { lat: number; lng: number },
  p3: { lat: number; lng: number }, p4: { lat: number; lng: number }
): boolean {
  const det = (p2.lng - p1.lng) * (p4.lat - p3.lat) - (p4.lng - p3.lng) * (p2.lat - p1.lat);
  if (det === 0) return false; // Lines are parallel

  const lambda = ((p4.lat - p3.lat) * (p4.lng - p1.lng) + (p3.lng - p4.lng) * (p4.lat - p1.lat)) / det;
  const gamma = ((p1.lat - p2.lat) * (p4.lng - p1.lng) + (p2.lng - p1.lng) * (p4.lat - p1.lat)) / det;

  return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
}

/**
 * Get boundary bounds from coordinates
 */
export function getBoundaryBounds(coordinates: Array<{ lat: number; lng: number }>) {
  if (coordinates.length === 0) {
    return { north: 0, south: 0, east: 0, west: 0 };
  }

  let north = coordinates[0].lat;
  let south = coordinates[0].lat;
  let east = coordinates[0].lng;
  let west = coordinates[0].lng;

  coordinates.forEach(coord => {
    north = Math.max(north, coord.lat);
    south = Math.min(south, coord.lat);
    east = Math.max(east, coord.lng);
    west = Math.min(west, coord.lng);
  });

  return { north, south, east, west };
}

/**
 * Get center point of a polygon
 */
export function getPolygonCenter(coordinates: Array<{ lat: number; lng: number }>): { lat: number; lng: number } {
  if (coordinates.length === 0) {
    return { lat: 0, lng: 0 };
  }

  let totalLat = 0;
  let totalLng = 0;

  coordinates.forEach(coord => {
    totalLat += coord.lat;
    totalLng += coord.lng;
  });

  return {
    lat: totalLat / coordinates.length,
    lng: totalLng / coordinates.length
  };
}

/**
 * Check for nearby properties within a certain radius
 */
export function findNearbyProperties(
  center: { lat: number; lng: number },
  radius: number = 100, // meters
  existingProperties: Array<{
    id: string;
    boundary: PropertyBoundary;
    address: string;
    title: string;
    ownerId: string;
  }>
): Array<{
  id: string;
  title: string;
  address: string;
  ownerId: string;
  distance: number;
}> {
  return existingProperties
    .map(property => ({
      ...property,
      distance: calculateDistance(center, property.boundary.center)
    }))
    .filter(property => property.distance <= radius)
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Generate suggestions for resolving duplicates
 */
export function generateDuplicateSuggestions(
  detectionResult: DuplicateDetectionResult
): string[] {
  const suggestions: string[] = [];
  
  if (detectionResult.isDuplicate && detectionResult.existingProperties.length > 0) {
    const closestProperty = detectionResult.existingProperties[0];
    
    suggestions.push(
      `This property appears to overlap with "${closestProperty.title}" by ${closestProperty.overlapPercentage.toFixed(1)}%`
    );
    
    if (closestProperty.overlapPercentage > 80) {
      suggestions.push(
        'Consider contacting the property owner to verify if this is the same property'
      );
    } else if (closestProperty.overlapPercentage > 50) {
      suggestions.push(
        'Adjust your property boundary to avoid overlap with existing listings'
      );
    }
    
    if (closestProperty.distance < 10) {
      suggestions.push(
        'This property is very close to an existing listing. Please verify the exact boundaries'
      );
    }
    
    suggestions.push(
      'If you believe this is a unique property, you can request boundary verification'
    );
  }
  
  return suggestions;
}

/**
 * Create a property mask from boundary data
 */
export function createPropertyMask(
  propertyId: string,
  coordinates: Array<{ lat: number; lng: number }>,
  createdBy: string,
  fingerprint: string
): PropertyMask {
  const center = getPolygonCenter(coordinates);
  const bounds = getBoundaryBounds(coordinates);
  const area = calculatePolygonArea(coordinates);
  
  const boundary: PropertyBoundary = {
    coordinates,
    area,
    center,
    bounds
  };
  
  return {
    id: `mask_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    propertyId,
    boundary,
    fingerprint,
    createdBy,
    createdAt: new Date(),
    verificationStatus: 'PENDING'
  };
}