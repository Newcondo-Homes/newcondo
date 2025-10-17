// backend/marking-service/src/services/agentGeolocationService.ts

import prisma from '@newcondo/db';

interface GeoLocation {
  lat: number;
  lng: number;
}

interface AgentLocation {
  agentId: string;
  name: string;
  lat: number;
  lng: number;
  distance: number; // in kilometers
  reliabilityScore: number;
  serviceAreas: string[];
  isAvailable: boolean;
}

interface ProximityAssignmentResult {
  eligibleAgents: AgentLocation[];
  recommendedAgent: AgentLocation | null;
  assignmentStrategy: string;
}

interface ServiceAreaMatch {
  agentId: string;
  name: string;
  city: string;
  state: string;
  reliabilityScore: number;
  distanceFromProperty: number;
}

/**
 * Agent Geolocation Service - Handles proximity-based agent assignment
 * Uses GPS coordinates and service areas to find suitable agents
 */
export class AgentGeolocationService {
  /**
   * Calculate distance between two GPS coordinates using Haversine formula
   * Returns distance in kilometers
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Extract GPS coordinates from property JSON
   */
  private parseGpsCoordinates(gpsString: string | null): GeoLocation | null {
    if (!gpsString) return null;

    try {
      // Assuming the format is a JSON string like '{"lat": 6.5244, "lng": 3.3792}'
      const coords = JSON.parse(gpsString);
      if (typeof coords === 'object' && coords !== null && typeof coords.lat === 'number' && typeof coords.lng === 'number') {
        return { lat: coords.lat, lng: coords.lng };
      }
    } catch (error) {
      console.error('Error parsing GPS coordinates:', error);
    }
    return null;
  }

  /**
   * Find agents within proximity of a property
   * Considers: distance, service areas, reliability, availability
   */
  async findAgentsNearProperty(
    propertyId: string,
    maxDistanceKm: number = 15,
    minReliabilityScore: number = 2.5
  ): Promise<AgentLocation[]> {
    try {
      // Fetch property details
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
      });

      if (!property) {
        throw new Error(`Property not found: ${propertyId}`);
      }

      // Parse property GPS coordinates
      const propertyLocation = this.parseGpsCoordinates(property.gpsCoordinates);
      if (!propertyLocation) {
        throw new Error(`Property has no valid GPS coordinates: ${propertyId}`);
      }

      // Fetch all eligible agents who have a location set (for distance calculation)
      const availableAgents = await prisma.user.findMany({
        where: {
          role: 'AGENT',
          isAvailableForMarking: true,
          agentReliabilityScore: {
            gte: minReliabilityScore,
          },
          // Filter by service area as a first step (city or state match)
          agentServiceAreas: {
            hasSome: [property.city, property.state],
          },
          // Assuming agent's current location is stored in a `currentLocation` field (JSON/GeoJSON/string)
          // For now, we'll assume a placeholder location for distance calculation as the actual field is unknown
          // and we'll focus on the logic.
        },
        select: {
          id: true,
          name: true,
          agentServiceAreas: true,
          agentReliabilityScore: true,
          currentLocation: true, // Placeholder for agent's current/last known GPS
        },
      });

      if (availableAgents.length === 0) {
        console.warn(
          `No available agents found in service area for property ${propertyId}`
        );
        return [];
      }

