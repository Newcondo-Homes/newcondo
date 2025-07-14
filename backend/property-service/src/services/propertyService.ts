// backend/property-service/src/services/propertyService.ts

import { PrismaClient, Property, PropertyStatus, AdminApprovalStatus, PropertyType, PropertyStructure, User } from '@newcondo/db';
import { BoundaryService } from './boundaryService';
import { DuplicateService } from './duplicateService';
import { MapsService } from './mapsService';
import { LegalService } from './legalService';
import { PropertyCreateData, PropertyUpdateData, PropertySearchFilters, PropertyWithBoundary } from '../types/property';
import { BoundaryData } from '../types/boundary';

export class PropertyService {
  private prisma: PrismaClient;
  private boundaryService: BoundaryService;
  private duplicateService: DuplicateService;
  private mapsService: MapsService;
  private legalService: LegalService;

  constructor() {
    this.prisma = new PrismaClient();
    this.boundaryService = new BoundaryService();
    this.duplicateService = new DuplicateService();
    this.mapsService = new MapsService();
    this.legalService = new LegalService();
  }

  // Create property with boundary validation and duplicate checking
  async createProperty(userId: string, data: PropertyCreateData): Promise<PropertyWithBoundary> {
    try {
      // Validate user permissions
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, verificationStatus: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (user.verificationStatus !== 'VERIFIED') {
        throw new Error('User must be verified to create property listings');
      }

      // Validate boundary data if provided
      let boundaryValidation = null;
      if (data.boundaryCoordinates) {
        boundaryValidation = await this.boundaryService.validateBoundary({
          coordinates: data.boundaryCoordinates,
          location: {
            lat: data.gpsCoordinates?.lat || 0,
            lng: data.gpsCoordinates?.lng || 0
          },
          address: data.address,
          city: data.city,
          state: data.state
        });

        if (!boundaryValidation.isValid) {
          throw new Error(`Invalid boundary: ${boundaryValidation.errors.join(', ')}`);
        }
      }

      // Check for duplicates if boundary is provided
      let duplicateCheck = null;
      if (data.boundaryCoordinates && data.gpsCoordinates) {
        duplicateCheck = await this.duplicateService.checkForDuplicates({
          coordinates: data.boundaryCoordinates,
          location: data.gpsCoordinates,
          address: data.address,
          propertyType: data.propertyType,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms
        });

        if (duplicateCheck.hasDuplicates) {
          throw new Error('Property already exists at this location');
        }
      }

      // Generate building fingerprint for duplicate detection
      const buildingFingerprint = data.boundaryCoordinates && data.gpsCoordinates
        ? await this.duplicateService.generateBuildingFingerprint({
            coordinates: data.boundaryCoordinates,
            location: data.gpsCoordinates,
            address: data.address,
            propertyType: data.propertyType,
            bedrooms: data.bedrooms,
            bathrooms: data.bathrooms
          })
        : null;

      // Create property with boundary data
      const property = await this.prisma.property.create({
        data: {
          title: data.title,
          description: data.description,
          price: data.price,
          currency: data.currency || 'NGN',
          address: data.address,
          city: data.city,
          state: data.state,
          country: data.country || 'Nigeria',
          gpsCoordinates: data.gpsCoordinates ? JSON.stringify(data.gpsCoordinates) : null,
          boundaryCoordinates: data.boundaryCoordinates || null,
          boundaryVerified: boundaryValidation?.isValid || false,
          buildingFingerprint,
          structure: data.structure || 'SINGLE_UNIT',
          propertyType: data.propertyType,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          area: data.area,
          features: data.features || [],
          buildingFeatures: data.buildingFeatures || [],
          totalUnits: data.totalUnits,
          availableUnits: data.availableUnits,
          ownerId: userId,
          agentId: data.agentId,
          isOwnerListing: data.isOwnerListing ?? true,
          status: 'DRAFT',
          adminApprovalStatus: 'PENDING',
          isAvailable: data.isAvailable ?? true,
          availableFrom: data.availableFrom,
          shareableLink: this.generateShareableLink()
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          agent: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          images: true,
          units: {
            include: {
              images: true
            }
          }
        }
      });

      // Create property units if multi-family
      if (data.structure === 'MULTI_FAMILY' && data.units && data.units.length > 0) {
        await this.createPropertyUnits(property.id, data.units);
      }

      return this.formatPropertyWithBoundary(property);
    } catch (error) {
      console.error('Error creating property:', error);
      throw error;
    }
  }

