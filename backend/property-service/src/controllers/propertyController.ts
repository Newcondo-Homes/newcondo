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


















// // backend/property-service/src/controllers/propertyController.ts

// import { Request, Response } from 'express';
// import { propertyService } from '../services/propertyService';
// import { 
//   getTranslation, 
//   getPropertyStatusTranslation,
//   formatPropertyAddress,
//   getAvailabilityMessage 
// } from '../utils/i18n';

// export class PropertyController {
//   /**
//    * Create new property listing
//    */
//   async createProperty(req: Request, res: Response) {
//     try {
//       const userId = req.user!.id;
//       const locale = req.locale || 'en';
//       const propertyData = req.body;

//       const property = await propertyService.createProperty({
//         ...propertyData,
//         ownerId: userId,
//         locale
//       });

//       return res.status(201).json({
//         success: true,
//         message: getTranslation('property.created', locale),
//         data: {
//           ...property,
//           statusText: getPropertyStatusTranslation(property.status, locale),
//           formattedAddress: formatPropertyAddress(
//             property.address,
//             property.city,
//             property.state,
//             property.country,
//             locale
//           )
//         }
//       });
//     } catch (error: any) {
//       const locale = req.locale || 'en';
//       return res.status(500).json({
//         success: false,
//         message: getTranslation('property.creation_failed', locale),
//         error: error.message
//       });
//     }
//   }

//   /**
//    * Get property by ID
//    */
//   async getProperty(req: Request, res: Response) {
//     try {
//       const { propertyId } = req.params;
//       const locale = req.locale || 'en';

//       const property = await propertyService.getPropertyById(propertyId, locale);

//       if (!property) {
//         return res.status(404).json({
//           success: false,
//           message: getTranslation('property.not_found', locale)
//         });
//       }

//       // Increment view count
//       await propertyService.incrementViewCount(propertyId);

//       return res.status(200).json({
//         success: true,
//         data: {
//           ...property,
//           statusText: getPropertyStatusTranslation(property.status, locale),
//           availabilityMessage: getAvailabilityMessage(
//             property.isAvailable,
//             property.availableFrom || undefined,
//             locale
//           )
//         }
//       });
//     } catch (error: any) {
//       const locale = req.locale || 'en';
//       return res.status(500).json({
//         success: false,
//         message: getTranslation('common.error', locale),
//         error: error.message
//       });
//     }
//   }

//   /**
//    * Update property
//    */
//   async updateProperty(req: Request, res: Response) {
//     try {
//       const userId = req.user!.id;
//       const { propertyId } = req.params;
//       const locale = req.locale || 'en';
//       const updateData = req.body;

//       const property = await propertyService.updateProperty({
//         propertyId,
//         userId,
//         updateData,
//         locale
//       });

//       return res.status(200).json({
//         success: true,
//         message: getTranslation('property.updated', locale),
//         data: property
//       });
//     } catch (error: any) {
//       const locale = req.locale || 'en';
//       return res.status(500).json({
//         success: false,
//         message: getTranslation('property.update_failed', locale),
//         error: error.message
//       });
//     }
//   }

//   /**
//    * Delete property
//    */
//   async deleteProperty(req: Request, res: Response) {
//     try {
//       const userId = req.user!.id;
//       const { propertyId } = req.params;
//       const locale = req.locale || 'en';

//       await propertyService.deleteProperty({
//         propertyId,
//         userId,
//         locale
//       });

//       return res.status(200).json({
//         success: true,
//         message: getTranslation('property.deleted', locale)
//       });
//     } catch (error: any) {
//       const locale = req.locale || 'en';
//       return res.status(500).json({
//         success: false,
//         message: getTranslation('property.deletion_failed', locale),
//         error: error.message
//       });
//     }
//   }

//   /**
//    * Search properties
//    */
//   async searchProperties(req: Request, res: Response) {
//     try {
//       const locale = req.locale || 'en';
//       const {
//         city,
//         state,
//         propertyType,
//         minPrice,
//         maxPrice,
//         bedrooms,
//         bathrooms,
//         page = 1,
//         limit = 20
//       } = req.query;

//       const result = await propertyService.searchProperties({
//         city: city as string,
//         state: state as string,
//         propertyType: propertyType as string,
//         minPrice: minPrice ? Number(minPrice) : undefined,
//         maxPrice: maxPrice ? Number(maxPrice) : undefined,
//         bedrooms: bedrooms ? Number(bedrooms) : undefined,
//         bathrooms: bathrooms ? Number(bathrooms) : undefined,
//         page: Number(page),
//         limit: Number(limit),
//         locale
//       });

//       // Add localized fields to each property
//       const localizedProperties = result.properties.map(property => ({
//         ...property,
//         statusText: getPropertyStatusTranslation(property.status, locale),
//         availabilityMessage: getAvailabilityMessage(
//           property.isAvailable,
//           property.availableFrom || undefined,
//           locale
//         )
//       }));

//       return res.status(200).json({
//         success: true,
//         message: getTranslation('property.search_results', locale),
//         data: {
//           properties: localizedProperties,
//           pagination: result.pagination
//         }
//       });
//     } catch (error: any) {
//       const locale = req.locale || 'en';
//       return res.status(500).json({
//         success: false,
//         message: getTranslation('property.search_failed', locale),
//         error: error.message
//       });
//     }
//   }

//   /**
//    * Get user's properties
//    */
//   async getMyProperties(req: Request, res: Response) {
//     try {
//       const userId = req.user!.id;
//       const locale = req.locale || 'en';
//       const { status, page = 1, limit = 10 } = req.query;

