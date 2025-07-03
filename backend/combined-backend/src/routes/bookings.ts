// backend/combined-app/src/routes/bookings.ts
import { Router } from 'express';
// import { bookingController } from '../../booking-service/src/controllers/bookingController';
// import { availabilityController } from '../../booking-service/src/controllers/availabilityController';
// import { lockingController } from '../../booking-service/src/controllers/lockingController';

// // Import middleware from booking service
// import { bookingValidation } from '../../booking-service/src/middleware/bookingValidation';
// import { lockingValidation } from '../../booking-service/src/middleware/lockingValidation';

// // Import shared middleware
// import { authenticateToken } from '../../shared/src/middleware/auth';
// import { validateRequest } from '../../shared/src/middleware/validation';

const router = Router();

// Booking CRUD routes
// router.get('/',
//   authenticateToken,
//   bookingController.getUserBookings
// );

// router.get('/:bookingId',
//   authenticateToken,
//   bookingController.getBookingById
// );

// router.post('/',
//   authenticateToken,
//   bookingValidation.validateCreateBooking,
//   validateRequest,
//   bookingController.createBooking
// );

// router.put('/:bookingId',
//   authenticateToken,
//   bookingValidation.validateUpdateBooking,
//   validateRequest,
//   bookingController.updateBooking
// );

// router.delete('/:bookingId',
//   authenticateToken,
//   bookingController.cancelBooking
// );

// // Booking status management
// router.post('/:bookingId/confirm',
//   authenticateToken,
//   bookingController.confirmBooking
// );

// router.post('/:bookingId/reject',
//   authenticateToken,
//   bookingValidation.validateBookingRejection,
//   validateRequest,
//   bookingController.rejectBooking
// );

// router.post('/:bookingId/complete',
//   authenticateToken,
//   bookingController.completeBooking
// );

// // Property availability routes
// router.get('/properties/:propertyId/availability',
//   availabilityController.getPropertyAvailability
// );

// router.post('/properties/:propertyId/availability',
//   authenticateToken,
//   bookingValidation.validateAvailabilityUpdate,
//   validateRequest,
//   availabilityController.updatePropertyAvailability
// );

// router.get('/properties/:propertyId/calendar',
//   availabilityController.getPropertyCalendar
// );

// // Property locking routes (prevent double bookings)
// router.post('/properties/:propertyId/lock',
//   authenticateToken,
//   lockingValidation.validatePropertyLock,
//   validateRequest,
//   lockingController.lockProperty
// );

// router.post('/properties/:propertyId/unlock',
//   authenticateToken,
//   lockingController.unlockProperty
// );

// router.get('/properties/:propertyId/lock-status',
//   authenticateToken,
//   lockingController.getPropertyLockStatus
// );

// // Booking requests (for property owners)
// router.get('/requests',
//   authenticateToken,
//   bookingController.getBookingRequests
// );

// router.get('/requests/pending',
//   authenticateToken,
//   bookingController.getPendingBookingRequests
// );

// router.post('/requests/:requestId/approve',
//   authenticateToken,
//   bookingController.approveBookingRequest
// );

// router.post('/requests/:requestId/reject',
//   authenticateToken,
//   bookingValidation.validateBookingRejection,
//   validateRequest,
//   bookingController.rejectBookingRequest
// );

// // Booking history and analytics
// router.get('/history',
//   authenticateToken,
//   bookingController.getBookingHistory
// );

// router.get('/analytics/summary',
//   authenticateToken,
//   bookingController.getBookingAnalytics
// );

// // Property owner specific routes
// router.get('/owner/properties/:propertyId/bookings',
//   authenticateToken,
//   bookingController.getPropertyBookings
// );

// router.get('/owner/revenue',
//   authenticateToken,
//   bookingController.getOwnerRevenue
// );

// // Booking extensions and modifications
// router.post('/:bookingId/extend',
//   authenticateToken,
//   bookingValidation.validateBookingExtension,
//   validateRequest,
//   bookingController.extendBooking
// );

// router.post('/:bookingId/modify',
//   authenticateToken,
//   bookingValidation.validateBookingModification,
//   validateRequest,
//   bookingController.modifyBooking
// );

// // Check-in and check-out
// router.post('/:bookingId/checkin',
//   authenticateToken,
//   bookingController.checkIn
// );

// router.post('/:bookingId/checkout',
//   authenticateToken,
//   bookingController.checkOut
// );

// // Booking reviews and ratings
// router.post('/:bookingId/review',
//   authenticateToken,
//   bookingValidation.validateBookingReview,
//   validateRequest,
//   bookingController.submitBookingReview
// );

// router.get('/:bookingId/review',
//   authenticateToken,
//   bookingController.getBookingReview
// );

export default router;