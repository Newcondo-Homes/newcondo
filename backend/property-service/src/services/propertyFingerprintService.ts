// backend/property-service/src/services/propertyFingerprintService.ts
import { PrismaClient } from '@newcondo/db';
import crypto from 'crypto';

const prisma = new PrismaClient();

interface PropertyFingerprint {
  coordinates: Array<{ lat: number; lng: number }>;
  features: string[];
  area: number;
  perimeter: number;
  address: string;
  propertyType: string;
}

interface FingerprintMatch {
  propertyId: string;
  similarity: number;
  matchType: 'EXACT' | 'COORDINATES' | 'FEATURES' | 'PARTIAL';
  confidence: number;
}

export class PropertyFingerprintService {
  /**
   * Generate a unique fingerprint for a property
   */
  generateFingerprint(propertyData: PropertyFingerprint): string {
    const {
      coordinates,
      features,
      area,
      perimeter,
      address,
      propertyType
    } = propertyData;

    // Normalize coordinates to reduce minor GPS variations
    const normalizedCoords = this.normalizeCoordinates(coordinates);
    
    // Create feature hash
    const featureHash = this.createFeatureHash(features);
    
    // Create location hash
    const locationHash = this.createLocationHash(normalizedCoords, address);
    
    // Create dimension hash
    const dimensionHash = this.createDimensionHash(area, perimeter);
    
    // Combine all hashes
    const combinedData = {
      location: locationHash,
      features: featureHash,
      dimensions: dimensionHash,
      type: propertyType.toLowerCase()
    };
    
    const fingerprint = crypto
      .createHash('sha256')
      .update(JSON.stringify(combinedData))
      .digest('hex');
    
    return fingerprint;
  }

