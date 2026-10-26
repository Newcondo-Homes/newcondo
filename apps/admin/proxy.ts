// apps/admin/middleware.ts
// ============================================================
// REPLACES the old scaffold middleware (next-intl locale prefixes + an
// `admin-auth-token` cookie nothing sets). The admin app has no [locale]
// routes and signs in through the shared Auth.js session — same as
// apps/platform, via the Edge-safe `@newcondo/auth/middleware` export.
//
// What this gate does (cheap, at the edge):
//   • not signed in            → /login?callbackUrl=<where they were going>
//   • signed in and on /login  → /overview (or their callbackUrl)
//   • /accept-invite/*, /login, /api/auth/*, static files → always public
//
// What it deliberately does NOT do: check role or scopes. The Edge auth
// config (packages/auth/auth.config.ts) has no jwt/session callbacks, so
// `role` isn't on req.auth here. The real checks run on the server and API:
//   • app/(dashboard)/layout.tsx → role must be ADMIN (full auth config)
//   • admin-service requireStaff → ACTIVE StaffMember + scopes, every call
//
// Next 16: `middleware.ts` still works but is deprecated in favour of
// `proxy.ts`. To switch, rename this file to proxy.ts — nothing else changes.
// ============================================================
import { NextResponse } from "next/server";
import { auth } from "@newcondo/auth/middleware";

const PUBLIC = ["/login", "/accept-invite"];
const HOME = "/overview";

const isPublic = (p: string) => PUBLIC.some((r) => p === r || p.startsWith(`${r}/`));
/** Only same-app relative paths — never an open redirect to another host. */
const safeCallback = (v: string | null) => (v && v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/login") ? v : HOME);

export default auth((req) => {
  const { nextUrl } = req;
  const path = nextUrl.pathname;
  const signedIn = !!req.auth?.user;

  if (path.startsWith("/api/auth")) return NextResponse.next();

  if (path === "/login" && signedIn) {
    return NextResponse.redirect(new URL(safeCallback(nextUrl.searchParams.get("callbackUrl")), nextUrl));
  }
  if (isPublic(path)) return NextResponse.next();

  if (!signedIn) {
    const url = new URL("/login", nextUrl);
    url.searchParams.set("callbackUrl", path + nextUrl.search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
});

export const config = {
  // Everything except Next internals and files with an extension (logo, favicon, fonts…).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)"],
};
