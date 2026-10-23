// backend/vendor-service/src/controllers/vendorController.ts
// HTTP handlers for the vendors app. Thin: read req, call one service, send.
// `vendorId` always comes from requireVendor, never from the request.
import type { Request } from "express";
import { send, type Handler } from "./http";
import * as account from "../services/vendorAccountService";
import * as jobs from "../services/vendorJobsService";
import { verifyVisitCode, type VerifiedVisit } from "../services/visitCodeService";
import { visitPhotos } from "../services/visitPhotoService";
import { vendorReschedule } from "../services/schedulingService";

const vid = (req: Request) => req.vendor!.id;
const page = (req: Request) => Math.max(1, Number(req.query.page) || 1);

export const register: Handler = send((req) => account.registerVendor(req.body), 201);
export const me: Handler = send((req) => account.getVendorProfile(vid(req)));
export const updateMe: Handler = send((req) => account.updateVendorProfile(vid(req), req.body));
export const addArea: Handler = send((req) => account.addServiceArea(vid(req), req.body), 201);
export const removeArea: Handler = send((req) => account.removeServiceArea(vid(req), String(req.params.areaId)));
export const setBank: Handler = send((req) => account.setVendorBank(vid(req), req.user!.id, req.body));
export const setReleaseMode: Handler = send((req) => account.setReleaseMode(vid(req), req.body.mode));

export const overview: Handler = send((req) => jobs.getOverview(vid(req)));
export const listJobs: Handler = send((req) => jobs.listJobs(vid(req), (["todo", "pending", "paid", "all"].includes(String(req.query.tab)) ? req.query.tab : "todo") as jobs.JobsTab, page(req)));
export const getJob: Handler = send((req) => jobs.getJob(vid(req), String(req.params.id)));
export const clients: Handler = send((req) => jobs.listClients(vid(req)));
export const payouts: Handler = send((req) => jobs.payoutHistory(vid(req), page(req)));
export const presignPhotos: Handler = send((req) => jobs.presignJobPhotos(vid(req), String(req.params.id), req.body.files));
export const attachPhotos: Handler = send((req) => jobs.attachJobPhotos(vid(req), String(req.params.id), req.body.keys));
export const jobPhotos: Handler = send((req) => visitPhotos(String(req.params.id), { id: req.user!.id, role: req.user!.role }, vid(req)));
export const reschedule: Handler = send((req) => vendorReschedule(String(req.params.id), vid(req), req.body.reason));

/** The payout lives in payment-service, which vendor-service must not import.
 *  combined-backend injects it — INSTANT vendors are paid inside this request. */
export const makeVerifyHandler = (onVerified: (v: VerifiedVisit) => Promise<{ payout: string; receiveNaira?: number } | void>): Handler =>
  send(async (req) => {
    const v = await verifyVisitCode(vid(req), String(req.params.id), req.body.code);
    let payout: unknown = { payout: v.releaseMode === "INSTANT" ? "PROCESSING" : "BATCHED" };
    try { payout = (await onVerified(v)) ?? payout; }
    catch (e) { payout = { payout: "RETRYING", note: (e as Error).message }; } // the job stays verified; the hourly cron retries the transfer
    return { jobId: v.jobId, ...(payout as object) };
  });
