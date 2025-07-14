// backend/property-service/src/routes/duplicates.ts
import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/boundaryValidation';
import { authMiddleware } from '../../../shared/src/middleware/auth';
import { DuplicateController } from '../controllers/duplicateController';

const router = Router();
const duplicateController = new DuplicateController();

// Get all duplicate reports (admin only)
router.get(
  '/',
  authMiddleware,
  [
    query('status')
      .optional()
      .isIn(['PENDING', 'CONFIRMED_DUPLICATE', 'NOT_DUPLICATE', 'RESOLVED'])
      .withMessage('Invalid status'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
  ],
  validateRequest,
  duplicateController.getAllDuplicates.bind(duplicateController)
);

// Get duplicate report by ID
router.get(
  '/:id',
  authMiddleware,
  [
    param('id')
      .isString()
      .notEmpty()
      .withMessage('Duplicate report ID is required'),
  ],
  validateRequest,
  duplicateController.getDuplicateById.bind(duplicateController)
);

// Report a property as duplicate
router.post(
  '/report',
  authMiddleware,
  [
    body('originalPropertyId')
      .isString()
      .notEmpty()
      .withMessage('Original property ID is required'),
    body('duplicatePropertyId')
      .isString()
      .notEmpty()
      .withMessage('Duplicate property ID is required'),
    body('reason')
      .optional()
      .isString()
      .isLength({ min: 10, max: 500 })
      .withMessage('Reason must be between 10 and 500 characters'),
  ],
  validateRequest,
  duplicateController.reportDuplicate.bind(duplicateController)
);

// Update duplicate report status (admin only)
router.patch(
  '/:id/status',
  authMiddleware,
  [
    param('id')
      .isString()
      .notEmpty()
      .withMessage('Duplicate report ID is required'),
    body('status')
      .isIn(['CONFIRMED_DUPLICATE', 'NOT_DUPLICATE', 'RESOLVED'])
      .withMessage('Invalid status'),
    body('resolution')
      .optional()
      .isString()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Resolution must be between 10 and 1000 characters'),
  ],
  validateRequest,
  duplicateController.updateDuplicateStatus.bind(duplicateController)
);

// Get duplicates for a specific property
router.get(
  '/property/:propertyId',
  authMiddleware,
  [
    param('propertyId')
      .isString()
      .notEmpty()
      .withMessage('Property ID is required'),
  ],
  validateRequest,
  duplicateController.getDuplicatesForProperty.bind(duplicateController)
);

// Check if property is a duplicate before listing
router.post(
  '/check',
  authMiddleware,
  [
    body('coordinates')
      .isArray()
      .withMessage('Coordinates must be an array')
      .custom((value) => {
        if (!Array.isArray(value) || value.length < 3) {
          throw new Error('Coordinates must have at least 3 points');
        }
        return value.every(coord => 
          typeof coord === 'object' && 
          typeof coord.lat === 'number' && 
          typeof coord.lng === 'number'
        );
      })
      .withMessage('Each coordinate must have lat and lng properties'),
    body('address')
      .isString()
      .notEmpty()
      .withMessage('Address is required'),
    body('city')
      .isString()
      .notEmpty()
      .withMessage('City is required'),
    body('state')
      .isString()
      .notEmpty()
      .withMessage('State is required'),
  ],
  validateRequest,
  duplicateController.checkForDuplicates.bind(duplicateController)
);

export default router;