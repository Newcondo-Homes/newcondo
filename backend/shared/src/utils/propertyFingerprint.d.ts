import { RectangleBounds, DuplicateDetectionResult } from '../types/geolocation';
export interface PropertyFingerprint {
    id: string;
    coordinateHash: string;
    addressHash: string;
    featuresHash: string;
    zoneId: string;
    area: number;
    centerLat: number;
    centerLng: number;
    boundingBox: {
        north: number;
        south: number;
        east: number;
        west: number;
    };
    createdAt: Date;
}
/**
 * Generate a unique fingerprint for a property based on its boundaries and characteristics
 */
export declare function generatePropertyFingerprint(bounds: RectangleBounds, address: string, buildingFeatures?: string[]): PropertyFingerprint;
/**
 * Detect potential duplicates based on property fingerprints and boundaries
 */
export declare function detectDuplicateProperties(newBounds: RectangleBounds, existingMasks: Array<{
    mask: RectangleBounds;
    fingerprint: PropertyFingerprint;
    propertyId: string;
    address: string;
}>, newAddress: string, strictMode?: boolean): DuplicateDetectionResult;
/**
 * Calculate similarity between two property fingerprints
 */
export declare function calculateSimilarity(fp1: PropertyFingerprint, fp2: PropertyFingerprint): number;
/**
 * Calculate overlap percentage between two property boundaries
 */
export declare function calculateOverlapPercentage(bounds1: RectangleBounds, bounds2: RectangleBounds): number;
export declare function updatePropertyFingerprint(existingFingerprint: PropertyFingerprint, newBounds?: RectangleBounds, newAddress?: string, newFeatures?: string[]): PropertyFingerprint;
export declare function validateFingerprintIntegrity(fingerprint: PropertyFingerprint): boolean;
//# sourceMappingURL=propertyFingerprint.d.ts.map