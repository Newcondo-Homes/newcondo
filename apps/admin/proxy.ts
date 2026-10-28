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

const isPublic = (p: string) => PUBLIC.some((r) => p === r || p.startsWith(`${r}/`));

export default auth((req) => {
  const { nextUrl } = req;
  const path = nextUrl.pathname;
  const signedIn = !!req.auth?.user;

  if (path.startsWith("/api/auth")) return NextResponse.next();

  // API calls never get a login redirect (a POST would follow it and fail confusingly).
  if (path.startsWith("/api/")) return NextResponse.json({ success: false, message: "API calls go to NEXT_PUBLIC_API_URL, not the admin app" }, { status: 404 });
  // NOTE: no "signed in → bounce /login to /overview" here. The Edge auth config has no
  // role, so a signed-in NON-admin would loop /login → /overview → (no access) forever.
  // The dashboard layout shows a clear "not a staff account" screen instead.
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
