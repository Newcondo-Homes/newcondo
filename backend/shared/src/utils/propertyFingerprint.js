"use strict";
// backend/shared/src/utils/fingerprint.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePropertyFingerprint = generatePropertyFingerprint;
exports.detectDuplicateProperties = detectDuplicateProperties;
exports.calculateSimilarity = calculateSimilarity;
exports.calculateOverlapPercentage = calculateOverlapPercentage;
exports.updatePropertyFingerprint = updatePropertyFingerprint;
exports.validateFingerprintIntegrity = validateFingerprintIntegrity;
const crypto_1 = __importDefault(require("crypto"));
const geolocation_1 = require("./geolocation");
const boundaries_1 = require("../constants/boundaries");
/**
 * Generate a unique fingerprint for a property based on its boundaries and characteristics
 */
function generatePropertyFingerprint(bounds, address, buildingFeatures) {
    const normalizedCoords = normalizeCoordinatesForHashing(bounds);
    const area = (0, geolocation_1.calculatePolygonArea)(bounds);
    const center = (0, geolocation_1.getPolygonCenter)(bounds);
    const boundingBox = (0, geolocation_1.getBoundingBox)([bounds.southWest, bounds.northEast]);
    const coordString = normalizedCoords
        .map(coord => `${coord.lat.toFixed(6)},${coord.lng.toFixed(6)}`)
        .join('|');
    const coordinateHash = crypto_1.default
        .createHash('sha256')
        .update(coordString)
        .digest('hex')
        .substring(0, 16);
    const normalizedAddress = normalizeAddressForHashing(address);
    const addressHash = crypto_1.default
        .createHash('sha256')
        .update(normalizedAddress)
        .digest('hex')
        .substring(0, 8);
    let featuresHash = '';
    if (buildingFeatures && buildingFeatures.length > 0) {
        const normalizedFeatures = buildingFeatures
            .map(f => f.toLowerCase().trim())
            .sort()
            .join('|');
        featuresHash = crypto_1.default
            .createHash('sha256')
            .update(normalizedFeatures)
            .digest('hex')
            .substring(0, 8);
    }
    const zoneId = getGeographicZone(center);
    const mainFingerprint = crypto_1.default
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
            north: parseFloat(boundingBox.northEast.lat.toFixed(6)),
            south: parseFloat(boundingBox.southWest.lat.toFixed(6)),
            east: parseFloat(boundingBox.northEast.lng.toFixed(6)),
            west: parseFloat(boundingBox.southWest.lng.toFixed(6))
        },
        createdAt: new Date()
    };
}
/**
 * Detect potential duplicates based on property fingerprints and boundaries
 */
function detectDuplicateProperties(newBounds, existingMasks, newAddress, strictMode = false) {
    const newFingerprint = generatePropertyFingerprint(newBounds, newAddress);
    const matchedDuplicates = [];
    for (const existing of existingMasks) {
        const similarity = calculateSimilarity(newFingerprint, existing.fingerprint);
        const overlapPercentage = calculateOverlapPercentage(newBounds, existing.mask);
        const isDuplicate = strictMode
            ? isStrictDuplicate(newFingerprint, existing.fingerprint, overlapPercentage)
            : isLooseDuplicate(newFingerprint, existing.fingerprint, overlapPercentage);
        if (isDuplicate) {
            matchedDuplicates.push({
                propertyId: existing.propertyId,
                similarity,
                overlapPercentage,
                reason: generateDuplicateReason(newFingerprint, existing.fingerprint, overlapPercentage, similarity)
            });
        }
    }
    // FIXED: Structured directly to avoid non-existent 'duplicates' property flag mapping
    return {
        isDuplicate: matchedDuplicates.length > 0,
        confidence: matchedDuplicates.length > 0 ? Math.max(...matchedDuplicates.map(d => d.similarity)) : 0,
        newPropertyFingerprint: newFingerprint,
        // If your DuplicateDetectionResult type uses a different key name like 'matches' or 'potentialDuplicates', change this key:
        potentialDuplicates: matchedDuplicates
    };
}
/**
 * Calculate similarity between two property fingerprints
 */
function calculateSimilarity(fp1, fp2) {
    let totalScore = 0;
    let maxScore = 0;
    const distance = calculateDistanceBetweenCenters(fp1, fp2);
    // Fallback to max threshold constraint parameter
    const maxDistance = boundaries_1.VALIDATION_THRESHOLDS.MAX_DISTANCE_FROM_DECLARED_LOCATION || 1000;
    const proximityScore = Math.max(0, 1 - (distance / maxDistance));
    totalScore += proximityScore * 0.4;
    maxScore += 0.4;
    const areaRatio = Math.min(fp1.area, fp2.area) / Math.max(fp1.area, fp2.area);
    const areaScore = areaRatio > 0.75 ? areaRatio : 0;
    totalScore += areaScore * 0.25;
    maxScore += 0.25;
    const addressScore = fp1.addressHash === fp2.addressHash ? 1 : 0;
    totalScore += addressScore * 0.2;
    maxScore += 0.2;
    const zoneScore = fp1.zoneId === fp2.zoneId ? 1 : 0;
    totalScore += zoneScore * 0.1;
    maxScore += 0.1;
    const featuresScore = fp1.featuresHash && fp2.featuresHash && fp1.featuresHash === fp2.featuresHash ? 1 : 0;
    totalScore += featuresScore * 0.05;
    maxScore += 0.05;
    return maxScore > 0 ? totalScore / maxScore : 0;
}
/**
 * Calculate overlap percentage between two property boundaries
 */
