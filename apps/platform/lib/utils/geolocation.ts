/**
 * Geolocation utilities for property boundary marking
 * Handles GPS coordinates, distance calculations, and location validation
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GeolocationError {
  code: number;
  message: string;
}

export interface LocationData {
  coordinates: Coordinates;
  accuracy: number;
  timestamp: number;
  address?: string;
}

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Get user's current location with high accuracy
 */
export const getCurrentLocation = (): Promise<LocationData> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({
        code: 0,
        message: 'Geolocation is not supported by this browser.'
      } as GeolocationError);
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000 // 1 minute cache
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          coordinates: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          },
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
      },
      (error) => {
        reject({
          code: error.code,
          message: getGeolocationErrorMessage(error.code)
        } as GeolocationError);
      },
      options
    );
  });
};

/**
 * Watch user location for continuous tracking
 */
export const watchLocation = (
  onSuccess: (location: LocationData) => void,
  onError: (error: GeolocationError) => void
): number => {
  const options: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 30000 // 30 seconds cache
  };

  return navigator.geolocation.watchPosition(
    (position) => {
      onSuccess({
        coordinates: {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        },
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      });
    },
    (error) => {
      onError({
        code: error.code,
        message: getGeolocationErrorMessage(error.code)
      });
    },
    options
  );
};

/**
 * Stop watching location
 */
