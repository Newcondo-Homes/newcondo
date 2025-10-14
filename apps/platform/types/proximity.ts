// apps/platform/types/proximity.ts

/**
 * Proximity calculation types for agent assignment
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface ProximityRadius {
  minRadius: number; // in kilometers
  maxRadius: number; // in kilometers
  preferredRadius: number; // in kilometers
}

export interface LocationBoundary {
  state: string;
  lga: string;
  city: string;
  coordinates?: Coordinates;
}

export interface AgentProximity {
  agentId: string;
  agentName: string;
  distance: number; // in kilometers
  estimatedTravelTime: number; // in minutes
  coordinates: Coordinates;
  isWithinPreferredRadius: boolean;
  serviceAreas: string[];
  reliabilityScore?: number;
  totalMarkingJobs: number;
  completedMarkingJobs: number;
}

export interface ProximitySearchParams {
  propertyCoordinates: Coordinates;
  propertyAddress: LocationBoundary;
  radius: number; // in kilometers
  maxAgents?: number; // Maximum number of agents to return
  excludeAgentIds?: string[]; // Agents to exclude from search
  minReliabilityScore?: number; // Minimum reliability score filter
}

export interface ProximitySearchResult {
  availableAgents: AgentProximity[];
  totalAgentsFound: number;
  searchRadius: number;
  expandedSearch: boolean; // True if radius was expanded to find agents
}

export interface DistanceCalculation {
  distance: number; // in kilometers
  duration: number; // estimated travel time in minutes
  unit: 'km' | 'mi';
}

export interface ServiceAreaCoverage {
  state: string;
  lgas: string[];
  cities: string[];
  totalAgents: number;
  averageResponseTime: number; // in minutes
}

export type ProximityFilter = 'nearest' | 'highest_rated' | 'most_experienced' | 'fastest_response';

export interface ProximityFilterOptions {
  filter: ProximityFilter;
  limit?: number;
  minReliabilityScore?: number;
  minCompletedJobs?: number;
}