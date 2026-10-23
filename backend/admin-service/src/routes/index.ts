// backend/admin-service/src/routes/index.ts
// Mounted by combined-backend at /api/v1/admin. Every route except
// accept-invite is authMiddleware → requireStaff → requireScope(...).
// The scope beside each route is the single place that decides who may call it;
// apps/admin mirrors it with <Can scope> for the UI only.
import { Router, type Router as ExpressRouter } from "express";
import rateLimit from "express-rate-limit";
import { authMiddleware } from "@newcondo/backend-shared";
import { requireStaff, requireScope as need } from "../middleware/requireStaff";
import { validate } from "../middleware/validate";
import * as S from "../validators/schemas";
import * as St from "../controllers/staffController";
import { createResourceHandlers } from "../controllers/resourceController";

/** Cross-service effects, injected by combined-backend (no imports between services → no cycles). */
export interface AdminDeps {
  // payment-service — the single money-splitting / refund truth
  releaseEscrowAndSplit: (paymentId: string) => Promise<Record<string, unknown> | null>;
  refundHeldRent: (paymentId: string, reason: string, by: string) => Promise<unknown>;
  // marking-service — owns the marking ledger
  abandonMarkingSlot: (jobId: string, agentId: string) => Promise<{ promoted: boolean }>;
  assignFieldMarker: (jobId: string, markerId: string) => Promise<{ previous: string | null }>;
  resolveMarkingDispute: (jobId: string, outcome: "UPHOLD_MARKER" | "REMARK", note?: string) => Promise<unknown>;
  allowRemark: (propertyId: string) => Promise<{ title: string }>;
  // vendor-service — owns matching + scheduling + funded visits
  verifyVendor: (vendorId: string) => Promise<unknown>;
  reconcileVendorAssignments: () => Promise<unknown>;
  adminAssignVendor: (propertyId: string, vendorId: string) => Promise<{ services: string[]; moved: string[] }>;
  adminRemoveVendor: (propertyId: string, vendorId: string) => Promise<{ assigned: string[]; unmatched: string[] }>;
  endVendorAssignments: (vendorId: string, reason?: string) => Promise<{ properties: string[] }>;
  replanProperty: (propertyId: string, reason: string) => Promise<unknown>;
  adminRebookVisit: (jobId: string, reason: string) => Promise<unknown>;
}

const limiter = (windowMin: number, max: number) => rateLimit({
  windowMs: windowMin * 60_000, max, standardHeaders: true, legacyHeaders: false,
  keyGenerator: (req) => req.user?.id ?? req.ip ?? "anon",
  message: { success: false, message: "Too many requests — try again shortly" },
});