      const agentsWithDistance: AgentLocation[] = availableAgents
        .map((agent) => {
          // --- BEGIN: Placeholder for Agent Location Parsing ---
          // In a real system, you'd fetch the agent's current/last-known GPS.
          // Since the schema isn't provided, we'll simulate a check:
          const agentLocation = this.parseGpsCoordinates(agent.currentLocation);
          if (!agentLocation) return null;

          const distance = this.calculateDistance(
            propertyLocation.lat,
            propertyLocation.lng,
            agentLocation.lat,
            agentLocation.lng
          );
          // --- END: Placeholder for Agent Location Parsing ---

          return {
            agentId: agent.id,
            name: agent.name || 'Unknown',
            lat: agentLocation.lat,
            lng: agentLocation.lng,
            distance: parseFloat(distance.toFixed(2)), // Round to 2 decimal places
            reliabilityScore: agent.agentReliabilityScore?.toNumber() || 0,
            serviceAreas: agent.agentServiceAreas,
            isAvailable: true,
          };
        })
        .filter((agent): agent is AgentLocation => agent !== null)
        .filter((agent) => agent.distance <= maxDistanceKm) // Filter by max distance
        .sort((a, b) => {
          // Primary sort: Distance (ascending)
          if (a.distance !== b.distance) {
            return a.distance - b.distance;
          }
          // Secondary sort: Reliability (descending)
          return b.reliabilityScore - a.reliabilityScore;
        });

