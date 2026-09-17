// backend/auth-service/src/services/accountDeletion.service.ts
// ============================================================
// "Delete my account" — the request side: preview, request, cancel, status.
// The erasure itself lives in accountAnonymization.service.ts and runs from a
// cron job 21 days later, never inline with the click.
//
// WHY A GRACE WINDOW AND NOT AN IMMEDIATE WIPE
//   • Account takeover. If a stolen session could erase an owner's listings,
//     marking history and payout details in one tap, the attack is
//     unrecoverable. A 21-day reversible lock-out makes it recoverable while
//     landing the erasure inside the 30 days /privacy §13 promises — the 9-day
//     gap is the margin that stops a couple of failed cron runs from turning a
//     published commitment into a breach. 21 is the ceiling, not a preference:
//     see ACCOUNT_DELETION.graceDays for why it cannot go to 30.
//   • Regret. Most deletions are "I found a place" — the renter is back in four
//     months. Reactivation is one sign-in during the window.
//
// WHAT HAPPENS AT DAY 0 (this file): the account is DEACTIVATED. Sessions and
// refresh tokens die, login is refused, listings stop being served, auto-payout
// is switched off, subscription auto-renew is switched off (the current period
// is NOT refunded — /refund §03, and the dialog says so before confirming).
//
// EVERY QUERY HERE IS SCHEMA-EXACT. Notes where the schema differs from the
// obvious guess, because these are the bugs that only surface in production:
//   • Dispute has renterId, NOT userId — an owner or agent is a party to a
//     dispute only through rental.property, so the lookup is role-shaped.
//   • DisputeStatus is PENDING | UNDER_REVIEW | INVESTIGATING | RESOLVED |
//     REJECTED | CANCELLED. There is no OPEN and no ESCALATED.
//   • PaymentStatus is PENDING | SUCCESS | FAILED | CANCELLED | REFUNDED |
//     HELD | RELEASED. There is no PROCESSING.
//   • Payment has no payoutStatus. Settlement state is isReleased /
//     releasedAt / commissionSettledAt.
//   • MarkingJobStatus is QUEUED | ASSIGNED | IN_PROGRESS | COMPLETED |
//     CANCELLED | EXPIRED | AWAITING_CONFIRMATION | DISPUTED.
//   • PropertyMarkingJob's requester field is requestedBy, not requestedById.
//   • ShareLink has no isActive column — links can only be deleted, so they
//     are left alone at deactivation (reversible) and deleted at erasure.
//   • Subscription has no cancelAtPeriodEnd — the flag is autoRenew.
//   • MarkingQueueEntry has slotStartedAt, not claimedAt.
// ============================================================
import { prisma } from "@newcondo/db";
import bcrypt from "bcryptjs";
import {
  ACCOUNT_DELETION,
  anonymizeDateFor,
  badRequest,
  conflict,
  forbidden,
  notFound,
  unauthorized,
  publishNotification,
  sendBrandedEmail,
} from "@newcondo/backend-shared";
import {
  accountDeletionScheduledEmail,
  accountDeletionCancelledEmail,
} from "@newcondo/backend-shared";
import {otpService} from "./otpService";

export type DeletionBlocker = {
  /** Stable key so the UI can link to the right place. */
  code:
    | "ACTIVE_TENANCY"
    | "ESCROW_HELD"
    | "PENDING_PAYOUT"
    | "WALLET_BALANCE"
    | "OPEN_DISPUTE"
    | "MARKING_IN_PROGRESS"
    | "MARKING_ASSIGNED"
    | "LISTING_AGENT_DUTY"
    | "SERVICE_JOB_OPEN"
    | "UNPAID_REWARD"
    | "UNPAID_COMMISSION"
    | "REFUND_WINDOW";
  title: string;
  detail: string;
  /** Dashboard route that lets them clear it. */
  fix: string;
  fixLabel: string;
};

