// backend/marking-service/src/controllers/agentLocationController.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { standardResponse } from '../../../shared/src/utils/response';

const prisma = new PrismaClient();

/**
 * Update agent's service areas/location details
 * PUT /api/agent-location
 */
export const updateAgentLocation = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json(standardResponse(false, 'Unauthorized', null));
    }

    const { serviceAreas, isAvailableForMarking } = req.body;

    // Validate input
    if (!serviceAreas || !Array.isArray(serviceAreas) || serviceAreas.length === 0) {
      return res.status(400).json(
        standardResponse(false, 'Service areas must be a non-empty array', null)
      );
    }

    // Verify user is eligible (agent or premium renter)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, isPremium: true }
    });

    const isEligible =
      user?.role === 'AGENT' || (user?.role === 'RENTER' && user?.isPremium);

    if (!isEligible) {
      return res.status(403).json(
        standardResponse(
          false,
          'Only agents and premium renters can set service areas',
          null
        )
      );
    }

    // Update user's service areas
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        agentServiceAreas: serviceAreas,
        isAvailableForMarking: isAvailableForMarking !== undefined 
          ? isAvailableForMarking 
          : undefined
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        agentServiceAreas: true,
        isAvailableForMarking: true,
        agentReliabilityScore: true,
        totalMarkingJobs: true,
        completedMarkingJobs: true
      }
    });

    return res.status(200).json(
      standardResponse(true, 'Service areas updated successfully', updatedUser)
    );
  } catch (error) {
    console.error('Update agent location error:', error);
    return res.status(500).json(
      standardResponse(false, 'Failed to update service areas', null)
    );
  }
};

/**
 * Get agent's current service areas
 * GET /api/agent-location
 */
export const getAgentLocation = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json(standardResponse(false, 'Unauthorized', null));
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        agentServiceAreas: true,
        isAvailableForMarking: true,
        agentReliabilityScore: true,
        totalMarkingJobs: true,
        completedMarkingJobs: true
      }
    });

    if (!user) {
      return res.status(404).json(standardResponse(false, 'User not found', null));
    }

    return res.status(200).json(
      standardResponse(true, 'Agent location details retrieved successfully', user)
    );
  } catch (error) {
    console.error('Get agent location error:', error);
    return res.status(500).json(
      standardResponse(false, 'Failed to retrieve agent location', null)
    );
  }
};

/**
 * Find agents available in a specific area
 * POST /api/agent-location/find-agents
 */
export const findAgentsInArea = async (req: Request, res: Response) => {
  try {
    const { city, state, limit = 20 } = req.body;

    if (!city && !state) {
      return res.status(400).json(
        standardResponse(false, 'Either city or state must be provided', null)
      );
    }

    // Build query for finding agents
    const agents = await prisma.user.findMany({
      where: {
        isAvailableForMarking: true,
        OR: [
          { role: 'AGENT' },
          { role: 'RENTER', isPremium: true }
        ],
        agentServiceAreas: {
          hasSome: [city, state].filter(Boolean) as string[]
        }
      },
      take: Number(limit),
      orderBy: [
        { agentReliabilityScore: 'desc' },
        { completedMarkingJobs: 'desc' }
      ],
      select: {
        id: true,
        name: true,
        role: true,
        agentServiceAreas: true,
        agentReliabilityScore: true,
        totalMarkingJobs: true,
        completedMarkingJobs: true
      }
    });

    return res.status(200).json(
      standardResponse(true, 'Agents found successfully', {
        agents,
        count: agents.length,
        searchCriteria: { city, state }
      })
    );
  } catch (error) {
    console.error('Find agents in area error:', error);
    return res.status(500).json(
      standardResponse(false, 'Failed to find agents in area', null)
    );
  }
};

/**
 * Get available service areas (cities/states with active agents)
 * GET /api/agent-location/coverage
 */
