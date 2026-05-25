"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.geoCalculateDistance = geoCalculateDistance;
exports.calculatePolygonArea = calculatePolygonArea;
exports.isPointInPolygon = isPointInPolygon;
exports.doPolygonsOverlap = doPolygonsOverlap;
exports.validateBoundaryMask = validateBoundaryMask;
exports.calculatePolygonPerimeter = calculatePolygonPerimeter;
exports.getBoundingBox = getBoundingBox;
exports.degreesToRadians = degreesToRadians;
exports.radiansToDegrees = radiansToDegrees;
exports.normalizeCoordinates = normalizeCoordinates;
exports.getPolygonCenter = getPolygonCenter;
const geolocation_1 = require("../types/geolocation");
const boundaries_1 = require("../constants/boundaries");
/**
 * Calculate the distance between two geographical points using Haversine formula
 * @param point1 First geographical point
 * @param point2 Second geographical point
 * @returns Distance in meters
 */
function geoCalculateDistance(point1, point2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (point1.lat * Math.PI) / 180;
    const φ2 = (point2.lat * Math.PI) / 180;
    const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
    const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
/**
 * Calculate the area of a rectangle bounds object using cross-points
 * @param bounds Property bounding limits
 * @returns Area in square meters
 */
function calculatePolygonArea(bounds) {
    // Extract box vertices
    const p1 = bounds.southWest;
    const p2 = { lat: bounds.northEast.lat, lng: bounds.southWest.lng };
    const p3 = bounds.northEast;
    const p4 = { lat: bounds.southWest.lat, lng: bounds.northEast.lng };
    const coordinates = [p1, p2, p3, p4];
    let area = 0;
    const n = coordinates.length;
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        area += coordinates[i].lng * coordinates[j].lat;
        area -= coordinates[j].lng * coordinates[i].lat;
    }
    const degToMeter = 111320; // meters per degree at equator
    return (Math.abs(area) / 2) * degToMeter * degToMeter;
}
/**
 * Check if a point is inside a bounding box area
 * @param point Point to check
 * @param bounds Bounding box boundaries
 * @returns True if point falls within boundaries
 */
function isPointInPolygon(point, bounds) {
    return (point.lat >= bounds.southWest.lat &&
        point.lat <= bounds.northEast.lat &&
        point.lng >= bounds.southWest.lng &&
        point.lng <= bounds.northEast.lng);
}
/**
 * Check if two rectangle boundaries overlap
 * @param bounds1 First rectangle bounds
 * @param bounds2 Second rectangle bounds
 * @returns True if boxes intersect
 */
function doPolygonsOverlap(bounds1, bounds2) {
    return !(bounds1.northEast.lng < bounds2.southWest.lng || // bounds1 is left of bounds2
        bounds1.southWest.lng > bounds2.northEast.lng || // bounds1 is right of bounds2
        bounds1.northEast.lat < bounds2.southWest.lat || // bounds1 is below bounds2
        bounds1.southWest.lat > bounds2.northEast.lat // bounds1 is above bounds2
    );
}
/**
 * Validate property boundary mask structure against target constraints
 * @param bounds Target RectangleBounds frame to evaluate
 * @returns Unified Validation result payload matching your spec
 */
