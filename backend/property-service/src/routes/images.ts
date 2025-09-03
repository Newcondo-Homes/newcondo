import { Router } from 'express';
import {
  uploadPropertyImages,
  deletePropertyImage,
  reorderPropertyImages,
  setPrimaryImage,
  getPropertyImages,
  uploadUnitImages,
  deleteUnitImage,
  reorderUnitImages,
  getUnitImages,
  uploadBoundaryImages,
  getBoundaryImages,
  optimizeImage,
  validateImageUpload,
  bulkUploadImages
} from '../controllers/imageController';
import { authMiddleware } from '../../../shared/src/middleware/auth';
import { validateOwnership } from '../middleware/propertyValidation';

const router = Router();

// All image routes require authentication
router.use(authMiddleware);

// Property image management
router.get('/property/:propertyId', getPropertyImages);

router.post(
  '/property/:propertyId/upload',
  validateOwnership,
  validateImageUpload,
  uploadPropertyImages
);

router.post(
  '/property/:propertyId/bulk-upload',
  validateOwnership,
  validateImageUpload,
  bulkUploadImages
);

router.delete(
  '/property/:propertyId/:imageId',
  validateOwnership,
  deletePropertyImage
);

router.patch(
  '/property/:propertyId/reorder',
  validateOwnership,
  reorderPropertyImages
);

router.patch(
  '/property/:propertyId/:imageId/primary',
  validateOwnership,
  setPrimaryImage
);

// Unit image management (for multi-family properties)
router.get('/unit/:unitId', getUnitImages);

router.post(
  '/unit/:unitId/upload',
  validateOwnership, // Will validate property ownership through unit
  validateImageUpload,
  uploadUnitImages
);

router.delete(
  '/unit/:unitId/:imageId',
  validateOwnership,
  deleteUnitImage
);

router.patch(
  '/unit/:unitId/reorder',
  validateOwnership,
  reorderUnitImages
);

// Boundary marking images (for property verification)
router.get('/boundary/:propertyId', getBoundaryImages);

router.post(
  '/boundary/:propertyId/upload',
  validateOwnership,
  validateImageUpload,
  uploadBoundaryImages
);

// Image optimization and processing
router.post(
  '/:imageId/optimize',
  validateOwnership,
  optimizeImage
);

export default router;