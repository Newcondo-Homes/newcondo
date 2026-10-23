// backend/vendor-service/src/services/serviceability.ts
// "Is this property on an active subscription?" — the gate every visit,
// code and payout passes. Same rule as matchingService.isServiceable.
import { prisma } from "@newcondo/db";

export async function isServiceableLine(propertyId: string): Promise<boolean> {
  const p = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { suspendedBySubscription: true, offPlanAt: true, owner: { select: { deletedAt: true } }, subscriptionLine: { select: { status: true, subscription: { select: { status: true } } } } },
  });
  const l = p?.subscriptionLine;
  return !!p && !!l && l.status === "ACTIVE" && ["ACTIVE", "TRIAL"].includes(l.subscription.status) && !p.suspendedBySubscription && !p.offPlanAt && !p.owner.deletedAt;
}

/** Owner, listing agent or active tenant — the people who may see a property's visits. */
export async function hasPropertyAccess(propertyId: string, userId: string): Promise<boolean> {
  const n = await prisma.property.count({ where: { id: propertyId, OR: [{ ownerId: userId }, { agentId: userId }, { rentals: { some: { renterId: userId, status: "ACTIVE" } } }] } });
  return n > 0;
}