  // Update property with boundary revalidation
  async updateProperty(propertyId: string, userId: string, data: PropertyUpdateData): Promise<PropertyWithBoundary> {
    try {
      // Check if user owns the property or is an admin
      const property = await this.prisma.property.findUnique({
        where: { id: propertyId },
        include: { owner: true, agent: true }
      });

      if (!property) {
        throw new Error('Property not found');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Check permissions
      const canEdit = property.ownerId === userId || 
                     property.agentId === userId || 
                     user.role === 'ADMIN';

      if (!canEdit) {
        throw new Error('Permission denied');
      }

      // Validate boundary if being updated
      let boundaryValidation = null;
      if (data.boundaryCoordinates) {
        boundaryValidation = await this.boundaryService.validateBoundary({
          coordinates: data.boundaryCoordinates,
          location: {
            lat: data.gpsCoordinates?.lat || 0,
            lng: data.gpsCoordinates?.lng || 0
          },
          address: data.address || property.address,
          city: data.city || property.city,
          state: data.state || property.state
        });

        if (!boundaryValidation.isValid) {
          throw new Error(`Invalid boundary: ${boundaryValidation.errors.join(', ')}`);
        }
      }

      // Check for duplicates if boundary is being updated
      if (data.boundaryCoordinates && data.gpsCoordinates) {
        const duplicateCheck = await this.duplicateService.checkForDuplicates({
          coordinates: data.boundaryCoordinates,
          location: data.gpsCoordinates,
          address: data.address || property.address,
          propertyType: data.propertyType || property.propertyType,
          bedrooms: data.bedrooms || property.bedrooms,
          bathrooms: data.bathrooms || property.bathrooms
        }, propertyId);

        if (duplicateCheck.hasDuplicates) {
          throw new Error('Property already exists at this location');
        }
      }

      // Update building fingerprint if boundary changed
      let buildingFingerprint = property.buildingFingerprint;
      if (data.boundaryCoordinates && data.gpsCoordinates) {
        buildingFingerprint = await this.duplicateService.generateBuildingFingerprint({
          coordinates: data.boundaryCoordinates,
          location: data.gpsCoordinates,
          address: data.address || property.address,
          propertyType: data.propertyType || property.propertyType,
          bedrooms: data.bedrooms || property.bedrooms,
          bathrooms: data.bathrooms || property.bathrooms
        });
      }

      // Update property
      const updatedProperty = await this.prisma.property.update({
        where: { id: propertyId },
        data: {
          ...(data.title && { title: data.title }),
          ...(data.description && { description: data.description }),
          ...(data.price && { price: data.price }),
          ...(data.currency && { currency: data.currency }),
          ...(data.address && { address: data.address }),
          ...(data.city && { city: data.city }),
          ...(data.state && { state: data.state }),
          ...(data.country && { country: data.country }),
          ...(data.gpsCoordinates && { gpsCoordinates: JSON.stringify(data.gpsCoordinates) }),
          ...(data.boundaryCoordinates && { boundaryCoordinates: data.boundaryCoordinates }),
          ...(boundaryValidation && { boundaryVerified: boundaryValidation.isValid }),
          ...(buildingFingerprint && { buildingFingerprint }),
          ...(data.structure && { structure: data.structure }),
          ...(data.propertyType && { propertyType: data.propertyType }),
          ...(data.bedrooms !== undefined && { bedrooms: data.bedrooms }),
          ...(data.bathrooms !== undefined && { bathrooms: data.bathrooms }),
          ...(data.area && { area: data.area }),
          ...(data.features && { features: data.features }),
          ...(data.buildingFeatures && { buildingFeatures: data.buildingFeatures }),
          ...(data.totalUnits !== undefined && { totalUnits: data.totalUnits }),
          ...(data.availableUnits !== undefined && { availableUnits: data.availableUnits }),
          ...(data.isAvailable !== undefined && { isAvailable: data.isAvailable }),
          ...(data.availableFrom && { availableFrom: data.availableFrom }),
          // Reset approval status if significant changes
          ...(data.boundaryCoordinates && { adminApprovalStatus: 'PENDING' as AdminApprovalStatus }),
          updatedAt: new Date()
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          agent: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          images: true,
          units: {
            include: {
              images: true
            }
          }
        }
      });

      return this.formatPropertyWithBoundary(updatedProperty);
    } catch (error) {
      console.error('Error updating property:', error);
      throw error;
    }
  }

  // Get property with boundary data
  async getPropertyWithBoundary(propertyId: string, userId?: string): Promise<PropertyWithBoundary | null> {
    try {
      const property = await this.prisma.property.findUnique({
        where: { id: propertyId },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          agent: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          images: true,
          units: {
            include: {
              images: true
            }
          }
        }
      });

      if (!property) {
        return null;
      }

      // Increment view count if not owner/agent
      if (userId && userId !== property.ownerId && userId !== property.agentId) {
        await this.prisma.property.update({
          where: { id: propertyId },
          data: { viewCount: { increment: 1 } }
        });
      }

      return this.formatPropertyWithBoundary(property);
    } catch (error) {
      console.error('Error getting property:', error);
      throw error;
    }
  }

