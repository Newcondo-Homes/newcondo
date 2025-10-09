// backend/marking-service/src/middleware/proximityValidation.ts

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@newcondo/db';

const prisma = new PrismaClient();

// Maximum distance in kilometers for proximity matching
const MAX_PROXIMITY_DISTANCE_KM = 50;

interface ProximityValidationRequest extends Request {
  body: {
    propertyId?: string;
    agentLocation?: {
      latitude: number;
      longitude: number;
    };
  };
  user?: {
    id: string;
    role: string;
  };
}

/**
 * Calculates distance between two GPS coordinates using Haversine formula
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in kilometers
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Converts degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Validates that an agent is within reasonable proximity to accept a marking job
 */
export const validateAgentProximity = async (
  req: ProximityValidationRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { propertyId, agentLocation } = req.body;
    const userId = req.user?.id;

    if (!propertyId) {
      res.status(400).json({
        success: false,
        error: 'Property ID is required'
      });
      return;
    }

    if (!agentLocation || !agentLocation.latitude || !agentLocation.longitude) {
      res.status(400).json({
        success: false,
        error: 'Agent location coordinates are required'
      });
      return;
    }

    // Fetch property with GPS coordinates
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        gpsCoordinates: true,
        address: true,
        city: true,
        state: true
      }
    });

    if (!property) {
      res.status(404).json({
        success: false,
        error: 'Property not found'
      });
      return;
    }

    if (!property.gpsCoordinates) {
      res.status(400).json({
        success: false,
        error: 'Property does not have GPS coordinates set'
      });
      return;
    }

    // Parse property coordinates
    let propertyCoords: { lat: number; lng: number };
    try {
      propertyCoords = JSON.parse(property.gpsCoordinates as string);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Invalid property GPS coordinates format'
      });
      return;
    }

    // Calculate distance
    const distance = calculateDistance(
      agentLocation.latitude,
      agentLocation.longitude,
      propertyCoords.lat,
      propertyCoords.lng
    );

    // Check if agent is within acceptable proximity
    if (distance > MAX_PROXIMITY_DISTANCE_KM) {
      res.status(403).json({
        success: false,
        error: 'Agent is too far from property location',
        data: {
          distance: Math.round(distance * 10) / 10,
          maxDistance: MAX_PROXIMITY_DISTANCE_KM,
          propertyLocation: {
            city: property.city,
            state: property.state
          }
        }
      });
      return;
    }

    // Attach distance to request for use in next middleware/controller
    (req as any).proximityData = {
      distance,
      propertyCoordinates: propertyCoords,
      agentCoordinates: agentLocation
    };

    next();
  } catch (error) {
    console.error('Proximity validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate proximity'
    });
  }
};

/**
 * Validates that marking job properties are within agent's service areas
 */
export const validateServiceArea = async (
  req: ProximityValidationRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { propertyId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
      return;
    }

    // Fetch agent service areas
    const agent = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        agentServiceAreas: true,
        isAvailableForMarking: true
      }
    });

    if (!agent) {
      res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
      return;
    }

    if (!agent.isAvailableForMarking) {
      res.status(403).json({
        success: false,
        error: 'Agent is not available for marking jobs'
      });
      return;
    }

    // Fetch property location
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        city: true,
        state: true
      }
    });

    if (!property) {
      res.status(404).json({
        success: false,
        error: 'Property not found'
      });
      return;
    }

    // Check if property location matches agent's service areas
    const serviceAreas = agent.agentServiceAreas || [];
    const propertyLocation = `${property.city}, ${property.state}`;
    
    const isInServiceArea = serviceAreas.some(
      (area) =>
        area.toLowerCase().includes(property.city.toLowerCase()) ||
        area.toLowerCase().includes(property.state.toLowerCase()) ||
        propertyLocation.toLowerCase().includes(area.toLowerCase())
    );

    if (!isInServiceArea && serviceAreas.length > 0) {
      res.status(403).json({
        success: false,
        error: 'Property is outside agent service areas',
        data: {
          propertyLocation,
          agentServiceAreas: serviceAreas
        }
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Service area validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate service area'
    });
  }
};

/**
 * Flexible proximity check - logs warning but doesn't block
 * Used for agent assignment notifications
 */
export const softProximityCheck = async (
  req: ProximityValidationRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { propertyId, agentLocation } = req.body;

    if (propertyId && agentLocation?.latitude && agentLocation?.longitude) {
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { gpsCoordinates: true }
      });

      if (property?.gpsCoordinates) {
        const propertyCoords = JSON.parse(property.gpsCoordinates as string);
        const distance = calculateDistance(
          agentLocation.latitude,
          agentLocation.longitude,
          propertyCoords.lat,
          propertyCoords.lng
        );

        // Attach proximity warning if too far
        (req as any).proximityWarning = distance > MAX_PROXIMITY_DISTANCE_KM
          ? {
              warning: 'Agent may be far from property',
              distance: Math.round(distance * 10) / 10
            }
          : null;
      }
    }

    next();
  } catch (error) {
    console.error('Soft proximity check error:', error);
    // Don't block the request, just log and continue
    next();
  }
};