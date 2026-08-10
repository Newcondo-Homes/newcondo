// backend/property-service/src/services/createPropertyService.ts
// ============================================================
// Create a listing (owner OR invited agent).
//
// INVARIANT THIS ENFORCES: a listing is born as DRAFT and can NEVER be
// browsed until it has been GPS-marked and admin-approved. publicBrowseService
// filters on `status: PUBLISHED, boundaryVerified: true, adminApprovalStatus:
// APPROVED`, and nothing in this file sets any of those — marking sets
// boundaryVerified, an admin sets adminApprovalStatus. That's what makes
// "only marked properties can be listed" true by construction rather than by
// convention.
//
// AGENT RULE: an agent may only list for an owner who invited them, i.e. an
// ACTIVE OwnerAgentLink must exist. The agent becomes the property's sole
// listing agent (Property.agentId); the owner remains Property.ownerId, so
// rent still settles to the OWNER's account.
// ============================================================
import { prisma, PropertyType } from "@newcondo/db";
import { badRequest, forbidden, publishNotification } from "@newcondo/backend-shared";

export interface CreatePropertyInput {
  title: string;
  propertyType: string;
  price: number;
  unitCount: number;
  description?: string;
  amenities?: string[];
  state: string;
  lga: string;
  area: string;
  address?: string;
  /** Agent flow only — the linked owner this listing belongs to. */
  ownerId?: string;
  /** Legal undertaking — refused without it. */
  undertaking: boolean;
  /** Agent flow only — signed owner consent. */
  ownerConsent?: boolean;
}

export interface CreatePropertyResult {
  id: string;
  title: string;
  status: "DRAFT";
  needsMarking: true;
}

export async function createProperty(
  creatorId: string,
  input: CreatePropertyInput
): Promise<CreatePropertyResult> {
  if (!input.title?.trim()) throw badRequest("Give the listing a title");
  if (!input.price || input.price <= 0) throw badRequest("Enter the yearly rent");
  if (!input.state || !input.lga || !input.area) throw badRequest("A full address is required");
  if (!input.undertaking) throw badRequest("You must accept the legal undertaking");

  const creator = await prisma.user.findUnique({
    where: { id: creatorId },
    select: { id: true, name: true, role: true, subscription: { select: { status: true } } },
  });
  if (!creator) throw forbidden("Account not found");
  if (creator.role !== "OWNER" && creator.role !== "AGENT") {
    throw forbidden("Only property owners and agents can create listings");
  }
  // Rent needs a subscribed account to settle into.
  if (creator.subscription && creator.subscription.status !== "ACTIVE") {
    throw forbidden("An active subscription is required before listing a property");
  }

  /* ---- resolve owner + listing agent ---- */
  let ownerId = creatorId;
  let agentId: string | null = null;

  if (creator.role === "AGENT") {
    if (!input.ownerId) throw badRequest("Choose the property owner this listing belongs to");
    if (!input.ownerConsent) throw badRequest("Signed owner consent is required");

    // The agent must have been invited by this owner.
    const link = await prisma.ownerAgentLink.findUnique({
      where: { ownerId_agentId: { ownerId: input.ownerId, agentId: creatorId } },
      select: { status: true },
    });
    if (!link || link.status !== "ACTIVE") {
      throw forbidden("You can only list for owners who have invited you");
    }
    ownerId = input.ownerId;
    agentId = creatorId;
  }

  /* ---- create as DRAFT (unmarked, unapproved) ---- */
  const property = await prisma.property.create({
    data: {
      title: input.title.trim(),
      // `description` is REQUIRED (non-null, no default) in the schema, so it
      // always has to be a string — empty when the wizard's optional field is
      // left blank.
      description: input.description?.trim() ?? "",
      // Enum-typed column: validate against PropertyType instead of casting
      // blindly, so a bad string fails here with a clear message rather than
      // as an opaque Prisma error.
      propertyType: (Object.values(PropertyType) as string[]).includes(input.propertyType)
        ? (input.propertyType as PropertyType)
        : PropertyType.APARTMENT,
      price: input.price,
      state: input.state,
      city: input.area,
      address: [input.address, input.area, input.lga, input.state].filter(Boolean).join(", "),
      // Schema calls this `features` (String[]), not `amenities`.
      features: input.amenities ?? [],
      ownerId,
      agentId,
      // The three gates that keep it out of Browse until it earns its way in.
      status: "DRAFT",
      boundaryVerified: false,
      adminApprovalStatus: "PENDING",
    },
    select: { id: true, title: true },
  });

  /* ---- units: payments are tracked per flat ---- */
  const count = Math.max(1, Math.floor(input.unitCount || 1));
  if (count > 1) {
    await prisma.propertyUnit.createMany({
      data: Array.from({ length: count }, (_, i) => ({
        propertyId: property.id,
        unitNumber: `Flat ${String.fromCharCode(65 + i)}`,
        status: "AVAILABLE" as const,
        price: input.price,
      })),
    });
  }

  /* ---- tell the people who need to act ---- */
  await publishNotification({
    userId: ownerId,
    kind: "marking",
    title: `${property.title} saved as a draft`,
    body: "Mark the property on the map to make it live — unmarked listings can't be browsed.",
    to: "/marking",
    entityType: "property",
    entityId: property.id,
  });
  if (agentId) {
    await publishNotification({
      userId: agentId,
      kind: "marking",
      title: `Listing created for ${property.title}`,
      body: "Next step: GPS marking. You'll be notified when it's verified.",
      to: "/marking",
      entityType: "property",
      entityId: property.id,
    });
  }

  return { id: property.id, title: property.title, status: "DRAFT", needsMarking: true };
}

/* ============================================================
   Properties this user can request marking for.

   Feeds the "Property" dropdown in the Request-marking wizard: their own
   listings that are NOT yet boundary-verified. A marked property is
   deliberately excluded — re-marking is what double-listing protection
   exists to prevent.
   ============================================================ */
export async function listUnmarkedProperties(userId: string) {
  const rows = await prisma.property.findMany({
    where: {
      OR: [{ ownerId: userId }, { agentId: userId }],
      boundaryVerified: false,
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, address: true, status: true, price: true },
  });
  return rows.map((p) => ({
    id: p.id,
    title: p.title,
    location: p.address,
    status: p.status,
    price: Number(p.price ?? 0),
    marked: false,
  }));
}
