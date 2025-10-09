// backend/marking-service/src/utils/distanceCalculator.ts

import { Coordinates, DistanceCalculation, PROXIMITY_CONSTANTS } from '../types/proximity';

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param coord1 First coordinate point
 * @param coord2 Second coordinate point
 * @returns Distance calculation result
 */
export const calculateDistance = (
  coord1: Coordinates,
  coord2: Coordinates
): DistanceCalculation => {
  const earthRadiusKm = PROXIMITY_CONSTANTS.EARTH_RADIUS_KM;

  // Convert degrees to radians
  const lat1Rad = degreesToRadians(coord1.latitude);
  const lat2Rad = degreesToRadians(coord2.latitude);
  const deltaLatRad = degreesToRadians(coord2.latitude - coord1.latitude);
  const deltaLonRad = degreesToRadians(coord2.longitude - coord1.longitude);

  // Haversine formula
  const a =
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLonRad / 2) *
      Math.sin(deltaLonRad / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distanceInKm = earthRadiusKm * c;
  const distanceInMeters = distanceInKm * 1000;

  return {
    from: coord1,
    to: coord2,
    distanceInKm: Number(distanceInKm.toFixed(2)),
    distanceInMeters: Number(distanceInMeters.toFixed(2))
  };
};

/**
 * Convert degrees to radians
 */
const degreesToRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Convert radians to degrees
 */
export const radiansToDegrees = (radians: number): number => {
  return radians * (180 / Math.PI);
};

/**
 * Check if a point is within a certain radius of another point
 */
export const isWithinRadius = (
  center: Coordinates,
  point: Coordinates,
  radiusInKm: number
): boolean => {
  const distance = calculateDistance(center, point);
  return distance.distanceInKm <= radiusInKm;
};

/**
 * Calculate bounding box for proximity search optimization
 * Returns min/max latitude and longitude for a given center point and radius
 */
export const calculateBoundingBox = (
  center: Coordinates,
  radiusInKm: number
): {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
} => {
  const earthRadiusKm = PROXIMITY_CONSTANTS.EARTH_RADIUS_KM;

  // Angular distance in radians on a great circle
  const radDist = radiusInKm / earthRadiusKm;

  const minLat = center.latitude - radiansToDegrees(radDist);
  const maxLat = center.latitude + radiansToDegrees(radDist);

  // Handle longitude carefully (it depends on latitude)
  const deltaLon =
    radiansToDegrees(
      Math.asin(Math.sin(radDist) / Math.cos(degreesToRadians(center.latitude)))
    );

  const minLon = center.longitude - deltaLon;
  const maxLon = center.longitude + deltaLon;

  return {
    minLat: Number(minLat.toFixed(6)),
    maxLat: Number(maxLat.toFixed(6)),
    minLon: Number(minLon.toFixed(6)),
    maxLon: Number(maxLon.toFixed(6))
  };
};

/**
 * Sort coordinates by distance from a center point
 */
export const sortByDistance = (
  center: Coordinates,
  points: Array<{ coordinates: Coordinates; [key: string]: any }>
): Array<{ coordinates: Coordinates; distance: number; [key: string]: any }> => {
  return points
    .map((point) => ({
      ...point,
      distance: calculateDistance(center, point.coordinates).distanceInKm
    }))
    .sort((a, b) => a.distance - b.distance);
};

/**
 * Filter points within a specific radius
 */
export const filterByRadius = (
  center: Coordinates,
  points: Array<{ coordinates: Coordinates; [key: string]: any }>,
  radiusInKm: number
): Array<{ coordinates: Coordinates; distance: number; [key: string]: any }> => {
  return sortByDistance(center, points).filter(
    (point) => point.distance <= radiusInKm
  );
};

/**
 * Calculate the center point (centroid) of multiple coordinates
 */
export const calculateCentroid = (coordinates: Coordinates[]): Coordinates => {
  if (coordinates.length === 0) {
    throw new Error('Cannot calculate centroid of empty coordinates array');
  }

  let x = 0;
  let y = 0;
  let z = 0;

  coordinates.forEach((coord) => {
    const latRad = degreesToRadians(coord.latitude);
    const lonRad = degreesToRadians(coord.longitude);

    x += Math.cos(latRad) * Math.cos(lonRad);
    y += Math.cos(latRad) * Math.sin(lonRad);
    z += Math.sin(latRad);
  });

  x /= coordinates.length;
  y /= coordinates.length;
  z /= coordinates.length;

  const lonRad = Math.atan2(y, x);
  const hyp = Math.sqrt(x * x + y * y);
  const latRad = Math.atan2(z, hyp);

  return {
    latitude: Number(radiansToDegrees(latRad).toFixed(6)),
    longitude: Number(radiansToDegrees(lonRad).toFixed(6))
  };
};

/**
 * Validate coordinates
 */
export const validateCoordinates = (coord: Coordinates): boolean => {
  return (
    coord.latitude >= -90 &&
    coord.latitude <= 90 &&
    coord.longitude >= -180 &&
    coord.longitude <= 180
  );
};

/**
 * Format distance for display
 */
export const formatDistance = (distanceInKm: number): string => {
  if (distanceInKm < 1) {
    return `${(distanceInKm * 1000).toFixed(0)}m`;
  }
  return `${distanceInKm.toFixed(2)}km`;
};