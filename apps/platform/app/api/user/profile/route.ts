/* ============================================================
   PATCH /api/user/profile

   Lets an AUTHENTICATED user set a couple of their own profile fields
   from inside the onboarding flow:

     • userType — needed because Google/Facebook OAuth sign-up never
       carries the role the user picked in step 1 (Auth.js callbacks
       don't see arbitrary query params from the callbackUrl).
     • phone    — Google OAuth never returns a phone number at all, but
       our platform requires one (SMS, WhatsApp updates, agent contact).

   Runs in the Next.js Node runtime (NOT Edge — this is why it lives in
   app/api, not middleware) so it can use Prisma directly via the same
   `@newcondo/db` your NextAuth config already imports. No round-trip to
   the Express API is needed: this is same-origin, so the NextAuth
   session cookie authenticates the request directly via auth().

   The client should call the NextAuth `update()` hook with the same
   values right after a successful PATCH, so the JWT (and therefore
   session.user) reflects the change immediately without a re-login —
   see the `jwt` callback's `trigger === "update"` branch in your
   packages/auth index, which merges whatever is passed into the token.
   ============================================================ */

import { NextResponse } from "next/server";
import { auth } from "@newcondo/auth";
import { prisma, Role } from "@newcondo/db";

const NG_PHONE_RE = /^(\+234|0)[789]\d{9}$/;

const VALID_ROLES = new Set(Object.values(Role));

export async function PATCH(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }

  let body: { userType?: string; phone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const data: { role?: Role; phone?: string } = {};

  if (body.userType !== undefined) {
    // Client field is called `userType` (matches the frontend's own UserType
    // enum in types/api.ts), but the Prisma column — the one authMiddleware
    // and initiateSubscription actually read — is `role` (the `Role` enum).
    // Writing to a `userType` column here was a no-op against the real check,
    // which is why the backend kept seeing RENTER after a "successful" patch.
    if (!VALID_ROLES.has(body.userType as Role)) {
      return NextResponse.json({ success: false, error: "Invalid userType" }, { status: 400 });
    }
    data.role = body.userType as Role;
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

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ success: false, error: "Nothing to update" }, { status: 400 });
  }

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, role: true, phone: true },
    });
    // Respond with `userType` (client-facing name) even though the column is `role`.
    return NextResponse.json({ success: true, data: { id: updated.id, userType: updated.role, phone: updated.phone } });
  } catch (err) {
    console.error("[PATCH /api/user/profile]", err);
    return NextResponse.json({ success: false, error: "Could not update your profile" }, { status: 500 });
  }
}
