// backend/admin-service/src/services/opsService.ts
// Marking oversight, properties (public/hidden, tenants), vendors (status, assigned
// properties, visits). Anything that moves money or re-matches vendors goes through
// the owning service via injected deps — admin-service never duplicates that logic.
import type { Request } from "express";
import { prisma } from "@newcondo/db";
import type { Prisma } from "@newcondo/db";
import { publishNotification, sendBrandedEmail, AdminEmailTemplates, servicesForPlan, notFound, badRequest, conflict, type SubscriptionPlanCode } from "@newcondo/backend-shared";
import { audit } from "../utils/audit";
import { page, skipTake, type ListQuery } from "../utils/paginate";
import type { AdminDeps } from "../routes";

/* ---------------- marking ---------------- */
const JOB_FILTER: Record<string, Prisma.PropertyMarkingJobWhereInput> = {
  new: { method: "NEWCONDO", paymentStatus: "SUCCESS", assignedAgentId: null, status: "QUEUED" },
  live: { status: { in: ["QUEUED", "ASSIGNED", "IN_PROGRESS", "AWAITING_CONFIRMATION"] } },
  unpaid: { paymentStatus: { not: "SUCCESS" }, method: { in: ["BROADCAST", "NEWCONDO"] }, status: { notIn: ["CANCELLED", "EXPIRED"] } },
  disputed: { status: "DISPUTED" },
  done: { status: "COMPLETED" },
};
export async function markingJobs(q: ListQuery) {
  const where: Prisma.PropertyMarkingJobWhereInput = { ...(q.filter ? JOB_FILTER[q.filter] ?? {} : {}), ...(q.q ? { property: { title: { contains: q.q, mode: "insensitive" } } } : {}) };
  const [total, rows] = await Promise.all([
    prisma.propertyMarkingJob.count({ where }),
    prisma.propertyMarkingJob.findMany({ where, ...skipTake(q), orderBy: { createdAt: "desc" }, select: {
      id: true, method: true, markingFee: true, paymentStatus: true, status: true, timeSlotExpiry: true, confirmDeadline: true, disputeReason: true, createdAt: true, completedAt: true,
      contactPersonName: true, contactPersonPhone: true,
      property: { select: { id: true, title: true, city: true, state: true, boundaryVerified: true } },
      requestingUser: { select: { name: true, role: true } }, assignedAgent: { select: { id: true, name: true } },
      queueEntries: { where: { abandonedAt: null, completedAt: null }, select: { id: true } },
    } }),
  ]);
  return page(rows.map((j) => ({
    id: j.id, property: j.property, requester: j.requestingUser, method: j.method, feeNaira: Number(j.markingFee), paid: j.paymentStatus === "SUCCESS",
    status: j.status, marker: j.assignedAgent, queue: j.queueEntries.length, slotEndsAt: j.timeSlotExpiry?.toISOString() ?? null,
    confirmBy: j.confirmDeadline?.toISOString() ?? null, disputeReason: j.disputeReason, contact: `${j.contactPersonName} ${j.contactPersonPhone}`.trim(),
    createdAt: j.createdAt.toISOString(), completedAt: j.completedAt?.toISOString() ?? null,
  })), total, q);
}

export async function assignMarker(req: Request, deps: AdminDeps, jobId: string, markerId: string) {
  const r = await deps.assignFieldMarker(jobId, markerId);
  await audit(prisma, req, { action: "MARKING_ASSIGNED", targetType: "PropertyMarkingJob", targetId: jobId, description: `Field marker ${markerId}${r.previous ? ` (was ${r.previous})` : ""}` });
}

export async function rotateQueue(req: Request, deps: AdminDeps, jobId: string) {
  const job = await prisma.propertyMarkingJob.findUnique({ where: { id: jobId }, select: { method: true, status: true, assignedAgentId: true } });
  if (!job) throw notFound("Job not found");
  if (job.method !== "BROADCAST" || job.status !== "ASSIGNED" || !job.assignedAgentId) throw badRequest("Only a broadcast job with an active slot can be moved on");
  const r = await deps.abandonMarkingSlot(jobId, job.assignedAgentId);
  await publishNotification({ userId: job.assignedAgentId, kind: "marking", title: "Your marking slot was released", body: "NewCondo moved this job to the next marker in the queue.", to: "/marking", entityType: "markingJob", entityId: jobId });
  await audit(prisma, req, { action: "MARKING_QUEUE_ROTATED", targetType: "PropertyMarkingJob", targetId: jobId, description: r.promoted ? "Moved to next marker" : "Queue empty — back to broadcast" });
  return r;
}