export interface DeletionPreview {
  role: "OWNER" | "AGENT" | "RENTER" | "ADMIN";
  canRequest: boolean;
  blockers: DeletionBlocker[];
  summary: {
    properties: number;
    listingsAsAgent: number;
    photos: number;
    documents: number;
    completedRentals: number;
    payments: number;
    referralCredits: number;
  };
  retained: string[];
  graceDays: number;
  retentionMonths: number;
  /** Social-only accounts re-authenticate with an emailed code, not a password. */
  reauth: "PASSWORD" | "OTP";
  /** Whether an OAuth provider is genuinely linked. An account can have no
   *  password WITHOUT being a social account — invite-created renters and
   *  OTP-only signups both land there — so the dialog must not tell someone
   *  they sign in with Facebook when they don't. */
  hasOAuth: boolean;
  existing: { confirmationCode: string; anonymizeAfter: string } | null;
}

/* ============================================================
   SCHEMA-EXACT STATUS SETS
   ============================================================ */
/** A marking job that someone is waiting on. */
const MARKING_ACTIVE = ["ASSIGNED", "IN_PROGRESS", "AWAITING_CONFIRMATION", "DISPUTED"] as const;
/** A dispute that has not reached an outcome. */
const DISPUTE_OPEN = ["PENDING", "UNDER_REVIEW", "INVESTIGATING"] as const;
/** Money in flight: not yet settled, not yet refunded. */
const PAYMENT_IN_FLIGHT = ["PENDING", "HELD"] as const;
/** A vendor job that is still going to happen. */
const SERVICE_JOB_OPEN = ["REQUESTED", "QUOTE_REQUESTED", "SCHEDULED", "RESCHEDULE_REQUESTED", "ACTIVE"] as const;

/* ============================================================
   BLOCKERS — per role

   A blocker is not bureaucracy: every one of these is an obligation to a
   SECOND person. Deleting through it would leave a tenant without a landlord
   of record, an agent unpaid, or a disputant without a counterparty.
   ============================================================ */

/** Disputes, shaped by how this role is a party to one. */
async function openDisputeCount(userId: string, role: string): Promise<number> {
  if (role === "RENTER") {
    return prisma.dispute.count({ where: { renterId: userId, status: { in: [...DISPUTE_OPEN] } } });
  }
  if (role === "OWNER") {
    return prisma.dispute.count({
      where: { status: { in: [...DISPUTE_OPEN] }, rental: { property: { ownerId: userId } } },
    });
  }
  if (role === "AGENT") {
    return prisma.dispute.count({
      where: { status: { in: [...DISPUTE_OPEN] }, rental: { property: { agentId: userId } } },
    });
  }
  return 0;
}

async function commonBlockers(userId: string, role: string): Promise<DeletionBlocker[]> {
  const out: DeletionBlocker[] = [];

  const [openDisputes, inFlight, wallet, owedReward] = await Promise.all([
    openDisputeCount(userId, role),
    prisma.payment.count({ where: { userId, status: { in: [...PAYMENT_IN_FLIGHT] } } }),
    prisma.virtualAccount.aggregate({
      where: { userId, balance: { gt: 0 } },
      _sum: { balance: true },
    }),
    // Referral money we OWE. Service credits and discounts are non-transferable
    // and are simply forfeited (the dialog says so) — but an APPROVED cash or
    // commission reward that hasn't been paid out is a debt, and closing the
    // account would quietly cancel it. Every role can earn these.
    prisma.referralReward.aggregate({
      where: {
        userId,
        status: "APPROVED",
        rewardType: { in: ["CASH_REWARD", "COMMISSION_CREDIT"] },
        isPaidOut: false,
      },
      _sum: { amount: true },
    }),
  ]);

  if (openDisputes > 0) {
    out.push({
      code: "OPEN_DISPUTE",
      title: `${openDisputes} open dispute${openDisputes === 1 ? "" : "s"}`,
      detail:
        "We can't close an account with a dispute in progress — the other party's claim would be left without a counterparty. The dispute has to be resolved first.",
      fix: "/support",
      fixLabel: "View disputes",
    });
  }
  if (inFlight > 0) {
    out.push({
      code: "ESCROW_HELD",
      title: `${inFlight} payment${inFlight === 1 ? "" : "s"} still settling`,
      detail:
        "Money is in the 24-hour confirmation window. Once it settles or is refunded, you can close the account.",
      fix: "/payments",
      fixLabel: "See payments",
    });
  }
  const bal = Number(wallet._sum.balance ?? 0);
  if (bal > 0) {
    out.push({
      code: "WALLET_BALANCE",
      title: `₦${bal.toLocaleString("en-NG")} still in your wallet`,
      detail:
        "Withdraw your balance before closing the account. We can't hold or transfer money for a closed account.",
      fix: "/wallet",
      fixLabel: "Withdraw",
    });
  }
  const owed = Number(owedReward._sum.amount ?? 0);
  if (owed > 0) {
    out.push({
      code: "UNPAID_REWARD",
      title: `₦${owed.toLocaleString("en-NG")} in referral earnings not yet paid out`,
      detail:
        "You've earned referral money that hasn't reached your bank account yet. Closing the account now would cancel it. Once it's paid out, you can delete.",
      fix: "/referrals",
      fixLabel: "See referral earnings",
    });
  }
  return out;
}

