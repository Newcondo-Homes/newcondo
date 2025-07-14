// backend/property-service/src/routes/boundaries.ts

import { Router } from 'express';
import { 
  markPropertyBoundary,
  validateBoundary,
  searchNearbyBoundaries,
  getBoundaryById,
  updateBoundary,
  deleteBoundary,
  checkForDuplicates,
  getConflictingBoundaries,
  getBoundaryStatistics,
  exportBoundaryData
} from '../controllers/boundaryController';
import { auth } from '../middleware/auth';
import { validateBoundaryRequest } from '../middleware/boundaryValidation';

const router = Router();

// Mark property boundary
router.post('/mark', auth, validateBoundaryRequest, markPropertyBoundary);

// Validate boundary coordinates
router.post('/validate', auth, validateBoundary);

// Check for duplicate properties
router.post('/check-duplicates', auth, checkForDuplicates);

// Search nearby boundaries
router.post('/search', auth, searchNearbyBoundaries);

// Get boundary by ID
router.get('/:boundaryId', auth, getBoundaryById);

// Update boundary
router.put('/:boundaryId', auth, validateBoundaryRequest, updateBoundary);

// Delete boundary
router.delete('/:boundaryId', auth, deleteBoundary);

// Get conflicting boundaries for a property
router.get('/conflicts/:propertyId', auth, getConflictingBoundaries);

// Get boundary statistics (admin only)
router.get('/admin/statistics', auth, getBoundaryStatistics);

// Export boundary data (admin only)
router.get('/admin/export', auth, exportBoundaryData);

export default router;