//       const result = await propertyService.getUserProperties({
//         userId,
//         status: status as string,
//         page: Number(page),
//         limit: Number(limit)
//       });

//       return res.status(200).json({
//         success: true,
//         message: getTranslation('property.list_retrieved', locale),
//         data: result
//       });
//     } catch (error: any) {
//       const locale = req.locale || 'en';
//       return res.status(500).json({
//         success: false,
//         message: getTranslation('common.error', locale),
//         error: error.message
//       });
//     }
//   }

//   /**
//    * Publish property (change from draft to pending)
//    */
//   async publishProperty(req: Request, res: Response) {
//     try {
//       const userId = req.user!.id;
//       const { propertyId } = req.params;
//       const locale = req.locale || 'en';

//       const property = await propertyService.publishProperty({
//         propertyId,
//         userId,
//         locale
//       });

//       return res.status(200).json({
//         success: true,
//         message: getTranslation('property.published', locale),
//         data: property
//       });
//     } catch (error: any) {
//       const locale = req.locale || 'en';
//       return res.status(500).json({
//         success: false,
//         message: getTranslation('property.publish_failed', locale),
//         error: error.message
//       });
//     }
//   }

//   /**
//    * Mark property boundary
//    */
//   async markPropertyBoundary(req: Request, res: Response) {
//     try {
//       const userId = req.user!.id;
//       const { propertyId } = req.params;
//       const locale = req.locale || 'en';
//       const { boundaryCoordinates, boundaryImages } = req.body;

//       const property = await propertyService.markPropertyBoundary({
//         propertyId,
//         userId,
//         boundaryCoordinates,
//         boundaryImages,
//         locale
//       });

//       return res.status(200).json({
//         success: true,
//         message: getTranslation('property.boundary_marked', locale),
//         data: property
//       });
//     } catch (error: any) {
//       const locale = req.locale || 'en';
//       return res.status(500).json({
//         success: false,
//         message: getTranslation('property.boundary_marking_failed', locale),
//         error: error.message
//       });
//     }
//   }

//   /**
//    * Check for duplicate properties
//    */
//   async checkDuplicate(req: Request, res: Response) {
//     try {
//       const locale = req.locale || 'en';
//       const { boundaryCoordinates } = req.body;

//       const duplicate = await propertyService.checkDuplicateProperty(
//         boundaryCoordinates,
//         locale
//       );

//       if (duplicate) {
//         return res.status(200).json({
//           success: true,
//           isDuplicate: true,
//           message: getTranslation('property.duplicate_found', locale),
//           data: duplicate
//         });
//       }

//       return res.status(200).json({
//         success: true,
//         isDuplicate: false,
//         message: getTranslation('property.no_duplicate', locale)
//       });
//     } catch (error: any) {
//       const locale = req.locale || 'en';
//       return res.status(500).json({
//         success: false,
//         message: getTranslation('common.error', locale),
//         error: error.message
//       });
//     }
//   }

//   /**
//    * Get property statistics
//    */
//   async getPropertyStats(req: Request, res: Response) {
//     try {
//       const userId = req.user!.id;
//       const locale = req.locale || 'en';

//       const stats = await propertyService.getPropertyStats(userId);

//       return res.status(200).json({
//         success: true,
//         message: getTranslation('property.stats_retrieved', locale),
//         data: stats
//       });
//     } catch (error: any) {
//       const locale = req.locale || 'en';
//       return res.status(500).json({
//         success: false,
//         message: getTranslation('common.error', locale),
//         error: error.message
//       });
//     }
//   }

//   /**
//    * Create property unit (for multi-family properties)
//    */
//   async createPropertyUnit(req: Request, res: Response) {
//     try {
//       const userId = req.user!.id;
//       const { propertyId } = req.params;
//       const locale = req.locale || 'en';
//       const unitData = req.body;

//       const unit = await propertyService.createPropertyUnit({
//         propertyId,
//         userId,
//         unitData,
//         locale
//       });

//       return res.status(201).json({
//         success: true,
//         message: getTranslation('property.unit_created', locale),
//         data: unit
//       });
//     } catch (error: any) {
//       const locale = req.locale || 'en';
//       return res.status(500).json({
//         success: false,
//         message: getTranslation('property.unit_creation_failed', locale),
//         error: error.message
//       });
//     }
//   }

//   /**
//    * Get property units
//    */
//   async getPropertyUnits(req: Request, res: Response) {
//     try {
//       const { propertyId } = req.params;
//       const locale = req.locale || 'en';

//       const units = await propertyService.getPropertyUnits(propertyId);

//       return res.status(200).json({
//         success: true,
//         message: getTranslation('property.units_retrieved', locale),
//         data: units
//       });
//     } catch (error: any) {
//       const locale = req.locale || 'en';
//       return res.status(500).json({
//         success: false,
//         message: getTranslation('common.error', locale),
//         error: error.message
//       });
//     }
//   }

//   /**
//    * Generate shareable property link
//    */
//   async generateShareableLink(req: Request, res: Response) {
//     try {
//       const userId = req.user!.id;
//       const { propertyId } = req.params;
//       const locale = req.locale || 'en';

//       const link = await propertyService.generateShareableLink({
//         propertyId,
//         userId,
//         locale
//       });

//       return res.status(200).json({
//         success: true,
//         message: getTranslation('property.link_generated', locale),
//         data: { link }
//       });
//     } catch (error: any) {
//       const locale = req.locale || 'en';
//       return res.status(500).json({
//         success: false,
//         message: getTranslation('property.link_generation_failed', locale),
//         error: error.message
//       });
//     }
//   }
// }

// export const propertyController = new PropertyController();