// apps/platform/src/lib/api/boundary.ts

import { apiClient } from './client';

export interface BoundaryCoordinates {
  lat: number;
  lng: number;
}

export interface CreateBoundaryRequest {
  propertyId: string;
  coordinates: BoundaryCoordinates[];
  center: BoundaryCoordinates;
  area: number;
  gpsCoordinates: BoundaryCoordinates;
  address: string;
  city: string;
  state: string;
  buildingFeatures?: string[];
}

export interface BoundaryResponse {
  id: string;
  coordinates: BoundaryCoordinates[];
  center: BoundaryCoordinates;
  area: number;
  isMarkedByUser: boolean;
  markedAt: string;
  markedBy: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  propertyId: string;
}

export interface NearbyBoundariesRequest {
  latitude: number;
  longitude: number;
  radius?: number; // in meters, default 100
}

export interface DuplicateCheckRequest {
  coordinates: BoundaryCoordinates[];
  center: BoundaryCoordinates;
  address: string;
  buildingFeatures?: string[];
}

export interface DuplicateCheckResponse {
  isDuplicate: boolean;
  duplicateProperties: {
    id: string;
    title: string;
    address: string;
    coordinates: BoundaryCoordinates[];
    similarity: number;
    owner: {
      id: string;
      name: string;
      email: string;
    };
  }[];
  similarityScore: number;
}

export interface BoundaryValidationRequest {
  coordinates: BoundaryCoordinates[];
  maxArea?: number; // in square meters
  minArea?: number; // in square meters
}

export interface BoundaryValidationResponse {
  isValid: boolean;
  errors: string[];
  area: number;
  warnings: string[];
}

class BoundaryService {
  async createBoundary(data: CreateBoundaryRequest): Promise<BoundaryResponse> {
    const response = await apiClient.post('/boundaries', data);
    return response.data as BoundaryResponse;
  }

  async getNearbyBoundaries(params: NearbyBoundariesRequest): Promise<BoundaryResponse[]> {
    const response = await apiClient.get('/boundaries/nearby', { params });
    return response.data as BoundaryResponse[];
  }

  async checkForDuplicates(data: DuplicateCheckRequest): Promise<DuplicateCheckResponse> {
    const response = await apiClient.post('/boundaries/check-duplicates', data);
    return response.data as DuplicateCheckResponse;
  }

  async validateBoundary(data: BoundaryValidationRequest): Promise<BoundaryValidationResponse> {
    const response = await apiClient.post('/boundaries/validate', data);
    return response.data as BoundaryValidationResponse;
  }

  async getBoundaryById(id: string): Promise<BoundaryResponse> {
    const response = await apiClient.get(`/boundaries/${id}`);
    return response.data as BoundaryResponse;
  }

  async updateBoundary(id: string, data: Partial<CreateBoundaryRequest>): Promise<BoundaryResponse> {
    const response = await apiClient.put(`/boundaries/${id}`, data);
    return response.data as BoundaryResponse;
  }

  async deleteBoundary(id: string): Promise<void> {
    await apiClient.delete(`/boundaries/${id}`);
  }

  async getUserBoundaries(userId: string): Promise<BoundaryResponse[]> {
    const response = await apiClient.get(`/boundaries/user/${userId}`);
    return response.data as BoundaryResponse[];
  }

  async reportBoundaryConflict(data: {
    originalBoundaryId: string;
    conflictingBoundaryId: string;
    reason: string;
    description: string;
  }): Promise<void> {
    await apiClient.post('/boundaries/report-conflict', data);
  }

  async getConflictingBoundaries(boundaryId: string): Promise<BoundaryResponse[]> {
    const response = await apiClient.get(`/boundaries/${boundaryId}/conflicts`);
    return response.data as BoundaryResponse[];
  }

  // Geolocation utilities
  async getCurrentLocation(): Promise<BoundaryCoordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }

  // Calculate area of polygon using Shoelace formula
  calculatePolygonArea(coordinates: BoundaryCoordinates[]): number {
    if (coordinates.length < 3) return 0;

    let area = 0;
    const n = coordinates.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += coordinates[i].lat * coordinates[j].lng;
      area -= coordinates[j].lat * coordinates[i].lng;
    }

    return Math.abs(area) / 2;
  }

  // Convert polygon area to square meters (approximate)
  convertToSquareMeters(area: number, centerLat: number): number {
    const earthRadius = 6371000; // Earth radius in meters
    const latRad = (centerLat * Math.PI) / 180;
    const metersPerDegree = earthRadius * Math.cos(latRad) * (Math.PI / 180);
    return area * metersPerDegree * metersPerDegree;
  }

  // Check if point is inside polygon
  isPointInPolygon(point: BoundaryCoordinates, polygon: BoundaryCoordinates[]): boolean {
    const x = point.lat;
    const y = point.lng;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lat;
      const yi = polygon[i].lng;
      const xj = polygon[j].lat;
      const yj = polygon[j].lng;

      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }

    return inside;
  }

  // Calculate distance between two points
  calculateDistance(point1: BoundaryCoordinates, point2: BoundaryCoordinates): number {
    const R = 6371000; // Earth radius in meters
    const lat1Rad = (point1.lat * Math.PI) / 180;
    const lat2Rad = (point2.lat * Math.PI) / 180;
    const deltaLat = ((point2.lat - point1.lat) * Math.PI) / 180;
    const deltaLng = ((point2.lng - point1.lng) * Math.PI) / 180;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1Rad) * Math.cos(lat2Rad) *
      Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Generate building fingerprint for duplicate detection
  generateBuildingFingerprint(data: {
    coordinates: BoundaryCoordinates[];
    center: BoundaryCoordinates;
    address: string;
    buildingFeatures?: string[];
  }): string {
    const { coordinates, center, address, buildingFeatures = [] } = data;
    
    // Create a normalized representation
    const normalizedCoords = coordinates.map(coord => ({
      lat: Math.round(coord.lat * 1000000) / 1000000,
      lng: Math.round(coord.lng * 1000000) / 1000000,
    }));

    const normalizedCenter = {
      lat: Math.round(center.lat * 1000000) / 1000000,
      lng: Math.round(center.lng * 1000000) / 1000000,
    };

    const normalizedAddress = address.toLowerCase().replace(/\s+/g, '');
    const sortedFeatures = buildingFeatures.sort().join(',');

    const fingerprint = `${normalizedCenter.lat},${normalizedCenter.lng}|${normalizedCoords.map(c => `${c.lat},${c.lng}`).join('|')}|${normalizedAddress}|${sortedFeatures}`;
    
    // Generate hash
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash.toString(16);
  }
}

export const boundaryService = new BoundaryService();