export const getServiceCoverage = async (req: Request, res: Response) => {
  try {
    // Get all unique service areas from active agents
    const agents = await prisma.user.findMany({
      where: {
        isAvailableForMarking: true,
        OR: [
          { role: 'AGENT' },
          { role: 'RENTER', isPremium: true }
        ],
        agentServiceAreas: {
          isEmpty: false
        }
      },
      select: {
        agentServiceAreas: true
      }
    });

    // Flatten and get unique service areas
    const allAreas = agents.flatMap(agent => agent.agentServiceAreas);
    const uniqueAreas = Array.from(new Set(allAreas));

    // Count agents per area
    const areaCoverage = uniqueAreas.map(area => {
      const agentCount = agents.filter(agent => 
        agent.agentServiceAreas.includes(area)
      ).length;

      return {
        area,
        agentCount
      };
    }).sort((a, b) => b.agentCount - a.agentCount);

    return res.status(200).json(
      standardResponse(true, 'Service coverage retrieved successfully', {
        coverage: areaCoverage,
        totalAreas: uniqueAreas.length,
        totalAgents: agents.length
      })
    );
  } catch (error) {
    console.error('Get service coverage error:', error);
    return res.status(500).json(
      standardResponse(false, 'Failed to retrieve service coverage', null)
    );
  }
};

/**
 * Notify agents in specific area about new marking job
 * POST /api/agent-location/notify-area
 */
export const notifyAgentsInArea = async (req: Request, res: Response) => {
  try {
    const { city, state, jobId, propertyAddress } = req.body;

    if (!jobId) {
      return res.status(400).json(
        standardResponse(false, 'Job ID is required', null)
      );
    }

    // Verify job exists
    const job = await prisma.propertyMarkingJob.findUnique({
      where: { id: jobId },
      include: {
        property: {
          select: {
            city: true,
            state: true,
            address: true
          }
        }
      }
    });

    if (!job) {
      return res.status(404).json(standardResponse(false, 'Marking job not found', null));
    }

    // Find eligible agents in the area
    const targetCity = city || job.property.city;
    const targetState = state || job.property.state;

    const eligibleAgents = await prisma.user.findMany({
      where: {
        isAvailableForMarking: true,
        OR: [
          { role: 'AGENT' },
          { role: 'RENTER', isPremium: true }
        ],
        agentServiceAreas: {
          hasSome: [targetCity, targetState]
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        agentReliabilityScore: true
      }
    });

    if (eligibleAgents.length === 0) {
      return res.status(200).json(
        standardResponse(true, 'No agents available in this area', {
          notifiedCount: 0,
          area: { city: targetCity, state: targetState }
        })
      );
    }

    // TODO: Send notifications to agents (email, SMS, push)
    // For now, we'll just return the list of agents who should be notified

    return res.status(200).json(
      standardResponse(true, 'Agents notified successfully', {
        notifiedCount: eligibleAgents.length,
        agents: eligibleAgents,
        job: {
          id: job.id,
          address: propertyAddress || job.property.address,
          city: targetCity,
          state: targetState
        }
      })
    );
  } catch (error) {
    console.error('Notify agents in area error:', error);
    return res.status(500).json(
      standardResponse(false, 'Failed to notify agents', null)
    );
  }
};

/**
 * Get agent location statistics
 * GET /api/agent-location/stats
 */
export const getLocationStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json(standardResponse(false, 'Unauthorized', null));
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    // Admin gets global stats, agents get their own stats
    if (user?.role === 'ADMIN') {
      const [
        totalAgents,
        activeAgents,
        totalServiceAreas,
        agentsByArea
      ] = await Promise.all([
        prisma.user.count({
          where: {
            OR: [
              { role: 'AGENT' },
              { role: 'RENTER', isPremium: true }
            ]
          }
        }),
        prisma.user.count({
          where: {
            isAvailableForMarking: true,
            OR: [
              { role: 'AGENT' },
              { role: 'RENTER', isPremium: true }
            ]
          }
        }),
        prisma.user.findMany({
          where: {
            isAvailableForMarking: true,
            agentServiceAreas: {
              isEmpty: false
            }
          },
          select: { agentServiceAreas: true }
        }).then(agents => {
          const allAreas = agents.flatMap(a => a.agentServiceAreas);
          return new Set(allAreas).size;
        }),
        prisma.user.findMany({
          where: {
            isAvailableForMarking: true,
            agentServiceAreas: {
              isEmpty: false
            }
          },
          select: { agentServiceAreas: true }
        })
      ]);

      // Calculate distribution
      const areaDistribution: { [key: string]: number } = {};
      agentsByArea.forEach(agent => {
        agent.agentServiceAreas.forEach(area => {
          areaDistribution[area] = (areaDistribution[area] || 0) + 1;
        });
      });

      const topAreas = Object.entries(areaDistribution)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([area, count]) => ({ area, agentCount: count }));

      const stats = {
        global: {
          totalAgents,
          activeAgents,
          inactiveAgents: totalAgents - activeAgents,
          totalServiceAreas
        },
        distribution: {
          topAreas,
          averageAreasPerAgent: activeAgents > 0 
            ? (Object.values(areaDistribution).reduce((a, b) => a + b, 0) / activeAgents).toFixed(2)
            : 0
        }
      };

      return res.status(200).json(
        standardResponse(true, 'Global location statistics retrieved successfully', stats)
      );
    } else {
      // Agent's personal stats
      const agent = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          agentServiceAreas: true,
          isAvailableForMarking: true,
          totalMarkingJobs: true,
          completedMarkingJobs: true
        }
      });

      if (!agent) {
        return res.status(404).json(standardResponse(false, 'Agent not found', null));
      }

      // Get jobs in agent's service areas
      const jobsInArea = await prisma.propertyMarkingJob.count({
        where: {
          property: {
            OR: agent.agentServiceAreas.map(area => ({
              OR: [
                { city: area },
                { state: area }
              ]
            }))
          },
          status: 'QUEUED',
          paymentStatus: 'SUCCESS'
        }
      });

      const stats = {
        serviceAreas: agent.agentServiceAreas,
        isAvailable: agent.isAvailableForMarking,
        performance: {
          totalJobs: agent.totalMarkingJobs,
          completedJobs: agent.completedMarkingJobs,
          completionRate: agent.totalMarkingJobs > 0
            ? ((agent.completedMarkingJobs / agent.totalMarkingJobs) * 100).toFixed(2)
            : 0
        },
        opportunities: {
          availableJobsInArea: jobsInArea
        }
      };

      return res.status(200).json(
        standardResponse(true, 'Agent location statistics retrieved successfully', stats)
      );
    }
  } catch (error) {
    console.error('Get location stats error:', error);
    return res.status(500).json(
      standardResponse(false, 'Failed to retrieve location statistics', null)
    );
  }
};

