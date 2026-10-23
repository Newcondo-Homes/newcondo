// backend/vendor-service/src/routes/index.ts
// Two routers, mounted by combined-backend:
//   portal → /api/v1/vendors   (apps/vendors; VENDOR role only, except register + voice callback)
//   visits → /api/v1/services  (apps/platform; owner / listing agent / tenant)
// The visit-verified payout hook is injected so vendor-service never imports
// payment-service (no dependency cycle).
import express, { Router, type Router as ExpressRouter } from "express";
import rateLimit from "express-rate-limit";
import { timingSafeEqual } from "crypto";
import { authMiddleware } from "@newcondo/backend-shared";
import { requireVendor } from "../middleware/requireVendor";
import { validate } from "../middleware/validate";
import * as S from "../validators/schemas";
import * as V from "../controllers/vendorController";
import * as P from "../controllers/serviceVisitController";
import type { VerifiedVisit } from "../services/visitCodeService";

const limiter = (windowMin: number, max: number, keyByUser = false) => rateLimit({
  windowMs: windowMin * 60_000, max, standardHeaders: true, legacyHeaders: false,
  ...(keyByUser ? { keyGenerator: (req) => req.user?.id ?? req.ip ?? "anon" } : {}),
  message: { success: false, message: "Too many requests — try again shortly" },
});

function voiceToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const want = Buffer.from(process.env.VOICE_CALLBACK_TOKEN ?? "");
  const got = Buffer.from(req.params.token ?? "");
  if (!want.length || want.length !== got.length || !timingSafeEqual(want, got)) { res.status(404).end(); return; }
  next();
}

export interface VendorRouterDeps {
  onVisitVerified: (v: VerifiedVisit) => Promise<{ payout: string; receiveNaira?: number } | void>;
}

export function createVendorRouters(deps: VendorRouterDeps): { portal: ExpressRouter; visits: ExpressRouter } {
  const portal: ExpressRouter = Router();
  const v = [authMiddleware, requireVendor] as const;

  portal.post("/register", limiter(60, 5), validate(S.registerSchema), V.register);
  portal.post("/voice-callback/:token", express.urlencoded({ extended: false }), voiceToken, P.voiceCallback);

  portal.get("/me", ...v, V.me);
  portal.patch("/me", ...v, validate(S.profileSchema), V.updateMe);
  portal.post("/me/areas", ...v, validate(S.areaSchema), V.addArea);
  portal.delete("/me/areas/:areaId", ...v, V.removeArea);
  portal.put("/me/bank", ...v, limiter(60, 5, true), validate(S.bankSchema), V.setBank);
  portal.put("/me/release-mode", ...v, validate(S.releaseModeSchema), V.setReleaseMode);

  portal.get("/me/overview", ...v, V.overview);
  portal.get("/me/jobs", ...v, V.listJobs);
  portal.get("/me/jobs/:id", ...v, V.getJob);
  portal.post("/me/jobs/:id/photos/presign", ...v, validate(S.photosPresignSchema), V.presignPhotos);
  portal.post("/me/jobs/:id/photos", ...v, validate(S.photosAttachSchema), V.attachPhotos);
  portal.get("/me/jobs/:id/photos", ...v, V.jobPhotos);
  portal.post("/me/jobs/:id/verify", ...v, limiter(15, 20, true), validate(S.verifySchema), V.makeVerifyHandler(deps.onVisitVerified));
  portal.post("/me/jobs/:id/reschedule", ...v, validate(S.rescheduleSchema), V.reschedule);
  portal.get("/me/clients", ...v, V.clients);
  portal.get("/me/payouts", ...v, V.payouts);

  const visits: ExpressRouter = Router();
  visits.get("/visits", authMiddleware, P.myVisits);
  visits.post("/visits/:jobId/code", authMiddleware, limiter(10, 10, true), P.createVisitCode);
  visits.get("/visits/:jobId/photos", authMiddleware, limiter(10, 60, true), P.getVisitPhotos); // private bucket, presigned 10 min
  visits.get("/properties/:propertyId/window", authMiddleware, P.getWindow);
  visits.put("/properties/:propertyId/window", authMiddleware, validate(S.windowSchema), P.putWindow);

  return { portal, visits };
}
