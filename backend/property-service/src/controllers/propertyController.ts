// File: backend/property-service/src/controllers/propertyController.ts

import { Request, Response } from 'express';
import { propertyService } from '../services/propertyService';
import { boundaryService } from '../services/boundaryService';
import { duplicateService } from '../services/duplicateService';
import { standardResponse } from '../../../shared/src/utils/response';
import { PropertyStatus, PropertyType, PropertyStructure } from '@newcondo/db';

export class PropertyController {
  // Create property listing
  async createProperty(req: Request, res: Response) {
    try {
      const { userId } = req.user;
      const propertyData = req.body;

      // Validate required fields
      if (!propertyData.title || !propertyData.address || !propertyData.city || !propertyData.state) {
        return res.status(400).json(
          standardResponse(false, 'Missing required fields', null, 'MISSING_REQUIRED_FIELDS')
        );
      }

      // Check for duplicate properties if boundary coordinates are provided
      if (propertyData.boundaryCoordinates) {
        const duplicateCheck = await duplicateService.checkForDuplicates({
          boundaryCoordinates: propertyData.boundaryCoordinates,
          gpsCoordinates: propertyData.gpsCoordinates,
          address: propertyData.address,
          excludePropertyId: null
        });

        if (duplicateCheck.isDuplicate) {
          return res.status(409).json(
            standardResponse(false, 'Property already exists in this location', {
              duplicateProperty: duplicateCheck.duplicateProperty,
              conflicts: duplicateCheck.conflicts
            }, 'DUPLICATE_PROPERTY')
          );
        }
      }

      const property = await propertyService.createProperty({
        ...propertyData,
        ownerId: userId
      });

      res.status(201).json(
        standardResponse(true, 'Property created successfully', property)
      );
    } catch (error) {
      console.error('Error creating property:', error);
      res.status(500).json(
        standardResponse(false, 'Failed to create property', null, 'CREATE_FAILED')
      );
    }
  }

  // Get all properties with filters
  async getProperties(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 10,
        city,
        state,
        propertyType,
        minPrice,
        maxPrice,
        bedrooms,
        bathrooms,
        status,
        isAvailable,
        structure,
        searchTerm
      } = req.query;

      const filters = {
        city: city as string,
        state: state as string,
        propertyType: propertyType as PropertyType,
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        bedrooms: bedrooms ? parseInt(bedrooms as string) : undefined,
        bathrooms: bathrooms ? parseInt(bathrooms as string) : undefined,
        status: status as PropertyStatus,
        isAvailable: isAvailable === 'true',
        structure: structure as PropertyStructure,
        searchTerm: searchTerm as string
      };

      const properties = await propertyService.getProperties({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        filters
      });

