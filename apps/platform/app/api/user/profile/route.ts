/* ============================================================
   PATCH /api/user/profile

   Lets an AUTHENTICATED user set their own onboarding-critical fields:

     • userType — Google/Facebook sign-up never carries the role picked in
       step 1 (Auth.js callbacks don't see query params from callbackUrl).
     • phone    — OAuth never returns one, and the platform requires it.
     • email    — Facebook frequently returns no email, so SocialAccountDetails
       collects it by hand and sends it here.

   Node runtime (not Edge) so it can use Prisma via @newcondo/db. Same-origin,
   so the NextAuth session cookie authenticates via auth().

   FIELD MAPPING: the client sends `userType`, but the column authMiddleware and
   initiateSubscription actually read is `role`. Writing a `userType` column here
   was a no-op against the real check — that was the original "role stays
   RENTER" bug.

   ---- WHY THIS WAS 500ing ----

   Three separate causes, all now handled:

   1. `new Set(Object.values(Role))` ran at MODULE SCOPE. Under Prisma 7 the
      generated enum objects aren't always a runtime value on the client import
      — if `Role` is undefined, `Object.values(undefined)` throws while the
      module initialises, so EVERY request 500s before a single line of handler
      code runs, and the catch block never sees it. Now validated against a
      literal tuple, which cannot fail at import time.

   2. `email` was silently ignored. SocialAccountDetails sends { phone, email },
      so the address was dropped while the response still said success — the
      Facebook flow then looped through the details step forever.

   3. Unique-constraint violations surfaced as 500. `phone` and `email` are
      unique, and register-first means abandoned stubs can be holding either.
      P2002 is now a 409 with a message the UI can show verbatim.

   The client MUST call NextAuth's update() with the same values right after a
   successful PATCH so the JWT reflects the change — see the jwt callback's
   trigger === "update" branch in packages/auth.
   ============================================================ */

import { NextResponse } from "next/server";
import { auth } from "@newcondo/auth";
import { prisma } from "@newcondo/db";

const NG_PHONE_RE = /^(\+234|0)[789]\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Literal list rather than Object.values(Role): no dependency on the generated
// enum being a runtime value, so this module can never throw on import.
const VALID_ROLES = ["OWNER", "AGENT", "RENTER", "ADMIN"] as const;
type RoleName = (typeof VALID_ROLES)[number];
const isRole = (v: unknown): v is RoleName =>
  typeof v === "string" && (VALID_ROLES as readonly string[]).includes(v);

export async function PATCH(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }

  let body: { userType?: string; phone?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (body.userType !== undefined) {
    if (!isRole(body.userType)) {
      return NextResponse.json({ success: false, error: "Invalid userType" }, { status: 400 });
    }
    // ADMIN is never self-assignable — a role patch is an unauthenticated-intent
    // field from the client's point of view, so it must not be able to escalate.
    if (body.userType === "ADMIN") {
      return NextResponse.json({ success: false, error: "Invalid userType" }, { status: 403 });
    }
    data.role = body.userType;
  }

  if (body.phone !== undefined) {
    const phone = body.phone.replace(/\s/g, "");
    if (!NG_PHONE_RE.test(phone)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid Nigerian phone number" },
        { status: 400 }
      );
    }
    data.phone = phone;
  }

  if (body.email !== undefined) {
    const email = body.email.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ success: false, error: "Enter a valid email address" }, { status: 400 });
    }
    if (email.endsWith("@placeholder.newcondo")) {
      return NextResponse.json({ success: false, error: "Enter a valid email address" }, { status: 400 });
    }
    data.email = email;
    // Changing the address must invalidate the proof of the old one. Without
    // this, someone verifies an address they control, swaps in a victim's, and
    // inherits a verified flag for a mailbox they never proved — a route into
    // password reset. The OTP itself is issued by /auth/change-email.
    data.emailVerified = null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ success: false, error: "Nothing to update" }, { status: 400 });
  }

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, role: true, phone: true, email: true },
    });
    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        userType: updated.role,
        phone: updated.phone,
        email: updated.email,
      },
    });
  } catch (err) {
    const code = (err as { code?: string })?.code;

    // P2025 = "no record found for an update". The session's user id points at a
    // row that no longer exists — an admin deleted the account, or the stub
    // cleanup job swept it — while the browser still holds a valid JWT (30-day
    // maxAge, so this outlives the record by weeks).
    //
    // This is an AUTH failure, not a server fault: nothing the user does can
    // make the update succeed. Returning 401 lets the client sign out and start
    // clean, instead of retrying a PATCH that can only ever 500.
    if (code === "P2025") {
      return NextResponse.json(
        {
          success: false,
          error: "Your session is no longer valid. Please sign in again.",
          code: "STALE_SESSION",
        },
        { status: 401 }
      );
    }

    // P2002 = unique constraint. With register-first, an abandoned stub can be
    // holding the phone or email, so this is an expected outcome, not a fault.
    if (code === "P2002") {
      const target = String((err as { meta?: { target?: string[] } })?.meta?.target ?? "");
      const field = target.includes("phone") ? "phone number" : "email address";
      return NextResponse.json(
        { success: false, error: `That ${field} is already on another account.` },
        { status: 409 }
      );
    }
    // Log the real error — the generic 500 message is what the user sees, but
    // the cause belongs in the server console.
    console.error("[PATCH /api/user/profile]", code ?? "", err);
    return NextResponse.json({ success: false, error: "Could not update your profile" }, { status: 500 });
  }
}
