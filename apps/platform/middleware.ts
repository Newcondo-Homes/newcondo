// apps/platform/middleware.ts
import { NextResponse } from "next/server";
import { auth } from "@newcondo/auth/middleware";
import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  publicRoutes,
  authRoutes,
  adminRoutes,
  agentRoutes,
  ownerRoutes,
} from "@/lib/routes";
// Copy these two files from the marketing site into this app, unchanged:
import { IP_WHITELIST } from "@/lib/ip-access-config";
import { IP_BYPASS_COOKIE } from "@/lib/gate-storage";

type Role = "ADMIN" | "AGENT" | "OWNER" | "RENTER";
type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED";

interface MiddlewareUser {
  id?: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  role?: Role;
  verificationStatus?: VerificationStatus;
}

/**
 * Server-side IP allow-list. If the request's IP matches an entry in
 * IP_WHITELIST (lib/ip-access-config.ts), we drop a cookie the client
 * checks before showing the location gate — that visitor gets instant
 * access on every route, no GPS permission needed. Runs on the real
 * edge request IP, so it can't be spoofed from the browser.
 *
 * With IP_WHITELIST empty (default), this block is a no-op and every
 * visitor goes through the normal auth/role checks below unaffected.
 */
function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") || req.headers.get("cf-connecting-ip") || "";
}

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const isLoggedIn = !!req.auth;

  const user = req.auth?.user as MiddlewareUser | undefined;
  const userRole = user?.role;
  const verificationStatus = user?.verificationStatus;

  const ip = getClientIp(req);
  const ipBypass = IP_WHITELIST.length > 0 && !!ip && IP_WHITELIST.includes(ip);

  /** Wrap every returned response through here so the bypass cookie always gets set. */
  function finish(res: NextResponse): NextResponse {
    if (ipBypass) {
      res.cookies.set(IP_BYPASS_COOKIE, "1", {
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        sameSite: "lax",
        httpOnly: true, // server-only — client JS can't read or forge this
        secure: process.env.NODE_ENV === "production"
      });
    }
    return res;
  }

  const isApiAuthRoute = pathname.startsWith(apiAuthPrefix);
  if (isApiAuthRoute) {
    return finish(NextResponse.next());
  }

  const isPublicRoute = publicRoutes.some(
    (route) =>
      route === pathname ||
      (route.endsWith("*") && pathname.startsWith(route.slice(0, -1)))
  );

  const isAuthRoute = authRoutes.includes(pathname);

  if (isAuthRoute && isLoggedIn) {
    return finish(NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl)));
  }

  if (isPublicRoute) {
    return finish(NextResponse.next());
  }

  if (!isLoggedIn && !isPublicRoute) {
    let callbackUrl = pathname;
    if (nextUrl.search) callbackUrl += nextUrl.search;
    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    return finish(
      NextResponse.redirect(new URL(`/login?callbackUrl=${encodedCallbackUrl}`, nextUrl))
    );
  }

  if (isLoggedIn && userRole) {
    const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route) || pathname === route);
    if (isAdminRoute && userRole !== "ADMIN") {
      return finish(NextResponse.redirect(new URL("/unauthorized", nextUrl)));
    }

    const isAgentRoute = agentRoutes.some((route) => pathname.startsWith(route) || pathname === route);
    if (isAgentRoute && !["AGENT", "ADMIN"].includes(userRole)) {
      return finish(NextResponse.redirect(new URL("/unauthorized", nextUrl)));
    }

    const isOwnerRoute = ownerRoutes.some((route) => pathname.startsWith(route) || pathname === route);
    if (isOwnerRoute && !["OWNER", "ADMIN"].includes(userRole)) {
      return finish(NextResponse.redirect(new URL("/unauthorized", nextUrl)));
    }

    //TODO: update protected and non-protected routes
    const requiresVerification = [
      "/properties/create",
      "/properties/my-listings",
      "/marking-jobs/create",
      "/virtual-accounts",
    ];
    const requiresVerificationRoute = requiresVerification.some((route) => pathname.startsWith(route));
    if (requiresVerificationRoute && verificationStatus !== "VERIFIED") {
      return finish(NextResponse.redirect(new URL("/profile/verification", nextUrl)));
    }
  }

  if (pathname.includes("/boundaries") || pathname.includes("/boundary-mapping")) {
    const allowedRoles: Role[] = ["OWNER", "AGENT", "ADMIN"];
    if (!userRole || !allowedRoles.includes(userRole)) {
      return finish(NextResponse.redirect(new URL("/unauthorized", nextUrl)));
    }
  }

  if (pathname.includes("/marking-jobs/queue")) {
    const allowedRoles: Role[] = ["AGENT", "ADMIN"];
    if (!userRole || !allowedRoles.includes(userRole)) {
      return finish(NextResponse.redirect(new URL("/unauthorized", nextUrl)));
    }
  }

  if (pathname.startsWith("/virtual-accounts")) {
    if (verificationStatus !== "VERIFIED") {
      return finish(NextResponse.redirect(new URL("/profile/verification", nextUrl)));
    }
  }

  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");

  return finish(response);
});


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
