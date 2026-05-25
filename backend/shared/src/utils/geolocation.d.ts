import { GeoLocationCoordinates, RectangleBounds, BoundaryValidationResult } from '../types/geolocation';
/**
 * Calculate the distance between two geographical points using Haversine formula
 * @param point1 First geographical point
 * @param point2 Second geographical point
 * @returns Distance in meters
 */
export declare function geoCalculateDistance(point1: GeoLocationCoordinates, point2: GeoLocationCoordinates): number;
/**
 * Calculate the area of a rectangle bounds object using cross-points
 * @param bounds Property bounding limits
 * @returns Area in square meters
 */
export declare function calculatePolygonArea(bounds: RectangleBounds): number;
/**
 * Check if a point is inside a bounding box area
 * @param point Point to check
 * @param bounds Bounding box boundaries
 * @returns True if point falls within boundaries
 */
export declare function isPointInPolygon(point: GeoLocationCoordinates, bounds: RectangleBounds): boolean;
/**
 * Check if two rectangle boundaries overlap
 * @param bounds1 First rectangle bounds
 * @param bounds2 Second rectangle bounds
 * @returns True if boxes intersect
 */
export declare function doPolygonsOverlap(bounds1: RectangleBounds, bounds2: RectangleBounds): boolean;
/**
 * Validate property boundary mask structure against target constraints
 * @param bounds Target RectangleBounds frame to evaluate
 * @returns Unified Validation result payload matching your spec
 */
export declare function validateBoundaryMask(bounds: RectangleBounds): BoundaryValidationResult;
/**
 * Calculate the perimeter around rectangle boundaries
 * @param bounds Rectangle bounding limits
 * @returns Total perimeter in meters
 */
export declare function calculatePolygonPerimeter(bounds: RectangleBounds): number;
/**
 * Generate a clean standard rectangle bounding frame definition from flat coordinate entries
 * @param coordinates Array of flat Coordinates to construct
 * @returns Formatted RectangleBounds structural map
 */
export declare function getBoundingBox(coordinates: GeoLocationCoordinates[]): RectangleBounds;
export declare function degreesToRadians(degrees: number): number;
export declare function radiansToDegrees(radians: number): number;
/**
 * Cleanly verify and convert dynamic inputs into structured system Coordinates
 */
export declare function normalizeCoordinates(coordinates: any[]): GeoLocationCoordinates[];
/**
 * Calculate target geometric centroid coordinates
 */
export declare function getPolygonCenter(bounds: RectangleBounds): GeoLocationCoordinates;
//# sourceMappingURL=geolocation.d.ts.map