// backend/marking-service/src/services/proximityService.ts

import { PrismaClient, User, Role } from '@newcondo/db';

const prisma = new PrismaClient();

interface Coordinates {
  lat: number;
  lng: number;
}

interface AgentWithDistance extends User {
  distance: number; // in kilometers
}

interface ProximityConfig {
  maxRadius: number; // Maximum search radius in km
  priorityRadius: number; // Priority radius for nearby agents in km
  minReliabilityScore?: number; // Minimum agent reliability score
}

export class ProximityService {
  private static readonly EARTH_RADIUS_KM = 6371;
  private static readonly DEFAULT_MAX_RADIUS = 50; // 50km
  private static readonly DEFAULT_PRIORITY_RADIUS = 10; // 10km
  private static readonly MIN_RELIABILITY_SCORE = 3.0;

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  static calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const dLat = this.toRadians(coord2.lat - coord1.lat);
    const dLng = this.toRadians(coord2.lng - coord1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.lat)) *
        Math.cos(this.toRadians(coord2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return this.EARTH_RADIUS_KM * c;
  }

  /**
   * Convert degrees to radians
   */
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Parse GPS coordinates from string
   */
  static parseCoordinates(gpsString: string | null): Coordinates | null {
    if (!gpsString) return null;

    try {
      const coords = JSON.parse(gpsString);
      if (coords.lat && coords.lng) {
        return {
          lat: parseFloat(coords.lat),
          lng: parseFloat(coords.lng),
        };
      }
    } catch (error) {
      console.error('Error parsing coordinates:', error);
    }

    return null;
  }

  /**
   * Find available agents within proximity of a property
   */
  static async findNearbyAgents(
    propertyCoordinates: Coordinates,
    propertyState: string,
    config?: Partial<ProximityConfig>
  ): Promise<AgentWithDistance[]> {
    const maxRadius = config?.maxRadius || this.DEFAULT_MAX_RADIUS;
    const minReliabilityScore = config?.minReliabilityScore || this.MIN_RELIABILITY_SCORE;

    // Fetch all available agents and premium renters
    const availableUsers = await prisma.user.findMany({
      where: {
        isAvailableForMarking: true,
        verificationStatus: 'VERIFIED',
        OR: [
          { role: Role.AGENT },
          { 
            role: Role.RENTER, 
            isPremium: true,
            premiumExpiresAt: { gt: new Date() }
          },
        ],
        agentReliabilityScore: {
          gte: minReliabilityScore,
        },
      },
      include: {
        properties: {
          select: {
            gpsCoordinates: true,
            state: true,
          },
          take: 1,
        },
      },
    });

    // Calculate distances and filter by proximity
    const agentsWithDistance: AgentWithDistance[] = [];

    for (const user of availableUsers) {
      // Check if agent operates in the property's state
      if (user.agentServiceAreas && user.agentServiceAreas.length > 0) {
        const operatesInState = user.agentServiceAreas.some(
          (area) => area.toLowerCase().includes(propertyState.toLowerCase())
        );
        if (!operatesInState) continue;
      }

      // Try to get agent's coordinates from their properties
      let agentCoords: Coordinates | null = null;

      if (user.properties && user.properties.length > 0) {
        const property = user.properties[0];
        agentCoords = this.parseCoordinates(property.gpsCoordinates);
      }

      // If we have coordinates, calculate distance
      if (agentCoords) {
        const distance = this.calculateDistance(propertyCoordinates, agentCoords);

        if (distance <= maxRadius) {
          agentsWithDistance.push({
            ...user,
            distance: parseFloat(distance.toFixed(2)),
          });
        }
      } else {
        // If no coordinates, include agent with max distance (lower priority)
        // Only if they operate in the correct state
        if (user.agentServiceAreas.includes(propertyState)) {
          agentsWithDistance.push({
            ...user,
            distance: maxRadius,
          });
        }
      }
    }

    // Sort by distance (closest first) and reliability score
    return agentsWithDistance.sort((a, b) => {
      // First priority: distance
      if (a.distance !== b.distance) {
        return a.distance - b.distance;
      }

      // Second priority: reliability score
      const scoreA = a.agentReliabilityScore?.toNumber() || 0;
      const scoreB = b.agentReliabilityScore?.toNumber() || 0;
      return scoreB - scoreA;
    });
  }

  /**
   * Get priority agents (within priority radius)
   */
  static async getPriorityAgents(
    propertyCoordinates: Coordinates,
    propertyState: string,
    config?: Partial<ProximityConfig>
  ): Promise<AgentWithDistance[]> {
    const priorityRadius = config?.priorityRadius || this.DEFAULT_PRIORITY_RADIUS;

    const allNearbyAgents = await this.findNearbyAgents(propertyCoordinates, propertyState, {
      ...config,
      maxRadius: priorityRadius,
    });

    return allNearbyAgents.filter((agent) => agent.distance <= priorityRadius);
  }

  /**
   * Check if coordinates are within a specific radius of a location
   */
  static isWithinRadius(
    center: Coordinates,
    point: Coordinates,
    radiusKm: number
  ): boolean {
    const distance = this.calculateDistance(center, point);
    return distance <= radiusKm;
  }

  /**
   * Get agents by service area (state/city)
   */
  static async getAgentsByServiceArea(
    state: string,
    city?: string
  ): Promise<User[]> {
    const whereClause: any = {
      isAvailableForMarking: true,
      verificationStatus: 'VERIFIED',
      OR: [
        { role: Role.AGENT },
        { 
          role: Role.RENTER, 
          isPremium: true,
          premiumExpiresAt: { gt: new Date() }
        },
      ],
      agentServiceAreas: {
        hasSome: [state],
      },
    };

    if (city) {
      whereClause.agentServiceAreas = {
        hasSome: [state, city],
      };
    }

    return prisma.user.findMany({
      where: whereClause,
      orderBy: [
        { agentReliabilityScore: 'desc' },
        { completedMarkingJobs: 'desc' },
      ],
    });
  }

  /**
   * Calculate estimated travel time (simple estimation based on distance)
   * Assumes average speed of 40 km/h in urban areas
   */
  static estimateTravelTime(distanceKm: number): number {
    const AVERAGE_SPEED_KMH = 40;
    const timeInHours = distanceKm / AVERAGE_SPEED_KMH;
    return Math.ceil(timeInHours * 60); // Return in minutes
  }

  /**
   * Get agent availability statistics
   */
  static async getAgentAvailabilityStats(
    propertyCoordinates: Coordinates,
    propertyState: string
  ): Promise<{
    totalNearby: number;
    priorityAgents: number;
    averageDistance: number;
    averageReliability: number;
  }> {
    const nearbyAgents = await this.findNearbyAgents(propertyCoordinates, propertyState);
    const priorityAgents = nearbyAgents.filter(
      (agent) => agent.distance <= this.DEFAULT_PRIORITY_RADIUS
    );

    const totalDistance = nearbyAgents.reduce((sum, agent) => sum + agent.distance, 0);
    const averageDistance = nearbyAgents.length > 0 ? totalDistance / nearbyAgents.length : 0;

    const totalReliability = nearbyAgents.reduce(
      (sum, agent) => sum + (agent.agentReliabilityScore?.toNumber() || 0),
      0
    );
    const averageReliability =
      nearbyAgents.length > 0 ? totalReliability / nearbyAgents.length : 0;

    return {
      totalNearby: nearbyAgents.length,
      priorityAgents: priorityAgents.length,
      averageDistance: parseFloat(averageDistance.toFixed(2)),
      averageReliability: parseFloat(averageReliability.toFixed(2)),
    };
  }

  /**
   * Validate coordinates
   */
  static validateCoordinates(coordinates: Coordinates): boolean {
    const { lat, lng } = coordinates;
    return (
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180 &&
      !isNaN(lat) &&
      !isNaN(lng)
    );
  }

  /**
   * Get coordinates bounds for a radius (useful for database queries)
   */
  static getCoordinateBounds(center: Coordinates, radiusKm: number) {
    const latDelta = (radiusKm / this.EARTH_RADIUS_KM) * (180 / Math.PI);
    const lngDelta =
      (radiusKm / (this.EARTH_RADIUS_KM * Math.cos((center.lat * Math.PI) / 180))) *
      (180 / Math.PI);

    return {
      minLat: center.lat - latDelta,
      maxLat: center.lat + latDelta,
      minLng: center.lng - lngDelta,
      maxLng: center.lng + lngDelta,
    };
  }
}