  /**
   * Check for potential duplicates based on fingerprint
   */
  async checkDuplicates(
    propertyData: PropertyFingerprint,
    excludePropertyId?: string
  ): Promise<FingerprintMatch[]> {
    const fingerprint = this.generateFingerprint(propertyData);
    
    // Get all existing properties for comparison
    const existingProperties = await prisma.property.findMany({
      where: {
        id: excludePropertyId ? { not: excludePropertyId } : undefined,
        status: { not: 'DRAFT' }
      },
      select: {
        id: true,
        buildingFingerprint: true,
        boundaryCoordinates: true,
        features: true,
        area: true,
        address: true,
        propertyType: true,
        title: true,
        owner: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    const matches: FingerprintMatch[] = [];

    for (const property of existingProperties) {
      if (!property.buildingFingerprint || !property.boundaryCoordinates) {
        continue;
      }

      const similarity = this.calculateSimilarity(
        propertyData,
        {
          coordinates: property.boundaryCoordinates as any,
          features: property.features,
          area: parseFloat(property.area || '0'),
          perimeter: 0, // Calculate if needed
          address: property.address,
          propertyType: property.propertyType
        }
      );

      if (similarity.confidence > 0.7) {
        matches.push({
          propertyId: property.id,
          similarity: similarity.score,
          matchType: similarity.type,
          confidence: similarity.confidence
        });
      }
    }

    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Verify property uniqueness before creation
   */
  async verifyUniqueness(
    propertyData: PropertyFingerprint,
    excludePropertyId?: string
  ): Promise<{
    isUnique: boolean;
    duplicates: FingerprintMatch[];
    confidence: number;
  }> {
    const duplicates = await this.checkDuplicates(propertyData, excludePropertyId);
    
    const highConfidenceMatches = duplicates.filter(match => match.confidence > 0.9);
    
    return {
      isUnique: highConfidenceMatches.length === 0,
      duplicates,
      confidence: duplicates.length > 0 ? duplicates[0].confidence : 0
    };
  }

  /**
   * Calculate similarity between two properties
   */
  private calculateSimilarity(
    property1: PropertyFingerprint,
    property2: PropertyFingerprint
  ): { score: number; type: FingerprintMatch['matchType']; confidence: number } {
    let totalScore = 0;
    let maxScore = 0;
    
    // Coordinate similarity (40% weight)
    const coordSimilarity = this.calculateCoordinateSimilarity(
      property1.coordinates,
      property2.coordinates
    );
    totalScore += coordSimilarity * 0.4;
    maxScore += 0.4;
    
    // Feature similarity (30% weight)
    const featureSimilarity = this.calculateFeatureSimilarity(
      property1.features,
      property2.features
    );
    totalScore += featureSimilarity * 0.3;
    maxScore += 0.3;
    
    // Dimension similarity (20% weight)
    const dimensionSimilarity = this.calculateDimensionSimilarity(
      property1.area,
      property2.area
    );
    totalScore += dimensionSimilarity * 0.2;
    maxScore += 0.2;
    
    // Address similarity (10% weight)
    const addressSimilarity = this.calculateAddressSimilarity(
      property1.address,
      property2.address
    );
    totalScore += addressSimilarity * 0.1;
    maxScore += 0.1;
    
    const score = totalScore / maxScore;
    
    let matchType: FingerprintMatch['matchType'] = 'PARTIAL';
    if (coordSimilarity > 0.95) matchType = 'EXACT';
    else if (coordSimilarity > 0.8) matchType = 'COORDINATES';
    else if (featureSimilarity > 0.8) matchType = 'FEATURES';
    
    return {
      score,
      type: matchType,
      confidence: score
    };
  }

  /**
   * Normalize coordinates to reduce GPS variations
   */
  private normalizeCoordinates(
    coordinates: Array<{ lat: number; lng: number }>
  ): Array<{ lat: number; lng: number }> {
    const precision = 6; // ~1 meter precision
    
    return coordinates.map(coord => ({
      lat: Math.round(coord.lat * Math.pow(10, precision)) / Math.pow(10, precision),
      lng: Math.round(coord.lng * Math.pow(10, precision)) / Math.pow(10, precision)
    }));
  }

  /**
   * Create hash for property features
   */
  private createFeatureHash(features: string[]): string {
    const normalizedFeatures = features
      .map(f => f.toLowerCase().trim())
      .sort()
      .join('|');
    
    return crypto
      .createHash('md5')
      .update(normalizedFeatures)
      .digest('hex');
  }

  /**
   * Create hash for location data
   */
  private createLocationHash(
    coordinates: Array<{ lat: number; lng: number }>,
    address: string
  ): string {
    const coordString = coordinates
      .map(c => `${c.lat},${c.lng}`)
      .join('|');
    
    const normalizedAddress = address.toLowerCase().replace(/\s+/g, ' ').trim();
    
    return crypto
      .createHash('md5')
      .update(`${coordString}:${normalizedAddress}`)
      .digest('hex');
  }

  /**
   * Create hash for property dimensions
   */
  private createDimensionHash(area: number, perimeter: number): string {
    // Round to reduce minor calculation differences
    const roundedArea = Math.round(area);
    const roundedPerimeter = Math.round(perimeter);
    
    return crypto
      .createHash('md5')
      .update(`${roundedArea}:${roundedPerimeter}`)
      .digest('hex');
  }

  /**
   * Calculate coordinate similarity using Hausdorff distance
   */
  private calculateCoordinateSimilarity(
    coords1: Array<{ lat: number; lng: number }>,
    coords2: Array<{ lat: number; lng: number }>
  ): number {
    if (coords1.length === 0 || coords2.length === 0) return 0;
    
    const threshold = 0.0001; // ~11 meters
    
    // Calculate centroid distance
    const centroid1 = this.calculateCentroid(coords1);
    const centroid2 = this.calculateCentroid(coords2);
    const centroidDistance = this.calculateDistance(centroid1, centroid2);
    
    if (centroidDistance > threshold * 10) return 0;
    
    // Calculate Hausdorff distance
    const hausdorffDistance = this.calculateHausdorffDistance(coords1, coords2);
    
    // Convert distance to similarity (closer = more similar)
    return Math.max(0, 1 - (hausdorffDistance / threshold));
  }

  /**
   * Calculate feature similarity using Jaccard index
   */
  private calculateFeatureSimilarity(features1: string[], features2: string[]): number {
    if (features1.length === 0 && features2.length === 0) return 1;
    if (features1.length === 0 || features2.length === 0) return 0;
    
    const set1 = new Set(features1.map(f => f.toLowerCase()));
    const set2 = new Set(features2.map(f => f.toLowerCase()));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  /**
   * Calculate dimension similarity
   */
  private calculateDimensionSimilarity(area1: number, area2: number): number {
    if (area1 === 0 && area2 === 0) return 1;
    if (area1 === 0 || area2 === 0) return 0;
    
    const ratio = Math.min(area1, area2) / Math.max(area1, area2);
    return ratio;
  }

  /**
   * Calculate address similarity using Levenshtein distance
   */
  private calculateAddressSimilarity(address1: string, address2: string): number {
    const normalized1 = address1.toLowerCase().replace(/\s+/g, ' ').trim();
    const normalized2 = address2.toLowerCase().replace(/\s+/g, ' ').trim();
    
    const distance = this.levenshteinDistance(normalized1, normalized2);
    const maxLength = Math.max(normalized1.length, normalized2.length);
    
    return maxLength === 0 ? 1 : 1 - (distance / maxLength);
  }

  /**
   * Calculate centroid of coordinates
   */
  private calculateCentroid(coordinates: Array<{ lat: number; lng: number }>): { lat: number; lng: number } {
    const sum = coordinates.reduce(
      (acc, coord) => ({
        lat: acc.lat + coord.lat,
        lng: acc.lng + coord.lng
      }),
      { lat: 0, lng: 0 }
    );
    
    return {
      lat: sum.lat / coordinates.length,
      lng: sum.lng / coordinates.length
    };
  }

  /**
   * Calculate Hausdorff distance between two sets of coordinates
   */
  private calculateHausdorffDistance(
    coords1: Array<{ lat: number; lng: number }>,
    coords2: Array<{ lat: number; lng: number }>
  ): number {
    const distance1to2 = Math.max(
      ...coords1.map(c1 => 
        Math.min(...coords2.map(c2 => this.calculateDistance(c1, c2)))
      )
    );
    
    const distance2to1 = Math.max(
      ...coords2.map(c2 => 
        Math.min(...coords1.map(c1 => this.calculateDistance(c1, c2)))
      )
    );
    
    return Math.max(distance1to2, distance2to1);
  }

  /**
   * Calculate distance between two coordinates
   */
  private calculateDistance(
    coord1: { lat: number; lng: number },
    coord2: { lat: number; lng: number }
  ): number {
    return Math.sqrt(
      Math.pow(coord1.lat - coord2.lat, 2) + 
      Math.pow(coord1.lng - coord2.lng, 2)
    );
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
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
}