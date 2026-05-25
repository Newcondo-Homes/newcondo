"use strict";
// backend/shared/src/constants/proximityRadius.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOTIFICATION_ZONES = exports.JOB_BROADCAST_RADIUS = exports.findNearestServiceArea = exports.SERVICE_AREAS = exports.isWithinAcceptableRange = exports.formatDistance = exports.estimateTravelTime = exports.AGENT_CAPACITY_BY_TIER = exports.getRecommendedRadius = exports.getLocationType = exports.URBAN_CITIES = exports.LOCATION_TYPE_RADIUS = exports.getProximityTierName = exports.calculateDistancePriority = exports.getProximityTiers = exports.PROXIMITY_TIERS = exports.MIN_PROXIMITY_RADIUS = exports.MAX_PROXIMITY_RADIUS = exports.DEFAULT_PROXIMITY_RADIUS = void 0;
/**
 * Proximity radius constants for agent assignment
 * All distances in kilometers
 */
/**
 * Default proximity radius for agent assignment
 */
exports.DEFAULT_PROXIMITY_RADIUS = 15; // 15km
/**
 * Maximum proximity radius to search for agents
 */
exports.MAX_PROXIMITY_RADIUS = 50; // 50km
/**
 * Minimum proximity radius
 */
exports.MIN_PROXIMITY_RADIUS = 5; // 5km
/**
 * Proximity tiers for expanding search
 * If no agents found in tier 1, expand to tier 2, etc.
 */
exports.PROXIMITY_TIERS = {
    TIER_1: 10, // 10km - Immediate vicinity
    TIER_2: 20, // 20km - Extended area
    TIER_3: 35, // 35km - Wide area
    TIER_4: 50 // 50km - Maximum search radius
};
/**
 * Get all proximity tiers as array
 */
const getProximityTiers = () => {
    return Object.values(exports.PROXIMITY_TIERS);
};
exports.getProximityTiers = getProximityTiers;
/**
 * Priority scoring based on distance
 * Closer agents get higher priority scores
 */
const calculateDistancePriority = (distanceKm) => {
    if (distanceKm <= exports.PROXIMITY_TIERS.TIER_1)
        return 100;
    if (distanceKm <= exports.PROXIMITY_TIERS.TIER_2)
        return 75;
    if (distanceKm <= exports.PROXIMITY_TIERS.TIER_3)
        return 50;
    if (distanceKm <= exports.PROXIMITY_TIERS.TIER_4)
        return 25;
    return 0;
};
exports.calculateDistancePriority = calculateDistancePriority;
/**
 * Get proximity tier name by distance
 */
const getProximityTierName = (distanceKm) => {
    if (distanceKm <= exports.PROXIMITY_TIERS.TIER_1)
        return 'Very Close';
    if (distanceKm <= exports.PROXIMITY_TIERS.TIER_2)
        return 'Close';
    if (distanceKm <= exports.PROXIMITY_TIERS.TIER_3)
        return 'Moderate';
    if (distanceKm <= exports.PROXIMITY_TIERS.TIER_4)
        return 'Far';
    return 'Out of Range';
};
exports.getProximityTierName = getProximityTierName;
/**
 * Location-specific radius adjustments
 * Urban areas have smaller radius, rural areas larger
 */
exports.LOCATION_TYPE_RADIUS = {
    URBAN: 10, // Dense urban areas (Lagos, Abuja)
    SUBURBAN: 20, // Suburban areas
    RURAL: 40 // Rural areas
};
/**
 * Major cities with urban classification
 */
exports.URBAN_CITIES = [
    'Lagos',
    'Ikeja',
    'Victoria Island',
    'Lekki',
    'Abuja',
    'Port Harcourt',
    'Kano',
    'Ibadan'
];
/**
 * Determine location type based on city/area
 */
const getLocationType = (city) => {
    const normalizedCity = city.toLowerCase();
    const isUrban = exports.URBAN_CITIES.some(urbanCity => normalizedCity.includes(urbanCity.toLowerCase()));
    if (isUrban)
        return 'URBAN';
    // Could add more sophisticated logic here
    // For now, default to suburban
    return 'SUBURBAN';
};
exports.getLocationType = getLocationType;
/**
 * Get recommended radius based on location type
 */
