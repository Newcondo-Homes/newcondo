// backend/property-service/src/services/boundaryService.ts

import { db } from '@newcondo/db';
import { GeoJSONPolygon, BoundaryValidationResult, PropertyBoundary, DuplicateCheckResult } from '../types/boundary';
import { mapsService } from './mapsService';
import { duplicateService } from './duplicateService';
import { BadRequestError, ConflictError, NotFoundError } from '../../../shared/src/utils/errors';

interface BoundaryCoordinates {
  lat: number;
  lng: number;
}

interface SaveBoundaryData {
  propertyId: string;
  boundaryCoordinates: BoundaryCoordinates[];
  gpsCoordinates: { lat: number; lng: number };
  boundaryImages?: string[];
  userId: string;
}

export class BoundaryService {
  /**
   * Validate property boundary coordinates
   */
  static async validateBoundary(coordinates: BoundaryCoordinates[]): Promise<BoundaryValidationResult> {
    try {
      // Minimum 3 points for a polygon
      if (coordinates.length < 3) {
        return {
          isValid: false,
          errors: ['Boundary must have at least 3 points']
        };
      }

      // Check if polygon is closed (first and last points should be the same)
      const first = coordinates[0];
      const last = coordinates[coordinates.length - 1];
      
      if (first.lat !== last.lat || first.lng !== last.lng) {
        // Auto-close the polygon
        coordinates.push(first);
      }

      // Calculate area to check if it's reasonable for a property
      const area = this.calculatePolygonArea(coordinates);
      const maxAreaSqMeters = 10000; // 10,000 sq meters max (1 hectare)
      const minAreaSqMeters = 10; // 10 sq meters minimum

      if (area > maxAreaSqMeters) {
        return {
          isValid: false,
          errors: [`Property area too large (${area.toFixed(2)} sq meters). Maximum allowed: ${maxAreaSqMeters} sq meters`]
        };
      }

      if (area < minAreaSqMeters) {
        return {
          isValid: false,
          errors: [`Property area too small (${area.toFixed(2)} sq meters). Minimum required: ${minAreaSqMeters} sq meters`]
        };
      }

      // Check for self-intersecting polygon
      if (this.isPolygonSelfIntersecting(coordinates)) {
        return {
          isValid: false,
          errors: ['Boundary cannot overlap itself']
        };
      }

      return {
        isValid: true,
        area: area,
        perimeter: this.calculatePolygonPerimeter(coordinates)
      };
    } catch (error) {
      console.error('Boundary validation error:', error);
      return {
        isValid: false,
        errors: ['Failed to validate boundary']
      };
    }
  }

