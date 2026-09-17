// backend/auth-service/src/services/accountAnonymization.service.ts
// ============================================================
// ERASURE. Runs 21 days after the request, from processAccountDeletions.ts.
// Irreversible. Nothing here asks a question or sends the user anywhere — by
// the time it runs the decision is made and the window has closed.
//
// THE RULE: erase the PERSON, keep the LEDGER.
// After this runs, no row anywhere identifies the human being. What survives is
// a pseudonymous shell with the financial and legal relationships still hanging
// off it — exactly the carve-out /privacy §12–13 already publishes. Deleting
// the User row instead would orphan the landlord's tenancy history, the agent's
// earnings, Flutterwave's settlement trail and our own AML records; i.e. it
// would destroy OTHER people's data to satisfy one person's request.
//
// THE THREE ROLES DIVERGE, and that is the heart of this file:
//
//   OWNER   holds the most: properties, S3 photos, ownership documents, GPS
//           boundaries, tenancies belonging to renters, marking history agents
//           were paid for. Properties with no money attached are deleted
//           outright (photos and S3 objects with them). The rest are CLOSED and
//           de-identified: photos destroyed, ownership docs destroyed, address
//           generalized to city level, GPS coarsened to a ~1 km grid — the
//           treatment /privacy §12 already promises for property location.
//
//   AGENT   holds other people's listings. We never delete those: the agent is
//           DETACHED from them (same effect as resignAsListingAgent), promo and
//           share links die, queue slots are released, and completed marking
//           jobs survive as anonymous work records because the OWNER paid for
//           them and the payout is a financial fact.
//
//   RENTER  holds the least of their own and the most of someone else's: their
//           rent receipts are also the landlord's records. Rentals and payments
//           survive with the renter de-identified; unused invites go.
//
// S3: two buckets (shared/utils/s3Layout.ts). Private documents are deleted
// unconditionally — identity documents are the most sensitive thing we hold.
// Public property media is deleted with, or de-linked from, the listing.
// Object deletes are best-effort and happen AFTER the transaction commits: a
// failed S3 call must never roll back a completed erasure. An orphaned object
// is a cost problem; a half-erased account is a compliance one.
//
// SCHEMA NOTES — the traps in this schema, all of which bit the first draft:
//   • Json? columns (Property.boundaryCoordinates, the request snapshot) cannot
//     be cleared through the typed client here: `undefined` means "don't touch
//     this column" and silently does nothing, while a bare `null` is rejected
//     (Prisma wants Prisma.DbNull) — and in THIS repo `@prisma/client` resolves
//     to a d.ts that exports `Prisma` as a TYPE only, so Prisma.DbNull is not
//     available as a value (TS1362). Both clears therefore go through
//     $executeRaw, which is also the least surprising thing to read.
//   • ShareLink has no isActive column; links can only be deleted.
//   • TenantInvite holds no email/phone — only tokenHash, ids and dates.
//   • SupportTicket holds no email/phone either; the personal data lives in the
//     free-text title and description, so those are redacted.
//   • EventLog.userId is nullable → SetNull keeps the analytics row and drops
//     the identity, which is what /privacy §12 promises.
//   • AgentInvite links the agent by agentId/agentEmail, the owner by ownerId.
//   • PromotionRequest's requester field is agentId, not requesterId.
//   • MarkingJobStatus has no PENDING — an unstarted job returns to QUEUED.
//   • FeatureFlag and ServiceSubscription also hang off User and must be swept.
// ============================================================
import { prisma } from "@newcondo/db";
import { ACCOUNT_DELETION, purgeDateFor, deleteObject, sendBrandedEmail } from "@newcondo/backend-shared";
import { accountDeletionCompletedEmail } from "@newcondo/backend-shared";

export interface ErasureResult {
  userId: string;
  role: string;
  documentsDeleted: number;
  photosDeleted: number;
  propertiesDeleted: number;
  propertiesClosed: number;
  s3ObjectsDeleted: number;
  purgeAfter: Date;
}

/** Coarsen "6.4531,3.3958" to a ~1 km grid — the generalization /privacy §12
 *  promises for property location. Two decimals ≈ 1.1 km. */
