import crypto from 'crypto';
import { BoundaryCoordinates, PropertyMask, PropertyFingerprint, DuplicateDetectionResult } from '../types/geolocation';
import { calculatePolygonArea, getBoundingBox, getPolygonCenter, doPolygonsOverlap } from './geolocation';
import { BOUNDARY_CONSTANTS } from '../constants/boundaries';

/**
 * Generate a unique fingerprint for a property based on its boundaries and characteristics
 * @param mask Property boundary mask
 * @param address Property address
 * @param buildingFeatures Optional building features
 * @returns Property fingerprint
 */
export function generatePropertyFingerprint(
  mask: PropertyMask,
  address: string,
  buildingFeatures?: string[]
): PropertyFingerprint {
  // Normalize coordinates for consistent hashing
  const normalizedCoords = normalizeCoordinatesForHashing(mask.coordinates);
  
  // Calculate geometric properties
  const area = calculatePolygonArea(mask.coordinates);
  const center = getPolygonCenter(mask.coordinates);
  const boundingBox = getBoundingBox(mask.coordinates);
  
  // Create coordinate hash
  const coordString = normalizedCoords
    .map(coord => `${coord.lat.toFixed(6)},${coord.lng.toFixed(6)}`)
    .join('|');
  const coordinateHash = crypto
    .createHash('sha256')
    .update(coordString)
    .digest('hex')
    .substring(0, 16);

  // Create address hash (normalized)
  const normalizedAddress = normalizeAddressForHashing(address);
  const addressHash = crypto
    .createHash('sha256')
    .update(normalizedAddress)
    .digest('hex')
    .substring(0, 8);

  // Create building features hash
  let featuresHash = '';
  if (buildingFeatures && buildingFeatures.length > 0) {
    const normalizedFeatures = buildingFeatures
      .map(f => f.toLowerCase().trim())
      .sort()
      .join('|');
    featuresHash = crypto
      .createHash('sha256')
      .update(normalizedFeatures)
      .digest('hex')
      .substring(0, 8);
  }

  // Create geographic zone identifier
  const zoneId = getGeographicZone(center);

  // Combine all hashes to create main fingerprint
  const mainFingerprint = crypto
    .createHash('sha256')
    .update(`${coordinateHash}${addressHash}${featuresHash}${zoneId}`)
    .digest('hex');

  return {
    id: mainFingerprint,
    coordinateHash,
    addressHash,
    featuresHash,
    zoneId,
    area: Math.round(area),
    centerLat: parseFloat(center.lat.toFixed(6)),
    centerLng: parseFloat(center.lng.toFixed(6)),
    boundingBox: {
      north: parseFloat(boundingBox.northeast.lat.toFixed(6)),
      south: parseFloat(boundingBox.southwest.lat.toFixed(6)),
      east: parseFloat(boundingBox.northeast.lng.toFixed(6)),
      west: parseFloat(boundingBox.southwest.lng.toFixed(6))
    },
    createdAt: new Date()
  };
}

/**
 * Detect potential duplicates based on property fingerprints and boundaries
 * @param newMask New property mask to check
 * @param existingMasks Array of existing property masks with their fingerprints
 * @param newAddress New property address
 * @param strictMode Whether to use strict duplicate detection
 * @returns Duplicate detection result
 */
export function detectDuplicateProperties(
  newMask: PropertyMask,
  existingMasks: Array<{ mask: PropertyMask; fingerprint: PropertyFingerprint; propertyId: string; address: string }>,
  newAddress: string,
  strictMode = false
): DuplicateDetectionResult {
  const newFingerprint = generatePropertyFingerprint(newMask, newAddress);
  const duplicates: Array<{
    propertyId: string;
    similarity: number;
    overlapPercentage: number;
    reason: string;
  }> = [];

  for (const existing of existingMasks) {
    const similarity = calculateSimilarity(newFingerprint, existing.fingerprint);
    const overlapPercentage = calculateOverlapPercentage(newMask.coordinates, existing.mask.coordinates);
    
    const isDuplicate = strictMode 
      ? isStrictDuplicate(newFingerprint, existing.fingerprint, overlapPercentage)
      : isLooseDuplicate(newFingerprint, existing.fingerprint, overlapPercentage);

    if (isDuplicate) {
      duplicates.push({
        propertyId: existing.propertyId,
        similarity,
        overlapPercentage,
        reason: generateDuplicateReason(newFingerprint, existing.fingerprint, overlapPercentage, similarity)
      });
    }
  }

  return {
    isDuplicate: duplicates.length > 0,
    confidence: duplicates.length > 0 ? Math.max(...duplicates.map(d => d.similarity)) : 0,
    duplicates,
    newPropertyFingerprint: newFingerprint
  };
}

