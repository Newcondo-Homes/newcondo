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

export async function requestPromotion(opts: { propertyId: string; subAgentId: string }) {
  const property = await prisma.property.findUnique({
    where: { id: opts.propertyId },
    select: {
      id: true, title: true, status: true, ownerId: true, agentId: true,
      owner: { select: { id: true, name: true, email: true } },
      agent: { select: { id: true, name: true, email: true } },
    },
  });
  if (!property || property.status !== "PUBLISHED") throw notFound("This listing is not available");

  // Requests go to the listing agent when one exists, else the property owner.
  const lister = property.agent ?? property.owner;
  if (lister.id === opts.subAgentId) throw conflict("You already list this property");

  const dup = await prisma.promotionRequest.findFirst({
    where: { propertyId: opts.propertyId, agentId: opts.subAgentId, status: { in: ["PENDING", "APPROVED"] } },
    select: { id: true, status: true },
  });
  if (dup) throw conflict(dup.status === "APPROVED" ? "You already promote this property" : "Your request is still pending");

  const subAgent = await prisma.user.findUnique({ where: { id: opts.subAgentId }, select: { name: true } });
  const subAgentName = subAgent?.name ?? "An agent";

  const created = await prisma.promotionRequest.create({
    data: {
      propertyId: opts.propertyId,
      agentId: opts.subAgentId,   // the sub-agent asking
      ownerId: lister.id,         // whoever must decide
      status: "PENDING",
    },
    select: { id: true },
  });

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
  return created;
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
