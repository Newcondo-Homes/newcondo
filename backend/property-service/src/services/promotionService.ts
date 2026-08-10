// backend/property-service/src/services/promotionService.ts
// ============================================================
// Sub-agent promotion requests.
// Flow: sub-agent taps "Promote" on a Browse property → request row → the
// lister (listing agent when one exists, else the owner) is notified (SSE +
// branded email) and sees it on their dashboard + property detail page.
// Approve mints the sub-agent's tracked PROMO ShareLink and returns their
// split percentage; decline records a reason.
//
// SCHEMA ALIGNMENT (this is what the build errors were about) —
// PromotionRequest in packages/db is:
//   { id, propertyId, ownerId, agentId, status: PromotionRequestStatus,
//     message, rejectionReason, respondedAt, respondedBy, createdAt, updatedAt }
//   • ownerId  = the LISTER who must decide (owner OR listing agent)
//   • agentId  = the SUB-AGENT asking to promote
//   • status enum = PENDING | APPROVED | REJECTED   (there is no DECLINED)
//   • there is no `listerId`, `subAgentId`, `decidedAt` or `declineReason`
// Relations are `owner`, `agent`, `property` — not `subAgent`.
// ============================================================
import { prisma } from "@newcondo/db";
import {
  conflict, forbidden, notFound,
  publishNotification, sendBrandedEmail, EmailTemplates, PAYMENTS,
} from "@newcondo/backend-shared";
import { getOrCreateShareLink } from "./shareLinkService";

/** Share of the TOTAL rent a sub-agent effectively earns — shown in the approve modal. */
export const subAgentEffectiveRate = (): number =>
  PAYMENTS.platformCommissionRate * PAYMENTS.agentShareOfCommission * PAYMENTS.subAgentSplitOfAgentShare;

export const subAgentSplitPct = (): number => Math.round(subAgentEffectiveRate() * 1000) / 10;

export interface PromoteResult {
  /** APPROVED → promoUrl is ready to share. PENDING → the lister must approve. */
  status: "APPROVED" | "PENDING";
  promoUrl?: string;
  splitPct?: number;
  requestId?: string;
}

/**
 * Sub-agent taps "Promote" in Browse.
 *
 * The listing's PropertyPromotionSettings.promotionType decides what happens —
 * this is the gate the Browse button depends on, so it is enforced HERE (server
 * side) and never inferred from the client:
 *   PUBLIC                        → auto-approve, mint the tracked link now
 *   PERMISSION_BASED/REQUEST_BASED→ PENDING request, notify the lister
 *   RESTRICTED                    → refused outright
 * `autoApproveAgents` on a permission-based listing also short-circuits to
 * APPROVED — that's the whole point of the flag.
 *
 * No settings row means the schema default (RESTRICTED) is too harsh for a
 * property the lister already published to Browse, so absent settings are
 * treated as PERMISSION_BASED: the lister still decides, but the agent isn't
 * hard-blocked by a row nobody created.
 */
export async function requestPromotion(opts: { propertyId: string; subAgentId: string }): Promise<PromoteResult> {
  const property = await prisma.property.findUnique({
    where: { id: opts.propertyId },
    select: {
      id: true, title: true, status: true, boundaryVerified: true, ownerId: true, agentId: true,
      owner: { select: { id: true, name: true, email: true } },
      agent: { select: { id: true, name: true, email: true } },
      promotionSettings: { select: { promotionType: true, autoApproveAgents: true, maxSubAgents: true } },
    },
  });
  // Same invariant Browse enforces: only a published, marked listing is real.
  if (!property || property.status !== "PUBLISHED" || !property.boundaryVerified) {
    throw notFound("This listing is not available");
  }

  // Requests go to the listing agent when one exists, else the property owner.
  const lister = property.agent ?? property.owner;
  if (lister.id === opts.subAgentId) throw conflict("You already list this property");

  const mode = property.promotionSettings?.promotionType ?? "PERMISSION_BASED";
  if (mode === "RESTRICTED") {
    throw forbidden("The listing agent has restricted promotion on this property");
  }

  const dup = await prisma.promotionRequest.findFirst({
    where: { propertyId: opts.propertyId, agentId: opts.subAgentId, status: { in: ["PENDING", "APPROVED"] } },
    select: { id: true, status: true },
  });
  if (dup) throw conflict(dup.status === "APPROVED" ? "You already promote this property" : "Your request is still pending");

  // Cap is counted over APPROVED rows only — pending hopefuls don't consume a slot.
  const cap = property.promotionSettings?.maxSubAgents ?? null;
  if (cap != null) {
    const active = await prisma.promotionRequest.count({
      where: { propertyId: opts.propertyId, status: "APPROVED" },
    });
    if (active >= cap) throw conflict("This listing has reached its sub-agent limit");
  }

  const subAgent = await prisma.user.findUnique({ where: { id: opts.subAgentId }, select: { name: true, email: true } });
  const subAgentName = subAgent?.name ?? "An agent";
  const autoApprove = mode === "PUBLIC" || property.promotionSettings?.autoApproveAgents === true;

  const created = await prisma.promotionRequest.create({
    data: {
      propertyId: opts.propertyId,
      agentId: opts.subAgentId,   // the sub-agent asking
      ownerId: lister.id,         // whoever must decide
      status: autoApprove ? "APPROVED" : "PENDING",
      ...(autoApprove ? { respondedAt: new Date(), respondedBy: lister.id } : {}),
    },
    select: { id: true },
  });

  /* ---- PUBLIC / auto-approve: mint the tracked link immediately ---- */
  if (autoApprove) {
    const link = await getOrCreateShareLink({ propertyId: opts.propertyId, creatorId: opts.subAgentId, kind: "PROMO" });
    const splitPct = subAgentSplitPct();
    await Promise.all([
      publishNotification({
        userId: lister.id, kind: "tenant", title: "New sub-agent",
        body: `${subAgentName} is now promoting ${property.title}.`,
        to: "/properties", entityType: "promotionRequest", entityId: created.id,
      }),
      subAgent?.email
        ? sendBrandedEmail(subAgent.email, EmailTemplates.promotionApproved({
            subAgentName, property: property.title, splitPct, promoUrl: link.url,
          }))
        : Promise.resolve(),
    ]);
    return { status: "APPROVED", promoUrl: link.url, splitPct, requestId: created.id };
  }

  /* ---- Approval needed: the lister decides ---- */
  await Promise.all([
    publishNotification({
      userId: lister.id, kind: "tenant", title: "Promotion request",
      body: `${subAgentName} wants to promote ${property.title}.`,
      to: "/dashboard", entityType: "promotionRequest", entityId: created.id,
    }),
    sendBrandedEmail(lister.email, EmailTemplates.subAgentRequest({
      listerName: lister.name ?? "there", subAgentName, property: property.title,
    })),
  ]);
  return { status: "PENDING", requestId: created.id };
}