async function ownerBlockers(userId: string): Promise<DeletionBlocker[]> {
  const out: DeletionBlocker[] = [];
  const [activeTenancies, markingInFlight, openServiceJobs] = await Promise.all([
    prisma.rental.count({ where: { property: { ownerId: userId }, status: "ACTIVE" } }),
    prisma.propertyMarkingJob.count({
      // requestedBy — not requestedById.
      where: { requestedBy: userId, status: { in: [...MARKING_ACTIVE] } },
    }),
    prisma.serviceJob.count({
      where: { property: { ownerId: userId }, status: { in: [...SERVICE_JOB_OPEN] } },
    }),
  ]);

  if (activeTenancies > 0) {
    out.push({
      code: "ACTIVE_TENANCY",
      title: `${activeTenancies} active tenanc${activeTenancies === 1 ? "y" : "ies"}`,
      detail:
        "Someone is living in your property and paying rent through Newcondo. End or hand over the tenancy first — closing your account would leave your tenant without a landlord of record.",
      fix: "/properties",
      fixLabel: "Manage tenancies",
    });
  }
  if (markingInFlight > 0) {
    out.push({
      code: "MARKING_IN_PROGRESS",
      title: `${markingInFlight} marking job in progress`,
      detail:
        "You've paid an agent to mark a property and the job is still open. Cancel it or let it complete — the agent is owed either the work or the refund.",
      fix: "/marking",
      fixLabel: "View marking jobs",
    });
  }
  if (openServiceJobs > 0) {
    out.push({
      code: "SERVICE_JOB_OPEN",
      title: `${openServiceJobs} service visit${openServiceJobs === 1 ? "" : "s"} booked`,
      detail:
        "A vendor is scheduled to attend your property. Cancel or complete the visit first — we can't send someone to a property with no owner on record.",
      fix: "/services",
      fixLabel: "Manage services",
    });
  }
  return out;
}

