// apps/platform/lib/api/geolocation.ts
import client from './client';

// Types for geolocation API
export interface GeolocationCoordinates {
  lat: number;
  lng: number;
  accuracy?: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
}

export interface PropertyBoundary {
  id: string;
  coordinates: GeolocationCoordinates[];
  propertyId?: string;
  userId: string;
  verified: boolean;
  markedAt: string;
  markedBy: string;
}

export interface BoundaryValidationRequest {
  coordinates: GeolocationCoordinates[];
  propertyId?: string;
  userId: string;
}

export interface BoundaryValidationResponse {
  isValid: boolean;
  conflictingBoundaries?: PropertyBoundary[];
  validationErrors?: string[];
  suggestedAdjustments?: GeolocationCoordinates[];
}

export interface PropertyFingerprint {
  id: string;
  propertyId: string;
  coordinates: GeolocationCoordinates;
  boundaryHash: string;
  buildingFeatures: string[];
  visualMarkers: string[];
  streetViewUrl?: string;
  createdAt: string;
}

export interface DuplicateDetectionRequest {
  coordinates: GeolocationCoordinates;
  boundaryCoordinates?: GeolocationCoordinates[];
  buildingFeatures?: string[];
  radius?: number; // in meters, default 50
}

export interface DuplicateDetectionResponse {
  isDuplicate: boolean;
  duplicateProperties: {
    id: string;
    title: string;
    coordinates: GeolocationCoordinates;
    boundary?: PropertyBoundary;
    confidence: number; // 0-1
    distance: number; // in meters
  }[];
  suggestions?: string[];
}

