// backend/property-service/src/routes/favorites.ts

import { Router } from 'express';
import { favoritesController } from '../controllers/favoritesController';
import { authMiddleware } from '../../../shared/src/middleware/auth';
import { rateLimiter } from '../../../shared/src/middleware/rateLimiter';
import { validationMiddleware } from '../../../shared/src/middleware/validation';
import { z } from 'zod';

const router = Router();

// Rate limiting configurations
const favoriteActionLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 favorite actions per window
  message: 'Too many favorite actions. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

const favoritesViewLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 view requests per window
  message: 'Too many requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// Validation schemas
const propertyIdSchema = z.object({
  propertyId: z.string().cuid('Invalid property ID format')
});

const propertyIdsArraySchema = z.object({
  propertyIds: z.array(z.string().cuid()).min(1).max(50, 'Maximum 50 properties allowed')
});

const paginationSchema = z.object({
  page: z.string().optional().refine(val => !val || /^\d+$/.test(val), 'Page must be a number'),
  limit: z.string().optional().refine(val => !val || (/^\d+$/.test(val) && parseInt(val) <= 50), 'Limit must be a number between 1 and 50'),
  sortBy: z.enum(['createdAt', 'price', 'title']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * @route   POST /api/favorites/toggle
 * @desc    Toggle property favorite status
 * @access  Private (authenticated users)
 * @body    { propertyId: string }
 */
router.post(
  '/toggle',
  favoriteActionLimiter,
  validationMiddleware({ body: propertyIdSchema }),
  favoritesController.toggleFavorite
);

/**
 * @route   GET /api/favorites
 * @desc    Get user's favorite properties with pagination
 * @access  Private (authenticated users)
 * @query   page?, limit?, sortBy?, sortOrder?
 */
router.get(
  '/',
  favoritesViewLimiter,
  validationMiddleware({ query: paginationSchema }),
  favoritesController.getUserFavorites
);

/**
 * @route   GET /api/favorites/count
 * @desc    Get user's favorites count
 * @access  Private (authenticated users)
 */
router.get(
  '/count',
  favoritesViewLimiter,
  favoritesController.getFavoritesCount
);

/**
 * @route   GET /api/favorites/status/:propertyId
 * @desc    Check if a property is favorited by user
 * @access  Private (authenticated users)
 * @params  propertyId: string
 */
router.get(
  '/status/:propertyId',
  favoritesViewLimiter,
  validationMiddleware({ params: propertyIdSchema }),
  favoritesController.checkFavoriteStatus
);

/**
 * @route   DELETE /api/favorites/remove
 * @desc    Remove multiple properties from favorites
 * @access  Private (authenticated users)
 * @body    { propertyIds: string[] }
 */
router.delete(
  '/remove',
  favoriteActionLimiter,
  validationMiddleware({ body: propertyIdsArraySchema }),
  favoritesController.removeFavorites
);

/**
 * @route   GET /api/favorites/stats/:propertyId
 * @desc    Get property favorite statistics
 * @access  Public (for property owners/agents to see stats)
 */
router.get(
  '/stats/:propertyId',
  favoritesViewLimiter,
  validationMiddleware({ params: propertyIdSchema }),
  favoritesController.getPropertyFavoriteStats
);

export default router;