// // backend/marking-service/src/services/proximityService.ts

// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// export class ProximityService {
//   // Maximum distance in kilometers to consider for agent assignment
//   private readonly MAX_DISTANCE_KM = 50;

//   /**
//    * Find eligible agents within reasonable proximity to property
//    */
//   async findEligibleAgents(
//     propertyLat: number,
//     propertyLng: number,
//     city: string,
//     state: string
//   ) {
//     // First, find agents who serve this city/state
//     const serviceAreaAgents = await prisma.user.findMany({
//       where: {
//         OR: [
//           {
//             role: 'AGENT',
//             isAvailableForMarking: true,
//           },
//           {
//             role: 'RENTER',
//             isPremium: true,
//             isAvailableForMarking: true,
//           },
//         ],
//         agentServiceAreas: {
//           hasSome: [city, state],
//         },
//         agentReliabilityScore: {
//           gte: 2.0, // Minimum reliability score
//         },
//       },
//       select: {
//         id: true,
//         name: true,
//         email: true,
//         phone: true,
//         agentReliabilityScore: true,
//         agentServiceAreas: true,
//         totalMarkingJobs: true,
//         completedMarkingJobs: true,
//       },
//     });

//     // For now, return all agents serving the area
//     // In production, you would get agent locations and calculate distances
//     return serviceAreaAgents;
//   }

