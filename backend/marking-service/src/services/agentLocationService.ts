// backend/marking-service/src/services/agentLocationService.ts

import { PrismaClient } from '@prisma/client';
import { NotificationService } from './notificationService';

const prisma = new PrismaClient();

export class AgentLocationService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Update agent's service areas
   */
  async updateAgentServiceAreas(agentId: string, serviceAreas: string[]) {
    // Validate service areas
    if (!serviceAreas || serviceAreas.length === 0) {
      throw new Error('At least one service area is required');
    }

    // Normalize service areas (trim and capitalize)
    const normalizedAreas = serviceAreas.map(area => 
      area.trim().split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ')
    );

    // Remove duplicates
    const uniqueAreas = [...new Set(normalizedAreas)];

    // Update agent
    const updatedAgent = await prisma.user.update({
      where: { id: agentId },
      data: {
        agentServiceAreas: uniqueAreas,
        isAvailableForMarking: true, // Enable marking when service areas are set
      },
      select: {
        id: true,
        name: true,
        email: true,
        agentServiceAreas: true,
        isAvailableForMarking: true,
      },
    });

    // Notify agent
    await this.notificationService.notifyAgentLocationUpdated(agentId);

    // Log event
    await prisma.eventLog.create({
      data: {
        userId: agentId,
        type: 'SERVICE_AREAS_UPDATED',
        metadata: {
          serviceAreas: uniqueAreas,
        },
      },
    });

    return updatedAgent;
  }

  /**
   * Add service area to agent
   */
  async addServiceArea(agentId: string, serviceArea: string) {
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      select: {
        agentServiceAreas: true,
      },
    });

    if (!agent) {
      throw new Error('Agent not found');
    }

    // Normalize service area
    const normalizedArea = serviceArea.trim().split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');

    // Check if already exists
    if (agent.agentServiceAreas.includes(normalizedArea)) {
      throw new Error('Service area already exists');
    }

    // Add new service area
    const updatedAgent = await prisma.user.update({
      where: { id: agentId },
      data: {
        agentServiceAreas: {
          push: normalizedArea,
        },
      },
      select: {
        id: true,
        agentServiceAreas: true,
      },
    });

    return updatedAgent;
  }

  /**
   * Remove service area from agent
   */
  async removeServiceArea(agentId: string, serviceArea: string) {
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      select: {
        agentServiceAreas: true,
      },
    });

    if (!agent) {
      throw new Error('Agent not found');
    }

    // Filter out the service area
    const updatedAreas = agent.agentServiceAreas.filter(area => area !== serviceArea);

    if (updatedAreas.length === agent.agentServiceAreas.length) {
      throw new Error('Service area not found');
    }

    // Ensure at least one service area remains
    if (updatedAreas.length === 0) {
      throw new Error('Cannot remove last service area. Agent must have at least one service area.');
    }

    // Update agent
    const updatedAgent = await prisma.user.update({
      where: { id: agentId },
      data: {
        agentServiceAreas: updatedAreas,
      },
      select: {
        id: true,
        agentServiceAreas: true,
      },
    });

    return updatedAgent;
  }

  /**
   * Get agent's service areas
   */
  async getAgentServiceAreas(agentId: string) {
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      select: {
        id: true,
        name: true,
        agentServiceAreas: true,
        isAvailableForMarking: true,
      },
    });

    if (!agent) {
      throw new Error('Agent not found');
    }

    // Get job statistics per service area
    const areaStats = await Promise.all(
      agent.agentServiceAreas.map(async area => {
        const completedJobs = await prisma.propertyMarkingJob.count({
          where: {
            assignedAgentId: agentId,
            status: 'COMPLETED',
            OR: [
              { property: { city: area } },
              { property: { state: area } },
            ],
          },
        });

        const activeJobs = await prisma.propertyMarkingJob.count({
          where: {
            assignedAgentId: agentId,
            status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
            OR: [
              { property: { city: area } },
              { property: { state: area } },
            ],
          },
        });

        return {
          area,
          completedJobs,
          activeJobs,
        };
      })
    );

    return {
      agent,
      serviceAreas: areaStats,
    };
  }

  /**
   * Toggle agent availability for marking
   */
  async toggleAvailability(agentId: string, isAvailable: boolean) {
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      select: {
        agentServiceAreas: true,
        role: true,
        isPremium: true,
      },
    });

    if (!agent) {
      throw new Error('Agent not found');
    }

    // Validate eligibility
    if (agent.role === 'RENTER' && !agent.isPremium) {
      throw new Error('Renters must have premium subscription to accept marking jobs');
    }

    if (isAvailable && agent.agentServiceAreas.length === 0) {
      throw new Error('Must set service areas before becoming available for marking');
    }

    // Update availability
    const updatedAgent = await prisma.user.update({
      where: { id: agentId },
      data: {
        isAvailableForMarking: isAvailable,
      },
      select: {
        id: true,
        name: true,
        isAvailableForMarking: true,
      },
    });

    // Log event
    await prisma.eventLog.create({
      data: {
        userId: agentId,
        type: isAvailable ? 'MARKING_AVAILABILITY_ENABLED' : 'MARKING_AVAILABILITY_DISABLED',
        metadata: {
          isAvailable,
        },
      },
    });

    return updatedAgent;
  }

  /**
   * Get available agents by location
   */
  async getAvailableAgentsByLocation(city: string, state: string) {
    const agents = await prisma.user.findMany({
      where: {
        OR: [
          {
            role: 'AGENT',
            isAvailableForMarking: true,
          },
          {
            role: 'RENTER',
            isPremium: true,
            isAvailableForMarking: true,
          },
        ],
        agentServiceAreas: {
          hasSome: [city, state],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        agentServiceAreas: true,
        agentReliabilityScore: true,
        totalMarkingJobs: true,
        completedMarkingJobs: true,
      },
    });

    // Get current workload for each agent
    const agentsWithWorkload = await Promise.all(
      agents.map(async agent => {
        const activeJobs = await prisma.propertyMarkingJob.count({
          where: {
            assignedAgentId: agent.id,
            status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
          },
        });

        return {
          ...agent,
          activeJobs,
          isCurrentlyAvailable: activeJobs < 3, // Max 3 concurrent jobs
        };
      })
    );

    return agentsWithWorkload.filter(a => a.isCurrentlyAvailable);
  }

  /**
   * Get service area statistics
   */
  async getServiceAreaStats() {
    const agents = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'AGENT', isAvailableForMarking: true },
          { role: 'RENTER', isPremium: true, isAvailableForMarking: true },
        ],
      },
      select: {
        agentServiceAreas: true,
      },
    });

    // Count agents per area
    const areaCounts = new Map<string, number>();
    agents.forEach(agent => {
      agent.agentServiceAreas.forEach(area => {
        areaCounts.set(area, (areaCounts.get(area) || 0) + 1);
      });
    });

    // Get job demand per area
    const properties = await prisma.property.findMany({
      select: {
        city: true,
        state: true,
      },
    });

    const areaDemand = new Map<string, number>();
    properties.forEach(property => {
      areaDemand.set(property.city, (areaDemand.get(property.city) || 0) + 1);
      areaDemand.set(property.state, (areaDemand.get(property.state) || 0) + 1);
    });

    // Combine statistics
    const allAreas = new Set([...areaCounts.keys(), ...areaDemand.keys()]);
    const stats = Array.from(allAreas).map(area => ({
      area,
      agentCount: areaCounts.get(area) || 0,
      demandCount: areaDemand.get(area) || 0,
      supplyDemandRatio: 
        (areaDemand.get(area) || 0) > 0 
          ? ((areaCounts.get(area) || 0) / (areaDemand.get(area) || 0)).toFixed(2)
          : 'N/A',
    }));

    return {
      totalAreas: allAreas.size,
      totalAgents: agents.length,
      stats: stats.sort((a, b) => b.demandCount - a.demandCount),
    };
  }

  /**
   * Validate Nigerian location
   */
  validateNigerianLocation(location: string): boolean {
    // List of Nigerian states
    const nigerianStates = [
      'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
      'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
      'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi',
      'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo',
      'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara', 'FCT'
    ];

    // Normalize input
    const normalized = location.trim().split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');

    // Check if it's a known state
    return nigerianStates.includes(normalized);
  }

  /**
   * Get suggested service areas for agent based on performance
   */
  async getSuggestedServiceAreas(agentId: string, limit = 5) {
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      select: {
        agentServiceAreas: true,
      },
    });

    if (!agent) {
      throw new Error('Agent not found');
    }

    // Get areas with high demand but low agent coverage
    const allProperties = await prisma.property.findMany({
      select: {
        city: true,
        state: true,
      },
    });

    const demandMap = new Map<string, number>();
    allProperties.forEach(property => {
      demandMap.set(property.city, (demandMap.get(property.city) || 0) + 1);
      demandMap.set(property.state, (demandMap.get(property.state) || 0) + 1);
    });

    // Get current agent coverage
    const allAgents = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'AGENT', isAvailableForMarking: true },
          { role: 'RENTER', isPremium: true, isAvailableForMarking: true },
        ],
      },
      select: {
        agentServiceAreas: true,
      },
    });

    const coverageMap = new Map<string, number>();
    allAgents.forEach(a => {
      a.agentServiceAreas.forEach(area => {
        coverageMap.set(area, (coverageMap.get(area) || 0) + 1);
      });
    });

    // Calculate opportunity score
    const suggestions = Array.from(demandMap.entries())
      .filter(([area]) => !agent.agentServiceAreas.includes(area))
      .map(([area, demand]) => {
        const coverage = coverageMap.get(area) || 0;
        const opportunityScore = coverage > 0 ? demand / coverage : demand;

        return {
          area,
          demand,
          currentAgents: coverage,
          opportunityScore: Math.round(opportunityScore * 100) / 100,
        };
      })
      .sort((a, b) => b.opportunityScore - a.opportunityScore)
      .slice(0, limit);

    return suggestions;
  }
}

export default AgentLocationService;