function coarsenGps(gps: string | null): string | null {
  if (!gps) return null;
  const parts = gps.split(",").map((p) => Number(p.trim()));
  if (parts.length !== 2 || parts.some(Number.isNaN)) return null;
  return `${parts[0].toFixed(2)},${parts[1].toFixed(2)}`;
}

/* ============================================================
   OWNER
   ============================================================ */
async function eraseOwnerEstate(userId: string) {
  const properties = await prisma.property.findMany({
    where: { ownerId: userId },
    select: {
      id: true,
      city: true,
      state: true,
      gpsCoordinates: true,
      boundaryImages: true,
      boundaryMaskImageKey: true,
      images: { select: { id: true, url: true } },
      documents: { select: { id: true, s3Key: true } },
    },
  });

  const s3Keys: string[] = [];
  let photosDeleted = 0;
  let deleted = 0;
  let closed = 0;

  for (const p of properties) {
    // Does anything financial or third-party hang off this listing? Same test
    // deletePropertyService uses, so the two paths can never disagree.
    // A promo conversion is a paid commission on someone else's payment. If any
    // exist, the listing MUST survive — deleting it would destroy a third-party
    // agent's earnings record, not the owner's own data.
    const [paidPayments, paidMarking, anyRental, conversions] = await Promise.all([
      prisma.payment.count({
        where: { rental: { propertyId: p.id }, status: { in: ["SUCCESS", "HELD", "RELEASED", "REFUNDED"] } },
      }),
      prisma.propertyMarkingJob.count({ where: { propertyId: p.id, paymentStatus: "SUCCESS" } }),
      prisma.rental.count({ where: { propertyId: p.id } }),
      prisma.agentReferralConversion.count({ where: { referral: { propertyId: p.id } } }),
    ]);
    const mustSurvive = paidPayments > 0 || paidMarking > 0 || anyRental > 0 || conversions > 0;

    // Media and documents go in BOTH branches — a closed listing keeps its
    // financial history, never its photographs or title documents.
    s3Keys.push(
      ...p.images.map((i) => i.url),
      ...p.documents.map((d) => d.s3Key).filter((k): k is string => !!k),
      ...(p.boundaryImages ?? []),
      ...(p.boundaryMaskImageKey ? [p.boundaryMaskImageKey] : [])
    );
    photosDeleted += p.images.length;

    if (!mustSurvive) {
      // Nothing is owed to anybody — the listing goes completely. Order matters:
      // Property.ownerId and the child FKs are Restrict, so every child must be
      // gone before the parent delete. PropertyUnit, PropertyUnitImage,
      // ShareLink, PropertyPromotionSettings and ServiceJob cascade from
      // Property, but they are named explicitly so the intent survives a future
      // schema change that drops a cascade.
      await prisma.$transaction([
        prisma.propertyImage.deleteMany({ where: { propertyId: p.id } }),
        prisma.document.deleteMany({ where: { propertyId: p.id } }),
        prisma.shareLink.deleteMany({ where: { propertyId: p.id } }),
        prisma.tenantInvite.deleteMany({ where: { propertyId: p.id } }),
        prisma.promotionRequest.deleteMany({ where: { propertyId: p.id } }),
        prisma.propertyPromotionSettings.deleteMany({ where: { propertyId: p.id } }),
        // PropertyDuplicate has no propertyId column — originalPropertyId is the
        // FK, duplicatePropertyId is a bare string. Both are cleared.
        prisma.propertyDuplicate.deleteMany({
          where: { OR: [{ originalPropertyId: p.id }, { duplicatePropertyId: p.id }] },
        }),
        // Safe here only because mustSurvive already proved there are no
        // conversions hanging off these rows.
        prisma.agentReferral.deleteMany({ where: { propertyId: p.id } }),
        prisma.serviceJob.deleteMany({ where: { propertyId: p.id } }),
        prisma.paymentAttemptLog.deleteMany({ where: { propertyId: p.id } }),
        prisma.virtualAccount.deleteMany({ where: { propertyId: p.id } }),
        prisma.markingQueueEntry.deleteMany({ where: { job: { propertyId: p.id } } }),
        prisma.propertyMarkingJob.deleteMany({ where: { propertyId: p.id } }),
        prisma.propertyUnitImage.deleteMany({ where: { unit: { propertyId: p.id } } }),
        prisma.propertyUnit.deleteMany({ where: { propertyId: p.id } }),
        prisma.property.delete({ where: { id: p.id } }),
      ]);
      deleted++;
      continue;
    }

    // Survives as a CLOSED, de-identified listing: the money and tenancy trail
    // is intact, but nothing about it points at a person or a front door.
    await prisma.$transaction([
      prisma.propertyImage.deleteMany({ where: { propertyId: p.id } }),
      prisma.document.deleteMany({ where: { propertyId: p.id } }),
      prisma.shareLink.deleteMany({ where: { propertyId: p.id } }),
      prisma.tenantInvite.deleteMany({ where: { propertyId: p.id, usedAt: null } }),
      prisma.promotionRequest.deleteMany({ where: { propertyId: p.id } }),
      prisma.property.update({
        where: { id: p.id },
        data: {
          status: "UNAVAILABLE",
          isAvailable: false,
          // Street-level address is the owner's personal data; city and state
          // are what the retained financial record actually needs.
          address: `${p.city}, ${p.state}`,
          gpsCoordinates: coarsenGps(p.gpsCoordinates),
          boundaryVerified: false,
          boundaryImages: [],
          boundaryMaskImageKey: null,
          boundaryMarkedBy: null,
          buildingFingerprint: null,
          shareableLink: null,
          description: "This listing was closed when the owner deleted their Newcondo account.",
        },
      }),
      // The boundary polygon is a Json? column — see the header note on why this
      // is raw rather than Prisma.DbNull.
      prisma.$executeRaw`UPDATE "Property" SET "boundaryCoordinates" = NULL WHERE "id" = ${p.id}`,
    ]);
    closed++;
  }

  return { s3Keys, photosDeleted, deleted, closed };
}