async function agentBlockers(userId: string): Promise<DeletionBlocker[]> {
  const out: DeletionBlocker[] = [];
  const [assignedJobs, tenantedListings, owedCommission, unpaidConversions] = await Promise.all([
    prisma.propertyMarkingJob.count({
      where: { assignedAgentId: userId, status: { in: [...MARKING_ACTIVE] } },
    }),
    prisma.rental.count({ where: { property: { agentId: userId }, status: "ACTIVE" } }),
    // Payment has no payoutStatus. A sub-agent is owed when the payment
    // succeeded (or is held) and the split has not been settled yet.
    prisma.payment.count({
      where: {
        subAgentId: userId,
        status: { in: ["SUCCESS", "HELD"] },
        commissionSettledAt: null,
      },
    }),
    // A SECOND, independent check. commissionSettledAt is the idempotency flag
    // on the escrow split; the conversion row carries its own isPaid. If the
    // split ran but the transfer didn't, the first query passes and the agent is
    // still owed money — so both have to be clear.
    prisma.agentReferralConversion.count({
      where: { isPaid: false, referral: { agentId: userId } },
    }),
  ]);

  if (assignedJobs > 0) {
    out.push({
      code: "MARKING_ASSIGNED",
      title: `${assignedJobs} marking job${assignedJobs === 1 ? "" : "s"} assigned to you`,
      detail:
        "An owner is waiting on a mark you accepted, and a slot you hold blocks other agents. Complete or release the job first.",
      fix: "/marking",
      fixLabel: "My marking jobs",
    });
  }
  if (tenantedListings > 0) {
    out.push({
      code: "LISTING_AGENT_DUTY",
      title: `You manage ${tenantedListings} tenanted listing${tenantedListings === 1 ? "" : "s"}`,
      detail:
        "You're the listing agent on a property with a live tenancy. Step down as listing agent — the property and its records stay with the owner — then close your account.",
      fix: "/listings",
      fixLabel: "Step down",
    });
  }
  if (owedCommission > 0) {
    out.push({
      code: "PENDING_PAYOUT",
      title: `${owedCommission} commission payment${owedCommission === 1 ? "" : "s"} not yet settled`,
      detail:
        "Commission you've earned hasn't been split and paid out yet. Once it settles, you can close the account — we can't pay out to a closed account.",
      fix: "/wallet",
      fixLabel: "See payouts",
    });
  }
  if (unpaidConversions > 0) {
    out.push({
      code: "UNPAID_COMMISSION",
      title: `${unpaidConversions} promotion commission${unpaidConversions === 1 ? "" : "s"} unpaid`,
      detail:
        "A property you promoted was rented and your commission hasn't been paid out yet. We can't transfer it to a closed account — wait for the payout, then delete.",
      fix: "/referrals",
      fixLabel: "See commissions",
    });
  }
  return out;
}

async function renterBlockers(userId: string): Promise<DeletionBlocker[]> {
  const out: DeletionBlocker[] = [];
  const [activeRental, refundable] = await Promise.all([
    prisma.rental.count({ where: { renterId: userId, status: { in: ["ACTIVE", "PENDING_CONFIRMATION"] } } }),
    prisma.payment.count({
      where: {
        userId,
        status: "SUCCESS",
        paymentType: { in: ["RENT", "DEPOSIT", "AGENT_COMMISSION"] },
        createdAt: { gt: new Date(Date.now() - 48 * 60 * 60 * 1000) },
      },
    }),
  ]);

  if (activeRental > 0) {
    out.push({
      code: "ACTIVE_TENANCY",
      title: "You have an active tenancy",
      detail:
        "Your rent, receipts and deposit record live in this account, and your landlord's record of the tenancy points at it. End the tenancy first — after that you can close the account and your rent history stays with the landlord, without your name on it.",
      fix: "/dashboard",
      fixLabel: "View tenancy",
    });
  }
  if (refundable > 0) {
    out.push({
      code: "REFUND_WINDOW",
      title: "A payment is still inside its refund window",
      detail:
        "Rent, deposits and commission are refundable within 48 hours of payment (/refund §02). Claim it or let the window close, then delete — we can't refund to a closed account.",
      fix: "/payments",
      fixLabel: "Request refund",
    });
  }
  return out;
}

async function blockersFor(userId: string, role: string): Promise<DeletionBlocker[]> {
  const common = await commonBlockers(userId, role);
  const byRole =
    role === "OWNER"
      ? await ownerBlockers(userId)
      : role === "AGENT"
        ? await agentBlockers(userId)
        : role === "RENTER"
          ? await renterBlockers(userId)
          : [];
  return [...common, ...byRole];
}

/* What survives erasure — said out loud, per role, because "we keep some
   records" without naming them is what makes people distrust a delete flow. */
function retainedFor(role: string): string[] {
  const base = [
    "Payment and payout records, without your name attached — tax, anti-money-laundering and chargeback rules require them.",
    "A record that this account was deleted, and when.",
  ];
  if (role === "OWNER")
    return [
      "Your properties stay in our records as closed listings with their rent and marking history — but your name, contact details and ownership documents are removed from them, and the exact address is generalized.",
      "Tenancy records belonging to people who rented from you, with you shown as a former owner and nothing that identifies you.",
      ...base,
    ];
  if (role === "AGENT")
    return [
      "Marking jobs you completed and commissions you were paid, as anonymous records — the owners you worked for keep their side of that history.",
      "Promotion links you created are switched off, but the commissions they earned stay in our records without your name.",
      "Listings you managed stay with their owners; your name comes off them.",
      ...base,
    ];
  return ["Rent receipts held by your landlord, with your name removed.", ...base];
}