export async function resolveMarkingDispute(req: Request, deps: AdminDeps, jobId: string, outcome: "UPHOLD_MARKER" | "REMARK", note?: string) {
  await deps.resolveMarkingDispute(jobId, outcome, note);
  await audit(prisma, req, { action: "MARKING_DISPUTE_RESOLVED", targetType: "PropertyMarkingJob", targetId: jobId, description: `${outcome}${note ? " — " + note : ""}` });
}

export async function allowRemark(req: Request, deps: AdminDeps, propertyId: string) {
  const r = await deps.allowRemark(propertyId);
  await audit(prisma, req, { action: "MARKING_REMARK_ALLOWED", targetType: "Property", targetId: propertyId, description: r.title });
}

/* ---------------- properties ---------------- */
/** Mirrors property-service publicBrowseService exactly — "Public" here means "a renter can find it on Browse". */
export const PUBLIC_WHERE: Prisma.PropertyWhereInput = { status: "PUBLISHED", adminApprovalStatus: "APPROVED", boundaryVerified: true, adminHiddenAt: null, owner: { suspendedAt: null, deletedAt: null } };

function hiddenReasons(p: { status: string; adminApprovalStatus: string; boundaryVerified: boolean; adminHiddenAt: Date | null; adminHiddenReason: string | null; suspendedBySubscription: boolean; offPlanAt: Date | null; owner: { suspendedAt: Date | null } }) {
  const r: string[] = [];
  if (p.adminHiddenAt) r.push(`Hidden by NewCondo${p.adminHiddenReason ? ": " + p.adminHiddenReason : ""}`);
  if (p.owner.suspendedAt) r.push("Owner account is on hold");
  if (p.status === "RENTED") r.push("Rented — off the market");
  else if (p.status === "DRAFT") r.push("Draft — not submitted");
  else if (p.status === "PENDING") r.push("Waiting for admin approval");
  else if (p.status === "UNAVAILABLE") r.push(p.suspendedBySubscription ? "Unpublished — owner’s plan lapsed" : p.offPlanAt ? "Off plan" : "Marked unavailable by the owner");
  if (p.adminApprovalStatus === "REJECTED") r.push("Rejected at review");
  if (!p.boundaryVerified) r.push("Not marked / marking not confirmed");
  return r;
}

export async function properties(q: ListQuery) {
  const F: Record<string, Prisma.PropertyWhereInput> = { public: PUBLIC_WHERE, hidden: { NOT: PUBLIC_WHERE }, review: { status: "PENDING", adminApprovalStatus: "PENDING" }, unmarked: { boundaryVerified: false }, rented: { status: "RENTED" }, adminHidden: { adminHiddenAt: { not: null } } };
  const where: Prisma.PropertyWhereInput = { ...(q.filter ? F[q.filter] ?? {} : {}), ...(q.q ? { OR: [{ title: { contains: q.q, mode: "insensitive" } }, { address: { contains: q.q, mode: "insensitive" } }, { city: { contains: q.q, mode: "insensitive" } }, { owner: { name: { contains: q.q, mode: "insensitive" } } }] } : {}) };
  const [total, rows] = await Promise.all([prisma.property.count({ where }), prisma.property.findMany({ where, ...skipTake(q), orderBy: { createdAt: "desc" }, select: {
    id: true, title: true, city: true, state: true, price: true, totalUnits: true, availableUnits: true, status: true, adminApprovalStatus: true, boundaryVerified: true,
    adminHiddenAt: true, adminHiddenReason: true, suspendedBySubscription: true, offPlanAt: true,
    owner: { select: { id: true, name: true, suspendedAt: true } }, agent: { select: { id: true, name: true } },
  } })]);
  return page(rows.map((p) => { const why = hiddenReasons(p); return { id: p.id, title: p.title, area: `${p.city}, ${p.state}`, owner: { id: p.owner.id, name: p.owner.name }, agent: p.agent, priceNaira: Number(p.price ?? 0), units: p.totalUnits ?? 1, availableUnits: p.availableUnits, marked: p.boundaryVerified, status: p.status, approval: p.adminApprovalStatus, public: why.length === 0, hiddenReasons: why }; }), total, q);
}

