// backend/property-service/src/controllers/favoritesController.ts

import { Request, Response, NextFunction } from 'express';
import { favoritesService } from '../services/favoritesService';
import { standardResponse } from '../../../shared/src/utils/response';
import { z } from 'zod';

// Validation schemas
const toggleFavoriteSchema = z.object({
  propertyId: z.string().cuid()
});

const getFavoritesSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  sortBy: z.enum(['createdAt', 'price', 'title']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

export class FavoritesController {
  /**
   * Toggle property favorite status
   */
  async toggleFavorite(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return standardResponse(res, 401, 'Unauthorized', null);
      }

      const { propertyId } = toggleFavoriteSchema.parse(req.body);

      const result = await favoritesService.toggleFavorite(userId, propertyId);

      return standardResponse(
        res,
        200,
        result.action === 'added' ? 'Property added to favorites' : 'Property removed from favorites',
        {
          isFavorite: result.isFavorite,
          action: result.action,
          totalFavorites: result.totalFavorites
        }
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's favorite properties with pagination
   */
  async getUserFavorites(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return standardResponse(res, 401, 'Unauthorized', null);
      }

      const { page, limit, sortBy, sortOrder } = getFavoritesSchema.parse(req.query);

      const result = await favoritesService.getUserFavorites(userId, {
        page,
        limit,
        sortBy,
        sortOrder
      });

      return standardResponse(
        res,
        200,
        'Favorites retrieved successfully',
        {
          properties: result.properties,
          pagination: {
            currentPage: page,
            totalPages: result.totalPages,
            totalItems: result.totalCount,
            itemsPerPage: limit,
            hasNextPage: page < result.totalPages,
            hasPreviousPage: page > 1
          }
        }
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check if a property is favorited by user
   */
  async checkFavoriteStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return standardResponse(res, 401, 'Unauthorized', null);
      }

      const { propertyId } = req.params;
      
      if (!propertyId) {
        return standardResponse(res, 400, 'Property ID is required', null);
      }

      const isFavorite = await favoritesService.checkFavoriteStatus(userId, propertyId);

      return standardResponse(
        res,
        200,
        'Favorite status retrieved successfully',
        { isFavorite }
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get favorite properties count for user
   */
  async getFavoritesCount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return standardResponse(res, 401, 'Unauthorized', null);
      }

      const count = await favoritesService.getFavoritesCount(userId);

      return standardResponse(
        res,
        200,
        'Favorites count retrieved successfully',
        { count }
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove multiple favorites
   */
  async removeFavorites(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return standardResponse(res, 401, 'Unauthorized', null);
      }

      const { propertyIds } = z.object({
        propertyIds: z.array(z.string().cuid()).min(1, 'At least one property ID is required')
      }).parse(req.body);

      const removedCount = await favoritesService.removeFavorites(userId, propertyIds);

      return standardResponse(
        res,
        200,
        `${removedCount} properties removed from favorites`,
        { removedCount }
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get property favorite statistics
   */
  async getPropertyFavoriteStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId } = req.params;
      
      if (!propertyId) {
        return standardResponse(res, 400, 'Property ID is required', null);
      }

      const stats = await favoritesService.getPropertyFavoriteStats(propertyId);

      return standardResponse(
        res,
        200,
        'Property favorite stats retrieved successfully',
        stats
      );
    } catch (error) {
      next(error);
    }
  }
}

export const favoritesController = new FavoritesController();