/**
 * Calculate similarity between two property fingerprints
 * @param fp1 First fingerprint
 * @param fp2 Second fingerprint
 * @returns Similarity score (0-1)
 */
export function calculateSimilarity(fp1: PropertyFingerprint, fp2: PropertyFingerprint): number {
  let totalScore = 0;
  let maxScore = 0;

  // Geographic proximity score (40% weight)
  const distance = calculateDistanceBetweenCenters(fp1, fp2);
  const proximityScore = Math.max(0, 1 - (distance / BOUNDARY_CONSTANTS.DUPLICATE_DETECTION.MAX_DISTANCE_METERS));
  totalScore += proximityScore * 0.4;
  maxScore += 0.4;

  // Area similarity score (25% weight)
  const areaRatio = Math.min(fp1.area, fp2.area) / Math.max(fp1.area, fp2.area);
  const areaScore = areaRatio > BOUNDARY_CONSTANTS.DUPLICATE_DETECTION.MIN_AREA_SIMILARITY ? areaRatio : 0;
  totalScore += areaScore * 0.25;
  maxScore += 0.25;

  // Address similarity score (20% weight)
  const addressScore = fp1.addressHash === fp2.addressHash ? 1 : 0;
  totalScore += addressScore * 0.2;
  maxScore += 0.2;

  // Zone similarity score (10% weight)
  const zoneScore = fp1.zoneId === fp2.zoneId ? 1 : 0;
  totalScore += zoneScore * 0.1;
  maxScore += 0.1;

  // Features similarity score (5% weight)
  const featuresScore = fp1.featuresHash && fp2.featuresHash && fp1.featuresHash === fp2.featuresHash ? 1 : 0;
  totalScore += featuresScore * 0.05;
  maxScore += 0.05;

  return maxScore > 0 ? totalScore / maxScore : 0;
}

/**
 * Calculate overlap percentage between two property boundaries
 * @param coords1 First property coordinates
 * @param coords2 Second property coordinates
 * @returns Overlap percentage (0-100)
 */
export function calculateOverlapPercentage(coords1: BoundaryCoordinates[], coords2: BoundaryCoordinates[]): number {
  if (!doPolygonsOverlap(coords1, coords2)) {
    return 0;
  }

  // For simplicity, we'll use bounding box overlap as approximation
  // In production, you might want to use a more sophisticated polygon intersection algorithm
  const bbox1 = getBoundingBox(coords1);
  const bbox2 = getBoundingBox(coords2);

  const overlapArea = calculateBoundingBoxOverlap(bbox1, bbox2);
  const area1 = calculatePolygonArea(coords1);
  const area2 = calculatePolygonArea(coords2);
  const unionArea = area1 + area2 - overlapArea;

  return unionArea > 0 ? (overlapArea / unionArea) * 100 : 0;
}

/**
 * Check if two properties are strict duplicates
 * @param fp1 First fingerprint
 * @param fp2 Second fingerprint
 * @param overlapPercentage Overlap percentage
 * @returns True if strict duplicate
 */
function isStrictDuplicate(fp1: PropertyFingerprint, fp2: PropertyFingerprint, overlapPercentage: number): boolean {
  return (
    overlapPercentage >= BOUNDARY_CONSTANTS.DUPLICATE_DETECTION.STRICT_OVERLAP_THRESHOLD &&
    calculateSimilarity(fp1, fp2) >= BOUNDARY_CONSTANTS.DUPLICATE_DETECTION.STRICT_SIMILARITY_THRESHOLD
  );
}

