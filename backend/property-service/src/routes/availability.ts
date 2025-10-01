// backend/property-service/src/routes/availability.ts

import express from 'express';
import {
  getPropertyAvailability,
  updatePropertyAvailability,
  checkMultiplePropertiesAvailability,
  getUnitAvailability,
  updateUnitAvailability,
  getAvailabilityCalendar,
  subscribeToAvailabilityUpdates
} from '../controllers/availabilityController';
import { authenticateToken } from '../../../shared/src/middleware/auth';
import { validateRequest } from '../../../shared/src/middleware/validation';
import { body, param, query } from 'express-validator';

const router = express.Router();

/**
 * @route   GET /api/properties/:propertyId/availability
 * @desc    Get real-time availability status for a property
 * @access  Public
 */
router.get(
  '/:propertyId/availability',
  [
    param('propertyId').isString().notEmpty().withMessage('Property ID is required')
  ],
  validateRequest,
  getPropertyAvailability
);

/**
 * @route   PUT /api/properties/:propertyId/availability
 * @desc    Update property availability status
 * @access  Private (Owner/Agent)
 */
router.put(
  '/:propertyId/availability',
  authenticateToken,
  [
    param('propertyId').isString().notEmpty().withMessage('Property ID is required'),
    body('isAvailable').isBoolean().withMessage('isAvailable must be a boolean'),
    body('availableFrom').optional().isISO8601().withMessage('availableFrom must be a valid date'),
    body('reason').optional().isString().withMessage('Reason must be a string')
  ],
  validateRequest,
  updatePropertyAvailability
);

/**
 * @route   POST /api/properties/availability/check-multiple
 * @desc    Check availability for multiple properties at once
 * @access  Public
 */
router.post(
  '/availability/check-multiple',
  [
    body('propertyIds').isArray({ min: 1, max: 50 }).withMessage('propertyIds must be an array of 1-50 IDs'),
    body('propertyIds.*').isString().withMessage('Each property ID must be a string')
  ],
  validateRequest,
  checkMultiplePropertiesAvailability
);

/**
 * @route   GET /api/properties/:propertyId/units/:unitId/availability
 * @desc    Get availability status for a specific unit
 * @access  Public
 */
router.get(
  '/:propertyId/units/:unitId/availability',
  [
    param('propertyId').isString().notEmpty().withMessage('Property ID is required'),
    param('unitId').isString().notEmpty().withMessage('Unit ID is required')
  ],
  validateRequest,
  getUnitAvailability
);

/**
 * @route   PUT /api/properties/:propertyId/units/:unitId/availability
 * @desc    Update unit availability status
 * @access  Private (Owner/Agent)
 */
router.put(
  '/:propertyId/units/:unitId/availability',
  authenticateToken,
  [
    param('propertyId').isString().notEmpty().withMessage('Property ID is required'),
    param('unitId').isString().notEmpty().withMessage('Unit ID is required'),
    body('isAvailable').isBoolean().withMessage('isAvailable must be a boolean'),
    body('status').optional().isIn(['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'RESERVED']).withMessage('Invalid status'),
    body('availableFrom').optional().isISO8601().withMessage('availableFrom must be a valid date'),
    body('reason').optional().isString().withMessage('Reason must be a string')
  ],
  validateRequest,
  updateUnitAvailability
);

/**
 * @route   GET /api/properties/:propertyId/availability/calendar
 * @desc    Get availability calendar for a property (next 90 days)
 * @access  Public
 */
router.get(
  '/:propertyId/availability/calendar',
  [
    param('propertyId').isString().notEmpty().withMessage('Property ID is required'),
    query('months').optional().isInt({ min: 1, max: 12 }).withMessage('Months must be between 1-12'),
    query('includeUnits').optional().isBoolean().withMessage('includeUnits must be a boolean')
  ],
  validateRequest,
  getAvailabilityCalendar
);

/**
 * @route   POST /api/properties/:propertyId/availability/subscribe
 * @desc    Subscribe to real-time availability updates (WebSocket endpoint placeholder)
 * @access  Public
 */
router.post(
  '/:propertyId/availability/subscribe',
  [
    param('propertyId').isString().notEmpty().withMessage('Property ID is required'),
    body('email').optional().isEmail().withMessage('Invalid email'),
    body('phone').optional().isMobilePhone('any').withMessage('Invalid phone number')
  ],
  validateRequest,
  subscribeToAvailabilityUpdates
);

export default router;