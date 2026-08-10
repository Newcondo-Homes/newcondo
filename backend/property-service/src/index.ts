// backend/property-service/src/index.ts
// Barrel — combined-backend imports property-service through this file
// (same pattern as @newcondo/payment-service). Add earlier controllers/
// services here as they are wired into combined routes.

// tenants + invite links (dashboard "Tenants" card + renter onboarding)
export {
  listTenants,
  getTenantDetail as getTenantDetailService,
  createTenantInvite,
  validateTenantInvite,
  acceptTenantInvite,
} from "./services/tenantService";
export * as tenantController from "./controllers/tenantController";
export { tenantRouter } from "./routes/tenants";

// public browse/search grid
export { browseProperties, type BrowseFilters } from "./services/publicBrowseService";

// share/promo links (DB-backed, unique creator code in the URL)
export { getOrCreateShareLink, resolveShareLink } from "./services/shareLinkService";

// owner → agent listing invitations + linked-owner dropdown
export { createAgentInvite, validateAgentInvite, acceptAgentInvite, listLinkedOwners } from "./services/agentInviteService";

// sub-agent promotion requests (approve mints the tracked PROMO link)
export { requestPromotion, listPromotionRequests, approvePromotion, declinePromotion, subAgentEffectiveRate } from "./services/promotionService";

// marking geometry (single source of truth — marking-service imports these)
export * from "./lib/marking-geo";

// createProperty
export { createProperty, listUnmarkedProperties } from "./services/createPropertyService";
