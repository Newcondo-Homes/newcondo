// apps/platform/lib/utils/propertyFingerprint.ts

import { PropertyType, PropertyStructure } from '@newcondo/db';
import { PropertyBoundary } from './duplicateDetection';

export interface PropertyFeatures {
  bedrooms?: number;
  bathrooms?: number;
  area?: string;
  features: string[];
  buildingFeatures?: string[]; // For multi-family buildings
  totalUnits?: number;
  structure: PropertyStructure;
}

export interface LocationData {
  address: string;
  city: string;
  state: string;
  country: string;
  gpsCoordinates: string;
  boundary: PropertyBoundary;
}

export interface PropertyFingerprintData {
  // Core identifiers
  coordinates: {
    lat: number;
    lng: number;
    precision: number; // GPS precision in meters
  };
  
  // Boundary characteristics
  boundaryHash: string;
  boundaryArea: number;
  boundaryPerimeter: number;
  boundaryComplexity: number; // Number of vertices
  
  // Physical features
  propertyType: PropertyType;
  structure: PropertyStructure;
  estimatedArea: number;
  
  // Building characteristics
  buildingFeatures: string[];
  uniqueFeatureHash: string;
  
  // Location context
  addressHash: string;
  neighborhoodHash: string;
  proximityMarkers: string[]; // Nearby landmarks, intersections
  
  // Metadata
  createdAt: number;
  version: string;
}

