// backend/combined-backend/src/routes/vendors.ts
// ============================================================
// Vendor network wiring. vendor-service owns the routes, controllers and
// validation; this file only injects the one cross-service dependency:
// paying an INSTANT vendor the moment a visit code is verified
// (payment-service). END_OF_DAY vendors are left for the 18:00 batch.
//
//   /api/v1/vendors/*   apps/vendors (VENDOR role) + register + voice callback
//   /api/v1/services/*  apps/platform: /visits, /visits/:jobId/code, /properties/:id/window
//                       (mounted alongside the existing routes/services.ts)
// ============================================================
import { createVendorRouters } from "@newcondo/vendor-service";
import { payVendorForJob } from "@newcondo/payment-service";

export const { portal: vendorPortalRouter, visits: serviceVisitsRouter } = createVendorRouters({
  async onVisitVerified(v) {
    if (v.releaseMode !== "INSTANT") return { payout: "BATCHED" };
    const r = await payVendorForJob(v.jobId, `vendor:${v.vendorId}`);
    return { payout: "PROCESSING", receiveNaira: r.receiveNaira };
  },
});
