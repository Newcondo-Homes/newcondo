// backend/admin-service/src/controllers/staffController.ts — staff, invites, impersonation, overview, audit.
import { send, q } from "./http";
import * as Staff from "../services/staffService";
import * as Imp from "../services/impersonationService";
import * as Ov from "../services/overviewService";
import type { ListQuery } from "../utils/paginate";

export const me = send((req) => Staff.me(req));
export const overview = send((req) => Ov.overview(req.staff!.scopes));
export const auditLog = send((req) => Ov.auditLog(q<ListQuery>(req)));

export const listStaff = send((req) => Staff.list(req, q<ListQuery>(req)));
export const invite = send((req) => Staff.invite(req, req.body), 201);
export const resendInvite = send((req) => Staff.resendInvite(req, req.params.inviteId));
export const revokeInvite = send((req) => Staff.revokeInvite(req, req.params.inviteId));
export const acceptInvite = send((req) => Staff.acceptInvite(req.body));
export const updateScopes = send((req) => Staff.updateScopes(req, req.params.staffId, req.body));
export const setFrozen = send((req) => Staff.setFrozen(req, req.params.staffId, req.body.frozen));

export const startImpersonation = send((req) => Imp.start(req, req.params.userId, req.body.reason), 201);
export const endImpersonation = send((req) => Imp.end(req));
