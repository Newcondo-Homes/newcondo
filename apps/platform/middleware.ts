// apps/platform/middleware.ts
import { NextResponse } from "next/server";
import { auth } from "@newcondo/auth/middleware";
import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  publicRoutes,
  // protectedRoutes,
  authRoutes,
  adminRoutes,
  agentRoutes,
  ownerRoutes,
} from "@/lib/routes";


type Role = "ADMIN" | "AGENT" | "OWNER" | "RENTER";
type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED";

// Extended user type for middleware
interface MiddlewareUser {
  id?: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  role?: Role;
  verificationStatus?: VerificationStatus;
}

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const isLoggedIn = !!req.auth;

  // Cast user to our extended type
  const user = req.auth?.user as MiddlewareUser | undefined;
  const userRole = user?.role;
  const verificationStatus = user?.verificationStatus;

  // Check if it's an API auth route (allow all auth API routes)
  const isApiAuthRoute = pathname.startsWith(apiAuthPrefix);
  if (isApiAuthRoute) {
    return;
  }

  // Check if it's a public route
  const isPublicRoute = publicRoutes.some(
    (route) =>
      route === pathname ||
      (route.endsWith("*") && pathname.startsWith(route.slice(0, -1)))
  );

  // Check if it's an auth route (login, register, etc.)
  const isAuthRoute = authRoutes.includes(pathname);

  // If user is logged in and trying to access auth routes, redirect to dashboard
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
  }

  // Allow access to public routes
  if (isPublicRoute) {
    return;
  }

  // If not logged in and trying to access protected routes, redirect to login
  if (!isLoggedIn && !isPublicRoute) {
    let callbackUrl = pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }

    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodedCallbackUrl}`, nextUrl)
    );
  }

  // Role-based access control for logged-in users
  if (isLoggedIn && userRole) {
    // Admin routes - only accessible by ADMIN role
    const isAdminRoute = adminRoutes.some(
      (route) => pathname.startsWith(route) || pathname === route
    );

    if (isAdminRoute && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", nextUrl));
    }

    // Agent-specific routes
    const isAgentRoute = agentRoutes.some(
      (route) => pathname.startsWith(route) || pathname === route
    );

    if (isAgentRoute && !["AGENT", "ADMIN"].includes(userRole)) {
      return NextResponse.redirect(new URL("/unauthorized", nextUrl));
    }

    // Owner-specific routes
    const isOwnerRoute = ownerRoutes.some(
      (route) => pathname.startsWith(route) || pathname === route
    );

    if (isOwnerRoute && !["OWNER", "ADMIN"].includes(userRole)) {
      return NextResponse.redirect(new URL("/unauthorized", nextUrl));
    }

    //TODO: update protected and non-protected routes
    // Check if user is verified for certain protected routes
    const requiresVerification = [
      "/properties/create",
      "/properties/my-listings",
      "/marking-jobs/create",
      "/virtual-accounts",
    ];

    const requiresVerificationRoute = requiresVerification.some((route) =>
      pathname.startsWith(route)
    );

    if (
      requiresVerificationRoute &&
      verificationStatus !== "VERIFIED"
    ) {
      return NextResponse.redirect(new URL("/profile/verification", nextUrl));
    }
  }

  // Handle specific property boundaries access
  if (
    pathname.includes("/boundaries") ||
    pathname.includes("/boundary-mapping")
  ) {
    // Only allow access to users with OWNER, AGENT, or ADMIN roles
    // Only allow access to users with OWNER, AGENT, or ADMIN roles
    const allowedRoles: Role[] = ["OWNER", "AGENT", "ADMIN"];

    if (!userRole || !allowedRoles.includes(userRole)) {
      return NextResponse.redirect(new URL("/unauthorized", nextUrl));
    }
  }

  // Handle marking jobs queue - only for agents
  if (pathname.includes("/marking-jobs/queue")) {
    const allowedRoles: Role[] = ["AGENT", "ADMIN"];

    if (!userRole || !allowedRoles.includes(userRole)) {
      return NextResponse.redirect(new URL("/unauthorized", nextUrl));
    }
  }

  // Handle virtual accounts - only for verified users
  if (pathname.startsWith("/virtual-accounts")) {
    if (verificationStatus !== "VERIFIED") {
      return NextResponse.redirect(new URL("/profile/verification", nextUrl));
    }
  }

  // Add security headers
  const response = NextResponse.next();

  // Add security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self)"
  );

  return response;
});

// Matcher configuration
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};












// import createMiddleware from 'next-intl/middleware';
// import { NextRequest, NextResponse } from 'next/server';
// import { locales, defaultLocale } from './i18n';

// // Create i18n middleware
// const i18nMiddleware = createMiddleware({
//   locales,
//   defaultLocale,
//   localePrefix: 'always', // Always show locale in URL
//   localeDetection: true, // Auto-detect from Accept-Language header
// });

// export default async function middleware(request: NextRequest) {
//   const { pathname } = request.nextUrl;

//   // Skip middleware for static files and API routes
//   const shouldSkip =
//     pathname.startsWith('/_next') ||
//     pathname.startsWith('/api') ||
//     pathname.includes('/favicon.ico') ||
//     pathname.includes('/images/') ||
//     pathname.includes('/public/');

//   if (shouldSkip) {
//     return NextResponse.next();
//   }

//   // Handle locale routing
//   const response = i18nMiddleware(request);

//   // Add custom headers for locale info
//   const locale = pathname.split('/')[1];
//   if (locales.includes(locale as any)) {
//     response.headers.set('x-locale', locale);
//   }

//   return response;
// }

// export const config = {
//   // Match all pathnames except for
//   // - /api routes
//   // - /_next (Next.js internals)
//   // - /_static (inside /public)
//   // - all root files inside /public (e.g. /favicon.ico)
//   matcher: ['/((?!api|_next|_static|.*\\..*).*)'],
// };