/* ============================================================
   PREVIEW
   ============================================================ */
export async function getDeletionPreview(userId: string): Promise<DeletionPreview> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      passwordHash: true,
      deletedAt: true,
      // Which providers are actually linked — not inferred from the absence of
      // a password.
      accounts: { select: { provider: true } },
      _count: {
        select: { properties: true, agentListings: true, documents: true, payments: true, rentals: true },
      },
    },
  });
  if (!user) throw notFound("Account not found");
  if (user.role === "ADMIN") throw forbidden("Admin accounts are closed by Newcondo, not self-service.");

  const [blockers, photos, credits, existing] = await Promise.all([
    blockersFor(userId, user.role),
    prisma.propertyImage.count({ where: { property: { ownerId: userId } } }),
    // RewardStatus is PENDING | APPROVED | REJECTED | EXPIRED — there is no
    // CREDITED. An unredeemed APPROVED reward is a live credit. Cash and
    // commission rewards are excluded: those are a debt, not a perk, and they
    // BLOCK the request rather than being forfeited (see commonBlockers).
    prisma.referralReward.aggregate({
      where: {
        userId,
        status: "APPROVED",
        isRedeemed: false,
        rewardType: { in: ["SERVICE_CREDIT", "SUBSCRIPTION_DISCOUNT", "RENT_CREDIT", "MAINTENANCE_VOUCHER"] },
      },
      _sum: { amount: true },
    }),
    prisma.accountDeletionRequest.findFirst({
      where: { userId, status: "PENDING" },
      select: { confirmationCode: true, anonymizeAfter: true },
    }),
  ]);

  return {
    role: user.role as DeletionPreview["role"],
    canRequest: blockers.length === 0,
    blockers,
    summary: {
      properties: user._count.properties,
      listingsAsAgent: user._count.agentListings,
      photos,
      documents: user._count.documents,
      completedRentals: user._count.rentals,
      payments: user._count.payments,
      referralCredits: Number(credits._sum.amount ?? 0),
    },
    retained: retainedFor(user.role),
    graceDays: ACCOUNT_DELETION.graceDays,
    retentionMonths: ACCOUNT_DELETION.retentionMonths,
    reauth: user.passwordHash ? "PASSWORD" : "OTP",
    hasOAuth: user.accounts.length > 0,
    existing: existing
      ? { confirmationCode: existing.confirmationCode, anonymizeAfter: existing.anonymizeAfter.toISOString() }
      : null,
  };
}

/* ============================================================
   REQUEST
   ============================================================ */
export interface RequestDeletionInput {
  userId: string;
  password?: string;
  otp?: string;
  reason?: string;
  reasonNote?: string;
  confirmPhrase: string;
  source?: "IN_APP" | "EMAIL" | "META_CALLBACK" | "ADMIN";
  ip?: string;
  userAgent?: string;
}