  /**
   * Check for duplicate properties in the area
   */
  static async checkForDuplicates(
    coordinates: BoundaryCoordinates[],
    excludePropertyId?: string
  ): Promise<DuplicateCheckResult> {
    try {
      // Get all properties in the vicinity
      const center = this.calculatePolygonCenter(coordinates);
      const radius = 0.001; // ~100 meters radius

      const nearbyProperties = await db.property.findMany({
        where: {
          AND: [
            {
              id: {
                not: excludePropertyId
              }
            },
            {
              gpsCoordinates: {
                not: null
              }
            },
            {
              boundaryCoordinates: {
                not: null
              }
            }
          ]
        },
        select: {
          id: true,
          title: true,
          address: true,
          gpsCoordinates: true,
          boundaryCoordinates: true,
          boundaryVerified: true,
          owner: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });

      const duplicates = [];
      const overlaps = [];

      for (const property of nearbyProperties) {
        if (!property.gpsCoordinates || !property.boundaryCoordinates) continue;

        const existingCoords = property.boundaryCoordinates as BoundaryCoordinates[];
        
        // Check for exact overlap (duplicate)
        const overlapPercentage = this.calculateOverlapPercentage(coordinates, existingCoords);
        
        if (overlapPercentage > 80) {
          duplicates.push({
            propertyId: property.id,
            title: property.title,
            address: property.address,
            overlapPercentage,
            isVerified: property.boundaryVerified,
            owner: property.owner
          });
        } else if (overlapPercentage > 20) {
          overlaps.push({
            propertyId: property.id,
            title: property.title,
            address: property.address,
            overlapPercentage,
            isVerified: property.boundaryVerified,
            owner: property.owner
          });
        }
      }

      return {
        hasDuplicates: duplicates.length > 0,
        hasOverlaps: overlaps.length > 0,
        duplicates,
        overlaps
      };
    } catch (error) {
      console.error('Duplicate check error:', error);
      throw new Error('Failed to check for duplicates');
    }
  }

  /**
   * Save property boundary
   */
  static async saveBoundary(data: SaveBoundaryData): Promise<PropertyBoundary> {
    try {
      // Validate boundary
      const validation = await this.validateBoundary(data.boundaryCoordinates);
      if (!validation.isValid) {
        throw new BadRequestError(`Invalid boundary: ${validation.errors?.join(', ')}`);
      }

      // Check for duplicates
      const duplicateCheck = await this.checkForDuplicates(
        data.boundaryCoordinates,
        data.propertyId
      );

      if (duplicateCheck.hasDuplicates) {
        throw new ConflictError('Property boundary overlaps with existing property');
      }

      // Generate building fingerprint
      const fingerprint = await this.generateBuildingFingerprint(
        data.gpsCoordinates,
        data.boundaryCoordinates
      );

      // Update property with boundary data
      const updatedProperty = await db.property.update({
        where: { id: data.propertyId },
        data: {
          boundaryCoordinates: data.boundaryCoordinates,
          gpsCoordinates: JSON.stringify(data.gpsCoordinates),
          boundaryVerified: true,
          boundaryMarkedBy: data.userId,
          boundaryMarkedAt: new Date(),
          boundaryImages: data.boundaryImages || [],
          buildingFingerprint: fingerprint
        },
        include: {
          owner: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });

      return {
        propertyId: updatedProperty.id,
        coordinates: data.boundaryCoordinates,
        gpsCoordinates: data.gpsCoordinates,
        area: validation.area,
        perimeter: validation.perimeter,
        fingerprint,
        markedBy: data.userId,
        markedAt: updatedProperty.boundaryMarkedAt!,
        images: updatedProperty.boundaryImages,
        isVerified: true
      };
    } catch (error) {
      console.error('Save boundary error:', error);
      throw error;
    }
  }

  /**
   * Get existing boundaries in an area
   */
  static async getBoundariesInArea(
    center: { lat: number; lng: number },
    radius: number = 0.002
  ): Promise<PropertyBoundary[]> {
    try {
      const properties = await db.property.findMany({
        where: {
          AND: [
            {
              gpsCoordinates: {
                not: null
              }
            },
            {
              boundaryCoordinates: {
                not: null
              }
            }
          ]
        },
        select: {
          id: true,
          title: true,
          address: true,
          gpsCoordinates: true,
          boundaryCoordinates: true,
          boundaryVerified: true,
          boundaryMarkedAt: true,
          boundaryMarkedBy: true,
          owner: {
            select: {
              name: true
            }
          }
        }
      });

      return properties
        .filter(property => {
          if (!property.gpsCoordinates) return false;
          
          const coords = JSON.parse(property.gpsCoordinates);
          const distance = this.calculateDistance(center, coords);
          return distance <= radius;
        })
        .map(property => ({
          propertyId: property.id,
          coordinates: property.boundaryCoordinates as BoundaryCoordinates[],
          gpsCoordinates: JSON.parse(property.gpsCoordinates!),
          title: property.title,
          address: property.address,
          isVerified: property.boundaryVerified,
          markedAt: property.boundaryMarkedAt,
          markedBy: property.boundaryMarkedBy,
          ownerName: property.owner?.name
        }));
    } catch (error) {
      console.error('Get boundaries error:', error);
      throw new Error('Failed to fetch boundaries');
    }
  }

  /**
   * Generate building fingerprint for duplicate detection
   */
  private static async generateBuildingFingerprint(
    gpsCoordinates: { lat: number; lng: number },
    boundaryCoordinates: BoundaryCoordinates[]
  ): Promise<string> {
    const center = this.calculatePolygonCenter(boundaryCoordinates);
    const area = this.calculatePolygonArea(boundaryCoordinates);
    
    // Create a unique fingerprint based on location and shape
    const fingerprint = `${center.lat.toFixed(6)}-${center.lng.toFixed(6)}-${area.toFixed(2)}`;
    
    return fingerprint;
  }

  /**
   * Calculate polygon area using shoelace formula
   */
  private static calculatePolygonArea(coordinates: BoundaryCoordinates[]): number {
    if (coordinates.length < 3) return 0;

    let area = 0;
    const n = coordinates.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += coordinates[i].lat * coordinates[j].lng;
      area -= coordinates[j].lat * coordinates[i].lng;
    }

    area = Math.abs(area) / 2;
    
    // Convert to approximate square meters (rough conversion)
    const earthRadius = 6371000; // Earth's radius in meters
    const latFactor = Math.PI * earthRadius / 180;
    const lngFactor = latFactor * Math.cos(coordinates[0].lat * Math.PI / 180);
    
    return area * latFactor * lngFactor;
  }

  /**
   * Calculate polygon perimeter
   */
  private static calculatePolygonPerimeter(coordinates: BoundaryCoordinates[]): number {
    if (coordinates.length < 2) return 0;

    let perimeter = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
      perimeter += this.calculateDistance(coordinates[i], coordinates[i + 1]);
    }

    return perimeter;
  }

