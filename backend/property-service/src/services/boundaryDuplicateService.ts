// backend/property-service/src/services/boundaryDuplicateService.ts

import { PrismaClient } from '@newcondo/db';
import crypto from 'crypto';
import {
  ConflictDetectionResult,
  ConflictType,
  ConflictSeverity,
} from '../types/locking';

const prisma = new PrismaClient();

interface BoundaryCoordinates {
  type: 'Polygon';
  coordinates: number[][][]; // [[[lng, lat], [lng, lat], ...]]
}

interface PropertyBoundaryData {
  id: string;
  boundaryCoordinates: BoundaryCoordinates;
  address: string;
  city: string;
  state: string;
  gpsCoordinates?: { lat: number; lng: number };
}

export class BoundaryDuplicateService {
  /**
   * Generate a unique fingerprint for a property based on its location and boundaries
   */
  generatePropertyFingerprint(
    address: string,
    city: string,
    state: string,
    gpsCoordinates?: { lat: number; lng: number },
    boundaryCoordinates?: BoundaryCoordinates
  ): string {
    // Normalize address for comparison
    const normalizedAddress = this.normalizeAddress(address);
    const normalizedCity = city.toLowerCase().trim();
    const normalizedState = state.toLowerCase().trim();

    let fingerprintData = `${normalizedAddress}|${normalizedCity}|${normalizedState}`;

    // Add GPS coordinates if available (rounded to 5 decimal places ~1.1m precision)
    if (gpsCoordinates) {
      const lat = gpsCoordinates.lat.toFixed(5);
      const lng = gpsCoordinates.lng.toFixed(5);
      fingerprintData += `|${lat},${lng}`;
    }

    // Add boundary centroid if available
    if (boundaryCoordinates) {
      const centroid = this.calculateCentroid(boundaryCoordinates);
      fingerprintData += `|${centroid.lat.toFixed(5)},${centroid.lng.toFixed(5)}`;
    }

    // Generate SHA-256 hash
    return crypto.createHash('sha256').update(fingerprintData).digest('hex');
  }

