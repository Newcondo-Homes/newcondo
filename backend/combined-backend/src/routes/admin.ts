// backend/combined-backend/src/routes/admin.ts
// ============================================================
// Admin wiring. admin-service owns routes, scopes and validation; this file
// injects the cross-service effects so admin actions reuse the exact code the
// rest of the platform runs (no parallel money, marking or matching logic).
//
//   /api/v1/admin/*   apps/admin (StaffMember ACTIVE, scope-checked per route)
//   accountGuard      mounted FIRST in routes/index.ts for every /api/v1 route:
//                     suspended accounts, "sign out everywhere", support-session
//                     limits, device/usage tracking
// ============================================================
import { createAdminRouter } from "@newcondo/admin-service";
import { releaseEscrowAndSplit, refundHeldRent } from "@newcondo/payment-service";
import { abandonSlot, assignFieldMarker, resolveMarkingDispute, allowRemark } from "@newcondo/marking-service";
import { reconcileAssignments, replanProperty, verifyVendor, adminAssignVendor, adminRemoveVendor, endVendorAssignments, adminRebookVisit } from "@newcondo/vendor-service";

export const adminRouter = createAdminRouter({
  releaseEscrowAndSplit: (id) => releaseEscrowAndSplit(id) as Promise<Record<string, unknown> | null>,
  refundHeldRent,
  abandonMarkingSlot: abandonSlot,
  assignFieldMarker,
  resolveMarkingDispute,
  allowRemark,
  verifyVendor,
  reconcileVendorAssignments: () => reconcileAssignments(),
  adminAssignVendor,
  adminRemoveVendor,
  endVendorAssignments,
  replanProperty: (propertyId, reason) => replanProperty(propertyId, reason),
  adminRebookVisit,
});
export { accountGuard } from "@newcondo/admin-service";