      return agentsWithDistance;
    } catch (error) {
      console.error(
        `Error finding agents near property ${propertyId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Filter agents by service area (city, state, region)
   */
  async findAgentsByServiceArea(
    city: string,
    state: string,
    minReliabilityScore: number = 2.5
  ): Promise<ServiceAreaMatch[]> {
    try {
      // Standardize search terms
      const searchAreas = [city, state].filter(Boolean).map(a => a.toLowerCase());

      const agents = await prisma.user.findMany({
        where: {
          role: 'AGENT',
          isAvailableForMarking: true,
          agentReliabilityScore: {
            gte: minReliabilityScore,
          },
          // AgentServiceAreas is a list of strings, checking if it contains any of the search terms
          agentServiceAreas: {
            hasSome: searchAreas,
          },
        },
        select: {
          id: true,
          name: true,
          agentReliabilityScore: true,
          agentServiceAreas: true,
          // Need to fetch current location to calculate distanceFromProperty accurately
          // Since we can't do that here without property location, we keep distance as 0
          // but acknowledge the field's purpose.
        },
      });

      return agents.map((agent) => ({
        agentId: agent.id,
        name: agent.name || 'Unknown',
        city,
        state,
        reliabilityScore: agent.agentReliabilityScore?.toNumber() || 0,
        distanceFromProperty: 0, // Placeholder - requires property location for calculation
      }));
    } catch (error) {
      console.error(
        `Error finding agents in service area ${city}, ${state}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get proximity-based agent assignment recommendation
   * Uses multiple criteria to suggest best agent
   */
  async getProximityAssignmentRecommendation(
    propertyId: string,
    maxDistanceKm: number = 15
  ): Promise<ProximityAssignmentResult> {
    try {
      // Find agents by proximity (this function already includes service area and distance filtering)
      const proximityAgents = await this.findAgentsNearProperty(
        propertyId,
        maxDistanceKm
      );

      // Convert to ServiceAreaMatch-like objects for scoring/ranking consistency
      const eligibleAgents = proximityAgents.map((agent) => ({
        agentId: agent.agentId,
        name: agent.name,
        city: '', // Not needed for scoring here
        state: '', // Not needed for scoring here
        reliabilityScore: agent.reliabilityScore,
        distanceFromProperty: agent.distance,
      }));

      if (eligibleAgents.length === 0) {
        return {
          eligibleAgents: [],
          recommendedAgent: null,
          assignmentStrategy: 'NO_AGENTS_IN_PROXIMITY_AND_AREA',
        };
      }

      // Score agents based on:
      // 1. Reliability score (primary)
      // 2. Distance (secondary)
      const scoredAgents = eligibleAgents.map((agent) => {
        // Normalize distance: closer is better. Max distance is 'maxDistanceKm'.
        // Distance Weight: Max score (e.g., 50) - (Current Distance / Max Distance * Max Score)
        const maxScore = 50;
        const distanceWeight = maxScore - (agent.distanceFromProperty / maxDistanceKm) * maxScore;

        // Reliability Weight: 0-5 scale to 0-50 for equal importance to distance
        const reliabilityWeight = agent.reliabilityScore * 10; // Assuming max score of 5

        const compositeScore = reliabilityWeight + distanceWeight;

        return {
          ...agent,
          compositeScore: compositeScore,
        };
      });

      // Sort by composite score (descending)
      const rankedAgents = scoredAgents.sort(
        (a, b) => b.compositeScore - a.compositeScore
      );

      // Recommended agent is the top-ranked one
      const topAgent = rankedAgents[0];
      const recommendedAgent: AgentLocation | null = topAgent
        ? {
            agentId: topAgent.agentId,
            name: topAgent.name,
            // Re-fetch full details or use the ones from proximityAgents
            // For now, use the full proximity agent object that corresponds to topAgent's ID
            lat: proximityAgents.find(a => a.agentId === topAgent.agentId)?.lat || 0,
            lng: proximityAgents.find(a => a.agentId === topAgent.agentId)?.lng || 0,
            distance: topAgent.distanceFromProperty,
            reliabilityScore: topAgent.reliabilityScore,
            serviceAreas: proximityAgents.find(a => a.agentId === topAgent.agentId)?.serviceAreas || [],
            isAvailable: true,
          }
        : null;

      // Convert proximityAgents to AgentLocation format for eligibleAgents response
      const agentLocations: AgentLocation[] = proximityAgents;

      return {
        eligibleAgents: agentLocations,
        recommendedAgent,
        assignmentStrategy: 'COMPOSITE_SCORE_PROXIMITY',
      };
    } catch (error) {
      console.error(
        `Error getting proximity assignment recommendation:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get agents within a radius for broadcast (FCFS queue)
   * Returns all agents in service area for queue distribution
   */
  async getAgentsForQueueBroadcast(
    propertyId: string
  ): Promise<
    Array<{
      agentId: string;
      name: string;
      email: string | null;
      phone: string | null;
      reliabilityScore: number;
    }>
  > {
    try {
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
      });

      if (!property) {
        throw new Error(`Property not found: ${propertyId}`);
      }

      // Fetch all agents in the service area (city/state)
      const searchAreas = [property.city, property.state].filter(Boolean).map(a => a.toLowerCase());

      const agentsForQueue = await prisma.user.findMany({
        where: {
          role: 'AGENT',
          isAvailableForMarking: true,
          agentReliabilityScore: {
            gte: 2.5, // Minimum qualification
          },
          agentServiceAreas: {
            hasSome: searchAreas,
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          agentReliabilityScore: true,
        },
        orderBy: {
          agentReliabilityScore: 'desc',
        },
      });

      return agentsForQueue.map((agent) => ({
        agentId: agent.id,
        name: agent.name || 'Unknown',
        email: agent.email,
        phone: agent.phone,
        reliabilityScore: agent.agentReliabilityScore?.toNumber() || 0,
      }));
    } catch (error) {
      console.error(`Error getting agents for queue broadcast:`, error);
      throw error;
    }
  }

  /**
   * Check if agent serves a specific location
   */
  async isAgentInServiceArea(
    agentId: string,
    city: string,
    state: string
  ): Promise<boolean> {
    try {
      const agent = await prisma.user.findUnique({
        where: { id: agentId },
        select: {
          agentServiceAreas: true,
          isAvailableForMarking: true,
        },
      });

      if (!agent || !agent.isAvailableForMarking) {
        return false;
      }

      const searchAreas = [city, state].filter(Boolean).map(a => a.toLowerCase());

      return agent.agentServiceAreas.some(
        (area) => searchAreas.includes(area.toLowerCase())
      );
    } catch (error) {
      console.error(
        `Error checking agent service area for ${agentId}:`,
        error
      );
      return false;
    }
  }

  /**
   * Update agent's service areas
   */
  async updateAgentServiceAreas(
    agentId: string,
    serviceAreas: string[]
  ): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: agentId },
        data: {
          agentServiceAreas: serviceAreas,
        },
      });

      console.info(
        `Agent ${agentId} service areas updated to: ${serviceAreas.join(', ')}`
      );
    } catch (error) {
      console.error(
        `Error updating service areas for agent ${agentId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get coverage statistics for admin dashboard
   */
  async getServiceAreaCoverageStats(): Promise<{
    totalAgents: number;
    agentsByState: Record<string, number>;
    areasWithLowCoverage: string[];
    areasWithNoCoverage: string[];
  }> {
    try {
      const agents = await prisma.user.findMany({
        where: {
          role: 'AGENT',
          isAvailableForMarking: true,
        },
        select: {
          agentServiceAreas: true,
        },
      });

      // Count agents per service area (city/state)
      const agentsByState: Record<string, number> = {};
      agents.forEach((agent) => {
        agent.agentServiceAreas.forEach((area) => {
          const normalizedArea = area.toLowerCase();
          agentsByState[normalizedArea] = (agentsByState[normalizedArea] || 0) + 1;
        });
      });

      // Identify areas with low coverage (less than 3 agents)
      const lowCoverageThreshold = 3;
      const areasWithLowCoverage = Object.entries(agentsByState)
        .filter(([, count]) => count < lowCoverageThreshold && count > 0)
        .map(([area]) => area);

      // Get list of Nigerian states (predefined)
      const nigerianStates = [
        'Abia',
        'Adamawa',
        'Akwa Ibom',
        'Anambra',
        'Bauchi',
        'Bayelsa',
        'Benue',
        'Borno',
        'Cross River',
        'Delta',
        'Ebonyi',
        'Edo',
        'Ekiti',
        'Enugu',
        'Gombe',
        'Imo',
        'Jigawa',
        'Kaduna',
        'Kano',
        'Katsina',
        'Kebbi',
        'Kogi',
        'Kwara',
        'Lagos',
        'Nasarawa',
        'Niger',
        'Ogun',
        'Ondo',
        'Osun',
        'Oyo',
        'Plateau',
        'Rivers',
        'Sokoto',
        'Taraba',
        'Yobe',
        'Zamfara',
        'FCT',
      ].map(s => s.toLowerCase()); // Normalize states for lookup

      // Areas with no coverage (checking the predefined states)
      const areasWithNoCoverage = nigerianStates
        .filter(
          (state) => !(state in agentsByState)
        )
        .map(s => s.charAt(0).toUpperCase() + s.slice(1)); // Convert back to Title Case for display

      // Convert keys in agentsByState back to Title Case for a cleaner display, 
      // but keep the internal logic using lowercase.
      const displayAgentsByState: Record<string, number> = {};
      for (const [key, value] of Object.entries(agentsByState)) {
          displayAgentsByState[key.charAt(0).toUpperCase() + key.slice(1)] = value;
      }


      return {
        totalAgents: agents.length,
        agentsByState: displayAgentsByState,
        areasWithLowCoverage: areasWithLowCoverage.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
        areasWithNoCoverage,
      };
    } catch (error) {
      console.error('Error getting service area coverage stats:', error);
      throw error;
    }
  }

  /**
   * Validate GPS coordinates format
   */
  isValidGpsCoordinates(gpsString: string): boolean {
    try {
      const coords = JSON.parse(gpsString);
      // Check if it's an object with lat and lng fields being numbers
      if (
        typeof coords === 'object' &&
        coords !== null &&
        typeof coords.lat === 'number' &&
        typeof coords.lng === 'number' &&
        coords.lat >= -90 && coords.lat <= 90 && // Latitude bounds
        coords.lng >= -180 && coords.lng <= 180 // Longitude bounds
      ) {
        return true;
      }
      return false;
    } catch (error) {
      // JSON parsing failed
      return false;
    }
  }
}

export const agentGeolocationService = new AgentGeolocationService();