/* ============================================================
   AGENT
   ============================================================ */
async function eraseAgentEstate(userId: string) {
  const listings = await prisma.property.count({ where: { agentId: userId } });

  // referralCode is @unique per AgentReferral row, so each needs its own value.
  const referrals = await prisma.agentReferral.findMany({
    where: { agentId: userId },
    select: { id: true },
  });

  await prisma.$transaction([
    // Detach from every listing. The owner gets their property back as a direct
    // listing and can invite another agent — identical to resignAsListingAgent.
    prisma.property.updateMany({
      where: { agentId: userId },
      data: { agentId: null, isOwnerListing: true },
    }),
    // ShareLink has no isActive — delete. The creator's referralCode is inside
    // the URL, so a surviving link would still carry their code.
    prisma.shareLink.deleteMany({ where: { creatorId: userId } }),
    // PromotionRequest's requester field is agentId. Approved ones are deleted
    // too: approval only grants a promo link, and the link is gone.
    prisma.promotionRequest.deleteMany({ where: { agentId: userId } }),
    prisma.markingQueueEntry.deleteMany({ where: { agentId: userId } }),
    // AgentReferral is the sub-agent COMMISSION LEDGER: its conversion children
    // (AgentReferralConversion, ReferralConversion) hold amount + commission per
    // payment, which is both the agent's earnings record and Newcondo's own
    // revenue reconciliation. Deleting the parent cascades all of it away, so we
    // deactivate instead. referralCode is @unique and required, so it is rotated
    // rather than nulled — which also stops every old promo URL resolving to
    // this person, the same reason User.referralCode is rotated.
    prisma.agentReferral.updateMany({
      where: { agentId: userId },
      data: { isActive: false },
    }),
    // Clicks are third-party analytics — de-identify, don't destroy.
    prisma.agentReferralClick.updateMany({
      where: { referral: { agentId: userId } },
      data: { ipAddress: null, userAgent: null, referrerUrl: null },
    }),
    prisma.referralClick.updateMany({
      where: { referral: { agentId: userId } },
      data: { ipAddress: null, userAgent: null, referrerUrl: null, convertedUserId: null },
    }),
    // Invites addressed to this agent that were never accepted.
    prisma.agentInvite.deleteMany({ where: { agentId: userId, usedAt: null } }),
    prisma.ownerAgentLink.deleteMany({ where: { agentId: userId } }),
    // Marking jobs the agent never started go back to the pool so the owner
    // isn't left waiting on a ghost. MarkingJobStatus has no PENDING — QUEUED.
    prisma.propertyMarkingJob.updateMany({
      where: { assignedAgentId: userId, status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
      data: { assignedAgentId: null, status: "QUEUED", assignedAt: null, timeSlotExpiry: null },
    }),
    // COMPLETED jobs keep assignedAgentId: it points at the anonymous shell,
    // and the marking fee attached to it is a financial record, not a profile.
  ]);

  // Rotate each promo code/link out of circulation. Done after the transaction
  // because each row needs a distinct @unique value.
  for (const r of referrals) {
    await prisma.agentReferral
      .update({
        where: { id: r.id },
        data: { referralCode: `deleted-${r.id}`, referralLink: "" },
      })
      .catch((e) => console.error(`[eraseAgentEstate] code rotation failed for ${r.id}`, e));
  }

  return { detachedListings: listings, referralsDeactivated: referrals.length };
}

/* ============================================================
   RENTER
   ============================================================ */
async function eraseRenterEstate(userId: string) {
  await prisma.$transaction([
    // An unused invite is just a token pointing at a person. TenantInvite holds
    // no email/phone column — the identity IS renterId, so the row goes.
    prisma.tenantInvite.deleteMany({ where: { renterId: userId, usedAt: null } }),
    // Ended tenancies survive — they are the landlord's record too — with the
    // renter reduced to an anonymous key via the User row.
  ]);
  return { ok: true };
}

/* ============================================================
   THE COMMON ERASURE + ORCHESTRATION
   ============================================================ */
export async function anonymizeUser(userId: string, opts: { dryRun?: boolean } = {}): Promise<ErasureResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      image: true,
      anonymizedAt: true,
      documents: { select: { id: true, s3Key: true } },
    },
  });
  if (!user) throw new Error(`anonymizeUser: ${userId} not found`);
  if (user.anonymizedAt) {
    throw new Error(`anonymizeUser: ${userId} already anonymized at ${user.anonymizedAt.toISOString()}`);
  }

  const realEmail = user.email;
  const realName = user.name;
  const now = new Date();
  const purgeAfter = purgeDateFor(now);

  let estateKeys: string[] = [];
  let photosDeleted = 0;
  let propertiesDeleted = 0;
  let propertiesClosed = 0;

  if (opts.dryRun) {
    console.log(`[anonymizeUser] DRY RUN ${userId} (${user.role}) — ${user.documents.length} documents`);
  }

  if (!opts.dryRun) {
    if (user.role === "OWNER") {
      const r = await eraseOwnerEstate(userId);
      estateKeys = r.s3Keys;
      photosDeleted = r.photosDeleted;
      propertiesDeleted = r.deleted;
      propertiesClosed = r.closed;
    } else if (user.role === "AGENT") {
      await eraseAgentEstate(userId);
    } else if (user.role === "RENTER") {
      await eraseRenterEstate(userId);
    }

    // Free-text support tickets are redacted separately: the personal data is
    // inside prose we can't null out per-column.
    const tickets = await prisma.supportTicket.findMany({ where: { userId }, select: { id: true } });

    await prisma.$transaction([
      // ---- identity: nulled in place ----
      prisma.user.update({
        where: { id: userId },
        data: {
          name: ACCOUNT_DELETION.tombstone.name,
          // email is NOT NULL and unique — tombstoned, not nulled, which also
          // frees the real address for a genuine future signup.
          email: `deleted-${userId}@${ACCOUNT_DELETION.tombstone.emailDomain}`,
          phone: null,
          image: null,
          passwordHash: null,
          bvn: null,
          dateOfBirth: null,
          address: null,
          city: null,
          state: null,
          companyName: null,
          businessRegNumber: null,
          isB2BCustomer: false,
          emailVerified: null,
          phoneVerified: null,
          verificationStatus: "PENDING",
          verificationRejectionReason: null,
          verifiedAt: null,
          verifiedBy: null,
          agentServiceAreas: [],
          agentReliabilityScore: null,
          isAvailableForMarking: false,
          isPremium: false,
          premiumExpiresAt: null,
          autoPayoutMode: "OFF",
          // The referral code appears inside every share/promo URL — rotate it
          // so old links stop resolving to this person.
          referralCode: `deleted-${userId}`,
          deletedAt: now,
          anonymizedAt: now,
          purgeAfter,
        },
      }),

      // ---- identity documents: rows AND objects. NIN/BVN/ID scans are the
      // most sensitive thing we hold; nothing justifies keeping them. ----
      prisma.document.deleteMany({ where: { userId } }),

      // ---- every credential and route back in ----
      prisma.account.deleteMany({ where: { userId } }), // severs Facebook / Google
      prisma.session.deleteMany({ where: { userId } }),
      prisma.refreshToken.deleteMany({ where: { userId } }),
      prisma.authenticator.deleteMany({ where: { userId } }),
      prisma.oTPCode.deleteMany({ where: { identifier: realEmail } }),
      prisma.featureFlag.deleteMany({ where: { userId } }),

      // ---- contactable surfaces ----
      prisma.notification.deleteMany({ where: { userId } }),
      prisma.supportTicket.updateMany({
        where: { id: { in: tickets.map((t) => t.id) } },
        data: {
          title: "Redacted — account deleted",
          description: "The account holder deleted their account; this ticket's contents were erased.",
          adminResponse: null,
        },
      }),

      // ---- payment instruments (tokens, never card numbers) ----
      prisma.bankAccount.deleteMany({ where: { userId } }),
      prisma.virtualAccount.updateMany({ where: { userId }, data: { isActive: false } }),

      // ---- the owner's own invites and links ----
      prisma.agentInvite.deleteMany({ where: { ownerId: userId } }),
      prisma.ownerAgentLink.deleteMany({ where: { ownerId: userId } }),
      prisma.tenantInvite.deleteMany({ where: { inviterId: userId, usedAt: null } }),
      prisma.serviceSubscription.deleteMany({ where: { ownerId: userId } }),

      // ---- behavioural logs: de-identified, not deleted, per /privacy §12
      // ("summarized into de-identified statistical data"). EventLog.userId is
      // nullable, so SetNull keeps the analytics and drops the person. ----
      prisma.eventLog.updateMany({
        where: { userId },
        data: { userId: null, ipAddress: null, userAgent: null },
      }),
      prisma.paymentAttemptLog.updateMany({
        where: { userId },
        data: { ipAddress: null, userAgent: null },
      }),

      // ---- the request itself ----
      prisma.accountDeletionRequest.updateMany({
        where: { userId, status: "PENDING" },
        data: {
          status: "ANONYMIZED",
          anonymizedAt: now,
          purgeAfter,
          documentsDeleted: user.documents.length,
          photosDeleted,
          propertiesClosed,
        },
      }),
    ]);
  }

  // ---- S3, after the commit, best-effort ----
  const keys = [
    ...user.documents.map((d) => d.s3Key).filter((k): k is string => !!k),
    ...(user.image && user.image.startsWith("users/") ? [user.image] : []),
    ...estateKeys,
  ];
  let s3ObjectsDeleted = 0;
  if (!opts.dryRun) {
    // Counts for the completion email, read BEFORE the erasure destroys them.
    const req = await prisma.accountDeletionRequest.findFirst({
      where: { userId, status: "ANONYMIZED" },
      orderBy: { anonymizedAt: "desc" },
      select: { snapshot: true },
    });

    await Promise.all(
      keys.map((k) =>
        deleteObject(k)
          .then(() => {
            s3ObjectsDeleted++;
          })
          .catch((e) => console.error(`[anonymizeUser] S3 delete failed for ${k}`, e))
      )
    );

    // Confirmation by email, sent LAST and to the address held in memory —
    // the row no longer has it. /privacy §13: "We confirm completion by email."
    await sendBrandedEmail(
      realEmail,
      accountDeletionCompletedEmail({
        name: realName ?? "there",
        role: user.role,
        retentionMonths: ACCOUNT_DELETION.retentionMonths,
        purgeDate: purgeAfter,
        counts: (req?.snapshot as Record<string, number> | null) ?? undefined,
      })
    ).catch((e) => console.error("[anonymizeUser] completion email failed", e));
  }

  const result: ErasureResult = {
    userId,
    role: user.role,
    documentsDeleted: user.documents.length,
    photosDeleted,
    propertiesDeleted,
    propertiesClosed,
    s3ObjectsDeleted,
    purgeAfter,
  };
  console.log("[anonymizeUser]", JSON.stringify(result));
  return result;
}