export interface FingerprintComparison {
  similarity: number; // 0-1 scale
  matchingFactors: string[];
  differingFactors: string[];
  confidence: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

/**
 * Generate a unique fingerprint for a property
 */
export function generatePropertyFingerprint(
  location: LocationData,
  features: PropertyFeatures,
  propertyType: PropertyType
): string {
  const fingerprintData: PropertyFingerprintData = {
    coordinates: {
      lat: parseFloat(parseFloat(location.boundary.center.lat.toString()).toFixed(7)),
      lng: parseFloat(parseFloat(location.boundary.center.lng.toString()).toFixed(7)),
      precision: calculateCoordinatePrecision(location.boundary.coordinates)
    },
    boundaryHash: generateBoundaryHash(location.boundary),
    boundaryArea: Math.round(location.boundary.area * 100) / 100,
    boundaryPerimeter: calculateBoundaryPerimeter(location.boundary.coordinates),
    boundaryComplexity: location.boundary.coordinates.length,
    propertyType,
    structure: features.structure,
    estimatedArea: extractNumericArea(features.area),
    buildingFeatures: [...(features.buildingFeatures || []), ...features.features].sort(),
    uniqueFeatureHash: generateFeatureHash(features),
    addressHash: generateAddressHash(location.address),
    neighborhoodHash: generateNeighborhoodHash(location.city, location.state),
    proximityMarkers: [], // To be filled by external geolocation service
    createdAt: Date.now(),
    version: '1.0'
  };
  
  return createFingerprintHash(fingerprintData);
}

/**
 * Generate a hash from property boundary coordinates
 */
function generateBoundaryHash(boundary: PropertyBoundary): string {
  const normalizedCoords = boundary.coordinates.map(coord => ({
    lat: Math.round(coord.lat * 10000000) / 10000000, // 7 decimal precision
    lng: Math.round(coord.lng * 10000000) / 10000000
  }));
  
  // Sort coordinates to ensure consistent hashing regardless of drawing direction
  const sortedCoords = normalizedCoords.sort((a, b) => 
    a.lat === b.lat ? a.lng - b.lng : a.lat - b.lat
  );
  
  const coordString = sortedCoords
    .map(coord => `${coord.lat},${coord.lng}`)
    .join('|');
  
  return generateHash(coordString);
}

/**
 * Calculate boundary perimeter in meters
 */
function calculateBoundaryPerimeter(coordinates: Array<{ lat: number; lng: number }>): number {
  let perimeter = 0;
  
  for (let i = 0; i < coordinates.length; i++) {
    const current = coordinates[i];
    const next = coordinates[(i + 1) % coordinates.length];
    
    perimeter += calculateHaversineDistance(current, next);
  }
  
  return Math.round(perimeter * 100) / 100;
}

/**
 * Calculate Haversine distance between two points
 */
function calculateHaversineDistance(
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
 * Calculate coordinate precision based on boundary variance
 */
function calculateCoordinatePrecision(coordinates: Array<{ lat: number; lng: number }>): number {
  if (coordinates.length < 2) return 100; // Default 100m precision
  
  const distances = [];
  for (let i = 0; i < coordinates.length - 1; i++) {
    distances.push(calculateHaversineDistance(coordinates[i], coordinates[i + 1]));
  }
  
  const minDistance = Math.min(...distances);
  return Math.max(1, Math.min(100, Math.round(minDistance / 10))); // 1-100m precision
}

/**
 * Generate feature hash from property features
 */
function generateFeatureHash(features: PropertyFeatures): string {
  const featureString = [
    features.structure,
    features.bedrooms?.toString() || '0',
    features.bathrooms?.toString() || '0',
    extractNumericArea(features.area).toString(),
    features.totalUnits?.toString() || '1',
    ...features.features.sort(),
    ...(features.buildingFeatures || []).sort()
  ].join('|');
  
  return generateHash(featureString);
}

/**
 * Generate address hash (normalized for comparison)
 */
function generateAddressHash(address: string): string {
  const normalizedAddress = address
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .split(' ')
    .sort() // Sort words to handle different orderings
    .join(' ');
  
  return generateHash(normalizedAddress);
}

/**
 * Generate neighborhood hash from city and state
 */
function generateNeighborhoodHash(city: string, state: string): string {
  const normalized = `${city.toLowerCase().trim()}_${state.toLowerCase().trim()}`;
  return generateHash(normalized);
}

/**
 * Extract numeric area from area string
 */
function extractNumericArea(area?: string): number {
  if (!area) return 0;
  
  const numericMatch = area.match(/(\d+(?:\.\d+)?)/);
  return numericMatch ? parseFloat(numericMatch[1]) : 0;
}

/**
 * Create final fingerprint hash from all data
 */
function createFingerprintHash(data: PropertyFingerprintData): string {
  const fingerprintString = [
    `coords:${data.coordinates.lat},${data.coordinates.lng}`,
    `boundary:${data.boundaryHash}`,
    `area:${data.boundaryArea}`,
    `perimeter:${data.boundaryPerimeter}`,
    `complexity:${data.boundaryComplexity}`,
    `type:${data.propertyType}`,
    `structure:${data.structure}`,
    `features:${data.uniqueFeatureHash}`,
    `address:${data.addressHash}`,
    `neighborhood:${data.neighborhoodHash}`,
    `version:${data.version}`
  ].join('|');
  
  return generateHash(fingerprintString);
}

/**
 * Simple hash function (for production, consider using crypto.subtle.digest)
 */
function generateHash(input: string): string {
  let hash = 0;
  if (input.length === 0) return hash.toString();
  
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Compare two property fingerprints
 */
export function compareFingerprints(
  fingerprint1: string,
  location1: LocationData,
  features1: PropertyFeatures,
  fingerprint2: string,
  location2: LocationData,
  features2: PropertyFeatures
): FingerprintComparison {
  const matchingFactors: string[] = [];
  const differingFactors: string[] = [];
  let totalFactors = 0;
  let matchingScore = 0;
  
  // Direct fingerprint comparison
  if (fingerprint1 === fingerprint2) {
    return {
      similarity: 1.0,
      matchingFactors: ['Identical fingerprint'],
      differingFactors: [],
      confidence: 0.99,
      riskLevel: 'CRITICAL'
    };
  }
  
  // Coordinate similarity (most important factor - weight: 30%)
  const coordDistance = calculateHaversineDistance(
    location1.boundary.center,
    location2.boundary.center
  );
  totalFactors += 30;
  if (coordDistance < 5) { // Within 5 meters
    matchingScore += 30;
    matchingFactors.push(`Very close coordinates (${coordDistance.toFixed(1)}m apart)`);
  } else if (coordDistance < 20) { // Within 20 meters
    matchingScore += 20;
    matchingFactors.push(`Close coordinates (${coordDistance.toFixed(1)}m apart)`);
  } else if (coordDistance < 100) { // Within 100 meters
    matchingScore += 10;
    matchingFactors.push(`Nearby coordinates (${coordDistance.toFixed(1)}m apart)`);
  } else {
    differingFactors.push(`Different locations (${coordDistance.toFixed(1)}m apart)`);
  }
  
  // Boundary similarity (weight: 25%)
  const boundary1Hash = generateBoundaryHash(location1.boundary);
  const boundary2Hash = generateBoundaryHash(location2.boundary);
  totalFactors += 25;
  if (boundary1Hash === boundary2Hash) {
    matchingScore += 25;
    matchingFactors.push('Identical boundary shape');
  } else {
    // Check area similarity
    const areaDiff = Math.abs(location1.boundary.area - location2.boundary.area);
    const areaRatio = areaDiff / Math.max(location1.boundary.area, location2.boundary.area);
    
    if (areaRatio < 0.1) { // Less than 10% difference
      matchingScore += 15;
      matchingFactors.push('Similar boundary area');
    } else {
      differingFactors.push(`Different boundary areas (${areaRatio * 100}% difference)`);
    }
  }
  
  // Property type similarity (weight: 15%)
  totalFactors += 15;
  if (features1.structure === features2.structure) {
    matchingScore += 10;
    matchingFactors.push('Same property structure');
    
    // Additional check for specific features if same structure
    if (features1.bedrooms === features2.bedrooms) {
      matchingScore += 3;
      matchingFactors.push('Same number of bedrooms');
    } else if (features1.bedrooms && features2.bedrooms) {
      differingFactors.push('Different number of bedrooms');
    }
    
    if (features1.bathrooms === features2.bathrooms) {
      matchingScore += 2;
      matchingFactors.push('Same number of bathrooms');
    } else if (features1.bathrooms && features2.bathrooms) {
      differingFactors.push('Different number of bathrooms');
    }
  } else {
    differingFactors.push('Different property structures');
  }
  
  // Address similarity (weight: 20%)
  const address1Hash = generateAddressHash(location1.address);
  const address2Hash = generateAddressHash(location2.address);
  totalFactors += 20;
  if (address1Hash === address2Hash) {
    matchingScore += 20;
    matchingFactors.push('Identical normalized address');
  } else {
    // Check if addresses share common words
    const words1 = location1.address.toLowerCase().split(/\W+/);
    const words2 = location2.address.toLowerCase().split(/\W+/);
    const commonWords = words1.filter(word => 
      word.length > 2 && words2.includes(word)
    );
    
    if (commonWords.length >= 3) {
      matchingScore += 10;
      matchingFactors.push(`Similar address (${commonWords.length} common words)`);
    } else {
      differingFactors.push('Different addresses');
    }
  }
  
  // Feature similarity (weight: 10%)
  totalFactors += 10;
  const features1Set = new Set([...features1.features, ...(features1.buildingFeatures || [])]);
  const features2Set = new Set([...features2.features, ...(features2.buildingFeatures || [])]);
  const commonFeatures = [...features1Set].filter(feature => features2Set.has(feature));
  const totalUniqueFeatures = new Set([...features1Set, ...features2Set]).size;
  
  if (totalUniqueFeatures > 0) {
    const featureSimilarity = commonFeatures.length / totalUniqueFeatures;
    matchingScore += Math.round(featureSimilarity * 10);
    
    if (commonFeatures.length > 0) {
      matchingFactors.push(`${commonFeatures.length} common features`);
    }
    if (totalUniqueFeatures - commonFeatures.length > 0) {
      differingFactors.push(`${totalUniqueFeatures - commonFeatures.length} different features`);
    }
  }
  
  // Calculate final similarity score
  const similarity = totalFactors > 0 ? matchingScore / totalFactors : 0;
  
  // Determine confidence based on available data
  let confidence = 0.5; // Base confidence
  if (coordDistance < 10) confidence += 0.3;
  if (boundary1Hash === boundary2Hash) confidence += 0.2;
  if (features1.structure === features2.structure) confidence += 0.1;
  
  // Determine risk level
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (similarity >= 0.9) riskLevel = 'CRITICAL';
  else if (similarity >= 0.7) riskLevel = 'HIGH';
  else if (similarity >= 0.5) riskLevel = 'MEDIUM';

  return {
    similarity,
    matchingFactors,
    differingFactors,
    confidence: Math.min(1, confidence),
    riskLevel
  };
}