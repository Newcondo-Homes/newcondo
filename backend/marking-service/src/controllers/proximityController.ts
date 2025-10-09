// backend/marking-service/src/controllers/proximityController.ts

import { Request, Response, NextFunction } from 'express';
import { ProximityService } from '../services/proximityService';
import { successResponse, errorResponse } from '../../../shared/src/utils/response';

export class ProximityController {
  private proximityService: ProximityService;

  constructor() {
    this.proximityService = new ProximityService();
  }

  /**
   * Find available agents within proximity to a property location
   */
  findNearbyAgents = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { latitude, longitude, radiusKm, state, lga, city } = req.query;

      // Validate required parameters
      if (!latitude || !longitude) {
        res.status(400).json(
          errorResponse('Latitude and longitude are required')
        );
        return;
      }

      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);
      const radius = radiusKm ? parseFloat(radiusKm as string) : 10; // Default 10km

      if (isNaN(lat) || isNaN(lng)) {
        res.status(400).json(
          errorResponse('Invalid coordinates provided')
        );
        return;
      }

      const nearbyAgents = await this.proximityService.findNearbyAgents({
        latitude: lat,
        longitude: lng,
        radiusKm: radius,
        state: state as string,
        lga: lga as string,
        city: city as string,
      });

      res.json(
        successResponse(nearbyAgents, 'Nearby agents retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Calculate distance between two points
   */
  calculateDistance = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { lat1, lng1, lat2, lng2 } = req.query;

      if (!lat1 || !lng1 || !lat2 || !lng2) {
        res.status(400).json(
          errorResponse('All coordinates (lat1, lng1, lat2, lng2) are required')
        );
        return;
      }

      const distance = this.proximityService.calculateDistance(
        parseFloat(lat1 as string),
        parseFloat(lng1 as string),
        parseFloat(lat2 as string),
        parseFloat(lng2 as string)
      );

      res.json(
        successResponse(
          { distanceKm: distance },
          'Distance calculated successfully'
        )
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get agents by service area (hierarchical address)
   */
  getAgentsByServiceArea = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { state, lga, city } = req.query;

      if (!state) {
        res.status(400).json(
          errorResponse('State is required')
        );
        return;
      }

      const agents = await this.proximityService.getAgentsByServiceArea({
        state: state as string,
        lga: lga as string,
        city: city as string,
      });

      res.json(
        successResponse(agents, 'Agents retrieved by service area')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update agent availability for marking jobs
   */
  updateAgentAvailability = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { userId } = req.user!; // From auth middleware
      const { isAvailable, serviceAreas } = req.body;

      const updatedAgent = await this.proximityService.updateAgentAvailability(
        userId,
        isAvailable,
        serviceAreas
      );

      res.json(
        successResponse(updatedAgent, 'Agent availability updated successfully')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Broadcast marking job to nearby agents
   */
  broadcastMarkingJob = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { markingJobId } = req.params;

      const broadcastResult = await this.proximityService.broadcastMarkingJobToAgents(
        markingJobId
      );

      res.json(
        successResponse(
          broadcastResult,
          'Marking job broadcast to nearby agents'
        )
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get agent's current workload and availability status
   */
  getAgentWorkload = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { agentId } = req.params;

      const workload = await this.proximityService.getAgentWorkload(agentId);

      res.json(
        successResponse(workload, 'Agent workload retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get optimal agent for a marking job based on proximity and workload
   */
  getOptimalAgent = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { propertyId } = req.params;

      const optimalAgent = await this.proximityService.getOptimalAgentForProperty(
        propertyId
      );

      if (!optimalAgent) {
        res.status(404).json(
          errorResponse('No available agents found for this location')
        );
        return;
      }

      res.json(
        successResponse(optimalAgent, 'Optimal agent found')
      );
    } catch (error) {
      next(error);
    }
  };
}