export async function propertyDetail(id: string) {
  const p = await prisma.property.findUnique({ where: { id }, select: {
    id: true, title: true, address: true, city: true, state: true, price: true, totalUnits: true, availableUnits: true, structure: true, propertyType: true,
    status: true, adminApprovalStatus: true, rejectionReason: true, boundaryVerified: true, adminHiddenAt: true, adminHiddenReason: true, suspendedBySubscription: true, offPlanAt: true, createdAt: true,
    owner: { select: { id: true, name: true, suspendedAt: true, verificationStatus: true } }, agent: { select: { id: true, name: true } },
    subscriptionLine: { select: { planType: true, status: true } },
    rentals: { where: { status: { in: ["ACTIVE", "PENDING_CONFIRMATION"] } }, orderBy: { startDate: "desc" }, select: {
      id: true, status: true, startDate: true, endDate: true, renterId: true, monthlyRent: true,
      renter: { select: { id: true, name: true } }, unit: { select: { unitNumber: true } },
      // Only the renter's own RENT payment — release creates RENT_RELEASE/AGENT_COMMISSION history rows on the same rental.
      payments: { where: { paymentType: "RENT" }, orderBy: { createdAt: "desc" }, take: 1, select: { id: true, userId: true, status: true, amount: true, confirmationPeriodEnd: true, dispute: { select: { id: true, status: true } } } },
    } },
    vendorAssignments: { where: { status: { in: ["ACTIVE", "PAUSED"] } }, select: { serviceType: true, status: true, vendor: { select: { id: true, name: true } } } },
  } });
  if (!p) throw notFound("Property not found");
  const why = hiddenReasons(p);
  return {
    id: p.id, title: p.title, address: p.address, city: p.city, state: p.state, priceNaira: Number(p.price ?? 0), units: p.totalUnits ?? 1, availableUnits: p.availableUnits,
    status: p.status, approval: p.adminApprovalStatus, rejectionReason: p.rejectionReason, marked: p.boundaryVerified, adminHidden: !!p.adminHiddenAt,
    public: why.length === 0, hiddenReasons: why, createdAt: p.createdAt.toISOString(),
    owner: { id: p.owner.id, name: p.owner.name, verified: p.owner.verificationStatus === "VERIFIED" }, agent: p.agent,
    plan: p.subscriptionLine ? { planType: p.subscriptionLine.planType, status: p.subscriptionLine.status } : null,
    tenants: p.rentals.map((r) => {
      const pay = r.payments[0];
      const payment = !pay ? "NONE" : pay.dispute && !["RESOLVED", "REJECTED", "CANCELLED"].includes(pay.dispute.status) ? "DISPUTED" : pay.status === "HELD" ? "IN_ESCROW" : pay.status;
      return { rentalId: r.id, renter: r.renter, unit: r.unit?.unitNumber ?? null, rentalStatus: r.status, since: r.startDate.toISOString(), until: r.endDate?.toISOString() ?? null, rentNaira: Number(pay?.amount ?? r.monthlyRent), payment, paymentId: pay?.id ?? null, escrowEndsAt: pay?.confirmationPeriodEnd?.toISOString() ?? null };
    }),
    vendors: p.vendorAssignments.map((a) => ({ id: a.vendor.id, name: a.vendor.name, service: a.serviceType, paused: a.status === "PAUSED" })),
  };
}

