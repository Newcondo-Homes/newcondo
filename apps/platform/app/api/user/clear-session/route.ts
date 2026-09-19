/* ============================================================
   POST /api/user/clear-session

   The half of "Reset site data" that the browser cannot do itself.

   NextAuth's session cookies are HttpOnly — invisible to document.cookie by
   design, so a client-side clear leaves the one cookie that actually matters
   untouched. Only a Set-Cookie from the server can remove them.

   Unauthenticated ON PURPOSE. The whole reason someone reaches for this is
   that their session is broken: a JWT whose user row was deleted still
   authenticates, but a session that fails to decode does not — and that user
   is exactly who needs the cookie gone. Requiring auth here would lock out
   the only people the route exists for.

   Safe to leave open: it destroys nothing but the caller's own cookies. The
   worst a malicious page could do by triggering it cross-site is sign the
   user out, which is the same outcome as the visible button.
   ============================================================ */

import { NextResponse } from "next/server";

/** Every cookie NextAuth may have set, across v4/v5 and secure/insecure hosts. */
const AUTH_COOKIES = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.csrf-token",
  "__Host-next-auth.csrf-token",
  "next-auth.callback-url",
  "__Secure-next-auth.callback-url",
  "next-auth.pkce.code_verifier",
  "__Secure-next-auth.pkce.code_verifier",
  "next-auth.state",
  "__Secure-next-auth.state",
  "next-auth.nonce",
  "__Secure-next-auth.nonce",
  // Auth.js v5 renamed the prefix; both are cleared so the route keeps working
  // across an upgrade rather than silently missing the live cookie.
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "authjs.csrf-token",
  "__Host-authjs.csrf-token",
  "authjs.callback-url",
  "__Secure-authjs.callback-url",
  "authjs.pkce.code_verifier",
  "__Secure-authjs.pkce.code_verifier",
  "authjs.state",
  "__Secure-authjs.state",
  "authjs.nonce",
  "__Secure-authjs.nonce",
];

export async function POST() {
  const res = NextResponse.json({ success: true, cleared: AUTH_COOKIES.length });

  for (const name of AUTH_COOKIES) {
    // maxAge 0 + an empty value expires it. Set on "/" because that is the
    // path NextAuth writes them to; a mismatched path leaves the cookie alive.
    res.cookies.set(name, "", {
      maxAge: 0,
      path: "/",
      // __Host- and __Secure- prefixed cookies are REJECTED by the browser
      // unless Secure is set — without this the delete for those names is
      // silently dropped and the session survives the "reset".
      secure: name.startsWith("__Secure-") || name.startsWith("__Host-") || undefined,
      httpOnly: true,
      sameSite: "lax",
    });
  }

  // Ask the browser to drop everything else for this origin as well. Chromium
  // honours this; other engines ignore it, which is why the client-side sweep
  // in reset-site-data.tsx still runs. Belt and braces, not a replacement.
  res.headers.set("Clear-Site-Data", '"cache", "cookies", "storage"');

  return res;
}
