// backend/property-service/src/controllers/tenantController.ts
// Thin HTTP layer over tenantService — validation + response shaping only.
//
// BUILD NOTE: `req.user` comes from the Express augmentation in
// backend/shared/src/types/express.d.ts. property-service only sees it if its
// tsconfig pulls that file in — see PROPERTY-SERVICE-BUILD-FIX.md §1. The
// local AuthedRequest alias below documents the shape and keeps this file
// compiling even before that wiring lands.
import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { publishNotification } from "@newcondo/backend-shared";
import * as tenantService from "../services/tenantService";

type AuthedRequest = Request & { user?: { id: string; email: string; name?: string | null; role: string } };

const inviteSchema = z.object({ unitId: z.string().optional() });
const acceptSchema = z.object({ token: z.string().min(20), unitLabel: z.string().optional() });

export async function getPropertyTenants(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const tenants = await tenantService.listTenants(req.params.propertyId, req.user!.id);
    res.json({ success: true, data: tenants });
  } catch (e) { next(e); }
}

export async function getTenantDetail(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const tenant = await tenantService.getTenantDetail(req.params.rentalId, req.user!.id);
    res.json({ success: true, data: tenant });
  } catch (e) { next(e); }
}

export async function createInvite(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const { unitId } = inviteSchema.parse(req.body ?? {});
    const invite = await tenantService.createTenantInvite({
      propertyId: req.params.propertyId, inviterId: req.user!.id, unitId,
    });
    res.status(201).json({ success: true, data: invite });
  } catch (e) { next(e); }
}

/** PUBLIC — the tenant-invite onboarding page calls this before any auth. */
export async function validateInvite(req: Request, res: Response, next: NextFunction) {
  try {
    const ctx = await tenantService.validateTenantInvite(req.params.token);
    res.json({ success: true, data: ctx });
  } catch (e) { next(e); }
}

/**
 * Called right after the invited renter registers/signs in. Notifies the
 * lister in real time so the tenant appears in their dashboard immediately.
 */
export async function acceptInvite(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const { token, unitLabel } = acceptSchema.parse(req.body ?? {});
    const result = await tenantService.acceptTenantInvite(token, req.user!.id, unitLabel);
    await publishNotification({
      userId: result.inviterId,
      kind: "tenant",
      title: "A tenant joined Newcondo",
      body: `${req.user!.name ?? "Your tenant"} onboarded via your invite link${result.unitNumber ? ` (${result.unitNumber})` : ""}.`,
      to: `/properties/${result.propertyId}`,
      entityType: "rental",
      entityId: result.rental.id,
    });
    res.status(201).json({ success: true, data: result.rental });
  } catch (e) { next(e); }
}