/** Staff hide/show NEVER touches `status` — hiding a RENTED house used to flip it to UNAVAILABLE and lose the tenancy state. */
export async function setVisibility(req: Request, id: string, makePublic: boolean, reason?: string) {
  const p = await prisma.property.findUnique({ where: { id }, select: { title: true, ownerId: true, agentId: true, adminHiddenAt: true, owner: { select: { email: true, name: true } } } });
  if (!p) throw notFound("Property not found");
  if (makePublic && !p.adminHiddenAt) throw badRequest("NewCondo isn’t hiding this property — it is hidden for the reasons listed, which the owner must fix");
  if (!makePublic && p.adminHiddenAt) throw conflict("Already hidden");
  await prisma.$transaction(async (tx) => {
    await tx.property.update({ where: { id }, data: makePublic ? { adminHiddenAt: null, adminHiddenReason: null, adminHiddenBy: null } : { adminHiddenAt: new Date(), adminHiddenReason: reason ?? null, adminHiddenBy: req.staff!.userId } });
    await audit(tx, req, { action: makePublic ? "LISTING_PUBLISHED" : "LISTING_HIDDEN", targetType: "Property", targetId: id, description: `${p.title}${reason ? " — " + reason : ""}` });
  });
  void sendBrandedEmail(p.owner.email, AdminEmailTemplates.listingHidden({ name: p.owner.name ?? "there", property: p.title, reason: reason ?? null, hidden: !makePublic }));
  for (const uid of [p.ownerId, p.agentId].filter(Boolean) as string[]) await publishNotification({ userId: uid, kind: "marking", title: makePublic ? "Back on Browse" : "Hidden by NewCondo", body: reason ?? p.title, to: `/properties/my-listings/${id}`, entityType: "Property", entityId: id });
}

/* ---------------- vendors ---------------- */
const maskAcct = (n: string | null) => (n ? `••••${n.slice(-4)}` : null);
export async function vendors(q: ListQuery) {
  const F: Record<string, Prisma.VendorWhereInput> = { pending: { status: "PENDING" }, suspended: { status: "SUSPENDED" }, verified: { status: "VERIFIED" }, FUMIGATION: { services: { has: "FUMIGATION" } }, WASTE_MANAGEMENT: { services: { has: "WASTE_MANAGEMENT" } }, INSPECTION: { services: { has: "INSPECTION" } } };
  const where: Prisma.VendorWhereInput = { ...(q.filter ? F[q.filter] ?? {} : {}), ...(q.q ? { OR: [{ name: { contains: q.q, mode: "insensitive" } }, { contactName: { contains: q.q, mode: "insensitive" } }, { areas: { some: { area: { contains: q.q, mode: "insensitive" } } } }] } : {}) };
  const [total, rows] = await Promise.all([prisma.vendor.count({ where }), prisma.vendor.findMany({ where, ...skipTake(q), orderBy: { createdAt: "desc" }, select: {
    id: true, name: true, kind: true, services: true, status: true, rating: true, maxClients: true, contactName: true,
    _count: { select: { assignments: { where: { status: { in: ["ACTIVE", "PAUSED"] } } } } }, areas: { select: { area: true, lga: true } },
  } })]);
  return page(rows.map((v) => ({ id: v.id, name: v.name, kind: v.kind, services: v.services, status: v.status, rating: v.rating, clients: v._count.assignments, capacity: v.maxClients, contact: v.contactName, areas: v.areas.map((a) => a.area || a.lga) })), total, q);
}

export async function vendorDetail(id: string) {
  const v = await prisma.vendor.findUnique({ where: { id }, select: {
    id: true, name: true, kind: true, providerType: true, services: true, status: true, rating: true, maxClients: true, capacityPerDay: true, releaseMode: true,
    contactName: true, phone: true, email: true, cacNumber: true, verifiedAt: true, bankName: true, accountNumber: true, accountName: true, bankVerifiedAt: true, userId: true, createdAt: true,
    user: { select: { suspendedAt: true, devices: { orderBy: { lastSeenAt: "desc" }, take: 1, select: { lastSeenAt: true, deviceLabel: true } } } },
    areas: { select: { id: true, area: true, lga: true, state: true, radiusKm: true } },
    assignments: { where: { status: { in: ["ACTIVE", "PAUSED"] } }, orderBy: { assignedAt: "desc" }, select: { id: true, serviceType: true, status: true, assignedAt: true, distanceKm: true, property: { select: { id: true, title: true, city: true, owner: { select: { name: true } } } } } },
    jobs: { orderBy: { scheduledFor: "desc" }, take: 40, select: { id: true, serviceType: true, status: true, scheduledFor: true, windowEnd: true, verifiedAt: true, cost: true, paidOutAt: true, issueReason: true, property: { select: { id: true, title: true } } } },
    payoutBatches: { orderBy: { createdAt: "desc" }, take: 10, select: { id: true, reference: true, amountKobo: true, jobCount: true, status: true, createdAt: true, settledAt: true } },
  } });
  if (!v) throw notFound("Vendor not found");
  const { accountNumber, user, payoutBatches, ...rest } = v;
  return {
    ...rest, accountMasked: maskAcct(accountNumber), lastSeenAt: user?.devices[0]?.lastSeenAt.toISOString() ?? null, lastDevice: user?.devices[0]?.deviceLabel ?? null,
    jobs: v.jobs.map((j) => ({ ...j, cost: Number(j.cost) })),
    payouts: payoutBatches.map((b) => ({ ...b, amountKobo: String(b.amountKobo) })),
  };
}