  // Search properties with boundary filtering
  async searchPropertiesWithBoundaries(filters: PropertySearchFilters, userId?: string): Promise<{
    properties: PropertyWithBoundary[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const {
        query,
        city,
        state,
        propertyType,
        minPrice,
        maxPrice,
        bedrooms,
        bathrooms,
        features,
        boundingBox,
        onlyVerifiedBoundaries,
        page = 1,
        limit = 20
      } = filters;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        status: 'PUBLISHED',
        adminApprovalStatus: 'APPROVED',
        isAvailable: true,
        ...(query && {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { address: { contains: query, mode: 'insensitive' } }
          ]
        }),
        ...(city && { city: { contains: city, mode: 'insensitive' } }),
        ...(state && { state: { contains: state, mode: 'insensitive' } }),
        ...(propertyType && { propertyType }),
        ...(minPrice && { price: { gte: minPrice } }),
        ...(maxPrice && { price: { lte: maxPrice } }),
        ...(bedrooms && { bedrooms }),
        ...(bathrooms && { bathrooms }),
        ...(features && features.length > 0 && {
          OR: [
            { features: { hasSome: features } },
            { buildingFeatures: { hasSome: features } }
          ]
        }),
        ...(onlyVerifiedBoundaries && { boundaryVerified: true }),
        ...(boundingBox && {
          // Filter by bounding box if provided
          gpsCoordinates: {
            not: null
          }
        })
      };

      // Get total count
      const total = await this.prisma.property.count({ where });

      // Get properties
      const properties = await this.prisma.property.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          agent: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          images: true,
          units: {
            include: {
              images: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: [
          { boundaryVerified: 'desc' }, // Prioritize verified boundaries
          { createdAt: 'desc' }
        ]
      });

      // Filter by bounding box if provided (post-query filtering for GPS coordinates)
      let filteredProperties = properties;
      if (boundingBox) {
        filteredProperties = properties.filter(property => {
          if (!property.gpsCoordinates) return false;
          
          try {
            const coords = JSON.parse(property.gpsCoordinates);
            return coords.lat >= boundingBox.south &&
                   coords.lat <= boundingBox.north &&
                   coords.lng >= boundingBox.west &&
                   coords.lng <= boundingBox.east;
          } catch {
            return false;
          }
        });
      }