/**
 * Add service area to agent's coverage
 * POST /api/agent-location/add-area
 */
export const addServiceArea = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { area } = req.body;

    if (!userId) {
      return res.status(401).json(standardResponse(false, 'Unauthorized', null));
    }

    if (!area || typeof area !== 'string') {
      return res.status(400).json(
        standardResponse(false, 'Valid area name is required', null)
      );
    }

    // Verify user is eligible
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        role: true, 
        isPremium: true,
        agentServiceAreas: true 
      }
    });

    const isEligible =
      user?.role === 'AGENT' || (user?.role === 'RENTER' && user?.isPremium);

    if (!isEligible) {
      return res.status(403).json(
        standardResponse(
          false,
          'Only agents and premium renters can add service areas',
          null
        )
      );
    }

    // Check if area already exists
    if (user.agentServiceAreas.includes(area)) {
      return res.status(400).json(
        standardResponse(false, 'This area is already in your service coverage', null)
      );
    }

    // Add new area
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        agentServiceAreas: {
          push: area
        }
      },
      select: {
        id: true,
        name: true,
        agentServiceAreas: true,
        isAvailableForMarking: true
      }
    });

    return res.status(200).json(
      standardResponse(true, 'Service area added successfully', updatedUser)
    );
  } catch (error) {
    console.error('Add service area error:', error);
    return res.status(500).json(
      standardResponse(false, 'Failed to add service area', null)
    );
  }
};

/**
 * Remove service area from agent's coverage
 * DELETE /api/agent-location/remove-area
 */
export const removeServiceArea = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { area } = req.body;

    if (!userId) {
      return res.status(401).json(standardResponse(false, 'Unauthorized', null));
    }

    if (!area || typeof area !== 'string') {
      return res.status(400).json(
        standardResponse(false, 'Valid area name is required', null)
      );
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { agentServiceAreas: true }
    });

    if (!user) {
      return res.status(404).json(standardResponse(false, 'User not found', null));
    }

    // Check if area exists
    if (!user.agentServiceAreas.includes(area)) {
      return res.status(400).json(
        standardResponse(false, 'This area is not in your service coverage', null)
      );
    }

    // Remove area
    const updatedAreas = user.agentServiceAreas.filter(a => a !== area);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        agentServiceAreas: updatedAreas
      },
      select: {
        id: true,
        name: true,
        agentServiceAreas: true,
        isAvailableForMarking: true
      }
    });

    return res.status(200).json(
      standardResponse(true, 'Service area removed successfully', updatedUser)
    );
  } catch (error) {
    console.error('Remove service area error:', error);
    return res.status(500).json(
      standardResponse(false, 'Failed to remove service area', null)
    );
  }
};