export async function setVendorStatus(req: Request, deps: AdminDeps, id: string, status: "VERIFIED" | "SUSPENDED", reason?: string) {
  const v = await prisma.vendor.findUnique({ where: { id }, select: { id: true, name: true, status: true, accountNumber: true, bankVerifiedAt: true, services: true, _count: { select: { areas: true } } } });
  if (!v) throw notFound("Vendor not found");
  if (v.status === status) return;
  if (status === "VERIFIED") {
    // Payouts go straight to the vendor's bank; matching needs a coverage area.
    if (!v.accountNumber || !v.bankVerifiedAt) throw badRequest("The vendor hasn’t verified a payout bank account yet");
    if (!v._count.areas) throw badRequest("The vendor has no service area — they can’t be matched to any property");
    if (!v.services.length) throw badRequest("The vendor hasn’t chosen any service");
    await prisma.vendor.update({ where: { id }, data: { isActive: true } });
    await deps.verifyVendor(id); // sets VERIFIED + verifiedAt + sends the branded email
    await audit(prisma, req, { action: "VENDOR_APPROVED", targetType: "Vendor", targetId: id, description: `${v.name}${v.status === "SUSPENDED" ? " (restored)" : ""}` });
    void deps.reconcileVendorAssignments().catch(() => {});
    return;
  }
  await prisma.vendor.update({ where: { id }, data: { status: "SUSPENDED", isActive: false } });
  const r = await deps.endVendorAssignments(id, "VENDOR_SUSPENDED"); // frees activeKey + re-matches each property
  for (const pid of r.properties) await deps.replanProperty(pid, "Vendor suspended").catch(() => {});
  await audit(prisma, req, { action: "VENDOR_SUSPENDED", targetType: "Vendor", targetId: id, description: `${v.name} — ${reason}`, metadata: { propertiesRematched: r.properties.length } });
}

/** Properties a vendor could be assigned to: marked, on an active plan whose services overlap the vendor's. */
export async function eligibleProperties(vendorId: string, q?: string) {
  const v = await prisma.vendor.findUnique({ where: { id: vendorId }, select: { services: true } });
  if (!v) throw notFound("Vendor not found");
  const rows = await prisma.property.findMany({
    where: { boundaryVerified: true, subscriptionLine: { status: "ACTIVE" }, suspendedBySubscription: false, offPlanAt: null, ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { city: { contains: q, mode: "insensitive" } }, { address: { contains: q, mode: "insensitive" } }] } : {}) },
    take: 30, orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, city: true, owner: { select: { name: true } }, subscriptionLine: { select: { planType: true } }, vendorAssignments: { where: { status: { in: ["ACTIVE", "PAUSED"] } }, select: { serviceType: true, vendorId: true, vendor: { select: { name: true } } } } },
  });
  return rows.map((p) => {
    const covered = servicesForPlan(p.subscriptionLine!.planType as SubscriptionPlanCode).filter((s) => v.services.includes(s));
    const current = p.vendorAssignments.filter((a) => covered.includes(a.serviceType as never));
    return { id: p.id, title: p.title, city: p.city, owner: p.owner.name, services: covered, alreadyMine: current.some((a) => a.vendorId === vendorId), movesFrom: [...new Set(current.filter((a) => a.vendorId !== vendorId).map((a) => a.vendor.name))] };
  }).filter((p) => p.services.length > 0 && !p.alreadyMine);
}

