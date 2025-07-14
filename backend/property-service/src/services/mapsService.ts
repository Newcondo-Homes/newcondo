// backend/property-service/src/services/mapsService.ts
import { Client } from '@googlemaps/google-maps-services-js';
import { GeocodeResult, PlaceData } from '@googlemaps/google-maps-services-js/dist/common';

export interface GoogleMapsConfig {
  apiKey: string;
  defaultRegion: string;
  allowedCountries: string[];
}

export interface GeocodingResult {
  formattedAddress: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  components: {
    streetNumber?: string;
    route?: string;
    locality?: string;
    administrativeAreaLevel1?: string;
    country?: string;
    postalCode?: string;
  };
  placeId: string;
  types: string[];
}

export interface ReverseGeocodingResult {
  address: string;
  components: {
    streetNumber?: string;
    route?: string;
    locality?: string;
    administrativeAreaLevel1?: string;
    country?: string;
    postalCode?: string;
  };
  placeId: string;
}

export interface BoundaryValidationResult {
  isValid: boolean;
  area: number; // in square meters
  perimeter: number; // in meters
  centroid: {
    lat: number;
    lng: number;
  };
  errors: string[];
}

export class MapsService {
  private client: Client;
  private config: GoogleMapsConfig;

  constructor(config: GoogleMapsConfig) {
    this.client = new Client({});
    this.config = config;
  }

  /**
   * Geocode an address to get coordinates
   */
  async geocodeAddress(address: string): Promise<GeocodingResult | null> {
    try {
      const response = await this.client.geocode({
        params: {
          address,
          key: this.config.apiKey,
          region: this.config.defaultRegion,
          components: {
            country: this.config.allowedCountries,
          },
        },
      });

      if (response.data.results.length === 0) {
        return null;
      }

      const result = response.data.results[0];
      
      return {
        formattedAddress: result.formatted_address,
        coordinates: {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
        },
        components: this.extractAddressComponents(result),
        placeId: result.place_id,
        types: result.types,
      };
    } catch (error) {
      console.error('Geocoding error:', error);
      throw new Error('Failed to geocode address');
    }
  }

  /**
   * Reverse geocode coordinates to get address
   */
  async reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodingResult | null> {
    try {
      const response = await this.client.reverseGeocode({
        params: {
          latlng: { lat, lng },
          key: this.config.apiKey,
          result_type: ['street_address', 'route', 'neighborhood'],
        },
      });

      if (response.data.results.length === 0) {
        return null;
      }

      const result = response.data.results[0];
      
      return {
        address: result.formatted_address,
        components: this.extractAddressComponents(result),
        placeId: result.place_id,
      };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      throw new Error('Failed to reverse geocode coordinates');
    }
  }

  /**
   * Validate property boundary polygon
   */
  validateBoundary(coordinates: Array<{ lat: number; lng: number }>): BoundaryValidationResult {
    const errors: string[] = [];

    // Check minimum number of points
    if (coordinates.length < 3) {
      errors.push('Boundary must have at least 3 points');
    }

    // Check if polygon is closed (first and last points should be the same)
    const first = coordinates[0];
    const last = coordinates[coordinates.length - 1];
    const isClosed = first.lat === last.lat && first.lng === last.lng;
    
    if (!isClosed) {
      // Auto-close the polygon
      coordinates.push(first);
    }

    // Calculate area and perimeter
    const area = this.calculatePolygonArea(coordinates);
    const perimeter = this.calculatePolygonPerimeter(coordinates);
    const centroid = this.calculateCentroid(coordinates);

    // Validate area (minimum 10 sq meters, maximum 10,000 sq meters)
    if (area < 10) {
      errors.push('Property area is too small (minimum 10 sq meters)');
    }
    if (area > 10000) {
      errors.push('Property area is too large (maximum 10,000 sq meters)');
    }

    // Check for self-intersecting polygon
    if (this.isPolygonSelfIntersecting(coordinates)) {
      errors.push('Boundary polygon cannot intersect itself');
    }

    return {
      isValid: errors.length === 0,
      area,
      perimeter,
      centroid,
      errors,
    };
  }

  /**
   * Calculate distance between two points in meters
   */
  calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLng = this.toRadians(point2.lng - point1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }

