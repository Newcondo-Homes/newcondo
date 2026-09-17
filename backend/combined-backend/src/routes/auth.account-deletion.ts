// backend/combined-backend/src/routes/auth.account-deletion.ts
// ============================================================
// Routes for in-app account deletion. Mount inside the existing auth router:
//
//   import { accountDeletionRouter } from "./auth.account-deletion";
//   authRouter.use(accountDeletionRouter);          // → /api/v1/auth/...
//
// and the two UNAUTHENTICATED ones at the app root (they are called by
// Facebook and by a logged-out person, not by our own frontend):
//
//   app.use("/", metaDataDeletionRouter);
//     POST /facebook/data-deletion      ← Meta's Data Deletion Request Callback
//     GET  /data-deletion/:code         ← the status URL we return to Meta
//
// META REQUIREMENT (why the callback exists at all): an app using Facebook
// Login must give Meta a callback that starts a real deletion when a user
// removes the app, and a status URL a human can open. Meta tests both. Our
// callback creates a normal AccountDeletionRequest — the SAME 21-day path as
// the in-app button, no special fast lane, no special slow lane.
// ============================================================
import { Router, type Router as ExpressRouter } from "express";
import crypto from "crypto";
import { prisma } from "@newcondo/db";
// authMiddleware lives in backend-shared, not a separate @newcondo/auth package.
import { authMiddleware, ACCOUNT_DELETION } from "@newcondo/backend-shared";
import {
  getDeletionPreview,
  requestAccountDeletion,
  cancelAccountDeletion,
  getDeletionStatusByCode,
} from "@newcondo/auth-service";

const router: ExpressRouter = Router();

/** Everything the dialog needs to explain itself before anything is destroyed. */
router.get("/account/deletion/preview", authMiddleware, async (req, res, next) => {
  try {
    res.json({ success: true, data: await getDeletionPreview(req.user!.id) });
  } catch (e) { next(e); }
});

/** Start it. Re-authenticated, confirm-phrase gated, blocker-checked. */
router.post("/account/deletion", authMiddleware, async (req, res, next) => {
  try {
    const data = await requestAccountDeletion({
      userId: req.user!.id,
      password: req.body?.password,
      otp: req.body?.otp,
      reason: req.body?.reason,
      reasonNote: req.body?.reasonNote,
      confirmPhrase: req.body?.confirmPhrase ?? "",
      source: "IN_APP",
      ip: req.ip,
      userAgent: req.get("user-agent") ?? undefined,
    });
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

/** Cancel — "reactivate". Reached from a signed-in session OR from the login
 *  screen's restore path (see restoreAfterLogin below). */
router.delete("/account/deletion", authMiddleware, async (req, res, next) => {
  try {
    res.json({ success: true, data: await cancelAccountDeletion(req.user!.id) });
  } catch (e) { next(e); }
});

/** Own status, for the banner shown to a deactivated user mid-restore. */
router.get("/account/deletion/status", authMiddleware, async (req, res, next) => {
  try {
    const u = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { deletedAt: true, anonymizedAt: true, deletionRequests: {
        where: { status: "PENDING" },
        select: { confirmationCode: true, anonymizeAfter: true, roleAtRequest: true },
        take: 1,
      } },
    });
    const r = u?.deletionRequests?.[0] ?? null;
    res.json({
      success: true,
      data: {
        scheduled: !!u?.deletedAt && !u?.anonymizedAt,
        erasureDate: r?.anonymizeAfter ?? null,
        confirmationCode: r?.confirmationCode ?? null,
        graceDays: ACCOUNT_DELETION.graceDays,
      },
    });
  } catch (e) { next(e); }
});

export { router as accountDeletionRouter };

/* ============================================================
   META CALLBACK + PUBLIC STATUS PAGE  (no auth)
   ============================================================ */
const metaRouter: ExpressRouter = Router();

/** Meta signs its callback payload with the app secret. An unverified callback
 *  is an unauthenticated "delete this user" endpoint, so the signature check is
 *  the whole security model here. */
function parseSignedRequest(signed: string, appSecret: string): { user_id?: string } | null {
  const [encodedSig, payload] = signed.split(".", 2);
  if (!encodedSig || !payload) return null;
  const b64 = (s: string) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  const expected = crypto.createHmac("sha256", appSecret).update(payload).digest();
  const given = b64(encodedSig);
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
  try { return JSON.parse(b64(payload).toString("utf8")); } catch { return null; }
}

metaRouter.post("/facebook/data-deletion", async (req, res) => {
  const secret = process.env.FACEBOOK_APP_SECRET ?? "";
  const signed = req.body?.signed_request as string | undefined;
  if (!secret || !signed) return res.status(400).json({ error: "signed_request required" });

  const data = parseSignedRequest(signed, secret);
  if (!data?.user_id) return res.status(400).json({ error: "invalid signed_request" });

  // Meta gives us their user id, not our own — find the linked Account row.
  const account = await prisma.account.findFirst({
    where: { provider: "facebook", providerAccountId: data.user_id },
    select: { userId: true },
  });

  // If we hold nothing for that person, say so truthfully with a code they can
  // still check. Meta requires a code + URL, not proof that a user existed.
  if (!account) {
    const code = `nf-${crypto.randomUUID()}`;
    return res.json({ url: `${process.env.APP_URL}/data-deletion/${code}`, confirmation_code: code });
  }

  try {
    const result = await requestAccountDeletion({
      userId: account.userId,
      confirmPhrase: ACCOUNT_DELETION.confirmPhrase, // system-initiated; re-auth is Meta's signature
      source: "META_CALLBACK",
      reason: "Removed the Newcondo app on Facebook",
    });
    return res.json({
      url: `${process.env.APP_URL}/data-deletion/${result.confirmationCode}`,
      confirmation_code: result.confirmationCode,
    });
  } catch {
    // Already scheduled, or blocked by an open obligation. Either way Meta gets
    // a real code that resolves to a page explaining the actual state — never a
    // 500, which Meta treats as a failed callback.
    const existing = await prisma.accountDeletionRequest.findFirst({
      where: { userId: account.userId },
      orderBy: { requestedAt: "desc" },
      select: { confirmationCode: true },
    });
    const code = existing?.confirmationCode ?? `pending-${crypto.randomUUID()}`;
    return res.json({ url: `${process.env.APP_URL}/data-deletion/${code}`, confirmation_code: code });
  }
});

/** JSON behind the public status page. */
metaRouter.get("/data-deletion/:code", async (req, res, next) => {
  try {
    res.json({ success: true, data: await getDeletionStatusByCode(req.params.code) });
  } catch (e) { next(e); }
});

export { metaRouter as metaDataDeletionRouter };

/* ============================================================
   LOGIN: what a deactivated account must do.

   In authController.login / the NextAuth authorize callback, AFTER the password
   check succeeds and BEFORE a session is issued:

     if (user.anonymizedAt) {
       throw unauthorized("This account was permanently deleted. Please create a new one.");
     }
     if (user.deletedAt) {
       // Credentials are correct and the window is open: this is the restore
       // path, not a failure. Issue a RESTRICTED session — the frontend routes
       // it straight to the reactivate screen and nothing else.
       return { ...session, accountState: "PENDING_DELETION" };
     }

   Every other authenticated route must refuse a PENDING_DELETION session, which
   is one guard in authMiddleware:

     if (req.user?.accountState === "PENDING_DELETION" &&
         !req.path.startsWith("/auth/account/deletion")) {
       throw forbidden("Your account is scheduled for deletion. Restore it to continue.");
     }
   ============================================================ */