export async function assignProperties(req: Request, deps: AdminDeps, vendorId: string, propertyIds: string[]) {
  const done: string[] = []; const failed: { propertyId: string; message: string }[] = [];
  for (const pid of [...new Set(propertyIds)]) {
    try {
      const r = await deps.adminAssignVendor(pid, vendorId);
      await deps.replanProperty(pid, "Vendor reassigned by NewCondo");
      done.push(pid);
      await audit(prisma, req, { action: "VENDOR_PROPERTY_ASSIGNED", targetType: "Vendor", targetId: vendorId, description: `${pid} · ${r.services.join(", ")}`, metadata: { movedFrom: r.moved } });
    } catch (e) { failed.push({ propertyId: pid, message: (e as Error).message }); }
  }
  return { assigned: done.length, failed };
}

export async function removeProperty(req: Request, deps: AdminDeps, vendorId: string, propertyId: string) {
  const r = await deps.adminRemoveVendor(propertyId, vendorId);
  await deps.replanProperty(propertyId, "Vendor removed by NewCondo");
  await audit(prisma, req, { action: "VENDOR_PROPERTY_REMOVED", targetType: "Vendor", targetId: vendorId, description: propertyId, metadata: { rematched: r.assigned, unmatched: r.unmatched } });
  return { rematched: r.assigned, unmatched: r.unmatched };
}

export async function rebookVisit(req: Request, deps: AdminDeps, jobId: string, reason: string) {
  const r = await deps.adminRebookVisit(jobId, reason);
  await audit(prisma, req, { action: "VISIT_REBOOKED", targetType: "ServiceJob", targetId: jobId, description: reason });
  return r;
}

/** Owner reported a problem with a visit (ServiceJob ISSUE). */
export async function visitIssues(q: ListQuery) {
  const where: Prisma.ServiceJobWhereInput = { status: { in: ["ISSUE", "MISSED"] } };
  const [total, rows] = await Promise.all([prisma.serviceJob.count({ where }), prisma.serviceJob.findMany({ where, ...skipTake(q), orderBy: { updatedAt: "desc" }, select: {
    id: true, serviceType: true, status: true, scheduledFor: true, issueReason: true, verifiedAt: true, updatedAt: true,
    property: { select: { id: true, title: true, owner: { select: { name: true } } } }, vendor: { select: { id: true, name: true } },
  } })]);
  return page(rows, total, q);
}

export async function resolveVisitIssue(req: Request, deps: AdminDeps, jobId: string, outcome: "REBOOK" | "CLOSE_VERIFIED", note?: string) {
  const j = await prisma.serviceJob.findUnique({ where: { id: jobId }, select: { status: true, verifiedAt: true, property: { select: { ownerId: true, title: true } } } });
  if (!j) throw notFound("Visit not found");
  if (!["ISSUE", "MISSED"].includes(j.status)) throw conflict("This visit has no open issue");
  if (outcome === "CLOSE_VERIFIED") {
    // A visit only counts as done if the on-site code was verified — that is what paid the vendor. No code, no closing.
    if (!j.verifiedAt) throw badRequest("The visit code was never verified, so the visit can’t be confirmed — rebook it instead");
    await prisma.serviceJob.update({ where: { id: jobId }, data: { status: "COMPLETED", notes: note ? `Issue closed by NewCondo: ${note}`.slice(0, 500) : undefined } });
    await publishNotification({ userId: j.property.ownerId, kind: "service", title: "Visit issue closed", body: `${j.property.title}: the visit code was verified on site.${note ? " " + note : ""}`, to: "/services", entityType: "serviceJob", entityId: jobId });
  } else {
    await deps.adminRebookVisit(jobId, note ?? "Issue reported by owner");
  }
  await audit(prisma, req, { action: "VISIT_ISSUE_RESOLVED", targetType: "ServiceJob", targetId: jobId, description: `${outcome}${note ? " — " + note : ""}` });
}
