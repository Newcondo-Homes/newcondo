// backend/shared/src/utils/ipGeolocation.ts

import axios from 'axios';

interface GeolocationData {
  country?: string;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  isp?: string;
}

interface IPApiResponse {
  status: string;
  country?: string;
  countryCode?: string;
  region?: string;
  regionName?: string;
  city?: string;
  zip?: string;
  lat?: number;
  lon?: number;
  timezone?: string;
  isp?: string;
  org?: string;
  as?: string;
  query?: string;
}

/**
 * Get geolocation data from IP address using ip-api.com (free tier)
 * Rate limit: 45 requests per minute
 */
export const getGeolocationFromIP = async (
  ipAddress: string
): Promise<GeolocationData | null> => {
  try {
    // Skip localhost and private IPs
    if (isPrivateIP(ipAddress)) {
      return {
        country: 'Nigeria',
        city: 'Unknown',
        region: 'Unknown',
      };
    }

    const response = await axios.get<IPApiResponse>(
      `http://ip-api.com/json/${ipAddress}`,
      {
        timeout: 5000,
        params: {
          fields: 'status,country,countryCode,region,regionName,city,lat,lon,timezone,isp',
        },
      }
    );

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
  } catch (error) {
    console.error('IP Geolocation error:', error);
    return null;
  }
};

/**
 * Alternative: Use ipapi.co (has better rate limits with API key)
 */
export const getGeolocationFromIPApiCo = async (
  ipAddress: string,
  apiKey?: string
): Promise<GeolocationData | null> => {
  try {
    if (isPrivateIP(ipAddress)) {
      return {
        country: 'Nigeria',
        city: 'Unknown',
      };
    }

    const url = apiKey
      ? `https://ipapi.co/${ipAddress}/json/?key=${apiKey}`
      : `https://ipapi.co/${ipAddress}/json/`;

    const response = await axios.get(url, { timeout: 5000 });

    return {
      country: response.data.country_name,
      city: response.data.city,
      region: response.data.region,
      latitude: response.data.latitude,
      longitude: response.data.longitude,
      timezone: response.data.timezone,
    };
  } catch (error) {
    console.error('IPApi.co Geolocation error:', error);
    return null;
  }
};

/**
 * Check if IP is private/local
 */
export const isPrivateIP = (ip: string): boolean => {
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

/**
 * Extract IP address from request
 */
export const extractIPAddress = (
  headers: Record<string, string | string[] | undefined>,
  connectionRemoteAddress?: string
): string => {
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
    if (firstIp) return firstIp;
  }

  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  if (cfConnectingIp) {
    return Array.isArray(cfConnectingIp) ? cfConnectingIp[0] : cfConnectingIp;
  }

  return connectionRemoteAddress || '127.0.0.1';
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export const ipCalculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Check if location is within Nigeria (approximate bounds)
 */
export const isWithinNigeria = (latitude: number, longitude: number): boolean => {
  // Nigeria approximate bounds
  const bounds = {
    north: 13.9,
    south: 4.3,
    west: 2.7,
    east: 14.7,
  };

  return (
    latitude >= bounds.south &&
    latitude <= bounds.north &&
    longitude >= bounds.west &&
    longitude <= bounds.east
  );
};

/**
 * Get Nigerian state from coordinates (simplified)
 */
export const getNigerianStateFromCoordinates = (
  latitude: number,
  longitude: number
): string | null => {
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
    const distance = ipCalculateDistance(
      latitude,
      longitude,
      state.lat,
      state.lng
    );
    if (distance <= state.radius * 111) {
      // Convert degrees to km (approximate)
      return state.name;
    }
  }

  return null;
};

/**
 * Batch geocode multiple IPs (with rate limiting)
 */
export const batchGeocodeIPs = async (
  ipAddresses: string[],
  delayMs: number = 1500 // Delay between requests to respect rate limits
): Promise<Map<string, GeolocationData | null>> => {
  const results = new Map<string, GeolocationData | null>();

  for (const ip of ipAddresses) {
    const data = await getGeolocationFromIP(ip);
    results.set(ip, data);

    // Delay to respect rate limits
    if (ipAddresses.indexOf(ip) < ipAddresses.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
};

/**
 * Cache geolocation data (in production, use Redis)
 */
const geoCache = new Map<string, { data: GeolocationData | null; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export const getCachedGeolocation = async (
  ipAddress: string
): Promise<GeolocationData | null> => {
  const cached = geoCache.get(ipAddress);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const data = await getGeolocationFromIP(ipAddress);
  geoCache.set(ipAddress, { data, timestamp: Date.now() });

  return data;
};

/**
 * Format location string
 */
export const formatLocation = (geo: GeolocationData): string => {
  const parts = [];
  
  if (geo.city) parts.push(geo.city);
  if (geo.region && geo.region !== geo.city) parts.push(geo.region);
  if (geo.country) parts.push(geo.country);

  return parts.join(', ') || 'Unknown Location';
};