export interface PromotionRequestRow {
  id: string;
  createdAt: Date;
  agent: { id: string; name: string | null };
  property: { id: string; title: string };
}

/** Pending requests across everything the caller lists (owner or agent). */
export async function listPromotionRequests(listerId: string): Promise<PromotionRequestRow[]> {
  return prisma.promotionRequest.findMany({
    where: { ownerId: listerId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, createdAt: true,
      agent: { select: { id: true, name: true } },
      property: { select: { id: true, title: true } },
    },
  });
}

async function ownedRequest(requestId: string, listerId: string) {
  const req = await prisma.promotionRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true, status: true, propertyId: true, agentId: true, ownerId: true,
      agent: { select: { id: true, name: true, email: true } },
      property: { select: { id: true, title: true } },
    },
  });
  if (!req) throw notFound("Request not found");
  if (req.ownerId !== listerId) throw forbidden("Not your request");
  if (req.status !== "PENDING") throw conflict("This request was already decided");
  return req;
}

export async function approvePromotion(requestId: string, listerId: string): Promise<{ promoUrl: string; splitPct: number }> {
  const req = await ownedRequest(requestId, listerId);
  await prisma.promotionRequest.update({
    where: { id: requestId },
    data: { status: "APPROVED", respondedAt: new Date(), respondedBy: listerId },
  });

  // Approval is what mints the tracked link — commission attribution depends on it.
  const link = await getOrCreateShareLink({ propertyId: req.propertyId, creatorId: req.agentId, kind: "PROMO" });
  const splitPct = subAgentSplitPct();

  await Promise.all([
    publishNotification({
      userId: req.agentId, kind: "tenant", title: "Promotion approved",
      body: `You can now promote ${req.property.title} — your tracked link is ready in My Listings.`,
      to: "/properties", entityType: "promotionRequest", entityId: requestId,
    }),
    sendBrandedEmail(req.agent.email, EmailTemplates.promotionApproved({
      subAgentName: req.agent.name ?? "there", property: req.property.title, splitPct, promoUrl: link.url,
    })),
  ]);
  return { promoUrl: link.url, splitPct };
}

export async function declinePromotion(requestId: string, listerId: string, reason?: string): Promise<{ id: string }> {
  const req = await ownedRequest(requestId, listerId);
  await prisma.promotionRequest.update({
    where: { id: requestId },
    // enum member is REJECTED; the reason column is rejectionReason
    data: { status: "REJECTED", respondedAt: new Date(), respondedBy: listerId, rejectionReason: reason ?? null },
  });

  await Promise.all([
    publishNotification({
      userId: req.agentId, kind: "tenant", title: "Promotion request declined",
      body: `${req.property.title}${reason ? ` — ${reason}` : ""}`,
      to: "/properties", entityType: "promotionRequest", entityId: requestId,
    }),
    sendBrandedEmail(req.agent.email, EmailTemplates.promotionDeclined({
      subAgentName: req.agent.name ?? "there", property: req.property.title, reason,
    })),
  ]);
  return { id: req.id };
}
