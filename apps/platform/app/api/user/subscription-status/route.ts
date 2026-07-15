/* ============================================================
   GET /api/user/subscription-status

   Same-origin, cookie-authed Prisma read of the CURRENT isPremium /
   premiumExpiresAt for the logged-in user. Exists so the client can
   pull the authoritative DB value directly, instead of trusting NextAuth's
   update()-with-no-payload to silently refetch it (that path depends on
   the jwt callback's `trigger === "update" && session` branch, which is
   the same class of bug that caused the role/userType mismatch earlier —
   if that branch's gate or refetch is ever wrong, isPremium never moves).

   Pass the fresh value back into update({ isPremium }) explicitly so the
   jwt callback's unconditional `token = { ...token, ...session }` merge
   applies it, regardless of that other branch's correctness.
   ============================================================ */

import { NextResponse } from "next/server";
import { auth } from "@newcondo/auth";
import { prisma } from "@newcondo/db";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isPremium: true, premiumExpiresAt: true },
    });
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      data: { isPremium: user.isPremium, premiumExpiresAt: user.premiumExpiresAt },
    });
  } catch (err) {
    console.error("[GET /api/user/subscription-status]", err);
    return NextResponse.json({ success: false, error: "Could not read subscription status" }, { status: 500 });
  }
}