export async function requestAccountDeletion(input: RequestDeletionInput) {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true, email: true, name: true, role: true, passwordHash: true, deletedAt: true },
  });
  if (!user) throw notFound("Account not found");
  if (user.role === "ADMIN") throw forbidden("Admin accounts are closed by Newcondo, not self-service.");
  if (user.deletedAt) throw conflict("This account is already scheduled for deletion.");

  // Re-authentication. A live session is not enough: deletion is the one action
  // that cannot be undone after the 21-day window, and the commonest way it is
  // abused
  // is an unlocked laptop. Password where there is one; an emailed code where
  // the account is Facebook/Google-only (same rule as the email-change flow).
  if (input.source === "IN_APP" || !input.source) {
    if (user.passwordHash) {
      if (!input.password) throw badRequest("Enter your password to confirm.");
      const ok = await bcrypt.compare(input.password, user.passwordHash);
      if (!ok) throw unauthorized("That password is not correct.");
    } else {
      if (!input.otp) throw badRequest("Enter the code we emailed you.");
      // otpService is a default-exported namespace and verifyOTP is positional
      // (identifier, code, type) returning a boolean — it does not throw.
      const otpOk = await otpService.verifyOTP(user.email, input.otp, "EMAIL_VERIFICATION");
      if (!otpOk) throw unauthorized("That code is not valid or has expired.");
    }
    if (input.confirmPhrase?.trim() !== ACCOUNT_DELETION.confirmPhrase) {
      throw badRequest(`Type ${ACCOUNT_DELETION.confirmPhrase} exactly to confirm.`);
    }
  }

  const blockers = await blockersFor(user.id, user.role);
  if (blockers.length > 0) {
    // Recorded even when refused: a user who asked and was told to settle first
    // has still exercised an NDPA right, and we must be able to show the date
    // and the reason we gave.
    await prisma.accountDeletionRequest.create({
      data: {
        userId: user.id,
        roleAtRequest: user.role,
        status: "BLOCKED",
        source: input.source ?? "IN_APP",
        reason: input.reason,
        reasonNote: input.reasonNote,
        anonymizeAfter: anonymizeDateFor(),
        blockedReason: blockers.map((b) => `${b.code}: ${b.title}`).join(" · "),
        requestIp: input.ip,
        userAgent: input.userAgent,
      },
    });
    throw conflict(blockers[0].detail);
  }

  const now = new Date();
  const anonymizeAfter = anonymizeDateFor(now);

  const snapshot = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      _count: {
        select: {
          properties: true,
          agentListings: true,
          documents: true,
          payments: true,
          rentals: true,
          virtualAccounts: true,
          bankAccounts: true,
          accounts: true,
        },
      },
    },
  });

  // Property photos aren't a User relation — counted separately so the email can
  // say "34 property photos" instead of "your photos".
  const photoCount =
    user.role === "OWNER"
      ? await prisma.propertyImage.count({ where: { property: { ownerId: user.id } } })
      : 0;

  /** What this account actually holds. Drives the email copy so a renter who
   *  never rented is not told about tenancy records that don't exist. */
  const counts = {
    properties: snapshot?._count.properties ?? 0,
    listingsAsAgent: snapshot?._count.agentListings ?? 0,
    documents: snapshot?._count.documents ?? 0,
    payments: snapshot?._count.payments ?? 0,
    rentals: snapshot?._count.rentals ?? 0,
    photos: photoCount,
  };

  const request = await prisma.$transaction(async (tx) => {
    const req = await tx.accountDeletionRequest.create({
      data: {
        userId: user.id,
        roleAtRequest: user.role,
        status: "PENDING",
        source: input.source ?? "IN_APP",
        reason: input.reason,
        reasonNote: input.reasonNote,
        anonymizeAfter,
        snapshot: { ...(snapshot?._count ?? {}), photos: photoCount },
        requestIp: input.ip,
        userAgent: input.userAgent,
      },
    });

    // Deactivate NOW. EVERYTHING in this transaction is reversible by
    // cancelAccountDeletion — nothing is destroyed at day 0.
    await tx.user.update({
      where: { id: user.id },
      data: { deletedAt: now, isAvailableForMarking: false, autoPayoutMode: "OFF" },
    });

    // Kill every way back in except the reactivation path.
    await tx.session.deleteMany({ where: { userId: user.id } });
    await tx.refreshToken.deleteMany({ where: { userId: user.id } });

    // Listings go dark immediately — a renter must not be able to enquire about
    // a property whose owner has left. Nothing is destroyed: status only, and
    // RENTED listings are left alone so a live tenancy keeps its state.
    await tx.property.updateMany({
      where: { ownerId: user.id, status: { not: "RENTED" } },
      data: { status: "UNAVAILABLE", isAvailable: false },
    });

    // Stop the renewal charge. The current period is NOT refunded (/refund §03)
    // and the dialog says so before the user confirms. ShareLink has no
    // isActive column, so promo links are left until erasure — the properties
    // behind them are already UNAVAILABLE.
    await tx.subscription.updateMany({ where: { userId: user.id }, data: { autoRenew: false } });
    await tx.serviceSubscription.updateMany({
      where: { ownerId: user.id, status: "ACTIVE" },
      data: { status: "CANCELLED" },
    });

    // Release any FCFS marking slot the agent holds but has not started, so the
    // next agent in the queue can take it today rather than in two weeks.
    await tx.markingQueueEntry.deleteMany({
      where: { agentId: user.id, slotStartedAt: null, completedAt: null },
    });

    return req;
  });

  // sendBrandedEmail is positional: (to, content).
  await sendBrandedEmail(
    user.email,
    accountDeletionScheduledEmail({
      name: user.name ?? "there",
      role: user.role,
      erasureDate: anonymizeAfter,
      graceDays: ACCOUNT_DELETION.graceDays,
      retentionMonths: ACCOUNT_DELETION.retentionMonths,
      confirmationCode: request.confirmationCode,
      counts,
    })
  ).catch((e) => console.error("[accountDeletion] scheduled email failed", e));

  return {
    status: "PENDING" as const,
    confirmationCode: request.confirmationCode,
    anonymizeAfter: anonymizeAfter.toISOString(),
    graceDays: ACCOUNT_DELETION.graceDays,
  };
}

