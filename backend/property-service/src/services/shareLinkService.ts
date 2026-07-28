// backend/property-service/src/services/shareLinkService.ts
// ============================================================
// Share & promo links — DB-backed, unique, attributable.
//   SHARE — lister's "Share" button:      newcondo.homes/share/{userCode}-{suffix}
//   PROMO — approved sub-agent's link:    newcondo.homes/share/{userCode}-{suffix}
// The creator's unique code is IN the url and the full code is unique in the
// DB, so every visit/click/payment is attributable to exactly one creator.
// A PROMO link's creatorId is what pins Payment.subAgentId at checkout —
// commission can never be credited to the wrong agent.
//
// BUILD NOTES:
//  • The referral-code helper is inlined here (was imported from
//    @newcondo/referral-service, which property-service does not depend on —
//    TS2307). Same algorithm, same User.referralCode column, so a code minted
//    on either side is identical.
//  • PromotionRequest's sub-agent column is `agentId` (not subAgentId).
// ============================================================
import { randomBytes } from "crypto";
import { prisma } from "@newcondo/db";
import { forbidden, notFound } from "@newcondo/backend-shared";

const suffix = () => randomBytes(3).toString("base64url").replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toLowerCase();

/** Stable per-user code, minted once and reused by referrals + share links. */
async function getOrCreateUserCode(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true, name: true } });
  if (!user) throw notFound("User not found");
  if (user.referralCode) return user.referralCode.toLowerCase();

  const base = (user.name ?? "nc").replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "NC";
  for (let i = 0; i < 5; i++) {
    const code = `${base}-${randomBytes(2).toString("hex").toUpperCase()}`;
    try {
      await prisma.user.update({ where: { id: userId }, data: { referralCode: code } });
      return code.toLowerCase();
    } catch { /* unique collision — retry */ }
  }
  throw new Error("Could not mint a unique user code");
}

export interface ShareLinkResult { code: string; url: string }

/** Create (or reuse) the caller's share link for a property. */
export async function getOrCreateShareLink(opts: {
  propertyId: string; creatorId: string; kind: "SHARE" | "PROMO";
}): Promise<ShareLinkResult> {
  const property = await prisma.property.findUnique({
    where: { id: opts.propertyId },
    select: { id: true, title: true, ownerId: true, agentId: true, status: true },
  });
  if (!property) throw notFound("Property not found");

  if (opts.kind === "SHARE" && property.ownerId !== opts.creatorId && property.agentId !== opts.creatorId) {
    throw forbidden("Only the owner or listing agent can share this property");
  }
  if (opts.kind === "PROMO") {
    const approved = await prisma.promotionRequest.findFirst({
      where: { propertyId: opts.propertyId, agentId: opts.creatorId, status: "APPROVED" },
      select: { id: true },
    });
    if (!approved) throw forbidden("You need an approved promotion request for this property");
  }

  const existing = await prisma.shareLink.findFirst({
    where: { propertyId: opts.propertyId, creatorId: opts.creatorId, kind: opts.kind },
    select: { code: true },
  });
  if (existing) return { code: existing.code, url: `https://newcondo.homes/share/${existing.code}` };

  const userCode = await getOrCreateUserCode(opts.creatorId);
  for (let i = 0; i < 5; i++) {
    const code = `${userCode}-${suffix()}`;
    try {
      const link = await prisma.shareLink.create({
        data: { code, kind: opts.kind, propertyId: opts.propertyId, creatorId: opts.creatorId },
        select: { code: true },
      });
      return { code: link.code, url: `https://newcondo.homes/share/${link.code}` };
    } catch { /* unique collision — retry */ }
  }
  throw new Error("Could not mint a unique share code");
}

export interface ResolvedShareLink {
  shareCode: string;
  attribution: { kind: string; creatorId: string; creatorName: string | null; creatorRole: string };
  property: {
    id: string; title: string; description: string | null;
    address: string | null; city: string | null; state: string | null;
    price: number; propertyType: string; structure: string;
    isAvailable: boolean; isVerified: boolean; status: string;
    owner: { name: string | null }; agent: { name: string | null } | null;
    units: { label: string; status: string; price: number }[];
    images: string[];
  };
}

/** PUBLIC: resolve a share code → property payload + attribution. Counts the click. */
export async function resolveShareLink(code: string): Promise<ResolvedShareLink> {
  const link = await prisma.shareLink.findUnique({
    where: { code },
    select: {
      kind: true,
      creator: { select: { id: true, name: true, role: true } },
      property: {
        select: {
          id: true, title: true, description: true, address: true, city: true, state: true,
          price: true, propertyType: true, structure: true, isAvailable: true,
          boundaryVerified: true, status: true,
          owner: { select: { name: true } },
          agent: { select: { name: true } },
          units: { select: { unitNumber: true, status: true, price: true } },
          images: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }], select: { url: true } },
        },
      },
    },
  });
  if (!link) throw notFound("This link is not valid");

  // fire-and-forget click count — never block the page render
  prisma.shareLink.update({ where: { code }, data: { clicks: { increment: 1 } } }).catch(() => {});

  const p = link.property;
  return {
    shareCode: code,
    attribution: { kind: link.kind, creatorId: link.creator.id, creatorName: link.creator.name, creatorRole: link.creator.role },
    property: {
      id: p.id, title: p.title, description: p.description,
      address: p.address, city: p.city, state: p.state,
      price: Number(p.price ?? 0), propertyType: String(p.propertyType), structure: String(p.structure),
      isAvailable: p.isAvailable, isVerified: p.boundaryVerified, status: String(p.status),
      owner: { name: p.owner.name }, agent: p.agent ? { name: p.agent.name } : null,
      units: p.units.map((u) => ({ label: u.unitNumber, status: String(u.status), price: Number(u.price ?? p.price ?? 0) })),
      images: p.images.map((i) => i.url),
    },
  };
}