//   /**
//    * Calculate distance between two coordinates using Haversine formula
//    */
//   calculateDistance(
//     lat1: number,
//     lng1: number,
//     lat2: number,
//     lng2: number
//   ): number {
//     const R = 6371; // Earth's radius in kilometers
//     const dLat = this.toRadians(lat2 - lat1);
//     const dLng = this.toRadians(lng2 - lng1);

//     const a =
//       Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//       Math.cos(this.toRadians(lat1)) *
//         Math.cos(this.toRadians(lat2)) *
//         Math.sin(dLng / 2) *
//         Math.sin(dLng / 2);

//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//     const distance = R * c;

//     return Math.round(distance * 100) / 100; // Round to 2 decimal places
//   }

//   /**
//    * Convert degrees to radians
//    */
//   private toRadians(degrees: number): number {
//     return degrees * (Math.PI / 180);
//   }

//   /**
//    * Get agents sorted by proximity to property
//    */
//   async getAgentsByProximity(
//     propertyLat: number,
//     propertyLng: number,
//     city: string,
//     state: string
//   ) {
//     const agents = await this.findEligibleAgents(propertyLat, propertyLng, city, state);

//     // In a real implementation, you would:
//     // 1. Get agent's current or home location from their profile
//     // 2. Calculate distance for each agent
//     // 3. Sort by distance
//     // 4. Filter out agents beyond MAX_DISTANCE_KM

//     // For now, sort by reliability score
//     return agents.sort((a, b) => {
//       const scoreA = Number(a.agentReliabilityScore) || 0;
//       const scoreB = Number(b.agentReliabilityScore) || 0;
//       return scoreB - scoreA;
//     });
//   }

//   /**
//    * Check if location is within agent's service area
//    */
//   isWithinServiceArea(
//     city: string,
//     state: string,
//     agentServiceAreas: string[]
//   ): boolean {
//     return agentServiceAreas.some(
//       area =>
//         area.toLowerCase() === city.toLowerCase() ||
//         area.toLowerCase() === state.toLowerCase()
//     );
//   }

