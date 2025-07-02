import { Request, Response, NextFunction } from 'express';
import path from 'path';

/**
 * Service importer utilities for combined-app
 * This module handles importing controllers and services from individual service modules
 */

// Service path configurations
const SERVICE_PATHS = {
  auth: path.join(__dirname, '../../auth-service/src'),
  property: path.join(__dirname, '../../property-service/src'),
  payment: path.join(__dirname, '../../payment-service/src'),
  booking: path.join(__dirname, '../../booking-service/src'),
  marking: path.join(__dirname, '../../marking-service/src'),
  admin: path.join(__dirname, '../../admin-service/src'),
  referral: path.join(__dirname, '../../referral-service/src'),
  notification: path.join(__dirname, '../../notification-service/src'),
  analytics: path.join(__dirname, '../../analytics-service/src'),
  shared: path.join(__dirname, '../../shared/src')
};

/**
 * Dynamic service controller importer
 * @param serviceName - Name of the service
 * @param controllerName - Name of the controller file
 * @returns Imported controller
 */
export const importController = async (serviceName: keyof typeof SERVICE_PATHS, controllerName: string) => {
  try {
    const servicePath = SERVICE_PATHS[serviceName];
    const controllerPath = path.join(servicePath, 'controllers', `${controllerName}.ts`);
    
    // Dynamic import with error handling
    const controller = await import(controllerPath);
    return controller;
  } catch (error) {
    console.error(`Failed to import controller ${controllerName} from ${serviceName}:`, error);
    throw new Error(`Controller ${controllerName} not found in ${serviceName} service`);
  }
};

/**
 * Dynamic service importer
 * @param serviceName - Name of the service
 * @param servicePath - Path to the service file
 * @returns Imported service
 */
export const importService = async (serviceName: keyof typeof SERVICE_PATHS, servicePath: string) => {
  try {
    const baseServicePath = SERVICE_PATHS[serviceName];
    const fullServicePath = path.join(baseServicePath, 'services', `${servicePath}.ts`);
    
    const service = await import(fullServicePath);
    return service;
  } catch (error) {
    console.error(`Failed to import service ${servicePath} from ${serviceName}:`, error);
    throw new Error(`Service ${servicePath} not found in ${serviceName} service`);
  }
};

/**
 * Import middleware from services
 * @param serviceName - Name of the service
 * @param middlewareName - Name of the middleware file
 * @returns Imported middleware
 */
export const importMiddleware = async (serviceName: keyof typeof SERVICE_PATHS, middlewareName: string) => {
  try {
    const servicePath = SERVICE_PATHS[serviceName];
    const middlewarePath = path.join(servicePath, 'middleware', `${middlewareName}.ts`);
    
    const middleware = await import(middlewarePath);
    return middleware;
  } catch (error) {
    console.error(`Failed to import middleware ${middlewareName} from ${serviceName}:`, error);
    throw new Error(`Middleware ${middlewareName} not found in ${serviceName} service`);
  }
};

/**
 * Import types from services
 * @param serviceName - Name of the service
 * @param typeName - Name of the type file
 * @returns Imported types
 */
export const importTypes = async (serviceName: keyof typeof SERVICE_PATHS, typeName: string) => {
  try {
    const servicePath = SERVICE_PATHS[serviceName];
    const typePath = path.join(servicePath, 'types', `${typeName}.ts`);
    
    const types = await import(typePath);
    return types;
  } catch (error) {
    console.error(`Failed to import types ${typeName} from ${serviceName}:`, error);
    throw new Error(`Types ${typeName} not found in ${serviceName} service`);
  }
};

/**
 * Import shared utilities
 * @param utilityName - Name of the utility file
 * @returns Imported utility
 */
export const importSharedUtility = async (utilityName: string) => {
  try {
    const sharedPath = SERVICE_PATHS.shared;
    const utilityPath = path.join(sharedPath, 'utils', `${utilityName}.ts`);
    
    const utility = await import(utilityPath);
    return utility;
  } catch (error) {
    console.error(`Failed to import shared utility ${utilityName}:`, error);
    throw new Error(`Shared utility ${utilityName} not found`);
  }
};

/**
 * Import shared middleware
 * @param middlewareName - Name of the middleware file
 * @returns Imported middleware
 */
export const importSharedMiddleware = async (middlewareName: string) => {
  try {
    const sharedPath = SERVICE_PATHS.shared;
    const middlewarePath = path.join(sharedPath, 'middleware', `${middlewareName}.ts`);
    
    const middleware = await import(middlewarePath);
    return middleware;
  } catch (error) {
    console.error(`Failed to import shared middleware ${middlewareName}:`, error);
    throw new Error(`Shared middleware ${middlewareName} not found`);
  }
};

/**
 * Wrapper for handling async controller methods
 * @param fn - Async controller function
 * @returns Express middleware function
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Service availability checker
 * @param serviceName - Name of the service to check
 * @returns Boolean indicating if service is available
 */
export const isServiceAvailable = (serviceName: keyof typeof SERVICE_PATHS): boolean => {
  try {
    const servicePath = SERVICE_PATHS[serviceName];
    return require('fs').existsSync(servicePath);
  } catch (error) {
    console.error(`Service availability check failed for ${serviceName}:`, error);
    return false;
  }
};

/**
 * Get all available services
 * @returns Array of available service names
 */
export const getAvailableServices = (): string[] => {
  const availableServices: string[] = [];
  
  Object.keys(SERVICE_PATHS).forEach((serviceName) => {
    if (isServiceAvailable(serviceName as keyof typeof SERVICE_PATHS)) {
      availableServices.push(serviceName);
    }
  });
  
  return availableServices;
};

export default {
  importController,
  importService,
  importMiddleware,
  importTypes,
  importSharedUtility,
  importSharedMiddleware,
  asyncHandler,
  isServiceAvailable,
  getAvailableServices,
  SERVICE_PATHS
};