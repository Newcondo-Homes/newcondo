// backend/shared/src/index.ts

// // Middleware exports
// export { authMiddleware, verifyToken, requireAuth } from './middleware/auth';
// export { corsMiddleware } from './middleware/cors';
// export { errorHandler, AppError, createError } from './middleware/errorHandler';
// export { validateRequest, validateBody, validateParams, validateQuery } from './middleware/validation';
// export { rateLimiter, createRateLimiter } from './middleware/rateLimiter';
// export { requestLogger, createLogger } from './middleware/logger';

// // Utility exports
// export { 
//   generateToken, 
//   verifyJwtToken, 
//   decodeToken, 
//   refreshToken,
//   createAccessToken,
//   createRefreshToken 
// } from './utils/jwt';

// export { 
//   hashPassword, 
//   comparePassword, 
//   generateSalt,
//   validatePasswordStrength 
// } from './utils/bcrypt';

// export { 
//   sendEmail, 
//   sendVerificationEmail, 
//   sendPasswordResetEmail,
//   sendWelcomeEmail,
//   EmailService 
// } from './utils/email';

// export { 
//   sendSMS, 
//   sendOTPSMS, 
//   sendNotificationSMS,
//   SMSService 
// } from './utils/sms';

// export { 
//   uploadFile, 
//   uploadImage, 
//   deleteFile,
//   generateSignedUrl,
//   UploadService 
// } from './utils/upload';

// export { 
//   generateOTP, 
//   verifyOTP, 
//   createOTPRecord,
//   cleanupExpiredOTPs,
//   OTPService 
// } from './utils/otp';

// export { 
//   calculateDistance,
//   isPointInPolygon,
//   getBoundingBox,
//   validateCoordinates,
//   formatCoordinates,
//   GeolocationService 
// } from './utils/geolocation';

// export { 
//   generatePropertyFingerprint,
//   detectDuplicateProperties,
//   calculateSimilarityScore,
//   PropertyFingerprintService 
// } from './utils/propertyFingerprint';

// export { 
//   successResponse, 
//   errorResponse, 
//   paginatedResponse,
//   validationErrorResponse,
//   notFoundResponse,
//   unauthorizedResponse,
//   forbiddenResponse 
// } from './utils/response';

// // Configuration exports
// export { 
//   connectDatabase, 
//   disconnectDatabase, 
//   getDatabaseConnection,
//   runMigrations 
// } from './config/database';

// export { 
//   connectRedis, 
//   disconnectRedis, 
//   getRedisClient,
//   RedisService 
// } from './config/redis';

// export { 
//   initializeMapsAPI,
//   geocodeAddress,
//   reverseGeocode,
//   MapsService 
// } from './config/maps';

// export { 
//   validateEnv, 
//   getEnvConfig,
//   isDevelopment,
//   isProduction,
//   isTest 
// } from './config/environment';

// // Type exports
// export type { 
//   ApiResponse, 
//   PaginatedResponse, 
//   ErrorResponse,
//   ValidationError,
//   RequestWithUser,
//   JWTPayload 
// } from './types/common';

// export type { 
//   LoginRequest, 
//   RegisterRequest, 
//   TokenResponse,
//   UserSession,
//   AuthUser 
// } from './types/auth';

// export type { 
//   Coordinates, 
//   BoundingBox, 
//   GeolocationData,
//   LocationQuery 
// } from './types/geolocation';

// export type { 
//   ApiResponseType,
//   HttpStatusCode,
//   ServiceResponse 
// } from './types/api';

// // Constants exports
// export { 
//   ErrorCodes, 
//   ErrorMessages, 
//   HTTP_STATUS 
// } from './constants/errors';

// export { 
//   UserRoles, 
//   AdminRoles, 
//   ROLE_PERMISSIONS 
// } from './constants/roles';

// export { 
//   PropertyStatus, 
//   PaymentStatus, 
//   VerificationStatus,
//   STATUSES 
// } from './constants/status';

// export { 
//   BOUNDARY_CONSTANTS,
//   MAX_BOUNDARY_POINTS,
//   MIN_BOUNDARY_POINTS,
//   DUPLICATE_DETECTION_THRESHOLD 
// } from './constants/boundaries';

// // Service classes for dependency injection
// export class SharedServices {
//   static emailService: EmailService;
//   static smsService: SMSService;
//   static uploadService: UploadService;
//   static otpService: OTPService;
//   static geolocationService: GeolocationService;
//   static propertyFingerprintService: PropertyFingerprintService;
//   static redisService: RedisService;
//   static mapsService: MapsService;

//   static initialize(config: {
//     email?: any;
//     sms?: any;
//     upload?: any;
//     redis?: any;
//     maps?: any;
//   }) {
//     if (config.email) {
//       this.emailService = new EmailService(config.email);
//     }
//     if (config.sms) {
//       this.smsService = new SMSService(config.sms);
//     }
//     if (config.upload) {
//       this.uploadService = new UploadService(config.upload);
//     }
//     if (config.redis) {
//       this.redisService = new RedisService(config.redis);
//     }
//     if (config.maps) {
//       this.mapsService = new MapsService(config.maps);
//     }
    
//     this.otpService = new OTPService();
//     this.geolocationService = new GeolocationService();
//     this.propertyFingerprintService = new PropertyFingerprintService();
//   }
// }

// // Common validation schemas (if using Zod)
// export { commonValidationSchemas } from './validations/common';

// // Database helpers
// export { 
//   createTransaction,
//   withTransaction,
//   rollbackTransaction 
// } from './utils/database';

// // Cache helpers
// export { 
//   cacheGet,
//   cacheSet,
//   cacheDel,
//   cacheFlush,
//   createCacheKey 
// } from './utils/cache';

// // Queue helpers (if using Bull/BullMQ)
// export { 
//   createQueue,
//   addJob,
//   processQueue,
//   QueueService 
// } from './utils/queue';

// // Health check utilities
// export { 
//   healthCheck,
//   databaseHealthCheck,
//   redisHealthCheck,
//   serviceHealthCheck 
// } from './utils/health';

// Version and build info
export const SHARED_VERSION = '1.0.0';
export const BUILD_TIME = new Date().toISOString();