//   /**
//    * Get service area coverage statistics
//    */
//   async getServiceAreaCoverage() {
//     const agents = await prisma.user.findMany({
//       where: {
//         OR: [
//           {
//             role: 'AGENT',
//             isAvailableForMarking: true,
//           },
//           {
//             role: 'RENTER',
//             isPremium: true,
//             isAvailableForMarking: true,
//           },
//         ],
//       },
//       select: {
//         agentServiceAreas: true,
//       },
//     });

//     // Count agents per service area
//     const areaCoverage = new Map<string, number>();

//     agents.forEach(agent => {
//       agent.agentServiceAreas.forEach(area => {
//         areaCoverage.set(area, (areaCoverage.get(area) || 0) + 1);
//       });
//     });

//     // Convert to array and sort
//     const coverage = Array.from(areaCoverage.entries())
//       .map(([area, agentCount]) => ({ area, agentCount }))
//       .sort((a, b) => b.agentCount - a.agentCount);

//     return {
//       totalAreas: areaCoverage.size,
//       coverage,
//       totalAgents: agents.length,
//     };
//   }

//   /**
//    * Suggest service areas for an agent based on demand
//    */
//   async suggestServiceAreas(limit = 5) {
//     // Get all properties with marking jobs
//     const properties = await prisma.property.findMany({
//       where: {
//         markingJobs: {
//           some: {
//             status: {
//               in: ['QUEUED', 'ASSIGNED'],
//             },
//           },
//         },
//       },
//       select: {
//         city: true,
//         state: true,
//       },
//     });

//     // Count demand per area
//     const areaDemand = new Map<string, number>();

//     properties.forEach(property => {
//       const cityKey = property.city;
//       const stateKey = property.state;

//       areaDemand.set(cityKey, (areaDemand.get(cityKey) || 0) + 1);
//       areaDemand.set(stateKey, (areaDemand.get(stateKey) || 0) + 1);
//     });

//     // Get current coverage
//     const currentCoverage = await this.getServiceAreaCoverage();
//     const coverageMap = new Map(
//       currentCoverage.coverage.map(c => [c.area, c.agentCount])
//     );

//     // Calculate supply/demand ratio
//     const suggestions = Array.from(areaDemand.entries())
//       .map(([area, demand]) => {
//         const supply = coverageMap.get(area) || 0;
//         const ratio = supply > 0 ? demand / supply : demand;

//         return {
//           area,
//           demand,
//           currentAgents: supply,
//           needsMoreAgents: ratio > 2, // More than 2 jobs per agent
//           priority: ratio,
//         };
//       })
//       .filter(s => s.needsMoreAgents)
//       .sort((a, b) => b.priority - a.priority)
//       .slice(0, limit);

//     return suggestions;
//   }

//   /**
//    * Check agent availability in specific location
//    */
//   async checkAgentAvailability(city: string, state: string) {
//     const agents = await this.findEligibleAgents(0, 0, city, state);

//     // Count active jobs per agent
//     const agentsWithWorkload = await Promise.all(
//       agents.map(async agent => {
//         const activeJobs = await prisma.propertyMarkingJob.count({
//           where: {
//             assignedAgentId: agent.id,
//             status: {
//               in: ['ASSIGNED', 'IN_PROGRESS'],
//             },
//           },
//         });

//         return {
//           ...agent,
//           activeJobs,
//           isAvailable: activeJobs < 3, // Max 3 concurrent jobs
//         };
//       })
//     );

//     const availableAgents = agentsWithWorkload.filter(a => a.isAvailable);

//     return {
//       totalAgents: agents.length,
//       availableAgents: availableAgents.length,
//       busyAgents: agents.length - availableAgents.length,
//       agents: agentsWithWorkload,
//     };
//   }
// }

// export default ProximityService;