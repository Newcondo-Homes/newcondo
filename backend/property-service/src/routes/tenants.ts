// backend/property-service/src/routes/tenants.ts
// Standalone-microservice mount (server.ts). combined-backend mounts the
// same controllers itself — this file exists for the microservice deploy.
import { Router, type Router as ExpressRouter } from "express";
import { authMiddleware, requireRole } from "@newcondo/backend-shared";
import * as c from "../controllers/tenantController";

const router: ExpressRouter = Router();

// lister-only (owner/agent) — ownership re-checked in the service layer
router.get("/properties/:propertyId/tenants", authMiddleware, requireRole(["OWNER", "AGENT", "ADMIN"]), c.getPropertyTenants);
router.post("/properties/:propertyId/tenant-invites", authMiddleware, requireRole(["OWNER", "AGENT", "ADMIN"]), c.createInvite);
router.get("/tenants/:rentalId", authMiddleware, requireRole(["OWNER", "AGENT", "ADMIN"]), c.getTenantDetail);

// invite lifecycle
router.get("/tenant-invites/:token", c.validateInvite);          // public — pre-auth onboarding context
router.post("/tenant-invites/accept", authMiddleware, c.acceptInvite); // renter, right after registration

export { router as tenantRouter };
