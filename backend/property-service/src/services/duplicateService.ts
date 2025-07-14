// backend/property-service/src/services/duplicateService.ts

import { db } from '@newcondo/db';
import { Property, PropertyDuplicate, DuplicateStatus } from '@prisma/client';
import { logger } from '../../../shared/src/utils/logger';
import { propertyFingerprintUtils } from '../../../shared/src/utils/propertyFingerprint';
import { geolocationUtils } from '../../../shared/src/utils/geolocation';

export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  duplicateProperty?: Property;
  confidence: number;
  reasons: string[];
}

export interface PropertyFingerprint {
  coordinates: {
    lat: number;
    lng: number;
  };
  boundaryHash: string;
  addressHash: string;
  buildingFeatures: string[];
  imageFingerprints?: string[];
}

export class DuplicateService {
  private static readonly DUPLICATE_THRESHOLD = 0.8; // 80% confidence threshold
  private static readonly PROXIMITY_THRESHOLD = 50; // 50 meters
  private static readonly BOUNDARY_OVERLAP_THRESHOLD = 0.7; // 70% overlap

  /**
   * Check if a property is a duplicate of existing properties
   */
  static async checkForDuplicates(
    propertyData: {
      coordinates: { lat: number; lng: number };
      boundaryCoordinates: any;
      address: string;
      city: string;
      state: string;
      features: string[];
      images?: string[];
    },
    excludePropertyId?: string
  ): Promise<DuplicateDetectionResult> {
    try {
      // Get properties in the same area
      const nearbyProperties = await this.getNearbyProperties(
        propertyData.coordinates,
        propertyData.city,
        propertyData.state,
        excludePropertyId
      );

      if (nearbyProperties.length === 0) {
        return {
          isDuplicate: false,
          confidence: 0,
          reasons: []
        };
      }

      // Check each nearby property for duplicates
      let highestConfidence = 0;
      let duplicateProperty: Property | undefined;
      let reasons: string[] = [];

      for (const property of nearbyProperties) {
        const result = await this.compareProperties(propertyData, property);
        
        if (result.confidence > highestConfidence) {
          highestConfidence = result.confidence;
          duplicateProperty = property;
          reasons = result.reasons;
        }
      }

      return {
        isDuplicate: highestConfidence >= this.DUPLICATE_THRESHOLD,
        duplicateProperty,
        confidence: highestConfidence,
        reasons
      };
    } catch (error) {
      logger.error('Error checking for duplicates:', error);
      throw new Error('Failed to check for duplicates');
    }
  }

  /**
   * Get properties within proximity threshold
   */
  private static async getNearbyProperties(
    coordinates: { lat: number; lng: number },
    city: string,
    state: string,
    excludePropertyId?: string
  ): Promise<Property[]> {
    try {
      // Get all properties in the same city/state
      const properties = await db.property.findMany({
        where: {
          city: {
            equals: city,
            mode: 'insensitive'
          },
          state: {
            equals: state,
            mode: 'insensitive'
          },
          id: excludePropertyId ? { not: excludePropertyId } : undefined,
          gpsCoordinates: { not: null },
          boundaryVerified: true
        },
        include: {
          images: true
        }
      });

      // Filter by proximity
      const nearbyProperties = properties.filter(property => {
        if (!property.gpsCoordinates) return false;
        
        try {
          const propertyCoords = JSON.parse(property.gpsCoordinates);
          const distance = geolocationUtils.calculateDistance(
            coordinates,
            propertyCoords
          );
          return distance <= this.PROXIMITY_THRESHOLD;
        } catch (error) {
          logger.error('Error parsing GPS coordinates:', error);
          return false;
        }
      });

      return nearbyProperties;
    } catch (error) {
      logger.error('Error getting nearby properties:', error);
      throw new Error('Failed to get nearby properties');
    }
  }

