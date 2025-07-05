// backend/combined-app/src/routes/properties.ts
import { Router } from 'express';
import type { Router as ExpressRouter } from 'express'

// import { propertyController } from '../../property-service/src/controllers/propertyController';
// import { imageController } from '../../property-service/src/controllers/imageController';
// import { searchController } from '../../property-service/src/controllers/searchController';
// import { boundaryController } from '../../property-service/src/controllers/boundaryController';
// import { duplicateController } from '../../property-service/src/controllers/duplicateController';
// import { legalController } from '../../property-service/src/controllers/legalController';

// // Import middleware from property service
// import { propertyValidation } from '../../property-service/src/middleware/propertyValidation';
// import { boundaryValidation } from '../../property-service/src/middleware/boundaryValidation';

// // Import shared middleware
// import { authenticateToken } from '../../shared/src/middleware/auth';
// import { validateRequest } from '../../shared/src/middleware/validation';

const router: ExpressRouter = Router();

// Property CRUD routes
// router.get('/', propertyController.getAllProperties);
// router.get('/search', searchController.searchProperties);
// router.get('/featured', propertyController.getFeaturedProperties);
// router.get('/nearby', propertyController.getNearbyProperties);
// router.get('/:id', propertyController.getPropertyById);

// Protected property routes
// router.post('/', 
//   authenticateToken,
//   propertyValidation.validateCreateProperty,
//   validateRequest,
//   propertyController.createProperty
// );

// router.put('/:id',
//   authenticateToken,
//   propertyValidation.validateUpdateProperty,
//   validateRequest,
//   propertyController.updateProperty
// );

// router.delete('/:id',
//   authenticateToken,
//   propertyController.deleteProperty
// );

// // Property images routes
// router.post('/:id/images',
//   authenticateToken,
//   imageController.uploadPropertyImages
// );

// router.delete('/:id/images/:imageId',
//   authenticateToken,
//   imageController.deletePropertyImage
// );

// router.put('/:id/images/:imageId/primary',
//   authenticateToken,
//   imageController.setPrimaryImage
// );

// // Property boundary routes
// router.get('/:id/boundaries', boundaryController.getPropertyBoundaries);
// router.post('/:id/boundaries',
//   authenticateToken,
//   boundaryValidation.validateBoundary,
//   validateRequest,
//   boundaryController.createPropertyBoundary
// );

// router.put('/:id/boundaries/:boundaryId',
//   authenticateToken,
//   boundaryValidation.validateBoundary,
//   validateRequest,
//   boundaryController.updatePropertyBoundary
// );

// router.delete('/:id/boundaries/:boundaryId',
//   authenticateToken,
//   boundaryController.deletePropertyBoundary
// );

// // Duplicate detection routes
// router.get('/:id/duplicates', duplicateController.checkDuplicates);
// router.post('/:id/duplicates/resolve',
//   authenticateToken,
//   duplicateController.resolveDuplicate
// );

// // Legal documents routes
// router.get('/:id/legal-documents', legalController.getLegalDocuments);
// router.post('/:id/legal-documents',
//   authenticateToken,
//   legalController.uploadLegalDocument
// );

// router.delete('/:id/legal-documents/:documentId',
//   authenticateToken,
//   legalController.deleteLegalDocument
// );

// // Property verification routes
// router.post('/:id/verify',
//   authenticateToken,
//   propertyController.verifyProperty
// );

// router.get('/user/:userId', 
//   authenticateToken,
//   propertyController.getUserProperties
// );

// // Property analytics
// router.get('/:id/analytics',
//   authenticateToken,
//   propertyController.getPropertyAnalytics
// );

export default router;