  /**
   * Check if a point is inside a polygon
   */
  isPointInPolygon(point: { lat: number; lng: number }, polygon: Array<{ lat: number; lng: number }>): boolean {
    let inside = false;
    const { lat: x, lng: y } = point;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const { lat: xi, lng: yi } = polygon[i];
      const { lat: xj, lng: yj } = polygon[j];
      
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    
    return inside;
  }

  /**
   * Check if two polygons overlap
   */
  doPolygonsOverlap(poly1: Array<{ lat: number; lng: number }>, poly2: Array<{ lat: number; lng: number }>): boolean {
    // Check if any point of poly1 is inside poly2
    for (const point of poly1) {
      if (this.isPointInPolygon(point, poly2)) {
        return true;
      }
    }
    
    // Check if any point of poly2 is inside poly1
    for (const point of poly2) {
      if (this.isPointInPolygon(point, poly1)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Extract address components from Google Maps result
   */
  private extractAddressComponents(result: GeocodeResult) {
    const components: any = {};
    
    result.address_components.forEach((component) => {
      if (component.types.includes('street_number')) {
        components.streetNumber = component.long_name;
      }
      if (component.types.includes('route')) {
        components.route = component.long_name;
      }
      if (component.types.includes('locality')) {
        components.locality = component.long_name;
      }
      if (component.types.includes('administrative_area_level_1')) {
        components.administrativeAreaLevel1 = component.long_name;
      }
      if (component.types.includes('country')) {
        components.country = component.long_name;
      }
      if (component.types.includes('postal_code')) {
        components.postalCode = component.long_name;
      }
    });
    
    return components;
  }

  /**
   * Calculate polygon area using the shoelace formula
   */
  private calculatePolygonArea(coordinates: Array<{ lat: number; lng: number }>): number {
    let area = 0;
    const n = coordinates.length;
    
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += coordinates[i].lat * coordinates[j].lng;
      area -= coordinates[j].lat * coordinates[i].lng;
    }
    
    area = Math.abs(area) / 2;
    
    // Convert to square meters (approximate)
    const metersPerDegree = 111000; // approximately 111 km per degree
    return area * metersPerDegree * metersPerDegree;
  }

  /**
   * Calculate polygon perimeter
   */
  private calculatePolygonPerimeter(coordinates: Array<{ lat: number; lng: number }>): number {
    let perimeter = 0;
    
    for (let i = 0; i < coordinates.length - 1; i++) {
      perimeter += this.calculateDistance(coordinates[i], coordinates[i + 1]);
    }
    
    return perimeter;
  }

  /**
   * Calculate centroid of polygon
   */
  private calculateCentroid(coordinates: Array<{ lat: number; lng: number }>): { lat: number; lng: number } {
    let lat = 0;
    let lng = 0;
    
    coordinates.forEach(coord => {
      lat += coord.lat;
      lng += coord.lng;
    });
    
    return {
      lat: lat / coordinates.length,
      lng: lng / coordinates.length,
    };
  }

  /**
   * Check if polygon is self-intersecting
   */
  private isPolygonSelfIntersecting(coordinates: Array<{ lat: number; lng: number }>): boolean {
    const n = coordinates.length;
    
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 2; j < n - 1; j++) {
        if (i === 0 && j === n - 2) continue; // Skip adjacent edges
        
        if (this.doLinesIntersect(
          coordinates[i], coordinates[i + 1],
          coordinates[j], coordinates[j + 1]
        )) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Check if two line segments intersect
   */
  private doLinesIntersect(
    p1: { lat: number; lng: number },
    q1: { lat: number; lng: number },
    p2: { lat: number; lng: number },
    q2: { lat: number; lng: number }
  ): boolean {
    const orientation = (p: { lat: number; lng: number }, q: { lat: number; lng: number }, r: { lat: number; lng: number }) => {
      const val = (q.lng - p.lng) * (r.lat - q.lat) - (q.lat - p.lat) * (r.lng - q.lng);
      if (val === 0) return 0; // collinear
      return val > 0 ? 1 : 2; // clockwise or counterclockwise
    };
    
    const o1 = orientation(p1, q1, p2);
    const o2 = orientation(p1, q1, q2);
    const o3 = orientation(p2, q2, p1);
    const o4 = orientation(p2, q2, q1);
    
    return (o1 !== o2 && o3 !== o4);
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}