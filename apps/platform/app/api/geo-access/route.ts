import { NextRequest, NextResponse } from "next/server";
import { checkGeoAccess } from "@/lib/geo-access";
import { signGeoAccess, GEO_ACCESS_COOKIE, GEO_ACCESS_MAX_AGE_SECONDS } from "@/lib/geo-token";

/**
 * Server-side geo-access check. The client posts raw GPS coordinates here;
 * this route is the only place that decides "allowed" and is the only place
 * that can mint a valid signed cookie — the browser can carry the cookie
 * around but can never write a valid one itself.
 */
export async function POST(req: NextRequest) {
  let body: { lat?: unknown; lng?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ allowed: false, error: "Invalid request body" }, { status: 400 });
  }

  const lat = Number(body.lat);
  const lng = Number(body.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ allowed: false, error: "Invalid coordinates" }, { status: 400 });
  }

  const result = checkGeoAccess(lat, lng);
  const res = NextResponse.json(result);

  if (result.allowed) {
    const token = signGeoAccess({ allowed: true, state: result.state as string, city: result.city });
    res.cookies.set(GEO_ACCESS_COOKIE, token, {
      path: "/",
      maxAge: GEO_ACCESS_MAX_AGE_SECONDS,
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
  }

  return res;
}