      return {
        properties: filteredProperties.map(p => this.formatPropertyWithBoundary(p)),
        total,
        hasMore: skip + limit < total
      };
    } catch (error) {
      console.error('Error searching properties:', error);
      throw error;
    }
  }

  // Get nearby properties with boundaries
  async getNearbyProperties(
    lat: number,
    lng: number,
    radiusKm: number = 5,
    limit: number = 10
  ): Promise<PropertyWithBoundary[]> {
    try {
      // Use raw query for geospatial search
      const properties = await this.prisma.$queryRaw<any[]>`
        SELECT 
          p.*,
          (
            6371 * acos(
              cos(radians(${lat})) * 
              cos(radians(CAST(p.gps_coordinates->>'lat' AS FLOAT))) * 
              cos(radians(CAST(p.gps_coordinates->>'lng' AS FLOAT)) - radians(${lng})) + 
              sin(radians(${lat})) * 
              sin(radians(CAST(p.gps_coordinates->>'lat' AS FLOAT)))
            )
          ) AS distance
        FROM "Property" p
        WHERE 
          p.status = 'PUBLISHED' AND
          p.admin_approval_status = 'APPROVED' AND
          p.is_available = true AND
          p.gps_coordinates IS NOT NULL AND
          (
            6371 * acos(
              cos(radians(${lat})) * 
              cos(radians(CAST(p.gps_coordinates->>'lat' AS FLOAT))) * 
              cos(radians(CAST(p.gps_coordinates->>'lng' AS FLOAT)) - radians(${lng})) + 
              sin(radians(${lat})) * 
              sin(radians(CAST(p.gps_coordinates->>'lat' AS FLOAT)))
            )
          ) <= ${radiusKm}
        ORDER BY distance
        LIMIT ${limit}
      `;

      // Fetch complete property data
      const propertyIds = properties.map(p => p.id);
      const completeProperties = await this.prisma.property.findMany({
        where: { id: { in: propertyIds } },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          agent: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          images: true,
          units: {
            include: {
              images: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Sort by distance
      const sortedProperties = completeProperties.sort((a, b) => {
        const distanceA = properties.find(p => p.id === a.id)?.distance || 0;
        const distanceB = properties.find(p => p.id === b.id)?.distance || 0;
        return distanceA - distanceB;
      });

      return sortedProperties.map(p => this.formatPropertyWithBoundary(p));
    } catch (error) {
      console.error('Error getting nearby properties:', error);
      throw error;
    }
  }

  // Get properties with overlapping boundaries
  async getPropertiesWithOverlappingBoundaries(
    coordinates: any,
    excludePropertyId?: string
  ): Promise<PropertyWithBoundary[]> {
    try {
      const overlappingProperties = await this.duplicateService.findOverlappingBoundaries(
        coordinates,
        excludePropertyId
      );

      if (overlappingProperties.length === 0) {
        return [];
      }

      const properties = await this.prisma.property.findMany({
        where: {
          id: { in: overlappingProperties.map(p => p.id) }
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          agent: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          images: true,
          units: {
            include: {
              images: true
            }
          }
        }
      });

      return properties.map(p => this.formatPropertyWithBoundary(p));
    } catch (error) {
      console.error('Error getting overlapping properties:', error);
      throw error;
    }
  }

  // Suggest boundary based on address
  async suggestBoundaryFromAddress(address: string, city: string, state: string): Promise<{
    suggestedBoundary: BoundaryData | null;
    confidence: number;
    alternatives: BoundaryData[];
  }> {
    try {
      // Use maps service to get boundary suggestions
      const suggestions = await this.mapsService.suggestBoundaryFromAddress(address, city, state);
      
      return suggestions;
    } catch (error) {
      console.error('Error suggesting boundary:', error);
      throw error;
    }
  }

  // Publish property (validate and change status)
  async publishProperty(propertyId: string, userId: string): Promise<PropertyWithBoundary> {
    try {
      const property = await this.prisma.property.findUnique({
        where: { id: propertyId },
        include: {
          owner: true,
          images: true,
          units: true
        }
      });

      if (!property) {
        throw new Error('Property not found');
      }

      // Check permissions
      if (property.ownerId !== userId && property.agentId !== userId) {
        throw new Error('Permission denied');
      }

      // Validate property is ready for publishing
      const validationErrors = this.validatePropertyForPublishing(property);
      if (validationErrors.length > 0) {
        throw new Error(`Property validation failed: ${validationErrors.join(', ')}`);
      }

      // Update status
      const updatedProperty = await this.prisma.property.update({
        where: { id: propertyId },
        data: {
          status: 'PENDING',
          adminApprovalStatus: 'PENDING'
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          agent: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          images: true,
          units: {
            include: {
              images: true
            }
          }
        }
      });

      return this.formatPropertyWithBoundary(updatedProperty);
    } catch (error) {
      console.error('Error publishing property:', error);
      throw error;
    }
  }

  // Private helper methods
  private async createPropertyUnits(propertyId: string, units: any[]): Promise<void> {
    for (const unit of units) {
      await this.prisma.propertyUnit.create({
        data: {
          propertyId,
          unitNumber: unit.unitNumber,
          floor: unit.floor,
          bedrooms: unit.bedrooms,
          bathrooms: unit.bathrooms,
          area: unit.area,
          features: unit.features || [],
          price: unit.price,
          currency: unit.currency || 'NGN',
          status: 'AVAILABLE',
          isAvailable: unit.isAvailable ?? true,
          availableFrom: unit.availableFrom
        }
      });
    }
  }

  private validatePropertyForPublishing(property: any): string[] {
    const errors: string[] = [];

    if (!property.title || property.title.length < 10) {
      errors.push('Title must be at least 10 characters long');
    }

    if (!property.description || property.description.length < 50) {
      errors.push('Description must be at least 50 characters long');
    }

    if (!property.price || property.price <= 0) {
      errors.push('Price must be greater than 0');
    }

    if (!property.images || property.images.length === 0) {
      errors.push('At least one image is required');
    }

    if (!property.boundaryVerified) {
      errors.push('Property boundary must be verified');
    }

    return errors;
  }

  private formatPropertyWithBoundary(property: any): PropertyWithBoundary {
    return {
      ...property,
      gpsCoordinates: property.gpsCoordinates ? JSON.parse(property.gpsCoordinates) : null,
      boundaryCoordinates: property.boundaryCoordinates || null,
      boundaryData: {
        isVerified: property.boundaryVerified,
        markedBy: property.boundaryMarkedBy,
        markedAt: property.boundaryMarkedAt,
        images: property.boundaryImages || []
      }
    };
  }

  private generateShareableLink(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}