/* ============================================================
   CANCEL — "reactivate". Only inside the grace window; after erasure there is
   nothing left to restore, and we say that plainly rather than 404-ing.
   ============================================================ */
export async function cancelAccountDeletion(userId: string, cancelledBy = "user") {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, deletedAt: true, anonymizedAt: true },
  });
  if (!user) throw notFound("Account not found");
  if (user.anonymizedAt) {
    throw conflict(
      "This account was permanently erased and can't be restored. You're welcome to create a new one."
    );
  }
  if (!user.deletedAt) throw badRequest("This account isn't scheduled for deletion.");

  await prisma.$transaction([
    prisma.accountDeletionRequest.updateMany({
      where: { userId, status: "PENDING" },
      data: { status: "CANCELLED", cancelledAt: new Date(), cancelledBy },
    }),
    prisma.user.update({ where: { id: userId }, data: { deletedAt: null } }),
    // Auto-renew goes back on only where the subscription is still live; a
    // subscription that lapsed during the window stays lapsed.
    prisma.subscription.updateMany({
      where: { userId, status: { in: ["ACTIVE", "TRIAL", "FREE_ACTIVE", "PAST_DUE"] } },
      data: { autoRenew: true },
    }),
  ]);

  // Listings are NOT auto-republished: they were taken down while the owner was
  // gone, and republishing property that may now be let would be worse than
  // asking them to switch each one back on.
  await sendBrandedEmail(
    user.email,
    accountDeletionCancelledEmail({ name: user.name ?? "there" })
  ).catch(() => {});

  await publishNotification({
    userId,
    // NotificationKind has no "account" channel — account/security events ride
    // on "verify" (the same channel verification-status changes use).
    kind: "verify",
    title: "Welcome back — your account is active again",
    body: "Deletion was cancelled. Your listings are still hidden; switch them back on from My Properties when you're ready.",
    to: "/properties",
  }).catch(() => {});

  return { ok: true as const };
}

/** Public status lookup — powers the Meta data-deletion status URL. Carries no
 *  personal data, because the URL is handed to Facebook and is guessable-ish. */
export async function getDeletionStatusByCode(code: string) {
  const req = await prisma.accountDeletionRequest.findUnique({
    where: { confirmationCode: code },
    select: {
      status: true,
      requestedAt: true,
      anonymizeAfter: true,
      anonymizedAt: true,
      purgeAfter: true,
    },
  });
  if (!req) throw notFound("We couldn't find a deletion request with that code.");
  return {
    status: req.status,
    requestedAt: req.requestedAt.toISOString(),
    erasureDue: req.anonymizeAfter.toISOString(),
    erasedAt: req.anonymizedAt?.toISOString() ?? null,
    finalPurgeDue: req.purgeAfter?.toISOString() ?? null,
  };
}
