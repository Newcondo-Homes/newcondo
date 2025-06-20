// apps/platform/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@newcondo/auth";
import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  publicRoutes,
  protectedRoutes,
  authRoutes,
  adminRoutes,
  agentRoutes,
  ownerRoutes,
} from "@/lib/routes";

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  // Check if it's an API auth route (allow all auth API routes)
  const isApiAuthRoute = pathname.startsWith(apiAuthPrefix);
  if (isApiAuthRoute) {
    return;
  }

  // Check if it's a public route
  const isPublicRoute = publicRoutes.some(route => 
    route === pathname || (route.endsWith('*') && pathname.startsWith(route.slice(0, -1)))
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
    const isAdminRoute = adminRoutes.some(route => 
      pathname.startsWith(route) || pathname === route
    );
    
    if (isAdminRoute && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', nextUrl));
    }

    // Agent-specific routes
    const isAgentRoute = agentRoutes.some(route => 
      pathname.startsWith(route) || pathname === route
    );
    
    if (isAgentRoute && !['AGENT', 'ADMIN'].includes(userRole)) {
      return NextResponse.redirect(new URL('/unauthorized', nextUrl));
    }

    // Owner-specific routes
    const isOwnerRoute = ownerRoutes.some(route => 
      pathname.startsWith(route) || pathname === route
    );
    
    if (isOwnerRoute && !['OWNER', 'ADMIN'].includes(userRole)) {
      return NextResponse.redirect(new URL('/unauthorized', nextUrl));
    }

    // Check if user is verified for certain protected routes
    const requiresVerification = [
      '/properties/create',
      '/properties/my-listings',
      '/marking-jobs/create',
      '/virtual-accounts'
    ];

    const requiresVerificationRoute = requiresVerification.some(route => 
      pathname.startsWith(route)
    );

    if (requiresVerificationRoute && req.auth?.user?.verificationStatus !== 'VERIFIED') {
      return NextResponse.redirect(new URL('/profile/verification', nextUrl));
    }
  }

  // Handle specific property boundaries access
  if (pathname.includes('/boundaries') || pathname.includes('/boundary-mapping')) {
    // Only allow access to users with OWNER, AGENT, or ADMIN roles
    if (!['OWNER', 'AGENT', 'ADMIN'].includes(userRole)) {
      return NextResponse.redirect(new URL('/unauthorized', nextUrl));
    }
  }

  // Handle marking jobs queue - only for agents
  if (pathname.includes('/marking-jobs/queue')) {
    if (!['AGENT', 'ADMIN'].includes(userRole)) {
      return NextResponse.redirect(new URL('/unauthorized', nextUrl));
    }
  }

  // Handle virtual accounts - only for verified users
  if (pathname.startsWith('/virtual-accounts')) {
    if (req.auth?.user?.verificationStatus !== 'VERIFIED') {
      return NextResponse.redirect(new URL('/profile/verification', nextUrl));
    }
  }

  // Add security headers
  const response = NextResponse.next();
  
  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self)'
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