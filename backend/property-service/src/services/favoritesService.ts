// backend/property-service/src/services/favoritesService.ts

import { PrismaClient } from '@newcondo/db';
import { EventLog } from '../../../shared/src/utils/eventLogger';
import { cacheService } from './cacheService';
import { PropertyStatus, AdminApprovalStatus, Role } from '@newcondo/db';

interface FavoriteOptions {
  page: number;
  limit: number;
  sortBy: 'createdAt' | 'price' | 'title';
  sortOrder: 'asc' | 'desc';
}

interface FavoriteResult {
  properties: any[];
  totalCount: number;
  totalPages: number;
}

export class FavoritesService {
  private prisma: PrismaClient;
  private eventLogger: EventLog;

  constructor() {
    this.prisma = new PrismaClient();
    this.eventLogger = new EventLog();
  }

  /**
   * Toggle favorite status for a property
   */
  async toggleFavorite(userId: string, propertyId: string) {
    try {
      // Check if property exists and is available
      const property = await this.prisma.property.findUnique({
        where: { id: propertyId },
        select: {
          id: true,
          title: true,
          status: true,
          adminApprovalStatus: true,
          ownerId: true
        }
      });

      if (!property) {
        throw new Error('Property not found');
      }

      if (property.status !== PropertyStatus.PUBLISHED || 
          property.adminApprovalStatus !== AdminApprovalStatus.APPROVED) {
        throw new Error('Property is not available for viewing');
      }

      // Check if already favorited
      const existingFavorite = await this.prisma.eventLog.findFirst({
        where: {
          userId,
          type: 'PROPERTY_FAVORITED',
          metadata: {
            path: ['propertyId'],
            equals: propertyId
          }
        }
      });

      let action: 'added' | 'removed';
      let isFavorite: boolean;

      if (existingFavorite) {
        // Remove from favorites
        await this.prisma.eventLog.delete({
          where: { id: existingFavorite.id }
        });
        
        action = 'removed';
        isFavorite = false;

        // Log unfavorite event
        await this.eventLogger.log({
          userId,
          type: 'PROPERTY_UNFAVORITED',
          metadata: { 
            propertyId,
            propertyTitle: property.title,
            propertyOwnerId: property.ownerId
          }
        });
      } else {
        // Add to favorites
        await this.prisma.eventLog.create({
          data: {
            userId,
            type: 'PROPERTY_FAVORITED',
            metadata: { 
              propertyId,
              propertyTitle: property.title,
              propertyOwnerId: property.ownerId
            }
          }
        });

        action = 'added';
        isFavorite = true;

        // Log favorite event
        await this.eventLogger.log({
          userId,
          type: 'PROPERTY_FAVORITED',
          metadata: { 
            propertyId,
            propertyTitle: property.title,
            propertyOwnerId: property.ownerId
          }
        });
      }

      // Update property favorite count in cache
      await this.updatePropertyFavoriteCount(propertyId);

      // Get total favorites count for user
      const totalFavorites = await this.getFavoritesCount(userId);

      // Clear user favorites cache
      await cacheService.delete(`user_favorites:${userId}:*`);

      return {
        action,
        isFavorite,
        totalFavorites
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user's favorite properties with pagination
   */
  async getUserFavorites(userId: string, options: FavoriteOptions): Promise<FavoriteResult> {
    try {
      const { page, limit, sortBy, sortOrder } = options;
      const skip = (page - 1) * limit;

      // Try to get from cache first
      const cacheKey = `user_favorites:${userId}:${page}:${limit}:${sortBy}:${sortOrder}`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        return cached as FavoriteResult;
      }

      // Get favorite events
      const favoriteEvents = await this.prisma.eventLog.findMany({
        where: {
          userId,
          type: 'PROPERTY_FAVORITED'
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit
      });

      const propertyIds = favoriteEvents.map(event => 
        (event.metadata as any)?.propertyId
      ).filter(Boolean);

      if (propertyIds.length === 0) {
        const emptyResult = { properties: [], totalCount: 0, totalPages: 0 };
        await cacheService.set(cacheKey, emptyResult, 300); // 5 minutes cache
        return emptyResult;
      }

      // Build sort object
      const sortField = sortBy === 'createdAt' ? 'createdAt' : 
                       sortBy === 'title' ? 'title' : 'price';
      const sortObject = { [sortField]: sortOrder };

      // Get properties with details
      const properties = await this.prisma.property.findMany({
        where: {
          id: { in: propertyIds },
          status: PropertyStatus.PUBLISHED,
          adminApprovalStatus: AdminApprovalStatus.APPROVED
        },
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          currency: true,
          address: true,
          city: true,
          state: true,
          propertyType: true,
          bedrooms: true,
          bathrooms: true,
          area: true,
          features: true,
          isAvailable: true,
          availableFrom: true,
          viewCount: true,
          favoriteCount: true,
          shareableLink: true,
          structure: true,
          totalUnits: true,
          availableUnits: true,
          images: {
            select: {
              id: true,
              url: true,
              altText: true,
              isPrimary: true,
              order: true
            },
            orderBy: [
              { isPrimary: 'desc' },
              { order: 'asc' }
            ],
            take: 5 // Limit images for performance
          },
          owner: {
            select: {
              id: true,
              name: true,
              role: true,
              image: true,
              isB2BCustomer: true,
              companyName: true
            }
          },
          agent: {
            select: {
              id: true,
              name: true,
              image: true,
              agentReliabilityScore: true
            }
          },
          units: {
            where: {
              status: 'AVAILABLE',
              isAvailable: true
            },
            select: {
              id: true,
              unitNumber: true,
              bedrooms: true,
              bathrooms: true,
              area: true,
              price: true,
              currency: true,
              floor: true
            },
            orderBy: { price: 'asc' },
            take: 3 // Limit units shown
          },
          createdAt: true,
          updatedAt: true
        },
        orderBy: sortObject
      });

      // Get total count
      const totalCount = await this.prisma.eventLog.count({
        where: {
          userId,
          type: 'PROPERTY_FAVORITED'
        }
      });

      const totalPages = Math.ceil(totalCount / limit);

      // Transform data
      const transformedProperties = properties.map(property => ({
        ...property,
        primaryImage: property.images.find(img => img.isPrimary)?.url || property.images[0]?.url || null,
        imageCount: property.images.length,
        isOwnerListing: !property.agent,
        ownerInfo: {
          name: property.owner.name,
          isB2B: property.owner.isB2BCustomer,
          companyName: property.owner.companyName,
          image: property.owner.image
        },
        agentInfo: property.agent ? {
          name: property.agent.name,
          image: property.agent.image,
          reliabilityScore: property.agent.agentReliabilityScore
        } : null,
        unitInfo: property.structure === 'MULTI_FAMILY' ? {
          totalUnits: property.totalUnits,
          availableUnits: property.availableUnits,
          sampleUnits: property.units,
          priceRange: property.units.length > 0 ? {
            min: Math.min(...property.units.map(u => Number(u.price))),
            max: Math.max(...property.units.map(u => Number(u.price)))
          } : null
        } : null
      }));

      const result = {
        properties: transformedProperties,
        totalCount,
        totalPages
      };

      // Cache result for 5 minutes
      await cacheService.set(cacheKey, result, 300);

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if a property is favorited by user
   */
  async checkFavoriteStatus(userId: string, propertyId: string): Promise<boolean> {
    try {
      const cacheKey = `favorite_status:${userId}:${propertyId}`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached !== null) {
        return cached as boolean;
      }

      const favorite = await this.prisma.eventLog.findFirst({
        where: {
          userId,
          type: 'PROPERTY_FAVORITED',
          metadata: {
            path: ['propertyId'],
            equals: propertyId
          }
        }
      });

      const isFavorite = !!favorite;
      
      // Cache for 10 minutes
      await cacheService.set(cacheKey, isFavorite, 600);
      
      return isFavorite;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user's favorites count
   */
  async getFavoritesCount(userId: string): Promise<number> {
    try {
      const cacheKey = `favorites_count:${userId}`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached !== null) {
        return cached as number;
      }

      const count = await this.prisma.eventLog.count({
        where: {
          userId,
          type: 'PROPERTY_FAVORITED'
        }
      });

      // Cache for 5 minutes
      await cacheService.set(cacheKey, count, 300);
      
      return count;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove multiple properties from favorites
   */
  async removeFavorites(userId: string, propertyIds: string[]): Promise<number> {
    try {
      const deleteResult = await this.prisma.eventLog.deleteMany({
        where: {
          userId,
          type: 'PROPERTY_FAVORITED',
          metadata: {
            path: ['propertyId'],
            in: propertyIds
          }
        }
      });

      // Update property favorite counts
      for (const propertyId of propertyIds) {
        await this.updatePropertyFavoriteCount(propertyId);
      }

      // Clear user favorites cache
      await cacheService.delete(`user_favorites:${userId}:*`);
      await cacheService.delete(`favorites_count:${userId}`);

      // Log bulk unfavorite event
      await this.eventLogger.log({
        userId,
        type: 'PROPERTIES_BULK_UNFAVORITED',
        metadata: { 
          propertyIds,
          count: deleteResult.count
        }
      });

      return deleteResult.count;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get property favorite statistics
   */
  async getPropertyFavoriteStats(propertyId: string) {
    try {
      const cacheKey = `property_favorite_stats:${propertyId}`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        return cached;
      }

      // Get total favorites count
      const totalFavorites = await this.prisma.eventLog.count({
        where: {
          type: 'PROPERTY_FAVORITED',
          metadata: {
            path: ['propertyId'],
            equals: propertyId
          }
        }
      });

      // Get recent favorites (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentFavorites = await this.prisma.eventLog.count({
        where: {
          type: 'PROPERTY_FAVORITED',
          metadata: {
            path: ['propertyId'],
            equals: propertyId
          },
          timestamp: {
            gte: thirtyDaysAgo
          }
        }
      });

      // Get favorites by user type
      const favoritesByUserType = await this.prisma.eventLog.groupBy({
        by: ['userId'],
        where: {
          type: 'PROPERTY_FAVORITED',
          metadata: {
            path: ['propertyId'],
            equals: propertyId
          }
        },
        _count: true
      });

      const userIds = favoritesByUserType.map(f => f.userId).filter(Boolean);
      
      const userTypes = await this.prisma.user.groupBy({
        by: ['role'],
        where: {
          id: { in: userIds }
        },
        _count: true
      });

      const stats = {
        totalFavorites,
        recentFavorites,
        favoritesByUserType: userTypes.reduce((acc, curr) => {
          acc[curr.role] = curr._count;
          return acc;
        }, {} as Record<Role, number>),
        averageFavoritesPerDay: recentFavorites / 30
      };

      // Cache for 1 hour
      await cacheService.set(cacheKey, stats, 3600);

      return stats;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update property favorite count cache
   */
  private async updatePropertyFavoriteCount(propertyId: string) {
    try {
      const count = await this.prisma.eventLog.count({
        where: {
          type: 'PROPERTY_FAVORITED',
          metadata: {
            path: ['propertyId'],
            equals: propertyId
          }
        }
      });

      // Update property favorite count in database
      await this.prisma.property.update({
        where: { id: propertyId },
        data: { favoriteCount: count }
      });

      // Update cache
      await cacheService.set(`property_favorite_count:${propertyId}`, count, 3600);
    } catch (error) {
      console.error('Error updating property favorite count:', error);
    }
  }
}

export const favoritesService = new FavoritesService();