export const stopWatchingLocation = (watchId: number): void => {
  navigator.geolocation.clearWatch(watchId);
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
export const calculateDistance = (
  coord1: Coordinates,
  coord2: Coordinates
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (coord1.lat * Math.PI) / 180;
  const φ2 = (coord2.lat * Math.PI) / 180;
  const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const Δλ = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Calculate bearing between two coordinates
 * Returns bearing in degrees (0-360)
 */
export const calculateBearing = (
  coord1: Coordinates,
  coord2: Coordinates
): number => {
  const φ1 = (coord1.lat * Math.PI) / 180;
  const φ2 = (coord2.lat * Math.PI) / 180;
  const Δλ = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  return ((θ * 180) / Math.PI + 360) % 360;
};

/**
 * Check if a coordinate is within a specified radius of a center point
 */
export const isWithinRadius = (
  center: Coordinates,
  point: Coordinates,
  radiusMeters: number
): boolean => {
  const distance = calculateDistance(center, point);
  return distance <= radiusMeters;
};

/**
 * Calculate bounding box for a given center and radius
 */
export const calculateBoundingBox = (
  center: Coordinates,
  radiusMeters: number
): BoundingBox => {
  const latDelta = radiusMeters / 111320; // Approximate meters per degree latitude
  const lngDelta = radiusMeters / (111320 * Math.cos((center.lat * Math.PI) / 180));

  return {
    north: center.lat + latDelta,
    south: center.lat - latDelta,
    east: center.lng + lngDelta,
    west: center.lng - lngDelta
  };
};

/**
 * Check if coordinates are within Nigeria boundaries
 */
export const isWithinNigeria = (coordinates: Coordinates): boolean => {
  const nigeriaBounds = {
    north: 13.9,
    south: 4.0,
    east: 14.7,
    west: 2.7
  };

  return (
    coordinates.lat >= nigeriaBounds.south &&
    coordinates.lat <= nigeriaBounds.north &&
    coordinates.lng >= nigeriaBounds.west &&
    coordinates.lng <= nigeriaBounds.east
  );
};

/**
 * Format coordinates for display
 */
export const formatCoordinates = (
  coordinates: Coordinates,
  precision: number = 6
): string => {
  return `${coordinates.lat.toFixed(precision)}, ${coordinates.lng.toFixed(precision)}`;
};

/**
 * Parse coordinates from string
 */
export const parseCoordinates = (coordsString: string): Coordinates | null => {
  try {
    const parts = coordsString.split(',').map(s => s.trim());
    if (parts.length !== 2) return null;

    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);

    if (isNaN(lat) || isNaN(lng)) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

    return { lat, lng };
  } catch {
    return null;
  }
};

/**
 * Validate coordinates
 */
export const isValidCoordinates = (coordinates: Coordinates): boolean => {
  return (
    typeof coordinates.lat === 'number' &&
    typeof coordinates.lng === 'number' &&
    coordinates.lat >= -90 &&
    coordinates.lat <= 90 &&
    coordinates.lng >= -180 &&
    coordinates.lng <= 180 &&
    !isNaN(coordinates.lat) &&
    !isNaN(coordinates.lng)
  );
};

/**
 * Convert coordinates to GPS coordinates JSON string for database storage
 */
export const coordinatesToGPSString = (coordinates: Coordinates): string => {
  return JSON.stringify({
    lat: coordinates.lat,
    lng: coordinates.lng
  });
};

/**
 * Parse GPS coordinates from database JSON string
 */
export const parseGPSString = (gpsString: string): Coordinates | null => {
  try {
    const parsed = JSON.parse(gpsString);
    if (parsed && typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
      return { lat: parsed.lat, lng: parsed.lng };
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Get appropriate zoom level based on property type
 */
export const getPropertyZoomLevel = (propertyType: string): number => {
  const zoomLevels = {
    APARTMENT: 20,
    ROOM: 20,
    SHARED_APARTMENT: 20,
    HOUSE: 19,
    DUPLEX: 19,
    OFFICE: 18,
    SHOP: 18,
    WAREHOUSE: 17
  };

  return zoomLevels[propertyType as keyof typeof zoomLevels] || 19;
};

/**
 * Calculate center point of multiple coordinates
 */
export const getCenterPoint = (coordinates: Coordinates[]): Coordinates => {
  if (coordinates.length === 0) {
    throw new Error('Cannot calculate center of empty coordinates array');
  }

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
};

/**
 * Generate random coordinates within a bounding box (for testing)
 */
export const generateRandomCoordinates = (bounds: BoundingBox): Coordinates => {
  return {
    lat: Math.random() * (bounds.north - bounds.south) + bounds.south,
    lng: Math.random() * (bounds.east - bounds.west) + bounds.west
  };
};

/**
 * Get human-readable error message for geolocation errors
 */
export const getGeolocationErrorMessage = (code: number): string => {
  switch (code) {
    case 1:
      return 'Location access denied. Please enable location permissions.';
    case 2:
      return 'Location unavailable. Please check your GPS or internet connection.';
    case 3:
      return 'Location request timed out. Please try again.';
    default:
      return 'An unknown location error occurred.';
  }
};

/**
 * Convert decimal degrees to degrees, minutes, seconds format
 */
export const toDMS = (decimal: number, isLatitude: boolean): string => {
  const direction = decimal >= 0 
    ? (isLatitude ? 'N' : 'E') 
    : (isLatitude ? 'S' : 'W');
  
  const absolute = Math.abs(decimal);
  const degrees = Math.floor(absolute);
  const minutes = Math.floor((absolute - degrees) * 60);
  const seconds = ((absolute - degrees - minutes / 60) * 3600).toFixed(2);

  return `${degrees}°${minutes}'${seconds}"${direction}`;
};

/**
 * Get location accuracy description
 */
export const getAccuracyDescription = (accuracy: number): string => {
  if (accuracy <= 5) return 'Excellent';
  if (accuracy <= 10) return 'Good';
  if (accuracy <= 20) return 'Fair';
  if (accuracy <= 50) return 'Poor';
  return 'Very Poor';
};

/**
 * Nigerian state boundaries for location validation
 */
export const NIGERIAN_STATES = {
  'Lagos': { lat: 6.5244, lng: 3.3792 },
  'Abuja': { lat: 9.0765, lng: 7.3986 },
  'Kano': { lat: 12.0022, lng: 8.5920 },
  'Rivers': { lat: 4.8156, lng: 6.9778 },
  'Oyo': { lat: 7.8776, lng: 3.9470 },
  // Add more states as needed
} as const;

/**
 * Get nearest Nigerian state from coordinates
 */
export const getNearestState = (coordinates: Coordinates): string | null => {
  if (!isWithinNigeria(coordinates)) return null;

  let nearestState = null;
  let shortestDistance = Infinity;

  Object.entries(NIGERIAN_STATES).forEach(([state, stateCoords]) => {
    const distance = calculateDistance(coordinates, stateCoords);
    if (distance < shortestDistance) {
      shortestDistance = distance;
      nearestState = state;
    }
  });

  return nearestState;
};