/**
 * Check if two properties are loose duplicates
 * @param fp1 First fingerprint
 * @param fp2 Second fingerprint
 * @param overlapPercentage Overlap percentage
 * @returns True if loose duplicate
 */
function isLooseDuplicate(fp1: PropertyFingerprint, fp2: PropertyFingerprint, overlapPercentage: number): boolean {
  return (
    overlapPercentage >= BOUNDARY_CONSTANTS.DUPLICATE_DETECTION.LOOSE_OVERLAP_THRESHOLD ||
    calculateSimilarity(fp1, fp2) >= BOUNDARY_CONSTANTS.DUPLICATE_DETECTION.LOOSE_SIMILARITY_THRESHOLD
  );
}

/**
 * Normalize coordinates for consistent hashing
 * @param coordinates Raw coordinates
 * @returns Normalized coordinates
 */
function normalizeCoordinatesForHashing(coordinates: BoundaryCoordinates[]): BoundaryCoordinates[] {
  // Round to 6 decimal places (approximately 10cm precision)
  // Sort by latitude first, then longitude for consistent ordering
  return coordinates
    .map(coord => ({
      lat: parseFloat(coord.lat.toFixed(6)),
      lng: parseFloat(coord.lng.toFixed(6))
    }))
    .sort((a, b) => {
      if (a.lat !== b.lat) return a.lat - b.lat;
      return a.lng - b.lng;
    });
}

/**
 * Normalize address for consistent hashing
 * @param address Raw address
 * @returns Normalized address
 */