  /**
   * Compare two properties for similarity
   */
  private static async compareProperties(
    newProperty: {
      coordinates: { lat: number; lng: number };
      boundaryCoordinates: any;
      address: string;
      features: string[];
      images?: string[];
    },
    existingProperty: Property & { images: any[] }
  ): Promise<{ confidence: number; reasons: string[] }> {
    const reasons: string[] = [];
    let totalScore = 0;
    let maxScore = 0;

    try {
      // Parse existing property coordinates
      const existingCoords = JSON.parse(existingProperty.gpsCoordinates || '{}');
      
      // 1. Location proximity (30% weight)
      const locationWeight = 0.3;
      const distance = geolocationUtils.calculateDistance(
        newProperty.coordinates,
        existingCoords
      );
      
      const locationScore = Math.max(0, 1 - (distance / this.PROXIMITY_THRESHOLD));
      totalScore += locationScore * locationWeight;
      maxScore += locationWeight;

      if (distance < 10) {
        reasons.push('Properties are within 10 meters of each other');
      } else if (distance < 25) {
        reasons.push('Properties are within 25 meters of each other');
      }

      // 2. Boundary overlap (40% weight)
      const boundaryWeight = 0.4;
      if (existingProperty.boundaryCoordinates && newProperty.boundaryCoordinates) {
        const overlapScore = await this.calculateBoundaryOverlap(
          newProperty.boundaryCoordinates,
          existingProperty.boundaryCoordinates
        );
        
        totalScore += overlapScore * boundaryWeight;
        maxScore += boundaryWeight;

        if (overlapScore > 0.8) {
          reasons.push('Property boundaries overlap significantly');
        } else if (overlapScore > 0.5) {
          reasons.push('Property boundaries have moderate overlap');
        }
      } else {
        maxScore += boundaryWeight;
      }

      // 3. Address similarity (20% weight)
      const addressWeight = 0.2;
      const addressScore = this.calculateAddressSimilarity(
        newProperty.address,
        existingProperty.address
      );
      
      totalScore += addressScore * addressWeight;
      maxScore += addressWeight;

      if (addressScore > 0.8) {
        reasons.push('Addresses are very similar');
      } else if (addressScore > 0.6) {
        reasons.push('Addresses have moderate similarity');
      }

      // 4. Feature similarity (10% weight)
      const featureWeight = 0.1;
      const featureScore = this.calculateFeatureSimilarity(
        newProperty.features,
        existingProperty.features
      );
      
      totalScore += featureScore * featureWeight;
      maxScore += featureWeight;

      if (featureScore > 0.8) {
        reasons.push('Properties have very similar features');
      }

      // Calculate final confidence
      const confidence = maxScore > 0 ? totalScore / maxScore : 0;

      return { confidence, reasons };
    } catch (error) {
      logger.error('Error comparing properties:', error);
      return { confidence: 0, reasons: ['Error comparing properties'] };
    }
  }

  /**
   * Calculate boundary overlap percentage
   */
  private static async calculateBoundaryOverlap(
    boundary1: any,
    boundary2: any
  ): Promise<number> {
    try {
      // Convert boundaries to polygon format for overlap calculation
      const polygon1 = this.parsePolygon(boundary1);
      const polygon2 = this.parsePolygon(boundary2);

      if (!polygon1 || !polygon2) return 0;

      // Calculate overlap using geolocation utilities
      const overlapArea = geolocationUtils.calculatePolygonOverlap(polygon1, polygon2);
      const area1 = geolocationUtils.calculatePolygonArea(polygon1);
      const area2 = geolocationUtils.calculatePolygonArea(polygon2);

      const minArea = Math.min(area1, area2);
      return minArea > 0 ? overlapArea / minArea : 0;
    } catch (error) {
      logger.error('Error calculating boundary overlap:', error);
      return 0;
    }
  }

  /**
   * Parse polygon from boundary coordinates
   */
  private static parsePolygon(boundaryCoordinates: any): Array<{lat: number, lng: number}> | null {
    try {
      if (typeof boundaryCoordinates === 'string') {
        const parsed = JSON.parse(boundaryCoordinates);
        return parsed.coordinates || parsed;
      }
      return boundaryCoordinates.coordinates || boundaryCoordinates;
    } catch (error) {
      logger.error('Error parsing polygon:', error);
      return null;
    }
  }

  /**
   * Calculate address similarity using Levenshtein distance
   */
  private static calculateAddressSimilarity(address1: string, address2: string): number {
    const normalizedAddress1 = this.normalizeAddress(address1);
    const normalizedAddress2 = this.normalizeAddress(address2);

    const distance = this.levenshteinDistance(normalizedAddress1, normalizedAddress2);
    const maxLength = Math.max(normalizedAddress1.length, normalizedAddress2.length);
    
    return maxLength > 0 ? 1 - (distance / maxLength) : 0;
  }