function calculateOverlapPercentage(bounds1, bounds2) {
    if (!(0, geolocation_1.doPolygonsOverlap)(bounds1, bounds2)) {
        return 0;
    }
    const overlapArea = calculateBoundingBoxOverlap(bounds1, bounds2);
    const area1 = (0, geolocation_1.calculatePolygonArea)(bounds1);
    const area2 = (0, geolocation_1.calculatePolygonArea)(bounds2);
    const unionArea = area1 + area2 - overlapArea;
    return unionArea > 0 ? (overlapArea / unionArea) * 100 : 0;
}
/**
 * Check if two properties are strict duplicates using explicit schema rules
 */
function isStrictDuplicate(fp1, fp2, overlapPercentage) {
    const strictOverlap = boundaries_1.VALIDATION_THRESHOLDS.DEFINITE_DUPLICATE_THRESHOLD || 75;
    return (overlapPercentage >= strictOverlap &&
        calculateSimilarity(fp1, fp2) >= 0.85);
}
/**
 * Check if two properties are loose duplicates using threshold parameters
 */
function isLooseDuplicate(fp1, fp2, overlapPercentage) {
    const looseOverlap = boundaries_1.VALIDATION_THRESHOLDS.SIGNIFICANT_OVERLAP_THRESHOLD || 25;
    return (overlapPercentage >= looseOverlap ||
        calculateSimilarity(fp1, fp2) >= 0.55);
}
function normalizeCoordinatesForHashing(bounds) {
    const points = [bounds.southWest, bounds.northEast];
    return points
        .map(coord => ({
        lat: parseFloat(coord.lat.toFixed(6)),
        lng: parseFloat(coord.lng.toFixed(6))
    }))
        .sort((a, b) => {
        if (a.lat !== b.lat)
            return a.lat - b.lat;
        return a.lng - b.lng;
    });
}
function normalizeAddressForHashing(address) {
    return address
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}
function getGeographicZone(center) {
    const gridSize = 0.01;
    const zoneLat = Math.floor(center.lat / gridSize);
    const zoneLng = Math.floor(center.lng / gridSize);
    return `${zoneLat}_${zoneLng}`;
}
function calculateDistanceBetweenCenters(fp1, fp2) {
    const R = 6371e3;
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
function calculateBoundingBoxOverlap(bbox1, bbox2) {
    const left = Math.max(bbox1.southWest.lng, bbox2.southWest.lng);
    const right = Math.min(bbox1.northEast.lng, bbox2.northEast.lng);
    const top = Math.min(bbox1.northEast.lat, bbox2.northEast.lat);
    const bottom = Math.max(bbox1.southWest.lat, bbox2.southWest.lat);
    if (left >= right || bottom >= top) {
        return 0;
    }
    const width = right - left;
    const height = top - bottom;
    const degToMeter = 111320;
    return width * height * degToMeter * degToMeter;
}
function generateDuplicateReason(fp1, fp2, overlapPercentage, similarity) {
    const reasons = [];
    if (overlapPercentage >= (boundaries_1.VALIDATION_THRESHOLDS.SIGNIFICANT_OVERLAP_THRESHOLD || 25)) {
        reasons.push(`Boundary overlap detected (${overlapPercentage.toFixed(1)}%)`);
    }
    if (fp1.addressHash === fp2.addressHash) {
        reasons.push('Identical address');
    }
    if (fp1.zoneId === fp2.zoneId) {
        reasons.push('Same geographic zone');
    }
    return reasons.length > 0 ? reasons.join(', ') : 'Multiple similarity factors detected';
}
function updatePropertyFingerprint(existingFingerprint, newBounds, newAddress, newFeatures) {
    if (!newBounds && !newAddress && !newFeatures) {
        return existingFingerprint;
    }
    if (newBounds) {
        return generatePropertyFingerprint(newBounds, newAddress || 'updated-address', newFeatures);
    }
    const updatedFingerprint = { ...existingFingerprint };
    if (newAddress) {
        const normalizedAddress = normalizeAddressForHashing(newAddress);
        updatedFingerprint.addressHash = crypto_1.default
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
        updatedFingerprint.featuresHash = crypto_1.default
            .createHash('sha256')
            .update(normalizedFeatures)
            .digest('hex')
            .substring(0, 8);
    }
    updatedFingerprint.id = crypto_1.default
        .createHash('sha256')
        .update(`${updatedFingerprint.coordinateHash}${updatedFingerprint.addressHash}${updatedFingerprint.featuresHash}${updatedFingerprint.zoneId}`)
        .digest('hex');
    return updatedFingerprint;
}
function validateFingerprintIntegrity(fingerprint) {
    if (!fingerprint) {
        return false;
    }
    const requiredFields = [
        'id', 'coordinateHash', 'addressHash', 'zoneId', 'area',
        'centerLat', 'centerLng', 'boundingBox', 'createdAt'
    ];
    const missingFields = requiredFields.filter(field => !(field in fingerprint));
    if (missingFields.length > 0) {
        console.error(`Fingerprint missing required fields: ${missingFields.join(', ')}`);
        return false;
    }
    const rehashedId = crypto_1.default
        .createHash('sha256')
        .update(`${fingerprint.coordinateHash}${fingerprint.addressHash}${fingerprint.featuresHash}${fingerprint.zoneId}`)
        .digest('hex');
    if (rehashedId !== fingerprint.id) {
        console.error('Fingerprint ID hash mismatch.');
        return false;
    }
    return true;
}
//# sourceMappingURL=propertyFingerprint.js.map