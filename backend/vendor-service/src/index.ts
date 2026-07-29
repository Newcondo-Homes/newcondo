// backend/vendor-service/src/index.ts
// Barrel — combined-backend imports vendor-service through this file.
export {
  getServicesOverview,
  requestService,
  rescheduleJob,
  reportJobIssue,
  completeJob,
} from "./services/vendorService";

export type {
  ServicesOverview,
  ServicePlanDTO,
  ServiceJobDTO,
} from "./services/vendorService";