  /**
   * Calculate distance between two points
   */
  private static calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Calculate polygon center point
   */
  private static calculatePolygonCenter(coordinates: BoundaryCoordinates[]): { lat: number; lng: number } {
    const totalPoints = coordinates.length;
    if (totalPoints === 0) return { lat: 0, lng: 0 };

    const sum = coordinates.reduce(
      (acc, coord) => ({
        lat: acc.lat + coord.lat,
        lng: acc.lng + coord.lng
      }),
      { lat: 0, lng: 0 }
    );

    return {
      lat: sum.lat / totalPoints,
      lng: sum.lng / totalPoints
    };
  }

  /**
   * Check if polygon is self-intersecting
   */
  private static isPolygonSelfIntersecting(coordinates: BoundaryCoordinates[]): boolean {
    // Simple check for self-intersection
    // This is a basic implementation - you might want to use a more robust algorithm
    const n = coordinates.length;
    
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 2; j < n - 1; j++) {
        if (i === 0 && j === n - 2) continue; // Skip adjacent segments
        
        const line1 = {
          start: coordinates[i],
          end: coordinates[i + 1]
        };
        const line2 = {
          start: coordinates[j],
          end: coordinates[j + 1]
        };
        
        if (this.doLinesIntersect(line1, line2)) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Check if two line segments intersect
   */
  private static doLinesIntersect(
    line1: { start: BoundaryCoordinates; end: BoundaryCoordinates },
    line2: { start: BoundaryCoordinates; end: BoundaryCoordinates }
  ): boolean {
    const { start: p1, end: p2 } = line1;
    const { start: p3, end: p4 } = line2;
    
    const denom = (p1.lat - p2.lat) * (p3.lng - p4.lng) - (p1.lng - p2.lng) * (p3.lat - p4.lat);
    if (Math.abs(denom) < 1e-10) return false; // Lines are parallel
    
    const t = ((p1.lat - p3.lat) * (p3.lng - p4.lng) - (p1.lng - p3.lng) * (p3.lat - p4.lat)) / denom;
    const u = -((p1.lat - p2.lat) * (p1.lng - p3.lng) - (p1.lng - p2.lng) * (p1.lat - p3.lat)) / denom;
    
    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
  }

  /**
   * Calculate overlap percentage between two polygons
   */
  private static calculateOverlapPercentage(
    polygon1: BoundaryCoordinates[],
    polygon2: BoundaryCoordinates[]
  ): number {
    // This is a simplified implementation
    // For production, you'd want to use a proper polygon clipping library
    
    const center1 = this.calculatePolygonCenter(polygon1);
    const center2 = this.calculatePolygonCenter(polygon2);
    
    const distance = this.calculateDistance(center1, center2);
    const avgRadius1 = Math.sqrt(this.calculatePolygonArea(polygon1) / Math.PI);
    const avgRadius2 = Math.sqrt(this.calculatePolygonArea(polygon2) / Math.PI);
    
    // Simple overlap estimation based on distance and size
    const maxDistance = avgRadius1 + avgRadius2;
    
    if (distance >= maxDistance) return 0;
    if (distance <= Math.abs(avgRadius1 - avgRadius2)) return 100;
    
    // Approximate overlap percentage
    const overlap = (maxDistance - distance) / maxDistance;
    return Math.round(overlap * 100);
  }
}