export function createAdminRouter(deps: AdminDeps): ExpressRouter {
  const r: ExpressRouter = Router();
  const H = createResourceHandlers(deps);
  const list = validate(S.listQuery, "query");
  const reason = validate(S.reasonSchema);

  // Public — the invitee has no account yet. Tight limit: tokens are 256-bit, but don't invite brute force.
  r.post("/staff/accept-invite", limiter(15, 10), validate(S.acceptInviteSchema), St.acceptInvite);

  r.use(authMiddleware, requireStaff, limiter(1, 240));

  r.get("/me", St.me);
  r.get("/overview", St.overview);

  r.get("/staff", need("staff.manage"), list, St.listStaff);
  r.post("/staff/invites", need("staff.manage"), limiter(60, 30), validate(S.inviteSchema), St.invite);
  r.post("/staff/invites/:inviteId/resend", need("staff.manage"), limiter(60, 30), St.resendInvite);
  r.delete("/staff/invites/:inviteId", need("staff.manage"), St.revokeInvite);
  r.put("/staff/:staffId/scopes", need("staff.manage"), validate(S.scopesSchema), St.updateScopes);
  r.put("/staff/:staffId/frozen", need("staff.manage"), validate(S.freezeSchema), St.setFrozen);
  r.get("/audit", need("audit.read"), list, St.auditLog);

  r.get("/users", need("users.read"), list, H.users);
  r.get("/users/:id", need("users.read"), H.user);
  r.patch("/users/:id", need("users.write"), validate(S.editUserSchema), H.editUser);
  r.put("/users/:id/suspended", need("users.suspend"), validate(S.suspendSchema), H.suspendUser);
  r.post("/users/:id/sign-out", need("users.suspend"), H.signOutUser);
  r.post("/users/:id/revoke-verification", need("verification.revoke"), reason, H.revokeVerification);
  r.post("/users/:userId/impersonate", need("users.impersonate"), limiter(60, 20), reason, St.startImpersonation);
  r.delete("/impersonation", St.endImpersonation);

  r.get("/approvals/identity", need("verification.review"), list, H.identityQueue);
  r.post("/approvals/identity/:id", need("verification.review"), validate(S.decisionSchema), H.decideIdentity);
  r.get("/approvals/listing", need("listings.review"), list, H.listingQueue);
  r.post("/approvals/listing/:id", need("listings.review"), validate(S.decisionSchema), H.decideListing);

  r.get("/marking", need("marking.read"), list, H.markingJobs);
  r.get("/marking/field-markers", need("marking.manage"), H.fieldMarkers);
  r.post("/marking/:id/assign", need("marking.manage"), validate(S.assignMarkerSchema), H.assignMarker);
  r.post("/marking/:id/rotate", need("marking.manage"), H.rotateQueue);
  r.post("/marking/:id/resolve", need("marking.verify"), validate(S.markingDisputeSchema), H.resolveMarkingDispute);
  r.post("/properties/:propertyId/allow-remark", need("marking.verify"), H.allowRemark);

  r.get("/properties", need("listings.read"), list, H.properties);
  r.get("/properties/:id", need("listings.read"), H.property);
  r.put("/properties/:id/visibility", need("listings.write"), validate(S.visibilitySchema), H.setVisibility);

  r.get("/vendors", need("vendors.read"), list, H.vendors);
  r.get("/vendors/:id", need("vendors.read"), H.vendor);
  r.get("/vendors/:id/eligible-properties", need("vendors.write"), H.eligibleProperties);
  r.put("/vendors/:id/status", need("vendors.write"), validate(S.vendorStatusSchema), H.setVendorStatus);
  r.post("/vendors/:id/properties", need("vendors.write"), validate(S.vendorAssignSchema), H.assignProperties);
  r.delete("/vendors/:id/properties/:propertyId", need("vendors.write"), H.removeProperty);
  r.post("/visits/:jobId/rebook", need("vendors.write"), reason, H.rebookVisit);
  r.get("/visits/issues", need("vendors.read"), list, H.visitIssues);
  r.post("/visits/:jobId/resolve", need(["vendors.write", "disputes.manage"], "any"), validate(S.visitIssueSchema), H.resolveVisitIssue);

  r.get("/payments/rent", need("payments.read"), list, H.rent);
  r.post("/payments/rent/:id/release", need("payouts.release"), limiter(10, 20), validate(S.releaseSchema), H.releaseRent);
  r.get("/payments/ledger", need("payments.read"), list, H.ledger);
  r.get("/payments/failed", need("payments.read"), list, H.failedTransfers);

  r.get("/disputes", need(["disputes.manage", "support.tickets"], "any"), list, H.disputes);
  r.post("/disputes/:id/resolve", need("disputes.manage"), limiter(10, 30), validate(S.disputeResolveSchema), H.resolveDispute);

  r.get("/referrals", need("referrals.read"), list, H.referrals);
  r.get("/referrals/exposure", need("referrals.read"), H.referralExposure);
  r.post("/referrals/:id/decision", need("referrals.manage"), validate(S.referralDecisionSchema), H.decideReferral);

  r.get("/tickets", need("support.tickets"), list, H.tickets);
  r.post("/tickets/:id/reply", need("support.tickets"), validate(S.ticketReplySchema), H.replyTicket);

  return r;
}
