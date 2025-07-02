import { z } from 'zod';

// Service configuration schema
const serviceConfigSchema = z.object({
  auth: z.object({
    enabled: z.boolean().default(true),
    prefix: z.string().default('/api/auth'),
  }),
  property: z.object({
    enabled: z.boolean().default(true),
    prefix: z.string().default('/api/properties'),
  }),
  payment: z.object({
    enabled: z.boolean().default(true),
    prefix: z.string().default('/api/payments'),
  }),
  booking: z.object({
    enabled: z.boolean().default(true),
    prefix: z.string().default('/api/bookings'),
  }),
  marking: z.object({
    enabled: z.boolean().default(true),
    prefix: z.string().default('/api/marking'),
  }),
  admin: z.object({
    enabled: z.boolean().default(true),
    prefix: z.string().default('/api/admin'),
  }),
  referral: z.object({
    enabled: z.boolean().default(true),
    prefix: z.string().default('/api/referrals'),
  }),
  notification: z.object({
    enabled: z.boolean().default(true),
    prefix: z.string().default('/api/notifications'),
  }),
  analytics: z.object({
    enabled: z.boolean().default(true),
    prefix: z.string().default('/api/analytics'),
  }),
});

export type ServiceConfig = z.infer<typeof serviceConfigSchema>;

export const serviceConfig: ServiceConfig = {
  auth: {
    enabled: true,
    prefix: '/api/auth',
  },
  property: {
    enabled: true,
    prefix: '/api/properties',
  },
  payment: {
    enabled: true,
    prefix: '/api/payments',
  },
  booking: {
    enabled: true,
    prefix: '/api/bookings',
  },
  marking: {
    enabled: true,
    prefix: '/api/marking',
  },
  admin: {
    enabled: true,
    prefix: '/api/admin',
  },
  referral: {
    enabled: true,
    prefix: '/api/referrals',
  },
  notification: {
    enabled: true,
    prefix: '/api/notifications',
  },
  analytics: {
    enabled: true,
    prefix: '/api/analytics',
  },
};

// Service health check endpoints
export const serviceHealthChecks = {
  auth: '/health',
  property: '/health',
  payment: '/health',
  booking: '/health',
  marking: '/health',
  admin: '/health',
  referral: '/health',
  notification: '/health',
  analytics: '/health',
};

// Service priorities for initialization
export const serviceInitializationOrder = [
  'auth',
  'property',
  'payment',
  'booking',
  'marking',
  'admin',
  'referral',
  'notification',
  'analytics',
] as const;

export type ServiceName = keyof ServiceConfig;

export const isServiceEnabled = (serviceName: ServiceName): boolean => {
  return serviceConfig[serviceName].enabled;
};

export const getServicePrefix = (serviceName: ServiceName): string => {
  return serviceConfig[serviceName].prefix;
};

// Service dependencies
export const serviceDependencies: Record<ServiceName, ServiceName[]> = {
  auth: [], // No dependencies
  property: ['auth'],
  payment: ['auth', 'property'],
  booking: ['auth', 'property', 'payment'],
  marking: ['auth', 'property'],
  admin: ['auth'],
  referral: ['auth'],
  notification: ['auth'],
  analytics: ['auth', 'property', 'payment', 'booking'],
};

export const validateServiceDependencies = (): boolean => {
  for (const [serviceName, dependencies] of Object.entries(serviceDependencies)) {
    const service = serviceName as ServiceName;
    
    if (!isServiceEnabled(service)) {
      continue;
    }

    for (const dependency of dependencies) {
      if (!isServiceEnabled(dependency)) {
        console.warn(`⚠️  Service ${service} depends on ${dependency}, but ${dependency} is disabled`);
        return false;
      }
    }
  }
  
  return true;
};