// backend/property-service/src/services/agentInviteService.ts
// ============================================================
// Owner → Agent listing invitations.
// Rule: an agent can ONLY list for a property owner who invited them. The
// owner registers + subscribes first (rent settles to THEIR account), then
// invites their agent by link. Accepting creates an OwnerAgentLink — the
// source of the "choose the property owner" dropdown in New Listing.
// Tokens: sha256-hashed at rest, single-use, 14-day expiry.
//
// BUILD NOTES:
//  • User has no `subscriptionStatus` column — the plan lives on the
//    `subscription` relation (Subscription.status).
//  • User.name is nullable; email templates take `string`, so every name is
//    passed with a fallback.
//  • AppError is an interface in shared/types — throw the ServiceError
//    helpers (gone/forbidden/paymentRequired/...) instead.
// ============================================================
import { createHash, randomBytes } from "crypto";
import { prisma } from "@newcondo/db";
import {
  forbidden, gone, notFound, paymentRequired, sendEmail,
  publishNotification, sendBrandedEmail, EmailTemplates,
} from "@newcondo/backend-shared";

const hashToken = (raw: string) => createHash("sha256").update(raw).digest("hex");
const TTL_MS = 14 * 24 * 3600_000;

export interface AgentInviteResult {
  url: string;
  expiresInDays: number;
  /** true = accepted by the mail transport; false = send failed (see logs);
      undefined = no agentEmail was supplied, so nothing was sent. */
  emailSent?: boolean;
}

/** Owner creates an invite; optionally emails it straight to the agent. */
export async function createAgentInvite(opts: { ownerId: string; agentEmail?: string }): Promise<AgentInviteResult> {
  const owner = await prisma.user.findUnique({
    where: { id: opts.ownerId },
    select: { id: true, name: true, role: true, subscription: { select: { status: true } } },
  });
  if (!owner || owner.role !== "OWNER") throw forbidden("Only property owners can invite listing agents");
  // Rent must have a subscribed owner account to settle into.
  if (owner.subscription && owner.subscription.status !== "ACTIVE") {
    throw paymentRequired("An active subscription is required before inviting an agent");
  }

  const raw = randomBytes(32).toString("base64url");
  await prisma.agentInvite.create({
    data: {
      tokenHash: hashToken(raw),
      ownerId: opts.ownerId,
      agentEmail: opts.agentEmail ?? null,
      expiresAt: new Date(Date.now() + TTL_MS),
    },
  });

  const url = `${process.env.FRONTEND_URL}/agent-invite/${raw}`;
  let emailSent: boolean | undefined;
  if (opts.agentEmail) {
    // sendBrandedEmail never throws, so probe the transport directly here to
    // learn the real outcome. Import sendEmail alongside your other shared
    // imports: `import { sendEmail } from "@newcondo/backend-shared";`
    const content = EmailTemplates.agentInvite({
      ownerName: owner.name ?? "A property owner",
      inviteUrl: url,
    });
    try {
      const result = await sendEmail({
        to: opts.agentEmail,
        subject: content.subject,
        html: content.html,
      });
      emailSent = !!result?.success;
      if (!emailSent) {
        console.error(
          `[agentInvite] Mailgun rejected the invite to ${opts.agentEmail}:`,
          result?.error
        );
      }
    } catch (e) {
      emailSent = false;
      console.error(`[agentInvite] email transport threw for ${opts.agentEmail}:`, e);
    }
  }
  return { url, expiresInDays: 14, emailSent };
}

/** PUBLIC: context for the /agent-invite/[token] page. */
export async function validateAgentInvite(rawToken: string): Promise<{ ownerName: string }> {
  const invite = await prisma.agentInvite.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    select: { usedAt: true, expiresAt: true, owner: { select: { name: true } } },
  });
  if (!invite) throw notFound("This invite link is not valid");
  if (invite.usedAt) throw gone("This invite link has already been used");
  if (invite.expiresAt < new Date()) throw gone("This invite link has expired — ask the owner for a new one");
  return { ownerName: invite.owner.name ?? "A property owner" };
}

/** Agent (must hold a registered AGENT account) accepts → OwnerAgentLink. */
export async function acceptAgentInvite(rawToken: string, agentId: string): Promise<{ ownerName: string }> {
  const agent = await prisma.user.findUnique({
    where: { id: agentId },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!agent || agent.role !== "AGENT") throw forbidden("You need a Newcondo agent account to accept a listing invitation");

  const tokenHash = hashToken(rawToken);
  const result = await prisma.$transaction(async (tx) => {
    const invite = await tx.agentInvite.findUnique({
      where: { tokenHash },
      select: { ownerId: true, usedAt: true, expiresAt: true, owner: { select: { id: true, name: true, email: true } } },
    });
    if (!invite || invite.usedAt || invite.expiresAt < new Date()) throw gone("Invite link is no longer valid");

    await tx.agentInvite.update({ where: { tokenHash }, data: { usedAt: new Date(), agentId } });
    const link = await tx.ownerAgentLink.upsert({
      where: { ownerId_agentId: { ownerId: invite.ownerId, agentId } },
      update: { status: "ACTIVE" },
      create: { ownerId: invite.ownerId, agentId, status: "ACTIVE" },
      select: { id: true },
    });
    return { linkId: link.id, owner: invite.owner };
  });

  const ownerName = result.owner.name ?? "The property owner";
  await Promise.all([
    publishNotification({
      userId: result.owner.id, kind: "tenant", title: `${agent.name ?? "Your agent"} accepted your invitation`,
      body: "They can now list properties on your behalf — every listing shows in your dashboard.",
      to: "/properties", entityType: "ownerAgentLink", entityId: result.linkId,
    }),
    sendBrandedEmail(result.owner.email, EmailTemplates.agentInviteAccepted({
      ownerName, agentName: agent.name ?? "Your agent",
    })),
    publishNotification({
      userId: agentId, kind: "tenant", title: `You can now list for ${ownerName}`,
      body: "Pick them as the property owner when you create a new listing.",
      to: "/properties", entityType: "ownerAgentLink", entityId: result.linkId,
    }),
  ]);
  return { ownerName };
}

export interface LinkedOwner { ownerId: string; ownerName: string | null; linkedSince: Date }

/** Owners this agent may list for — powers the New Listing owner dropdown. */
export async function listLinkedOwners(agentId: string): Promise<LinkedOwner[]> {
  const links = await prisma.ownerAgentLink.findMany({
    where: { agentId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true, owner: { select: { id: true, name: true } } },
  });
  return links.map((l) => ({ ownerId: l.owner.id, ownerName: l.owner.name, linkedSince: l.createdAt }));
}