function validateBoundaryMask(bounds) {
    const errors = [];
    const warnings = [];
    // Calculate area metrics
    const area = calculatePolygonArea(bounds);
    // Check minimum boundary size footprint
    if (area < boundaries_1.BOUNDARY_SIZE_LIMITS.ABSOLUTE_MIN_SIZE) {
        errors.push({
            type: geolocation_1.BoundaryErrorType.TOO_SMALL,
            message: `Property area too small. Minimum ${boundaries_1.BOUNDARY_SIZE_LIMITS.ABSOLUTE_MIN_SIZE} sqm required.`,
            severity: 'high'
        });
    }
    // Check maximum absolute boundary capacity
    if (area > boundaries_1.BOUNDARY_SIZE_LIMITS.ABSOLUTE_MAX_SIZE) {
        errors.push({
            type: geolocation_1.BoundaryErrorType.TOO_LARGE,
            message: `Property area too large. Maximum ${boundaries_1.BOUNDARY_SIZE_LIMITS.ABSOLUTE_MAX_SIZE} sqm allowed.`,
            severity: 'high'
        });
    }
    // Validate coordinates fall within designated Nigerian Bounds constraints
    const nigerianBounds = boundaries_1.NIGERIA_SPECIFIC.BOUNDS;
    if (bounds.southWest.lat < nigerianBounds.SOUTH ||
        bounds.northEast.lat > nigerianBounds.NORTH ||
        bounds.southWest.lng < nigerianBounds.WEST ||
        bounds.northEast.lng > nigerianBounds.EAST) {
        errors.push({
            type: geolocation_1.BoundaryErrorType.OUT_OF_BOUNDS,
            message: 'Property coordinates must be located completely within Nigerian boundaries.',
            severity: 'high'
        });
    }
    // Evaluate structural aspects ratios
    const height = geoCalculateDistance(bounds.southWest, { lat: bounds.northEast.lat, lng: bounds.southWest.lng });
    const width = geoCalculateDistance(bounds.southWest, { lat: bounds.southWest.lat, lng: bounds.northEast.lng });
    const aspectRatio = width / (height || 1);
    if (aspectRatio > boundaries_1.VALIDATION_THRESHOLDS.MAX_ASPECT_RATIO || aspectRatio < boundaries_1.VALIDATION_THRESHOLDS.MIN_ASPECT_RATIO) {
        errors.push({
            type: geolocation_1.BoundaryErrorType.SUSPICIOUS_SHAPE,
            message: 'Property dimensional aspect ratios appear invalid or overly elongated.',
            severity: 'medium'
        });
    }
    const perimeter = calculatePolygonPerimeter(bounds);
    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        suggestedCorrections: undefined
    };
}
/**
 * Calculate the perimeter around rectangle boundaries
 * @param bounds Rectangle bounding limits
 * @returns Total perimeter in meters
 */
function calculatePolygonPerimeter(bounds) {
    const p1 = bounds.southWest;
    const p2 = { lat: bounds.northEast.lat, lng: bounds.southWest.lng };
    const p3 = bounds.northEast;
    const p4 = { lat: bounds.southWest.lat, lng: bounds.northEast.lng };
    return (geoCalculateDistance(p1, p2) +
        geoCalculateDistance(p2, p3) +
        geoCalculateDistance(p3, p4) +
        geoCalculateDistance(p4, p1));
}
/**
 * Generate a clean standard rectangle bounding frame definition from flat coordinate entries
 * @param coordinates Array of flat Coordinates to construct
 * @returns Formatted RectangleBounds structural map
 */
function getBoundingBox(coordinates) {
    if (coordinates.length === 0) {
        throw new Error('Cannot create bounding box from empty coordinates array.');
    }
    let minLat = coordinates[0].lat;
    let maxLat = coordinates[0].lat;
    let minLng = coordinates[0].lng;
    let maxLng = coordinates[0].lng;
    for (const coord of coordinates) {
        minLat = Math.min(minLat, coord.lat);
        maxLat = Math.max(maxLat, coord.lat);
        minLng = Math.min(minLng, coord.lng);
        maxLng = Math.max(maxLng, coord.lng);
    }
    const southWest = { lat: minLat, lng: minLng };
    const northEast = { lat: maxLat, lng: maxLng };
    // Calculate area fallback parameters
    const tempBounds = { southWest, northEast };
    const computedArea = calculatePolygonArea(tempBounds);
    return {
        northEast,
        southWest,
        center: {
            lat: (minLat + maxLat) / 2,
            lng: (minLng + maxLng) / 2
        },
        area: computedArea
    };
}
function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}
function radiansToDegrees(radians) {
    return radians * (180 / Math.PI);
}
/**
 * Cleanly verify and convert dynamic inputs into structured system Coordinates
 */
function normalizeCoordinates(coordinates) {
    return coordinates.map(coord => ({
        lat: parseFloat(coord.lat.toString()),
        lng: parseFloat(coord.lng.toString())
    }));
}
/**
 * Calculate target geometric centroid coordinates
 */
function getPolygonCenter(bounds) {
    return bounds.center;
}
//# sourceMappingURL=geolocation.js.map