const getRecommendedRadius = (city) => {
    const locationType = (0, exports.getLocationType)(city);
    return exports.LOCATION_TYPE_RADIUS[locationType];
};
exports.getRecommendedRadius = getRecommendedRadius;
/**
 * Agent capacity limits based on proximity
 * Maximum concurrent jobs an agent can have in each tier
 */
exports.AGENT_CAPACITY_BY_TIER = {
    TIER_1: 5, // Can handle 5 jobs within 10km
    TIER_2: 3, // Can handle 3 jobs within 20km
    TIER_3: 2, // Can handle 2 jobs within 35km
    TIER_4: 1 // Can handle 1 job within 50km
};
/**
 * Time estimation based on distance
 * Average travel time in minutes
 */
const estimateTravelTime = (distanceKm) => {
    // Assuming average speed of 30km/h in urban areas
    const avgSpeedKmPerHour = 30;
    const timeInHours = distanceKm / avgSpeedKmPerHour;
    return Math.ceil(timeInHours * 60); // Convert to minutes
};
exports.estimateTravelTime = estimateTravelTime;
/**
 * Format distance for display
 */
const formatDistance = (distanceKm) => {
    if (distanceKm < 1) {
        return `${Math.round(distanceKm * 1000)}m`;
    }
    return `${distanceKm.toFixed(1)}km`;
};
exports.formatDistance = formatDistance;
/**
 * Check if distance is within acceptable range
 */
const isWithinAcceptableRange = (distanceKm) => {
    return distanceKm <= exports.MAX_PROXIMITY_RADIUS;
};
exports.isWithinAcceptableRange = isWithinAcceptableRange;
/**
 * Major service area definitions
 */
exports.SERVICE_AREAS = [
    {
        name: 'Lagos Mainland',
        centerLat: 6.5244,
        centerLng: 3.3792,
        radius: 25
    },
    {
        name: 'Lagos Island',
        centerLat: 6.4474,
        centerLng: 3.3903,
        radius: 15
    },
    {
        name: 'Abuja Central',
        centerLat: 9.0579,
        centerLng: 7.4951,
        radius: 30
    },
    {
        name: 'Port Harcourt',
        centerLat: 4.8156,
        centerLng: 7.0498,
        radius: 20
    },
    {
        name: 'Ibadan',
        centerLat: 7.3775,
        centerLng: 3.9470,
        radius: 25
    },
    {
        name: 'Kano',
        centerLat: 12.0022,
        centerLng: 8.5919,
        radius: 20
    }
];
/**
 * Find nearest service area to coordinates
 */
const findNearestServiceArea = (lat, lng) => {
    let nearest = null;
    let minDistance = Infinity;
    exports.SERVICE_AREAS.forEach(area => {
        // Simple distance calculation (Haversine would be more accurate)
        const distance = Math.sqrt(Math.pow(area.centerLat - lat, 2) + Math.pow(area.centerLng - lng, 2));
        if (distance < minDistance) {
            minDistance = distance;
            nearest = area;
        }
    });
    return nearest;
};
exports.findNearestServiceArea = findNearestServiceArea;
/**
 * Broadcast radius for job notifications
 * How far to notify agents about new jobs
 */
exports.JOB_BROADCAST_RADIUS = exports.DEFAULT_PROXIMITY_RADIUS;
/**
 * Notification priority zones
 */
exports.NOTIFICATION_ZONES = {
    HIGH_PRIORITY: exports.PROXIMITY_TIERS.TIER_1, // Notify immediately
    MEDIUM_PRIORITY: exports.PROXIMITY_TIERS.TIER_2, // Notify after 5 minutes
    LOW_PRIORITY: exports.PROXIMITY_TIERS.TIER_3 // Notify after 15 minutes
};
//# sourceMappingURL=proximityRadius.js.map