  /**
   * Normalize address for comparison
   */
  private static normalizeAddress(address: string): string {
    return address
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Calculate feature similarity using Jaccard index
   */
  private static calculateFeatureSimilarity(features1: string[], features2: string[]): number {
    const set1 = new Set(features1.map(f => f.toLowerCase()));
    const set2 = new Set(features2.map(f => f.toLowerCase()));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Generate property fingerprint for storage
   */
  static async generatePropertyFingerprint(
    propertyData: {
      coordinates: { lat: number; lng: number };
      boundaryCoordinates: any;
      address: string;
      features: string[];
      images?: string[];
    }
  ): Promise<string> {
    try {
      const fingerprint: PropertyFingerprint = {
        coordinates: propertyData.coordinates,
        boundaryHash: propertyFingerprintUtils.hashBoundary(propertyData.boundaryCoordinates),
        addressHash: propertyFingerprintUtils.hashAddress(propertyData.address),
        buildingFeatures: propertyData.features.sort(),
        imageFingerprints: propertyData.images ? 
          await Promise.all(propertyData.images.map(img => 
            propertyFingerprintUtils.generateImageFingerprint(img)
          )) : undefined
      };

      return propertyFingerprintUtils.generateFingerprint(fingerprint);
    } catch (error) {
      logger.error('Error generating property fingerprint:', error);
      throw new Error('Failed to generate property fingerprint');
    }
  }

  /**
   * Report a duplicate property
   */
  static async reportDuplicate(
    originalPropertyId: string,
    duplicatePropertyId: string,
    reportedBy?: string
  ): Promise<PropertyDuplicate> {
    try {
      // Check if this duplicate report already exists
      const existingReport = await db.propertyDuplicate.findFirst({
        where: {
          originalPropertyId,
          duplicatePropertyId
        }
      });

      if (existingReport) {
        throw new Error('Duplicate report already exists');
      }

      // Create duplicate report
      const duplicateReport = await db.propertyDuplicate.create({
        data: {
          originalPropertyId,
          duplicatePropertyId,
          reportedBy,
          status: DuplicateStatus.PENDING
        }
      });

      logger.info('Duplicate property reported', {
        originalPropertyId,
        duplicatePropertyId,
        reportedBy
      });

      return duplicateReport;
    } catch (error) {
      logger.error('Error reporting duplicate:', error);
      throw new Error('Failed to report duplicate property');
    }
  }

  /**
   * Get all marked properties for overlay display
   */
  static async getMarkedPropertiesForOverlay(
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    }
  ): Promise<Array<{
    id: string;
    coordinates: { lat: number; lng: number };
    boundaryCoordinates: any;
    isOwn: boolean;
    ownerId: string;
  }>> {
    try {
      const properties = await db.property.findMany({
        where: {
          boundaryVerified: true,
          boundaryCoordinates: { not: null },
          gpsCoordinates: { not: null }
        },
        select: {
          id: true,
          gpsCoordinates: true,
          boundaryCoordinates: true,
          ownerId: true
        }
      });

      // Filter properties within bounds and format for overlay
      const overlayProperties = properties
        .map(property => {
          try {
            const coordinates = JSON.parse(property.gpsCoordinates || '{}');
            
            // Check if property is within bounds
            if (
              coordinates.lat >= bounds.south &&
              coordinates.lat <= bounds.north &&
              coordinates.lng >= bounds.west &&
              coordinates.lng <= bounds.east
            ) {
              return {
                id: property.id,
                coordinates,
                boundaryCoordinates: property.boundaryCoordinates,
                isOwn: false, // Will be set by caller based on current user
                ownerId: property.ownerId
              };
            }
            return null;
          } catch (error) {
            logger.error('Error parsing property coordinates:', error);
            return null;
          }
        })
        .filter(Boolean) as Array<{
          id: string;
          coordinates: { lat: number; lng: number };
          boundaryCoordinates: any;
          isOwn: boolean;
          ownerId: string;
        }>;

      return overlayProperties;
    } catch (error) {
      logger.error('Error getting marked properties for overlay:', error);
      throw new Error('Failed to get marked properties for overlay');
    }
  }

  /**
   * Validate property boundary constraints
   */
  static validateBoundaryConstraints(
    boundaryCoordinates: any,
    maxAreaSquareMeters: number = 10000 // 10,000 sqm default max
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      const polygon = this.parsePolygon(boundaryCoordinates);
      
      if (!polygon || polygon.length < 3) {
        errors.push('Invalid boundary polygon - must have at least 3 points');
        return { isValid: false, errors };
      }

      // Calculate area
      const area = geolocationUtils.calculatePolygonArea(polygon);
      
      if (area > maxAreaSquareMeters) {
        errors.push(`Property area (${Math.round(area)}sqm) exceeds maximum allowed (${maxAreaSquareMeters}sqm)`);
      }

      // Check for self-intersecting polygon
      if (geolocationUtils.isPolygonSelfIntersecting(polygon)) {
        errors.push('Property boundary cannot intersect itself');
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    } catch (error) {
      logger.error('Error validating boundary constraints:', error);
      return {
        isValid: false,
        errors: ['Error validating boundary constraints']
      };
    }
  }
}