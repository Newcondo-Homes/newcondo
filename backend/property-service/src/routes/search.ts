import { Router } from 'express';
import {
  searchProperties,
  searchPropertiesByLocation,
  searchPropertiesAdvanced,
  getSearchSuggestions,
  getPopularSearches,
  saveSearch,
  getUserSavedSearches,
  deleteSavedSearch,
  getSearchStats,
  searchPropertiesByBoundingBox,
  searchPropertiesNearby,
  searchByFeatures,
  searchByPropertyType,
  autoCompleteSearch,
  getSearchFilters,
  getTrendingProperties,
  getRecommendedProperties,
  getFeaturedProperties
} from '../controllers/searchController';
import { validateSearchQuery } from '../middleware/propertyValidation';
import { authMiddleware } from '../../../shared/src/middleware/auth';

const router = Router();

// Public search routes - no authentication required
router.get('/', validateSearchQuery, searchProperties);
router.get('/location', searchPropertiesByLocation);
router.get('/advanced', validateSearchQuery, searchPropertiesAdvanced);
router.get('/suggestions', getSearchSuggestions);
router.get('/popular', getPopularSearches);
router.get('/autocomplete', autoCompleteSearch);
router.get('/filters', getSearchFilters); // Get available filter options
router.get('/trending', getTrendingProperties);
router.get('/featured', getFeaturedProperties);

// Map-based search routes
router.get('/bounding-box', validateSearchQuery, searchPropertiesByBoundingBox);
router.get('/nearby', searchPropertiesNearby);

// Category-based search routes
router.get('/by-features', searchByFeatures);
router.get('/by-type/:propertyType', searchByPropertyType);

// Protected search routes - authentication required
router.use(authMiddleware);

// Saved searches
router.post('/save', saveSearch);
router.get('/saved', getUserSavedSearches);
router.delete('/saved/:searchId', deleteSavedSearch);

// Personalized recommendations
router.get('/recommended', getRecommendedProperties);

// Search analytics (for logged-in users)
router.get('/stats', getSearchStats);

export default router;