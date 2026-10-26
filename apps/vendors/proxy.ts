// apps/vendors/proxy.ts
// Next 16 renamed middleware → proxy: the file is proxy.ts and the export is `proxy`.
// Cheap gate: no Auth.js session cookie → /login. The real checks
// (valid session, role === VENDOR, vendor not suspended) run server-side in
// app/(dashboard)/layout.tsx and on every API call in vendor-service.
import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"];

export function proxy(req: NextRequest) {
  const has = SESSION_COOKIES.some((c) => req.cookies.has(c));
  if (has) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api/auth|login|register|_next/static|_next/image|favicon.ico|logo).*)"],
};