/* ============================================================
   FINAL PURGE — 18 months after erasure.
   By now the row identifies nobody. What we remove is the residual structure:
   the shell itself where nothing hangs off it, and the last non-statutory rows
   where something does.

   Statutory records (Payment, PlatformRevenue, SubscriptionInvoice) are NOT
   touched here — they run out their own tax/AML clock in isolated archive
   storage.

   IMPORTANT: every relation the schema marks Restrict will make user.delete()
   throw. That is the safety net working, not a bug — but it means the
   "can I delete the row?" test has to count EVERY restricted relation, not
   just the obviously financial ones. Miss one and the purge throws nightly
   forever.
   ============================================================ */
export async function purgeAnonymizedUser(userId: string, opts: { dryRun?: boolean } = {}) {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      anonymizedAt: true,
      purgeAfter: true,
      _count: {
        select: {
          // financial / statutory
          payments: true,
          subAgentPayments: true,
          rentals: true,
          invitedRentals: true,
          subscriptionInvoices: true,
          subscriptionHistory: true,
          properties: true,
          // audit / legal — all Restrict
          disputes: true,
          disputeComments: true,
          disputeEvidences: true,
          supportTickets: true,
          adminActions: true,
          rewards: true,
          agentReferrals: true,
          requestedServiceJobs: true,
          requestedMarkingJobs: true,
          assignedMarkingJobs: true,
          paymentAttemptLogs: true,
          agentListings: true,
          virtualAccounts: true,
        },
      },
    },
  });
  if (!u) return { userId, purged: false, reason: "not found" as const };
  if (!u.anonymizedAt) return { userId, purged: false, reason: "not anonymized" as const };
  if (u.purgeAfter && u.purgeAfter > new Date()) return { userId, purged: false, reason: "not due" as const };

  // Anything still pointing at this user through a Restrict relation.
  const blockingRows = Object.values(u._count).reduce((a, b) => a + b, 0);

  if (opts.dryRun) {
    return {
      userId,
      purged: false,
      reason: blockingRows > 0 ? (`would strip shell (${blockingRows} rows)` as const) : ("would delete row" as const),
    };
  }

  const now = new Date();

  if (blockingRows === 0) {
    // Nothing is owed to anyone and nothing points here. The row goes, and the
    // Cascade relations (Account, Session, Document, Notification, BankAccount,
    // Subscription, ServiceSubscription, FeatureFlag, AccountDeletionRequest)
    // go with it. Referral is Restrict on both sides, so clear it first.
    await prisma.$transaction([
      prisma.referralReward.deleteMany({ where: { userId } }),
      prisma.referral.deleteMany({ where: { OR: [{ referrerId: userId }, { referredId: userId }] } }),
      prisma.virtualAccount.deleteMany({ where: { userId } }),
      prisma.shareLink.deleteMany({ where: { creatorId: userId } }),
      prisma.markingQueueEntry.deleteMany({ where: { agentId: userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);
    return { userId, purged: true, mode: "row-deleted" as const };
  }

  // The shell has to stay so the ledger stays referentially whole. Strip it to
  // a bare key: a cuid, a role, and the dates. Nothing here was identifying
  // after anonymization — this is belt-and-braces plus the last free-text.
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        userType: null,
        country: null,
        agentServiceAreas: [],
        totalMarkingJobs: 0,
        completedMarkingJobs: 0,
        purgedAt: now,
      },
    }),
    prisma.virtualAccount.deleteMany({ where: { userId, balance: 0 } }),
    prisma.accountDeletionRequest.updateMany({
      where: { userId },
      data: { status: "PURGED", purgedAt: now, requestIp: null, userAgent: null },
    }),
    // snapshot is Json? — raw, per the header note.
    prisma.$executeRaw`UPDATE "AccountDeletionRequest" SET "snapshot" = NULL WHERE "userId" = ${userId}`,
  ]);
  return { userId, purged: true, mode: "shell-stripped" as const };
}
