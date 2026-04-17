// apps/platform/lib/api/proximity.ts
import { apiClient } from './client';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface ProximityAgent {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  distance: number;
  distanceUnit: 'km' | 'miles';
  coordinates: LocationCoordinates;
  reliabilityScore: number;
  totalMarkingJobs: number;
  completedMarkingJobs: number;
  isAvailable: boolean;
  serviceAreas: string[];
}

export interface BroadcastRequest {
  jobId: string;
  propertyLocation: LocationCoordinates;
  radius: number; // in kilometers
  maxAgents?: number;
}

export interface BroadcastResponse {
  success: boolean;
  message: string;
  totalAgentsNotified: number;
  agents: ProximityAgent[];
  broadcastRadius: number;
}

export interface NearbyPropertiesRequest {
  location: LocationCoordinates;
  radius: number;
  limit?: number;
}

export interface NearbyProperty {
  id: string;
  title: string;
  address: string;
  distance: number;
  coordinates: LocationCoordinates;
  isMarked: boolean;
  boundaryVerified: boolean;
}

/**
 * Calculate distance between two coordinates
 */
export async function calculateDistance(
  from: LocationCoordinates,
  to: LocationCoordinates
): Promise<{
  distance: number;
  unit: 'km';
  estimatedTravelTime: number;
  estimatedTravelTimeUnit: 'minutes';
}> {
  const response = await apiClient.post('/api/proximity/calculate-distance', { from, to });
  return response.data as {
    distance: number;
    unit: 'km';
    estimatedTravelTime: number;
    estimatedTravelTimeUnit: 'minutes';
  };
}

/**
 * Get nearby agents for property marking
 */
export async function getNearbyAgents(params: {
  location: LocationCoordinates;
  radius: number;
  limit?: number;
  minReliabilityScore?: number;
  onlyAvailable?: boolean;
}): Promise<{
  agents: ProximityAgent[];
  total: number;
  searchRadius: number;
}> {
  const response = await apiClient.post('/api/proximity/nearby-agents', params);
  return response.data as {
    agents: ProximityAgent[];
    total: number;
    searchRadius: number;
  };
}

/**
 * Broadcast marking job to nearby agents
 */
export async function broadcastMarkingJob(
  data: BroadcastRequest
): Promise<BroadcastResponse> {
  const response = await apiClient.post('/api/proximity/broadcast-job', data);
  return response.data as BroadcastResponse;
}

/**
 * Get nearby properties (for duplicate detection)
 */
export async function getNearbyProperties(
  params: NearbyPropertiesRequest
): Promise<{
  properties: NearbyProperty[];
  total: number;
  searchRadius: number;
}> {
  const response = await apiClient.post('/api/proximity/nearby-properties', params);
  return response.data as {
    properties: NearbyProperty[];
    total: number;
    searchRadius: number;
  };
}

/**
 * Update user/agent location
 */
export async function updateUserLocation(
  location: LocationCoordinates
): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.put('/api/proximity/update-location', location);
  return response.data as { success: boolean; message: string };
}

/**
 * Get user's current location from server
 */
export async function getUserLocation(): Promise<{
  location: LocationCoordinates;
  lastUpdated: string;
  accuracy?: number;
}> {
  const response = await apiClient.get('/api/proximity/my-location');
  return response.data as {
    location: LocationCoordinates;
    lastUpdated: string;
    accuracy?: number;
  };
}

/**
 * Validate if agent is within service area
 */
export async function validateServiceArea(params: {
  agentId: string;
  propertyLocation: LocationCoordinates;
}): Promise<{
  isWithinServiceArea: boolean;
  distance: number;
  nearestServiceArea?: string;
  message: string;
}> {
  const response = await apiClient.post('/api/proximity/validate-service-area', params);
  return response.data as {
    isWithinServiceArea: boolean;
    distance: number;
    nearestServiceArea?: string;
    message: string;
  };
}

/**
 * Get optimal radius for agent search based on location density
 */
export async function getOptimalSearchRadius(
  location: LocationCoordinates
): Promise<{
  recommendedRadius: number;
  agentDensity: 'high' | 'medium' | 'low';
  estimatedAgentsInRadius: number;
}> {
  const response = await apiClient.post('/api/proximity/optimal-radius', { location });
  return response.data as {
    recommendedRadius: number;
    agentDensity: 'high' | 'medium' | 'low';
    estimatedAgentsInRadius: number;
  };
}

/**
 * Geocode address to coordinates
 */
export async function geocodeAddress(
  address: string
): Promise<{
  coordinates: LocationCoordinates;
  formattedAddress: string;
  city?: string;
  state?: string;
  country?: string;
}> {
  const response = await apiClient.post('/api/proximity/geocode', { address });
  return response.data as {
    coordinates: LocationCoordinates;
    formattedAddress: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

/**
 * Reverse geocode coordinates to address
 */
export async function reverseGeocode(
  location: LocationCoordinates
): Promise<{
  address: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}> {
  const response = await apiClient.post('/api/proximity/reverse-geocode', location);
  return response.data as {
    address: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
}

/**
 * Check if location is within Nigeria (for validation)
 */
export async function validateLocationInNigeria(
  location: LocationCoordinates
): Promise<{
  isInNigeria: boolean;
  state?: string;
  city?: string;
  message: string;
}> {
  const response = await apiClient.post('/api/proximity/validate-nigeria', location);
  return response.data as {
    isInNigeria: boolean;
    state?: string;
    city?: string;
    message: string;
  };
}

/**
 * Get agent coverage map data
 */
export async function getAgentCoverageMap(params?: {
  state?: string;
  city?: string;
}): Promise<{
  coverageAreas: Array<{
    area: string;
    agentCount: number;
    averageResponseTime: number;
    coordinates: LocationCoordinates;
  }>;
  totalCoverage: number;
  gaps: Array<{
    area: string;
    coordinates: LocationCoordinates;
  }>;
}> {
  const response = await apiClient.get('/api/proximity/coverage-map', { params });
  return response.data as {
    coverageAreas: Array<{
      area: string;
      agentCount: number;
      averageResponseTime: number;
      coordinates: LocationCoordinates;
    }>;
    totalCoverage: number;
    gaps: Array<{
      area: string;
      coordinates: LocationCoordinates;
    }>;
  };
}