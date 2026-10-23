// backend/admin-service/src/middleware/accountGuard.ts
// ============================================================
// Mounted ONCE in combined-backend, before every router. For any request with
// a Bearer token it enforces what admins decide, on EVERY service:
//
//   1. Suspended / deleted accounts → 403 (all routes, all apps)
//   2. "Sign out everywhere", suspend and freeze → tokens issued before
//      User.sessionsRevokedAt → 401
//   3. Support sessions (impersonation tokens, `imp` claim):
//        • rejected once ended / expired / the staff member is frozen
//        • money-out, payment, credential and deletion routes are blocked
//        • every non-GET call is logged as IMPERSONATED_ACTION
//        • never recorded as the user's own device / login
//   4. Device + usage tracking (UserDevice), throttled to one write per
//      device per 5 minutes via Redis.
//
// User state is cached in Redis for 30s; admin actions bust the key, so
// suspend / sign-out take effect on the next request.
// Invalid / missing tokens pass through untouched — authMiddleware owns 401s.
// ============================================================
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { createHash } from "crypto";
import { prisma } from "@newcondo/db";
import { redis } from "@newcondo/backend-shared";
import { sha256 } from "../utils/tokens";

interface Claims { userId?: string; iat?: number; imp?: { sid: string; staffId: string } }
interface UserState { suspended: boolean; deleted: boolean; revokedAt: number | null }

const STATE_TTL = 30;
const stateKey = (userId: string) => `acct:state:${userId}`;

/** Call after any change to suspendedAt / sessionsRevokedAt / deletedAt. */
export async function bustAccountState(userId: string) { await redis.del(stateKey(userId)).catch(() => {}); }

async function userState(userId: string): Promise<UserState | null> {
  const hit = await redis.get(stateKey(userId)).catch(() => null);
  if (hit) return JSON.parse(hit) as UserState;
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { suspendedAt: true, deletedAt: true, sessionsRevokedAt: true } });
  if (!u) return null;
  const s: UserState = { suspended: !!u.suspendedAt, deleted: !!u.deletedAt, revokedAt: u.sessionsRevokedAt?.getTime() ?? null };
  await redis.set(stateKey(userId), JSON.stringify(s), "EX", STATE_TTL).catch(() => {});
  return s;
}

/** Support sessions are for looking and fixing — never for moving money or changing credentials. */
const IMP_BLOCKED: RegExp[] = [
  /withdraw/i, /bank/i, /payout/i, /charge/i, /checkout/i, /\/pay(\/|$|\?)/i, /payments\/(initiate|rent|intent|verify)/i,
  /subscri(be|ption)s?\/(create|start|change|cancel|resume|card)/i, /saved-card/i, /refund/i,
  /password/i, /auth\/(email|change|reset|otp|2fa|link)/i, /account\/deletion/i, /delete-account/i, /referral(s)?\/code/i,
  /\/admin(\/|$)/i,
];

function deviceLabel(ua: string) {
  const os = /iphone/i.test(ua) ? "iPhone" : /ipad/i.test(ua) ? "iPad" : /android/i.test(ua) ? "Android" : /windows/i.test(ua) ? "Windows" : /mac os/i.test(ua) ? "Mac" : /linux/i.test(ua) ? "Linux" : "Device";
  const br = /edg\//i.test(ua) ? "Edge" : /chrome|crios/i.test(ua) ? "Chrome" : /firefox|fxios/i.test(ua) ? "Firefox" : /safari/i.test(ua) ? "Safari" : /okhttp|dart|expo/i.test(ua) ? "Newcondo app" : "Browser";
  return `${os} · ${br}`;
}
const lagosDay = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });

async function trackDevice(req: Request, userId: string) {
  const ua = String(req.headers["user-agent"] ?? "").slice(0, 300);
  const deviceKey = createHash("sha256").update(`${userId}|${ua}`).digest("hex");
  const throttle = `acct:dev:${deviceKey}`;
  const fresh = await redis.set(throttle, "1", "EX", 300, "NX").catch(() => "OK");
  if (fresh !== "OK") return;
  const ipHash = createHash("sha256").update(`${req.ip ?? ""}|${process.env.IP_HASH_SALT ?? ""}`).digest("hex").slice(0, 24);
  const city = (req.headers["x-vercel-ip-city"] as string | undefined) ?? (req.headers["cf-ipcity"] as string | undefined) ?? null;
  const today = lagosDay();
  const existing = await prisma.userDevice.findUnique({ where: { userId_deviceKey: { userId, deviceKey } }, select: { lastDay: true } });
  if (!existing) {
    await prisma.userDevice.create({ data: { userId, deviceKey, deviceLabel: deviceLabel(ua), userAgent: ua, ipHash, city: city ? decodeURIComponent(city) : null, lastDay: today } }).catch(() => {});
    return;
  }
  await prisma.userDevice.update({
    where: { userId_deviceKey: { userId, deviceKey } },
    data: { lastSeenAt: new Date(), ipHash, revokedAt: null, ...(city ? { city: decodeURIComponent(city) } : {}), ...(existing.lastDay !== today ? { lastDay: today, activeDays: { increment: 1 } } : {}) },
  }).catch(() => {});
}

export async function accountGuard(req: Request, res: Response, next: NextFunction): Promise<void> {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return next();
  const raw = h.slice(7);
  let c: Claims;
  try { c = jwt.verify(raw, process.env.JWT_SECRET!) as Claims; } catch { return next(); }
  if (!c.userId) return next();

  try {
    const st = await userState(c.userId);
    if (!st || st.deleted) { res.status(401).json({ success: false, code: "ACCOUNT_GONE", message: "This account no longer exists" }); return; }
    if (st.suspended) { res.status(403).json({ success: false, code: "ACCOUNT_SUSPENDED", message: "This account is on hold. Check your email or contact support." }); return; }
    if (!c.imp && st.revokedAt && (c.iat ?? 0) * 1000 < st.revokedAt) { res.status(401).json({ success: false, code: "SESSION_REVOKED", message: "You were signed out. Please sign in again." }); return; }

    if (c.imp) {
      const s = await prisma.impersonationSession.findUnique({ where: { id: c.imp.sid }, select: { id: true, endedAt: true, expiresAt: true, tokenHash: true, targetUserId: true, staff: { select: { status: true, userId: true } } } });
      if (!s || s.endedAt || s.expiresAt < new Date() || s.staff.status !== "ACTIVE" || s.targetUserId !== c.userId || s.tokenHash !== sha256(raw)) {
        res.status(401).json({ success: false, code: "SUPPORT_SESSION_ENDED", message: "Support session ended" }); return;
      }
      const path = req.originalUrl.split("?")[0];
      if (req.method !== "GET" && IMP_BLOCKED.some((r) => r.test(path))) {
        res.status(403).json({ success: false, code: "SUPPORT_SESSION_BLOCKED", message: "Not available during a support session — the user must do this themselves." }); return;
      }
      if (req.method !== "GET") {
        prisma.adminAction.create({ data: { adminId: s.staff.userId, action: "IMPERSONATED_ACTION", targetType: "User", targetId: s.targetUserId, description: `${req.method} ${path}`.slice(0, 300), metadata: { sessionId: s.id } } }).catch(() => {});
      }
      return next(); // never tracked as the user's own device
    }

    void trackDevice(req, c.userId).catch(() => {});
    next();
  } catch (e) {
    // Fail CLOSED for support sessions, OPEN for normal users (a Redis/DB blip must not lock everyone out;
    // authMiddleware + per-route checks still apply).
    if (c.imp) { res.status(503).json({ success: false, message: "Support session check unavailable" }); return; }
    console.error("[accountGuard]", e);
    next();
  }
}