      res.status(200).json(
        standardResponse(true, 'Properties retrieved successfully', properties)
      );
    } catch (error) {
      console.error('Error retrieving properties:', error);
      res.status(500).json(
        standardResponse(false, 'Failed to retrieve properties', null, 'RETRIEVAL_FAILED')
      );
    }
  }

  // Get property by ID
  async getPropertyById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { userId } = req.user;

      const property = await propertyService.getPropertyById(id, userId);

      if (!property) {
        return res.status(404).json(
          standardResponse(false, 'Property not found', null, 'PROPERTY_NOT_FOUND')
        );
      }

      res.status(200).json(
        standardResponse(true, 'Property retrieved successfully', property)
      );
    } catch (error) {
      console.error('Error retrieving property:', error);
      res.status(500).json(
        standardResponse(false, 'Failed to retrieve property', null, 'RETRIEVAL_FAILED')
      );
    }
  }

  // Update property
  async updateProperty(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { userId } = req.user;
      const updateData = req.body;

      // Check for duplicate properties if boundary coordinates are being updated
      if (updateData.boundaryCoordinates) {
        const duplicateCheck = await duplicateService.checkForDuplicates({
          boundaryCoordinates: updateData.boundaryCoordinates,
          gpsCoordinates: updateData.gpsCoordinates,
          address: updateData.address,
          excludePropertyId: id
        });

        if (duplicateCheck.isDuplicate) {
          return res.status(409).json(
            standardResponse(false, 'Property already exists in this location', {
              duplicateProperty: duplicateCheck.duplicateProperty,
              conflicts: duplicateCheck.conflicts
            }, 'DUPLICATE_PROPERTY')
          );
        }
      }

      const property = await propertyService.updateProperty(id, userId, updateData);

      if (!property) {
        return res.status(404).json(
          standardResponse(false, 'Property not found or access denied', null, 'PROPERTY_NOT_FOUND')
        );
      }

      res.status(200).json(
        standardResponse(true, 'Property updated successfully', property)
      );
    } catch (error) {
      console.error('Error updating property:', error);
      res.status(500).json(
        standardResponse(false, 'Failed to update property', null, 'UPDATE_FAILED')
      );
    }
  }

  // Delete property
  async deleteProperty(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { userId } = req.user;

      const result = await propertyService.deleteProperty(id, userId);

      if (!result) {
        return res.status(404).json(
          standardResponse(false, 'Property not found or access denied', null, 'PROPERTY_NOT_FOUND')
        );
      }

      res.status(200).json(
        standardResponse(true, 'Property deleted successfully', null)
      );
    } catch (error) {
      console.error('Error deleting property:', error);
      res.status(500).json(
        standardResponse(false, 'Failed to delete property', null, 'DELETE_FAILED')
      );
    }
  }

  // Get user's properties
  async getUserProperties(req: Request, res: Response) {
    try {
      const { userId } = req.user;
      const { page = 1, limit = 10, status } = req.query;

      const properties = await propertyService.getUserProperties({
        userId,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        status: status as PropertyStatus
      });

      res.status(200).json(
        standardResponse(true, 'User properties retrieved successfully', properties)
      );
    } catch (error) {
      console.error('Error retrieving user properties:', error);
      res.status(500).json(
        standardResponse(false, 'Failed to retrieve user properties', null, 'RETRIEVAL_FAILED')
      );
    }
  }

  // Mark property boundary
  async markPropertyBoundary(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { userId } = req.user;
      const { boundaryCoordinates, gpsCoordinates } = req.body;

      if (!boundaryCoordinates || !gpsCoordinates) {
        return res.status(400).json(
          standardResponse(false, 'Boundary coordinates and GPS coordinates are required', null, 'MISSING_COORDINATES')
        );
      }

      // Check for duplicates
      const duplicateCheck = await duplicateService.checkForDuplicates({
        boundaryCoordinates,
        gpsCoordinates,
        address: req.body.address,
        excludePropertyId: id
      });

      if (duplicateCheck.isDuplicate) {
        return res.status(409).json(
          standardResponse(false, 'Property already exists in this location', {
            duplicateProperty: duplicateCheck.duplicateProperty,
            conflicts: duplicateCheck.conflicts
          }, 'DUPLICATE_PROPERTY')
        );
      }

      const result = await boundaryService.markPropertyBoundary({
        propertyId: id,
        userId,
        boundaryCoordinates,
        gpsCoordinates
      });

      res.status(200).json(
        standardResponse(true, 'Property boundary marked successfully', result)
      );
    } catch (error) {
      console.error('Error marking property boundary:', error);
      res.status(500).json(
        standardResponse(false, 'Failed to mark property boundary', null, 'BOUNDARY_MARKING_FAILED')
      );
    }
  }

  // Get nearby properties for duplicate checking
  async getNearbyProperties(req: Request, res: Response) {
    try {
      const { lat, lng, radius = 100 } = req.query;

      if (!lat || !lng) {
        return res.status(400).json(
          standardResponse(false, 'Latitude and longitude are required', null, 'MISSING_COORDINATES')
        );
      }

      const nearbyProperties = await propertyService.getNearbyProperties({
        latitude: parseFloat(lat as string),
        longitude: parseFloat(lng as string),
        radius: parseInt(radius as string)
      });

      res.status(200).json(
        standardResponse(true, 'Nearby properties retrieved successfully', nearbyProperties)
      );
    } catch (error) {
      console.error('Error retrieving nearby properties:', error);
      res.status(500).json(
        standardResponse(false, 'Failed to retrieve nearby properties', null, 'RETRIEVAL_FAILED')
      );
    }
  }

  // Publish property
  async publishProperty(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { userId } = req.user;

      const property = await propertyService.publishProperty(id, userId);

      if (!property) {
        return res.status(404).json(
          standardResponse(false, 'Property not found or access denied', null, 'PROPERTY_NOT_FOUND')
        );
      }

      res.status(200).json(
        standardResponse(true, 'Property published successfully', property)
      );
    } catch (error) {
      console.error('Error publishing property:', error);
      res.status(500).json(
        standardResponse(false, 'Failed to publish property', null, 'PUBLISH_FAILED')
      );
    }
  }

  // Update property status
  async updatePropertyStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { userId } = req.user;
      const { status } = req.body;

      if (!status || !Object.values(PropertyStatus).includes(status)) {
        return res.status(400).json(
          standardResponse(false, 'Valid status is required', null, 'INVALID_STATUS')
        );
      }

      const property = await propertyService.updatePropertyStatus(id, userId, status);

      if (!property) {
        return res.status(404).json(
          standardResponse(false, 'Property not found or access denied', null, 'PROPERTY_NOT_FOUND')
        );
      }

      res.status(200).json(
        standardResponse(true, 'Property status updated successfully', property)
      );
    } catch (error) {
      console.error('Error updating property status:', error);
      res.status(500).json(
        standardResponse(false, 'Failed to update property status', null, 'UPDATE_FAILED')
      );
    }
  }

  // Get property boundary conflicts
  async getPropertyConflicts(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const conflicts = await duplicateService.getPropertyConflicts(id);

      res.status(200).json(
        standardResponse(true, 'Property conflicts retrieved successfully', conflicts)
      );
    } catch (error) {
      console.error('Error retrieving property conflicts:', error);
      res.status(500).json(
        standardResponse(false, 'Failed to retrieve property conflicts', null, 'RETRIEVAL_FAILED')
      );
    }
  }
}

export const propertyController = new PropertyController();