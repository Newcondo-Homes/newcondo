// backend/vendor-service/src/index.ts
// Barrel — combined-backend imports vendor-service through this file.

// Owner Services page (legacy overview + requests; unchanged)
export { getServicesOverview, requestService, rescheduleJob, reportJobIssue, completeJob } from "./services/vendorService";
export type { ServicesOverview, ServicePlanDTO, ServiceJobDTO } from "./services/vendorService";

// ++ Vendor network
export { createVendorRouters, type VendorRouterDeps } from "./routes/index";
export { startVendorCron } from "./jobs/vendorCron";
export { ensureAssignments, reconcileAssignments, adminAssignVendor, adminRemoveVendor, endVendorAssignments } from "./services/matchingService";
export { planProperty, replanProperty, listVisitsFor, adminRebookVisit } from "./services/schedulingService";
export { accrueFromPaidPeriods } from "./services/fundAccrualService";
export { verifyVendor } from "./services/vendorAccountService";
export type { VerifiedVisit } from "./services/visitCodeService";
export type * from "./types/index";