function normalizeAddressForHashing(address: string): string {
  return address
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Get geographic zone identifier based on coordinates
 * @param center Center coordinates
 * @returns Zone identifier
 */
function getGeographicZone(center: { lat: number; lng: number }): string {
  // Create a grid-based zone system for Nigeria
  // Each zone represents approximately 1km x 1km area
  const gridSize = 0.01; // Approximately 1km at Nigeria's latitude
  const zoneLat = Math.floor(center.lat / gridSize);
  const zoneLng = Math.floor(center.lng / gridSize);
  return `${zoneLat}_${zoneLng}`;
}

/**
 * Calculate distance between two fingerprint centers
 * @param fp1 First fingerprint
 * @param fp2 Second fingerprint
 * @returns Distance in meters
 */
function calculateDistanceBetweenCenters(fp1: PropertyFingerprint, fp2: PropertyFingerprint): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (fp1.centerLat * Math.PI) / 180;
  const φ2 = (fp2.centerLat * Math.PI) / 180;
  const Δφ = ((fp2.centerLat - fp1.centerLat) * Math.PI) / 180;
  const Δλ = ((fp2.centerLng - fp1.centerLng) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate bounding box overlap area
 * @param bbox1 First bounding box
 * @param bbox2 Second bounding box
 * @returns Overlap area in square meters
 */
function calculateBoundingBoxOverlap(bbox1: any, bbox2: any): number {
  const left = Math.max(bbox1.southwest.lng, bbox2.southwest.lng);
  const right = Math.min(bbox1.northeast.lng, bbox2.northeast.lng);
  const top = Math.min(bbox1.northeast.lat, bbox2.northeast.lat);
  const bottom = Math.max(bbox1.southwest.lat, bbox2.southwest.lat);

  if (left >= right || bottom >= top) {
    return 0; // No overlap
  }

  const width = right - left;
  const height = top - bottom;

  // Convert to square meters (approximate)
  const degToMeter = 111320; // meters per degree at equator
  return width * height * degToMeter * degToMeter;
}

/**
 * Generate human-readable duplicate reason
 * @param fp1 First fingerprint
 * @param fp2 Second fingerprint
 * @param overlapPercentage Overlap percentage
 * @param similarity Similarity score
 * @returns Readable reason string
 */
function generateDuplicateReason(
  fp1: PropertyFingerprint,
  fp2: PropertyFingerprint,
  overlapPercentage: number,
  similarity: number
): string {
  const reasons: string[] = [];

  if (overlapPercentage >= BOUNDARY_CONSTANTS.DUPLICATE_DETECTION.STRICT_OVERLAP_THRESHOLD) {
    reasons.push(`High boundary overlap (${overlapPercentage.toFixed(1)}%)`);
  }

  if (fp1.addressHash === fp2.addressHash) {
    reasons.push('Identical address');
  }

  if (fp1.zoneId === fp2.zoneId) {
    reasons.push('Same geographic zone');
  }

  const distance = calculateDistanceBetweenCenters(fp1, fp2);
  if (distance < BOUNDARY_CONSTANTS.DUPLICATE_DETECTION.MAX_DISTANCE_METERS / 2) {
    reasons.push(`Very close proximity (${distance.toFixed(0)}m apart)`);
  }

  if (similarity >= BOUNDARY_CONSTANTS.DUPLICATE_DETECTION.STRICT_SIMILARITY_THRESHOLD) {
    reasons.push(`High similarity score (${(similarity * 100).toFixed(1)}%)`);
  }

  return reasons.length > 0 ? reasons.join(', ') : 'Multiple similarity factors detected';
}

/**
 * Update property fingerprint with new data
 * @param existingFingerprint Existing fingerprint
 * @param newMask New property mask
 * @param newAddress New address
 * @param newFeatures New building features
 * @returns Updated fingerprint
 */
export function updatePropertyFingerprint(
  existingFingerprint: PropertyFingerprint,
  newMask?: PropertyMask,
  newAddress?: string,
  newFeatures?: string[]
): PropertyFingerprint {
  if (!newMask && !newAddress && !newFeatures) {
    return existingFingerprint;
  }

  // If we have new mask data, regenerate the entire fingerprint
  if (newMask) {
    return generatePropertyFingerprint(
      newMask,
      newAddress || 'updated-address',
      newFeatures
    );
  }

  // Otherwise, update only the changed parts
  let updatedFingerprint = { ...existingFingerprint };

  if (newAddress) {
    const normalizedAddress = normalizeAddressForHashing(newAddress);
    updatedFingerprint.addressHash = crypto
      .createHash('sha256')
      .update(normalizedAddress)
      .digest('hex')
      .substring(0, 8);
  }

  if (newFeatures) {
    const normalizedFeatures = newFeatures
      .map(f => f.toLowerCase().trim())
      .sort()
      .join('|');
    updatedFingerprint.featuresHash = crypto
      .createHash('sha256')
      .update(normalizedFeatures)
      .digest('hex')
      .substring(0, 8);
  }

  // Regenerate main ID
  updatedFingerprint.id = crypto
    .createHash('sha256')
    .update(`${updatedFingerprint.coordinateHash}${updatedFingerprint.addressHash}${updatedFingerprint.featuresHash}${updatedFingerprint.zoneId}`)
    .digest('hex');

  return updatedFingerprint;
}

/**
 * Validate fingerprint integrity
 * @param fingerprint Fingerprint to validate
 * @returns True if valid
 */
export function validateFingerprintIntegrity(fingerprint: PropertyFingerprint): boolean {
  if (!fingerprint) {
    return false;
  }

  // Check for presence of all required fields
  const requiredFields = [
    'id', 'coordinateHash', 'addressHash', 'zoneId', 'area',
    'centerLat', 'centerLng', 'boundingBox', 'createdAt'
  ];
  const missingFields = requiredFields.filter(field => !(field in fingerprint));

  if (missingFields.length > 0) {
    console.error(`Fingerprint missing required fields: ${missingFields.join(', ')}`);
    return false;
  }

  // Check if the ID hash is correct by recalculating it
  const rehashedId = crypto
    .createHash('sha256')
    .update(`${fingerprint.coordinateHash}${fingerprint.addressHash}${fingerprint.featuresHash}${fingerprint.zoneId}`)
    .digest('hex');

  if (rehashedId !== fingerprint.id) {
    console.error('Fingerprint ID hash mismatch.');
    return false;
  }

  return true;
}