// API functions
export const geolocationApi = {
  // Get current location with high accuracy
  getCurrentLocation: async (): Promise<GeolocationCoordinates> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude || undefined,
            altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined,
          });
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  },

  // Watch location changes
  watchLocation: (
    onLocationUpdate: (location: GeolocationCoordinates) => void,
    onError: (error: Error) => void
  ): number => {
    if (!navigator.geolocation) {
      onError(new Error('Geolocation is not supported by this browser.'));
      return -1;
    }

    return navigator.geolocation.watchPosition(
      (position) => {
        onLocationUpdate({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude || undefined,
          altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
          heading: position.coords.heading || undefined,
          speed: position.coords.speed || undefined,
        });
      },
      (error) => {
        onError(new Error(`Geolocation error: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 30000,
      }
    );
  },

  // Clear location watch
  clearLocationWatch: (watchId: number): void => {
    navigator.geolocation.clearWatch(watchId);
  },

  // Validate property boundary
  validateBoundary: async (
    request: BoundaryValidationRequest
  ): Promise<BoundaryValidationResponse> => {
    const response = await client.post('/api/geolocation/validate-boundary', request);
    return response.data as BoundaryValidationResponse;
  },

  // Save property boundary
  saveBoundary: async (boundary: Omit<PropertyBoundary, 'id' | 'markedAt'>): Promise<PropertyBoundary> => {
    const response = await client.post('/api/geolocation/boundaries', boundary);
    return response.data as PropertyBoundary;
  },

  // Get property boundaries in area
  getBoundariesInArea: async (
    center: GeolocationCoordinates,
    radius: number = 1000
  ): Promise<PropertyBoundary[]> => {
    const response = await client.get('/api/geolocation/boundaries', {
      params: {
        lat: center.lat,
        lng: center.lng,
        radius,
      },
    });
    return response.data as PropertyBoundary[];
  },

  // Get property boundary by ID
  getBoundaryById: async (id: string): Promise<PropertyBoundary> => {
    const response = await client.get(`/api/geolocation/boundaries/${id}`);
    return response.data as PropertyBoundary;
  },

  // Update property boundary
  updateBoundary: async (
    id: string,
    updates: Partial<PropertyBoundary>
  ): Promise<PropertyBoundary> => {
    const response = await client.put(`/api/geolocation/boundaries/${id}`, updates);
    return response.data as PropertyBoundary;
  },

  // Delete property boundary
  deleteBoundary: async (id: string): Promise<void> => {
    await client.delete(`/api/geolocation/boundaries/${id}`);
  },

  // Detect duplicate properties
  detectDuplicates: async (
    request: DuplicateDetectionRequest
  ): Promise<DuplicateDetectionResponse> => {
    const response = await client.post('/api/geolocation/detect-duplicates', request);
    return response.data as DuplicateDetectionResponse;
  },

  // Create property fingerprint
  createFingerprint: async (
    fingerprint: Omit<PropertyFingerprint, 'id' | 'createdAt'>
  ): Promise<PropertyFingerprint> => {
    const response = await client.post('/api/geolocation/fingerprints', fingerprint);
    return response.data as PropertyFingerprint;
  },

  // Get property fingerprint
  getFingerprint: async (propertyId: string): Promise<PropertyFingerprint | null> => {
    try {
      const response = await client.get(`/api/geolocation/fingerprints/${propertyId}`);
      return response.data as PropertyFingerprint | null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Update property fingerprint
  updateFingerprint: async (
    propertyId: string,
    updates: Partial<PropertyFingerprint>
  ): Promise<PropertyFingerprint> => {
    const response = await client.put(`/api/geolocation/fingerprints/${propertyId}`, updates);
    return response.data as PropertyFingerprint;
  },

  // Get nearby properties for conflict resolution
  getNearbyProperties: async (
    coordinates: GeolocationCoordinates,
    radius: number = 100
  ): Promise<{
    id: string;
    title: string;
    coordinates: GeolocationCoordinates;
    boundary?: PropertyBoundary;
    distance: number;
    status: string;
  }[]> => {
    const response = await client.get('/api/geolocation/nearby-properties', {
      params: {
        lat: coordinates.lat,
        lng: coordinates.lng,
        radius,
      },
    });
    return response.data as {
      id: string;
      title: string;
      coordinates: GeolocationCoordinates;
      boundary?: PropertyBoundary;
      distance: number;
      status: string;
    }[];
  },

  // Report boundary conflict
  reportBoundaryConflict: async (conflictData: {
    originalBoundaryId: string;
    conflictingBoundaryId: string;
    reason: string;
    description?: string;
    evidence?: string[];
  }): Promise<{ id: string; status: string }> => {
    const response = await client.post('/api/geolocation/boundary-conflicts', conflictData);
    return response.data as { id: string; status: string };
  },

  // Geocode address to coordinates
  geocodeAddress: async (address: string): Promise<{
    coordinates: GeolocationCoordinates;
    formattedAddress: string;
    placeId?: string;
    addressComponents?: any[];
  }> => {
    const response = await client.post('/api/geolocation/geocode', { address });
    return response.data as {
      coordinates: GeolocationCoordinates;
      formattedAddress: string;
      placeId?: string;
      addressComponents?: any[];
    };
  },

  // Reverse geocode coordinates to address
  reverseGeocode: async (coordinates: GeolocationCoordinates): Promise<{
    formattedAddress: string;
    addressComponents: any[];
    placeId?: string;
  }> => {
    const response = await client.post('/api/geolocation/reverse-geocode', coordinates);
    return response.data as {
      formattedAddress: string;
      addressComponents: any[];
      placeId?: string;
    };
  },

  // Calculate distance between two points
  calculateDistance: (
    point1: GeolocationCoordinates,
    point2: GeolocationCoordinates
  ): number => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; // Distance in meters
  },

  // Check if point is within boundary polygon
  isPointInBoundary: (
    point: GeolocationCoordinates,
    boundary: GeolocationCoordinates[]
  ): boolean => {
    let inside = false;
    for (let i = 0, j = boundary.length - 1; i < boundary.length; j = i++) {
      if (((boundary[i].lat > point.lat) !== (boundary[j].lat > point.lat)) &&
        (point.lng < (boundary[j].lng - boundary[i].lng) * (point.lat - boundary[i].lat) / (boundary[j].lat - boundary[i].lat) + boundary[i].lng)) {
        inside = !inside;
      }
    }
    return inside;
  },

  // Calculate polygon area
  calculateBoundaryArea: (boundary: GeolocationCoordinates[]): number => {
    if (boundary.length < 3) return 0;

    let area = 0;
    const R = 6371000; // Earth's radius in meters

    for (let i = 0; i < boundary.length; i++) {
      const j = (i + 1) % boundary.length;
      const lat1 = boundary[i].lat * Math.PI / 180;
      const lat2 = boundary[j].lat * Math.PI / 180;
      const deltaLng = (boundary[j].lng - boundary[i].lng) * Math.PI / 180;

      area += deltaLng * (2 + Math.sin(lat1) + Math.sin(lat2));
    }

    area = Math.abs(area * R * R / 2);
    return area; // Area in square meters
  }
};

export default geolocationApi;