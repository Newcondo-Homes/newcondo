// backend/property-service/src/services/searchService.ts

import { PrismaClient } from '@newcondo/db';
import { SearchFilters, PropertySearchResult, SearchResponse } from '../types/search';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

export class SearchService {
  /**
   * Search properties with filters and pagination
   */
  static async searchProperties(filters: SearchFilters): Promise<SearchResponse> {
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
      isAvailable,
      structure,
      boundaryVerified,
      ownerId,
      agentId,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
      status: 'PUBLISHED',
      adminApprovalStatus: 'APPROVED',
    };

    // Text search in title and description
    if (query) {
      whereClause.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { address: { contains: query, mode: 'insensitive' } }
      ];
    }

    // Location filters
    if (city) {
      whereClause.city = { contains: city, mode: 'insensitive' };
    }
    if (state) {
      whereClause.state = { contains: state, mode: 'insensitive' };
    }

    // Property type filter
    if (propertyType) {
      whereClause.propertyType = propertyType;
    }

    // Price range filters (for single units)
    if (minPrice || maxPrice) {
      if (structure !== 'MULTI_FAMILY') {
        whereClause.price = {};
        if (minPrice) {
          whereClause.price.gte = new Decimal(minPrice);
        }
        if (maxPrice) {
          whereClause.price.lte = new Decimal(maxPrice);
        }
      }
    }

    // Room filters (for single units)
    if (bedrooms) {
      whereClause.bedrooms = { gte: bedrooms };
    }
    if (bathrooms) {
      whereClause.bathrooms = { gte: bathrooms };
    }

    // Features filter
    if (features && features.length > 0) {
      whereClause.features = { hasEvery: features };
    }

    // Availability filter
    if (isAvailable !== undefined) {
      whereClause.isAvailable = isAvailable;
    }

    // Structure filter
    if (structure) {
      whereClause.structure = structure;
    }

    // Boundary verification filter
    if (boundaryVerified !== undefined) {
      whereClause.boundaryVerified = boundaryVerified;
    }

    // Owner/Agent filters
    if (ownerId) {
      whereClause.ownerId = ownerId;
    }
    if (agentId) {
      whereClause.agentId = agentId;
    }

    // Build orderBy clause
    const orderByClause: any = {};
    orderByClause[sortBy] = sortOrder;

    try {
      // Execute search query
      const [properties, totalCount] = await Promise.all([
        prisma.property.findMany({
          where: whereClause,
          include: {
            images: {
              orderBy: { order: 'asc' },
              take: 5 // Limit images for search results
            },
            owner: {
              select: {
                id: true,
                name: true,
                image: true,
                role: true,
                verificationStatus: true
              }
            },
            agent: {
              select: {
                id: true,
                name: true,
                image: true,
                agentReliabilityScore: true,
                verificationStatus: true
              }
            },
            units: {
              where: { isAvailable: true },
              select: {
                id: true,
                unitNumber: true,
                price: true,
                bedrooms: true,
                bathrooms: true,
                area: true,
                status: true
              }
            },
            _count: {
              select: {
                units: true
              }
            }
          },
          skip,
          take: limit,
          orderBy: orderByClause
        }),
        prisma.property.count({ where: whereClause })
      ]);

      // Transform results
      const searchResults: PropertySearchResult[] = properties.map(property => ({
        id: property.id,
        title: property.title,
        description: property.description,
        structure: property.structure,
        price: property.price?.toString(),
        currency: property.currency,
        address: property.address,
        city: property.city,
        state: property.state,
        country: property.country,
        propertyType: property.propertyType,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        area: property.area,
        features: property.features,
        isAvailable: property.isAvailable,
        availableFrom: property.availableFrom,
        boundaryVerified: property.boundaryVerified,
        gpsCoordinates: property.gpsCoordinates,
        totalUnits: property.totalUnits,
        availableUnits: property.availableUnits,
        buildingFeatures: property.buildingFeatures,
        viewCount: property.viewCount,
        favoriteCount: property.favoriteCount,
        images: property.images.map(img => ({
          id: img.id,
          url: img.url,
          altText: img.altText,
          isPrimary: img.isPrimary,
          order: img.order
        })),
        owner: {
          id: property.owner.id,
          name: property.owner.name,
          image: property.owner.image,
          role: property.owner.role,
          verificationStatus: property.owner.verificationStatus
        },
        agent: property.agent ? {
          id: property.agent.id,
          name: property.agent.name,
          image: property.agent.image,
          reliabilityScore: property.agent.agentReliabilityScore?.toString(),
          verificationStatus: property.agent.verificationStatus
        } : null,
        units: property.units.map(unit => ({
          id: unit.id,
          unitNumber: unit.unitNumber,
          price: unit.price.toString(),
          bedrooms: unit.bedrooms,
          bathrooms: unit.bathrooms,
          area: unit.area,
          status: unit.status
        })),
        createdAt: property.createdAt,
        updatedAt: property.updatedAt
      }));

      return {
        results: searchResults,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPrevPage: page > 1
        }
      };

    } catch (error) {
      console.error('Property search error:', error);
      throw new Error('Failed to search properties');
    }
  }

  /**
   * Get property suggestions based on location
   */
  static async getLocationSuggestions(query: string): Promise<string[]> {
    try {
      const suggestions = await prisma.property.findMany({
        where: {
          OR: [
            { city: { contains: query, mode: 'insensitive' } },
            { state: { contains: query, mode: 'insensitive' } },
            { address: { contains: query, mode: 'insensitive' } }
          ],
          status: 'PUBLISHED',
          adminApprovalStatus: 'APPROVED'
        },
        select: {
          city: true,
          state: true,
          address: true
        },
        take: 10
      });

      // Extract unique location suggestions
      const locationSet = new Set<string>();
      suggestions.forEach(prop => {
        locationSet.add(prop.city);
        locationSet.add(prop.state);
        locationSet.add(prop.address);
      });

      return Array.from(locationSet)
        .filter(location => location.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 10);

    } catch (error) {
      console.error('Location suggestions error:', error);
      throw new Error('Failed to get location suggestions');
    }
  }

  /**
   * Get similar properties based on criteria
   */
  static async getSimilarProperties(
    propertyId: string, 
    limit: number = 5
  ): Promise<PropertySearchResult[]> {
    try {
      // Get the reference property
      const referenceProperty = await prisma.property.findUnique({
        where: { id: propertyId },
        select: {
          city: true,
          state: true,
          propertyType: true,
          bedrooms: true,
          price: true,
          structure: true
        }
      });

      if (!referenceProperty) {
        return [];
      }

      // Find similar properties
      const similarProperties = await prisma.property.findMany({
        where: {
          id: { not: propertyId },
          status: 'PUBLISHED',
          adminApprovalStatus: 'APPROVED',
          isAvailable: true,
          OR: [
            {
              city: referenceProperty.city,
              propertyType: referenceProperty.propertyType
            },
            {
              state: referenceProperty.state,
              propertyType: referenceProperty.propertyType,
              bedrooms: referenceProperty.bedrooms
            }
          ]
        },
        include: {
          images: {
            where: { isPrimary: true },
            take: 1
          },
          owner: {
            select: {
              id: true,
              name: true,
              image: true,
              role: true,
              verificationStatus: true
            }
          },
          agent: {
            select: {
              id: true,
              name: true,
              image: true,
              agentReliabilityScore: true,
              verificationStatus: true
            }
          }
        },
        take: limit,
        orderBy: [
          { boundaryVerified: 'desc' },
          { createdAt: 'desc' }
        ]
      });

      return similarProperties.map(property => ({
        id: property.id,
        title: property.title,
        description: property.description,
        structure: property.structure,
        price: property.price?.toString(),
        currency: property.currency,
        address: property.address,
        city: property.city,
        state: property.state,
        country: property.country,
        propertyType: property.propertyType,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        area: property.area,
        features: property.features,
        isAvailable: property.isAvailable,
        availableFrom: property.availableFrom,
        boundaryVerified: property.boundaryVerified,
        gpsCoordinates: property.gpsCoordinates,
        totalUnits: property.totalUnits,
        availableUnits: property.availableUnits,
        buildingFeatures: property.buildingFeatures,
        viewCount: property.viewCount,
        favoriteCount: property.favoriteCount,
        images: property.images.map(img => ({
          id: img.id,
          url: img.url,
          altText: img.altText,
          isPrimary: img.isPrimary,
          order: img.order
        })),
        owner: {
          id: property.owner.id,
          name: property.owner.name,
          image: property.owner.image,
          role: property.owner.role,
          verificationStatus: property.owner.verificationStatus
        },
        agent: property.agent ? {
          id: property.agent.id,
          name: property.agent.name,
          image: property.agent.image,
          reliabilityScore: property.agent.agentReliabilityScore?.toString(),
          verificationStatus: property.agent.verificationStatus
        } : null,
        units: [],
        createdAt: property.createdAt,
        updatedAt: property.updatedAt
      }));

    } catch (error) {
      console.error('Similar properties error:', error);
      throw new Error('Failed to get similar properties');
    }
  }

  /**
   * Search properties by boundary coordinates
   */
  static async searchByBoundary(
    coordinates: { lat: number; lng: number }[],
    radius: number = 1000
  ): Promise<PropertySearchResult[]> {
    try {
      // For now, we'll do a simple radius search
      // In production, you'd want to use PostGIS or similar for polygon searches
      const centerLat = coordinates.reduce((sum, coord) => sum + coord.lat, 0) / coordinates.length;
      const centerLng = coordinates.reduce((sum, coord) => sum + coord.lng, 0) / coordinates.length;

      const properties = await prisma.property.findMany({
        where: {
          status: 'PUBLISHED',
          adminApprovalStatus: 'APPROVED',
          isAvailable: true,
          gpsCoordinates: { not: null }
        },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          owner: {
            select: {
              id: true,
              name: true,
              image: true,
              role: true,
              verificationStatus: true
            }
          }
        }
      });

      // Filter by distance (simplified haversine distance)
      const nearbyProperties = properties.filter(property => {
        if (!property.gpsCoordinates) return false;
        
        try {
          const coords = JSON.parse(property.gpsCoordinates);
          const distance = this.calculateDistance(
            centerLat, centerLng, 
            coords.lat, coords.lng
          );
          return distance <= radius;
        } catch {
          return false;
        }
      });

      return nearbyProperties.map(property => ({
        id: property.id,
        title: property.title,
        description: property.description,
        structure: property.structure,
        price: property.price?.toString(),
        currency: property.currency,
        address: property.address,
        city: property.city,
        state: property.state,
        country: property.country,
        propertyType: property.propertyType,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        area: property.area,
        features: property.features,
        isAvailable: property.isAvailable,
        availableFrom: property.availableFrom,
        boundaryVerified: property.boundaryVerified,
        gpsCoordinates: property.gpsCoordinates,
        totalUnits: property.totalUnits,
        availableUnits: property.availableUnits,
        buildingFeatures: property.buildingFeatures,
        viewCount: property.viewCount,
        favoriteCount: property.favoriteCount,
        images: property.images.map(img => ({
          id: img.id,
          url: img.url,
          altText: img.altText,
          isPrimary: img.isPrimary,
          order: img.order
        })),
        owner: {
          id: property.owner.id,
          name: property.owner.name,
          image: property.owner.image,
          role: property.owner.role,
          verificationStatus: property.owner.verificationStatus
        },
        agent: null,
        units: [],
        createdAt: property.createdAt,
        updatedAt: property.updatedAt
      }));

    } catch (error) {
      console.error('Boundary search error:', error);
      throw new Error('Failed to search by boundary');
    }
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  private static calculateDistance(
    lat1: number, lon1: number, 
    lat2: number, lon2: number
  ): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}