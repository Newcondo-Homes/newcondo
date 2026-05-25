"use strict";
// backend/shared/src/utils/proximity.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCenterPoint = exports.formatCoordinates = exports.isValidLongitude = exports.isValidLatitude = exports.parseCoordinates = exports.geoGetBoundingBox = exports.findAgentsInProximity = exports.getProximity = exports.isWithinRadius = exports.geoProxCalculateDistance = void 0;
// FIXED: Imported the correct individual constant variables
const proximityRadius_1 = require("../constants/proximityRadius");
/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
const geoProxCalculateDistance = (point1, point2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(point2.lat - point1.lat);
    const dLng = toRadians(point2.lng - point1.lng);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(point1.lat)) *
            Math.cos(toRadians(point2.lat)) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
};
exports.geoProxCalculateDistance = geoProxCalculateDistance;
/**
 * Convert degrees to radians
 */
const toRadians = (degrees) => {
    return degrees * (Math.PI / 180);
};
/**
 * Check if a point is within a specified radius of another point
 */
const isWithinRadius = (point1, point2, radiusKm = proximityRadius_1.DEFAULT_PROXIMITY_RADIUS // FIXED
) => {
    const distance = (0, exports.geoProxCalculateDistance)(point1, point2);
    return distance <= radiusKm;
};
exports.isWithinRadius = isWithinRadius;
/**
 * Get proximity details between two points
 */
const getProximity = (agentLocation, propertyLocation, maxRadius = proximityRadius_1.DEFAULT_PROXIMITY_RADIUS // FIXED
) => {
    const distance = (0, exports.geoProxCalculateDistance)(agentLocation, propertyLocation);
    const isWithinRadius = distance <= maxRadius;
    // FIXED: Using your built-in estimateTravelTime function from the constants file
    const estimatedTravelTime = (0, proximityRadius_1.estimateTravelTime)(distance);
    return {
        distance,
        isWithinRadius,
        estimatedTravelTime,
    };
};
exports.getProximity = getProximity;
/**
 * Find all agents within radius of a property
 */
const findAgentsInProximity = async (propertyLocation, radiusKm = proximityRadius_1.DEFAULT_PROXIMITY_RADIUS // FIXED
) => {
    const { prisma } = await Promise.resolve().then(() => __importStar(require('@newcondo/db')));
    // Get all available agents
    const agents = await prisma.user.findMany({
        where: {
            isAvailableForMarking: true,
            OR: [
                { role: 'AGENT' },
                {
                    role: 'RENTER',
                    isPremium: true,
                },
            ],
        },
        select: {
            id: true,
            agentServiceAreas: true,
        },
    });
    const agentsInProximity = [];
    for (const agent of agents) {
        // Placeholder logic - replace with actual agent coordinate tracking
        const distance = 0;
        const proximity = (0, exports.getProximity)({ lat: 0, lng: 0 }, propertyLocation, radiusKm);
        if (proximity.isWithinRadius) {
            agentsInProximity.push({
                agentId: agent.id,
                distance: proximity.distance,
                travelTime: proximity.estimatedTravelTime || 0,
            });
        }
    }
    // Sort by distance (closest first)
    return agentsInProximity.sort((a, b) => a.distance - b.distance);
};
exports.findAgentsInProximity = findAgentsInProximity;
/**
 * Calculate bounding box for a given center point and radius
 * Useful for database queries
 */
const geoGetBoundingBox = (center, radiusKm) => {
    const latDelta = radiusKm / 111.32; // 1 degree latitude ≈ 111.32 km
    const lngDelta = radiusKm / (111.32 * Math.cos(toRadians(center.lat)));
    return {
        minLat: center.lat - latDelta,
        maxLat: center.lat + latDelta,
        minLng: center.lng - lngDelta,
        maxLng: center.lng + lngDelta,
    };
};
exports.geoGetBoundingBox = geoGetBoundingBox;
/**
 * Parse GPS coordinates from string format
 */
const parseCoordinates = (coordinatesString) => {
    try {
        const coords = JSON.parse(coordinatesString);
        if (typeof coords.lat === 'number' &&
            typeof coords.lng === 'number' &&
            (0, exports.isValidLatitude)(coords.lat) &&
            (0, exports.isValidLongitude)(coords.lng)) {
            return coords;
        }
        return null;
    }
    catch {
        return null;
    }
};
exports.parseCoordinates = parseCoordinates;
/**
 * Validate latitude value
 */
const isValidLatitude = (lat) => {
    return lat >= -90 && lat <= 90;
};
exports.isValidLatitude = isValidLatitude;
/**
 * Validate longitude value
 */
const isValidLongitude = (lng) => {
    return lng >= -180 && lng <= 180;
};
exports.isValidLongitude = isValidLongitude;
/**
 * Format coordinates for display
 */
const formatCoordinates = (coords) => {
    return `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
};
exports.formatCoordinates = formatCoordinates;
/**
 * Get center point of multiple coordinates
 */
const getCenterPoint = (points) => {
    if (points.length === 0) {
        throw new Error('Cannot calculate center of empty array');
    }
    const sum = points.reduce((acc, point) => ({
        lat: acc.lat + point.lat,
        lng: acc.lng + point.lng,
    }), { lat: 0, lng: 0 });
    return {
        lat: sum.lat / points.length,
        lng: sum.lng / points.length,
    };
};
exports.getCenterPoint = getCenterPoint;
//# sourceMappingURL=geoProximity.js.map