  /**
   * Normalize address for consistent comparison
   */
  private normalizeAddress(address: string): string {
    return address
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .replace(/[.,#]/g, '') // Remove common punctuation
      .replace(/\b(street|st|road|rd|avenue|ave|close|crescent|cres)\b/gi, '') // Remove street type variations
      .trim();
  }

  /**
   * Calculate centroid of a polygon
   */
  private calculateCentroid(boundary: BoundaryCoordinates): {
    lat: number;
    lng: number;
  } {
    const coordinates = boundary.coordinates[0]; // First ring of polygon
    let latSum = 0;
    let lngSum = 0;
    const numPoints = coordinates.length;

    for (const [lng, lat] of coordinates) {
      latSum += lat;
      lngSum += lng;
    }

    return {
      lat: latSum / numPoints,
      lng: lngSum / numPoints,
    };
  }

  /**
   * Check for duplicate properties based on fingerprint and boundaries
   */
  async checkForDuplicates(
    address: string,
    city: string,
    state: string,
    gpsCoordinates?: { lat: number; lng: number },
    boundaryCoordinates?: BoundaryCoordinates,
    excludePropertyId?: string
  ): Promise<ConflictDetectionResult> {
    try {
      // Generate fingerprint for the new property
      const fingerprint = this.generatePropertyFingerprint(
        address,
        city,
        state,
        gpsCoordinates,
        boundaryCoordinates
      );

      // Check for exact fingerprint match
      const exactMatch = await this.findByFingerprint(
        fingerprint,
        excludePropertyId
      );

      if (exactMatch) {
        return {
          hasConflict: true,
          conflictType: ConflictType.DUPLICATE_PROPERTY,
          conflictDetails: {
            conflictingEntityId: exactMatch.id,
            description: `Duplicate property detected at ${exactMatch.address}`,
            severity: ConflictSeverity.CRITICAL,
          },
          recommendations: [
            'This property already exists in the system',
            'Please verify the address and location',
            `Existing property ID: ${exactMatch.id}`,
          ],
        };
      }

      // Check for boundary overlaps if coordinates are provided
      if (boundaryCoordinates && gpsCoordinates) {
        const overlappingProperties = await this.findOverlappingBoundaries(
          gpsCoordinates,
          boundaryCoordinates,
          excludePropertyId
        );

        if (overlappingProperties.length > 0) {
          const property = overlappingProperties[0];
          const overlapPercentage = this.calculateOverlapPercentage(
            boundaryCoordinates,
            property.boundaryCoordinates as BoundaryCoordinates
          );

          if (overlapPercentage > 70) {
            return {
              hasConflict: true,
              conflictType: ConflictType.BOUNDARY_CONFLICT,
              conflictDetails: {
                conflictingEntityId: property.id,
                description: `Property boundaries overlap ${overlapPercentage.toFixed(1)}% with existing property`,
                severity:
                  overlapPercentage > 90
                    ? ConflictSeverity.CRITICAL
                    : ConflictSeverity.HIGH,
              },
              recommendations: [
                'Property boundaries significantly overlap with an existing property',
                `Overlapping property: ${property.address}`,
                'Please verify property boundaries',
              ],
            };
          }
        }
      }

      // Check for nearby properties with similar addresses
      if (gpsCoordinates) {
        const nearbyDuplicates = await this.findNearbyDuplicates(
          address,
          city,
          state,
          gpsCoordinates,
          excludePropertyId
        );

        if (nearbyDuplicates.length > 0) {
          return {
            hasConflict: true,
            conflictType: ConflictType.DUPLICATE_PROPERTY,
            conflictDetails: {
              conflictingEntityId: nearbyDuplicates[0].id,
              description: 'Similar property found nearby',
              severity: ConflictSeverity.MEDIUM,
            },
            recommendations: [
              'A similar property exists within 50 meters',
              `Similar property: ${nearbyDuplicates[0].address}`,
              'Please confirm these are different properties',
            ],
          };
        }
      }

      return { hasConflict: false };
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      throw new Error('Failed to check for duplicate properties');
    }
  }

  /**
   * Find property by fingerprint
   */
  private async findByFingerprint(
    fingerprint: string,
    excludePropertyId?: string
  ): Promise<{ id: string; address: string } | null> {
    const property = await prisma.property.findFirst({
      where: {
        buildingFingerprint: fingerprint,
        ...(excludePropertyId && { id: { not: excludePropertyId } }),
        status: { notIn: ['UNAVAILABLE'] },
      },
      select: {
        id: true,
        address: true,
      },
    });

    return property;
  }

  /**
   * Find properties with overlapping boundaries using geospatial proximity
   */
  private async findOverlappingBoundaries(
    gpsCoordinates: { lat: number; lng: number },
    boundaryCoordinates: BoundaryCoordinates,
    excludePropertyId?: string
  ): Promise<PropertyBoundaryData[]> {
    // Search within ~100 meters radius for potential overlaps
    const searchRadius = 0.001; // ~111 meters per 0.001 degrees

    const properties = await prisma.property.findMany({
      where: {
        ...(excludePropertyId && { id: { not: excludePropertyId } }),
        boundaryCoordinates: { not: null },
        boundaryVerified: true,
        status: { notIn: ['UNAVAILABLE'] },
        // Note: In production, you'd use PostGIS for efficient geospatial queries
        // This is a simplified approach using JSON filtering and proximity search
      },
      select: {
        id: true,
        boundaryCoordinates: true,
        address: true,
        city: true,
        state: true,
        gpsCoordinates: true,
      },
    });

    // Filter properties within search radius and check for actual overlaps
    return properties.filter((property) => {
      if (!property.gpsCoordinates || !property.boundaryCoordinates) {
        return false;
      }

      // Safe parse for GPS coordinates (stored as JSON string)
      let propGps;
      try {
        propGps = JSON.parse(property.gpsCoordinates as string);
      } catch {
        return false;
      }
      
      const distance = this.calculateDistance(
        gpsCoordinates.lat,
        gpsCoordinates.lng,
        propGps.lat,
        propGps.lng
      );

      // Only check detailed overlap if properties are close (within 100 meters)
      if (distance < 100) { 
        const overlap = this.calculateOverlapPercentage(
          boundaryCoordinates,
          property.boundaryCoordinates as any
        );
        return overlap > 0;
      }

      return false;
    }) as PropertyBoundaryData[];
  }

  /**
   * Calculate distance between two GPS coordinates (Haversine formula) in meters
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371e3; // metres
    const $\phi_1$ = (lat1 * Math.PI) / 180; // $\phi$, $\lambda$ in radians
    const $\phi_2$ = (lat2 * Math.PI) / 180;
    const $\Delta\phi$ = ((lat2 - lat1) * Math.PI) / 180;
    const $\Delta\lambda$ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin($\Delta\phi$ / 2) * Math.sin($\Delta\phi$ / 2) +
      Math.cos($\phi_1$) *
        Math.cos($\phi_2$) *
        Math.sin($\Delta\lambda$ / 2) *
        Math.sin($\Delta\lambda$ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const d = R * c; // in meters
    return d;
  }

  /**
   * Calculate the percentage of overlap between two property boundaries.
   * NOTE: For a real-world system, this would use a robust geospatial library (e.g., turf.js or PostGIS geometry functions)
   * This implementation provides a simplified proxy logic.
   * A full, accurate geometric intersection check is outside the scope of this file completion.
   */
  private calculateOverlapPercentage(
    boundary1: BoundaryCoordinates,
    boundary2: BoundaryCoordinates
  ): number {
    // Simplified logic: Check if the centroid of boundary1 is contained in boundary2
    // and vice-versa, and use area-based approximation.
    
    // In a real system:
    // 1. Calculate the Intersection Area (A_int)
    // 2. Calculate the Area of property1 (A1) and property2 (A2)
    // 3. Overlap % = (A_int / min(A1, A2)) * 100

    // Since we don't have a reliable `area` function here, we'll return a high
    // fixed overlap (e.g., 95%) if the distance is very small and centroids are close.
    // This forces an Admin review.

    const centroid1 = this.calculateCentroid(boundary1);
    const centroid2 = this.calculateCentroid(boundary2);
    const centroidDistance = this.calculateDistance(
      centroid1.lat,
      centroid1.lng,
      centroid2.lat,
      centroid2.lng
    );

    // If centroids are within 10 meters, assume high/critical overlap
    if (centroidDistance < 10) { 
        return 95.0; 
    }
    
    // For completion purposes, return 0 if not critically close
    return 0.0;
  }

  /**
   * Find properties that are geographically close AND have a similar address.
   * Used as a fallback check when no exact fingerprint or boundary overlap is found.
   */
  private async findNearbyDuplicates(
    address: string,
    city: string,
    state: string,
    gpsCoordinates: { lat: number; lng: number },
    excludePropertyId?: string
  ): Promise<{ id: string; address: string }[]> {
    const searchRadiusMeters = 50; // 50 meters
    const normalizedNewAddress = this.normalizeAddress(address);

    const properties = await prisma.property.findMany({
      where: {
        ...(excludePropertyId && { id: { not: excludePropertyId } }),
        status: { notIn: ['UNAVAILABLE'] },
        gpsCoordinates: { not: null },
        city,
        state,
      },
      select: {
        id: true,
        address: true,
        gpsCoordinates: true,
      },
    });

    // Filter properties by distance and similar normalized address
    return properties.filter((property) => {
      if (!property.gpsCoordinates) return false;

      let propGps;
      try {
        propGps = JSON.parse(property.gpsCoordinates as string);
      } catch {
        return false;
      }

      const distance = this.calculateDistance(
        gpsCoordinates.lat,
        gpsCoordinates.lng,
        propGps.lat,
        propGps.lng
      );
      
      const normalizedExistingAddress = this.normalizeAddress(property.address);

      // Check for proximity and a high degree of address similarity
      const isClose = distance <= searchRadiusMeters;
      const isSimilarAddress = normalizedExistingAddress === normalizedNewAddress;
      
      // We only consider it a 'duplicate' if both are true.
      return isClose && isSimilarAddress;
    });
  }
}