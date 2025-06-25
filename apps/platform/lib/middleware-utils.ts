// apps/platform/lib/middleware-utils.ts
import { NextRequest, NextResponse } from "next/server";
import type { Session } from "@newcondo/db";

/**
 * User roles enum for type safety
 */
export enum UserRole {
  OWNER = 'OWNER',
  AGENT = 'AGENT',
  RENTER = 'RENTER',
  ADMIN = 'ADMIN',
}

/**
 * Verification status enum
 */
export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

/**
 * Extended session type with our custom user properties
 */
export interface ExtendedSession extends Session {
  user: {
    id: string;
    email: string;
    name?: string;
    role: UserRole;
    verificationStatus: VerificationStatus;
    image?: string;
  };
}

/**
 * Security headers to be added to responses
 */
export const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
} as const;

/**
 * Routes that require specific verification status
 */
export const VERIFICATION_REQUIRED_ROUTES = [
  '/properties/create',
  '/properties/my-listings',
  '/marking-jobs/create',
  '/virtual-accounts',
  '/payments/rent',
] as const;

/**
 * Routes that require premium status (for future implementation)
 */
export const PREMIUM_REQUIRED_ROUTES = [
  '/premium',
  '/analytics/advanced',
] as const;

/**
 * Check if a route requires verification
 * @param pathname - The pathname to check
 * @returns boolean
 */
export function requiresVerification(pathname: string): boolean {
  return VERIFICATION_REQUIRED_ROUTES.some(route => 
    pathname.startsWith(route) || pathname === route
  );
}

/**
 * Check if a route requires premium status
 * @param pathname - The pathname to check
 * @returns boolean
 */
export function requiresPremium(pathname: string): boolean {
  return PREMIUM_REQUIRED_ROUTES.some(route => 
    pathname.startsWith(route) || pathname === route
  );
}

/**
 * Check if user has required role for route
 * @param pathname - The pathname to check
 * @param userRole - The user's role
 * @returns boolean
 */
export function hasRequiredRole(pathname: string, userRole: string): boolean {
  // Admin routes
  if (pathname.startsWith('/admin')) {
    return userRole === UserRole.ADMIN;
  }

  // Agent-specific routes
  if (pathname.includes('/marking-jobs/queue') || pathname.startsWith('/agent')) {
    return [UserRole.AGENT, UserRole.ADMIN].includes(userRole as UserRole);
  }

  // Owner-specific routes
  if (
    pathname.startsWith('/properties/create') ||
    pathname.startsWith('/properties/my-listings') ||
    pathname.startsWith('/owner')
  ) {
    return [UserRole.OWNER, UserRole.ADMIN].includes(userRole as UserRole);
  }

  // Boundary-related routes (owners and agents)
  if (pathname.includes('/boundaries') || pathname.includes('/boundary-mapping')) {
    return [UserRole.OWNER, UserRole.AGENT, UserRole.ADMIN].includes(userRole as UserRole);
  }

  return true; // Default allow for other routes
}

/**
 * Create a redirect response with callback URL
 * @param url - The URL to redirect to
 * @param request - The original request
 * @param callbackUrl - Optional callback URL
 * @returns NextResponse
 */
export function createRedirectResponse(
  url: string,
  request: NextRequest,
  callbackUrl?: string
): NextResponse {
  const redirectUrl = new URL(url, request.url);
  
  if (callbackUrl) {
    redirectUrl.searchParams.set('callbackUrl', callbackUrl);
  }
  
  return NextResponse.redirect(redirectUrl);
}

/**
 * Create a response with security headers
 * @param response - The response to add headers to
 * @returns NextResponse
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

/**
 * Get callback URL from current request
 * @param request - The NextRequest object
 * @returns string
 */
export function getCallbackUrl(request: NextRequest): string {
  let callbackUrl = request.nextUrl.pathname;
  
  if (request.nextUrl.search) {
    callbackUrl += request.nextUrl.search;
  }
  
  return callbackUrl;
}

/**
 * Check if the request is for a static asset
 * @param pathname - The pathname to check
 * @returns boolean
 */
export function isStaticAsset(pathname: string): boolean {
  const staticExtensions = [
    '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', 
    '.ico', '.woff', '.woff2', '.ttf', '.eot', '.webp', '.avif'
  ];
  
  return staticExtensions.some(ext => pathname.endsWith(ext));
}

/**
 * Check if the request is for an API route
 * @param pathname - The pathname to check
 * @returns boolean
 */
export function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/');
}

/**
 * Get user-friendly error message for unauthorized access
 * @param pathname - The pathname being accessed
 * @param userRole - The user's role
 * @returns string
 */
export function getUnauthorizedMessage(pathname: string, userRole?: string): string {
  if (pathname.startsWith('/admin')) {
    return 'This area is restricted to administrators only.';
  }
  
  if (pathname.includes('/marking-jobs/queue')) {
    return 'This feature is only available to property marking agents.';
  }
  
  if (pathname.startsWith('/properties/create') || pathname.startsWith('/properties/my-listings')) {
    return 'This feature is only available to property owners.';
  }
  
  if (requiresVerification(pathname)) {
    return 'You need to complete account verification to access this feature.';
  }
  
  console.error(userRole, "does not have permission to this page")
  return 'You do not have permission to access this page.' ;
}

/**
 * Rate limiting configuration for different route types
 */
export const RATE_LIMITS = {
  auth: { requests: 5, window: '15m' },
  api: { requests: 100, window: '15m' },
  upload: { requests: 10, window: '15m' },
  search: { requests: 50, window: '15m' },
} as const;

/**
 * Check if route needs rate limiting
 * @param pathname - The pathname to check
 * @returns keyof typeof RATE_LIMITS | null
 */
export function getRateLimitType(pathname: string): keyof typeof RATE_LIMITS | null {
  if (pathname.startsWith('/api/auth/')) return 'auth';
  if (pathname.startsWith('/api/upload/')) return 'upload';
  if (pathname.startsWith('/api/properties/search')) return 'search';
  if (pathname.startsWith('/api/')) return 'api';
  
  return null;
}

/**
 * Extract IP address from request
 * @param request - The NextRequest object
 * @returns string
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

/**
 * Log middleware events for debugging
 * @param event - The event type
 * @param data - Additional data to log
 */
export function logMiddlewareEvent(event: string, data: Record<string, unknown>): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Middleware] ${event}:`, data);
  }
}