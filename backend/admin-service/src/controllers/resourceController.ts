// backend/admin-service/src/controllers/resourceController.ts — users, approvals, marking, properties, vendors, money, referrals, tickets.
import { send, q } from "./http";
import * as Users from "../services/usersService";
import * as Appr from "../services/approvalsService";
import * as Ops from "../services/opsService";
import * as Money from "../services/moneyService";
import type { ListQuery } from "../utils/paginate";
import type { AdminDeps } from "../routes";

export function createResourceHandlers(deps: AdminDeps) {
  const L = (req: Parameters<typeof q>[0]) => q<ListQuery>(req);
  return {
    users: send((req) => Users.list(L(req))),
    user: send((req) => Users.detail(req.params.id)),
    editUser: send((req) => Users.edit(req, req.params.id, req.body)),
    suspendUser: send((req) => Users.setSuspended(req, req.params.id, req.body.suspended, req.body.reason)),
    signOutUser: send((req) => Users.signOutEverywhere(req, req.params.id)),
    revokeVerification: send((req) => Users.revokeVerification(req, req.params.id, req.body.reason)),
    fieldMarkers: send((req) => Users.fieldMarkers(typeof req.query.q === "string" ? req.query.q.slice(0, 60) : undefined)),

    identityQueue: send((req) => Appr.identityQueue(L(req))),
    decideIdentity: send((req) => Appr.decideIdentity(req, req.params.id, req.body.approve, req.body.reason)),
    listingQueue: send((req) => Appr.listingQueue(L(req))),
    decideListing: send((req) => Appr.decideListing(req, req.params.id, req.body.approve, req.body.reason, req.body.allowRemark)),

    markingJobs: send((req) => Ops.markingJobs(L(req))),
    assignMarker: send((req) => Ops.assignMarker(req, deps, req.params.id, req.body.markerId)),
    rotateQueue: send((req) => Ops.rotateQueue(req, deps, req.params.id)),
    resolveMarkingDispute: send((req) => Ops.resolveMarkingDispute(req, deps, req.params.id, req.body.outcome, req.body.note)),
    allowRemark: send((req) => Ops.allowRemark(req, deps, req.params.propertyId)),

    properties: send((req) => Ops.properties(L(req))),
    property: send((req) => Ops.propertyDetail(req.params.id)),
    setVisibility: send((req) => Ops.setVisibility(req, req.params.id, req.body.public, req.body.reason)),

    vendors: send((req) => Ops.vendors(L(req))),
    vendor: send((req) => Ops.vendorDetail(req.params.id)),
    eligibleProperties: send((req) => Ops.eligibleProperties(req.params.id, typeof req.query.q === "string" ? req.query.q.slice(0, 60) : undefined)),
    setVendorStatus: send((req) => Ops.setVendorStatus(req, deps, req.params.id, req.body.status, req.body.reason)),
    assignProperties: send((req) => Ops.assignProperties(req, deps, req.params.id, req.body.propertyIds)),
    removeProperty: send((req) => Ops.removeProperty(req, deps, req.params.id, req.params.propertyId)),
    rebookVisit: send((req) => Ops.rebookVisit(req, deps, req.params.jobId, req.body.reason)),
    visitIssues: send((req) => Ops.visitIssues(L(req))),
    resolveVisitIssue: send((req) => Ops.resolveVisitIssue(req, deps, req.params.jobId, req.body.outcome, req.body.note)),

    rent: send((req) => Money.rent(L(req))),
    releaseRent: send((req) => Money.releaseRent(req, deps, req.params.id, req.body.reason)),
    ledger: send((req) => Money.ledger(L(req))),
    failedTransfers: send((req) => Money.failedTransfers(L(req))),
    disputes: send((req) => Money.disputes(L(req))),
    resolveDispute: send((req) => Money.resolveDispute(req, deps, req.params.id, req.body.outcome, req.body.note)),
    referrals: send((req) => Money.referrals(L(req))),
    referralExposure: send(() => Money.referralExposure()),
    decideReferral: send((req) => Money.decideReferral(req, req.params.id, req.body.action, req.body.reason)),
    tickets: send((req) => Money.tickets(L(req))),
    replyTicket: send((req) => Money.replyTicket(req, req.params.id, req.body.response, req.body.status)),
  };
}
