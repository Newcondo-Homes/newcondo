interface GeolocationData {
    country?: string;
    city?: string;
    region?: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
    isp?: string;
}
/**
 * Get geolocation data from IP address using ip-api.com (free tier)
 * Rate limit: 45 requests per minute
 */
export declare const getGeolocationFromIP: (ipAddress: string) => Promise<GeolocationData | null>;
/**
 * Alternative: Use ipapi.co (has better rate limits with API key)
 */
export declare const getGeolocationFromIPApiCo: (ipAddress: string, apiKey?: string) => Promise<GeolocationData | null>;
/**
 * Check if IP is private/local
 */
export declare const isPrivateIP: (ip: string) => boolean;
/**
 * Extract IP address from request
 */
export declare const extractIPAddress: (headers: Record<string, string | string[] | undefined>, connectionRemoteAddress?: string) => string;
/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export declare const ipCalculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number) => number;
/**
 * Check if location is within Nigeria (approximate bounds)
 */
export declare const isWithinNigeria: (latitude: number, longitude: number) => boolean;
/**
 * Get Nigerian state from coordinates (simplified)
 */
export declare const getNigerianStateFromCoordinates: (latitude: number, longitude: number) => string | null;
/**
 * Batch geocode multiple IPs (with rate limiting)
 */
export declare const batchGeocodeIPs: (ipAddresses: string[], delayMs?: number) => Promise<Map<string, GeolocationData | null>>;
export declare const getCachedGeolocation: (ipAddress: string) => Promise<GeolocationData | null>;
/**
 * Format location string
 */
export declare const formatLocation: (geo: GeolocationData) => string;
export {};
//# sourceMappingURL=ipGeolocation.d.ts.map