/**
 * Toggle agent's availability for marking jobs
 * PATCH /api/agent-location/toggle-availability
 */
export const toggleAvailability = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json(standardResponse(false, 'Unauthorized', null));
    }

    // Get current status
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        role: true,
        isPremium: true,
        isAvailableForMarking: true,
        agentServiceAreas: true
      }
    });

    if (!user) {
      return res.status(404).json(standardResponse(false, 'User not found', null));
    }

    const isEligible =
      user?.role === 'AGENT' || (user?.role === 'RENTER' && user?.isPremium);

    if (!isEligible) {
      return res.status(403).json(
        standardResponse(
          false,
          'Only agents and premium renters can toggle marking availability',
          null
        )
      );
    }

    // Check if user has service areas set
    if (user.agentServiceAreas.length === 0) {
      return res.status(400).json(
        standardResponse(
          false,
          'Please set your service areas before enabling availability',
          null
        )
      );
    }

    // Toggle availability
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isAvailableForMarking: !user.isAvailableForMarking
      },
      select: {
        id: true,
        name: true,
        isAvailableForMarking: true,
        agentServiceAreas: true
      }
    });

    const message = updatedUser.isAvailableForMarking
      ? 'You are now available for marking jobs'
      : 'You are now unavailable for marking jobs';

    return res.status(200).json(
      standardResponse(true, message, updatedUser)
    );
  } catch (error) {
    console.error('Toggle availability error:', error);
    return res.status(500).json(
      standardResponse(false, 'Failed to toggle availability', null)
    );
  }
};

/**
 * Get nearby marking jobs for agent based on their location/service areas
 * GET /api/agent-location/nearby-jobs
 */
export const getNearbyJobs = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json(standardResponse(false, 'Unauthorized', null));
    }

    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Get user's service areas
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        agentServiceAreas: true,
        isAvailableForMarking: true,
        role: true,
        isPremium: true
      }
    });

    if (!user) {
      return res.status(404).json(standardResponse(false, 'User not found', null));
    }

    const isEligible =
      user?.role === 'AGENT' || (user?.role === 'RENTER' && user?.isPremium);

    if (!isEligible || !user.isAvailableForMarking) {
      return res.status(403).json(
        standardResponse(
          false,
          'You must be an available agent or premium renter to view nearby jobs',
          null
        )
      );
    }

    if (user.agentServiceAreas.length === 0) {
      return res.status(400).json(
        standardResponse(false, 'Please set your service areas first', null)
      );
    }

    // Find jobs in agent's service areas
    const [jobs, total] = await Promise.all([
      prisma.propertyMarkingJob.findMany({
        where: {
          status: 'QUEUED',
          assignedAgentId: null,
          paymentStatus: 'SUCCESS',
          property: {
            OR: user.agentServiceAreas.flatMap(area => [
              { city: area },
              { state: area }
            ])
          }
        },
        skip,
        take: Number(limit),
        orderBy: [
          { urgencyLevel: 'desc' },
          { createdAt: 'asc' }
        ],
        include: {
          property: {
            select: {
              id: true,
              title: true,
              address: true,
              city: true,
              state: true,
              gpsCoordinates: true,
              propertyType: true,
              images: {
                take: 3,
                orderBy: { order: 'asc' }
              }
            }
          },
          requestingUser: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }),
      prisma.propertyMarkingJob.count({
        where: {
          status: 'QUEUED',
          assignedAgentId: null,
          paymentStatus: 'SUCCESS',
          property: {
            OR: user.agentServiceAreas.flatMap(area => [
              { city: area },
              { state: area }
            ])
          }
        }
      })
    ]);

    return res.status(200).json(
      standardResponse(true, 'Nearby jobs retrieved successfully', {
        jobs,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit))
        },
        serviceAreas: user.agentServiceAreas
      })
    );
  } catch (error) {
    console.error('Get nearby jobs error:', error);
    return res.status(500).json(
      standardResponse(false, 'Failed to retrieve nearby jobs', null)
    );
  }
};