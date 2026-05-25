"use strict";
// backend/shared/src/utils/ipGeolocation.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatLocation = exports.getCachedGeolocation = exports.batchGeocodeIPs = exports.getNigerianStateFromCoordinates = exports.isWithinNigeria = exports.ipCalculateDistance = exports.extractIPAddress = exports.isPrivateIP = exports.getGeolocationFromIPApiCo = exports.getGeolocationFromIP = void 0;
const axios_1 = __importDefault(require("axios"));
/**
 * Get geolocation data from IP address using ip-api.com (free tier)
 * Rate limit: 45 requests per minute
 */
const getGeolocationFromIP = async (ipAddress) => {
    try {
        // Skip localhost and private IPs
        if ((0, exports.isPrivateIP)(ipAddress)) {
            return {
                country: 'Nigeria',
                city: 'Unknown',
                region: 'Unknown',
            };
        }
        const response = await axios_1.default.get(`http://ip-api.com/json/${ipAddress}`, {
            timeout: 5000,
            params: {
                fields: 'status,country,countryCode,region,regionName,city,lat,lon,timezone,isp',
            },
        });
        if (response.data.status === 'success') {
            return {
                country: response.data.country,
                city: response.data.city,
                region: response.data.regionName,
                latitude: response.data.lat,
                longitude: response.data.lon,
                timezone: response.data.timezone,
                isp: response.data.isp,
            };
        }
        return null;
    }
    catch (error) {
        console.error('IP Geolocation error:', error);
        return null;
    }
};
exports.getGeolocationFromIP = getGeolocationFromIP;
/**
 * Alternative: Use ipapi.co (has better rate limits with API key)
 */
const getGeolocationFromIPApiCo = async (ipAddress, apiKey) => {
    try {
        if ((0, exports.isPrivateIP)(ipAddress)) {
            return {
                country: 'Nigeria',
                city: 'Unknown',
            };
        }
        const url = apiKey
            ? `https://ipapi.co/${ipAddress}/json/?key=${apiKey}`
            : `https://ipapi.co/${ipAddress}/json/`;
        const response = await axios_1.default.get(url, { timeout: 5000 });
        return {
            country: response.data.country_name,
            city: response.data.city,
            region: response.data.region,
            latitude: response.data.latitude,
            longitude: response.data.longitude,
            timezone: response.data.timezone,
        };
    }
    catch (error) {
        console.error('IPApi.co Geolocation error:', error);
        return null;
    }
};
exports.getGeolocationFromIPApiCo = getGeolocationFromIPApiCo;
/**
 * Check if IP is private/local
 */
const isPrivateIP = (ip) => {
    const privateRanges = [
        /^127\./,
        /^10\./,
        /^172\.(1[6-9]|2\d|3[01])\./,
        /^192\.168\./,
        /^::1$/,
        /^fc00:/,
        /^fe80:/,
        /^localhost$/i,
    ];
    return privateRanges.some((range) => range.test(ip));
};
exports.isPrivateIP = isPrivateIP;
/**
 * Extract IP address from request
 */
const extractIPAddress = (headers, connectionRemoteAddress) => {
    // Check various headers that might contain the real IP
    const forwardedFor = headers['x-forwarded-for'];
    const realIp = headers['x-real-ip'];
    const cfConnectingIp = headers['cf-connecting-ip']; // Cloudflare
    // X-Forwarded-For can contain multiple IPs, take the first one
    if (forwardedFor) {
        const ips = Array.isArray(forwardedFor)
            ? forwardedFor[0]
            : forwardedFor;
        const firstIp = ips.split(',')[0].trim();
        if (firstIp)
            return firstIp;
    }
    if (realIp) {
        return Array.isArray(realIp) ? realIp[0] : realIp;
    }
    if (cfConnectingIp) {
        return Array.isArray(cfConnectingIp) ? cfConnectingIp[0] : cfConnectingIp;
    }
    return connectionRemoteAddress || '127.0.0.1';
};
exports.extractIPAddress = extractIPAddress;
/**
 * Calculate distance between two coordinates (Haversine formula)
 */
const ipCalculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
            Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
};
exports.ipCalculateDistance = ipCalculateDistance;
const toRadians = (degrees) => {
    return degrees * (Math.PI / 180);
};
/**
 * Check if location is within Nigeria (approximate bounds)
 */
const isWithinNigeria = (latitude, longitude) => {
    // Nigeria approximate bounds
    const bounds = {
        north: 13.9,
        south: 4.3,
        west: 2.7,
        east: 14.7,
    };
    return (latitude >= bounds.south &&
        latitude <= bounds.north &&
        longitude >= bounds.west &&
        longitude <= bounds.east);
};
exports.isWithinNigeria = isWithinNigeria;
/**
 * Get Nigerian state from coordinates (simplified)
 */
const getNigerianStateFromCoordinates = (latitude, longitude) => {
    // This is a simplified version - in production, use a proper geocoding service
    // or a comprehensive state boundaries dataset
    const stateApproximations = [
        { name: 'Lagos', lat: 6.5244, lng: 3.3792, radius: 0.5 },
        { name: 'Abuja', lat: 9.0765, lng: 7.3986, radius: 0.3 },
        { name: 'Rivers', lat: 4.8156, lng: 7.0498, radius: 0.5 },
        { name: 'Kano', lat: 12.0022, lng: 8.5919, radius: 0.5 },
        { name: 'Oyo', lat: 7.8429, lng: 3.9319, radius: 0.5 },
    ];
    for (const state of stateApproximations) {
        const distance = (0, exports.ipCalculateDistance)(latitude, longitude, state.lat, state.lng);
        if (distance <= state.radius * 111) {
            // Convert degrees to km (approximate)
            return state.name;
        }
    }
    return null;
};
exports.getNigerianStateFromCoordinates = getNigerianStateFromCoordinates;
/**
 * Batch geocode multiple IPs (with rate limiting)
 */
const batchGeocodeIPs = async (ipAddresses, delayMs = 1500 // Delay between requests to respect rate limits
) => {
    const results = new Map();
    for (const ip of ipAddresses) {
        const data = await (0, exports.getGeolocationFromIP)(ip);
        results.set(ip, data);
        // Delay to respect rate limits
        if (ipAddresses.indexOf(ip) < ipAddresses.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }
    return results;
};
exports.batchGeocodeIPs = batchGeocodeIPs;
/**
 * Cache geolocation data (in production, use Redis)
 */
const geoCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const getCachedGeolocation = async (ipAddress) => {
    const cached = geoCache.get(ipAddress);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    const data = await (0, exports.getGeolocationFromIP)(ipAddress);
    geoCache.set(ipAddress, { data, timestamp: Date.now() });
    return data;
};
exports.getCachedGeolocation = getCachedGeolocation;
/**
 * Format location string
 */
const formatLocation = (geo) => {
    const parts = [];
    if (geo.city)
        parts.push(geo.city);
    if (geo.region && geo.region !== geo.city)
        parts.push(geo.region);
    if (geo.country)
        parts.push(geo.country);
    return parts.join(', ') || 'Unknown Location';
};
exports.formatLocation = formatLocation;
//# sourceMappingURL=ipGeolocation.js.map