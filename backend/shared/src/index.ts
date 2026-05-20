// backend/shared/src/index.ts

// Middleware exports
//TODO: see what you need from middleware that can be shared all accross and import from here
export {
  errorHandler,
  AppError,
  authMiddleware,
  requestLogger,
  corsMiddleware,
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  logger,
  validateRequest,
  authenticateToken,
  auth
} from './middleware/index';

// Config exports
export {
  //   connectRedis, 
  //   disconnectRedis, 
  //   getRedisClient,
  //   initializeMapsAPI,
  //   geocodeAddress,
  //   reverseGeocode,
  redis,
  flutterwaveConfig
} from './config/index';

// Type exports
export type * from './types/index';

// Constants exports
export * from './constants/index';

// Utils exports
export * from './utils/index';

// i18n exports
export * from './i18n/index';

// Version info
export const SHARED_VERSION = '1.0.0';
export const BUILD_TIME = new Date().toISOString();