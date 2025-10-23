// backend/marking-service/src/services/qualityAssuranceService.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class QualityAssuranceService {
  private readonly MIN_IMAGES = 3;
  private readonly MIN_BOUNDARY_POINTS = 4;
  private readonly MAX_BOUNDARY_AREA_SQM = 10000; // 10,000 square meters (reasonable max for residential)
  private readonly MAX_DISTANCE_FROM_PROPERTY_M = 100; // 100 meters

  /**
   * Run quality checks on marking submission
   */
  async runQualityChecks(data: {
    jobId: string;
    boundaryData: any;
    completionImages: string[];
    propertyCoordinates?: string;
  }): Promise<{ passed: boolean; reason?: string; warnings?: string[] }> {
    const { boundaryData, completionImages, propertyCoordinates } = data;
    const warnings: string[] = [];

    // Check 1: Minimum number of images
    if (completionImages.length < this.MIN_IMAGES) {
      return {
        passed: false,
        reason: `At least ${this.MIN_IMAGES} completion images are required`,
      };
    }

    // Check 2: Validate boundary data structure
    if (!boundaryData || !boundaryData.coordinates || !Array.isArray(boundaryData.coordinates)) {
      return {
        passed: false,
        reason: 'Invalid boundary data format',
      };
    }

    // Check 3: Minimum boundary points
    if (boundaryData.coordinates.length < this.MIN_BOUNDARY_POINTS) {
      return {
        passed: false,
        reason: `Boundary must have at least ${this.MIN_BOUNDARY_POINTS} points`,
      };
    }

    // Check 4: Validate coordinate format
    for (const coord of boundaryData.coordinates) {
      if (!coord.lat || !coord.lng || typeof coord.lat !== 'number' || typeof coord.lng !== 'number') {
        return {
          passed: false,
          reason: 'Invalid coordinate format',
        };
      }

      // Check if coordinates are within Nigeria bounds
      if (!this.isWithinNigeria(coord.lat, coord.lng)) {
        return {
          passed: false,
          reason: 'Coordinates are outside Nigeria',
        };
      }
    }

    // Check 5: Boundary area validation
    const area = this.calculatePolygonArea(boundaryData.coordinates);
    if (area > this.MAX_BOUNDARY_AREA_SQM) {
      return {
        passed: false,
        reason: `Boundary area (${Math.round(area)}m²) exceeds maximum allowed (${this.MAX_BOUNDARY_AREA_SQM}m²)`,
      };
    }

    if (area < 10) {
      warnings.push('Boundary area seems unusually small');
    }

    // Check 6: Boundary closure (polygon should be closed)
    if (!this.isPolygonClosed(boundaryData.coordinates)) {
      warnings.push('Boundary polygon is not properly closed');
    }

    // Check 7: Distance from original property coordinates
    if (propertyCoordinates) {
      const propertyCoords = JSON.parse(propertyCoordinates);
      const boundaryCentroid = this.calculateCentroid(boundaryData.coordinates);
      const distance = this.calculateDistance(
        propertyCoords.lat,
        propertyCoords.lng,
        boundaryCentroid.lat,
        boundaryCentroid.lng
      );

      if (distance > this.MAX_DISTANCE_FROM_PROPERTY_M) {
        return {
          passed: false,
          reason: `Marked boundary is too far from property location (${Math.round(distance)}m)`,
        };
      }

      if (distance > 50) {
        warnings.push(`Marked boundary is ${Math.round(distance)}m from property pin`);
      }
    }

    // Check 8: Validate image URLs
    for (const imageUrl of completionImages) {
      if (!this.isValidImageUrl(imageUrl)) {
        return {
          passed: false,
          reason: 'One or more invalid image URLs',
        };
      }
    }

    // Check 9: Check for self-intersecting polygon
    if (this.isPolygonSelfIntersecting(boundaryData.coordinates)) {
      return {
        passed: false,
        reason: 'Boundary polygon intersects itself',
      };
    }

    return {
      passed: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Calculate polygon area using Shoelace formula
   */
  private calculatePolygonArea(coordinates: { lat: number; lng: number }[]): number {
    if (coordinates.length < 3) return 0;

    let area = 0;
    const R = 6371000; // Earth radius in meters

    for (let i = 0; i < coordinates.length; i++) {
      const j = (i + 1) % coordinates.length;
      const lat1 = (coordinates[i].lat * Math.PI) / 180;
      const lat2 = (coordinates[j].lat * Math.PI) / 180;
      const lng1 = (coordinates[i].lng * Math.PI) / 180;
      const lng2 = (coordinates[j].lng * Math.PI) / 180;

      area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
    }

    area = Math.abs((area * R * R) / 2);
    return area;
  }

  /**
   * Calculate centroid of polygon
   */
  private calculateCentroid(coordinates: { lat: number; lng: number }[]): { lat: number; lng: number } {
    const sumLat = coordinates.reduce((sum, coord) => sum + coord.lat, 0);
    const sumLng = coordinates.reduce((sum, coord) => sum + coord.lng, 0);

    return {
      lat: sumLat / coordinates.length,
      lng: sumLng / coordinates.length,
    };
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Earth radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Check if polygon is properly closed
   */
  private isPolygonClosed(coordinates: { lat: number; lng: number }[]): boolean {
    if (coordinates.length < 4) return false;

    const first = coordinates[0];
    const last = coordinates[coordinates.length - 1];

    const distance = this.calculateDistance(first.lat, first.lng, last.lat, last.lng);
    return distance < 1; // Within 1 meter
  }

  /**
   * Check if polygon self-intersects
   */
  private isPolygonSelfIntersecting(coordinates: { lat: number; lng: number }[]): boolean {
    // Simplified check - in production, use a proper computational geometry library
    for (let i = 0; i < coordinates.length - 1; i++) {
      for (let j = i + 2; j < coordinates.length - 1; j++) {
        if (i === 0 && j === coordinates.length - 2) continue; // Skip adjacent edges

        const intersects = this.lineSegmentsIntersect(
          coordinates[i],
          coordinates[i + 1],
          coordinates[j],
          coordinates[j + 1]
        );

        if (intersects) return true;
      }
    }

    return false;
  }

  /**
   * Check if two line segments intersect
   */
  private lineSegmentsIntersect(
    p1: { lat: number; lng: number },
    p2: { lat: number; lng: number },
    p3: { lat: number; lng: number },
    p4: { lat: number; lng: number }
  ): boolean {
    const ccw = (A: any, B: any, C: any) => {
      return (C.lng - A.lng) * (B.lat - A.lat) > (B.lng - A.lng) * (C.lat - A.lat);
    };

    return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
  }

  /**
   * Check if coordinates are within Nigeria bounds
   */
  private isWithinNigeria(lat: number, lng: number): boolean {
    // Nigeria approximate bounds
    const NIGERIA_BOUNDS = {
      minLat: 4.0,
      maxLat: 14.0,
      minLng: 2.5,
      maxLng: 15.0,
    };

    return (
      lat >= NIGERIA_BOUNDS.minLat &&
      lat <= NIGERIA_BOUNDS.maxLat &&
      lng >= NIGERIA_BOUNDS.minLng &&
      lng <= NIGERIA_BOUNDS.maxLng
    );
  }

  /**
   * Validate image URL
   */
  private isValidImageUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Check for duplicate boundaries
   */
  async checkForDuplicateBoundary(boundaryData: any): Promise<{ isDuplicate: boolean; propertyId?: string }> {
    const centroid = this.calculateCentroid(boundaryData.coordinates);

    // Find properties with similar centroids
    const properties = await prisma.property.findMany({
      where: {
        boundaryVerified: true,
        boundaryCoordinates: { not: null },
      },
      select: {
        id: true,
        boundaryCoordinates: true,
        address: true,
      },
    });

    for (const property of properties) {
      if (!property.boundaryCoordinates) continue;

      const existingCentroid = this.calculateCentroid(
        (property.boundaryCoordinates as any).coordinates
      );

      const distance = this.calculateDistance(
        centroid.lat,
        centroid.lng,
        existingCentroid.lat,
        existingCentroid.lng
      );

      // If centroids are within 10 meters, likely duplicate
      if (distance < 10) {
        return {
          isDuplicate: true,
          propertyId: property.id,
        };
      }
    }

    return { isDuplicate: false };
  }

  /**
   * Get quality score for a marking
   */
  async calculateQualityScore(data: {
    boundaryData: any;
    completionImages: string[];
    completionTime: number; // in minutes
  }): Promise<number> {
    let score = 100;

    // Deduct for boundary issues
    const area = this.calculatePolygonArea(data.boundaryData.coordinates);
    if (area < 20) score -= 10; // Very small area
    if (area > 5000) score -= 5; // Very large area

    if (!this.isPolygonClosed(data.boundaryData.coordinates)) score -= 10;
    if (this.isPolygonSelfIntersecting(data.boundaryData.coordinates)) score -= 20;

    // Reward for more images
    if (data.completionImages.length > 5) score += 5;
    if (data.completionImages.length > 10) score += 10;

    // Consider completion time
    if (data.completionTime < 60) score += 10; // Completed in under 1 hour
    if (data.completionTime > 150) score -= 10; // Took more than 2.5 hours

    return Math.max(0, Math.min(100, score));
  }
}

export default QualityAssuranceService;