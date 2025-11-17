import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from './i18n';

// Create i18n middleware
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always', // Always include locale in URL
});

export default async function middleware(request: NextRequest) {
  // Apply i18n middleware
  const response = intlMiddleware(request);

  // Extract locale from pathname
  const pathname = request.nextUrl.pathname;
  const locale = pathname.split('/')[1];

  // Check if the request is for a protected admin route
  const isProtectedRoute =
    pathname.includes('/dashboard') ||
    pathname.includes('/users') ||
    pathname.includes('/properties') ||
    pathname.includes('/verifications') ||
    pathname.includes('/payments') ||
    pathname.includes('/analytics') ||
    pathname.includes('/boundary-disputes') ||
    pathname.includes('/duplicates') ||
    pathname.includes('/marking-oversight') ||
    pathname.includes('/support');

  if (isProtectedRoute) {
    // Check for authentication token
    const token = request.cookies.get('admin-auth-token');

    if (!token) {
      // Redirect to login page with callback URL
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // TODO: Validate token with backend admin-service
    // For now, we'll just check if token exists
  }

  // Check if accessing login page while authenticated
  if (pathname.includes('/login')) {
    const token = request.cookies.get('admin-auth-token');
    if (token) {
      // Redirect to dashboard if already authenticated
      return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
    }
  }

  return response;
}

export const config = {
  // Match all pathnames except for
  // - api routes
  // - _next (Next.js internals)
  // - static files
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};