// apps/platform/lib/routes.ts

/**
 * Array of routes that are accessible to the public
 * These routes do not require authentication
 * @type {string[]}
 */
export const publicRoutes = [
  "/",
  "/about",
  "/login",
  "/register",
  "/signup",
  "/verify-otp",
  "/onboarding",
  "/contact",
  "/privacy",
  "/terms",
  "/help",
  "/properties", // Public property browsing
  "/properties/*", // Public property details (but not actions)
  "/api/properties/search", // Public property search
  "/api/webhooks/*", // Payment webhooks
  "/unauthorized", // Unauthorized access page
  "/email-verification",
  "/reset-password",
  "/password-reset-email-redirect",
];

/**
 * Array of routes that are used for authentication
 * These routes redirect logged-in users to dashboard
 * @type {string[]}
 */
export const authRoutes = [
  "/login",
  "/register",
  "/forgot-password",
  "/verify-otp",
];

/**
 * Array of routes that require authentication
 * These routes require users to be logged in
 * @type {string[]}
 */
export const protectedRoutes = [
  "/dashboard",
  "/profile",
  "/profile/settings",
  "/profile/verification",
  "/properties/create",
  "/properties/my-listings",
  "/properties/*/rent",
  "/properties/*/boundaries",
  "/properties/create/boundary-mapping",
  "/properties/my-listings/*/manage-boundaries",
  "/payments",
  "/payments/rent",
  "/payments/marking-service",
  "/payments/success",
  "/referrals",
  "/virtual-accounts",
  "/marking-jobs",
  "/marking-jobs/create",
  "/marking-jobs/queue",
  "/test/backend"
];

/**
 * Array of routes that are only accessible by ADMIN users
 * @type {string[]}
 */
export const adminRoutes = [
  "/admin",
  "/admin/dashboard",
  "/admin/users",
  "/admin/properties",
  "/admin/payments",
  "/admin/verifications",
  "/admin/analytics",
  "/admin/boundary-disputes",
  "/admin/duplicates",
  "/admin/marking-oversight",
  "/admin/support",
];

/**
 * Array of routes that are accessible by AGENT users (and ADMIN)
 * @type {string[]}
 */
export const agentRoutes = [
  "/marking-jobs/queue",
  "/marking-jobs/*/complete",
  "/agent/dashboard",
  "/agent/jobs",
  "/agent/earnings",
];

/**
 * Array of routes that are accessible by OWNER users (and ADMIN)
 * @type {string[]}
 */
export const ownerRoutes = [
  "/properties/create",
  "/properties/my-listings",
  "/properties/*/manage-boundaries",
  "/marking-jobs/create",
  "/virtual-accounts/create",
  "/owner/dashboard",
  "/owner/properties",
  "/owner/earnings",
];

/**
 * Routes that require verified users only
 * @type {string[]}
 */
export const verifiedOnlyRoutes = [
  "/properties/create",
  "/properties/my-listings",
  "/marking-jobs/create",
  "/virtual-accounts",
  "/payments/rent",
];

/**
 * The prefix for authentication API routes
 * Routes starting with this prefix are handled by NextAuth
 * @type {string}
 */
export const apiAuthPrefix = "/api/auth";

/**
 * Default redirect path after successful login
 * @type {string}
 */
export const DEFAULT_LOGIN_REDIRECT = "/dashboard";

/**
 * Default redirect path after logout
 * @type {string}
 */
export const DEFAULT_LOGOUT_REDIRECT = "/";

/**
 * Route permissions mapping
 * Defines which roles can access which route patterns
 */
export const routePermissions = {
  // Public routes - no authentication required
  public: [
    "/",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/help",
    "/properties",
    "/unauthorized",
  ],
  
  // Authenticated routes - any logged-in user
  authenticated: [
    "/dashboard",
    "/profile",
    "/referrals",
    "/payments/success",
  ],
  
  // Verified users only
  verified: [
    "/properties/create",
    "/properties/my-listings",
    "/virtual-accounts",
    "/marking-jobs/create",
  ],
  
  // Role-specific routes
  admin: [
    "/admin",
  ],
  
  agent: [
    "/marking-jobs/queue",
    "/agent",
  ],
  
  owner: [
    "/properties/create",
    "/properties/my-listings",
    "/owner",
  ],
  
  // Multi-role routes
  "owner,agent,admin": [
    "/properties/*/boundaries",
    "/properties/create/boundary-mapping",
  ],
  
  "agent,admin": [
    "/marking-jobs/queue",
    "/marking-jobs/*/complete",
  ],
};

/**
 * Helper function to check if a route is public
 * @param pathname - The pathname to check
 * @returns boolean
 */
export function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => {
    if (route.endsWith('*')) {
      return pathname.startsWith(route.slice(0, -1));
    }
    return route === pathname;
  });
}

/**
 * Helper function to check if a route is an auth route
 * @param pathname - The pathname to check
 * @returns boolean
 */
export function isAuthRoute(pathname: string): boolean {
  return authRoutes.includes(pathname);
}

/**
 * Helper function to check if a user has permission to access a route
 * @param pathname - The pathname to check
 * @param userRole - The user's role
 * @param isVerified - Whether the user is verified
 * @returns boolean
 */
export function hasRoutePermission(
  pathname: string,
  userRole?: string,
  isVerified?: boolean
): boolean {
  // Check public routes
  if (isPublicRoute(pathname)) {
    return true;
  }

  // Must be authenticated for non-public routes
  if (!userRole) {
    return false;
  }

  // Check verified-only routes
  if (verifiedOnlyRoutes.some(route => pathname.startsWith(route))) {
    if (!isVerified) {
      return false;
    }
  }

  // Check role-specific permissions
  for (const [roles, routes] of Object.entries(routePermissions)) {
    const roleList = roles.split(',');
    const hasRole = roleList.includes('authenticated') || roleList.includes(userRole);
    
    if (hasRole && routes.some(route => {
      if (route.endsWith('*')) {
        return pathname.startsWith(route.slice(0, -1));
      }
      return pathname === route || pathname.startsWith(route + '/');
    })) {
      return true;
    }
  }

  return false;
}

/**
 * Get the appropriate redirect URL based on user role
 * @param userRole - The user's role
 * @returns string
 */
export function getDefaultRedirectForRole(userRole?: string): string {
  switch (userRole) {
    case 'ADMIN':
      return '/admin/dashboard';
    case 'AGENT':
      return '/agent/dashboard';
    case 'OWNER':
      return '/owner/dashboard';
    case 'RENTER':
      return '/dashboard';
    default:
      return DEFAULT_LOGIN_REDIRECT;
  }
}