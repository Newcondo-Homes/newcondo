// backend/admin-service/src/services/overviewService.ts — home counts + the audit log reader.
import { prisma } from "@newcondo/db";
import type { Prisma } from "@newcondo/db";
import type { AdminScope } from "@newcondo/backend-shared";
import { page, skipTake, type ListQuery } from "../utils/paginate";

const ID_TYPES = ["NIN", "BVN", "PASSPORT", "VOTERS_CARD", "DRIVERS_LICENSE", "SELFIE"] as const;
const OPEN_DISPUTE = ["PENDING", "UNDER_REVIEW", "INVESTIGATING"] as const;

/** Only counts the caller may see — the UI never learns about queues it can't open (null = no access). */
export async function overview(scopes: AdminScope[]) {
  const has = (s: AdminScope) => scopes.includes(s);
  const dayStart = new Date(`${new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" })}T00:00:00+01:00`);
  const since30 = new Date(Date.now() - 30 * 86_400_000);
  const n = <T,>(ok: boolean, p: () => Promise<T>) => (ok ? p() : Promise.resolve(null));
  const [identity, listings, newMarking, markingDisputes, rentDisputes, visitIssues, failedWithdrawals, failedBatches, holds, pendingVendors, openTickets, escrow, visitsToday] = await Promise.all([
    n(has("verification.review"), () => prisma.user.count({ where: { verificationStatus: "PENDING", deletedAt: null, documents: { some: { status: "PENDING", documentType: { in: [...ID_TYPES] } } } } })),
    n(has("listings.review"), () => prisma.property.count({ where: { status: "PENDING", adminApprovalStatus: "PENDING" } })),
    n(has("marking.read"), () => prisma.propertyMarkingJob.count({ where: { method: "NEWCONDO", paymentStatus: "SUCCESS", assignedAgentId: null, status: "QUEUED" } })),
    n(has("marking.read"), () => prisma.propertyMarkingJob.count({ where: { status: "DISPUTED" } })),
    n(has("disputes.manage") || has("support.tickets"), () => prisma.dispute.count({ where: { status: { in: [...OPEN_DISPUTE] } } })),
    n(has("vendors.read"), () => prisma.serviceJob.count({ where: { status: "ISSUE" } })),
    n(has("payments.read"), () => prisma.payment.count({ where: { paymentType: "WITHDRAWAL", status: "FAILED", createdAt: { gte: since30 } } })),
    n(has("payments.read"), () => prisma.vendorPayoutBatch.count({ where: { status: "FAILED", createdAt: { gte: since30 } } })),
    n(has("referrals.read"), () => prisma.referral.count({ where: { fraudHold: true, status: { not: "VOID" } } })),
    n(has("vendors.read"), () => prisma.vendor.count({ where: { status: "PENDING" } })),
    n(has("support.tickets"), () => prisma.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } })),
    n(has("payments.read"), () => prisma.payment.aggregate({ where: { paymentType: "RENT", status: "HELD" }, _sum: { amount: true }, _count: true })),
    n(has("vendors.read"), () => prisma.serviceJob.count({ where: { scheduledFor: { gte: dayStart, lt: new Date(dayStart.getTime() + 86_400_000) }, status: { notIn: ["CANCELLED"] } } })),
  ]);
  return {
    queues: { identity, listings, newMarking, markingDisputes, openDisputes: rentDisputes, visitIssues, failedTransfers: failedWithdrawals == null ? null : failedWithdrawals + (failedBatches ?? 0), referralHolds: holds, pendingVendors, openTickets },
    escrow: escrow ? { naira: Number(escrow._sum.amount ?? 0), count: escrow._count } : null,
    vendorVisitsToday: visitsToday,
  };
}

export async function auditLog(q: ListQuery) {
  const F: Record<string, Prisma.AdminActionWhereInput> = {
    impersonation: { action: { in: ["IMPERSONATION_STARTED", "IMPERSONATION_ENDED", "IMPERSONATED_ACTION"] } },
    money: { action: { in: ["RENT_RELEASED", "PAYMENT_REFUNDED", "DISPUTE_RESOLVED", "MARKING_DISPUTE_RESOLVED", "REFERRAL_VOIDED", "REFERRAL_HOLD_CLEARED"] } },
    staff: { action: { in: ["STAFF_INVITED", "STAFF_INVITE_REVOKED", "STAFF_ACTIVATED", "STAFF_FROZEN", "STAFF_UNFROZEN", "STAFF_SCOPES_CHANGED"] } },
    accounts: { action: { in: ["USER_VERIFIED", "USER_REJECTED", "USER_UPDATED", "USER_SUSPENDED", "USER_RESTORED", "SESSIONS_REVOKED", "VERIFICATION_REVOKED"] } },
  };
  const where: Prisma.AdminActionWhereInput = { ...(q.filter ? F[q.filter] ?? {} : {}), ...(q.q ? { OR: [{ description: { contains: q.q, mode: "insensitive" } }, { targetId: { contains: q.q } }, { admin: { name: { contains: q.q, mode: "insensitive" } } }] } : {}) };
  const [total, rows] = await Promise.all([prisma.adminAction.count({ where }), prisma.adminAction.findMany({ where, ...skipTake(q), orderBy: { createdAt: "desc" }, select: { id: true, action: true, targetType: true, targetId: true, description: true, createdAt: true, admin: { select: { name: true, email: true } } } })]);
  return page(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })), total, q);
}
